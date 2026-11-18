import { ALL_PERMS, ROLE, ROLE_DESCRIPTIONS } from '@/constants/roles';
import { phoneToAuthEmail } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export async function createRole(name: string) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, '_');
  if (!clean) throw new Error('Role name required');
  const { data, error } = await supabase
    .from('roles')
    .insert({ name: clean, guard_name: 'web' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensurePermission(name: string) {
  const { data: existing } = await supabase
    .from('permissions')
    .select('*')
    .eq('name', name)
    .maybeSingle();
  if (existing) return existing;
  const moduleName = name.includes('.') ? name.split('.')[0] : 'general';
  const full = { name, guard_name: 'web', module: moduleName, description: name };
  const { data, error } = await supabase
    .from('permissions')
    .insert(full)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('permissions')
      .insert({ name, guard_name: 'web', module: moduleName })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
  return data;
}

/** Creates the 3 system roles + permission matrix from the app (if SQL not run). */
export async function seedDefaultRoles() {
  const roleNames = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SALESPERSON] as const;
  const roleIds: Record<string, number> = {};

  for (const name of roleNames) {
    const { data: existing } = await supabase
      .from('roles')
      .select('*')
      .eq('name', name)
      .maybeSingle();
    if (existing) {
      roleIds[name] = existing.id;
    } else {
      const created = await createRole(name);
      roleIds[name] = created.id;
    }
  }

  const permIds: Record<string, number> = {};
  for (const name of ALL_PERMS) {
    const p = await ensurePermission(name);
    permIds[name] = p.id;
  }

  const matrix: Record<string, readonly string[]> = {
    [ROLE.SUPER_ADMIN]: ALL_PERMS,
    [ROLE.ADMIN]: ALL_PERMS.filter(
      (p) => !['users.view', 'users.manage', 'rbac.manage', 'audit.view'].includes(p)
    ),
    [ROLE.SALESPERSON]: [
      'catalog.view',
      'products.update_assigned',
      'sales.own',
      'sales.reconcile',
      'reports.own',
      'notifications.view',
      'profile.password',
    ],
  };

  for (const [roleName, perms] of Object.entries(matrix)) {
    const rid = roleIds[roleName];
    await supabase.from('role_has_permissions').delete().eq('role_id', rid);
    const rows = perms.map((pname) => ({
      role_id: rid,
      permission_id: permIds[pname],
    }));
    if (rows.length) {
      const { error } = await supabase.from('role_has_permissions').insert(rows);
      if (error) throw error;
    }
  }

  return {
    roles: roleIds,
    descriptions: ROLE_DESCRIPTIONS,
  };
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('users_master')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function setUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data, error } = await supabase
    .from('users_master')
    .update({ status })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignUserRole(userId: string, roleId: number) {
  // replace existing roles for simplicity
  await supabase
    .from('model_has_roles')
    .delete()
    .eq('model_id', userId)
    .eq('model_type', 'App\\Models\\User');
  const { error } = await supabase.from('model_has_roles').insert({
    role_id: roleId,
    model_type: 'App\\Models\\User',
    model_id: userId,
  });
  if (error) throw error;
}

export async function getUserRoleIds(userId: string) {
  const { data, error } = await supabase
    .from('model_has_roles')
    .select('role_id')
    .eq('model_id', userId)
    .eq('model_type', 'App\\Models\\User');
  if (error) {
    const retry = await supabase
      .from('model_has_roles')
      .select('role_id')
      .eq('model_id', userId);
    if (retry.error) throw retry.error;
    return (retry.data ?? []).map((r) => r.role_id);
  }
  return (data ?? []).map((r) => r.role_id);
}

/** Map user_id → role names for staff list */
export async function mapUserRoles() {
  const { data: links, error } = await supabase
    .from('model_has_roles')
    .select('model_id, role_id');
  if (error) throw error;
  const roleIds = [...new Set((links ?? []).map((l) => l.role_id))];
  const { data: roles } = roleIds.length
    ? await supabase.from('roles').select('id, name').in('id', roleIds)
    : { data: [] as any[] };
  const byId = new Map((roles ?? []).map((r) => [r.id, String(r.name)]));
  const map: Record<string, string[]> = {};
  for (const l of links ?? []) {
    const name = byId.get(l.role_id);
    if (!name) continue;
    const key = String(l.model_id);
    if (!map[key]) map[key] = [];
    map[key].push(name);
  }
  return map;
}

export async function listRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function listPermissions() {
  const { data, error } = await supabase.from('permissions').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function listRolePermissions() {
  const { data, error } = await supabase.from('role_has_permissions').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function toggleRolePermission(
  roleId: number,
  permissionId: number,
  enabled: boolean
) {
  if (enabled) {
    const { error } = await supabase
      .from('role_has_permissions')
      .insert({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('role_has_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw error;
  }
}

export async function onboardStaff(input: {
  full_name: string;
  phone: string;
  password: string;
  role_id: number;
}) {
  const phone = input.phone.replace(/\D/g, '');
  if (phone.length !== 10) throw new Error('Phone must be 10 digits');
  if (!input.full_name.trim()) throw new Error('Full name required');
  if (!input.password || input.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (!input.role_id) throw new Error('Select a role first');

  const { data: roleRow, error: roleLookupErr } = await supabase
    .from('roles')
    .select('id, name')
    .eq('id', input.role_id)
    .maybeSingle();
  if (roleLookupErr) throw roleLookupErr;
  if (!roleRow) throw new Error('Selected role not found — seed roles first');

  const email = phoneToAuthEmail(phone);
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: input.password,
  });
  if (authErr) throw authErr;
  if (!authData.user) throw new Error('Auth user was not created');

  const { data: profile, error: profileErr } = await supabase
    .from('users_master')
    .insert({
      user_id: authData.user.id,
      full_name: input.full_name.trim(),
      phone,
      email,
      status: 'ACTIVE',
    })
    .select()
    .single();
  if (profileErr) throw profileErr;

  // Clear any stale role links then assign
  await supabase.from('model_has_roles').delete().eq('model_id', profile.user_id);

  const rolePayload = {
    role_id: input.role_id,
    model_type: 'App\\Models\\User',
    model_id: profile.user_id,
  };
  const { error: roleErr } = await supabase.from('model_has_roles').insert(rolePayload);
  if (roleErr) {
    const retry = await supabase.from('model_has_roles').insert({
      role_id: input.role_id,
      model_id: profile.user_id,
    });
    if (retry.error) throw retry.error;
  }

  const roleName = String(roleRow.name ?? '').toLowerCase();
  if (roleName.includes('sales')) {
    const code = `LOC-SP-${phone.slice(-4)}`;
    await supabase.from('stock_locations').insert({
      location_code: code,
      location_name: `${input.full_name.trim()} Bag`,
      usage: 'SALESPERSON',
      assigned_user_id: profile.user_id,
      is_active: true,
    });
  }

  return { profile, role_name: roleRow.name as string };
}

export async function listAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function checkHasPermission(name: string) {
  const { data, error } = await supabase.rpc('has_permission', { perm_name: name });
  if (error) throw error;
  return Boolean(data);
}

export async function checkHasRole(name: string) {
  const { data, error } = await supabase.rpc('has_role', { role_name: name });
  if (error) throw error;
  return Boolean(data);
}
