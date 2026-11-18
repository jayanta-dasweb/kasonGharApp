import { supabase } from '@/lib/supabase';

export type NotificationAudience =
  | 'ALL'
  | 'salesperson'
  | 'admin'
  | 'accountant'
  | 'super_admin'
  | string;

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AppNotification = {
  notification_id: number;
  title: string;
  body: string;
  audience: string;
  priority: string;
  link_href: string | null;
  created_by: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  read?: boolean;
};

function stillValid(n: { expires_at?: string | null; is_active?: boolean }) {
  if (n.is_active === false) return false;
  if (!n.expires_at) return true;
  return new Date(n.expires_at).getTime() >= Date.now();
}

function matchesAudience(audience: string, roles: string[]) {
  const a = (audience || 'ALL').toLowerCase();
  if (a === 'all') return true;
  return roles.some((r) => r.toLowerCase() === a);
}

export async function listNotificationsForUser(input: {
  userId: string;
  roles: string[];
  includeInactive?: boolean;
}) {
  const { data, error } = await supabase
    .from('app_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []).filter((n: any) => {
    if (!input.includeInactive && !stillValid(n)) return false;
    return matchesAudience(n.audience, input.roles);
  });

  const ids = rows.map((r: any) => r.notification_id);
  let readSet = new Set<number>();
  if (ids.length) {
    const { data: reads } = await supabase
      .from('app_notification_reads')
      .select('notification_id')
      .eq('user_id', input.userId)
      .in('notification_id', ids);
    readSet = new Set((reads ?? []).map((r: any) => Number(r.notification_id)));
  }

  return rows.map((r: any) => ({
    ...r,
    read: readSet.has(Number(r.notification_id)),
  })) as AppNotification[];
}

export async function countUnread(input: { userId: string; roles: string[] }) {
  const list = await listNotificationsForUser(input);
  return list.filter((n) => !n.read).length;
}

export async function markNotificationRead(notificationId: number, userId: string) {
  const { error } = await supabase.from('app_notification_reads').upsert(
    {
      notification_id: notificationId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'notification_id,user_id' }
  );
  if (error) throw error;
}

export async function markAllRead(userId: string, roles: string[]) {
  const list = await listNotificationsForUser({ userId, roles });
  const unread = list.filter((n) => !n.read);
  if (!unread.length) return;
  const rows = unread.map((n) => ({
    notification_id: n.notification_id,
    user_id: userId,
    read_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('app_notification_reads').upsert(rows, {
    onConflict: 'notification_id,user_id',
  });
  if (error) throw error;
}

export async function createNotification(input: {
  title: string;
  body: string;
  audience: NotificationAudience;
  priority?: NotificationPriority;
  link_href?: string | null;
  created_by?: string | null;
  expires_at?: string | null;
}) {
  const payload = {
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience || 'ALL',
    priority: input.priority ?? 'NORMAL',
    link_href: input.link_href?.trim() || null,
    created_by: input.created_by ?? null,
    expires_at: input.expires_at || null,
    is_active: true,
  };
  const { data, error } = await supabase
    .from('app_notifications')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AppNotification;
}

export async function deactivateNotification(notificationId: number) {
  const { data, error } = await supabase
    .from('app_notifications')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNotification(notificationId: number) {
  const { error } = await supabase
    .from('app_notifications')
    .delete()
    .eq('notification_id', notificationId);
  if (error) {
    // soft fallback
    await deactivateNotification(notificationId);
  }
}
