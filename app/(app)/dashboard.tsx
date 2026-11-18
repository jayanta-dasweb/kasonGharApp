import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { KpiCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { searchSalespersonCatalog } from '@/services/catalog';
import {
  getConsignmentStockValue,
  getMyStock,
  getOfficeStockValue,
} from '@/services/inventory';
import { fetchReport, getKpiTotals } from '@/services/reports';

type Period = 'day' | 'month' | 'fy';

export default function DashboardScreen() {
  const { profile, isAdmin, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('fy');
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [officeValue, setOfficeValue] = useState(0);
  const [consignValue, setConsignValue] = useState(0);
  const [myStock, setMyStock] = useState<Awaited<ReturnType<typeof getMyStock>>>([]);
  const [search, setSearch] = useState('');
  const [searchHits, setSearchHits] = useState<Awaited<ReturnType<typeof searchSalespersonCatalog>>>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (isAdmin) {
        const [kpi, office, consign, report] = await Promise.all([
          getKpiTotals(),
          getOfficeStockValue(),
          getConsignmentStockValue(),
          fetchReport(period),
        ]);
        setRevenue(kpi.totalRevenue);
        setProfit(kpi.netProfit);
        setOfficeValue(office);
        setConsignValue(consign);

        if (report.length) {
          const row = report[0] as {
            total_revenue?: number;
            net_profit?: number;
          };
          if (period !== 'fy') {
            setRevenue(Number(row.total_revenue ?? revenue));
            setProfit(Number(row.net_profit ?? profit));
          }
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
  }, [isAdmin, period, profile?.user_id]);

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
      title={isAdmin ? 'Dashboard' : 'My Stock'}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      right={
        <Pressable onPress={() => signOut()} hitSlop={12} className="p-2">
          <LogOut color={colors.royal} size={22} />
        </Pressable>
      }
    >
      <Text className="mb-4 text-sm text-slate-500">
        {profile?.full_name ?? 'User'} · {profile?.phone ?? ''}
      </Text>
      <Toast message={error} />

      {isAdmin ? (
        <>
          <View className="mb-4 flex-row rounded-xl bg-white p-1">
            {(['day', 'month', 'fy'] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className="flex-1 items-center rounded-lg py-2"
                style={{
                  backgroundColor: period === p ? colors.royal : 'transparent',
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

          <View className="flex-row flex-wrap gap-2">
            <KpiCard title="Total Revenue" value={formatINR(revenue)} />
            <KpiCard title="Net Profit" value={formatINR(profit)} accent="muga" />
            <KpiCard title="Office Stock" value={formatINR(officeValue)} />
            <KpiCard title="Consignment" value={formatINR(consignValue)} accent="muga" />
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
            myStock.map((row, idx) => {
              const prod = row.master_products as {
                product_code: string;
                name: string;
                company_mrp: number;
              } | null;
              return (
                <View key={idx} className="mb-2 rounded-xl bg-white p-3">
                  <Text className="font-semibold text-royal">
                    {prod?.product_code} · Qty {row.quantity}
                  </Text>
                  <Text className="text-slate-700">{prod?.name}</Text>
                  <Text className="text-xs text-muga">
                    MRP {formatINR(prod?.company_mrp)}
                  </Text>
                </View>
              );
            })
          )}
        </>
      )}
    </Screen>
  );
}
