import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR, formatNumber } from '@/lib/format';
import {
  exportRowsToCsv,
  exportRowsToXlsx,
  fetchReport,
  type ReportPeriod,
} from '@/services/reports';
import { listLocations } from '@/services/masters';
import { supabase } from '@/lib/supabase';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Day-wise' },
  { key: 'month', label: 'Month-wise' },
  { key: 'fy', label: 'FY-wise' },
  { key: 'salesperson', label: 'Salesperson' },
];

export default function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('salesperson');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [stockRows, setStockRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const revenue = rows.reduce(
      (s, r: any) => s + Number(r.total_sales_value ?? r.total_revenue ?? 0),
      0
    );
    const qty = rows.reduce(
      (s, r: any) => s + Number(r.total_sold_qty ?? r.total_qty ?? r.stock_in_hand_qty ?? 0),
      0
    );
    return { revenue, qty };
  }, [rows]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, locs] = await Promise.all([
        fetchReport(period),
        listLocations().catch(() => []),
      ]);
      setRows(data as Record<string, unknown>[]);

      // Inventory snapshot by location
      const { data: quants } = await supabase.from('stock_quants').select('*');
      const byLoc = new Map<number, number>();
      for (const q of quants ?? []) {
        const id = Number((q as any).location_id);
        byLoc.set(id, (byLoc.get(id) ?? 0) + Number((q as any).quantity ?? 0));
      }
      setStockRows(
        locs.map((l: any) => ({
          ...l,
          qty: byLoc.get(Number(l.id)) ?? 0,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report load failed');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  return (
    <Screen title="Reports & Control" loading={loading}>
      <Toast message={error} />

      <View className="mb-3 rounded-2xl bg-white p-4">
        <Text className="text-sm font-semibold text-maroon">Period summary</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Revenue {formatINR(totals.revenue)} · Qty {formatNumber(totals.qty)}
        </Text>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => {
              setPeriod(p.key);
              setLoading(true);
            }}
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: period === p.key ? colors.maroon : colors.white }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: period === p.key ? '#fff' : colors.muted }}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-4 flex-row gap-2">
        <View className="flex-1">
          <Button
            label="Excel"
            variant="secondary"
            onPress={async () => {
              try {
                await exportRowsToXlsx(rows, `kason-${period}`);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Excel export failed');
              }
            }}
          />
        </View>
        <View className="flex-1">
          <Button
            label="CSV Share"
            variant="ghost"
            onPress={async () => {
              try {
                await exportRowsToCsv(rows, `kason-${period}`);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'CSV export failed');
              }
            }}
          />
        </View>
      </View>

      <Text className="mb-2 text-base font-bold text-ink">Sales / performance</Text>
      {rows.length === 0 ? (
        <Text className="mb-4 text-slate-500">No sales rows for this period yet.</Text>
      ) : (
        rows.map((row, idx) => (
          <View key={idx} className="mb-2 rounded-xl bg-white p-3">
            {Object.entries(row).map(([k, v]) => (
              <Text key={k} className="text-xs text-slate-600">
                <Text className="font-semibold text-ink">{k}: </Text>
                {typeof v === 'number' && /revenue|profit|cogs|price|value|sales/i.test(k)
                  ? formatINR(v)
                  : String(v)}
              </Text>
            ))}
          </View>
        ))
      )}

      <Text className="mb-2 mt-4 text-base font-bold text-ink">Inventory by location</Text>
      {stockRows.map((l) => (
        <View key={String(l.id)} className="mb-2 rounded-xl bg-white p-3">
          <Text className="font-semibold text-ink">
            {l.code} · {l.name}
          </Text>
          <Text className="text-xs text-slate-500">
            {l.usage} · Qty on hand {formatNumber(l.qty)} ·{' '}
            {l.is_active === false ? 'INACTIVE' : 'ACTIVE'}
          </Text>
        </View>
      ))}
    </Screen>
  );
}
