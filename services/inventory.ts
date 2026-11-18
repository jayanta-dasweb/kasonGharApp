import { todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { postPurchaseBill } from '@/services/accounts';

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

function locId(row: any) {
  return row.location_id ?? row.id;
}

export async function listStockQuants() {
  const { data, error } = await supabase.from('stock_quants').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function listRecentMoves(limit = 40) {
  const { data, error } = await supabase
    .from('stock_moves')
    .select('*')
    .order('move_date', { ascending: false })
    .limit(limit);
  if (error) {
    const retry = await supabase.from('stock_moves').select('*').limit(limit);
    if (retry.error) throw retry.error;
    return retry.data ?? [];
  }
  return data ?? [];
}

export async function adjustStockQuant(input: {
  product_id: string;
  location_id: string | number;
  quantity: number;
  unit_cost?: number;
}) {
  const { data: existing } = await supabase
    .from('stock_quants')
    .select('*')
    .eq('location_id', input.location_id)
    .or(`product_id.eq.${input.product_id},product_code.eq.${input.product_id}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('stock_quants')
      .update({
        quantity: input.quantity,
        unit_cost: input.unit_cost ?? (existing as any).unit_cost ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('quant_id', (existing as any).quant_id)
      .select()
      .single();
    if (error) {
      const retry = await supabase
        .from('stock_quants')
        .update({ quantity: input.quantity })
        .eq('id', (existing as any).id)
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    return data;
  }

  const insertAttempts = [
    {
      product_id: input.product_id,
      product_code: input.product_id,
      location_id: input.location_id,
      quantity: input.quantity,
      unit_cost: input.unit_cost ?? 0,
    },
    {
      product_code: input.product_id,
      location_id: input.location_id,
      quantity: input.quantity,
    },
  ];
  let lastErr: unknown = null;
  for (const payload of insertAttempts) {
    const { data, error } = await supabase
      .from('stock_quants')
      .insert(payload)
      .select()
      .single();
    if (!error) return data;
    lastErr = error;
  }
  throw lastErr;
}

export async function getOfficeStockValue() {
  try {
    const office = await getLocationByUsage('INTERNAL');
    const { data, error } = await supabase
      .from('stock_quants')
      .select('quantity,unit_cost')
      .eq('location_id', locId(office));
    if (error) throw error;
    return (data ?? []).reduce(
      (sum, row: any) =>
        sum + Number(row.quantity ?? 0) * Number(row.unit_cost ?? 0),
      0
    );
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
    const ids = (locs ?? []).map((l) => locId(l));
    if (!ids.length) return 0;
    const { data, error } = await supabase
      .from('stock_quants')
      .select('quantity,unit_cost')
      .in('location_id', ids);
    if (error) throw error;
    return (data ?? []).reduce(
      (sum, row: any) =>
        sum + Number(row.quantity ?? 0) * Number(row.unit_cost ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export async function getQuantsForProduct(productId: string) {
  const { data, error } = await supabase
    .from('stock_quants')
    .select('*')
    .or(`product_id.eq.${productId},product_code.eq.${productId}`);
  if (error) throw error;
  return data ?? [];
}

export async function getMyStock(userId: string) {
  const loc = await getLocationByUsage('SALESPERSON', userId);
  const { data, error } = await supabase
    .from('stock_quants')
    .select('*')
    .eq('location_id', locId(loc));
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
      source_location_id: locId(supplier),
      dest_location_id: locId(office),
      quantity: line.quantity,
      state: 'DONE',
      unit_cost: line.unit_cost,
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_code: line.product_id,
      product_id: line.product_id,
      reference: input.invoice_number,
      partner_id: input.vendor_id,
      move_type: 'IN',
    };

    const { data, error } = await supabase
      .from('stock_moves')
      .insert(payload)
      .select()
      .single();

    if (error) {
      const minimal = {
        source_location_id: locId(supplier),
        dest_location_id: locId(office),
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

    // Keep quants in sync for office stock visibility
    try {
      const { data: q } = await supabase
        .from('stock_quants')
        .select('*')
        .eq('location_id', locId(office))
        .or(`product_id.eq.${line.product_id},product_code.eq.${line.product_id}`)
        .limit(1)
        .maybeSingle();
      const nextQty = Number((q as any)?.quantity ?? 0) + Number(line.quantity);
      await adjustStockQuant({
        product_id: line.product_id,
        location_id: locId(office),
        quantity: nextQty,
        unit_cost: line.unit_cost,
      });
    } catch {
      // quant sync is best-effort if schema differs
    }
  }

  const billAmount = input.lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unit_cost),
    0
  );
  let accountMove = null;
  try {
    accountMove = await postPurchaseBill({
      vendor_id: input.vendor_id,
      invoice_number: input.invoice_number,
      amount: billAmount,
      created_by: input.created_by,
    });
  } catch {
    // Accounting may be incomplete until CoA is seeded; stock still posts
  }

  return { moves, accountMove, billAmount };
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
      source_location_id: locId(office),
      dest_location_id: locId(spLoc),
      quantity: input.quantity,
      state: 'DONE',
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_id: input.product_id,
      product_code: input.product_id,
      move_type: 'ALLOCATION',
    })
    .select()
    .single();
  if (error) {
    const retry = await supabase
      .from('stock_moves')
      .insert({
        source_location_id: locId(office),
        dest_location_id: locId(spLoc),
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
      source_location_id: locId(spLoc),
      dest_location_id: locId(office),
      quantity: input.quantity,
      state: 'DONE',
      created_by: input.created_by ?? null,
      move_date: todayISO(),
      product_id: input.product_id,
      product_code: input.product_id,
      move_type: 'RETURN',
    })
    .select()
    .single();
  if (error) {
    const retry = await supabase
      .from('stock_moves')
      .insert({
        source_location_id: locId(spLoc),
        dest_location_id: locId(office),
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
