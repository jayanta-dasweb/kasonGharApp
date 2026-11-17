import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR } from '@/lib/format';
import {
  exportRowsToCsv,
  exportRowsToXlsx,
  fetchReport,
  type ReportPeriod,
} from '@/services/reports';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'fy', label: 'FY' },
  { key: 'salesperson', label: 'Salesperson' },
];

export default function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchReport(period);
      setRows(data as Record<string, unknown>[]);
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
    <Screen title="Reports" loading={loading}>
      <Toast message={error} />

      <View className="mb-4 flex-row flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => {
              setPeriod(p.key);
              setLoading(true);
            }}
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: period === p.key ? colors.royal : colors.white }}
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

      {rows.length === 0 ? (
        <Text className="text-slate-500">No rows for this period.</Text>
      ) : (
        rows.map((row, idx) => (
          <View key={idx} className="mb-2 rounded-xl bg-white p-3">
            {Object.entries(row).map(([k, v]) => (
              <Text key={k} className="text-xs text-slate-600">
                <Text className="font-semibold text-ink">{k}: </Text>
                {typeof v === 'number' && /revenue|profit|cogs|price/i.test(k)
                  ? formatINR(v)
                  : String(v)}
              </Text>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
