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
  Wallet,
} from 'lucide-react-native';
import { KpiCard } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
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

const ADMIN_SHORTCUTS = [
  { label: 'Notices', href: '/(app)/notifications', icon: Bell, color: colors.muga },
  { label: 'Catalog', href: '/(app)/catalog', icon: PackageSearch, color: colors.royal },
  { label: 'Masters', href: '/(app)/masters', icon: Settings2, color: '#7C3AED' },
  { label: 'Stock', href: '/(app)/inventory', icon: Boxes, color: '#0D9488' },
  { label: 'Sales', href: '/(app)/sales', icon: ClipboardList, color: '#DB2777' },
  { label: 'Accounts', href: '/(app)/accounts', icon: Wallet, color: '#CA8A04' },
  { label: 'Reports', href: '/(app)/reports', icon: FileBarChart2, color: colors.royal },
  { label: 'Admin', href: '/(app)/rbac', icon: Shield, color: '#475569' },
] as const;

const SELLER_SHORTCUTS = [
  { label: 'Notices', href: '/(app)/notifications', icon: Bell, color: colors.muga },
  { label: 'Catalog', href: '/(app)/catalog', icon: PackageSearch, color: colors.royal },
  { label: 'My Sales', href: '/(app)/sales', icon: ClipboardList, color: '#DB2777' },
  { label: 'Stock', href: '/(app)/inventory', icon: Boxes, color: '#0D9488' },
] as const;

export default function DashboardScreen() {
  const { profile, isAdmin, roles } = useAuth();
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

      if (isAdmin || roles.includes('super_admin')) {
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
  }, [isAdmin, period, profile?.user_id, roles]);

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

  const admin = isAdmin || roles.includes('super_admin');
  const shortcuts = admin ? ADMIN_SHORTCUTS : SELLER_SHORTCUTS;

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
        <Text className="text-2xl font-bold text-maroon">
          {brand.welcomeAs}, {profile?.full_name?.split(' ')[0] ?? 'User'}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          {brand.nameAs} · {profile?.phone} · {(roles[0] ?? 'staff').replace('_', ' ')}
        </Text>
      </View>

      <Toast message={error} />

      <Pressable
        className="mb-4 rounded-2xl bg-white p-4"
        onPress={() => router.push('/(app)/notifications')}
        style={{ borderLeftWidth: 4, borderLeftColor: colors.maroon }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${colors.muga}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell color={colors.muga} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-bold text-maroon">জাননী বোৰ্ড</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {unreadNotices > 0
                ? `${unreadNotices} new notice${unreadNotices === 1 ? '' : 's'} for you`
                : 'Open notice board'}
            </Text>
          </View>
        </View>
      </Pressable>

      {admin ? (
        <>
          <View className="mb-4 flex-row gap-2">
            {(
              [
                { key: 'day' as Period, label: 'Day', icon: Calendar },
                { key: 'month' as Period, label: 'Month', icon: CalendarDays },
                { key: 'fy' as Period, label: 'FY', icon: CalendarRange },
              ] as const
            ).map((p) => {
              const Icon = p.icon;
              const on = period === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPeriod(p.key)}
                  className="flex-1 items-center rounded-xl py-3"
                  style={{ backgroundColor: on ? colors.maroon : colors.white }}
                >
                  <Icon color={on ? '#fff' : colors.muted} size={20} />
                  <Text
                    className="mt-1 text-xs font-semibold"
                    style={{ color: on ? '#fff' : colors.muted }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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

      <Text className="mb-2 mt-2 text-base font-bold text-ink">Open with picture</Text>
      <View className="mb-4 flex-row flex-wrap justify-between">
        {shortcuts.map((item) => (
          <IconTile
            key={item.href}
            label={item.label}
            icon={item.icon}
            color={item.color}
            badge={item.href.includes('notifications') ? unreadNotices : null}
            onPress={() => router.push(item.href as any)}
            size="lg"
          />
        ))}
      </View>
    </Screen>
  );
}
