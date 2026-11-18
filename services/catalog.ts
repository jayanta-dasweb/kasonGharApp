import { supabase } from '@/lib/supabase';

export type CatalogRow = {
  product_id?: string | number | null;
  product_code: string;
  product_name: string;
  name?: string;
  color?: string | null;
  company_mrp: number;
  min_selling_price: number;
  vendor_cost_price?: number;
  category_name?: string | null;
  fabric_name?: string | null;
  weave_name?: string | null;
  office_qty?: number;
  my_qty?: number;
};

export async function searchAdminCatalog(search: string): Promise<CatalogRow[]> {
  // Live schema uses product_name / category_name — avoid broken joins first
  let q = supabase
    .from('master_products')
    .select(
      'product_code, product_name, category_id, fabric_id, weave_id, vendor_cost_price, company_mrp, min_selling_price, is_active, master_categories(category_name), master_fabrics(fabric_name), master_weaves(weave_name)'
    )
    .eq('is_active', true)
    .order('product_code');

  if (search.trim()) {
    const s = search.trim();
    q = q.or(
      `product_code.ilike.%${s}%,product_name.ilike.%${s}%`
    );
  }

  const { data, error } = await q.limit(100);
  if (error) {
    // Fallback without joins
    let plain = supabase
      .from('master_products')
      .select('*')
      .eq('is_active', true)
      .order('product_code');
    if (search.trim()) {
      const s = search.trim();
      plain = plain.or(
        `product_code.ilike.%${s}%,product_name.ilike.%${s}%`
      );
    }
    const res = await plain.limit(100);
    if (res.error) throw res.error;
    return (res.data ?? []).map((p: any) => ({
      product_code: p.product_code,
      product_name: p.product_name,
      name: p.product_name,
      company_mrp: Number(p.company_mrp ?? 0),
      min_selling_price: Number(p.min_selling_price ?? 0),
      vendor_cost_price: Number(p.vendor_cost_price ?? 0),
    }));
  }

  return (data ?? []).map((p: any) => ({
    product_code: p.product_code,
    product_name: p.product_name,
    name: p.product_name,
    company_mrp: Number(p.company_mrp ?? 0),
    min_selling_price: Number(p.min_selling_price ?? 0),
    vendor_cost_price: Number(p.vendor_cost_price ?? 0),
    category_name: p.master_categories?.category_name ?? null,
    fabric_name: p.master_fabrics?.fabric_name ?? null,
    weave_name: p.master_weaves?.weave_name ?? null,
  }));
}

export async function searchSalespersonCatalog(search: string): Promise<CatalogRow[]> {
  let q = supabase.from('view_salesperson_catalog').select('*');
  if (search.trim()) {
    const s = search.trim();
    q = q.or(`product_code.ilike.%${s}%`);
  }
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    product_code: p.product_code,
    product_name: p.product_name ?? p.name ?? p.product_code,
    name: p.product_name ?? p.name ?? p.product_code,
    company_mrp: Number(p.company_mrp ?? 0),
    min_selling_price: Number(p.min_selling_price ?? 0),
    office_qty: Number(p.office_qty ?? 0),
    my_qty: Number(p.my_qty ?? 0),
  }));
}
