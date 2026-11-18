import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import {
  KeyRound,
  Lock,
  Phone,
  ScrollText,
  Shield,
  ShieldPlus,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { Toast } from '@/components/ui/Toast';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  assignUserRole,
  createRole,
  listAuditLogs,
  listPermissions,
  listRolePermissions,
  listRoles,
  listUsers,
  onboardStaff,
  seedDefaultRoles,
  setUserStatus,
  toggleRolePermission,
} from '@/services/rbac';

type Tab = 'roles' | 'users' | 'matrix' | 'onboard' | 'audit';

export default function RbacScreen() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const canOpen =
    isSuperAdmin || hasPermission('rbac.manage') || hasPermission('users.manage');

  const [tab, setTab] = useState<Tab>('roles');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [u, r, p, rp, a] = await Promise.all([
        listUsers(),
        listRoles(),
        listPermissions(),
        listRolePermissions(),
        listAuditLogs().catch(() => []),
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
      setRolePerms(rp);
      setAudits(a);
      if (r[0] && roleId == null) setRoleId(r[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Users & Access load failed');
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (!canOpen) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  const hasLink = (roleIdVal: number, permId: number) =>
    rolePerms.some((rp) => rp.role_id === roleIdVal && rp.permission_id === permId);

  return (
    <Screen title="Users & Access" loading={loading}>
      <Text className="mb-3 text-xs text-slate-500">
        Roles are managed here (not in Masters). Super Admin only for security.
      </Text>

      <Toast message={error} />
      <Toast message={ok} type="success" />

      <SegmentStrip
        value={tab}
        onChange={setTab}
        items={[
          { key: 'roles', label: 'Roles', icon: Shield },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'matrix', label: 'Permissions', icon: KeyRound },
          { key: 'onboard', label: 'Add staff', icon: UserPlus },
          { key: 'audit', label: 'Audit', icon: ScrollText },
        ]}
      />

      {tab === 'roles' ? (
        <View>
          <View className="mb-4 rounded-2xl bg-white p-4">
            <Text className="mb-2 text-sm font-bold text-maroon">
              Create the 3 default roles
            </Text>
            <Text className="mb-3 text-xs text-slate-500">
              Super Admin · Admin · Salesperson — with correct permissions.
            </Text>
            <Button
              icon={ShieldPlus}
              label="Seed Super Admin / Admin / Salesperson"
              loading={saving}
              onPress={async () => {
                setSaving(true);
                setError(null);
                setOk(null);
                try {
                  await seedDefaultRoles();
                  setOk('3 default roles ready');
                  await load();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? `${e.message} — or run supabase/seed_default_roles.sql`
                      : 'Seed failed'
                  );
                } finally {
                  setSaving(false);
                }
              }}
            />
          </View>

          <View className="mb-4 rounded-2xl bg-white p-4">
            <Text className="mb-2 text-sm font-bold text-ink">Create custom role</Text>
            <Input
              label="Role name"
              value={newRoleName}
              onChangeText={setNewRoleName}
              placeholder="e.g. accountant"
              icon={Shield}
            />
            <Button
              icon={ShieldPlus}
              label="Create role"
              loading={saving}
              onPress={async () => {
                setSaving(true);
                setError(null);
                setOk(null);
                try {
                  await createRole(newRoleName);
                  setNewRoleName('');
                  setOk('Role created — set permissions in Permissions tab');
                  await load();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Create role failed');
                } finally {
                  setSaving(false);
                }
              }}
            />
          </View>

          {roles.map((r) => {
            const key = String(r.name ?? '').toLowerCase();
            return (
              <View key={r.id} className="mb-2 rounded-xl bg-white p-4">
                <Text className="font-bold text-ink">
                  {ROLE_LABELS[key] ?? r.name}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {ROLE_DESCRIPTIONS[key] ?? 'Custom role — set permissions manually'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === 'users'
        ? users.map((u) => {
            const active = (u.status ?? 'ACTIVE') === 'ACTIVE';
            return (
              <View key={u.user_id} className="mb-2 rounded-xl bg-white p-3">
                <Text className="font-semibold text-ink">{u.full_name}</Text>
                <Text className="text-xs text-slate-500">
                  {u.phone} · {u.email}
                </Text>
                <Text
                  className="mt-1 text-xs font-bold"
                  style={{ color: active ? colors.success : colors.danger }}
                >
                  {u.status ?? 'ACTIVE'}
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  <Pressable
                    className="min-h-[48px] justify-center rounded-lg px-3 py-2"
                    style={{ backgroundColor: active ? '#FEE2E2' : '#D1FAE5' }}
                    onPress={async () => {
                      try {
                        await setUserStatus(u.user_id, active ? 'INACTIVE' : 'ACTIVE');
                        setOk(`${u.full_name} marked ${active ? 'INACTIVE' : 'ACTIVE'}`);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Status update failed');
                      }
                    }}
                  >
                    <Text className="text-xs font-bold">
                      {active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </Pressable>
                  {roles.map((r) => (
                    <Pressable
                      key={r.id}
                      className="min-h-[48px] justify-center rounded-lg bg-slate-100 px-3 py-2"
                      onPress={async () => {
                        try {
                          await assignUserRole(u.user_id, r.id);
                          setOk(
                            `${u.full_name} → ${ROLE_LABELS[String(r.name).toLowerCase()] ?? r.name}`
                          );
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Role assign failed');
                        }
                      }}
                    >
                      <Text className="text-xs font-bold">
                        Set {ROLE_LABELS[String(r.name).toLowerCase()] ?? r.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })
        : null}

      {tab === 'matrix'
        ? roles.map((role) => (
            <View key={role.id} className="mb-4 rounded-2xl bg-white p-3">
              <Text className="mb-2 font-bold text-royal">
                {ROLE_LABELS[String(role.name).toLowerCase()] ?? role.name}
              </Text>
              {permissions.map((perm) => {
                const on = hasLink(role.id, perm.id);
                return (
                  <Pressable
                    key={perm.id}
                    className="mb-1 min-h-[48px] flex-row items-center justify-between py-2"
                    onPress={async () => {
                      try {
                        await toggleRolePermission(role.id, perm.id, !on);
                        setOk(`${perm.name} ${!on ? 'granted' : 'revoked'}`);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Toggle failed');
                      }
                    }}
                  >
                    <Text className="text-sm text-ink">{perm.name}</Text>
                    <Text className="font-bold" style={{ color: on ? colors.success : colors.muted }}>
                      {on ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        : null}

      {tab === 'onboard' ? (
        <View className="rounded-2xl bg-white p-4">
          <Input label="Full Name" value={fullName} onChangeText={setFullName} icon={Users} />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={Phone}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={Lock}
          />
          <Text className="mb-2 text-sm font-medium text-slate-600">Role</Text>
          {roles.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setRoleId(r.id)}
              className="mb-1 min-h-[48px] flex-row items-center gap-2 py-2"
            >
              <Shield size={18} color={roleId === r.id ? colors.royal : colors.muted} />
              <Text style={{ color: roleId === r.id ? colors.royal : colors.ink }}>
                {roleId === r.id ? '● ' : '○ '}
                {ROLE_LABELS[String(r.name).toLowerCase()] ?? r.name}
              </Text>
            </Pressable>
          ))}
          <Button
            icon={UserPlus}
            label="Create Staff User"
            loading={saving}
            onPress={async () => {
              if (roleId == null) return;
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                await onboardStaff({
                  full_name: fullName,
                  phone,
                  password,
                  role_id: roleId,
                });
                setOk('Staff created');
                setFullName('');
                setPhone('');
                setPassword('');
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Onboard failed');
              } finally {
                setSaving(false);
              }
            }}
          />
        </View>
      ) : null}

      {tab === 'audit'
        ? audits.map((a) => (
            <View key={a.log_id ?? a.id} className="mb-2 rounded-xl bg-white p-3">
              <Text className="font-semibold text-ink">
                {a.action} · {a.table_name}
              </Text>
              <Text className="text-xs text-slate-500">{a.created_at}</Text>
            </View>
          ))
        : null}
    </Screen>
  );
}
