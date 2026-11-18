import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AnimatedSplash } from '@/components/splash/AnimatedSplash';
import { useAuth } from '@/lib/auth';

export default function SplashGate() {
  const { session, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  const onSplashFinished = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Keep splash visible until both animation and auth bootstrap finish
  if (!splashDone || loading) {
    return <AnimatedSplash onFinished={onSplashFinished} />;
  }

  if (session) return <Redirect href="/(app)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}
