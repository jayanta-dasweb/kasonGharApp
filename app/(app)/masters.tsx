import { useCallback, useMemo, useState } from 'react';
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
  createJournal,
  createLocation,
  createPartner,
  createProduct,
  createWeave,
  listAccounts,
  listCategories,
  listExpenseHeads,
  listFabrics,
  listFinancialYears,
  listJournals,
  listLocations,
  listPartners,
  listProducts,
  listWeaves,
} from '@/services/masters';

const SECTIONS = [
  {
    key: 'FY',
    label: 'Financial Year',
    help: 'Indian FY period (start/end dates). Used in reports.',
  },
  {
    key: 'Categories',
    label: 'Categories',
    help: 'Product groups e.g. Mekhela, Chador, Set.',
  },
  {
    key: 'Fabrics',
    label: 'Fabrics',
    help: 'Fabric type e.g. Muga, Pat, Eri, Cotton.',
  },
  {
    key: 'Weaves',
    label: 'Weaves',
    help: 'Weave pattern / design family.',
  },
  {
    key: 'Partners',
    label: 'Partners',
    help: 'Vendors & customers (phone, city, type).',
  },
  {
    key: 'Products',
    label: 'Products',
    help: 'SKU with cost, MRP, min price + category/fabric/weave.',
  },
  {
    key: 'Locations',
    label: 'Stock Locations',
    help: 'SUPPLIER / INTERNAL / SALESPERSON / CUSTOMER warehouses.',
  },
  {
    key: 'Accounts',
    label: 'Chart of Accounts',
    help: 'Ledger accounts for double-entry posting.',
  },
  {
    key: 'Journals',
    label: 'Journals',
    help: 'Journal books e.g. IN_BILL, OUT_INVOICE.',
  },
  {
    key: 'Expenses',
    label: 'Expense Heads',
    help: 'Expense classification heads.',
  },
] as const;

