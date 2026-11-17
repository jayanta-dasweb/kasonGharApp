import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { searchAdminCatalog, searchSalespersonCatalog } from '@/services/catalog';
import { getQuantsForProduct } from '@/services/inventory';

export default function CatalogScreen() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quants, setQuants] = useState<any[]>([]);

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

  const toggleExpand = async (productId: string) => {
    if (expanded === productId) {
      setExpanded(null);
      return;
    }
    setExpanded(productId);
    try {
      const q = await getQuantsForProduct(productId);
      setQuants(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stock breakdown failed');
    }
  };

  return (
    <Screen title="Product Catalog" loading={loading}>
      <Toast message={error} />
      <Input
        label="Search"
        value={search}
        onChangeText={onSearch}
        placeholder="product_code, category, fabric, color"
      />

      {rows.map((p) => {
        const id = isAdmin ? p.id : p.product_id;
        return (
          <View key={id} className="mb-3 rounded-2xl bg-white p-4">
            <Text className="text-base font-bold text-royal">
              {p.product_code} · {p.name}
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              {[p.master_categories?.name ?? p.category, p.master_fabrics?.name ?? p.fabric, p.color]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text className="mt-2 text-sm text-ink">
              MRP {formatINR(p.company_mrp)} · Min {formatINR(p.min_selling_price)}
            </Text>
            {isAdmin ? (
              <>
                <Text className="mt-1 text-sm text-muga">
                  Vendor cost {formatINR(p.vendor_cost_price)}
                </Text>
                <Text
                  className="mt-2 text-sm font-semibold text-royal"
                  onPress={() => toggleExpand(id)}
                >
                  {expanded === id ? 'Hide stock' : 'Stock breakdown'}
                </Text>
                {expanded === id
                  ? quants.map((q) => (
                      <Text key={q.id} className="mt-1 text-xs text-slate-600">
                        {(q.stock_locations as any)?.name}: {q.quantity}
                      </Text>
                    ))
                  : null}
              </>
            ) : (
              <Text className="mt-1 text-xs text-slate-600">
                Office {p.office_qty} · Mine {p.my_qty}
              </Text>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
