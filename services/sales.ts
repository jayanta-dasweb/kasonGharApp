import { todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export async function createSalesReconciliation(input: {
  product_id: string;
  quantity: number;
  sale_price: number;
  channel: 'consignment' | 'office';
  customer_id?: string | null;
  salesperson_id?: string | null;
  created_by?: string | null;
}) {
  const sourceUsage = input.channel === 'office' ? 'INTERNAL' : 'SALESPERSON';

  let sourceQ = supabase
    .from('stock_locations')
    .select('*')
    .eq('usage', sourceUsage)
    .eq('is_active', true);

  if (sourceUsage === 'SALESPERSON') {
    if (!input.salesperson_id) throw new Error('Salesperson required for consignment sale');
    sourceQ = sourceQ.eq('assigned_user_id', input.salesperson_id);
  }

  const { data: sourceLoc, error: srcErr } = await sourceQ.limit(1).maybeSingle();
  if (srcErr) throw srcErr;
  if (!sourceLoc) throw new Error(`Source ${sourceUsage} location not found`);

  const { data: customerLoc, error: custErr } = await supabase
    .from('stock_locations')
    .select('*')
    .eq('usage', 'CUSTOMER')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (custErr) throw custErr;
  if (!customerLoc) throw new Error('CUSTOMER location not found');

  // Stock move — live schema uses source/dest location ids
  const movePayload: Record<string, unknown> = {
    source_location_id: sourceLoc.location_id,
    dest_location_id: customerLoc.location_id,
    quantity: input.quantity,
    state: 'DONE',
    unit_cost: input.sale_price,
    created_by: input.created_by ?? null,
    move_date: todayISO(),
    product_id: input.product_id,
    product_code: input.product_id,
  };

  const { data: stockMove, error: moveErr } = await supabase
    .from('stock_moves')
    .insert(movePayload)
    .select()
    .single();

  let moveId: string | number | null = null;
  if (moveErr) {
    const retry = await supabase
      .from('stock_moves')
      .insert({
        source_location_id: sourceLoc.location_id,
        dest_location_id: customerLoc.location_id,
        quantity: input.quantity,
        state: 'DONE',
        unit_cost: input.sale_price,
        created_by: input.created_by ?? null,
        move_date: todayISO(),
      })
      .select()
      .single();
    if (retry.error) throw retry.error;
    moveId = retry.data.move_id;
  } else {
    moveId = stockMove.move_id;
  }

  const reconAttempts = [
    {
      sale_date: todayISO(),
      product_code: input.product_id,
      product_id: input.product_id,
      salesperson_id: input.salesperson_id ?? null,
      customer_id: input.customer_id ?? null,
      quantity: input.quantity,
      sale_price: input.sale_price,
      channel: input.channel,
      stock_move_id: moveId,
    },
  ];

  let lastError: unknown = null;
  for (const payload of reconAttempts) {
    const { data, error } = await supabase
      .from('sales_reconciliation')
      .insert(payload)
      .select()
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}
