import { PanehubStorefront } from '@/components/panehub-storefront'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }, { data: settings }] = await Promise.all([
    supabase.from('products').select('id,name,description,price,unit,sale_method,price_per_kg,quantity_step,image_url,category_id').eq('active', true).eq('available', true).order('created_at'),
    supabase.from('categories').select('id,name,slug').eq('active', true).order('sort_order'),
    supabase.from('settings').select('hero_image_url').eq('id', true).single(),
  ])
  return <PanehubStorefront products={products ?? undefined} categories={categories ?? undefined} heroImageUrl={settings?.hero_image_url ?? null} />
}
