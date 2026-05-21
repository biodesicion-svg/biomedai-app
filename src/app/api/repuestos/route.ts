import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INST = '00000000-0000-0000-0000-000000000001'
const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const supabase = sb()
  const { data, error } = await supabase
    .from('repuestos')
    .select('*, repuesto_equipo(equipo_id, equipos(nombre, codigo_inventario))')
    .eq('institucion_id', INST)
    .eq('activo', true)
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ repuestos: data })
}

export async function POST(req: Request) {
  const supabase = sb()
  const body = await req.json()

  if (body.accion === 'crear') {
    const { data, error } = await supabase
      .from('repuestos')
      .insert({ ...body.repuesto, institucion_id: INST })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ repuesto: data })
  }

  if (body.accion === 'asignar') {
    const { repuesto_id, equipo_id, cantidad, orden_trabajo } = body
    const { data: rep } = await supabase.from('repuestos').select('stock_actual, stock_minimo, nombre').eq('id', repuesto_id).single()
    if (!rep) return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
    if (rep.stock_actual < cantidad) return NextResponse.json({ error: `Stock insuficiente. Disponible: ${rep.stock_actual}` }, { status: 400 })
    const stock_nuevo = rep.stock_actual - cantidad
    await supabase.from('repuestos').update({ stock_actual: stock_nuevo }).eq('id', repuesto_id)
    await supabase.from('repuesto_movimientos').insert({
      repuesto_id, equipo_id, institucion_id: INST,
      tipo: 'asignacion', cantidad, stock_anterior: rep.stock_actual, stock_nuevo,
      motivo: 'Asignado a equipo', orden_trabajo
    })
    await supabase.from('repuesto_equipo').upsert({ repuesto_id, equipo_id }, { onConflict: 'repuesto_id,equipo_id' })
    const alerta = stock_nuevo <= rep.stock_minimo
    return NextResponse.json({ ok: true, stock_nuevo, alerta, nombre: rep.nombre })
  }

  if (body.accion === 'entrada') {
    const { repuesto_id, cantidad, motivo } = body
    const { data: rep } = await supabase.from('repuestos').select('stock_actual').eq('id', repuesto_id).single()
    if (!rep) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const stock_nuevo = rep.stock_actual + cantidad
    await supabase.from('repuestos').update({ stock_actual: stock_nuevo }).eq('id', repuesto_id)
    await supabase.from('repuesto_movimientos').insert({
      repuesto_id, institucion_id: INST, tipo: 'entrada',
      cantidad, stock_anterior: rep.stock_actual, stock_nuevo, motivo
    })
    return NextResponse.json({ ok: true, stock_nuevo })
  }

  if (body.accion === 'movimientos') {
    const { data } = await supabase
      .from('repuesto_movimientos')
      .select('*, repuestos(nombre), equipos(nombre, codigo_inventario)')
      .eq('repuesto_id', body.repuesto_id)
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ movimientos: data })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
