import { Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Boxes,
  FileBarChart2,
  Settings2,
  Shield,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function MoreScreen() {
  const { isAdmin, isSuperAdmin, hasPermission } = useAuth();

  const rows = [
    {
      label: 'My Profile',
      subtitle: 'Change your password',
      href: '/(app)/profile',
      icon: UserRound,
      color: colors.maroon,
      show: true,
    },
    {
      label: 'Masters',
      subtitle: 'Products, partners, locations (not roles)',
      href: '/(app)/masters',
      icon: Settings2,
      color: '#7C3AED',
      show: isAdmin || hasPermission('masters.manage') || hasPermission('products.manage'),
    },
    {
      label: 'Inventory / Stock',
      subtitle: 'Purchase, allocate, return',
      href: '/(app)/inventory',
      icon: Boxes,
      color: '#0D9488',
      show: isAdmin || hasPermission('inventory.manage'),
    },
    {
      label: 'Accounts Ledger',
      subtitle: 'Bills, expenses, journal',
      href: '/(app)/accounts',
      icon: Wallet,
      color: '#CA8A04',
      show: isAdmin || hasPermission('accounts.manage') || hasPermission('reports.export'),
    },
    {
      label: 'Reports',
      subtitle: 'Sales & stock reports',
      href: '/(app)/reports',
      icon: FileBarChart2,
      color: colors.royal,
      show:
        isAdmin ||
        hasPermission('reports.export') ||
        hasPermission('reports.own'),
    },
    {
      label: 'Users & Access',
      subtitle: 'Roles, staff, security — Super Admin only',
      href: '/(app)/rbac',
      icon: Shield,
      color: '#475569',
      show: isSuperAdmin || hasPermission('rbac.manage') || hasPermission('users.manage'),
    },
  ].filter((r) => r.show);

  return (
    <Screen title="More">
      <Text className="mb-3 text-sm text-slate-500">
        {brand.nameAs} · tap a big row to open
      </Text>
      {rows.length === 0 ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="text-slate-500">No extra tools for your role.</Text>
        </View>
      ) : (
        rows.map((r) => (
          <NavRow
            key={r.href}
            label={r.label}
            subtitle={r.subtitle}
            icon={r.icon}
            color={r.color}
            onPress={() => router.push(r.href as any)}
          />
        ))
      )}
    </Screen>
  );
}
