import { supabase } from '@/lib/supabase';
import type { Database, Partner, Product } from '@/types/database';

type Category = Database['public']['Tables']['master_categories']['Row'];
type Fabric = Database['public']['Tables']['master_fabrics']['Row'];
type Weave = Database['public']['Tables']['master_weaves']['Row'];
type FY = Database['public']['Tables']['master_financial_years']['Row'];
type ExpenseHead = Database['public']['Tables']['master_expense_heads']['Row'];
type Account = Database['public']['Tables']['account_accounts']['Row'];

export async function listCategories() {
  const { data, error } = await supabase
    .from('master_categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(name: string) {
  const { data, error } = await supabase
    .from('master_categories')
    .insert({ name, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function listFabrics() {
  const { data, error } = await supabase.from('master_fabrics').select('*').order('name');
  if (error) throw error;
  return data as Fabric[];
}

export async function createFabric(name: string) {
  const { data, error } = await supabase
    .from('master_fabrics')
    .insert({ name, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Fabric;
}

export async function listWeaves() {
  const { data, error } = await supabase.from('master_weaves').select('*').order('name');
  if (error) throw error;
  return data as Weave[];
}

export async function createWeave(name: string) {
  const { data, error } = await supabase
    .from('master_weaves')
    .insert({ name, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Weave;
}

export async function listFinancialYears() {
  const { data, error } = await supabase
    .from('master_financial_years')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data as FY[];
}

export async function createFinancialYear(input: {
  name: string;
  start_date: string;
  end_date: string;
}) {
  const { data, error } = await supabase
    .from('master_financial_years')
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as FY;
}

export async function listPartners(type?: string) {
  let q = supabase.from('master_partners').select('*').order('name');
  if (type === 'vendor') q = q.in('partner_type', ['vendor', 'both']);
  if (type === 'customer') q = q.in('partner_type', ['customer', 'both']);
  const { data, error } = await q;
  if (error) throw error;
  return data as Partner[];
}

export async function createPartner(
  input: Database['public']['Tables']['master_partners']['Insert']
) {
  const { data, error } = await supabase
    .from('master_partners')
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Partner;
}

export async function listProducts(search?: string) {
  let q = supabase.from('master_products').select('*').order('product_code');
  if (search?.trim()) {
    const s = search.trim();
    q = q.or(
      `product_code.ilike.%${s}%,name.ilike.%${s}%,color.ilike.%${s}%`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(
  input: Database['public']['Tables']['master_products']['Insert']
) {
  const { data, error } = await supabase
    .from('master_products')
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Database['public']['Tables']['master_products']['Update']
) {
  const { data, error } = await supabase
    .from('master_products')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function listExpenseHeads() {
  const { data, error } = await supabase
    .from('master_expense_heads')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as ExpenseHead[];
}

export async function createExpenseHead(name: string) {
  const { data, error } = await supabase
    .from('master_expense_heads')
    .insert({ name, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseHead;
}

export async function listAccounts() {
  const { data, error } = await supabase
    .from('account_accounts')
    .select('*')
    .order('code');
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(
  input: Database['public']['Tables']['account_accounts']['Insert']
) {
  const { data, error } = await supabase
    .from('account_accounts')
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Account;
}
