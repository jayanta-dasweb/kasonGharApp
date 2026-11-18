import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  CalendarRange,
  Layers,
  MapPin,
  Package,
  Pencil,
  Receipt,
  Save,
  Shirt,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { ToggleRow } from '@/components/ui/ToggleSwitch';
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
  deleteAccount,
  deleteCategory,
  deleteExpenseHead,
  deleteFabric,
  deleteFinancialYear,
  deleteJournal,
  deleteLocation,
  deletePartner,
  deleteProduct,
  deleteWeave,
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
  setAccountActive,
  setCategoryActive,
  setExpenseHeadActive,
  setFabricActive,
  setJournalActive,
  setLocationActive,
  setPartnerActive,
  setProductActive,
  setWeaveActive,
  updateAccount,
  updateCategory,
  updateExpenseHead,
  updateFabric,
  updateFinancialYear,
  updateJournal,
  updateLocation,
  updatePartner,
  updateProduct,
  updateWeave,
} from '@/services/masters';

const SECTIONS: {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { key: 'FY', label: 'Year', icon: CalendarRange, color: colors.maroon },
  { key: 'Categories', label: 'Category', icon: Layers, color: '#7C3AED' },
  { key: 'Fabrics', label: 'Fabric', icon: Shirt, color: '#DB2777' },
  { key: 'Weaves', label: 'Weave', icon: Sparkles, color: colors.muga },
  { key: 'Partners', label: 'Partner', icon: Users, color: colors.royal },
  { key: 'Products', label: 'Product', icon: Package, color: '#0D9488' },
  { key: 'Locations', label: 'Location', icon: MapPin, color: '#EA580C' },
  { key: 'Accounts', label: 'Account', icon: Wallet, color: '#CA8A04' },
  { key: 'Journals', label: 'Journal', icon: BookOpen, color: '#475569' },
  { key: 'Expenses', label: 'Expense', icon: Receipt, color: colors.danger },
];

