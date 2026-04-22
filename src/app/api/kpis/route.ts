import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: equipos } = await supabase
    .from('equipos')
    .select('riesgo, estado, servicio, nombre')
    .eq('institucion_id', INSTITUCION_ID)
    .eq('activo', true)

  const { data: mantenimientos } = await supabase
    .from('mantenimientos')
    .select('tipo, estado, duracion_horas, costo_total')
    .eq('institucion_id', INSTITUCION_ID)

  if (!equipos || !mantenimientos) {
    return NextResponse.json({ error: 'No data' }, { status: 500 })
  }

  const total        = equipos.length
  const operativos   = equipos.filter(e => e.estado === 'operativo').length
  const bajas        = equipos.filter(e => e.estado === 'baja').length
  const altoRiesgo   = equipos.filter(e => e.riesgo === 'alto').length
  const medioRiesgo  = equipos.filter(e => e.riesgo === 'medio').length
  const bajoRiesgo   = equipos.filter(e => e.riesgo === 'bajo').length
  const disponibilidad = total > 0 ? ((operativos / total) * 100).toFixed(1) : '0'

  const preventivos  = mantenimientos.filter(m => m.tipo === 'preventivo').length
  const correctivos  = mantenimientos.filter(m => m.tipo === 'correctivo').length
  const calibraciones = mantenimientos.filter(m => m.tipo === 'calibracion').length

  const duraciones = mantenimientos
    .filter(m => m.duracion_horas)
    .map(m => Number(m.duracion_horas))
  const mttr = duraciones.length > 0
    ? (duraciones.reduce((a, b) => a + b, 0) / duraciones.length).toFixed(1)
    : '0'

  const mtbf = total > 0
    ? Math.round(365 / (mantenimientos.length / total))
    : 0

  const ratio = correctivos > 0
    ? (preventivos / correctivos).toFixed(2)
    : '∞'

  const costoTotal = mantenimientos
    .filter(m => m.costo_total)
    .reduce((a, b) => a + Number(b.costo_total), 0)

  // Por servicio
  const svcMap: Record<string, { total: number; operativos: number; alto: number }> = {}
  equipos.forEach(e => {
    if (!e.servicio) return
    if (!svcMap[e.servicio]) svcMap[e.servicio] = { total: 0, operativos: 0, alto: 0 }
    svcMap[e.servicio].total++
    if (e.estado === 'operativo') svcMap[e.servicio].operativos++
    if (e.riesgo === 'alto') svcMap[e.servicio].alto++
  })

  const porServicio = Object.entries(svcMap)
    .map(([nombre, d]) => ({
      nombre,
      total: d.total,
      operativos: d.operativos,
      alto: d.alto,
      disponibilidad: ((d.operativos / d.total) * 100).toFixed(0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return NextResponse.json({
    total, operativos, bajas, altoRiesgo, medioRiesgo, bajoRiesgo,
    disponibilidad, mtbf, mttr, preventivos, correctivos,
    calibraciones, costoTotal, ratio,
    totalMant: mantenimientos.length,
    porServicio,
    porTipo: [
      { label:'Preventivo',  value: preventivos,   color:'#4ade80', pct: total > 0 ? Math.round((preventivos/mantenimientos.length)*100) : 0 },
      { label:'Correctivo',  value: correctivos,   color:'#f87171', pct: total > 0 ? Math.round((correctivos/mantenimientos.length)*100) : 0 },
      { label:'Calibración', value: calibraciones, color:'#fcd34d', pct: total > 0 ? Math.round((calibraciones/mantenimientos.length)*100) : 0 },
    ]
  })
}
