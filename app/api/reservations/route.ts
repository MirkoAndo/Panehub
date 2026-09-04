import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const admin = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

type Item = { productId: string | null; productName: string; quantity: number; unitPrice: number; saleMethod?: 'piece' | 'weight' }

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; phone?: string; email?: string | null; date?: string; slot?: string; notes?: string | null; items?: Item[] }
    const name = body.name?.trim(); const phone = body.phone?.trim(); const date = body.date?.trim(); const slot = body.slot?.trim(); const items = body.items ?? []
    if (!name || !phone || !date || !slot || items.length === 0 || items.some((item) => !item.productName || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > (item.saleMethod === 'weight' ? 100000 : 99) || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !['piece', 'weight'].includes(item.saleMethod ?? 'piece'))) return NextResponse.json({ error: 'Dati prenotazione non validi' }, { status: 400 })
    const total = items.reduce((sum, item) => sum + (item.saleMethod === 'weight' ? item.unitPrice * item.quantity / 1000 : item.unitPrice * item.quantity), 0)
    const reservationCode = `PV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    const supabase = admin()
    const { data: reservation, error: reservationError } = await supabase.from('reservations').insert({ reservation_code: reservationCode, customer_name: name, customer_phone: phone, customer_email: body.email?.trim() || null, pickup_date: date, pickup_time_slot: slot, notes: body.notes?.trim() || null, total }).select('id,reservation_code').single()
    if (reservationError || !reservation) return NextResponse.json({ error: reservationError?.message ?? 'Impossibile creare la prenotazione' }, { status: 500 })
    const { error: itemsError } = await supabase.from('reservation_items').insert(items.map((item) => ({ reservation_id: reservation.id, product_id: item.productId, product_name: item.productName, quantity: item.quantity, unit_price: item.unitPrice, subtotal: item.saleMethod === 'weight' ? item.unitPrice * item.quantity / 1000 : item.unitPrice * item.quantity })))
    if (itemsError) { await supabase.from('reservations').delete().eq('id', reservation.id); return NextResponse.json({ error: itemsError.message }, { status: 500 }) }
    return NextResponse.json({ code: reservation.reservation_code }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }) }
}
