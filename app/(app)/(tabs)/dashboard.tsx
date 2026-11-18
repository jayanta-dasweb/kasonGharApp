import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Bell,
  Boxes,
  Calendar,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileBarChart2,
  IndianRupee,
  Package,
  PackageSearch,
  Search,
  Settings2,
  Shield,
  TrendingUp,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { KpiCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { Toast } from '@/components/ui/Toast';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { formatINR, formatNumber } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { searchSalespersonCatalog } from '@/services/catalog';
import {
  getConsignmentStockValue,
  getMyStock,
  getOfficeStockValue,
} from '@/services/inventory';
import { countUnread } from '@/services/notifications';
import { fetchReport, getKpiTotals } from '@/services/reports';

type Period = 'day' | 'month' | 'fy';

export default function DashboardScreen() {
  const { profile, isAdmin, isSuperAdmin, roles, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('fy');
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [officeValue, setOfficeValue] = useState(0);
  const [consignValue, setConsignValue] = useState(0);
  const [soldQty, setSoldQty] = useState(0);
  const [myStock, setMyStock] = useState<Awaited<ReturnType<typeof getMyStock>>>([]);
  const [search, setSearch] = useState('');
  const [searchHits, setSearchHits] = useState<
    Awaited<ReturnType<typeof searchSalespersonCatalog>>
  >([]);
  const [unreadNotices, setUnreadNotices] = useState(0);

  const admin = isAdmin || roles.includes('super_admin');

  const load = useCallback(async () => {
    setError(null);
    try {
      if (profile?.user_id) {
        try {
          const n = await countUnread({
            userId: profile.user_id,
            roles: roles.length ? roles : ['salesperson'],
          });
          setUnreadNotices(n);
        } catch {
          setUnreadNotices(0);
        }
      }

      if (admin) {
        const results = await Promise.allSettled([
          getKpiTotals(),
          getOfficeStockValue(),
          getConsignmentStockValue(),
          fetchReport(period),
          fetchReport('salesperson'),
        ]);

        const kpi = results[0].status === 'fulfilled' ? results[0].value : null;
        const office = results[1].status === 'fulfilled' ? results[1].value : 0;
        const consign = results[2].status === 'fulfilled' ? results[2].value : 0;
        const sp = results[4].status === 'fulfilled' ? results[4].value : [];

        setRevenue(Number(kpi?.totalRevenue ?? 0));
        setProfit(Number(kpi?.netProfit ?? 0));
        setOfficeValue(Number(office ?? 0));
        setConsignValue(Number(consign ?? 0));
        setSoldQty(
          (sp as any[]).reduce((s, r) => s + Number(r.total_sold_qty ?? 0), 0)
        );
      } else if (profile?.user_id) {
        const stock = await getMyStock(profile.user_id);
        setMyStock(stock);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [admin, period, profile?.user_id, roles]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) {
      setSearchHits([]);
      return;
    }
    try {
      const hits = await searchSalespersonCatalog(q);
      setSearchHits(hits);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    }
  };

  const quickLinks = [
    {
      label: 'Notice Board',
      subtitle: unreadNotices > 0 ? `${unreadNotices} new` : 'Open notice board',
      href: '/(app)/(tabs)/notifications',
      icon: Bell,
      color: colors.muga,
      badge: unreadNotices,
      show: true,
    },
    {
      label: 'Product Catalog',
      subtitle: 'Browse Mekhela Chador',
      href: '/(app)/(tabs)/catalog',
      icon: PackageSearch,
      color: colors.royal,
      show: true,
    },
    {
      label: 'Sales Reconcile',
      subtitle: 'Post seller / office sale',
      href: '/(app)/(tabs)/sales',
      icon: ClipboardList,
      color: '#DB2777',
      show: admin || hasPermission('sales.reconcile'),
    },
    {
      label: 'Inventory / Stock',
      subtitle: 'Purchase · allocate · return',
      href: '/(app)/inventory',
      icon: Boxes,
      color: '#0D9488',
      show: admin || hasPermission('inventory.manage'),
    },
    {
      label: 'Accounts',
      subtitle: 'Ledger & expenses',
      href: '/(app)/accounts',
      icon: Wallet,
      color: '#CA8A04',
      show: admin || hasPermission('accounts.manage') || hasPermission('reports.export'),
    },
    {
      label: 'Masters',
      subtitle: 'Products, partners, CoA',
      href: '/(app)/masters',
      icon: Settings2,
      color: '#7C3AED',
      show: admin || hasPermission('masters.manage') || hasPermission('products.manage'),
    },
    {
      label: 'Reports',
      subtitle: 'Sales & stock',
      href: '/(app)/reports',
      icon: FileBarChart2,
      color: colors.royal,
      show: admin || hasPermission('reports.export') || hasPermission('reports.own'),
    },
    {
      label: 'Users & Access',
      subtitle: 'Roles & security — Super Admin only',
      href: '/(app)/rbac',
      icon: Shield,
      color: '#475569',
      show: isSuperAdmin || hasPermission('rbac.manage') || hasPermission('users.manage'),
    },
    {
      label: 'My Profile',
      subtitle: 'Change password',
      href: '/(app)/profile',
      icon: UserRound,
      color: colors.maroon,
      show: true,
    },
  ].filter((r) => r.show);

  return (
    <Screen
      title=""
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <View className="mb-4">
        <Text className="text-2xl font-bold text-maroon" style={{ letterSpacing: 0 }}>
          {brand.welcomeAs}, {profile?.full_name?.split(' ')[0] ?? 'User'}
        </Text>
        <Text className="mt-1 text-sm text-slate-500" style={{ letterSpacing: 0 }}>
          {brand.nameAsParts.ka}
          {brand.nameAsParts.son} {brand.nameAsParts.ghar} · {brand.nameEn}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-400">
          {profile?.phone} · {(roles[0] ?? 'staff').replace('_', ' ')}
        </Text>
      </View>

      <Toast message={error} />

      {admin ? (
        <>
          <SegmentStrip
            value={period}
            onChange={setPeriod}
            equal
            items={[
              { key: 'day', label: 'Day', icon: Calendar },
              { key: 'month', label: 'Month', icon: CalendarDays },
              { key: 'fy', label: 'FY', icon: CalendarRange },
            ]}
          />

          <View className="mb-4 flex-row flex-wrap gap-2">
            <KpiCard title="Total Revenue" value={formatINR(revenue)} icon={IndianRupee} />
            <KpiCard title="Net Profit" value={formatINR(profit)} accent="muga" icon={TrendingUp} />
            <KpiCard title="Office Stock" value={formatINR(officeValue)} icon={Package} />
            <KpiCard
              title="Consignment"
              value={formatINR(consignValue)}
              accent="muga"
              icon={Truck}
            />
          </View>

          <Text className="mb-2 text-xs text-slate-500">
            Sold qty (all salespeople): {formatNumber(soldQty)}
          </Text>
        </>
      ) : (
        <>
          <Input
            label="Quick product search"
            value={search}
            onChangeText={onSearch}
            placeholder="Code, fabric, color…"
            icon={Search}
          />
          {searchHits.map((p) => (
            <View key={p.product_id} className="mb-2 rounded-xl bg-white p-3">
              <Text className="font-semibold text-royal">{p.product_code}</Text>
              <Text className="text-slate-700">{p.name}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                MRP {formatINR(p.company_mrp)} · Min {formatINR(p.min_selling_price)} · My qty{' '}
                {p.my_qty}
              </Text>
            </View>
          ))}

          <Text className="mb-2 mt-2 text-base font-bold text-ink">My Assigned Stock</Text>
          {myStock.length === 0 ? (
            <Text className="mb-3 text-slate-500">No stock assigned.</Text>
          ) : (
            myStock.map((row: any, idx) => (
              <View key={idx} className="mb-2 flex-row items-center rounded-xl bg-white p-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#0D948818',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Package color="#0D9488" size={22} />
                </View>
                <Text className="font-semibold text-royal">Qty {row.quantity ?? row.qty}</Text>
              </View>
            ))
          )}
        </>
      )}

      <Text className="mb-2 mt-2 text-base font-bold text-ink">Open (big tap)</Text>
      {quickLinks.map((item) => (
        <NavRow
          key={item.href}
          label={item.label}
          subtitle={item.subtitle}
          icon={item.icon}
          color={item.color}
          badge={item.badge}
          onPress={() => router.push(item.href as any)}
        />
      ))}

      <Pressable onPress={() => router.push('/(app)/(tabs)/more')} className="mt-2 py-3">
        <Text className="text-center text-sm font-semibold text-maroon">See all tools →</Text>
      </Pressable>
    </Screen>
  );
}
