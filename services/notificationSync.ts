import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const LAST_SEEN_KEY = 'kg_notice_last_seen_id';
const USER_ID_KEY = 'kg_notice_user_id';
const ROLES_KEY = 'kg_notice_roles';

type NotificationsModule = typeof import('expo-notifications');

let notificationsMod: NotificationsModule | null | undefined;

/** Lazy-load; Expo Go may not include ExpoApplication / notifications native code. */
async function getNotifications(): Promise<NotificationsModule | null> {
  if (notificationsMod !== undefined) return notificationsMod;
  if (Platform.OS === 'web') {
    notificationsMod = null;
    return null;
  }
  try {
    const mod = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationsMod = mod;
    return mod;
  } catch (e) {
    console.warn('[notice] expo-notifications unavailable (Expo Go / missing native)', e);
    notificationsMod = null;
    return null;
  }
}

export async function rememberNoticeIdentity(userId: string, roles: string[]) {
  await AsyncStorage.multiSet([
    [USER_ID_KEY, userId],
    [ROLES_KEY, JSON.stringify(roles)],
  ]);
}

export async function ensureLocalNotificationPermission() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function showLocalAlert(title: string, body: string) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { source: 'kason-notice-board' },
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[notice] local alert failed', e);
  }
}

/**
 * Free sync: pull new notices from Supabase.
 * Local tray alerts only when native notifications module exists.
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
