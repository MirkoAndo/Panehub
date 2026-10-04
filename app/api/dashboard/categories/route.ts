import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
const tokenFor = (hash: string) => crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(hash).digest('hex')
async function authorize(request: Request) {
  const admin = createAdminClient()
  const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]
  const { data: access } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  return { admin, allowed: Boolean(cookie && access && cookie === tokenFor(access.password_hash)) }
}

export async function GET(request: Request) { const admin = createAdminClient(); const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]; const { data: access } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single(); if (!cookie || !access || cookie !== tokenFor(access.password_hash)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 }); const { data, error } = await admin.from('categories').select('id,name').eq('active', true).order('sort_order'); if (error) return NextResponse.json({ error: 'Impossibile caricare le categorie' }, { status: 500 }); return NextResponse.json(data ?? []) }

export async function POST(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const body = await request.json(); const name = String(body.name ?? '').trim()
  if (!name || name.length > 80) return NextResponse.json({ error: 'Nome categoria non valido' }, { status: 400 })
  const { data, error } = await admin.from('categories').insert({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), active: true }).select('id,name').single()
  if (error) return NextResponse.json({ error: 'Categoria già esistente o dati non validi' }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const body = await request.json(); const name = String(body.name ?? '').trim()
  if (!body.id || !name || name.length > 80) return NextResponse.json({ error: 'Dati categoria non validi' }, { status: 400 })
  const { data, error } = await admin.from('categories').update({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }).eq('id', body.id).select('id,name').single()
  if (error) return NextResponse.json({ error: 'Impossibile aggiornare la categoria' }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 })
  const { error } = await admin.from('categories').update({ active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Impossibile eliminare la categoria' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
