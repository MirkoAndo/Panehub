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
