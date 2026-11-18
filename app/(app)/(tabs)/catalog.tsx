import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { searchAdminCatalog, searchSalespersonCatalog } from '@/services/catalog';

export default function CatalogScreen() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q = search) => {
      setError(null);
      try {
        const data = isAdmin
          ? await searchAdminCatalog(q)
          : await searchSalespersonCatalog(q);
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Catalog load failed');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, search]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load('');
    }, [load])
  );

  const onSearch = async (q: string) => {
    setSearch(q);
    setLoading(true);
    await load(q);
  };

  return (
    <Screen title="Product Catalog" loading={loading}>
      <Toast message={error} />
      <Input
        label="Search"
        value={search}
        onChangeText={onSearch}
        placeholder="product code or name"
      />

      {rows.length === 0 && !error ? (
        <View className="mt-6 rounded-2xl bg-white p-4">
          <Text className="text-base font-semibold text-maroon">No products yet</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Open Masters from the menu (☰) and add Categories / Products first.
          </Text>
        </View>
      ) : null}

      {rows.map((p) => (
        <View key={p.product_code} className="mb-3 rounded-2xl bg-white p-4">
          <Text className="text-base font-bold text-maroon">
            {p.product_code} · {p.product_name ?? p.name}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {[p.category_name, p.fabric_name, p.weave_name, p.color]
              .filter(Boolean)
              .join(' · ') || '—'}
          </Text>
          <Text className="mt-2 text-sm text-ink">
            MRP {formatINR(p.company_mrp)} · Min {formatINR(p.min_selling_price)}
          </Text>
          {isAdmin && p.vendor_cost_price != null ? (
            <Text className="mt-1 text-sm text-muga">
              Vendor cost {formatINR(p.vendor_cost_price)}
            </Text>
          ) : null}
          {!isAdmin ? (
            <Text className="mt-1 text-xs text-slate-600">
              Office {p.office_qty ?? 0} · Mine {p.my_qty ?? 0}
            </Text>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}
