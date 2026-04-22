import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      return NextResponse.json({ error: `Missing env: url=${!!url} key=${!!key}` }, { status: 500 })
    }

    const supabase = createClient(url, key)

    const { data: equipos, error: e1 } = await supabase
      .from('equipos')
      .select('riesgo, estado, servicio, nombre')
      .eq('institucion_id', INSTITUCION_ID)
      .eq('activo', true)

    if (e1) return NextResponse.json({ error: `Equipos error: ${e1.message}` }, { status: 500 })

    const { data: mantenimientos, error: e2 } = await supabase
      .from('mantenimientos')
      .select('tipo, estado, duracion_horas, costo_total')
      .eq('institucion_id', INSTITUCION_ID)

    if (e2) return NextResponse.json({ error: `Mantenimientos error: ${e2.message}` }, { status: 500 })

    if (!equipos?.length) return NextResponse.json({ error: `No equipos found. Count: ${equipos?.length}` }, { status: 500 })

    const total        = equipos.length
    const operativos   = equipos.filter(e => e.estado === 'operativo').length
    const bajas        = equipos.filter(e => e.estado === 'baja').length
    const altoRiesgo   = equipos.filter(e => e.riesgo === 'alto').length
    const medioRiesgo  = equipos.filter(e => e.riesgo === 'medio').length
    const bajoRiesgo   = equipos.filter(e => e.riesgo === 'bajo').length
    const disponibilidad = ((operativos / total) * 100).toFixed(1)

    const mants        = mantenimientos || []
    const preventivos  = mants.filter(m => m.tipo === 'preventivo').length
    const correctivos  = mants.filter(m => m.tipo === 'correctivo').length
    const calibraciones = mants.filter(m => m.tipo === 'calibracion').length
    const totalMant    = mants.length

    const duraciones   = mants.filter(m => m.duracion_horas).map(m => Number(m.duracion_horas))
    const mttr         = duraciones.length > 0
      ? (duraciones.reduce((a, b) => a + b, 0) / duraciones.length).toFixed(1)
      : '0'

    const mtbf         = totalMant > 0 ? Math.round(365 / (totalMant / total)) : 365
    const ratio        = correctivos > 0 ? (preventivos / correctivos).toFixed(2) : '∞'

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

    const porTipo = [
      { label:'Preventivo',  value: preventivos,   color:'#4ade80', pct: totalMant > 0 ? Math.round((preventivos/totalMant)*100) : 0 },
      { label:'Correctivo',  value: correctivos,   color:'#f87171', pct: totalMant > 0 ? Math.round((correctivos/totalMant)*100) : 0 },
      { label:'Calibración', value: calibraciones, color:'#fcd34d', pct: totalMant > 0 ? Math.round((calibraciones/totalMant)*100) : 0 },
    ]

    return NextResponse.json({
      total, operativos, bajas, altoRiesgo, medioRiesgo, bajoRiesgo,
      disponibilidad, mtbf, mttr, preventivos, correctivos,
      calibraciones, ratio, totalMant,
      porServicio, porTipo
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
