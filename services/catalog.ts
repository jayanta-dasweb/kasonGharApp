import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

export async function searchAdminCatalog(search: string) {
  let q = supabase
    .from('master_products')
    .select(
      '*, master_categories(name), master_fabrics(name), master_weaves(name)'
    )
    .eq('is_active', true)
    .order('product_code');

  if (search.trim()) {
    const s = search.trim();
    q = q.or(`product_code.ilike.%${s}%,name.ilike.%${s}%,color.ilike.%${s}%`);
  }

  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []) as Array<
    Product & {
      master_categories: { name: string } | null;
      master_fabrics: { name: string } | null;
      master_weaves: { name: string } | null;
    }
  >;
}

export async function searchSalespersonCatalog(search: string) {
  let q = supabase.from('view_salesperson_catalog').select('*');
  if (search.trim()) {
    const s = search.trim();
    q = q.or(
      `product_code.ilike.%${s}%,name.ilike.%${s}%,color.ilike.%${s}%,category.ilike.%${s}%,fabric.ilike.%${s}%`
    );
  }
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return data ?? [];
}
