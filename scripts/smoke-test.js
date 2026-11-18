/**
 * Kason Ghar smoke test — run: node scripts/smoke-test.js
 * Checks auth + critical tables used by the app.
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uxxoqfabnqvoozhrhabx.supabase.co';
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN';

const s = createClient(url, key);

const TABLES = [
  'users_master',
  'roles',
  'permissions',
  'role_has_permissions',
  'model_has_roles',
  'master_products',
  'master_partners',
  'stock_locations',
  'stock_quants',
  'stock_moves',
  'account_accounts',
  'account_journals',
  'account_moves',
  'sales_reconciliation',
  'app_notifications',
  'app_notification_reads',
  'audit_logs',
  'view_salesperson_catalog',
  'report_salesperson_summary',
];

async function checkTable(name) {
  const { data, error, count } = await s
    .from(name)
    .select('*', { count: 'exact', head: false })
    .limit(1);
  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }
  return {
    ok: true,
    rowsHint: count ?? (data?.length ?? 0),
    cols: data?.[0] ? Object.keys(data[0]).slice(0, 12) : '(empty)',
  };
}

async function main() {
  console.log('=== KASON GHAR SMOKE TEST ===');
  console.log('URL:', url);

  const auth = await s.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });
  if (auth.error) {
    console.log('AUTH FAIL:', auth.error.message);
  } else {
    console.log('AUTH OK:', auth.data.user?.id);
  }

  let fail = 0;
  for (const t of TABLES) {
    const r = await checkTable(t);
    if (r.ok) {
      console.log(`OK  ${t}`, typeof r.cols === 'string' ? r.cols : r.cols.join(','));
    } else {
      fail += 1;
      console.log(`FAIL ${t}:`, r.error);
    }
  }

  // Role seed check
  const { data: roles } = await s.from('roles').select('name');
  console.log(
    'ROLES:',
    (roles ?? []).map((r) => r.name).join(', ') || '(none)'
  );

  // Notice board write smoke (best-effort)
  if (auth.data?.user) {
    const { error: insErr } = await s.from('app_notifications').insert({
      title: 'Smoke test notice',
      body: 'Auto smoke — safe to deactivate',
      audience: 'ALL',
      priority: 'LOW',
      is_active: true,
      created_by: auth.data.user.id,
    });
    console.log(insErr ? `NOTICE INSERT FAIL: ${insErr.message}` : 'NOTICE INSERT OK');
  }

  console.log('\nFIX IF NOTICE FAIL: run supabase/SMOKE_FIX_ALL.sql in Supabase SQL Editor');
  console.log(fail ? `\nSMOKE RESULT: ${fail} FAIL(s)` : '\nSMOKE RESULT: ALL CRITICAL OK');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
