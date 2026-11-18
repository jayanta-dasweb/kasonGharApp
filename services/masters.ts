import { supabase } from '@/lib/supabase';

function mapRow(row: any, idKey: string, nameKey: string) {
  return {
    ...row,
    id: row[idKey],
    name: row[nameKey] ?? row.name ?? String(row[idKey]),
  };
}

export async function listCategories() {
  const { data, error } = await supabase
    .from('master_categories')
    .select('*')
    .order('category_name');
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r, 'category_id', 'category_name'));
}

export async function createCategory(input: {
  name: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('master_categories')
    .insert({
      category_name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listFabrics() {
  const { data, error } = await supabase
    .from('master_fabrics')
    .select('*')
    .order('fabric_name');
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r, 'fabric_id', 'fabric_name'));
}

export async function createFabric(input: { name: string; description?: string }) {
  const { data, error } = await supabase
    .from('master_fabrics')
    .insert({
      fabric_name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listWeaves() {
  const { data, error } = await supabase
    .from('master_weaves')
    .select('*')
    .order('weave_name');
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r, 'weave_id', 'weave_name'));
}

export async function createWeave(input: { name: string; description?: string }) {
  const { data, error } = await supabase
    .from('master_weaves')
    .insert({
      weave_name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listFinancialYears() {
  const { data, error } = await supabase
    .from('master_financial_years')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.fy_id,
    name: `${r.start_date} → ${r.end_date}`,
  }));
}

export async function createFinancialYear(input: {
  start_date: string;
  end_date: string;
}) {
  const { data, error } = await supabase
    .from('master_financial_years')
    .insert({
      start_date: input.start_date.trim(),
      end_date: input.end_date.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listPartners(type?: string) {
  let q = supabase.from('master_partners').select('*').order('partner_name');
  if (type === 'vendor') {
    q = q.in('partner_type', ['vendor', 'VENDOR', 'both', 'BOTH']);
  }
  if (type === 'customer') {
    q = q.in('partner_type', ['customer', 'CUSTOMER', 'both', 'BOTH']);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r, 'partner_id', 'partner_name'));
}

export async function createPartner(input: {
  name: string;
  partner_type: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
}) {
  const { data, error } = await supabase
    .from('master_partners')
    .insert({
      partner_name: input.name.trim(),
      partner_type: input.partner_type,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listProducts(search?: string) {
  let q = supabase.from('master_products').select('*').order('product_code');
  if (search?.trim()) {
    const s = search.trim();
    q = q.or(`product_code.ilike.%${s}%,product_name.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.product_code,
    name: r.product_name,
  }));
}

export async function createProduct(input: {
  product_code: string;
  name: string;
  category_id?: number | string | null;
  fabric_id?: number | string | null;
  weave_id?: number | string | null;
  vendor_cost_price: number;
  company_mrp: number;
  min_selling_price: number;
}) {
  const { data, error } = await supabase
    .from('master_products')
    .insert({
      product_code: input.product_code.trim(),
      product_name: input.name.trim(),
      category_id: input.category_id || null,
      fabric_id: input.fabric_id || null,
      weave_id: input.weave_id || null,
      vendor_cost_price: input.vendor_cost_price,
      company_mrp: input.company_mrp,
      min_selling_price: input.min_selling_price,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listExpenseHeads() {
  const { data, error } = await supabase
    .from('master_expense_heads')
    .select('*')
    .order('head_name');
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r, 'expense_head_id', 'head_name'));
}

export async function createExpenseHead(name: string) {
  const { data, error } = await supabase
    .from('master_expense_heads')
    .insert({ head_name: name.trim(), is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listAccounts() {
  const { data, error } = await supabase
    .from('account_accounts')
    .select('*')
    .order('code');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.account_id,
    name: r.name,
    code: r.code,
  }));
}

export async function createAccount(input: {
  code: string;
  name: string;
  account_type: string;
}) {
  const { data, error } = await supabase
    .from('account_accounts')
    .insert({
      code: input.code.trim(),
      name: input.name.trim(),
      account_type: input.account_type.trim(),
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listJournals() {
  const { data, error } = await supabase
    .from('account_journals')
    .select('*')
    .order('code');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.journal_id,
    name: r.name,
    code: r.code,
  }));
}

export async function createJournal(input: {
  code: string;
  name: string;
  type: string;
}) {
  const { data, error } = await supabase
    .from('account_journals')
    .insert({
      code: input.code.trim(),
      name: input.name.trim(),
      type: input.type.trim(),
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listLocations() {
  const { data, error } = await supabase
    .from('stock_locations')
    .select('*')
    .order('location_code');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.location_id,
    name: r.location_name,
    code: r.location_code,
  }));
}

export async function createLocation(input: {
  code: string;
  name: string;
  usage: string;
  assigned_user_id?: string | null;
}) {
  const { data, error } = await supabase
    .from('stock_locations')
    .insert({
      location_code: input.code.trim(),
      location_name: input.name.trim(),
      usage: input.usage,
      assigned_user_id: input.assigned_user_id || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
