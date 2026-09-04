import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items = Array.isArray(body.items) ? body.items : []
    if (!body.name || !body.phone || !body.date || !body.slot || !items.length) return NextResponse.json({ error: 'Compila i dati richiesti e aggiungi almeno un prodotto.' }, { status: 400 })
    const admin = createAdminClient()
    const code = `PV-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const total = items.reduce((sum: number, item: { unitPrice: number; quantity: number; saleMethod?: string }) => sum + (item.saleMethod === 'weight' ? item.unitPrice * item.quantity / 1000 : item.unitPrice * item.quantity), 0)
    const { data: reservation, error } = await admin.from('reservations').insert({ reservation_code: code, customer_name: String(body.name).trim(), customer_phone: String(body.phone).trim(), customer_email: body.email || null, pickup_date: body.date, pickup_time_slot: body.slot, notes: body.notes || null, status: 'PENDING', total }).select('id').single()
    if (error || !reservation) return NextResponse.json({ error: 'Impossibile salvare la prenotazione.' }, { status: 500 })
    const { error: itemsError } = await admin.from('reservation_items').insert(items.map((item: { productId: string | null; productName: string; quantity: number; unitPrice: number; saleMethod?: string }) => ({ reservation_id: reservation.id, product_id: item.productId, product_name: item.productName, quantity: item.quantity, unit_price: item.unitPrice, subtotal: item.saleMethod === 'weight' ? item.unitPrice * item.quantity / 1000 : item.unitPrice * item.quantity })))
    if (itemsError) { await admin.from('reservations').delete().eq('id', reservation.id); return NextResponse.json({ error: 'Impossibile salvare gli articoli della prenotazione.' }, { status: 500 }) }
    return NextResponse.json({ code })
  } catch { return NextResponse.json({ error: 'Errore inatteso durante la prenotazione.' }, { status: 500 }) }
}