type Tab = (typeof SECTIONS)[number]['key'];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
      <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function ActionBtn({
  label,
  onPress,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger' | 'ok';
  icon?: LucideIcon;
}) {
  const bg = tone === 'danger' ? '#FEE2E2' : tone === 'ok' ? '#D1FAE5' : '#F1F5F9';
  const color = tone === 'danger' ? '#DC2626' : tone === 'ok' ? '#059669' : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginRight: 8,
        marginTop: 8,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {Icon ? <Icon color={color} size={18} /> : null}
      <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{label}</Text>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [fyName, setFyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [origin, setOrigin] = useState('');
  const [region, setRegion] = useState('');
  const [motif, setMotif] = useState('');
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
  const [acctCode, setAcctCode] = useState('');
  const [acctType, setAcctType] = useState('asset');
  const [acctSubtype, setAcctSubtype] = useState('');
  const [openingBal, setOpeningBal] = useState('0');
  const [journalType, setJournalType] = useState('general');
  const [locCode, setLocCode] = useState('');
  const [locUsage, setLocUsage] = useState<'SUPPLIER' | 'INTERNAL' | 'SALESPERSON' | 'CUSTOMER'>('INTERNAL');
  const [locAddress, setLocAddress] = useState('');

  const section = useMemo(() => SECTIONS.find((s) => s.key === tab)!, [tab]);
  const visibleItems = useMemo(
    () => (showInactive ? items : items.filter((i) => i.is_active !== false && i.is_closed !== true)),
    [items, showInactive]
  );

  const resetForm = () => {
    setEditingId(null);
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

  const beginEdit = (item: any) => {
    setEditingId(String(item.id));
    setOk(null);
    setError(null);
    setName(item.name ?? item.product_name ?? '');
    setDescription(item.description ?? '');
    setNotes(item.notes ?? '');
    setFyName(item.fy_name ?? '');
    setStartDate(item.start_date ?? '');
    setEndDate(item.end_date ?? '');
    setOrigin(item.origin ?? '');
    setRegion(item.region ?? '');
    setMotif(item.motif ?? '');
    setPartnerType((item.partner_type ?? 'vendor').toLowerCase());
    setPhone(item.phone ?? '');
    setEmail(item.email ?? '');
    setAddress(item.address ?? '');
    setCity(item.city ?? '');
    setStateName(item.state ?? '');
    setPincode(item.pincode ?? '');
    setGstin(item.gstin ?? '');
    setPan(item.pan ?? '');
    setContactPerson(item.contact_person ?? '');
    setCreditLimit(String(item.credit_limit ?? ''));
    setPaymentTerms(item.payment_terms ?? '');
    setBankName(item.bank_name ?? '');
    setBankAccount(item.bank_account ?? '');
    setIfsc(item.ifsc ?? '');
    setProductCode(item.product_code ?? '');
    setColor(item.color ?? '');
    setDesignName(item.design_name ?? '');
    setBarcode(item.barcode ?? '');
    setHsn(item.hsn_code ?? '');
    setUom(item.uom ?? 'PCS');
    setCost(String(item.vendor_cost_price ?? ''));
    setMrp(String(item.company_mrp ?? ''));
    setMinPrice(String(item.min_selling_price ?? ''));
    setWholesale(String(item.wholesale_price ?? ''));
    setReorder(String(item.reorder_level ?? ''));
    setLengthMtr(String(item.length_mtr ?? ''));
    setWidthInch(String(item.width_inch ?? ''));
    setCategoryId(item.category_id != null ? String(item.category_id) : '');
    setFabricId(item.fabric_id != null ? String(item.fabric_id) : '');
    setWeaveId(item.weave_id != null ? String(item.weave_id) : '');
    setAcctCode(item.code ?? '');
    setAcctType(item.account_type ?? 'asset');
    setAcctSubtype(item.account_subtype ?? '');
    setOpeningBal(String(item.opening_balance ?? '0'));
    setJournalType(item.type ?? 'general');
    setLocCode(item.code ?? item.location_code ?? '');
    setLocUsage(item.usage ?? 'INTERNAL');
    setLocAddress(item.address ?? '');
  };

  const confirmDelete = (item: any) => {
    Alert.alert('Delete record?', `${item.name ?? item.product_code ?? item.id}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setError(null);
            if (tab === 'FY') await deleteFinancialYear(item.id);
            else if (tab === 'Categories') await deleteCategory(item.id);
            else if (tab === 'Fabrics') await deleteFabric(item.id);
            else if (tab === 'Weaves') await deleteWeave(item.id);
            else if (tab === 'Partners') await deletePartner(item.id);
            else if (tab === 'Products') await deleteProduct(String(item.product_code ?? item.id));
            else if (tab === 'Locations') await deleteLocation(item.id);
            else if (tab === 'Accounts') await deleteAccount(item.id);
            else if (tab === 'Journals') await deleteJournal(item.id);
            else if (tab === 'Expenses') await deleteExpenseHead(item.id);
            setOk('Deleted (or inactivated if in use)');
            if (editingId === String(item.id)) resetForm();
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
            await load();
          }
        },
      },
    ]);
  };

  const toggleActive = async (item: any, nextActive: boolean) => {
    try {
      if (tab === 'FY') {
        await updateFinancialYear(item.id, {
          fy_name: item.fy_name,
          start_date: item.start_date,
          end_date: item.end_date,
          is_closed: !nextActive,
        });
        setOk(nextActive ? 'FY opened' : 'FY closed');
      } else {
        if (tab === 'Categories') await setCategoryActive(item.id, nextActive);
        else if (tab === 'Fabrics') await setFabricActive(item.id, nextActive);
        else if (tab === 'Weaves') await setWeaveActive(item.id, nextActive);
        else if (tab === 'Partners') await setPartnerActive(item.id, nextActive);
        else if (tab === 'Products')
          await setProductActive(String(item.product_code ?? item.id), nextActive);
        else if (tab === 'Locations') await setLocationActive(item.id, nextActive);
        else if (tab === 'Accounts') await setAccountActive(item.id, nextActive);
        else if (tab === 'Journals') await setJournalActive(item.id, nextActive);
        else if (tab === 'Expenses') await setExpenseHeadActive(item.id, nextActive);
        setOk(nextActive ? 'Activated' : 'Deactivated');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const isEdit = Boolean(editingId);
      if (tab === 'FY') {
        if (!startDate || !endDate) throw new Error('Start & end dates required');
        if (isEdit) await updateFinancialYear(editingId!, { fy_name: fyName, start_date: startDate, end_date: endDate });
        else await createFinancialYear({ fy_name: fyName, start_date: startDate, end_date: endDate });
      } else if (tab === 'Categories') {
        if (!name.trim()) throw new Error('Name required');
        if (isEdit) await updateCategory(editingId!, { name, description });
        else await createCategory({ name, description });
      } else if (tab === 'Fabrics') {
        if (!name.trim()) throw new Error('Name required');
        if (isEdit) await updateFabric(editingId!, { name, description, origin });
        else await createFabric({ name, description, origin });
      } else if (tab === 'Weaves') {
        if (!name.trim()) throw new Error('Name required');
        if (isEdit) await updateWeave(editingId!, { name, description, region, motif });
        else await createWeave({ name, description, region, motif });
      } else if (tab === 'Partners') {
        if (!name.trim()) throw new Error('Name required');
        const payload = {
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
        };
        if (isEdit) await updatePartner(editingId!, payload);
        else await createPartner(payload);
      } else if (tab === 'Products') {
        if (!productCode.trim() || !name.trim()) throw new Error('Product code & name required');
        const payload = {
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
        };
        if (isEdit) await updateProduct(String(editingId), payload);
        else await createProduct(payload);
      } else if (tab === 'Locations') {
        if (!locCode.trim() || !name.trim()) throw new Error('Code & name required');
        const payload = { code: locCode, name, usage: locUsage, address: locAddress, notes };
        if (isEdit) await updateLocation(editingId!, payload);
        else await createLocation(payload);
      } else if (tab === 'Accounts') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Code & name required');
        const payload = {
          code: acctCode,
          name,
          account_type: acctType,
          account_subtype: acctSubtype,
          opening_balance: Number(openingBal || 0),
          notes,
        };
        if (isEdit) await updateAccount(editingId!, payload);
        else await createAccount(payload);
      } else if (tab === 'Journals') {
        if (!acctCode.trim() || !name.trim()) throw new Error('Code & name required');
        if (isEdit) await updateJournal(editingId!, { code: acctCode, name, type: journalType, notes });
        else await createJournal({ code: acctCode, name, type: journalType, notes });
      } else if (tab === 'Expenses') {
        if (!name.trim()) throw new Error('Name required');
        if (isEdit) await updateExpenseHead(editingId!, { name, description });
        else await createExpenseHead({ name, description });
      }
      setOk(isEdit ? 'Updated successfully' : 'Created successfully');
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Master Control" loading={loading} safeTop={false}>
      <Text className="mb-2 text-sm text-slate-500">
        Full control: Create · Edit · Activate/Deactivate · Delete. Run erp_masters_enrichment.sql once for extra columns.
      </Text>

      <Text className="mb-2 text-sm font-bold text-ink">Choose master type</Text>
      {SECTIONS.map((s) => (
        <NavRow
          key={s.key}
          label={s.label}
          subtitle={tab === s.key ? 'Selected · edit below' : 'Tap to open'}
          icon={s.icon}
          color={s.color}
          active={tab === s.key}
          onPress={() => {
            setTab(s.key as Tab);
            resetForm();
            setLoading(true);
            setOk(null);
            setError(null);
          }}
        />
      ))}

      <View className="mb-3 rounded-2xl bg-white p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-maroon">
            {editingId ? `Edit ${section.label}` : `Add ${section.label}`}
          </Text>
          {editingId ? <ActionBtn label="Cancel edit" onPress={resetForm} /> : null}
        </View>
        <Toast message={error} />
        <Toast message={ok} type="success" />

        {tab === 'FY' ? (
          <>
            <Input label="FY name" value={fyName} onChangeText={setFyName} placeholder="2025-26" />
            <Input label="Start (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
            <Input label="End (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
          </>
        ) : null}
        {tab === 'Categories' ? (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}
        {tab === 'Fabrics' ? (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Origin" value={origin} onChangeText={setOrigin} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}
        {tab === 'Weaves' ? (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Region" value={region} onChangeText={setRegion} />
            <Input label="Motif" value={motif} onChangeText={setMotif} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}
        {tab === 'Partners' ? (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
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
            <Input label="Credit limit" value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
            <Input label="Payment terms" value={paymentTerms} onChangeText={setPaymentTerms} />
            <Input label="Bank name" value={bankName} onChangeText={setBankName} />
            <Input label="Bank account" value={bankAccount} onChangeText={setBankAccount} />
            <Input label="IFSC" value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}
        {tab === 'Products' ? (
          <>
            <Input
              label="Product code"
              value={productCode}
              onChangeText={setProductCode}
              // code is PK — lock while editing
            />
            {editingId ? (
              <Text className="mb-2 text-xs text-slate-500">Code is primary key — create new SKU to change code.</Text>
            ) : null}
            <Input label="Product name" value={name} onChangeText={setName} />
            <Input label="Design" value={designName} onChangeText={setDesignName} />
            <Input label="Color" value={color} onChangeText={setColor} />
            <SelectRow label="Category" options={categories} value={categoryId} onChange={setCategoryId} />
            <SelectRow label="Fabric" options={fabrics} value={fabricId} onChange={setFabricId} />
            <SelectRow label="Weave" options={weaves} value={weaveId} onChange={setWeaveId} />
            <Input label="HSN" value={hsn} onChangeText={setHsn} />
            <Input label="Barcode" value={barcode} onChangeText={setBarcode} />
            <Input label="UOM" value={uom} onChangeText={setUom} />
            <Input label="Length mtr" value={lengthMtr} onChangeText={setLengthMtr} keyboardType="numeric" />
            <Input label="Width inch" value={widthInch} onChangeText={setWidthInch} keyboardType="numeric" />
            <Input label="Vendor cost" value={cost} onChangeText={setCost} keyboardType="numeric" />
            <Input label="Wholesale" value={wholesale} onChangeText={setWholesale} keyboardType="numeric" />
            <Input label="MRP" value={mrp} onChangeText={setMrp} keyboardType="numeric" />
            <Input label="Min sell" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
            <Input label="Reorder level" value={reorder} onChangeText={setReorder} keyboardType="numeric" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}
        {tab === 'Locations' ? (
          <>
            <Input label="Code" value={locCode} onChangeText={setLocCode} />
            <Input label="Name" value={name} onChangeText={setName} />
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
            <Input label="Code" value={acctCode} onChangeText={setAcctCode} />
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Type" value={acctType} onChangeText={setAcctType} />
            <Input label="Subtype" value={acctSubtype} onChangeText={setAcctSubtype} />
            <Input label="Opening balance" value={openingBal} onChangeText={setOpeningBal} keyboardType="numeric" />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}
        {tab === 'Journals' ? (
          <>
            <Input label="Code" value={acctCode} onChangeText={setAcctCode} />
            <Input label="Name" value={name} onChangeText={setName} />
            <Input label="Type" value={journalType} onChangeText={setJournalType} />
            <Input label="Notes" value={notes} onChangeText={setNotes} />
          </>
        ) : null}
        {tab === 'Expenses' ? (
          <>
            <Input label="Head name" value={name} onChangeText={setName} />
            <Input label="Description" value={description} onChangeText={setDescription} />
          </>
        ) : null}

        <Button
          icon={Save}
          label={editingId ? `Update ${section.label}` : `Create ${section.label}`}
          onPress={onSave}
          loading={saving}
        />
      </View>

      <Text className="mb-2 text-base font-bold text-ink">
        Records ({visibleItems.length}/{items.length})
      </Text>
      <ToggleRow
        label="Show inactive"
        hint={showInactive ? 'ON · inactive rows visible' : 'OFF · active only'}
        value={showInactive}
        onValueChange={setShowInactive}
      />

      {visibleItems.length === 0 ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="font-semibold text-maroon">No records</Text>
          <Text className="mt-1 text-sm text-slate-500">Create one using the form above.</Text>
        </View>
      ) : (
        visibleItems.map((item, idx) => {
          const inactive = item.is_active === false || item.is_closed === true;
          const active = tab === 'FY' ? !item.is_closed : item.is_active !== false;
          return (
            <View
              key={String(item.id ?? item.product_code ?? idx)}
              className="mb-2 rounded-xl bg-white px-3 py-3"
              style={{ opacity: inactive ? 0.65 : 1 }}
            >
              <Text className="font-semibold text-ink">
                {item.product_code ? `${item.product_code} · ` : ''}
                {item.code ? `${item.code} · ` : ''}
                {item.name}
              </Text>
              {item.company_mrp != null ? (
                <Text className="text-xs text-slate-500">
                  Cost ₹{item.vendor_cost_price} · MRP ₹{item.company_mrp} · Min ₹{item.min_selling_price}
                </Text>
              ) : null}
              {item.partner_type ? (
                <Text className="text-xs text-slate-500">
                  {item.partner_type}
                  {item.gstin ? ` · ${item.gstin}` : ''}
                  {item.phone ? ` · ${item.phone}` : ''}
                </Text>
              ) : null}
              <View className="mt-2">
                <ToggleRow
                  dense
                  label={tab === 'FY' ? (active ? 'FY open' : 'FY closed') : active ? 'Active' : 'Inactive'}
                  hint={
                    tab === 'FY'
                      ? active
                        ? 'ON · year open'
                        : 'OFF · year closed'
                      : active
                        ? 'ON · usable'
                        : 'OFF · hidden'
                  }
                  value={active}
                  onValueChange={(next) => toggleActive(item, next)}
                />
              </View>
              <View className="flex-row flex-wrap">
                <ActionBtn icon={Pencil} label="Edit" onPress={() => beginEdit(item)} />
                <ActionBtn
                  icon={Trash2}
                  label="Delete"
                  tone="danger"
                  onPress={() => confirmDelete(item)}
                />
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}
