import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const INST = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from('movimientos').select('*').eq('institucion_id', INST).order('fecha_movimiento', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ movimientos: data || [] })
}

export async function POST(req: Request) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await req.json()
  const { data, error } = await sb.from('movimientos').insert({ ...body, institucion_id: INST }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Actualizar servicio/ubicacion del equipo si tiene equipo_id
  if (body.equipo_id) {
    await sb.from('equipos').update({ servicio: body.servicio_destino, ubicacion: body.ubicacion_destino || body.servicio_destino }).eq('id', body.equipo_id)
  }
  return NextResponse.json({ movimiento: data })
}
