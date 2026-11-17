import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { listPartners, listProducts } from '@/services/masters';
import { listUsers } from '@/services/rbac';
import { createSalesReconciliation } from '@/services/sales';

export default function SalesScreen() {
  const { profile } = useAuth();
  const [channel, setChannel] = useState<'consignment' | 'office'>('consignment');
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [salespersonId, setSalespersonId] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c, u] = await Promise.all([
        listProducts(),
        listPartners('customer'),
        listUsers(),
      ]);
      setProducts(p);
      setCustomers(c);
      setUsers(u);
      if (p[0]) setProductId(p[0].id);
      if (c[0]) setCustomerId(c[0].id);
      if (u[0]) setSalespersonId(u[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onSubmit = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await createSalesReconciliation({
        product_id: productId,
        quantity: Number(qty),
        sale_price: Number(price),
        channel,
        customer_id: customerId,
        salesperson_id: channel === 'consignment' ? salespersonId : null,
        created_by: profile?.id,
      });
      setOk('Sale reconciled: stock + OUT_INVOICE + sales_reconciliation');
      setQty('1');
      setPrice('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reconciliation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Sales Reconcile" loading={loading}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 flex-row gap-2">
        {(['consignment', 'office'] as const).map((c) => (
          <Pressable
            key={c}
            onPress={() => setChannel(c)}
            className="flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: channel === c ? colors.muga : colors.white }}
          >
            <Text
              className="text-sm font-semibold capitalize"
              style={{ color: channel === c ? '#fff' : colors.muted }}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="rounded-2xl bg-white p-4">
        <Text className="mb-2 text-sm font-medium text-slate-600">Product</Text>
        {products.slice(0, 20).map((p) => (
          <Pressable key={p.id} onPress={() => setProductId(p.id)} className="mb-1 py-2">
            <Text style={{ color: productId === p.id ? colors.royal : colors.ink }}>
              {productId === p.id ? '● ' : '○ '}
              {p.product_code} · {p.name}
            </Text>
          </Pressable>
        ))}

        {channel === 'consignment' ? (
          <>
            <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Salesperson</Text>
            {users.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => setSalespersonId(u.id)}
                className="mb-1 py-2"
              >
                <Text style={{ color: salespersonId === u.id ? colors.royal : colors.ink }}>
                  {salespersonId === u.id ? '● ' : '○ '}
                  {u.full_name}
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Customer</Text>
        {customers.map((c) => (
          <Pressable key={c.id} onPress={() => setCustomerId(c.id)} className="mb-1 py-2">
            <Text style={{ color: customerId === c.id ? colors.royal : colors.ink }}>
              {customerId === c.id ? '● ' : '○ '}
              {c.name}
            </Text>
          </Pressable>
        ))}

        <Input label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input
          label="Actual Sale Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Button label="Post Sale & Ledger" onPress={onSubmit} loading={saving} />
      </View>
    </Screen>
  );
}
