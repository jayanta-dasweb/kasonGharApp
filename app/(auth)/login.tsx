import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type ScrollView as ScrollViewType,
} from 'react-native';
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
  const scrollRef = useRef<ScrollViewType>(null);

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

  const scrollFieldIntoView = () => {
    // Give keyboard time to open, then scroll form into view
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 48,
          }}
        >
          <View className="mb-8 items-center">
            <KasonLogo size={132} />
            <Text className="mt-3 text-center text-sm text-slate-500">
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
            onFocus={scrollFieldIntoView}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            onFocus={scrollFieldIntoView}
          />

          <View className="mt-2">
            <Button label="Sign In" onPress={onSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
