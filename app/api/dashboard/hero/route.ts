import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const tokenFor = (hash: string) => crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(hash).digest('hex')
async function authorize(request: Request) {
  const admin = createAdminClient()
  const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]
  const { data } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  return { admin, allowed: Boolean(cookie && data && cookie === tokenFor(data.password_hash)) }
}

export async function GET(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { data, error } = await admin.from('settings').select('hero_image_url').eq('id', true).single()
  if (error) return NextResponse.json({ error: 'Impossibile caricare immagine' }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { url } = await request.json()
  const heroImageUrl = String(url ?? '').trim()
  if (heroImageUrl && !/^https?:\/\//i.test(heroImageUrl)) return NextResponse.json({ error: 'Inserisci un link http o https valido.' }, { status: 400 })
  if (heroImageUrl.length > 2000) return NextResponse.json({ error: 'Il link è troppo lungo.' }, { status: 400 })
  const { data, error } = await admin.from('settings').update({ hero_image_url: heroImageUrl || null, updated_at: new Date().toISOString() }).eq('id', true).select('hero_image_url').single()
  if (error) return NextResponse.json({ error: 'Impossibile salvare immagine.' }, { status: 500 })
  return NextResponse.json(data)
}
