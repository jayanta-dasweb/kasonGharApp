const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://uxxoqfabnqvoozhrhabx.supabase.co',
  'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN'
);

const TABLES = [
  'master_financial_years',
  'master_categories',
  'master_fabrics',
  'master_weaves',
  'master_partners',
  'master_products',
  'master_expense_heads',
  'account_accounts',
  'account_journals',
  'stock_locations',
  'users_master',
];

async function discoverColumns(table) {
  const candidates = [
    'id',
    `${table.replace('master_', '').replace(/s$/, '')}_id`,
    'fy_id',
    'fy_name',
    'category_id',
    'category_name',
    'fabric_id',
    'fabric_name',
    'weave_id',
    'weave_name',
    'partner_id',
    'partner_name',
    'partner_type',
    'product_id',
    'product_code',
    'product_name',
    'expense_head_id',
    'expense_name',
    'head_name',
    'name',
    'code',
    'account_id',
    'account_code',
    'account_name',
    'account_type',
    'journal_id',
    'journal_code',
    'journal_name',
    'journal_type',
    'location_id',
    'location_code',
    'location_name',
    'usage',
    'assigned_user_id',
    'user_id',
    'full_name',
    'phone',
    'email',
    'address',
    'gstin',
    'city',
    'state',
    'pincode',
    'color',
    'colour',
    'description',
    'notes',
    'vendor_cost_price',
    'company_mrp',
    'min_selling_price',
    'mrp',
    'cost_price',
    'start_date',
    'end_date',
    'is_active',
    'status',
    'created_at',
    'updated_at',
    'barcode',
    'hsn',
    'uom',
    'unit',
  ];

  const found = [];
  for (const col of candidates) {
    const { error } = await s.from(table).select(col).limit(1);
    if (!error) found.push(col);
  }

  const { data, error } = await s.from(table).select('*').limit(3);
  return {
    columns: found,
    countHint: data?.length ?? 0,
    sample: data?.[0] ?? null,
    selectError: error?.message ?? null,
  };
}

async function main() {
  await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });

  for (const t of TABLES) {
    const info = await discoverColumns(t);
    console.log(`\n===== ${t} =====`);
    console.log(JSON.stringify(info, null, 2));
  }
}

main().catch(console.error);
