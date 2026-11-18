import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { phoneToAuthEmail } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { UserMaster } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserMaster | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (name: string) => boolean;
  hasRole: (name: string) => boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CRITICAL_PERMS = [
  'masters.manage',
  'products.manage',
  'inventory.manage',
  'sales.reconcile',
  'reports.export',
  'users.manage',
  'rbac.manage',
  'audit.view',
  'users.view',
] as const;

async function loadProfile(authUserId: string) {
  // Live schema: users_master.user_id == auth.users.id
  const { data: profile, error } = await supabase
    .from('users_master')
    .select('*')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (error) throw error;

  const roles: string[] = [];
  const permissions: string[] = [];

  const { data: isSuper } = await supabase.rpc('has_role', {
    role_name: 'super_admin',
  });
  const { data: isAdminRole } = await supabase.rpc('has_role', {
    role_name: 'admin',
  });
  if (isSuper) roles.push('super_admin');
  if (isAdminRole) roles.push('admin');

  if (profile?.user_id) {
    const { data: modelRoles } = await supabase
      .from('model_has_roles')
      .select('role_id')
      .eq('model_id', profile.user_id);

    const roleIds = (modelRoles ?? []).map((r) => r.role_id);
    if (roleIds.length) {
      const { data: roleRows } = await supabase
        .from('roles')
        .select('name')
        .in('id', roleIds);
      for (const r of roleRows ?? []) {
        if (r.name && !roles.includes(r.name)) roles.push(r.name);
      }
    }
  }

  if (roles.includes('super_admin') || roles.includes('admin')) {
    permissions.push(...CRITICAL_PERMS);
    return { profile, roles, permissions };
  }

  // Prefer has_permission(permission_name) if present; fall back to Spatie join
  const permResults = await Promise.all(
    CRITICAL_PERMS.map(async (perm_name) => {
      const { data, error } = await supabase.rpc('has_permission', {
        perm_name,
      });
      if (!error && data) return perm_name;
      return null;
    })
  );

  const fromRpc = permResults.filter(Boolean) as string[];
  if (fromRpc.length) {
    permissions.push(...fromRpc);
    return { profile, roles, permissions };
  }

  // Fallback: role_has_permissions for assigned roles
  const { data: modelRoles } = await supabase
    .from('model_has_roles')
    .select('role_id')
    .eq('model_id', authUserId);
  const roleIds = (modelRoles ?? []).map((r) => r.role_id);
  if (roleIds.length) {
    const { data: links } = await supabase
      .from('role_has_permissions')
      .select('permission_id')
      .in('role_id', roleIds);
    const permIds = (links ?? []).map((l) => l.permission_id);
    if (permIds.length) {
      const { data: perms } = await supabase
        .from('permissions')
        .select('name')
        .in('id', permIds);
      for (const p of perms ?? []) {
        if (p.name) permissions.push(p.name);
      }
    }
  }

  return { profile, roles, permissions };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserMaster | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user) {
      setProfile(null);
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      const result = await loadProfile(next.user.id);
      setProfile(result.profile);
      setRoles(result.roles);
      setPermissions(result.permissions);
    } catch (e) {
      console.error('[auth] profile load failed', e);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      hydrate(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signInWithPhone = useCallback(async (phone: string, password: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      throw new Error('Enter a valid 10-digit phone number');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(cleaned),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await hydrate(session);
  }, [hydrate, session]);

  const hasPermission = useCallback(
    (name: string) => permissions.includes(name) || roles.includes('super_admin'),
    [permissions, roles]
  );

  const hasRole = useCallback((name: string) => roles.includes(name), [roles]);

  const isAdmin = roles.some((r) =>
    ['super_admin', 'admin', 'Super Admin', 'Admin'].includes(r)
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      roles,
      permissions,
      loading,
      isAdmin,
      signInWithPhone,
      signOut,
      hasPermission,
      hasRole,
      refreshProfile,
    }),
    [
      session,
      profile,
      roles,
      permissions,
      loading,
      isAdmin,
      signInWithPhone,
      signOut,
      hasPermission,
      hasRole,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
