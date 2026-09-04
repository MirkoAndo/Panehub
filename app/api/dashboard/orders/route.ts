import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const getAdmin = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const tokenFor = (hash: string) => crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(hash).digest('hex')

export async function GET(request: Request) {
  const admin = getAdmin()
  const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]
  const { data: access } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  if (!cookie || !access || cookie !== tokenFor(access.password_hash)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { data, error } = await admin.from('reservations').select('id,reservation_code,customer_name,customer_phone,pickup_date,pickup_time_slot,status,total,notes,reservation_items(product_name,quantity,subtotal)').order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: 'Impossibile caricare gli ordini' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

async function authorize(request: Request) {
  const admin = getAdmin()
  const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]
  const { data: access } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  return { admin, allowed: Boolean(cookie && access && cookie === tokenFor(access.password_hash)) }
}

export async function PATCH(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const body = await request.json()
  const status = String(body.status ?? '')
  if (!['PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  const { data, error } = await admin.from('reservations').update({ status, updated_at: new Date().toISOString() }).eq('id', body.id).select('id,status').single()
  if (error) return NextResponse.json({ error: 'Impossibile aggiornare l’ordine' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { admin, allowed } = await authorize(request)
  if (!allowed) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Ordine non valido' }, { status: 400 })
  const { error } = await admin.from('reservations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Impossibile eliminare l’ordine' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
