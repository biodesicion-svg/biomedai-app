import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function q(path: string) {
  const r = await fetch(`${SURL}/rest/v1/${path}`, { headers: h })
  return r.json()
}

export async function GET() {
  const IID = await getInstitutionId()
  try {
    const [evals, comps, equipos, mantenimientos] = await Promise.all([
      q(`reemplazo_evaluaciones?select=*&institucion_id=eq.${IID}&order=evdm_score.asc`),
      q(`reemplazo_comparativos?select=*`),
      q(`equipos?select=id,nombre,tipo,ubicacion,servicio,riesgo,clase_invima,marca,modelo,serie&institucion_id=eq.${IID}`),
      q(`mantenimientos?select=*&institucion_id=eq.${IID}&order=fecha_realizado.asc`),
    ])

    const anioActual = new Date().getFullYear()

    const enriched = evals.map((ev: any) => {
      const equipo = equipos.find((e: any) => e.id === ev.equipo_id) || {}
      const comp = comps.filter((c: any) => c.evaluacion_id === ev.id)

      // Historial de mantenimientos real
      const mants = mantenimientos.filter((m: any) => m.equipo_id === ev.equipo_id)
      const preventivos = mants.filter((m: any) => m.tipo === 'preventivo')
      const correctivos = mants.filter((m: any) => m.tipo === 'correctivo')
      const costoTotalMant = mants.reduce((s: number, m: any) => s + (m.costo_total || 0), 0)
      const horasTrabajo = mants.reduce((s: number, m: any) => s + (m.duracion_horas || 0), 0)

      // Agrupar mantenimientos por año para gráfica
      const porAnio: any = {}
      mants.forEach((m: any) => {
        if (!m.fecha_realizado) return
        const anio = new Date(m.fecha_realizado).getFullYear()
        if (!porAnio[anio]) porAnio[anio] = { anio, preventivos: 0, correctivos: 0, costo: 0 }
        if (m.tipo === 'preventivo') porAnio[anio].preventivos++
        else porAnio[anio].correctivos++
        porAnio[anio].costo += m.costo_total || 0
      })
      const historialAnual = Object.values(porAnio).sort((a: any, b: any) => a.anio - b.anio)

      const edadActual = anioActual - (ev.anio_adquisicion || ev.anio_fabricacion || 2010)
      const vidaUtilRef = ev.vida_util_fabricante || ev.vida_util_ecri || 10
      const pctVidaUtil = Math.min(Math.round((edadActual / vidaUtilRef) * 100), 100)
      const cmrPct = ev.valor_reposicion_actual > 0
        ? Math.round((ev.costo_mantenimiento_anual / ev.valor_reposicion_actual) * 100 * 10) / 10
        : 0
      const anosRestantes = Math.max(vidaUtilRef - edadActual, 0)
      const esObsoleto = ev.obsolescencia_funcional || ev.obsolescencia_tecnologica || ev.obsolescencia_normativa

      return {
        ...ev,
        equipo_nombre: equipo.nombre,
        equipo_tipo: equipo.tipo,
        equipo_ubicacion: equipo.ubicacion,
        equipo_servicio: equipo.servicio,
        equipo_riesgo: equipo.riesgo,
        equipo_clase: equipo.clase_invima,
        equipo_marca: equipo.marca,
        equipo_modelo: equipo.modelo,
        equipo_serie: equipo.serie,
        comparativos: comp,
        edad_actual: edadActual,
        pct_vida_util: pctVidaUtil,
        cmr_pct: cmrPct,
        anos_restantes: anosRestantes,
        es_obsoleto: esObsoleto,
        // Mantenimientos reales
        total_mantenimientos: mants.length,
        total_preventivos: preventivos.length,
        total_correctivos: correctivos.length,
        costo_total_mantenimiento_historico: costoTotalMant,
        horas_trabajo_total: horasTrabajo,
        historial_anual: historialAnual,
        ultimo_preventivo: preventivos.at(-1) || null,
        ultimo_correctivo: correctivos.at(-1) || null,
        lista_correctivos: correctivos.slice(-10).reverse(),
        lista_preventivos: preventivos.slice(-10).reverse(),
      }
    })

    const total = enriched.length
    const criticos = enriched.filter((e: any) => e.recomendacion === 'reemplazar_inmediato').length
    const evaluar = enriched.filter((e: any) => e.recomendacion === 'evaluar_1_2_anios').length
    const ok = enriched.filter((e: any) => ['mantener','continuar'].includes(e.recomendacion)).length
    const obsoletos = enriched.filter((e: any) => e.es_obsoleto).length
    const inversionReq = enriched
      .filter((e: any) => e.recomendacion === 'reemplazar_inmediato')
      .reduce((s: number, e: any) => s + (e.comparativos[0]?.precio_oferta || e.valor_reposicion_actual || 0), 0)

    return NextResponse.json({
      evaluaciones: enriched,
      kpis: { total, criticos, evaluar, ok, obsoletos, inversionReq }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
