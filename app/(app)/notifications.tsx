import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  createNotification,
  deactivateNotification,
  listNotificationsForUser,
  markAllRead,
  markNotificationRead,
  type AppNotification,
  type NotificationAudience,
  type NotificationPriority,
} from '@/services/notifications';

const AUDIENCES: { key: NotificationAudience; label: string }[] = [
  { key: 'ALL', label: 'All staff' },
  { key: 'salesperson', label: 'Sellers only' },
  { key: 'admin', label: 'Admins' },
  { key: 'accountant', label: 'Accounts' },
];

const PRIORITIES: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

function priorityColor(p: string) {
  const u = p.toUpperCase();
  if (u === 'URGENT') return colors.danger;
  if (u === 'HIGH') return colors.muga;
  if (u === 'LOW') return colors.muted;
  return colors.royal;
}

export default function NotificationsScreen() {
  const { profile, roles, isAdmin, hasPermission } = useAuth();
  const canPost =
    isAdmin ||
    hasPermission('users.manage') ||
    hasPermission('rbac.manage') ||
    hasPermission('notifications.manage');

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('ALL');
  const [priority, setPriority] = useState<NotificationPriority>('NORMAL');

  const load = useCallback(async () => {
    if (!profile?.user_id) return;
    setError(null);
    try {
      const rows = await listNotificationsForUser({
        userId: profile.user_id,
        roles: roles.length ? roles : ['salesperson'],
        includeInactive: canPost,
      });
      setItems(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load board';
      if (/relation .* does not exist|Could not find the table/i.test(msg)) {
        setError(
          'Run supabase/notifications_board.sql in Supabase SQL Editor, then reload.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [canPost, profile?.user_id, roles]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const unread = items.filter((n) => n.is_active !== false && !n.read).length;

  return (
    <Screen
      title="জাননী বোৰ্ড"
      loading={loading}
      onRefresh={() => {
        setLoading(true);
        load();
      }}
      refreshing={loading}
    >
      <Text className="mb-3 text-xs text-slate-500">
        {brand.nameAs} notice board · sellers & all staff
      </Text>

      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 flex-row flex-wrap gap-2">
        {unread > 0 ? (
          <Pressable
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: colors.maroon }}
            onPress={async () => {
              if (!profile?.user_id) return;
              try {
                await markAllRead(profile.user_id, roles);
                setOk('All marked read');
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Mark read failed');
              }
            }}
          >
            <Text className="text-xs font-bold text-white">
              Mark all read ({unread})
            </Text>
          </Pressable>
        ) : null}
        {canPost ? (
          <Pressable
            className="rounded-xl bg-white px-3 py-2"
            onPress={() => setCompose((v) => !v)}
          >
            <Text className="text-xs font-bold text-maroon">
              {compose ? 'Close compose' : 'Post notice'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {compose && canPost ? (
        <View className="mb-4 rounded-2xl bg-white p-4">
          <Text className="mb-2 text-sm font-bold text-maroon">New notice</Text>
          <Input label="Title" value={title} onChangeText={setTitle} />
          <Input label="Message" value={body} onChangeText={setBody} />

          <Text className="mb-2 text-sm font-medium text-slate-600">Audience</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => setAudience(a.key)}
                className="rounded-full px-3 py-2"
                style={{
                  backgroundColor: audience === a.key ? colors.royal : '#F1F5F9',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: audience === a.key ? '#fff' : colors.muted }}
                >
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-slate-600">Priority</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                className="rounded-full px-3 py-2"
                style={{
                  backgroundColor: priority === p ? priorityColor(p) : '#F1F5F9',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: priority === p ? '#fff' : colors.muted }}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label="Publish to board"
            loading={saving}
            onPress={async () => {
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                if (!title.trim() || !body.trim()) {
                  throw new Error('Title and message required');
                }
                await createNotification({
                  title,
                  body,
                  audience,
                  priority,
                  created_by: profile?.user_id,
                });
                setTitle('');
                setBody('');
                setCompose(false);
                setOk('Notice published');
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Publish failed');
              } finally {
                setSaving(false);
              }
            }}
          />
        </View>
      ) : null}

      {items.length === 0 ? (
        <Text className="text-slate-500">
          No notices yet. Admins can post for sellers and all staff.
        </Text>
      ) : (
        items.map((n) => {
          const unreadItem = n.is_active !== false && !n.read;
          return (
            <Pressable
              key={n.notification_id}
              className="mb-3 rounded-2xl bg-white p-4"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: priorityColor(n.priority),
                opacity: n.is_active === false ? 0.55 : 1,
              }}
              onPress={async () => {
                if (!profile?.user_id) return;
                try {
                  if (!n.read) {
                    await markNotificationRead(n.notification_id, profile.user_id);
                    await load();
                  }
                  if (n.link_href) router.push(n.link_href as any);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Open failed');
                }
              }}
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-base font-bold text-ink">{n.title}</Text>
                {unreadItem ? (
                  <View className="rounded-full bg-maroon px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-white">NEW</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-sm text-slate-600">{n.body}</Text>
              <Text className="mt-2 text-[11px] text-slate-400">
                {n.priority} · {n.audience} · {new Date(n.created_at).toLocaleString()}
                {n.is_active === false ? ' · INACTIVE' : ''}
              </Text>
              {canPost ? (
                <Pressable
                  className="mt-2 self-start rounded-lg bg-red-50 px-3 py-2"
                  onPress={() => {
                    Alert.alert('Remove notice?', n.title, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deactivateNotification(n.notification_id);
                            setOk('Notice removed');
                            await load();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Remove failed');
                          }
                        },
                      },
                    ]);
                  }}
                >
                  <Text className="text-xs font-bold text-red-700">Deactivate</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
