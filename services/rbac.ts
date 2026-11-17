import { phoneToAuthEmail } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export async function listUsers() {
  const { data, error } = await supabase
    .from('users_master')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
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
      full_name: input.full_name,
      phone,
      email_alias: email,
      auth_user_id: authData.user.id,
      is_active: true,
    })
    .select()
    .single();
  if (profileErr) throw profileErr;

  const { error: roleErr } = await supabase.from('model_has_roles').insert({
    role_id: input.role_id,
    model_type: 'App\\Models\\User',
    model_id: profile.id,
  });
  if (roleErr) throw roleErr;

  // Ensure salesperson location exists when role needs it
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', input.role_id)
    .maybeSingle();

  if (role?.name?.toLowerCase().includes('sales')) {
    await supabase.from('stock_locations').insert({
      name: `${input.full_name} Bag`,
      usage: 'SALESPERSON',
      user_id: profile.id,
      is_active: true,
    });
  }

  return profile;
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
  const { data, error } = await supabase.rpc('has_permission', { name });
  if (error) throw error;
  return Boolean(data);
}

export async function checkHasRole(name: string) {
  const { data, error } = await supabase.rpc('has_role', { name });
  if (error) throw error;
  return Boolean(data);
}
