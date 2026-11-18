import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { BurgerButton } from '@/components/navigation/BurgerMenu';
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
        headerLeft: () => <BurgerButton />,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="catalog" options={{ title: 'Product Catalog' }} />
      <Stack.Screen name="masters" options={{ title: 'Masters' }} />
      <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
      <Stack.Screen name="sales" options={{ title: 'Sales Reconcile' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="rbac" options={{ title: 'Users & RBAC' }} />
    </Stack>
  );
}
