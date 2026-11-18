import { supabase } from '@/lib/supabase';

export async function listCategories() {
  const { data, error } = await supabase
    .from('master_categories')
    .select('*')
    .order('category_name');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.category_id,
    name: r.category_name,
  }));
}

export async function createCategory(name: string) {
  const { data, error } = await supabase
    .from('master_categories')
    .insert({ category_name: name, is_active: true })
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
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.fabric_id,
    name: r.fabric_name,
  }));
}

export async function createFabric(name: string) {
  const { data, error } = await supabase
    .from('master_fabrics')
    .insert({ fabric_name: name, is_active: true })
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
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.weave_id,
    name: r.weave_name,
  }));
}

export async function createWeave(name: string) {
  const { data, error } = await supabase
    .from('master_weaves')
    .insert({ weave_name: name, is_active: true })
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
    name: r.fy_name ?? `${r.start_date} → ${r.end_date}`,
  }));
}

export async function createFinancialYear(input: {
  name: string;
  start_date: string;
  end_date: string;
}) {
  const payload: Record<string, unknown> = {
    start_date: input.start_date,
    end_date: input.end_date,
  };
  // fy_name may or may not exist
  payload.fy_name = input.name;
  const { data, error } = await supabase
    .from('master_financial_years')
    .insert(payload)
    .select()
    .single();
  if (error) {
    // retry without fy_name
    const retry = await supabase
      .from('master_financial_years')
      .insert({ start_date: input.start_date, end_date: input.end_date })
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  return data;
}

export async function listPartners(type?: string) {
  let q = supabase.from('master_partners').select('*').order('partner_name');
  if (type === 'vendor') q = q.in('partner_type', ['vendor', 'VENDOR', 'both', 'BOTH']);
  if (type === 'customer')
    q = q.in('partner_type', ['customer', 'CUSTOMER', 'both', 'BOTH']);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.partner_id,
    name: r.partner_name,
  }));
}

export async function createPartner(input: {
  name: string;
  partner_type: string;
  phone?: string | null;
  address?: string | null;
}) {
  const { data, error } = await supabase
    .from('master_partners')
    .insert({
      partner_name: input.name,
      partner_type: input.partner_type,
      phone: input.phone ?? null,
      address: input.address ?? null,
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
    id: r.product_id ?? r.product_code,
    name: r.product_name,
  }));
}

export async function createProduct(input: {
  product_code: string;
  name: string;
  vendor_cost_price: number;
  company_mrp: number;
  min_selling_price: number;
}) {
  const { data, error } = await supabase
    .from('master_products')
    .insert({
      product_code: input.product_code,
      product_name: input.name,
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

export async function updateProduct(code: string, input: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('master_products')
    .update(input)
    .eq('product_code', code)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listExpenseHeads() {
  const { data, error } = await supabase.from('master_expense_heads').select('*');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.expense_head_id ?? r.id,
    name: r.expense_name ?? r.name ?? r.head_name,
  }));
}

export async function createExpenseHead(name: string) {
  const attempts = [
    { expense_name: name, is_active: true },
    { name, is_active: true },
    { head_name: name, is_active: true },
  ];
  let lastError: unknown = null;
  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('master_expense_heads')
      .insert(payload)
      .select()
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

export async function listAccounts() {
  const { data, error } = await supabase.from('account_accounts').select('*');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    id: r.account_id ?? r.id,
    name: r.account_name ?? r.name,
    code: r.account_code ?? r.code,
  }));
}

export async function createAccount(input: {
  code: string;
  name: string;
  account_type: string;
}) {
  const attempts = [
    {
      account_code: input.code,
      account_name: input.name,
      account_type: input.account_type,
      is_active: true,
    },
    {
      code: input.code,
      name: input.name,
      account_type: input.account_type,
      is_active: true,
    },
  ];
  let lastError: unknown = null;
  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('account_accounts')
      .insert(payload)
      .select()
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}
