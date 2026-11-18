const { createClient } = require('@supabase/supabase-js');
const url = 'https://uxxoqfabnqvoozhrhabx.supabase.co';
const key = 'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN';
const s = createClient(url, key);

const tables = [
  'users_master',
  'roles',
  'permissions',
  'role_has_permissions',
  'model_has_roles',
  'master_financial_years',
  'master_categories',
  'master_fabrics',
  'master_weaves',
  'master_partners',
  'master_products',
  'master_expense_heads',
  'stock_locations',
  'stock_quants',
  'stock_moves',
  'account_accounts',
  'account_journals',
  'account_moves',
  'account_move_lines',
  'sales_reconciliation',
  'audit_logs',
  'view_salesperson_catalog',
  'report_day_wise',
  'report_month_wise',
  'report_fy_wise',
  'report_salesperson_summary',
];

async function guessColumns(table) {
  // Use Prefer: return=representation with empty filter select *
  const { data, error } = await s.from(table).select('*').limit(1);
  if (error) return { error: error.message, code: error.code };
  if (data?.[0]) return { columns: Object.keys(data[0]), sample: data[0] };
  // Empty table — try RPC information via OPTIONS or intentional bad column
  const bad = await s.from(table).select('___nope___').limit(1);
  return {
    columns: 'empty',
    hint: bad.error?.message,
    code: bad.error?.code,
  };
}

async function main() {
  await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });

  for (const t of tables) {
    const info = await guessColumns(t);
    console.log('\n===', t, '===');
    console.log(JSON.stringify(info, null, 2));
  }
}

main().catch(console.error);
