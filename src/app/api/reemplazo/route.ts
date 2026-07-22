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

// ============================================================
// POST: analisis EVDM automatico
// body: { equipos?: string[], top?: number }
// ============================================================
export async function POST(req: Request) {
  try {
    const IID = await getInstitutionId()
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const body = await req.json().catch(() => ({}))
    const ids: string[] = body.equipos || []
    const top: number = body.top || 20

    const pag = async (t: string, s: string, f: any = {}) => {
      const out: any[] = []
      for (let i = 0; ; i += 1000) {
        let q = sb.from(t).select(s).range(i, i + 999)
        Object.entries(f).forEach(([k, v]) => { q = q.eq(k, v as any) })
        const { data } = await q
        if (!data || !data.length) break
        out.push(...data); if (data.length < 1000) break
      }
      return out
    }

    const equipos = await pag('equipos', 'id,nombre,marca,modelo,serie,codigo_inventario,servicio,clase_invima,riesgo,anio_fabricacion,anio_adquisicion,vida_util_anos,valor_adquisicion', { institucion_id: IID, activo: true })
    const mants = await pag('mantenimientos', 'equipo_id,tipo,estado,fecha_realizado,fecha_programada,costo_total', { institucion_id: IID })
    const evs = await pag('tecnovigilancia_eventos', 'equipo_id,gravedad', { institucion_id: IID })

    const anio = new Date().getFullYear()
    const idx: Record<string, any> = {}
    equipos.forEach(e => { idx[e.id] = { corr: 0, corrAnio: 0, costo: 0, n: 0, ev: 0, evS: 0 } })
    mants.forEach(m => {
      const r = idx[m.equipo_id]; if (!r) return
      r.n++; r.costo += Number(m.costo_total || 0)
      if (m.tipo === 'correctivo') { r.corr++
        const f = m.fecha_realizado || m.fecha_programada
        if (f && String(f).slice(0,4) === String(anio)) r.corrAnio++ }
    })
    evs.forEach(v => { const r = idx[v.equipo_id]; if (!r) return
      r.ev++; if (String(v.gravedad||'').toLowerCase()==='serio') r.evS++ })

    const IMP: Record<string,string> = { III:'critico', IIb:'alto', IIa:'medio', I:'bajo' }

    const calc = (e: any) => {
      const d = idx[e.id] || { corr:0, corrAnio:0, costo:0, ev:0, evS:0 }
      const vida = e.vida_util_anos || 10
      const edad = Math.max(anio - (e.anio_adquisicion || anio - vida), 0)
      const valorAdq = Number(e.valor_adquisicion || 0)
      const valorRep = Math.round(valorAdq * 1.35)
      // Costo de mantenimiento anual estimado: 4-8% del valor segun edad
      const pctMant = edad >= vida ? 0.09 : edad >= vida*0.7 ? 0.07 : 0.04
      const costoMantAnual = d.costo > 0 ? Math.round(d.costo / Math.max(edad,1)) : Math.round(valorAdq * pctMant)
      const cmr = valorRep > 0 ? Math.round((costoMantAnual / valorRep) * 100) : 0

      // EVE economica (0-100, mayor = mas urgente reemplazar)
      let eve = 0
      if (cmr >= 20) eve = 100; else if (cmr >= 15) eve = 80; else if (cmr >= 10) eve = 60
      else if (cmr >= 6) eve = 35; else eve = 15

      // EVC clinica: impacto por clase + eventos adversos
      const baseC: Record<string,number> = { III:70, IIb:60, IIa:40, I:20 }
      let evc = baseC[e.clase_invima] || 30
      evc += Math.min(d.evS * 12, 30) + Math.min(d.ev * 3, 10)
      evc = Math.min(evc, 100)

      // Tecnica: edad vs vida util + correctivos
      const pctVida = vida > 0 ? (edad / vida) * 100 : 0
      let tec = 0
      if (pctVida >= 120) tec = 100; else if (pctVida >= 100) tec = 85
      else if (pctVida >= 80) tec = 65; else if (pctVida >= 60) tec = 40; else tec = 20
      tec = Math.min(tec + Math.min(d.corrAnio * 8, 25), 100)

      // Obsolescencia
      const obsFunc = pctVida >= 100
      const obsTec = edad >= vida + 3
      const obsNorm = e.clase_invima === 'IIb' && edad >= vida + 5

      // EVDM global ponderado
      const evdm = Math.round(eve * 0.30 + evc * 0.35 + tec * 0.35)
      let rec = 'mantener'
      if (evdm >= 75) rec = 'reemplazar_inmediato'
      else if (evdm >= 55) rec = 'evaluar_1_2_anios'
      else if (evdm >= 40) rec = 'monitorear'

      return { e, d, vida, edad, valorAdq, valorRep, costoMantAnual, cmr, eve, evc, tec,
               obsFunc, obsTec, obsNorm, evdm, rec, pctVida: Math.round(pctVida) }
    }

    let candidatos = equipos.map(calc)
    if (ids.length) candidatos = candidatos.filter(c => ids.includes(c.e.id))
    else candidatos = candidatos.sort((a,b) => b.evdm - a.evdm).slice(0, top)

    // Guardar evaluaciones
    await sb.from('reemplazo_evaluaciones').delete().eq('institucion_id', IID)
    const filas = candidatos.map(c => ({
      institucion_id: IID, equipo_id: c.e.id,
      evaluador_nombre: 'Analisis automatico SYNAP', evaluador_cargo: 'Evaluacion preliminar',
      estado: 'preliminar',
      vida_util_fabricante: c.vida, vida_util_ecri: c.vida,
      anio_fabricacion: c.e.anio_fabricacion, anio_adquisicion: c.e.anio_adquisicion,
      obsolescencia_funcional: c.obsFunc, obsolescencia_tecnologica: c.obsTec, obsolescencia_normativa: c.obsNorm,
      repuestos_disponibles: c.edad >= c.vida + 3 ? 'limitados' : 'disponibles',
      soporte_fabricante: c.edad >= c.vida + 5 ? 'descontinuado' : 'vigente',
      valor_adquisicion: c.valorAdq, valor_reposicion_actual: c.valorRep,
      costo_mantenimiento_anual: c.costoMantAnual,
      eve_score: c.eve, evc_score: c.evc, evalscore_tecnica: c.tec, evdm_score: c.evdm,
      frecuencia_uso: c.e.clase_invima === 'IIb' ? 'alta' : 'media',
      impacto_clinico: IMP[c.e.clase_invima] || 'bajo',
      equipo_alternativo: false,
      eventos_adversos_count: c.d.ev,
      correctivos_ultimo_anio: c.d.corrAnio,
      estado_calibracion: 'no_evaluado',
      fallas_criticas: c.d.evS > 0,
      partes_obsoletas: c.obsTec,
      recomendacion: c.rec,
      observaciones: `Evaluacion PRELIMINAR. Edad ${c.edad} de ${c.vida} anios (${c.pctVida}% vida util). CMR ${c.cmr}%. ${c.d.corr} correctivos historicos, ${c.d.ev} eventos adversos. Valores de adquisicion estimados: validar con area contable.`,
    }))
    const { data: guardadas, error } = await sb.from('reemplazo_evaluaciones').insert(filas).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, evaluadas: (guardadas||[]).length,
      resumen: {
        reemplazar: candidatos.filter(c=>c.rec==='reemplazar_inmediato').length,
        evaluar: candidatos.filter(c=>c.rec==='evaluar_1_2_anios').length,
        monitorear: candidatos.filter(c=>c.rec==='monitorear').length,
        mantener: candidatos.filter(c=>c.rec==='mantener').length,
        inversion: candidatos.filter(c=>c.rec==='reemplazar_inmediato').reduce((a,c)=>a+c.valorRep,0),
      }})
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
