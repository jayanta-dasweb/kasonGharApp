import { Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Boxes,
  FileBarChart2,
  Settings2,
  Shield,
  Wallet,
} from 'lucide-react-native';
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function MoreScreen() {
  const { isAdmin, hasPermission } = useAuth();

  const rows = [
    {
      label: 'Masters',
      subtitle: 'Products, partners, locations',
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
      show:
        isAdmin ||
        hasPermission('accounts.manage') ||
        hasPermission('accounting.manage') ||
        hasPermission('reports.export'),
    },
    {
      label: 'Reports',
      subtitle: 'Sales & stock reports',
      href: '/(app)/reports',
      icon: FileBarChart2,
      color: colors.royal,
      show: isAdmin || hasPermission('reports.export'),
    },
    {
      label: 'Users & Access',
      subtitle: 'Staff, roles, audit',
      href: '/(app)/rbac',
      icon: Shield,
      color: '#475569',
      show:
        isAdmin ||
        hasPermission('users.manage') ||
        hasPermission('rbac.manage') ||
        hasPermission('audit.view'),
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
