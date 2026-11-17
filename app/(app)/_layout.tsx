import { Redirect, Tabs } from 'expo-router';
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  Settings2,
} from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { session, loading, isAdmin, hasPermission } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={colors.royal} size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  const canMasters = isAdmin || hasPermission('masters.manage') || hasPermission('products.manage');
  const canInventory = isAdmin || hasPermission('inventory.manage');
  const canSales = isAdmin || hasPermission('sales.reconcile');
  const canReports = isAdmin || hasPermission('reports.export');
  const canRbac =
    isAdmin ||
    hasPermission('users.manage') ||
    hasPermission('rbac.manage') ||
    hasPermission('audit.view');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.royal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }) => <PackageSearch color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="masters"
        options={{
          title: 'Masters',
          href: canMasters ? undefined : null,
          tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Stock',
          href: canInventory ? undefined : null,
          tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          href: canSales ? undefined : null,
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          href: canReports ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="rbac"
        options={{
          title: 'Admin',
          href: canRbac ? undefined : null,
        }}
      />
    </Tabs>
  );
}
