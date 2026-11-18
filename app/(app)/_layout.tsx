import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={colors.maroon} size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.maroon,
        headerTitleStyle: { fontWeight: '700', color: colors.maroon },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Back header only — page title comes from Screen (no double title) */}
      <Stack.Screen name="masters" options={{ title: 'Masters', headerTitle: '' }} />
      <Stack.Screen name="inventory" options={{ title: 'Inventory', headerTitle: '' }} />
      <Stack.Screen name="accounts" options={{ title: 'Accounts', headerTitle: '' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports', headerTitle: '' }} />
      <Stack.Screen name="rbac" options={{ title: 'Users & Access', headerTitle: '' }} />
      <Stack.Screen name="profile" options={{ title: 'My Profile', headerTitle: '' }} />
    </Stack>
  );
}
