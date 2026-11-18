const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://uxxoqfabnqvoozhrhabx.supabase.co',
  'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN'
);

async function has(table, col) {
  const { error } = await s.from(table).select(col).limit(1);
  return !error;
}

async function check(table, cols) {
  const out = {};
  for (const c of cols) out[c] = await has(table, c);
  return out;
}

async function main() {
  await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });

  console.log(
    'products',
    await check('master_products', [
      'product_id',
      'product_code',
      'product_name',
      'color',
      'design_name',
      'barcode',
      'hsn_code',
      'uom',
      'reorder_level',
      'notes',
      'category_id',
      'fabric_id',
      'weave_id',
      'vendor_cost_price',
      'company_mrp',
      'min_selling_price',
      'wholesale_price',
      'is_active',
    ])
  );
  console.log(
    'partners',
    await check('master_partners', [
      'partner_id',
      'partner_name',
      'partner_type',
      'phone',
      'email',
      'address',
      'city',
      'state',
      'pincode',
      'gstin',
      'pan',
      'contact_person',
      'credit_limit',
      'payment_terms',
      'is_active',
    ])
  );
  console.log(
    'fy',
    await check('master_financial_years', [
      'fy_id',
      'fy_name',
      'start_date',
      'end_date',
      'is_active',
      'is_closed',
    ])
  );
  console.log(
    'quants',
    await check('stock_quants', [
      'quant_id',
      'product_id',
      'product_code',
      'location_id',
      'quantity',
      'reserved_quantity',
      'unit_cost',
    ])
  );
  console.log(
    'moves',
    await check('stock_moves', [
      'move_id',
      'product_id',
      'product_code',
      'source_location_id',
      'dest_location_id',
      'quantity',
      'state',
      'unit_cost',
      'reference',
      'move_date',
      'created_by',
      'partner_id',
    ])
  );
  console.log(
    'accounts',
    await check('account_accounts', [
      'account_id',
      'code',
      'name',
      'account_type',
      'account_subtype',
      'parent_id',
      'is_reconcilable',
      'is_active',
    ])
  );
  console.log(
    'expense',
    await check('master_expense_heads', [
      'expense_head_id',
      'head_name',
      'account_id',
      'description',
      'is_active',
    ])
  );
  console.log(
    'categories',
    await check('master_categories', [
      'category_id',
      'category_name',
      'description',
      'parent_id',
      'is_active',
    ])
  );
}

main().catch(console.error);
