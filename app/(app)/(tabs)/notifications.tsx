import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Pressable, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import {
  Bell,
  CheckCheck,
  Megaphone,
  PlusCircle,
  Radio,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { Toast } from '@/components/ui/Toast';
import { brand } from '@/constants/brand';
import { NOTICE_PRESETS } from '@/constants/notificationPresets';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { listUsers } from '@/services/rbac';
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
import {
  ensureLocalNotificationPermission,
  markSeenUpTo,
  rememberNoticeIdentity,
  syncNoticesInBackground,
} from '@/services/notificationSync';
import { registerNoticeBackgroundTask } from '@/services/backgroundNotices';

type Mode = 'inbox' | 'compose';

function priorityColor(p: string) {
  const u = p.toUpperCase();
  if (u === 'URGENT') return colors.danger;
  if (u === 'HIGH') return colors.muga;
  if (u === 'LOW') return colors.muted;
  return colors.royal;
}

export default function NotificationsScreen() {
  const { profile, roles, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const canPost =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('notifications.manage');

  const [mode, setMode] = useState<Mode>('inbox');
  const [items, setItems] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState('custom');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('ALL');
  const [priority, setPriority] = useState<NotificationPriority>('NORMAL');

  const load = useCallback(async () => {
    if (!profile?.user_id) return;
    setError(null);
    try {
      await rememberNoticeIdentity(profile.user_id, roles);
      const rows = await listNotificationsForUser({
        userId: profile.user_id,
        roles: roles.length ? roles : ['salesperson'],
        includeInactive: canPost,
      });
      setItems(rows);
      if (rows[0]) await markSeenUpTo(Number(rows[0].notification_id));
      if (canPost) {
        const u = await listUsers().catch(() => []);
        setUsers(u.filter((x: any) => (x.status ?? 'ACTIVE') === 'ACTIVE'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load board';
      setError(msg);
      setItems([]);
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

  useEffect(() => {
    ensureLocalNotificationPermission().catch(() => undefined);
    registerNoticeBackgroundTask().catch(() => undefined);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncNoticesInBackground().then(() => load()).catch(() => undefined);
      }
    });

    // Soft poll while app open (free — no paid push)
    const timer = setInterval(() => {
      syncNoticesInBackground().then((r) => {
        if (r === 'new') load();
      });
    }, 60_000);

    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [load]);

  const applyPreset = (key: string) => {
    setPresetKey(key);
    const p = NOTICE_PRESETS.find((x) => x.key === key);
    if (!p) return;
    if (key !== 'custom') {
      setTitle(p.title);
      setBody(p.body);
      setPriority(p.priority);
      setAudience(p.audience);
      if (p.audience !== 'USERS') setSelectedUsers([]);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
      <Text className="mb-2 text-xs text-slate-500">
        {brand.nameAs} · free in-app + background local alerts (no paid push)
      </Text>

      <Toast message={error} />
      <Toast message={ok} type="success" />

      {error && /SMOKE_FIX_ALL|Notice board tables missing|schema cache|does not exist/i.test(error) ? (
        <View className="mb-4 rounded-2xl bg-amber-50 p-4" style={{ borderWidth: 1, borderColor: '#F59E0B' }}>
          <Text className="text-base font-bold text-maroon">Setup needed (1 minute)</Text>
          <Text className="mt-2 text-sm text-slate-700">
            Notice tables are not in Supabase yet. Open Supabase → SQL Editor → paste and Run:
          </Text>
          <Text className="mt-2 font-mono text-xs text-ink">supabase/SMOKE_FIX_ALL.sql</Text>
          <Text className="mt-2 text-xs text-slate-500">
            Then pull to refresh this screen. Other modules work; only the board needs this SQL.
          </Text>
        </View>
      ) : null}

      {canPost ? (
        <SegmentStrip
          value={mode}
          onChange={setMode}
          equal
          items={[
            { key: 'inbox', label: 'Inbox', icon: Bell },
            { key: 'compose', label: 'Send notice', icon: Megaphone },
          ]}
        />
      ) : null}

      {mode === 'compose' && canPost ? (
        <View className="mb-4 rounded-2xl bg-white p-4">
          <Text className="mb-2 text-sm font-bold text-maroon">Preset or custom</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {NOTICE_PRESETS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => applyPreset(p.key)}
                className="min-h-[44px] justify-center rounded-xl px-3 py-2"
                style={{
                  backgroundColor: presetKey === p.key ? colors.maroon : '#F1F5F9',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: presetKey === p.key ? '#fff' : colors.ink }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-slate-600">Who receives?</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {(
              [
                ['ALL', 'Broadcast all', Radio],
                ['salesperson', 'Sellers', UserRound],
                ['admin', 'Admins', UserRound],
                ['USERS', 'Specific people', UserRound],
              ] as const
            ).map(([key, label, Icon]) => (
              <Pressable
                key={key}
                onPress={() => setAudience(key)}
                className="min-h-[48px] flex-row items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: audience === key ? colors.royal : '#F1F5F9',
                }}
              >
                <Icon color={audience === key ? '#fff' : colors.muted} size={18} />
                <Text
                  className="text-xs font-bold"
                  style={{ color: audience === key ? '#fff' : colors.ink }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {audience === 'USERS' ? (
            <View className="mb-3">
              <Text className="mb-2 text-sm font-medium text-slate-600">
                Tap users to select
              </Text>
              {users.map((u) => {
                const id = String(u.user_id);
                const on = selectedUsers.includes(id);
                return (
                  <Pressable
                    key={id}
                    onPress={() => toggleUser(id)}
                    className="mb-2 min-h-[52px] flex-row items-center rounded-xl px-3"
                    style={{ backgroundColor: on ? '#D1FAE5' : '#F8FAFC' }}
                  >
                    <Text className="font-semibold text-ink">
                      {on ? '✓ ' : '○ '}
                      {u.full_name}
                    </Text>
                    <Text className="ml-2 text-xs text-slate-500">{u.phone}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text className="mb-2 text-sm font-medium text-slate-600">Priority</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as NotificationPriority[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                className="min-h-[44px] justify-center rounded-full px-3 py-2"
                style={{
                  backgroundColor: priority === p ? priorityColor(p) : '#F1F5F9',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: priority === p ? '#fff' : colors.muted }}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input label="Title" value={title} onChangeText={setTitle} icon={Bell} />
          <Input label="Message" value={body} onChangeText={setBody} icon={Megaphone} />

          <Button
            icon={PlusCircle}
            label={audience === 'ALL' ? 'Broadcast to all' : 'Send notice'}
            loading={saving}
            onPress={async () => {
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                if (!title.trim() || !body.trim()) {
                  throw new Error('Title and message required');
                }
                if (audience === 'USERS' && !selectedUsers.length) {
                  throw new Error('Select at least one user');
                }
                await createNotification({
                  title,
                  body,
                  audience,
                  priority,
                  target_user_ids: audience === 'USERS' ? selectedUsers : [],
                  template_key: presetKey === 'custom' ? null : presetKey,
                  created_by: profile?.user_id,
                  send_local_alert: true,
                });
                setOk('Notice sent · receivers get board + local alert');
                setTitle('');
                setBody('');
                setSelectedUsers([]);
                setPresetKey('custom');
                setMode('inbox');
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Send failed');
              } finally {
                setSaving(false);
              }
            }}
          />
        </View>
      ) : null}

      {mode === 'inbox' ? (
        <View>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {unread > 0 ? (
              <Pressable
                className="min-h-[48px] flex-row items-center gap-2 rounded-xl px-3"
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
                <CheckCheck color="#fff" size={18} />
                <Text className="text-xs font-bold text-white">
                  Mark all read ({unread})
                </Text>
              </Pressable>
            ) : null}
          </View>

          {items.length === 0 ? (
            <Text className="text-slate-500">
              No notices yet. Admin / Super Admin can broadcast or target users.
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
                    {n.priority} · {n.audience}
                    {n.template_key ? ` · ${n.template_key}` : ''} ·{' '}
                    {new Date(n.created_at).toLocaleString()}
                  </Text>
                  {canPost ? (
                    <Pressable
                      className="mt-2 min-h-[44px] flex-row items-center gap-2 self-start rounded-lg bg-red-50 px-3"
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
                      <Trash2 color="#B91C1C" size={16} />
                      <Text className="text-xs font-bold text-red-700">Deactivate</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </Screen>
  );
}
