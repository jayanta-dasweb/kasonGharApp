import { todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { StockMove } from '@/types/database';

async function getLocationByUsage(usage: string, userId?: string | null) {
  let q = supabase.from('stock_locations').select('*').eq('usage', usage).eq('is_active', true);
  if (usage === 'SALESPERSON' && userId) {
    q = q.eq('user_id', userId);
  }
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No active ${usage} location found`);
  return data;
}

export async function getOfficeStockValue() {
  const office = await getLocationByUsage('INTERNAL');
  const { data, error } = await supabase
    .from('stock_quants')
    .select('quantity, product_id, master_products(vendor_cost_price)')
    .eq('location_id', office.id);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => {
    const cost = (row.master_products as { vendor_cost_price: number } | null)?.vendor_cost_price ?? 0;
    return sum + Number(row.quantity) * Number(cost);
  }, 0);
}

export async function getConsignmentStockValue() {
  const { data: locs, error: locErr } = await supabase
    .from('stock_locations')
    .select('id')
    .eq('usage', 'SALESPERSON')
    .eq('is_active', true);
  if (locErr) throw locErr;
  const ids = (locs ?? []).map((l) => l.id);
  if (!ids.length) return 0;

  const { data, error } = await supabase
    .from('stock_quants')
    .select('quantity, master_products(vendor_cost_price)')
    .in('location_id', ids);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => {
    const cost = (row.master_products as { vendor_cost_price: number } | null)?.vendor_cost_price ?? 0;
    return sum + Number(row.quantity) * Number(cost);
  }, 0);
}

export async function getQuantsForProduct(productId: string) {
  const { data, error } = await supabase
    .from('stock_quants')
    .select('*, stock_locations(name, usage, user_id)')
    .eq('product_id', productId);
  if (error) throw error;
  return data ?? [];
}

export async function getMyStock(userId: string) {
  const loc = await getLocationByUsage('SALESPERSON', userId);
  const { data, error } = await supabase
    .from('stock_quants')
    .select('quantity, master_products(id, product_code, name, company_mrp, min_selling_price)')
    .eq('location_id', loc.id)
    .gt('quantity', 0);
  if (error) throw error;
  return data ?? [];
}

export type PurchaseLine = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

/** Vendor purchase: stock_move SUPPLIER → INTERNAL + IN_BILL journal */
export async function createVendorPurchase(input: {
  vendor_id: string;
  invoice_number: string;
  lines: PurchaseLine[];
  created_by?: string | null;
}) {
  if (!input.lines.length) throw new Error('Add at least one product line');

  const supplier = await getLocationByUsage('SUPPLIER');
  const office = await getLocationByUsage('INTERNAL');

  const moves: StockMove[] = [];
  for (const line of input.lines) {
    const { data, error } = await supabase
      .from('stock_moves')
      .insert({
        product_id: line.product_id,
        location_id: supplier.id,
        location_dest_id: office.id,
        quantity: line.quantity,
        state: 'DONE',
        reference: input.invoice_number,
        unit_cost: line.unit_cost,
        created_by: input.created_by ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    moves.push(data as StockMove);
  }

  const total = input.lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  const { data: journal } = await supabase
    .from('account_journals')
    .select('id')
    .eq('code', 'IN_BILL')
    .maybeSingle();

  const { data: invAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '1300')
    .maybeSingle();
  const { data: apAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '2000')
    .maybeSingle();

  if (journal && invAcct && apAcct) {
    const { data: move, error: moveErr } = await supabase
      .from('account_moves')
      .insert({
        journal_id: journal.id,
        name: `INB/${input.invoice_number}`,
        date: todayISO(),
        ref: input.invoice_number,
        state: 'posted',
        move_type: 'IN_BILL',
      })
      .select()
      .single();
    if (moveErr) throw moveErr;

    const { error: linesErr } = await supabase.from('account_move_lines').insert([
      {
        move_id: move.id,
        account_id: invAcct.id,
        name: `Purchase ${input.invoice_number}`,
        debit: total,
        credit: 0,
        partner_id: input.vendor_id,
      },
      {
        move_id: move.id,
        account_id: apAcct.id,
        name: `AP ${input.invoice_number}`,
        debit: 0,
        credit: total,
        partner_id: input.vendor_id,
      },
    ]);
    if (linesErr) throw linesErr;
  }

  return moves;
}

/** Allocate office stock → salesperson location */
export async function allocateToSalesperson(input: {
  product_id: string;
  quantity: number;
  salesperson_user_id: string;
  created_by?: string | null;
}) {
  const office = await getLocationByUsage('INTERNAL');
  const spLoc = await getLocationByUsage('SALESPERSON', input.salesperson_user_id);

  const { data, error } = await supabase
    .from('stock_moves')
    .insert({
      product_id: input.product_id,
      location_id: office.id,
      location_dest_id: spLoc.id,
      quantity: input.quantity,
      state: 'DONE',
      reference: `ALLOC/${todayISO()}`,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as StockMove;
}

/** Return unsold stock salesperson → office */
export async function returnFromSalesperson(input: {
  product_id: string;
  quantity: number;
  salesperson_user_id: string;
  created_by?: string | null;
}) {
  const office = await getLocationByUsage('INTERNAL');
  const spLoc = await getLocationByUsage('SALESPERSON', input.salesperson_user_id);

  const { data, error } = await supabase
    .from('stock_moves')
    .insert({
      product_id: input.product_id,
      location_id: spLoc.id,
      location_dest_id: office.id,
      quantity: input.quantity,
      state: 'DONE',
      reference: `RET/${todayISO()}`,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as StockMove;
}
