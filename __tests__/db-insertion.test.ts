/**
 * Integration tests against live Supabase.
 * Requires EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * and an authenticated session capable of masters.manage / inventory.manage.
 */
import { createClient } from '@supabase/supabase-js';
import { phoneToAuthEmail } from '../lib/format';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_KEY ?? '';
const configured = Boolean(url && key && !url.includes('YOUR_SUPABASE'));

const supabase = createClient(url || 'http://localhost', key || 'test');

const describeIf = configured ? describe : describe.skip;

describeIf('DB Insertion — product + vendor purchase', () => {
  const phone = process.env.TEST_ADMIN_PHONE ?? '7002911685';
  const password = process.env.TEST_ADMIN_PASSWORD ?? 'SUPERadmin@123';
  let productId: string | null = null;
  let vendorId: string | null = null;

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

  it('inserts a product into master_products', async () => {
    const code = `TST-${Date.now()}`;
    const { data, error } = await supabase
      .from('master_products')
      .insert({
        product_code: code,
        name: 'Jest Test Mekhela',
        vendor_cost_price: 1000,
        company_mrp: 2500,
        min_selling_price: 2000,
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    expect(data?.product_code).toBe(code);
    productId = data!.id;
  });

  it('ensures a vendor partner exists for purchase', async () => {
    const { data: existing } = await supabase
      .from('master_partners')
      .select('*')
      .in('partner_type', ['vendor', 'both'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      vendorId = existing.id;
      expect(vendorId).toBeTruthy();
      return;
    }

    const { data, error } = await supabase
      .from('master_partners')
      .insert({
        name: `Jest Vendor ${Date.now()}`,
        partner_type: 'vendor',
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    vendorId = data!.id;
  });

  it('posts vendor purchase stock_move DONE without RLS/FK errors', async () => {
    expect(productId).toBeTruthy();
    expect(vendorId).toBeTruthy();

    const { data: supplier } = await supabase
      .from('stock_locations')
      .select('id')
      .eq('usage', 'SUPPLIER')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    const { data: office } = await supabase
      .from('stock_locations')
      .select('id')
      .eq('usage', 'INTERNAL')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    expect(supplier?.id).toBeTruthy();
    expect(office?.id).toBeTruthy();

    const invoice = `JEST-INV-${Date.now()}`;
    const { data, error } = await supabase
      .from('stock_moves')
      .insert({
        product_id: productId!,
        location_id: supplier!.id,
        location_dest_id: office!.id,
        quantity: 2,
        state: 'DONE',
        reference: invoice,
        unit_cost: 1000,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.state).toBe('DONE');
    expect(data?.reference).toBe(invoice);
  });
});
