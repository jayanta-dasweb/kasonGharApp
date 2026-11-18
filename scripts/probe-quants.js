const { createClient } = require('@supabase/supabase-js');
const url = 'https://uxxoqfabnqvoozhrhabx.supabase.co';
const key = 'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN';
const s = createClient(url, key);

async function main() {
  await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });
  const token = (await s.auth.getSession()).data.session.access_token;

  // Force column error to learn names, or use OpenAPI
  const openapi = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const defs = openapi.definitions || {};
  for (const name of [
    'stock_quants',
    'stock_moves',
    'master_products',
    'master_partners',
    'master_categories',
    'sales_reconciliation',
    'report_fy_wise',
    'report_day_wise',
    'report_month_wise',
    'report_salesperson_summary',
    'users_master',
  ]) {
    const d = defs[name];
    if (!d) {
      console.log(name, 'MISSING in openapi');
      continue;
    }
    console.log('\n', name, Object.keys(d.properties || {}));
  }
}

main().catch(console.error);
