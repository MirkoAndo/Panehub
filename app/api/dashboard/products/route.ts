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
  const { data, error } = await admin.from('products').select('id,name,description,price,unit,sale_method,price_per_kg,image_url,available,active,category_id,categories(name)').order('created_at')
  if (error) return NextResponse.json({ error: 'Impossibile caricare il catalogo' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const body = await request.json()
  const payload = { name: String(body.name ?? '').trim(), description: String(body.description ?? '').trim(), price: Number(body.price), unit: String(body.unit ?? 'pezzo').trim(), sale_method: ['piece', 'weight', 'both'].includes(body.sale_method) ? body.sale_method : 'piece', price_per_kg: body.price_per_kg === '' || body.price_per_kg == null ? null : Number(body.price_per_kg), image_url: body.image_url ? String(body.image_url).trim() : null, category_id: body.category_id || null, available: body.available !== false, active: body.active !== false }
  if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0) return NextResponse.json({ error: 'Nome e prezzo sono obbligatori' }, { status: 400 })
  const { data, error } = await admin.from('products').insert(payload).select('id,name,description,price,unit,sale_method,price_per_kg,image_url,available,active,category_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const body = await request.json(); const id = String(body.id ?? '')
  const payload = { name: String(body.name ?? '').trim(), description: String(body.description ?? '').trim(), price: Number(body.price), unit: String(body.unit ?? 'pezzo').trim(), sale_method: ['piece', 'weight', 'both'].includes(body.sale_method) ? body.sale_method : 'piece', price_per_kg: body.price_per_kg === '' || body.price_per_kg == null ? null : Number(body.price_per_kg), image_url: body.image_url ? String(body.image_url).trim() : null, category_id: body.category_id || null, available: body.available !== false, active: body.active !== false }
  if (!id || !payload.name || !Number.isFinite(payload.price) || payload.price < 0) return NextResponse.json({ error: 'Dati prodotto non validi' }, { status: 400 })
  const { data, error } = await admin.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('id,name,description,price,unit,sale_method,price_per_kg,image_url,available,active,category_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Prodotto non valido' }, { status: 400 })
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Impossibile eliminare il prodotto' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
