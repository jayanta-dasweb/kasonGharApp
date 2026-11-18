import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Boxes,
  ClipboardList,
  FileBarChart2,
  PackageSearch,
  Settings2,
  Shield,
} from 'lucide-react-native';
import { KpiCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR, formatNumber } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { searchSalespersonCatalog } from '@/services/catalog';
import {
  getConsignmentStockValue,
  getMyStock,
  getOfficeStockValue,
} from '@/services/inventory';
import { fetchReport, getKpiTotals } from '@/services/reports';

type Period = 'day' | 'month' | 'fy';

const SHORTCUTS = [
  { label: 'Catalog', href: '/(app)/catalog', icon: PackageSearch },
  { label: 'Masters', href: '/(app)/masters', icon: Settings2 },
  { label: 'Stock', href: '/(app)/inventory', icon: Boxes },
  { label: 'Sales', href: '/(app)/sales', icon: ClipboardList },
  { label: 'Reports', href: '/(app)/reports', icon: FileBarChart2 },
  { label: 'Admin', href: '/(app)/rbac', icon: Shield },
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

  const load = useCallback(async () => {
    setError(null);
    try {
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
        const report = results[3].status === 'fulfilled' ? results[3].value : [];
        const sp = results[4].status === 'fulfilled' ? results[4].value : [];

        setRevenue(Number(kpi?.totalRevenue ?? 0));
        setProfit(Number(kpi?.netProfit ?? 0));
        setOfficeValue(Number(office ?? 0));
        setConsignValue(Number(consign ?? 0));
        setSoldQty(
          (sp as any[]).reduce((s, r) => s + Number(r.total_sold_qty ?? 0), 0)
        );

        if (report.length && period !== 'fy') {
          const row = report[0] as any;
          setRevenue(Number(row.total_revenue ?? row.total_sales_value ?? 0));
          setProfit(Number(row.net_profit ?? 0));
        }

        const failed = results.find((r) => r.status === 'rejected');
        if (failed && failed.status === 'rejected') {
          // Soft warning only — KPIs still show zeros
          console.warn('[dashboard]', failed.reason);
        }
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
          Namaskar, {profile?.full_name?.split(' ')[0] ?? 'User'}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          {profile?.phone} · {(roles[0] ?? 'staff').replace('_', ' ')}
        </Text>
      </View>

      <Toast message={error} />

      {(isAdmin || roles.includes('super_admin')) ? (
        <>
          <View className="mb-4 flex-row rounded-xl bg-white p-1">
            {(['day', 'month', 'fy'] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className="flex-1 items-center rounded-lg py-2"
                style={{
                  backgroundColor: period === p ? colors.maroon : 'transparent',
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: period === p ? '#fff' : colors.muted }}
                >
                  {p === 'day' ? 'Day' : p === 'month' ? 'Month' : 'FY'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mb-4 flex-row flex-wrap gap-2">
            <KpiCard title="Total Revenue" value={formatINR(revenue)} />
            <KpiCard title="Net Profit" value={formatINR(profit)} accent="muga" />
            <KpiCard title="Office Stock" value={formatINR(officeValue)} />
            <KpiCard title="Consignment" value={formatINR(consignValue)} accent="muga" />
          </View>

          <Text className="mb-2 text-xs text-slate-500">
            Sold qty (all salespeople): {formatNumber(soldQty)}
          </Text>

          <Text className="mb-2 mt-2 text-base font-bold text-ink">Modules</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  className="mb-1 w-[31%] items-center rounded-2xl bg-white px-2 py-4"
                >
                  <Icon color={colors.maroon} size={24} />
                  <Text className="mt-2 text-center text-xs font-semibold text-ink">
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Input
            label="Quick product search"
            value={search}
            onChangeText={onSearch}
            placeholder="Code, fabric, color…"
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

          <Text className="mb-2 mt-4 text-base font-bold text-ink">
            My Assigned Stock in Hand
          </Text>
          {myStock.length === 0 ? (
            <Text className="text-slate-500">No stock assigned.</Text>
          ) : (
            myStock.map((row: any, idx) => (
              <View key={idx} className="mb-2 rounded-xl bg-white p-3">
                <Text className="font-semibold text-royal">
                  Qty {row.quantity ?? row.qty}
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
