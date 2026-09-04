import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const getAdmin = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const cookieName = 'panehub_dashboard'
const digest = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString('hex')
const valid = (password: string, stored: string) => { const [salt, hash] = stored.split(':'); return !!salt && !!hash && crypto.timingSafeEqual(Buffer.from(digest(password, salt), 'hex'), Buffer.from(hash, 'hex')) }

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  const admin = getAdmin()
  const { data, error } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  if (error || !data || !valid(password, data.password_hash)) return NextResponse.json({ error: 'Password non valida' }, { status: 401 })
  const token = crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(data.password_hash).digest('hex')
  const response = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set(cookieName, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  response.cookies.set('panehub_dashboard_verified', '1', { httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return response
}

export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.delete(cookieName); response.cookies.delete('panehub_dashboard_verified'); return response }

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const current = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const next = typeof body.newPassword === 'string' ? body.newPassword : ''
  if (next.length < 8) return NextResponse.json({ error: 'La nuova password deve avere almeno 8 caratteri' }, { status: 400 })
  const admin = getAdmin()
  const { data } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single()
  if (!data || !valid(current, data.password_hash)) return NextResponse.json({ error: 'Password attuale non valida' }, { status: 401 })
  const salt = crypto.randomBytes(16).toString('hex')
  const { error } = await admin.from('dashboard_access').update({ password_hash: `${salt}:${digest(next, salt)}`, updated_at: new Date().toISOString() }).eq('id', true)
  if (error) return NextResponse.json({ error: 'Impossibile aggiornare la password' }, { status: 500 })
  const response = NextResponse.json({ ok: true }); response.cookies.delete(cookieName); response.cookies.delete('panehub_dashboard_verified'); return response
}
