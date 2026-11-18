import { router } from 'expo-router';
import {
  Bell,
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
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Item = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  color: string;
  show?: boolean;
};

export function BurgerButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { profile, roles, isAdmin, hasPermission, signOut } = useAuth();

  const items: Item[] = [
    {
      label: 'Dashboard',
      href: '/(app)/dashboard',
      icon: LayoutDashboard,
      color: colors.maroon,
      show: true,
    },
    {
      label: 'জাননী বোৰ্ড',
      href: '/(app)/notifications',
      icon: Bell,
      color: colors.muga,
      show: true,
    },
    {
      label: 'Product Catalog',
      href: '/(app)/catalog',
      icon: PackageSearch,
      color: colors.royal,
      show: true,
    },
    {
      label: 'Masters',
      href: '/(app)/masters',
      icon: Settings2,
      color: '#7C3AED',
      show: isAdmin || hasPermission('masters.manage') || hasPermission('products.manage'),
    },
    {
      label: 'Inventory / Stock',
      href: '/(app)/inventory',
      icon: Boxes,
      color: '#0D9488',
      show: isAdmin || hasPermission('inventory.manage'),
    },
    {
      label: 'Accounts Ledger',
      href: '/(app)/accounts',
      icon: Wallet,
      color: '#CA8A04',
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
      color: '#DB2777',
      show: isAdmin || hasPermission('sales.reconcile'),
    },
    {
      label: 'Reports',
      href: '/(app)/reports',
      icon: FileBarChart2,
      color: colors.royal,
      show: isAdmin || hasPermission('reports.export'),
    },
    {
      label: 'Users & Access',
      href: '/(app)/rbac',
      icon: Shield,
      color: '#475569',
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
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Menu color={colors.maroon} size={24} />
        </View>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View
            style={{
              width: 310,
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
                style={{ width: 52, height: 52, borderRadius: 26 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {profile?.full_name ?? brand.nameAs}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {brand.nameAs} · {profile?.phone}
                </Text>
                <Text style={{ color: colors.mugaSoft, fontSize: 11, marginTop: 2 }}>
                  {(roles[0] ?? 'user').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <X color="#fff" size={24} />
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
                        gap: 14,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        marginBottom: 8,
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: `${item.color}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon color={item.color} size={26} strokeWidth={2.25} />
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink }}>
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
                  router.replace('/(auth)/login' as any);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: colors.maroon,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                }}
              >
                <LogOut color="#fff" size={22} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sign out</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
            onPress={() => setOpen(false)}
          />
        </View>
      </Modal>
    </>
  );
}
