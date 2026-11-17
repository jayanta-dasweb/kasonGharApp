import { createClient } from '@supabase/supabase-js';
import { phoneToAuthEmail } from '../lib/format';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_KEY ?? '';
const configured = Boolean(url && key && !url.includes('YOUR_SUPABASE'));
const supabase = createClient(url || 'http://localhost', key || 'test');
const describeIf = configured ? describe : describe.skip;

describeIf('Sales Reconciliation — ledger posting', () => {
  const phone = process.env.TEST_ADMIN_PHONE ?? '7002911685';
  const password = process.env.TEST_ADMIN_PASSWORD ?? 'SUPERadmin@123';

  beforeAll(async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(phone),
      password,
    });
    if (error) throw error;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it('writes sales_reconciliation after stock_move to CUSTOMER', async () => {
    const { data: product, error: pErr } = await supabase
      .from('master_products')
      .insert({
        product_code: `SALE-${Date.now()}`,
        name: 'Sale Recon Test',
        vendor_cost_price: 800,
        company_mrp: 2000,
        min_selling_price: 1500,
        is_active: true,
      })
      .select()
      .single();
    expect(pErr).toBeNull();

    const { data: supplier } = await supabase
      .from('stock_locations')
      .select('id')
      .eq('usage', 'SUPPLIER')
      .limit(1)
      .single();
    const { data: office } = await supabase
      .from('stock_locations')
      .select('id')
      .eq('usage', 'INTERNAL')
      .limit(1)
      .single();
    const { data: customerLoc } = await supabase
      .from('stock_locations')
      .select('id')
      .eq('usage', 'CUSTOMER')
      .limit(1)
      .single();

    // Seed office stock first
    await supabase.from('stock_moves').insert({
      product_id: product!.id,
      location_id: supplier!.id,
      location_dest_id: office!.id,
      quantity: 3,
      state: 'DONE',
      reference: `SEED-${Date.now()}`,
      unit_cost: 800,
    });

    const { data: outMove, error: outErr } = await supabase
      .from('stock_moves')
      .insert({
        product_id: product!.id,
        location_id: office!.id,
        location_dest_id: customerLoc!.id,
        quantity: 1,
        state: 'DONE',
        reference: `SALE-TEST-${Date.now()}`,
        unit_cost: 800,
      })
      .select()
      .single();
    expect(outErr).toBeNull();

    const saleDate = new Date().toISOString().slice(0, 10);
    const { data: recon, error: reconErr } = await supabase
      .from('sales_reconciliation')
      .insert({
        sale_date: saleDate,
        product_id: product!.id,
        quantity: 1,
        sale_price: 1800,
        channel: 'office',
        stock_move_id: outMove!.id,
      })
      .select()
      .single();

    expect(reconErr).toBeNull();
    expect(recon?.sale_price).toBe(1800);
    expect(recon?.stock_move_id).toBe(outMove!.id);
  });
});
