import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
const tokenFor = (hash: string) => crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(hash).digest('hex')
export async function GET(request: Request) { const admin = createAdminClient(); const cookie = request.headers.get('cookie')?.match(/panehub_dashboard=([^;]+)/)?.[1]; const { data: access } = await admin.from('dashboard_access').select('password_hash').eq('id', true).single(); if (!cookie || !access || cookie !== tokenFor(access.password_hash)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 }); const { data, error } = await admin.from('categories').select('id,name').eq('active', true).order('sort_order'); if (error) return NextResponse.json({ error: 'Impossibile caricare le categorie' }, { status: 500 }); return NextResponse.json(data ?? []) }
