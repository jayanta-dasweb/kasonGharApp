import { createClient } from '@supabase/supabase-js';
import { phoneToAuthEmail } from '../lib/format';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_KEY ?? '';
const configured = Boolean(url && key && !url.includes('YOUR_SUPABASE'));
const supabase = createClient(url || 'http://localhost', key || 'test');
const describeIf = configured ? describe : describe.skip;

describeIf('Stock Movement — DONE updates stock_quants', () => {
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

  it('increments office quant after DONE move from SUPPLIER', async () => {
    const { data: product, error: pErr } = await supabase
      .from('master_products')
      .insert({
        product_code: `QNT-${Date.now()}`,
        name: 'Quant Trigger Test',
        vendor_cost_price: 500,
        company_mrp: 1200,
        min_selling_price: 900,
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

    const qty = 5;
    const { error: moveErr } = await supabase.from('stock_moves').insert({
      product_id: product!.id,
      location_id: supplier!.id,
      location_dest_id: office!.id,
      quantity: qty,
      state: 'DONE',
      reference: `QNT-MOVE-${Date.now()}`,
      unit_cost: 500,
    });
    expect(moveErr).toBeNull();

    // Trigger may be async; brief retry
    let quantQty = 0;
    for (let i = 0; i < 5; i++) {
      const { data: quant } = await supabase
        .from('stock_quants')
        .select('quantity')
        .eq('product_id', product!.id)
        .eq('location_id', office!.id)
        .maybeSingle();
      quantQty = Number(quant?.quantity ?? 0);
      if (quantQty >= qty) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    expect(quantQty).toBeGreaterThanOrEqual(qty);
  });
});
