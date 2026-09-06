import { PanehubStorefront } from '@/components/panehub-storefront'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id,name,description,price,unit,sale_method,price_per_kg,image_url,category_id').eq('active', true).eq('available', true).order('created_at'),
    supabase.from('categories').select('id,name,slug').eq('active', true).order('sort_order'),
  ])
  return <PanehubStorefront products={products ?? undefined} categories={categories ?? undefined} />
}
