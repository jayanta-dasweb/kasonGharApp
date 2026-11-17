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

async function loadProfile(authUserId: string) {
  const { data: profile, error } = await supabase
    .from('users_master')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;

  const roles: string[] = [];
  const permissions: string[] = [];

  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc('has_role', { name: 'super_admin' }),
    supabase.rpc('has_role', { name: 'admin' }),
  ]);
  if (isSuper) roles.push('super_admin');
  if (isAdmin) roles.push('admin');

  if (profile?.id) {
    const { data: modelRoles } = await supabase
      .from('model_has_roles')
      .select('role_id')
      .eq('model_id', profile.id);

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

  const criticalPerms = [
    'masters.manage',
    'products.manage',
    'inventory.manage',
    'sales.reconcile',
    'reports.export',
    'users.manage',
    'rbac.manage',
    'audit.view',
  ];

  for (const name of criticalPerms) {
    const { data } = await supabase.rpc('has_permission', { name });
    if (data) permissions.push(name);
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
