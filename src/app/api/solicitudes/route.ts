import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function GET() {
  const IID = await getInstitutionId()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from('solicitudes').select('*').eq('institucion_id', IID).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ solicitudes: data || [] })
}

export async function POST(req: Request) {
  const IID = await getInstitutionId()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await req.json()
  const { data, error } = await sb.from('solicitudes').insert({ ...body, institucion_id: IID }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ solicitud: data })
}

export async function PATCH(req: Request) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await sb.from('solicitudes').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ solicitud: data })
}
