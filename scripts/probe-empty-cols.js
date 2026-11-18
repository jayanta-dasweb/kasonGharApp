const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://uxxoqfabnqvoozhrhabx.supabase.co',
  'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN'
);

async function cols(table, guesses) {
  const found = [];
  for (const g of guesses) {
    const { error } = await s.from(table).select(g).limit(1);
    if (!error) found.push(g);
  }
  return found;
}

async function main() {
  await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });

  const productGuess = [
    'id',
    'product_id',
    'product_code',
    'sku',
    'name',
    'product_name',
    'category_id',
    'fabric_id',
    'weave_id',
    'color',
    'vendor_cost_price',
    'cost_price',
    'company_mrp',
    'mrp',
    'min_selling_price',
    'is_active',
    'status',
    'created_at',
  ];
  console.log('master_products', await cols('master_products', productGuess));

  const catGuess = ['id', 'category_id', 'name', 'category_name', 'is_active', 'status'];
  console.log('master_categories', await cols('master_categories', catGuess));

  const partnerGuess = [
    'id',
    'partner_id',
    'name',
    'partner_name',
    'partner_type',
    'type',
    'phone',
    'address',
    'gstin',
    'is_active',
    'status',
  ];
  console.log('master_partners', await cols('master_partners', partnerGuess));

  const fabricGuess = ['id', 'fabric_id', 'name', 'fabric_name', 'is_active'];
  console.log('master_fabrics', await cols('master_fabrics', fabricGuess));

  const weaveGuess = ['id', 'weave_id', 'name', 'weave_name', 'is_active'];
  console.log('master_weaves', await cols('master_weaves', weaveGuess));

  const fyGuess = [
    'id',
    'fy_id',
    'name',
    'fy_name',
    'start_date',
    'end_date',
    'is_active',
  ];
  console.log('master_financial_years', await cols('master_financial_years', fyGuess));

  const quantGuess = [
    'id',
    'quant_id',
    'product_id',
    'item_id',
    'location_id',
    'quantity',
    'qty',
    'reserved_quantity',
    'unit_cost',
  ];
  console.log('stock_quants', await cols('stock_quants', quantGuess));

  const moveGuess = [
    'id',
    'move_id',
    'product_id',
    'location_id',
    'location_dest_id',
    'quantity',
    'state',
    'status',
    'reference',
    'unit_cost',
    'created_by',
  ];
  console.log('stock_moves', await cols('stock_moves', moveGuess));

  const viewGuess = [
    'product_id',
    'product_code',
    'name',
    'category',
    'fabric',
    'color',
    'company_mrp',
    'min_selling_price',
    'office_qty',
    'my_qty',
    'mrp',
  ];
  console.log('view_salesperson_catalog', await cols('view_salesperson_catalog', viewGuess));

  // Test catalog-like queries
  let r = await s
    .from('master_products')
    .select('*, master_categories(name), master_fabrics(name), master_weaves(name)')
    .limit(5);
  console.log('catalog join', r.error?.message || 'ok', r.data?.length);

  r = await s.from('master_products').select('*').limit(5);
  console.log('products plain', r.error?.message || 'ok', r.data?.length);

  r = await s.from('view_salesperson_catalog').select('*').limit(5);
  console.log('view plain', r.error?.message || 'ok', r.data?.length);
}

main().catch(console.error);
