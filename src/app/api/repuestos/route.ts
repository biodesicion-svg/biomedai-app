import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const IID = await getInstitutionId()
  const supabase = sb()
  const { data, error } = await supabase
    .from('repuestos')
    .select('*, repuesto_equipo(equipo_id, equipos(nombre, codigo_inventario))')
    .eq('institucion_id', IID)
    .eq('activo', true)
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ---- Movimientos para KPIs y reportes ----
  const { data: movs } = await supabase
    .from('repuesto_movimientos')
    .select('repuesto_id, equipo_id, tipo, cantidad, created_at, motivo, orden_trabajo')
    .eq('institucion_id', IID)
    .order('created_at', { ascending: false })
    .limit(5000)

  const reps: any[] = data || []
  const repMap: Record<string, any> = {}
  reps.forEach(r => { repMap[r.id] = r })

  // Equipos (para consumo por equipo)
  const eqIds = [...new Set((movs || []).map(m => m.equipo_id).filter(Boolean))]
  const eqMap: Record<string, string> = {}
  if (eqIds.length) {
    const { data: eqs } = await supabase.from('equipos').select('id, nombre').in('id', eqIds)
    eqs?.forEach(e => { eqMap[e.id] = e.nombre })
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const hoy = new Date()
  const mesActual = hoy.getFullYear() + '-' + String(hoy.getMonth()+1).padStart(2,'0')

  let consumoMesUnid = 0, consumoMesValor = 0, consumoTotalUnid = 0, consumoTotalValor = 0
  const porRepuesto: Record<string, {salidas:number, entradas:number}> = {}
  const porMes: Record<string, {salidas:number, entradas:number, valor:number}> = {}
  const porEquipo: Record<string, {unidades:number, valor:number}> = {}

  ;(movs || []).forEach(m => {
    const rep = repMap[m.repuesto_id]
    const costo = rep?.costo_unitario || 0
    const ym = String(m.created_at || '').slice(0,7)
    if (!porMes[ym]) porMes[ym] = { salidas:0, entradas:0, valor:0 }
    if (!porRepuesto[m.repuesto_id]) porRepuesto[m.repuesto_id] = { salidas:0, entradas:0 }

    if (m.tipo === 'salida' || m.tipo === 'asignacion') {
      porRepuesto[m.repuesto_id].salidas += m.cantidad
      porMes[ym].salidas += m.cantidad
      porMes[ym].valor += m.cantidad * costo
      consumoTotalUnid += m.cantidad
      consumoTotalValor += m.cantidad * costo
      if (ym === mesActual) { consumoMesUnid += m.cantidad; consumoMesValor += m.cantidad * costo }
      if (m.equipo_id) {
        const nm = eqMap[m.equipo_id] || 'Sin equipo'
        if (!porEquipo[nm]) porEquipo[nm] = { unidades:0, valor:0 }
        porEquipo[nm].unidades += m.cantidad
        porEquipo[nm].valor += m.cantidad * costo
      }
    } else {
      porRepuesto[m.repuesto_id].entradas += m.cantidad
      porMes[ym].entradas += m.cantidad
    }
  })

  // Valor del inventario y criticos
  let valorInventario = 0, bajoMinimo = 0, sinStock = 0
  reps.forEach(r => {
    valorInventario += (r.stock_actual || 0) * (r.costo_unitario || 0)
    if ((r.stock_actual || 0) === 0) sinStock++
    else if ((r.stock_actual || 0) <= (r.stock_minimo || 0)) bajoMinimo++
  })

  // Top consumidos
  const topConsumidos = reps.map(r => {
    const s = porRepuesto[r.id]?.salidas || 0
    return {
      id: r.id, nombre: r.nombre, referencia: r.referencia,
      consumidas: s, valor: s * (r.costo_unitario || 0),
      stock_actual: r.stock_actual, stock_minimo: r.stock_minimo,
    }
  }).filter(x => x.consumidas > 0).sort((a,b) => b.consumidas - a.consumidas).slice(0, 10)

  // Rotacion: consumo / stock promedio. Alta rotacion = se gasta rapido
  const rotacion = reps.map(r => {
    const s = porRepuesto[r.id]?.salidas || 0
    const stock = r.stock_actual || 0
    const idx = stock > 0 ? +(s / stock).toFixed(2) : (s > 0 ? 99 : 0)
    let nivel = 'Baja'
    if (idx >= 1) nivel = 'Alta'
    else if (idx >= 0.4) nivel = 'Media'
    return { id:r.id, nombre:r.nombre, consumidas:s, stock_actual:stock, indice:idx, nivel }
  }).sort((a,b) => b.indice - a.indice).slice(0, 10)

  // Criticos: bajo minimo, o alta rotacion con stock <= minimo*1.5
  const criticos = reps.map(r => {
    const s = porRepuesto[r.id]?.salidas || 0
    const stock = r.stock_actual || 0, min = r.stock_minimo || 0
    const idx = stock > 0 ? s / stock : (s > 0 ? 99 : 0)
    let razon = ''
    if (stock === 0) razon = 'Sin stock'
    else if (stock <= min) razon = 'Bajo el minimo'
    else if (idx >= 1 && stock <= min * 1.5) razon = 'Alta rotacion con stock ajustado'
    return { id:r.id, nombre:r.nombre, referencia:r.referencia, stock_actual:stock, stock_minimo:min, consumidas:s, razon }
  }).filter(x => x.razon !== '').sort((a,b) => a.stock_actual - b.stock_actual)

  // Consumo mensual ordenado (ultimos 6)
  const consumoMensual = Object.entries(porMes)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([ym, v]) => ({
      periodo: MESES[parseInt(ym.slice(5,7),10)-1] + ' ' + ym.slice(2,4),
      salidas: v.salidas, entradas: v.entradas, valor: Math.round(v.valor),
    }))

  const consumoEquipos = Object.entries(porEquipo)
    .map(([equipo, v]) => ({ equipo, unidades: v.unidades, valor: Math.round(v.valor) }))
    .sort((a,b) => b.unidades - a.unidades).slice(0, 8)

  return NextResponse.json({
    repuestos: data,
    kpis: {
      total: reps.length,
      valor_inventario: Math.round(valorInventario),
      bajo_minimo: bajoMinimo,
      sin_stock: sinStock,
      criticos: criticos.length,
      consumo_mes_unid: consumoMesUnid,
      consumo_mes_valor: Math.round(consumoMesValor),
      consumo_total_unid: consumoTotalUnid,
      consumo_total_valor: Math.round(consumoTotalValor),
      movimientos: (movs || []).length,
    },
    reportes: { topConsumidos, rotacion, criticos, consumoMensual, consumoEquipos },
  })
}

export async function POST(req: Request) {
  const IID = await getInstitutionId()
  const supabase = sb()
  const body = await req.json()

  if (body.accion === 'crear') {
    const { data, error } = await supabase
      .from('repuestos')
      .insert({ ...body.repuesto, institucion_id: IID })
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
      repuesto_id, equipo_id, institucion_id: IID,
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
      repuesto_id, institucion_id: IID, tipo: 'entrada',
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
