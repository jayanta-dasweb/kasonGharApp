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
import { Lock, LogIn, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssameseBrandName } from '@/components/brand/AssameseBrandName';
import { KasonLogo } from '@/components/logo/KasonLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { session, signInWithPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewType>(null);

  if (session) return <Redirect href="/(app)/(tabs)/dashboard" />;

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
            <View className="mt-3">
              <AssameseBrandName size={28} />
            </View>
            <Text className="mt-1 text-center text-xs text-slate-400">
              {brand.loginSubtitleEn}
            </Text>
            <Text className="mt-1 text-center text-[10px] text-slate-300">
              {brand.bundleStamp}
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
            icon={Phone}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            onFocus={scrollFieldIntoView}
            icon={Lock}
          />

          <View className="mt-2">
            <Button icon={LogIn} label="Sign In" onPress={onSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
