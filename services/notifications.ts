import { supabase } from '@/lib/supabase';

export type NotificationAudience =
  | 'ALL'
  | 'USERS'
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
  target_user_ids?: string[] | null;
  template_key?: string | null;
  send_local_alert?: boolean | null;
  read?: boolean;
};

function stillValid(n: { expires_at?: string | null; is_active?: boolean }) {
  if (n.is_active === false) return false;
  if (!n.expires_at) return true;
  return new Date(n.expires_at).getTime() >= Date.now();
}

function matchesAudience(
  n: { audience?: string; target_user_ids?: string[] | null },
  roles: string[],
  userId: string
) {
  const a = (n.audience || 'ALL').toUpperCase();
  if (a === 'ALL') return true;
  if (a === 'USERS') {
    const targets = Array.isArray(n.target_user_ids) ? n.target_user_ids : [];
    return targets.map(String).includes(String(userId));
  }
  return roles.some((r) => r.toLowerCase() === a.toLowerCase());
}

export class NoticeBoardMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoticeBoardMissingError';
  }
}

function isMissingTable(err: { message?: string; code?: string } | null) {
  const msg = err?.message ?? '';
  return (
    err?.code === '42P01' ||
    /relation .* does not exist/i.test(msg) ||
    /Could not find the table/i.test(msg) ||
    /schema cache/i.test(msg)
  );
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

  if (error) {
    if (isMissingTable(error)) {
      throw new NoticeBoardMissingError(
        'Notice board tables missing. Run supabase/SMOKE_FIX_ALL.sql in Supabase SQL Editor, then reload.'
      );
    }
    throw error;
  }

  const rows = (data ?? []).filter((n: any) => {
    if (!input.includeInactive && !stillValid(n)) return false;
    return matchesAudience(n, input.roles, input.userId);
  });

  const ids = rows.map((r: any) => r.notification_id);
  let readSet = new Set<number>();
  if (ids.length) {
    const { data: reads, error: readErr } = await supabase
      .from('app_notification_reads')
      .select('notification_id')
      .eq('user_id', input.userId)
      .in('notification_id', ids);
    if (!readErr) {
      readSet = new Set((reads ?? []).map((r: any) => Number(r.notification_id)));
    }
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
  target_user_ids?: string[];
  template_key?: string | null;
  send_local_alert?: boolean;
}) {
  const audience = input.audience || 'ALL';
  const full = {
    title: input.title.trim(),
    body: input.body.trim(),
    audience,
    priority: input.priority ?? 'NORMAL',
    link_href: input.link_href?.trim() || null,
    created_by: input.created_by ?? null,
    expires_at: input.expires_at || null,
    is_active: true,
    target_user_ids: audience === 'USERS' ? input.target_user_ids ?? [] : [],
    template_key: input.template_key ?? null,
    send_local_alert: input.send_local_alert ?? true,
  };

  const { data, error } = await supabase
    .from('app_notifications')
    .insert(full)
    .select()
    .single();

  if (error) {
    // Older schema without target columns
    const { data: d2, error: e2 } = await supabase
      .from('app_notifications')
      .insert({
        title: full.title,
        body: full.body,
        audience: full.audience === 'USERS' ? 'ALL' : full.audience,
        priority: full.priority,
        link_href: full.link_href,
        created_by: full.created_by,
        expires_at: full.expires_at,
        is_active: true,
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2 as AppNotification;
  }
  return data as AppNotification;
}

/** Broadcast to everyone */
export async function broadcastNotice(input: {
  title: string;
  body: string;
  priority?: NotificationPriority;
  created_by?: string | null;
  template_key?: string | null;
}) {
  return createNotification({
    ...input,
    audience: 'ALL',
    send_local_alert: true,
  });
}

/** Send to one or many specific users */
export async function notifySpecificUsers(input: {
  title: string;
  body: string;
  user_ids: string[];
  priority?: NotificationPriority;
  created_by?: string | null;
  template_key?: string | null;
}) {
  if (!input.user_ids.length) throw new Error('Select at least one user');
  return createNotification({
    title: input.title,
    body: input.body,
    audience: 'USERS',
    target_user_ids: input.user_ids,
    priority: input.priority,
    created_by: input.created_by,
    template_key: input.template_key,
    send_local_alert: true,
  });
}

export async function setNotificationActive(notificationId: number, isActive: boolean) {
  const { data, error } = await supabase
    .from('app_notifications')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deactivateNotification(notificationId: number) {
  return setNotificationActive(notificationId, false);
}

export async function deleteNotification(notificationId: number) {
  const { error } = await supabase
    .from('app_notifications')
    .delete()
    .eq('notification_id', notificationId);
  if (error) {
    await deactivateNotification(notificationId);
  }
}
