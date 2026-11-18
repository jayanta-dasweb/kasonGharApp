import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const LAST_SEEN_KEY = 'kg_notice_last_seen_id';
const USER_ID_KEY = 'kg_notice_user_id';
const ROLES_KEY = 'kg_notice_roles';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function rememberNoticeIdentity(userId: string, roles: string[]) {
  await AsyncStorage.multiSet([
    [USER_ID_KEY, userId],
    [ROLES_KEY, JSON.stringify(roles)],
  ]);
}

export async function ensureLocalNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function showLocalAlert(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { source: 'kason-notice-board' },
      },
      trigger: null, // immediate local (free — no paid push)
    });
  } catch (e) {
    console.warn('[notice] local alert failed', e);
  }
}

/**
 * Free background sync: pull new notices from Supabase and fire local alerts.
 * No Expo Push / FCM subscription required.
 */
export async function syncNoticesInBackground(): Promise<'new' | 'none' | 'fail'> {
  try {
    const pairs = await AsyncStorage.multiGet([LAST_SEEN_KEY, USER_ID_KEY, ROLES_KEY]);
    const lastSeen = Number(pairs[0][1] ?? 0);
    const userId = pairs[1][1];
    const roles = JSON.parse(pairs[2][1] ?? '[]') as string[];
    if (!userId) return 'none';

    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('is_active', true)
      .order('notification_id', { ascending: false })
      .limit(30);
    if (error) throw error;

    const fresh = (data ?? []).filter((n: any) => {
      const id = Number(n.notification_id);
      if (id <= lastSeen) return false;
      const audience = String(n.audience ?? 'ALL').toUpperCase();
      if (audience === 'ALL') return true;
      if (audience === 'USERS') {
        const targets = Array.isArray(n.target_user_ids) ? n.target_user_ids : [];
        return targets.map(String).includes(String(userId));
      }
      return roles.map((r) => r.toLowerCase()).includes(audience.toLowerCase());
    });

    if (!fresh.length) return 'none';

    // Alert for newest first (max 3 to avoid spam)
    for (const n of fresh.slice(0, 3).reverse()) {
      if (n.send_local_alert === false) continue;
      await showLocalAlert(String(n.title), String(n.body));
    }

    const maxId = Math.max(...fresh.map((n: any) => Number(n.notification_id)), lastSeen);
    await AsyncStorage.setItem(LAST_SEEN_KEY, String(maxId));
    return 'new';
  } catch (e) {
    console.warn('[notice] background sync failed', e);
    return 'fail';
  }
}

export async function markSeenUpTo(notificationId: number) {
  const prev = Number((await AsyncStorage.getItem(LAST_SEEN_KEY)) ?? 0);
  if (notificationId > prev) {
    await AsyncStorage.setItem(LAST_SEEN_KEY, String(notificationId));
  }
}
