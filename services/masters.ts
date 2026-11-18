import { supabase } from '@/lib/supabase';

function mapRow(row: any, idKey: string, nameKey: string) {
  return {
    ...row,
    id: row[idKey] ?? row.product_code ?? row.code,
    name: row[nameKey] ?? row.name ?? row.product_name ?? String(row[idKey] ?? ''),
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

export async function createFabric(input: {
  name: string;
  description?: string;
  origin?: string;
}) {
  const payload: Record<string, unknown> = {
    fabric_name: input.name.trim(),
    description: input.description?.trim() || null,
    is_active: true,
  };
  if (input.origin?.trim()) payload.origin = input.origin.trim();

  const { data, error } = await supabase
    .from('master_fabrics')
    .insert(payload)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('master_fabrics')
      .insert({
        fabric_name: input.name.trim(),
        description: input.description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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

export async function createWeave(input: {
  name: string;
  description?: string;
  region?: string;
  motif?: string;
}) {
  const payload: Record<string, unknown> = {
    weave_name: input.name.trim(),
    description: input.description?.trim() || null,
    is_active: true,
  };
  if (input.region?.trim()) payload.region = input.region.trim();
  if (input.motif?.trim()) payload.motif = input.motif.trim();

  const { data, error } = await supabase
    .from('master_weaves')
    .insert(payload)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('master_weaves')
      .insert({
        weave_name: input.name.trim(),
        description: input.description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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
    name: r.fy_name || `${r.start_date} → ${r.end_date}`,
  }));
}

export async function createFinancialYear(input: {
  fy_name?: string;
  start_date: string;
  end_date: string;
}) {
  const payload: Record<string, unknown> = {
    start_date: input.start_date.trim(),
    end_date: input.end_date.trim(),
    is_closed: false,
  };
  if (input.fy_name?.trim()) payload.fy_name = input.fy_name.trim();
  payload.is_active = true;

  const { data, error } = await supabase
    .from('master_financial_years')
    .insert(payload)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('master_financial_years')
      .insert({
        start_date: input.start_date.trim(),
        end_date: input.end_date.trim(),
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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
  pincode?: string;
  gstin?: string;
  pan?: string;
  contact_person?: string;
  credit_limit?: number;
  payment_terms?: string;
  bank_name?: string;
  bank_account?: string;
  ifsc?: string;
  notes?: string;
}) {
  const full: Record<string, unknown> = {
    partner_name: input.name.trim(),
    partner_type: input.partner_type,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    pincode: input.pincode?.trim() || null,
    gstin: input.gstin?.trim() || null,
    pan: input.pan?.trim() || null,
    contact_person: input.contact_person?.trim() || null,
    credit_limit: Number(input.credit_limit ?? 0),
    payment_terms: input.payment_terms?.trim() || null,
    bank_name: input.bank_name?.trim() || null,
    bank_account: input.bank_account?.trim() || null,
    ifsc: input.ifsc?.trim() || null,
    notes: input.notes?.trim() || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('master_partners')
    .insert(full)
    .select()
    .single();

  if (error) {
    // Fallback to columns known to exist before enrichment
    const { data: d2, error: e2 } = await supabase
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
    if (e2) throw e2;
    return d2;
  }
  return data;
}

export async function listProducts(search?: string) {
  let q = supabase.from('master_products').select('*').order('product_code');
  if (search?.trim()) {
    const s = search.trim();
    q = q.or(
      `product_code.ilike.%${s}%,product_name.ilike.%${s}%,color.ilike.%${s}%,design_name.ilike.%${s}%`
    );
  }
  const { data, error } = await q;
  if (error) {
    // color/design may not exist yet
    let q2 = supabase.from('master_products').select('*').order('product_code');
    if (search?.trim()) {
      const s = search.trim();
      q2 = q2.or(`product_code.ilike.%${s}%,product_name.ilike.%${s}%`);
    }
    const res = await q2;
    if (res.error) throw res.error;
    return (res.data ?? []).map((r: any) => ({
      ...r,
      id: r.product_code,
      name: r.product_name,
    }));
  }
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
  color?: string;
  design_name?: string;
  barcode?: string;
  hsn_code?: string;
  uom?: string;
  vendor_cost_price: number;
  company_mrp: number;
  min_selling_price: number;
  wholesale_price?: number;
  reorder_level?: number;
  length_mtr?: number;
  width_inch?: number;
  notes?: string;
}) {
  const full: Record<string, unknown> = {
    product_code: input.product_code.trim(),
    product_name: input.name.trim(),
    category_id: input.category_id || null,
    fabric_id: input.fabric_id || null,
    weave_id: input.weave_id || null,
    color: input.color?.trim() || null,
    design_name: input.design_name?.trim() || null,
    barcode: input.barcode?.trim() || null,
    hsn_code: input.hsn_code?.trim() || null,
    uom: input.uom?.trim() || 'PCS',
    vendor_cost_price: input.vendor_cost_price,
    company_mrp: input.company_mrp,
    min_selling_price: input.min_selling_price,
    wholesale_price: Number(input.wholesale_price ?? 0),
    reorder_level: Number(input.reorder_level ?? 0),
    length_mtr: input.length_mtr ?? null,
    width_inch: input.width_inch ?? null,
    notes: input.notes?.trim() || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('master_products')
    .insert(full)
    .select()
    .single();

  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('master_products')
      .insert({
        product_code: input.product_code.trim(),
        product_name: input.name.trim(),
        category_id: input.category_id || null,
        fabric_id: input.fabric_id || null,
        weave_id: input.weave_id || null,
        hsn_code: input.hsn_code?.trim() || null,
        vendor_cost_price: input.vendor_cost_price,
        company_mrp: input.company_mrp,
        min_selling_price: input.min_selling_price,
        is_active: true,
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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

export async function createExpenseHead(input: {
  name: string;
  description?: string;
}) {
  const full: Record<string, unknown> = {
    head_name: input.name.trim(),
    description: input.description?.trim() || null,
    is_active: true,
  };
  const { data, error } = await supabase
    .from('master_expense_heads')
    .insert(full)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('master_expense_heads')
      .insert({ head_name: input.name.trim(), is_active: true })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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
  account_subtype?: string;
  opening_balance?: number;
  is_reconcilable?: boolean;
  notes?: string;
}) {
  const full: Record<string, unknown> = {
    code: input.code.trim(),
    name: input.name.trim(),
    account_type: input.account_type.trim(),
    account_subtype: input.account_subtype?.trim() || null,
    opening_balance: Number(input.opening_balance ?? 0),
    is_reconcilable: Boolean(input.is_reconcilable),
    notes: input.notes?.trim() || null,
    is_active: true,
  };
  const { data, error } = await supabase
    .from('account_accounts')
    .insert(full)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('account_accounts')
      .insert({
        code: input.code.trim(),
        name: input.name.trim(),
        account_type: input.account_type.trim(),
        is_active: true,
      })
      .select()
      .single();
    if (e2) throw e2;
    return d2;
  }
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
  notes?: string;
}) {
  const full: Record<string, unknown> = {
    code: input.code.trim(),
    name: input.name.trim(),
    type: input.type.trim(),
    notes: input.notes?.trim() || null,
    is_active: true,
  };
  const { data, error } = await supabase
    .from('account_journals')
    .insert(full)
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
  address?: string;
  notes?: string;
}) {
  const full: Record<string, unknown> = {
    location_code: input.code.trim(),
    location_name: input.name.trim(),
    usage: input.usage,
    assigned_user_id: input.assigned_user_id || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    is_active: true,
  };
  const { data, error } = await supabase
    .from('stock_locations')
    .insert(full)
    .select()
    .single();
  if (error) {
    const { data: d2, error: e2 } = await supabase
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
    if (e2) throw e2;
    return d2;
  }
  return data;
}

/** ---------- Generic update / soft-deactivate / delete ---------- */

async function updateBy(
  table: string,
  idCol: string,
  id: string | number,
  patch: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq(idCol, id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteBy(table: string, idCol: string, id: string | number) {
  const { error } = await supabase.from(table).delete().eq(idCol, id);
  if (error) {
    // Prefer soft-deactivate when FK blocks hard delete
    if (String(error.message).toLowerCase().includes('foreign') || error.code === '23503') {
      try {
        await updateBy(table, idCol, id, { is_active: false });
        throw new Error('Record is in use — marked Inactive instead of deleting');
      } catch (e) {
        if (e instanceof Error && e.message.includes('Inactive')) throw e;
        throw new Error('Cannot delete: record is used by inventory/accounts. Deactivate instead.');
      }
    }
    throw error;
  }
}

async function setActive(
  table: string,
  idCol: string,
  id: string | number,
  isActive: boolean
) {
  return updateBy(table, idCol, id, { is_active: isActive });
}

export async function updateCategory(id: string | number, input: { name: string; description?: string }) {
  return updateBy('master_categories', 'category_id', id, {
    category_name: input.name.trim(),
    description: input.description?.trim() || null,
  });
}
export async function setCategoryActive(id: string | number, active: boolean) {
  return setActive('master_categories', 'category_id', id, active);
}
export async function deleteCategory(id: string | number) {
  return deleteBy('master_categories', 'category_id', id);
}

export async function updateFabric(
  id: string | number,
  input: { name: string; description?: string; origin?: string }
) {
  const patch: Record<string, unknown> = {
    fabric_name: input.name.trim(),
    description: input.description?.trim() || null,
  };
  if (input.origin !== undefined) patch.origin = input.origin?.trim() || null;
  return updateBy('master_fabrics', 'fabric_id', id, patch);
}
export async function setFabricActive(id: string | number, active: boolean) {
  return setActive('master_fabrics', 'fabric_id', id, active);
}
export async function deleteFabric(id: string | number) {
  return deleteBy('master_fabrics', 'fabric_id', id);
}

export async function updateWeave(
  id: string | number,
  input: { name: string; description?: string; region?: string; motif?: string }
) {
  const patch: Record<string, unknown> = {
    weave_name: input.name.trim(),
    description: input.description?.trim() || null,
  };
  if (input.region !== undefined) patch.region = input.region?.trim() || null;
  if (input.motif !== undefined) patch.motif = input.motif?.trim() || null;
  return updateBy('master_weaves', 'weave_id', id, patch);
}
export async function setWeaveActive(id: string | number, active: boolean) {
  return setActive('master_weaves', 'weave_id', id, active);
}
export async function deleteWeave(id: string | number) {
  return deleteBy('master_weaves', 'weave_id', id);
}

export async function updateFinancialYear(
  id: string | number,
  input: { fy_name?: string; start_date: string; end_date: string; is_closed?: boolean }
) {
  const patch: Record<string, unknown> = {
    start_date: input.start_date.trim(),
    end_date: input.end_date.trim(),
  };
  if (input.fy_name !== undefined) patch.fy_name = input.fy_name?.trim() || null;
  if (input.is_closed !== undefined) patch.is_closed = input.is_closed;
  return updateBy('master_financial_years', 'fy_id', id, patch);
}
export async function deleteFinancialYear(id: string | number) {
  return deleteBy('master_financial_years', 'fy_id', id);
}

export async function updatePartner(id: string | number, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    partner_name: String(input.name ?? '').trim(),
    partner_type: input.partner_type,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    pincode: input.pincode || null,
    gstin: input.gstin || null,
    pan: input.pan || null,
    contact_person: input.contact_person || null,
    credit_limit: Number(input.credit_limit ?? 0),
    payment_terms: input.payment_terms || null,
    bank_name: input.bank_name || null,
    bank_account: input.bank_account || null,
    ifsc: input.ifsc || null,
    notes: input.notes || null,
  };
  try {
    return await updateBy('master_partners', 'partner_id', id, patch);
  } catch {
    return updateBy('master_partners', 'partner_id', id, {
      partner_name: patch.partner_name,
      partner_type: patch.partner_type,
      phone: patch.phone,
      email: patch.email,
      address: patch.address,
      city: patch.city,
      state: patch.state,
    });
  }
}
export async function setPartnerActive(id: string | number, active: boolean) {
  return setActive('master_partners', 'partner_id', id, active);
}
export async function deletePartner(id: string | number) {
  return deleteBy('master_partners', 'partner_id', id);
}

export async function updateProduct(code: string, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    product_name: String(input.name ?? '').trim(),
    category_id: input.category_id || null,
    fabric_id: input.fabric_id || null,
    weave_id: input.weave_id || null,
    color: input.color || null,
    design_name: input.design_name || null,
    barcode: input.barcode || null,
    hsn_code: input.hsn_code || null,
    uom: input.uom || 'PCS',
    vendor_cost_price: Number(input.vendor_cost_price ?? 0),
    company_mrp: Number(input.company_mrp ?? 0),
    min_selling_price: Number(input.min_selling_price ?? 0),
    wholesale_price: Number(input.wholesale_price ?? 0),
    reorder_level: Number(input.reorder_level ?? 0),
    length_mtr: input.length_mtr ?? null,
    width_inch: input.width_inch ?? null,
    notes: input.notes || null,
  };
  try {
    return await updateBy('master_products', 'product_code', code, patch);
  } catch {
    return updateBy('master_products', 'product_code', code, {
      product_name: patch.product_name,
      category_id: patch.category_id,
      fabric_id: patch.fabric_id,
      weave_id: patch.weave_id,
      hsn_code: patch.hsn_code,
      vendor_cost_price: patch.vendor_cost_price,
      company_mrp: patch.company_mrp,
      min_selling_price: patch.min_selling_price,
    });
  }
}
export async function setProductActive(code: string, active: boolean) {
  return setActive('master_products', 'product_code', code, active);
}
export async function deleteProduct(code: string) {
  return deleteBy('master_products', 'product_code', code);
}

export async function updateExpenseHead(id: string | number, input: { name: string; description?: string }) {
  const patch: Record<string, unknown> = { head_name: input.name.trim() };
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  return updateBy('master_expense_heads', 'expense_head_id', id, patch);
}
export async function setExpenseHeadActive(id: string | number, active: boolean) {
  return setActive('master_expense_heads', 'expense_head_id', id, active);
}
export async function deleteExpenseHead(id: string | number) {
  return deleteBy('master_expense_heads', 'expense_head_id', id);
}

export async function updateAccount(id: string | number, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    code: input.code,
    name: input.name,
    account_type: input.account_type,
    account_subtype: input.account_subtype || null,
    opening_balance: Number(input.opening_balance ?? 0),
    notes: input.notes || null,
  };
  try {
    return await updateBy('account_accounts', 'account_id', id, patch);
  } catch {
    return updateBy('account_accounts', 'account_id', id, {
      code: patch.code,
      name: patch.name,
      account_type: patch.account_type,
    });
  }
}
export async function setAccountActive(id: string | number, active: boolean) {
  return setActive('account_accounts', 'account_id', id, active);
}
export async function deleteAccount(id: string | number) {
  return deleteBy('account_accounts', 'account_id', id);
}

export async function updateJournal(id: string | number, input: { code: string; name: string; type: string; notes?: string }) {
  return updateBy('account_journals', 'journal_id', id, {
    code: input.code.trim(),
    name: input.name.trim(),
    type: input.type.trim(),
    notes: input.notes?.trim() || null,
  });
}
export async function setJournalActive(id: string | number, active: boolean) {
  return setActive('account_journals', 'journal_id', id, active);
}
export async function deleteJournal(id: string | number) {
  return deleteBy('account_journals', 'journal_id', id);
}

export async function updateLocation(id: string | number, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    location_code: input.code,
    location_name: input.name,
    usage: input.usage,
    address: input.address || null,
    notes: input.notes || null,
  };
  try {
    return await updateBy('stock_locations', 'location_id', id, patch);
  } catch {
    return updateBy('stock_locations', 'location_id', id, {
      location_code: patch.location_code,
      location_name: patch.location_name,
      usage: patch.usage,
    });
  }
}
export async function setLocationActive(id: string | number, active: boolean) {
  return setActive('stock_locations', 'location_id', id, active);
}
export async function deleteLocation(id: string | number) {
  return deleteBy('stock_locations', 'location_id', id);
}
