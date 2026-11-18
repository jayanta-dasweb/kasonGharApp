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
import {
  allocateToSalesperson,
  createVendorPurchase,
  returnFromSalesperson,
} from '@/services/inventory';
import { listUsers } from '@/services/rbac';

type Mode = 'purchase' | 'allocate' | 'return';

export default function InventoryScreen() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>('purchase');
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [invoice, setInvoice] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [salespersonId, setSalespersonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [v, p, u] = await Promise.all([
        listPartners('vendor'),
        listProducts(),
        listUsers(),
      ]);
      setVendors(v);
      setProducts(p);
      setUsers(u);
      if (v[0]) setVendorId(String(v[0].id ?? v[0].partner_id));
      if (p[0]) setProductId(String(p[0].product_code ?? p[0].id));
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
      if (mode === 'purchase') {
        await createVendorPurchase({
          vendor_id: vendorId,
          invoice_number: invoice,
          created_by: profile?.user_id,
          lines: [
            {
              product_id: productId,
              quantity: Number(qty),
              unit_cost: Number(unitCost),
            },
          ],
        });
        setOk('Purchase posted: stock_move DONE + IN_BILL');
      } else if (mode === 'allocate') {
        await allocateToSalesperson({
          product_id: productId,
          quantity: Number(qty),
          salesperson_user_id: salespersonId,
          created_by: profile?.user_id,
        });
        setOk('Stock allocated to salesperson');
      } else {
        await returnFromSalesperson({
          product_id: productId,
          quantity: Number(qty),
          salesperson_user_id: salespersonId,
          created_by: profile?.user_id,
        });
        setOk('Unsold stock returned to office');
      }
      setInvoice('');
      setQty('1');
      setUnitCost('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Inventory" loading={loading}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 flex-row gap-2">
        {(
          [
            ['purchase', 'Purchase'],
            ['allocate', 'Allocate'],
            ['return', 'Return'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setMode(key)}
            className="flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: mode === key ? colors.royal : colors.white }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: mode === key ? '#fff' : colors.muted }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="rounded-2xl bg-white p-4">
        {mode === 'purchase' ? (
          <>
            <Text className="mb-2 text-sm font-medium text-slate-600">Vendor</Text>
            {vendors.map((v) => {
              const id = String(v.id ?? v.partner_id);
              return (
              <Pressable key={id} onPress={() => setVendorId(id)} className="mb-1 py-2">
                <Text style={{ color: vendorId === id ? colors.royal : colors.ink }}>
                  {vendorId === id ? '● ' : '○ '}
                  {v.name ?? v.partner_name}
                </Text>
              </Pressable>
              );
            })}
            <Input label="Invoice No" value={invoice} onChangeText={setInvoice} />
            <Input
              label="Unit Cost"
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <Text className="mb-2 text-sm font-medium text-slate-600">Salesperson</Text>
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
        )}

        <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Product</Text>
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

        <Input label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Button label="Commit to Supabase" onPress={onSubmit} loading={saving} />
      </View>
    </Screen>
  );
}
