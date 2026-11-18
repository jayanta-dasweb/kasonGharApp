import { Redirect, Drawer } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppDrawerContent } from '@/components/navigation/AppDrawer';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <AppDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.maroon,
          headerTitleStyle: { fontWeight: '700', color: colors.maroon },
          drawerType: 'front',
          drawerStyle: { width: 300 },
          overlayColor: 'rgba(15,23,42,0.35)',
        }}
      >
        <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Drawer.Screen name="catalog" options={{ title: 'Product Catalog' }} />
        <Drawer.Screen name="masters" options={{ title: 'Masters' }} />
        <Drawer.Screen name="inventory" options={{ title: 'Inventory' }} />
        <Drawer.Screen name="sales" options={{ title: 'Sales Reconcile' }} />
        <Drawer.Screen name="reports" options={{ title: 'Reports' }} />
        <Drawer.Screen name="rbac" options={{ title: 'Users & RBAC' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
