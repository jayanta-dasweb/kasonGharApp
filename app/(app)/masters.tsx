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
  { key: 'FY', label: 'Financial Year', help: 'Accounting period (FY name + dates).' },
  { key: 'Categories', label: 'Categories', help: 'Product group (Mekhela, Chador, Set…).' },
  { key: 'Fabrics', label: 'Fabrics', help: 'Muga / Pat / Eri / Cotton + origin.' },
  { key: 'Weaves', label: 'Weaves', help: 'Weave family, region, motif.' },
  { key: 'Partners', label: 'Partners', help: 'Vendor/Customer with GSTIN, credit & bank.' },
  { key: 'Products', label: 'Products', help: 'SKU: code, color, HSN, cost, MRP, stock UOM.' },
  { key: 'Locations', label: 'Stock Locations', help: 'Warehouses / salesperson bags.' },
  { key: 'Accounts', label: 'Chart of Accounts', help: 'Ledger accounts for journal posting.' },
  { key: 'Journals', label: 'Journals', help: 'IN_BILL, OUT_INVOICE, cash, bank…' },
  { key: 'Expenses', label: 'Expense Heads', help: 'Expense classification for P&L.' },
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
      <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12, fontWeight: '700' }}>
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
        <Text className="text-xs text-slate-400">Create in its own tab first.</Text>
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
  const [tab, setTab] = useState<Tab>('Products');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [weaves, setWeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // shared
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // FY
  const [fyName, setFyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // fabric/weave extras
  const [origin, setOrigin] = useState('');
  const [region, setRegion] = useState('');
  const [motif, setMotif] = useState('');

  // partner
  const [partnerType, setPartnerType] = useState<'vendor' | 'customer' | 'both'>('vendor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');

  // product
  const [productCode, setProductCode] = useState('');
  const [color, setColor] = useState('');
  const [designName, setDesignName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsn, setHsn] = useState('');
  const [uom, setUom] = useState('PCS');
  const [cost, setCost] = useState('');
  const [mrp, setMrp] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [wholesale, setWholesale] = useState('');
  const [reorder, setReorder] = useState('');
  const [lengthMtr, setLengthMtr] = useState('');
  const [widthInch, setWidthInch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fabricId, setFabricId] = useState('');
  const [weaveId, setWeaveId] = useState('');

  // location / accounts / journals
  const [acctCode, setAcctCode] = useState('');
  const [acctType, setAcctType] = useState('asset');
  const [acctSubtype, setAcctSubtype] = useState('');
  const [openingBal, setOpeningBal] = useState('0');
  const [journalType, setJournalType] = useState('general');
  const [locCode, setLocCode] = useState('');
  const [locUsage, setLocUsage] = useState<'SUPPLIER' | 'INTERNAL' | 'SALESPERSON' | 'CUSTOMER'>(
    'INTERNAL'
  );
  const [locAddress, setLocAddress] = useState('');

  const section = useMemo(() => SECTIONS.find((s) => s.key === tab)!, [tab]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setNotes('');
    setFyName('');
    setStartDate('');
    setEndDate('');
    setOrigin('');
    setRegion('');
    setMotif('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setStateName('');
    setPincode('');
    setGstin('');
    setPan('');
    setContactPerson('');
    setCreditLimit('');
    setPaymentTerms('');
    setBankName('');
    setBankAccount('');
    setIfsc('');
    setProductCode('');
    setColor('');
    setDesignName('');
    setBarcode('');
    setHsn('');
    setUom('PCS');
    setCost('');
    setMrp('');
    setMinPrice('');
    setWholesale('');
    setReorder('');
    setLengthMtr('');
    setWidthInch('');
    setCategoryId('');
    setFabricId('');
    setWeaveId('');
    setAcctCode('');
    setAcctType('asset');
    setAcctSubtype('');
    setOpeningBal('0');
    setJournalType('general');
    setLocCode('');
    setLocUsage('INTERNAL');
    setLocAddress('');
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
        if (!startDate || !endDate) throw new Error('Start & end dates required (YYYY-MM-DD)');
        await createFinancialYear({ fy_name: fyName, start_date: startDate, end_date: endDate });
      } else if (tab === 'Categories') {
        if (!name.trim()) throw new Error('Category name required');
        await createCategory({ name, description });
      } else if (tab === 'Fabrics') {
        if (!name.trim()) throw new Error('Fabric name required');
        await createFabric({ name, description, origin });
      } else if (tab === 'Weaves') {
        if (!name.trim()) throw new Error('Weave name required');
        await createWeave({ name, description, region, motif });
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
          pincode,
          gstin,
          pan,
          contact_person: contactPerson,
          credit_limit: Number(creditLimit || 0),
          payment_terms: paymentTerms,
          bank_name: bankName,
          bank_account: bankAccount,
          ifsc,
          notes,
        });
      } else if (tab === 'Products') {
        if (!productCode.trim() || !name.trim()) throw new Error('Product code & name required');
        await createProduct({
          product_code: productCode,
          name,
          category_id: categoryId || null,
          fabric_id: fabricId || null,
          weave_id: weaveId || null,
          color,
          design_name: designName,
          barcode,
          hsn_code: hsn,
          uom,
          vendor_cost_price: Number(cost || 0),
          company_mrp: Number(mrp || 0),
          min_selling_price: Number(minPrice || 0),
          wholesale_price: Number(wholesale || 0),
          reorder_level: Number(reorder || 0),
          length_mtr: lengthMtr ? Number(lengthMtr) : undefined,
          width_inch: widthInch ? Number(widthInch) : undefined,
          notes,
        });
      } else if (tab === 'Locations') {
        if (!locCode.trim() || !name.trim()) throw new Error('Location code & name required');
        await createLocation({
          code: locCode,
          name,
          usage: locUsage,
          address: locAddress,
          notes,
        });
      } else if (tab === 'Accounts') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Account code & name required');
        await createAccount({
          code: acctCode,
          name,
          account_type: acctType,
          account_subtype: acctSubtype,
          opening_balance: Number(openingBal || 0),
          notes,
        });
      } else if (tab === 'Journals') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Journal code & name required');
        await createJournal({ code: acctCode, name, type: journalType, notes });
      } else if (tab === 'Expenses') {
        if (!name.trim()) throw new Error('Expense head required');
        await createExpenseHead({ name, description });
      }
      setOk('Saved to database');
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
      <View className="mb-3 rounded-2xl bg-white p-3">
        <Text className="text-sm font-semibold text-maroon">Accountant / Inventory setup</Text>
        <Text className="mt-1 text-xs text-slate-500">
          First run SQL file supabase/erp_masters_enrichment.sql in Supabase (adds GSTIN, color,
          HSN, reorder, bank fields, etc.). Then create masters in order: FY → Categories → Fabrics
          → Weaves → Partners → Products → Accounts → Journals → Locations.
        </Text>
      </View>

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
            <Input label="FY name" value={fyName} onChangeText={setFyName} placeholder="2025-26" />
            <Input label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2025-04-01" />
            <Input label="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-03-31" />
          </>
        ) : null}

        {tab === 'Categories' ? (
          <>
            <Input label="Category name" value={name} onChangeText={setName} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}

        {tab === 'Fabrics' ? (
          <>
            <Input label="Fabric name" value={name} onChangeText={setName} placeholder="Muga / Pat / Eri" />
            <Input label="Origin" value={origin} onChangeText={setOrigin} placeholder="Sualkuchi / Assam" />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}

        {tab === 'Weaves' ? (
          <>
            <Input label="Weave name" value={name} onChangeText={setName} />
            <Input label="Region" value={region} onChangeText={setRegion} />
            <Input label="Motif" value={motif} onChangeText={setMotif} placeholder="Buta / Jaapi / Floral" />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}

        {tab === 'Partners' ? (
          <>
            <Input label="Legal / trade name" value={name} onChangeText={setName} />
            <Text className="mb-2 text-sm font-medium text-slate-600">Type</Text>
            <View className="mb-2 flex-row flex-wrap">
              {(['vendor', 'customer', 'both'] as const).map((t) => (
                <Chip key={t} label={t} active={partnerType === t} onPress={() => setPartnerType(t)} />
              ))}
            </View>
            <Input label="Contact person" value={contactPerson} onChangeText={setContactPerson} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="GSTIN" value={gstin} onChangeText={setGstin} autoCapitalize="characters" />
            <Input label="PAN" value={pan} onChangeText={setPan} autoCapitalize="characters" />
            <Input label="Address" value={address} onChangeText={setAddress} />
            <Input label="City" value={city} onChangeText={setCity} />
            <Input label="State" value={stateName} onChangeText={setStateName} />
            <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
            <Input label="Credit limit (₹)" value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
            <Input label="Payment terms" value={paymentTerms} onChangeText={setPaymentTerms} placeholder="Net 30 / Advance" />
            <Input label="Bank name" value={bankName} onChangeText={setBankName} />
            <Input label="Bank account no." value={bankAccount} onChangeText={setBankAccount} />
            <Input label="IFSC" value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}

        {tab === 'Products' ? (
          <>
            <Input label="Product code (SKU)" value={productCode} onChangeText={setProductCode} />
            <Input label="Product name" value={name} onChangeText={setName} />
            <Input label="Design name" value={designName} onChangeText={setDesignName} />
            <Input label="Color" value={color} onChangeText={setColor} placeholder="Maroon / Cream / Gold" />
            <SelectRow label="Category" options={categories} value={categoryId} onChange={setCategoryId} />
            <SelectRow label="Fabric" options={fabrics} value={fabricId} onChange={setFabricId} />
            <SelectRow label="Weave" options={weaves} value={weaveId} onChange={setWeaveId} />
            <Input label="HSN code" value={hsn} onChangeText={setHsn} placeholder="5007 / 5407" />
            <Input label="Barcode" value={barcode} onChangeText={setBarcode} />
            <Input label="UOM" value={uom} onChangeText={setUom} placeholder="PCS / SET / MTR" />
            <Input label="Length (mtr)" value={lengthMtr} onChangeText={setLengthMtr} keyboardType="numeric" />
            <Input label="Width (inch)" value={widthInch} onChangeText={setWidthInch} keyboardType="numeric" />
            <Input label="Vendor cost (₹)" value={cost} onChangeText={setCost} keyboardType="numeric" />
            <Input label="Wholesale price (₹)" value={wholesale} onChangeText={setWholesale} keyboardType="numeric" />
            <Input label="Company MRP (₹)" value={mrp} onChangeText={setMrp} keyboardType="numeric" />
            <Input label="Min selling price (₹)" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
            <Input label="Reorder level (qty)" value={reorder} onChangeText={setReorder} keyboardType="numeric" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}

        {tab === 'Locations' ? (
          <>
            <Input label="Location code" value={locCode} onChangeText={setLocCode} placeholder="LOC-OFFICE" />
            <Input label="Location name" value={name} onChangeText={setName} />
            <Text className="mb-2 text-sm font-medium text-slate-600">Usage</Text>
            <View className="mb-2 flex-row flex-wrap">
              {(['SUPPLIER', 'INTERNAL', 'SALESPERSON', 'CUSTOMER'] as const).map((u) => (
                <Chip key={u} label={u} active={locUsage === u} onPress={() => setLocUsage(u)} />
              ))}
            </View>
            <Input label="Address" value={locAddress} onChangeText={setLocAddress} />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}

        {tab === 'Accounts' ? (
          <>
            <Input label="Account code" value={acctCode} onChangeText={setAcctCode} placeholder="1300" />
            <Input label="Account name" value={name} onChangeText={setName} placeholder="Inventory Asset" />
            <Input label="Account type" value={acctType} onChangeText={setAcctType} placeholder="asset / liability / income / expense" />
            <Input label="Subtype" value={acctSubtype} onChangeText={setAcctSubtype} placeholder="current asset / COGS…" />
            <Input label="Opening balance (₹)" value={openingBal} onChangeText={setOpeningBal} keyboardType="numeric" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}

        {tab === 'Journals' ? (
          <>
            <Input label="Journal code" value={acctCode} onChangeText={setAcctCode} placeholder="IN_BILL" />
            <Input label="Journal name" value={name} onChangeText={setName} />
            <Input label="Type" value={journalType} onChangeText={setJournalType} placeholder="purchase / sale / cash / bank" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}

        {tab === 'Expenses' ? (
          <>
            <Input label="Expense head name" value={name} onChangeText={setName} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}

        <Button label={`Save ${section.label}`} onPress={onSave} loading={saving} />
      </View>

      <Text className="mb-2 text-base font-bold text-ink">
        Existing {section.label} ({items.length})
      </Text>

      {items.length === 0 ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="font-semibold text-maroon">No records yet</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Fill the form above and save. If save fails on new fields, run erp_masters_enrichment.sql first.
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
            {item.color || item.design_name ? (
              <Text className="text-xs text-slate-500">
                {[item.design_name, item.color, item.uom, item.hsn_code].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {item.company_mrp != null ? (
              <Text className="text-xs text-slate-500">
                Cost ₹{item.vendor_cost_price} · MRP ₹{item.company_mrp} · Min ₹{item.min_selling_price}
                {item.wholesale_price != null ? ` · WS ₹${item.wholesale_price}` : ''}
              </Text>
            ) : null}
            {item.partner_type ? (
              <Text className="text-xs text-slate-500">
                {item.partner_type}
                {item.gstin ? ` · GSTIN ${item.gstin}` : ''}
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
              <Text className="text-xs text-slate-500">
                {item.account_type}
                {item.account_subtype ? ` / ${item.account_subtype}` : ''}
              </Text>
            ) : null}
            {item.type ? <Text className="text-xs text-slate-500">{item.type}</Text> : null}
            {item.description ? <Text className="text-xs text-slate-500">{item.description}</Text> : null}
          </View>
        ))
      )}
    </Screen>
  );
}
