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
    const [pame, cals, puntos] = await Promise.all([
      q(`pame_equipos?select=*&institucion_id=eq.${IID}&order=magnitud`),
      q(`pame_calibraciones?select=*&institucion_id=eq.${IID}&order=fecha_calibracion.desc`),
      q(`pame_puntos_calibracion?select=*`),
    ])

    // Equipos paginados (PostgREST corta en 1000 filas)
    const equipos: any[] = []
    for (let from = 0; ; from += 1000) {
      const r = await fetch(
        `${URL}/rest/v1/equipos?select=id,nombre,tipo,ubicacion,servicio&institucion_id=eq.${IID}&order=id.asc`,
        { headers: { ...h, Range: `${from}-${from + 999}` } }
      )
      const page = await r.json()
      if (!Array.isArray(page) || page.length === 0) break
      equipos.push(...page)
      if (page.length < 1000) break
    }

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

    // ---- Deteccion fuera de tolerancia ----
    enriched.forEach((e: any) => {
      const tol = e.tolerancia
      const err = e.ultima_calibracion?.error_encontrado
      if (tol != null && err != null && err !== '') {
        e.fuera_tolerancia = Math.abs(Number(err)) > Number(tol)
        e.margen_usado = Number(tol) > 0 ? Math.round((Math.abs(Number(err)) / Number(tol)) * 100) : null
      } else {
        e.fuera_tolerancia = null
        e.margen_usado = null
      }
      e.historial_evaluado = (e.historial || []).map((c: any) => {
        const er = c.error_encontrado
        return {
          fecha: c.fecha_calibracion, error: er, incertidumbre: c.incertidumbre,
          resultado: c.resultado, certificado: c.numero_certificado, laboratorio: c.tecnico_calibrador,
          fuera: (tol != null && er != null && er !== '') ? Math.abs(Number(er)) > Number(tol) : null,
        }
      })
    })

    // KPIs resumen
    const total = enriched.length
    const vigentes = enriched.filter((e: any) => e.estado === 'vigente').length
    const proximos = enriched.filter((e: any) => e.estado === 'proximo').length
    const vencidos = enriched.filter((e: any) => e.estado === 'vencido').length
    const sinCal = enriched.filter((e: any) => e.estado === 'sin_calibrar').length
    const cumplimiento = total > 0 ? Math.round((vigentes / total) * 100) : 0

    const fueraTol = enriched.filter((e: any) => e.fuera_tolerancia === true).length
    const sinDatoTol = enriched.filter((e: any) => e.fuera_tolerancia === null).length

    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    const magMap: Record<string, any> = {}
    enriched.forEach((e: any) => {
      const m = e.magnitud || 'Sin definir'
      if (!magMap[m]) magMap[m] = { magnitud: m, total: 0, vigentes: 0, vencidos: 0, sin_calibrar: 0 }
      magMap[m].total++
      if (e.estado === 'vigente') magMap[m].vigentes++
      else if (e.estado === 'vencido') magMap[m].vencidos++
      else if (e.estado === 'sin_calibrar') magMap[m].sin_calibrar++
    })
    const porMagnitud = Object.values(magMap).map((m: any) => ({
      ...m, pct: m.total ? Math.round((m.vigentes / m.total) * 100) : 0,
    })).sort((a: any, b: any) => b.total - a.total)

    const svcMap: Record<string, any> = {}
    enriched.forEach((e: any) => {
      const s = e.equipo_servicio || 'Sin servicio'
      if (!svcMap[s]) svcMap[s] = { servicio: s, total: 0, vigentes: 0, vencidos: 0 }
      svcMap[s].total++
      if (e.estado === 'vigente') svcMap[s].vigentes++
      else if (e.estado === 'vencido') svcMap[s].vencidos++
    })
    const porServicio = Object.values(svcMap).map((s: any) => ({
      ...s, pct: s.total ? Math.round((s.vigentes / s.total) * 100) : 0,
    })).sort((a: any, b: any) => b.vencidos - a.vencidos).slice(0, 10)

    const calMes: Record<string, number> = {}
    cals.forEach((c: any) => {
      const ym = String(c.fecha_calibracion || '').slice(0, 7)
      if (ym) calMes[ym] = (calMes[ym] || 0) + 1
    })
    const calibracionesPorMes = Object.entries(calMes)
      .sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
      .map(([ym, n]) => ({ periodo: MESES[parseInt(ym.slice(5,7),10)-1] + ' ' + ym.slice(2,4), cantidad: n }))

    const cronograma = enriched
      .filter((e: any) => e.ultima_calibracion?.fecha_proxima)
      .map((e: any) => ({
        equipo: e.equipo_nombre, servicio: e.equipo_servicio, magnitud: e.magnitud,
        unidad: e.unidad_medicion, tolerancia: e.tolerancia,
        ultima: e.ultima_calibracion?.fecha_calibracion,
        proxima: e.ultima_calibracion?.fecha_proxima,
        estado: e.estado, dias: e.dias_restantes,
        frecuencia: e.frecuencia_meses, laboratorio: e.laboratorio_nombre,
        requiere_onac: e.requiere_acreditacion,
      }))
      .sort((a: any, b: any) => String(a.proxima).localeCompare(String(b.proxima)))

    return NextResponse.json({
      equipos: enriched,
      kpis: { total, vigentes, proximos, vencidos, sinCal, cumplimiento, fueraTol, sinDatoTol },
      graficos: { porMagnitud, porServicio, calibracionesPorMes },
      cronograma,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
