import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import {
  createAccount,
  createCategory,
  createExpenseHead,
  createFabric,
  createFinancialYear,
  createPartner,
  createProduct,
  createWeave,
  listAccounts,
  listCategories,
  listExpenseHeads,
  listFabrics,
  listFinancialYears,
  listPartners,
  listProducts,
  listWeaves,
} from '@/services/masters';

const TABS = [
  'FY',
  'Categories',
  'Fabrics',
  'Weaves',
  'Partners',
  'Products',
  'Accounts',
  'Expenses',
] as const;

type Tab = (typeof TABS)[number];

export default function MastersScreen() {
  const [tab, setTab] = useState<Tab>('Categories');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // shared form fields
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partnerType, setPartnerType] = useState<'vendor' | 'customer' | 'both'>('vendor');
  const [phone, setPhone] = useState('');
  const [productCode, setProductCode] = useState('');
  const [cost, setCost] = useState('');
  const [mrp, setMrp] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [acctCode, setAcctCode] = useState('');
  const [acctType, setAcctType] = useState('asset');

  const load = useCallback(async () => {
    setError(null);
    try {
      const map: Record<Tab, () => Promise<any[]>> = {
        FY: listFinancialYears,
        Categories: listCategories,
        Fabrics: listFabrics,
        Weaves: listWeaves,
        Partners: listPartners,
        Products: listProducts,
        Accounts: listAccounts,
        Expenses: listExpenseHeads,
      };
      setItems(await map[tab]());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setPhone('');
    setProductCode('');
    setCost('');
    setMrp('');
    setMinPrice('');
    setAcctCode('');
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      if (tab === 'FY') {
        await createFinancialYear({
          name,
          start_date: startDate,
          end_date: endDate,
        });
      } else if (tab === 'Categories') await createCategory(name);
      else if (tab === 'Fabrics') await createFabric(name);
      else if (tab === 'Weaves') await createWeave(name);
      else if (tab === 'Partners') {
        await createPartner({
          name,
          partner_type: partnerType,
          phone: phone || null,
        });
      } else if (tab === 'Products') {
        await createProduct({
          product_code: productCode,
          name,
          vendor_cost_price: Number(cost),
          company_mrp: Number(mrp),
          min_selling_price: Number(minPrice),
        });
      } else if (tab === 'Accounts') {
        await createAccount({ code: acctCode, name, account_type: acctType });
      } else if (tab === 'Expenses') await createExpenseHead(name);

      setOk('Saved to Supabase');
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Masters" loading={loading}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-4 flex-row flex-wrap gap-2">
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              setTab(t);
              setLoading(true);
            }}
            className="rounded-full px-3 py-2"
            style={{
              backgroundColor: tab === t ? colors.royal : colors.white,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: tab === t ? '#fff' : colors.muted }}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-4 rounded-2xl bg-white p-4">
        {tab === 'FY' ? (
          <>
            <Input label="FY Name" value={name} onChangeText={setName} placeholder="2025-26" />
            <Input label="Start (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
            <Input label="End (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
          </>
        ) : null}

        {['Categories', 'Fabrics', 'Weaves', 'Expenses'].includes(tab) ? (
          <Input label="Name" value={name} onChangeText={setName} />
        ) : null}

        {tab === 'Partners' ? (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View className="mb-3 flex-row gap-2">
              {(['vendor', 'customer', 'both'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setPartnerType(t)}
                  className="rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: partnerType === t ? colors.muga : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold text-white">{t}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'Products' ? (
          <>
            <Input label="Product Code" value={productCode} onChangeText={setProductCode} />
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Vendor Cost" value={cost} onChangeText={setCost} keyboardType="numeric" />
            <Input label="MRP" value={mrp} onChangeText={setMrp} keyboardType="numeric" />
            <Input
              label="Min Selling Price"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
          </>
        ) : null}

        {tab === 'Accounts' ? (
          <>
            <Input label="Code" value={acctCode} onChangeText={setAcctCode} />
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Type" value={acctType} onChangeText={setAcctType} />
          </>
        ) : null}

        <Button label="Save to Database" onPress={onSave} loading={saving} />
      </View>

      {items.length === 0 ? (
        <Text className="text-sm text-slate-500">No records yet. Add one above.</Text>
      ) : null}

      {items.map((item, idx) => (
        <View
          key={String(item.id ?? item.product_code ?? item.partner_id ?? idx)}
          className="mb-2 rounded-xl bg-white px-3 py-3"
        >
          <Text className="font-semibold text-ink">
            {item.product_code ? `${item.product_code} · ` : ''}
            {item.code ? `${item.code} · ` : ''}
            {item.name ?? item.product_name ?? item.partner_name ?? item.category_name}
          </Text>
          {item.partner_type ? (
            <Text className="text-xs text-slate-500">{item.partner_type}</Text>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}
