import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  ArrowLeftRight,
  Boxes,
  PackagePlus,
  ShoppingCart,
  Undo2,
  UserRound,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR, formatNumber } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { listLocations, listPartners, listProducts } from '@/services/masters';
import {
  allocateToSalesperson,
  createVendorPurchase,
  listRecentMoves,
  listStockQuants,
  returnFromSalesperson,
} from '@/services/inventory';
import { listUsers } from '@/services/rbac';

type Mode = 'stock' | 'purchase' | 'allocate' | 'return' | 'moves';

export default function InventoryScreen() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>('stock');
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [quants, setQuants] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
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
  const [hideZero, setHideZero] = useState(true);

  const load = useCallback(async () => {
    try {
      const [v, p, u, locs, qs, mv] = await Promise.all([
        listPartners('vendor'),
        listProducts(),
        listUsers(),
        listLocations(),
        listStockQuants().catch(() => []),
        listRecentMoves().catch(() => []),
      ]);
      setVendors(v);
      setProducts(p);
      setUsers(u.filter((x: any) => (x.status ?? 'ACTIVE') === 'ACTIVE'));
      setLocations(locs);
      setQuants(qs);
      setMoves(mv);
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

  const locName = (id: any) => {
    const hit = locations.find((l) => String(l.id ?? l.location_id) === String(id));
    return hit ? `${hit.code} · ${hit.name}` : String(id ?? '—');
  };

  const onSubmit = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      if (mode === 'purchase') {
        if (!invoice.trim()) throw new Error('Invoice number required');
        const result = await createVendorPurchase({
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
        setOk(
          result.accountMove
            ? `Purchase + IN_BILL posted (${formatINR(result.billAmount)})`
            : `Stock purchase posted (${formatINR(result.billAmount)}) — seed CoA for IN_BILL`
        );
      } else if (mode === 'allocate') {
        await allocateToSalesperson({
          product_id: productId,
          quantity: Number(qty),
          salesperson_user_id: salespersonId,
          created_by: profile?.user_id,
        });
        setOk('Stock allocated to salesperson');
      } else if (mode === 'return') {
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
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs: {
    key: Mode;
    label: string;
    icon: typeof Boxes;
    color: string;
  }[] = [
    { key: 'stock', label: 'On hand', icon: Boxes, color: '#0D9488' },
    { key: 'purchase', label: 'Purchase', icon: ShoppingCart, color: colors.royal },
    { key: 'allocate', label: 'Give seller', icon: PackagePlus, color: colors.muga },
    { key: 'return', label: 'Return', icon: Undo2, color: '#DB2777' },
    { key: 'moves', label: 'History', icon: ArrowLeftRight, color: '#475569' },
  ];

  return (
    <Screen title="Inventory Control" loading={loading}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 flex-row flex-wrap justify-between">
        {tabs.map((t) => (
          <IconTile
            key={t.key}
            label={t.label}
            icon={t.icon}
            color={t.color}
            active={mode === t.key}
            onPress={() => setMode(t.key)}
            size="sm"
          />
        ))}
      </View>

      {mode === 'stock' ? (
        <View>
          <Pressable className="mb-3" onPress={() => setHideZero((v) => !v)}>
            <Text className="text-xs font-semibold text-maroon">
              {hideZero ? 'Showing qty > 0 · tap to show all' : 'Showing all · tap to hide zeros'}
            </Text>
          </Pressable>
          {quants
            .filter((q) => !hideZero || Number(q.quantity ?? 0) > 0)
            .map((q, idx) => (
              <View
                key={String(q.quant_id ?? q.id ?? idx)}
                className="mb-2 rounded-xl bg-white p-3"
              >
                <Text className="font-semibold text-ink">
                  {q.product_code ?? q.product_id ?? 'SKU'}
                </Text>
                <Text className="text-xs text-slate-500">
                  {locName(q.location_id)} · Qty {formatNumber(q.quantity)} · Cost{' '}
                  {formatINR(q.unit_cost ?? 0)}
                </Text>
              </View>
            ))}
          {quants.length === 0 ? (
            <Text className="text-slate-500">
              No stock quants yet. Post a Purchase to create office stock.
            </Text>
          ) : null}
        </View>
      ) : null}

      {mode === 'moves' ? (
        <View>
          {moves.map((m, idx) => (
            <View key={String(m.move_id ?? m.id ?? idx)} className="mb-2 rounded-xl bg-white p-3">
              <Text className="font-semibold text-ink">
                {m.move_type ?? m.state ?? 'MOVE'} · Qty {formatNumber(m.quantity)}
              </Text>
              <Text className="text-xs text-slate-500">
                {m.product_code ?? m.product_id ?? 'SKU'} · {m.move_date ?? m.created_at}
              </Text>
              <Text className="text-[10px] text-slate-400">
                {locName(m.source_location_id)} → {locName(m.dest_location_id)}
                {m.reference ? ` · Ref ${m.reference}` : ''}
              </Text>
            </View>
          ))}
          {moves.length === 0 ? (
            <Text className="text-slate-500">No stock moves yet.</Text>
          ) : null}
        </View>
      ) : null}

      {mode === 'purchase' || mode === 'allocate' || mode === 'return' ? (
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
          {products.slice(0, 30).map((p) => {
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
          <Button
            icon={
              mode === 'purchase'
                ? ShoppingCart
                : mode === 'allocate'
                  ? UserRound
                  : Undo2
            }
            label={
              mode === 'purchase'
                ? 'Post purchase + bill'
                : mode === 'allocate'
                  ? 'Allocate to salesperson'
                  : 'Return to office'
            }
            onPress={onSubmit}
            loading={saving}
          />
        </View>
      ) : null}
    </Screen>
  );
}
