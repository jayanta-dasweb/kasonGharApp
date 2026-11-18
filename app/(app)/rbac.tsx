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
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { ToggleRow } from '@/components/ui/ToggleSwitch';
import { Toast } from '@/components/ui/Toast';
import { ROLE, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles';
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
  mapUserRoles,
  onboardStaff,
  seedDefaultRoles,
  setUserStatus,
  toggleRolePermission,
} from '@/services/rbac';

type Tab = 'roles' | 'users' | 'onboard' | 'matrix' | 'audit';

export default function RbacScreen() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const canOpen =
    isSuperAdmin || hasPermission('rbac.manage') || hasPermission('users.manage');

  const [tab, setTab] = useState<Tab>('onboard');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoleMap, setUserRoleMap] = useState<Record<string, string[]>>({});
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
      let r = await listRoles();
      // Auto-seed the 3 system roles if missing
      const names = new Set(r.map((x: any) => String(x.name).toLowerCase()));
      const needSeed =
        !names.has(ROLE.SUPER_ADMIN) ||
        !names.has(ROLE.ADMIN) ||
        !names.has(ROLE.SALESPERSON);
      if (needSeed) {
        try {
          await seedDefaultRoles();
          r = await listRoles();
        } catch {
          // SQL seed may still be needed
        }
      }

      const [u, p, rp, a, roleMap] = await Promise.all([
        listUsers(),
        listPermissions(),
        listRolePermissions(),
        listAuditLogs().catch(() => []),
        mapUserRoles().catch(() => ({})),
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
      setRolePerms(rp);
      setAudits(a);
      setUserRoleMap(roleMap);

      if (roleId == null) {
        const sales = r.find((x: any) => String(x.name).toLowerCase() === ROLE.SALESPERSON);
        setRoleId(sales?.id ?? r[0]?.id ?? null);
      }
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

  const selectedRole = roles.find((r) => r.id === roleId);

  return (
    <Screen title="Users & Access" loading={loading} safeTop={false}>
      <Text className="mb-3 text-xs text-slate-500">
        Create staff here and pick a role. Roles are not in Masters.
      </Text>

      <Toast message={error} />
      <Toast message={ok} type="success" />

      <SegmentStrip
        value={tab}
        onChange={setTab}
        items={[
          { key: 'onboard', label: 'Add staff', icon: UserPlus },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'roles', label: 'Roles', icon: Shield },
          { key: 'matrix', label: 'Permissions', icon: KeyRound },
          { key: 'audit', label: 'Audit', icon: ScrollText },
        ]}
      />

      {tab === 'onboard' ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="mb-1 text-base font-bold text-maroon">1. Staff details</Text>
          <Input label="Full Name" value={fullName} onChangeText={setFullName} icon={Users} />
          <Input
            label="Phone (login)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={Phone}
            placeholder="10-digit mobile"
          />
          <Input
            label="Temp password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={Lock}
          />

          <Text className="mb-2 mt-2 text-base font-bold text-maroon">2. Give role</Text>
          <Text className="mb-3 text-xs text-slate-500">
            Tap one big role card. This controls what they can open in the app.
          </Text>

          {roles.length === 0 ? (
            <View className="mb-3 rounded-xl bg-amber-50 p-3">
              <Text className="mb-2 text-sm text-amber-900">
                No roles yet. Seed the 3 default roles first.
              </Text>
              <Button
                icon={ShieldPlus}
                label="Seed Super Admin / Admin / Salesperson"
                onPress={async () => {
                  setSaving(true);
                  try {
                    await seedDefaultRoles();
                    setOk('Roles ready — pick one below');
                    await load();
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? `${e.message} — run supabase/seed_default_roles.sql`
                        : 'Seed failed'
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                loading={saving}
              />
            </View>
          ) : (
            roles.map((r) => {
              const key = String(r.name ?? '').toLowerCase();
              return (
                <NavRow
                  key={r.id}
                  label={ROLE_LABELS[key] ?? r.name}
                  subtitle={ROLE_DESCRIPTIONS[key] ?? 'Custom role'}
                  icon={Shield}
                  color={
                    key === ROLE.SUPER_ADMIN
                      ? colors.maroon
                      : key === ROLE.ADMIN
                        ? colors.royal
                        : colors.muga
                  }
                  active={roleId === r.id}
                  onPress={() => setRoleId(r.id)}
                />
              );
            })
          )}

          {selectedRole ? (
            <Text className="mb-3 text-xs font-semibold" style={{ color: colors.success }}>
              Selected: {ROLE_LABELS[String(selectedRole.name).toLowerCase()] ?? selectedRole.name}
            </Text>
          ) : (
            <Text className="mb-3 text-xs font-semibold" style={{ color: colors.danger }}>
              Select a role to continue
            </Text>
          )}

          <Button
            icon={UserPlus}
            label="3. Create user with this role"
            loading={saving}
            disabled={roleId == null}
            onPress={async () => {
              if (roleId == null) {
                setError('Select a role first');
                return;
              }
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                const result = await onboardStaff({
                  full_name: fullName,
                  phone,
                  password,
                  role_id: roleId,
                });
                const roleLabel =
                  ROLE_LABELS[String(result.role_name).toLowerCase()] ?? result.role_name;
                setOk(`Created ${fullName} as ${roleLabel}. They login with phone + password.`);
                setFullName('');
                setPhone('');
                setPassword('');
                setTab('users');
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

      {tab === 'users'
        ? users.map((u) => {
            const active = (u.status ?? 'ACTIVE') === 'ACTIVE';
            const roleNames = userRoleMap[String(u.user_id)] ?? [];
            return (
              <View key={u.user_id} className="mb-3 rounded-2xl bg-white p-4">
                <Text className="font-semibold text-ink">{u.full_name}</Text>
                <Text className="text-xs text-slate-500">
                  {u.phone} · {u.email}
                </Text>
                <Text className="mt-2 text-sm font-bold text-maroon">
                  Role:{' '}
                  {roleNames.length
                    ? roleNames.map((n) => ROLE_LABELS[n.toLowerCase()] ?? n).join(', ')
                    : 'NONE — assign below'}
                </Text>
                <View className="mt-3">
                  <ToggleRow
                    label={active ? 'Active' : 'Inactive'}
                    hint={active ? 'ON · can login' : 'OFF · blocked from login'}
                    value={active}
                    onValueChange={async (on) => {
                      try {
                        await setUserStatus(u.user_id, on ? 'ACTIVE' : 'INACTIVE');
                        setOk(`${u.full_name} marked ${on ? 'ACTIVE' : 'INACTIVE'}`);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Status update failed');
                      }
                    }}
                  />
                </View>
                <Text className="mb-2 mt-3 text-xs font-semibold text-slate-500">
                  Change role (tap one)
                </Text>
                {roles.map((r) => {
                  const key = String(r.name).toLowerCase();
                  const assigned = roleNames.map((n) => n.toLowerCase()).includes(key);
                  return (
                    <Pressable
                      key={r.id}
                      className="mb-2 min-h-[52px] justify-center rounded-xl px-3"
                      style={{
                        backgroundColor: assigned ? '#D1FAE5' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: assigned ? colors.success : colors.border,
                      }}
                      onPress={async () => {
                        try {
                          await assignUserRole(u.user_id, r.id);
                          setOk(
                            `${u.full_name} → ${ROLE_LABELS[key] ?? r.name}`
                          );
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Role assign failed');
                        }
                      }}
                    >
                      <Text className="text-sm font-bold text-ink">
                        {assigned ? '✓ ' : ''}
                        {ROLE_LABELS[key] ?? r.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })
        : null}

      {tab === 'roles' ? (
        <View>
          <View className="mb-4 rounded-2xl bg-white p-4">
            <Text className="mb-2 text-sm font-bold text-maroon">Default 3 roles</Text>
            <Button
              icon={ShieldPlus}
              label="Seed / refresh Super Admin · Admin · Salesperson"
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
                <Text className="font-bold text-ink">{ROLE_LABELS[key] ?? r.name}</Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {ROLE_DESCRIPTIONS[key] ?? 'Custom role — set permissions manually'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === 'matrix' ? (
        <View>
          <Text className="mb-3 text-sm text-slate-500">
            Flip the switch to grant or revoke each permission. Green = ON.
          </Text>
          {roles.map((role) => (
            <View key={role.id} className="mb-4 rounded-2xl bg-white p-3">
              <Text className="mb-2 font-bold text-royal">
                {ROLE_LABELS[String(role.name).toLowerCase()] ?? role.name}
              </Text>
              {permissions.length === 0 ? (
                <Text className="text-sm text-slate-500">No permissions seeded yet.</Text>
              ) : null}
              {permissions.map((perm) => {
                const on = hasLink(role.id, perm.id);
                return (
                  <ToggleRow
                    key={perm.id}
                    dense
                    label={perm.name}
                    hint={on ? 'Granted' : 'Not granted'}
                    value={on}
                    onValueChange={async (next) => {
                      try {
                        await toggleRolePermission(role.id, perm.id, next);
                        setOk(`${perm.name} ${next ? 'granted' : 'revoked'}`);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Toggle failed');
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
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
