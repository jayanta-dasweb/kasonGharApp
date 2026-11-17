import { createClient } from '@supabase/supabase-js';
import { phoneToAuthEmail } from '../lib/format';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_KEY ?? '';
const configured = Boolean(url && key && !url.includes('YOUR_SUPABASE'));
const supabase = createClient(url || 'http://localhost', key || 'test');
const describeIf = configured ? describe : describe.skip;

describeIf('RBAC — has_permission Admin vs Salesperson', () => {
  const adminPhone = process.env.TEST_ADMIN_PHONE ?? '7002911685';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? 'SUPERadmin@123';
  const salesPhone = process.env.TEST_SALES_PHONE;
  const salesPassword = process.env.TEST_SALES_PASSWORD;

  it('super admin has elevated permissions via has_permission()', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(adminPhone),
      password: adminPassword,
    });
    expect(error).toBeNull();

    const checks = [
      'masters.manage',
      'inventory.manage',
      'sales.reconcile',
      'reports.export',
      'users.manage',
    ];

    for (const name of checks) {
      const { data, error: rpcErr } = await supabase.rpc('has_permission', { name });
      expect(rpcErr).toBeNull();
      expect(data).toBe(true);
    }

    const { data: isSuper } = await supabase.rpc('has_role', { name: 'super_admin' });
    expect(isSuper).toBe(true);

    await supabase.auth.signOut();
  });

  it('salesperson cannot see vendor cost path (catalog view) and lacks admin perms', async () => {
    if (!salesPhone || !salesPassword) {
      console.warn('Skipping salesperson assert — set TEST_SALES_PHONE / TEST_SALES_PASSWORD');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(salesPhone),
      password: salesPassword,
    });
    expect(error).toBeNull();

    const { data: usersManage } = await supabase.rpc('has_permission', {
      name: 'users.manage',
    });
    expect(usersManage).toBe(false);

    const { data: catalog, error: catErr } = await supabase
      .from('view_salesperson_catalog')
      .select('*')
      .limit(1);
    expect(catErr).toBeNull();
    if (catalog?.[0]) {
      expect(Object.keys(catalog[0])).not.toContain('vendor_cost_price');
    }

    await supabase.auth.signOut();
  });
});

describe('phoneToAuthEmail helper', () => {
  it('maps phone to kasonghar.local alias', () => {
    expect(phoneToAuthEmail('7002911685')).toBe('7002911685@kasonghar.local');
  });
});
