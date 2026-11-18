import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  KeyRound,
  Lock,
  Phone,
  ScrollText,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import {
  assignUserRole,
  listAuditLogs,
  listPermissions,
  listRolePermissions,
  listRoles,
  listUsers,
  onboardStaff,
  setUserStatus,
  toggleRolePermission,
} from '@/services/rbac';

type Tab = 'users' | 'matrix' | 'onboard' | 'audit';

export default function RbacScreen() {
  const [tab, setTab] = useState<Tab>('users');
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

  const load = useCallback(async () => {
    setError(null);
    try {
      const [u, r, p, rp, a] = await Promise.all([
        listUsers(),
        listRoles(),
        listPermissions(),
        listRolePermissions(),
        listAuditLogs(),
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
      setRolePerms(rp);
      setAudits(a);
      if (r[0] && roleId == null) setRoleId(r[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RBAC load failed');
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

  const hasLink = (roleIdVal: number, permId: number) =>
    rolePerms.some((rp) => rp.role_id === roleIdVal && rp.permission_id === permId);

  return (
    <Screen title="Users & Access" loading={loading}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <SegmentStrip
        value={tab}
        onChange={setTab}
        items={[
          { key: 'users', label: 'Users', icon: Users },
          { key: 'matrix', label: 'Permissions', icon: KeyRound },
          { key: 'onboard', label: 'Add staff', icon: UserPlus },
          { key: 'audit', label: 'Audit', icon: ScrollText },
        ]}
      />

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
                    className="rounded-lg px-3 py-2"
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
                      className="rounded-lg bg-slate-100 px-3 py-2"
                      onPress={async () => {
                        try {
                          await assignUserRole(u.user_id, r.id);
                          setOk(`${u.full_name} → role ${r.name}`);
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Role assign failed');
                        }
                      }}
                    >
                      <Text className="text-xs font-bold">Set {r.name}</Text>
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
              <Text className="mb-2 font-bold text-royal">{role.name}</Text>
              {permissions.map((perm) => {
                const on = hasLink(role.id, perm.id);
                return (
                  <Pressable
                    key={perm.id}
                    className="mb-1 flex-row items-center justify-between py-2"
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
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            icon={Users}
          />
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
              className="mb-1 flex-row items-center gap-2 py-2"
            >
              <Shield
                size={18}
                color={roleId === r.id ? colors.royal : colors.muted}
              />
              <Text style={{ color: roleId === r.id ? colors.royal : colors.ink }}>
                {roleId === r.id ? '● ' : '○ '}
                {r.name}
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
                setOk('Staff onboarded in Auth + users_master');
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
            <View key={a.log_id} className="mb-2 rounded-xl bg-white p-3">
              <Text className="font-semibold text-ink">
                {a.action} · {a.table_name}
              </Text>
              <Text className="text-xs text-slate-500">{a.created_at}</Text>
              <Text className="mt-1 font-mono text-[10px] text-slate-600">
                before: {JSON.stringify(a.old_data)}
              </Text>
              <Text className="font-mono text-[10px] text-slate-600">
                after: {JSON.stringify(a.new_data)}
              </Text>
            </View>
          ))
        : null}
    </Screen>
  );
}
