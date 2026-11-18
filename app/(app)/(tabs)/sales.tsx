import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Building2, CheckCircle2, Store } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
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
      if (p[0]) setProductId(String(p[0].product_code ?? p[0].id));
      if (c[0]) setCustomerId(String(c[0].id ?? c[0].partner_id));
      if (u[0]) setSalespersonId(String(u[0].user_id));
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
        created_by: profile?.user_id,
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

      <SegmentStrip
        value={channel}
        onChange={setChannel}
        equal
        items={[
          { key: 'consignment', label: 'Seller sale', icon: Store },
          { key: 'office', label: 'Office sale', icon: Building2 },
        ]}
      />

      <View className="rounded-2xl bg-white p-4">
        <Text className="mb-2 text-sm font-medium text-slate-600">Product</Text>
        {products.slice(0, 20).map((p) => {
          const id = String(p.product_code ?? p.id);
          return (
          <Pressable key={id} onPress={() => setProductId(id)} className="mb-1 py-2">
            <Text style={{ color: productId === id ? colors.royal : colors.ink }}>
              {productId === id ? '● ' : '○ '}
              {p.product_code} · {p.name ?? p.product_name}
            </Text>
          </Pressable>
          );
        })}

        {channel === 'consignment' ? (
          <>
            <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Salesperson</Text>
            {users.map((u) => {
              const id = String(u.user_id);
              return (
              <Pressable
                key={id}
                onPress={() => setSalespersonId(id)}
                className="mb-1 py-2"
              >
                <Text style={{ color: salespersonId === id ? colors.royal : colors.ink }}>
                  {salespersonId === id ? '● ' : '○ '}
                  {u.full_name}
                </Text>
              </Pressable>
              );
            })}
          </>
        ) : null}

        <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Customer</Text>
        {customers.map((c) => {
          const id = String(c.id ?? c.partner_id);
          return (
          <Pressable key={id} onPress={() => setCustomerId(id)} className="mb-1 py-2">
            <Text style={{ color: customerId === id ? colors.royal : colors.ink }}>
              {customerId === id ? '● ' : '○ '}
              {c.name ?? c.partner_name}
            </Text>
          </Pressable>
          );
        })}

        <Input label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input
          label="Actual Sale Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Button
          icon={CheckCircle2}
          label="Post Sale & Ledger"
          onPress={onSubmit}
          loading={saving}
        />
      </View>
    </Screen>
  );
}
