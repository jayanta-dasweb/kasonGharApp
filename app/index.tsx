import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { KasonLogo } from '@/components/logo/KasonLogo';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function SplashGate() {
  const { session, loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (loading || !minSplashDone) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <KasonLogo size={140} />
        <ActivityIndicator className="mt-8" color={colors.royal} size="large" />
      </View>
    );
  }

  if (session) return <Redirect href="/(app)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}