type Tab = (typeof SECTIONS)[number]['key'];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.maroon : '#fff',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: active ? colors.maroon : colors.border,
      }}
    >
      <Text
        style={{
          color: active ? '#fff' : colors.ink,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SelectRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string | number; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-slate-600">{label}</Text>
      {options.length === 0 ? (
        <Text className="text-xs text-slate-400">None yet — create in its own tab first.</Text>
      ) : (
        options.map((o) => {
          const id = String(o.id);
          const on = value === id;
          return (
            <Pressable key={id} onPress={() => onChange(id)} className="mb-1 py-2">
              <Text style={{ color: on ? colors.maroon : colors.ink, fontWeight: on ? '700' : '400' }}>
                {on ? '● ' : '○ '}
                {o.name}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

export default function MastersScreen() {
  const [tab, setTab] = useState<Tab>('Categories');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [weaves, setWeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partnerType, setPartnerType] = useState<'vendor' | 'customer' | 'both'>('vendor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [cost, setCost] = useState('');
  const [mrp, setMrp] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fabricId, setFabricId] = useState('');
  const [weaveId, setWeaveId] = useState('');
  const [acctCode, setAcctCode] = useState('');
  const [acctType, setAcctType] = useState('asset');
  const [journalType, setJournalType] = useState('general');
  const [locCode, setLocCode] = useState('');
  const [locUsage, setLocUsage] = useState<'SUPPLIER' | 'INTERNAL' | 'SALESPERSON' | 'CUSTOMER'>(
    'INTERNAL'
  );

  const section = useMemo(() => SECTIONS.find((s) => s.key === tab)!, [tab]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setStateName('');
    setProductCode('');
    setCost('');
    setMrp('');
    setMinPrice('');
    setCategoryId('');
    setFabricId('');
    setWeaveId('');
    setAcctCode('');
    setAcctType('asset');
    setJournalType('general');
    setLocCode('');
    setLocUsage('INTERNAL');
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const loaders: Record<Tab, () => Promise<any[]>> = {
        FY: listFinancialYears,
        Categories: listCategories,
        Fabrics: listFabrics,
        Weaves: listWeaves,
        Partners: listPartners,
        Products: listProducts,
        Locations: listLocations,
        Accounts: listAccounts,
        Journals: listJournals,
        Expenses: listExpenseHeads,
      };
      const [rows, cats, fabs, wvs] = await Promise.all([
        loaders[tab](),
        listCategories().catch(() => []),
        listFabrics().catch(() => []),
        listWeaves().catch(() => []),
      ]);
      setItems(rows);
      setCategories(cats);
      setFabrics(fabs);
      setWeaves(wvs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
      setItems([]);
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

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      if (tab === 'FY') {
        if (!startDate || !endDate) throw new Error('Start and end dates are required (YYYY-MM-DD)');
        await createFinancialYear({ start_date: startDate, end_date: endDate });
      } else if (tab === 'Categories') {
        if (!name.trim()) throw new Error('Category name required');
        await createCategory({ name, description });
      } else if (tab === 'Fabrics') {
        if (!name.trim()) throw new Error('Fabric name required');
        await createFabric({ name, description });
      } else if (tab === 'Weaves') {
        if (!name.trim()) throw new Error('Weave name required');
        await createWeave({ name, description });
      } else if (tab === 'Partners') {
        if (!name.trim()) throw new Error('Partner name required');
        await createPartner({
          name,
          partner_type: partnerType,
          phone,
          email,
          address,
          city,
          state: stateName,
        });
      } else if (tab === 'Products') {
        if (!productCode.trim() || !name.trim()) throw new Error('Product code and name required');
        await createProduct({
          product_code: productCode,
          name,
          category_id: categoryId || null,
          fabric_id: fabricId || null,
          weave_id: weaveId || null,
          vendor_cost_price: Number(cost || 0),
          company_mrp: Number(mrp || 0),
          min_selling_price: Number(minPrice || 0),
        });
      } else if (tab === 'Locations') {
        if (!locCode.trim() || !name.trim()) throw new Error('Location code and name required');
        await createLocation({ code: locCode, name, usage: locUsage });
      } else if (tab === 'Accounts') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Account code and name required');
        await createAccount({ code: acctCode, name, account_type: acctType });
      } else if (tab === 'Journals') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Journal code and name required');
        await createJournal({ code: acctCode, name, type: journalType });
      } else if (tab === 'Expenses') {
        if (!name.trim()) throw new Error('Expense head name required');
        await createExpenseHead(name);
      }
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
    <Screen title="Master Data Hub" loading={loading}>
      <Text className="mb-3 text-sm text-slate-500">
        Create reference data used by Inventory, Sales, and Reports. Tap a section below.
      </Text>

      <View className="mb-3 flex-row flex-wrap">
        {SECTIONS.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            active={tab === s.key}
            onPress={() => {
              setTab(s.key);
              setLoading(true);
              setOk(null);
              setError(null);
            }}
          />
        ))}
      </View>

      <View className="mb-3 rounded-2xl bg-white p-4">
        <Text className="text-lg font-bold text-maroon">{section.label}</Text>
        <Text className="mb-3 mt-1 text-xs text-slate-500">{section.help}</Text>

        <Toast message={error} />
        <Toast message={ok} type="success" />

        {tab === 'FY' ? (
          <>
            <Input
              label="Start date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2025-04-01"
            />
            <Input
              label="End date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-03-31"
            />
          </>
        ) : null}

        {tab === 'Categories' || tab === 'Fabrics' || tab === 'Weaves' || tab === 'Expenses' ? (
          <>
            <Input
              label={
                tab === 'Expenses' ? 'Expense head name' : `${section.label.slice(0, -1)} name`
              }
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
            />
            {tab !== 'Expenses' ? (
              <Input
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Short note"
              />
            ) : null}
          </>
        ) : null}

        {tab === 'Partners' ? (
          <>
            <Input label="Partner name" value={name} onChangeText={setName} />
            <Text className="mb-2 text-sm font-medium text-slate-600">Partner type</Text>
            <View className="mb-3 flex-row flex-wrap">
              {(['vendor', 'customer', 'both'] as const).map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={partnerType === t}
                  onPress={() => setPartnerType(t)}
                />
              ))}
            </View>
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Address" value={address} onChangeText={setAddress} />
            <Input label="City" value={city} onChangeText={setCity} />
            <Input label="State" value={stateName} onChangeText={setStateName} />
          </>
        ) : null}

        {tab === 'Products' ? (
          <>
            <Input label="Product code" value={productCode} onChangeText={setProductCode} />
            <Input label="Product name" value={name} onChangeText={setName} />
            <SelectRow
              label="Category"
              options={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
            <SelectRow label="Fabric" options={fabrics} value={fabricId} onChange={setFabricId} />
            <SelectRow label="Weave" options={weaves} value={weaveId} onChange={setWeaveId} />
            <Input
              label="Vendor cost price (₹)"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
            />
            <Input label="Company MRP (₹)" value={mrp} onChangeText={setMrp} keyboardType="numeric" />
            <Input
              label="Min selling price (₹)"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
          </>
        ) : null}

        {tab === 'Locations' ? (
          <>
            <Input
              label="Location code"
              value={locCode}
              onChangeText={setLocCode}
              placeholder="LOC-OFFICE-2"
            />
            <Input label="Location name" value={name} onChangeText={setName} />
            <Text className="mb-2 text-sm font-medium text-slate-600">Usage</Text>
            <View className="mb-3 flex-row flex-wrap">
              {(['SUPPLIER', 'INTERNAL', 'SALESPERSON', 'CUSTOMER'] as const).map((u) => (
                <Chip key={u} label={u} active={locUsage === u} onPress={() => setLocUsage(u)} />
              ))}
            </View>
          </>
        ) : null}

        {tab === 'Accounts' ? (
          <>
            <Input label="Account code" value={acctCode} onChangeText={setAcctCode} placeholder="1300" />
            <Input label="Account name" value={name} onChangeText={setName} />
            <Input
              label="Account type"
              value={acctType}
              onChangeText={setAcctType}
              placeholder="asset / liability / income / expense"
            />
          </>
        ) : null}

        {tab === 'Journals' ? (
          <>
            <Input
              label="Journal code"
              value={acctCode}
              onChangeText={setAcctCode}
              placeholder="IN_BILL"
            />
            <Input label="Journal name" value={name} onChangeText={setName} />
            <Input
              label="Journal type"
              value={journalType}
              onChangeText={setJournalType}
              placeholder="purchase / sale / general"
            />
          </>
        ) : null}

        <Button label={`Save ${section.label}`} onPress={onSave} loading={saving} />
      </View>

      <Text className="mb-2 text-base font-bold text-ink">
        Existing {section.label} ({items.length})
      </Text>

      {items.length === 0 ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="font-semibold text-maroon">Nothing saved yet</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Fill the form above and tap Save. Suggested order: Categories → Fabrics → Weaves →
            Partners → Products.
          </Text>
        </View>
      ) : (
        items.map((item, idx) => (
          <View
            key={String(item.id ?? item.product_code ?? item.code ?? idx)}
            className="mb-2 rounded-xl bg-white px-3 py-3"
          >
            <Text className="font-semibold text-ink">
              {item.product_code ? `${item.product_code} · ` : ''}
              {item.code ? `${item.code} · ` : ''}
              {item.name}
            </Text>
            {item.partner_type ? (
              <Text className="text-xs text-slate-500">
                {item.partner_type}
                {item.phone ? ` · ${item.phone}` : ''}
                {item.city ? ` · ${item.city}` : ''}
              </Text>
            ) : null}
            {item.usage ? (
              <Text className="text-xs text-slate-500">
                {item.code} · {item.usage}
              </Text>
            ) : null}
            {item.account_type ? (
              <Text className="text-xs text-slate-500">{item.account_type}</Text>
            ) : null}
            {item.type ? <Text className="text-xs text-slate-500">{item.type}</Text> : null}
            {item.description ? (
              <Text className="text-xs text-slate-500">{item.description}</Text>
            ) : null}
            {item.company_mrp != null ? (
              <Text className="text-xs text-slate-500">
                Cost ₹{item.vendor_cost_price} · MRP ₹{item.company_mrp} · Min ₹
                {item.min_selling_price}
              </Text>
            ) : null}
            {item.is_active === false ? (
              <Text className="text-xs text-danger">Inactive</Text>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}
