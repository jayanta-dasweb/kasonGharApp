const { createClient } = require('@supabase/supabase-js');

const url = 'https://uxxoqfabnqvoozhrhabx.supabase.co';
const key = 'sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN';
const supabase = createClient(url, key);

async function main() {
  await supabase.auth.signInWithPassword({
    email: '7002911685@kasonghar.local',
    password: 'SUPERadmin@123',
  });
  const token = (await supabase.auth.getSession()).data.session.access_token;

  for (const body of [
    {},
    { permission_name: 'users.manage' },
    { name: 'users.manage' },
    { perm_name: 'users.manage' },
  ]) {
    const r = await fetch(`${url}/rest/v1/rpc/has_permission`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    console.log('has_permission', body, r.status, await r.text());
  }

  const openapi = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const paths = Object.keys(openapi.paths || {}).filter((p) => p.includes('has_'));
  console.log('rpc paths', paths);
  for (const p of paths) {
    console.log(p, JSON.stringify(openapi.paths[p], null, 2).slice(0, 800));
  }
}

main().catch(console.error);
