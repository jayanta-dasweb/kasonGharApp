import { router } from 'expo-router';
import {
  Boxes,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Settings2,
  Shield,
  Wallet,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Item = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  show?: boolean;
};

export function BurgerButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
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
      label: 'Accounts Ledger',
      href: '/(app)/accounts',
      icon: Wallet,
      show:
        isAdmin ||
        hasPermission('accounts.manage') ||
        hasPermission('accounting.manage') ||
        hasPermission('reports.export'),
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
      label: 'Users & RBAC',
      href: '/(app)/rbac',
      icon: Shield,
      show:
        isAdmin ||
        hasPermission('users.manage') ||
        hasPermission('rbac.manage') ||
        hasPermission('audit.view'),
    },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={12}
        style={{ padding: 8 }}
        accessibilityLabel="Open menu"
      >
        <Menu color={colors.maroon} size={26} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View
            style={{
              width: 300,
              backgroundColor: colors.cream,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            }}
          >
            <View
              style={{
                backgroundColor: colors.maroon,
                paddingHorizontal: 16,
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Image
                source={require('../../assets/images/kason-ghar-logo.jpg')}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {profile?.full_name ?? 'Kason Ghar'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {profile?.phone}
                </Text>
                <Text style={{ color: colors.mugaSoft, fontSize: 11, marginTop: 2 }}>
                  {(roles[0] ?? 'user').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)}>
                <X color="#fff" size={22} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {items
                .filter((i) => i.show !== false)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => {
                        setOpen(false);
                        router.push(item.href as any);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginBottom: 4,
                        backgroundColor: '#fff',
                      }}
                    >
                      <Icon color={colors.maroon} size={22} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>

            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Pressable
                onPress={async () => {
                  setOpen(false);
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
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
}
