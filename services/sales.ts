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

  const { data: product, error: prodErr } = await supabase
    .from('master_products')
    .select('vendor_cost_price')
    .eq('id', input.product_id)
    .single();
  if (prodErr) throw prodErr;

  const { data: stockMove, error: moveErr } = await supabase
    .from('stock_moves')
    .insert({
      product_id: input.product_id,
      location_id: sourceLoc.location_id,
      location_dest_id: customerLoc.location_id,
      quantity: input.quantity,
      state: 'DONE',
      reference: `SALE/${todayISO()}`,
      unit_cost: product.vendor_cost_price,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();
  if (moveErr) throw moveErr;

  const revenue = input.quantity * input.sale_price;
  const cogs = input.quantity * Number(product.vendor_cost_price);

  const { data: journal } = await supabase
    .from('account_journals')
    .select('id')
    .eq('code', 'OUT_INVOICE')
    .maybeSingle();

  const { data: salesAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '4000')
    .maybeSingle();
  const { data: arAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '1100')
    .maybeSingle();
  const { data: cogsAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '5000')
    .maybeSingle();
  const { data: invAcct } = await supabase
    .from('account_accounts')
    .select('id')
    .eq('code', '1300')
    .maybeSingle();

  let accountMoveId: string | null = null;

  if (journal && salesAcct && arAcct && cogsAcct && invAcct) {
    const { data: acctMove, error: acctErr } = await supabase
      .from('account_moves')
      .insert({
        journal_id: journal.id,
        name: `OUT/${todayISO()}`,
        date: todayISO(),
        ref: stockMove.id,
        state: 'posted',
        move_type: 'OUT_INVOICE',
      })
      .select()
      .single();
    if (acctErr) throw acctErr;
    accountMoveId = acctMove.id;

    const { error: linesErr } = await supabase.from('account_move_lines').insert([
      {
        move_id: acctMove.id,
        account_id: arAcct.id,
        name: 'Accounts Receivable',
        debit: revenue,
        credit: 0,
        partner_id: input.customer_id ?? null,
      },
      {
        move_id: acctMove.id,
        account_id: salesAcct.id,
        name: 'Sales Revenue',
        debit: 0,
        credit: revenue,
        partner_id: input.customer_id ?? null,
      },
      {
        move_id: acctMove.id,
        account_id: cogsAcct.id,
        name: 'COGS',
        debit: cogs,
        credit: 0,
        partner_id: null,
      },
      {
        move_id: acctMove.id,
        account_id: invAcct.id,
        name: 'Inventory',
        debit: 0,
        credit: cogs,
        partner_id: null,
      },
    ]);
    if (linesErr) throw linesErr;
  }

  const { data: recon, error: reconErr } = await supabase
    .from('sales_reconciliation')
    .insert({
      sale_date: todayISO(),
      product_id: input.product_id,
      salesperson_id: input.salesperson_id ?? null,
      customer_id: input.customer_id ?? null,
      quantity: input.quantity,
      sale_price: input.sale_price,
      channel: input.channel,
      stock_move_id: stockMove.id,
      account_move_id: accountMoveId,
    })
    .select()
    .single();
  if (reconErr) throw reconErr;

  return recon;
}
