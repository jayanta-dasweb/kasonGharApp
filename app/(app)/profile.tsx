import { useState } from 'react';
import { Text, View } from 'react-native';
import { KeyRound, Save, User } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { brand } from '@/constants/brand';
import { ROLE_LABELS } from '@/constants/roles';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { profile, roles, hasPermission } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canChangePassword = hasPermission('profile.password');

  return (
    <Screen title="My Profile">
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 rounded-2xl bg-white p-4">
        <Text className="text-lg font-bold text-maroon">{profile?.full_name}</Text>
        <Text className="mt-1 text-sm text-slate-500">
          {brand.nameEn} · {profile?.phone}
        </Text>
        <Text className="mt-2 text-xs text-slate-500">
          Role: {roles.map((r) => ROLE_LABELS[r] ?? r).join(', ') || '—'}
        </Text>
        <Text className="mt-3 text-xs text-slate-400">
          Name, phone and other profile fields can only be changed by Super Admin or Admin.
          You can update your password below.
        </Text>
      </View>

      {canChangePassword ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="mb-3 text-sm font-bold text-ink">Change password</Text>
          <Input
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={KeyRound}
          />
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            icon={KeyRound}
          />
          <Button
            icon={Save}
            label="Update password"
            loading={saving}
            onPress={async () => {
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                if (password.length < 6) throw new Error('Password must be at least 6 characters');
                if (password !== confirm) throw new Error('Passwords do not match');
                const { error: updErr } = await supabase.auth.updateUser({ password });
                if (updErr) throw updErr;
                setPassword('');
                setConfirm('');
                setOk('Password updated');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Password update failed');
              } finally {
                setSaving(false);
              }
            }}
          />
        </View>
      ) : (
        <View className="rounded-2xl bg-white p-4">
          <User color="#64748B" size={22} />
          <Text className="mt-2 text-slate-500">Password change not allowed for your role.</Text>
        </View>
      )}
    </Screen>
  );
}
