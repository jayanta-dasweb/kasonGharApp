import { todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';

async function getLocationByUsage(usage: string, userId?: string | null) {
  let q = supabase
    .from('stock_locations')
    .select('*')
    .eq('usage', usage)
    .eq('is_active', true);
  if (usage === 'SALESPERSON' && userId) {
    q = q.eq('assigned_user_id', userId);
  }
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No active ${usage} location found`);
  return data;
}

export async function getOfficeStockValue() {
  try {
    const office = await getLocationByUsage('INTERNAL');
    const { data, error } = await supabase
      .from('stock_quants')
      .select('quantity')
      .eq('location_id', office.location_id);
    if (error) throw error;
    // Without unit cost on quants, show qty as value proxy = 0 cost basis
    return (data ?? []).reduce((sum, row: any) => sum + Number(row.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function getConsignmentStockValue() {
  try {
    const { data: locs, error: locErr } = await supabase
      .from('stock_locations')
      .select('location_id')
      .eq('usage', 'SALESPERSON')
      .eq('is_active', true);
    if (locErr) throw locErr;
    const ids = (locs ?? []).map((l) => l.location_id);
    if (!ids.length) return 0;
    const { data, error } = await supabase
      .from('stock_quants')
      .select('quantity')
      .in('location_id', ids);
    if (error) throw error;
    return (data ?? []).reduce((sum, row: any) => sum + Number(row.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function getQuantsForProduct(_productId: string) {
  return [];
}

export async function getMyStock(userId: string) {
  const loc = await getLocationByUsage('SALESPERSON', userId);
  const { data, error } = await supabase
    .from('stock_quants')
    .select('*')
    .eq('location_id', loc.location_id);
  if (error) throw error;
  return (data ?? []).filter((row: any) => Number(row.quantity ?? 0) > 0);
}

export type PurchaseLine = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export async function createVendorPurchase(input: {
  vendor_id: string;
  invoice_number: string;
  lines: PurchaseLine[];
  created_by?: string | null;
}) {
  if (!input.lines.length) throw new Error('Add at least one product line');
  const supplier = await getLocationByUsage('SUPPLIER');
  const office = await getLocationByUsage('INTERNAL');
  const moves = [];

  for (const line of input.lines) {
    const payload: Record<string, unknown> = {
      source_location_id: supplier.location_id,
      dest_location_id: office.location_id,
      quantity: line.quantity,
      state: 'DONE',
      unit_cost: line.unit_cost,
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_code: line.product_id,
      product_id: line.product_id,
      reference: input.invoice_number,
    };

    const { data, error } = await supabase
      .from('stock_moves')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // strip unknown cols and retry minimal
      const minimal = {
        source_location_id: supplier.location_id,
        dest_location_id: office.location_id,
        quantity: line.quantity,
        state: 'DONE',
        unit_cost: line.unit_cost,
        created_by: input.created_by ?? null,
        move_date: todayISO(),
      };
      const retry = await supabase.from('stock_moves').insert(minimal).select().single();
      if (retry.error) throw retry.error;
      moves.push(retry.data);
    } else {
      moves.push(data);
    }
  }
  return moves;
}

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
      source_location_id: office.location_id,
      dest_location_id: spLoc.location_id,
      quantity: input.quantity,
      state: 'DONE',
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_id: input.product_id,
      product_code: input.product_id,
    })
    .select()
    .single();
  if (error) {
    const retry = await supabase
      .from('stock_moves')
      .insert({
        source_location_id: office.location_id,
        dest_location_id: spLoc.location_id,
        quantity: input.quantity,
        state: 'DONE',
        created_by: input.created_by ?? null,
        move_date: todayISO(),
      })
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  return data;
}

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
      source_location_id: spLoc.location_id,
      dest_location_id: office.location_id,
      quantity: input.quantity,
      state: 'DONE',
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_id: input.product_id,
      product_code: input.product_id,
    })
    .select()
    .single();
  if (error) {
    const retry = await supabase
      .from('stock_moves')
      .insert({
        source_location_id: spLoc.location_id,
        dest_location_id: office.location_id,
        quantity: input.quantity,
        state: 'DONE',
        created_by: input.created_by ?? null,
        move_date: todayISO(),
      })
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  return data;
}
