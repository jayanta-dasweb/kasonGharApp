import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KasonLogo } from '@/components/logo/KasonLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { session, signInWithPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Redirect href="/(app)/dashboard" />;

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPhone(phone, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}>
          <View className="mb-10 items-center">
            <KasonLogo size={148} />
            <Text className="mt-4 text-center text-sm text-slate-500">
              Mekhela Chador ERP · Inventory · Accounts
            </Text>
          </View>

          <Toast message={error} />

          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />

          <Button label="Sign In" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
