import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { router } from 'expo-router';
import {
  Boxes,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Settings2,
  Shield,
  UserRound,
} from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Item = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  show?: boolean;
};

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { profile, roles, isAdmin, hasPermission, signOut } = useAuth();

  const items: Item[] = [
    { label: 'Dashboard', href: '/(app)/dashboard', icon: LayoutDashboard, show: true },
    { label: 'Product Catalog', href: '/(app)/catalog', icon: PackageSearch, show: true },
    {
      label: 'Masters',
      href: '/(app)/masters',
      icon: Settings2,
      show: isAdmin || hasPermission('masters.manage') || hasPermission('products.manage'),
    },
    {
      label: 'Inventory / Stock',
      href: '/(app)/inventory',
      icon: Boxes,
      show: isAdmin || hasPermission('inventory.manage'),
    },
    {
      label: 'Sales Reconcile',
      href: '/(app)/sales',
      icon: ClipboardList,
      show: isAdmin || hasPermission('sales.reconcile'),
    },
    {
      label: 'Reports',
      href: '/(app)/reports',
      icon: FileBarChart2,
      show: isAdmin || hasPermission('reports.export'),
    },
    {
      label: 'Users & Access',
      href: '/(app)/rbac',
      icon: Shield,
      show:
        isAdmin ||
        hasPermission('users.manage') ||
        hasPermission('rbac.manage') ||
        hasPermission('audit.view'),
    },
  ];

  const active = props.state.routes[props.state.index]?.name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View
          style={{
            backgroundColor: colors.maroon,
            paddingHorizontal: 20,
            paddingTop: 48,
            paddingBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image
              source={require('../../assets/images/kason-ghar-logo.jpg')}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                {profile?.full_name ?? 'কছন ঘৰ'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                {profile?.phone ?? ''}
              </Text>
              <Text style={{ color: colors.mugaSoft, fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                {(roles[0] ?? 'user').replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
          {items
            .filter((i) => i.show !== false)
            .map((item) => {
              const routeName = item.href.split('/').pop()!;
              const focused = active === routeName;
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => {
                    router.push(item.href as any);
                    props.navigation.closeDrawer();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: focused ? 'rgba(107,30,42,0.1)' : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  <Icon color={focused ? colors.maroon : colors.ink} size={22} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: focused ? '700' : '500',
                      color: focused ? colors.maroon : colors.ink,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </DrawerContentScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
        <Pressable
          onPress={() => {
            props.navigation.closeDrawer();
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}
        >
          <UserRound color={colors.maroon} size={20} />
          <Text style={{ color: colors.ink, fontWeight: '600' }}>Profile</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.maroon,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
          }}
        >
          <LogOut color="#fff" size={20} />
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
