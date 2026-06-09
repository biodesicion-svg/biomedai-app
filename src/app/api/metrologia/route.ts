import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function q(path: string) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: h })
  return r.json()
}

export async function GET() {
  const IID = await getInstitutionId()
  try {
    const [pame, cals, puntos, equipos] = await Promise.all([
      q(`pame_equipos?select=*&institucion_id=eq.${IID}&order=magnitud`),
      q(`pame_calibraciones?select=*&institucion_id=eq.${IID}&order=fecha_calibracion.desc`),
      q(`pame_puntos_calibracion?select=*`),
      q(`equipos?select=id,nombre,tipo,ubicacion,servicio&institucion_id=eq.${IID}`),
    ])

    // Enriquecer pame_equipos con datos del equipo y última calibración
    const enriched = pame.map((pe: any) => {
      const equipo = equipos.find((e: any) => e.id === pe.equipo_id) || {}
      const calsList = cals
        .filter((c: any) => c.pame_equipo_id === pe.id)
        .sort((a: any, b: any) => new Date(b.fecha_calibracion).getTime() - new Date(a.fecha_calibracion).getTime())
      const ultimaCal = calsList[0] || null
      const puntosEquipo = ultimaCal
        ? puntos.filter((p: any) => p.calibracion_id === ultimaCal.id)
        : []

      // Estado metrológico
      let estado = 'sin_calibrar'
      let diasRestantes = null
      if (ultimaCal) {
        const hoy = new Date()
        const proxima = new Date(ultimaCal.fecha_proxima)
        diasRestantes = Math.ceil((proxima.getTime() - hoy.getTime()) / 86400000)
        if (diasRestantes < 0) estado = 'vencido'
        else if (diasRestantes <= 30) estado = 'proximo'
        else estado = 'vigente'
      }

      return {
        ...pe,
        equipo_nombre: equipo.nombre,
        equipo_tipo: equipo.tipo,
        equipo_ubicacion: equipo.ubicacion,
        equipo_servicio: equipo.servicio,
        ultima_calibracion: ultimaCal,
        historial: calsList,
        puntos_ultima: puntosEquipo,
        estado,
        dias_restantes: diasRestantes,
      }
    })

    // KPIs resumen
    const total = enriched.length
    const vigentes = enriched.filter((e: any) => e.estado === 'vigente').length
    const proximos = enriched.filter((e: any) => e.estado === 'proximo').length
    const vencidos = enriched.filter((e: any) => e.estado === 'vencido').length
    const sinCal = enriched.filter((e: any) => e.estado === 'sin_calibrar').length
    const cumplimiento = total > 0 ? Math.round((vigentes / total) * 100) : 0

    return NextResponse.json({
      equipos: enriched,
      kpis: { total, vigentes, proximos, vencidos, sinCal, cumplimiento }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
