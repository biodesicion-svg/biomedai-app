import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INST = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: equipos }, { data: mants }] = await Promise.all([
      sb.from('equipos')
        .select('id,nombre,tipo,marca,modelo,servicio,riesgo,clase_invima,estado,anio_adquisicion,anio_fabricacion,vida_util_anos,valor_adquisicion,activo')
        .eq('institucion_id', INST).eq('activo', true),
      sb.from('mantenimientos')
        .select('id,equipo_id,tipo,estado,fecha_programada,fecha_inicio,fecha_fin,duracion_horas,costo_total,costo_mano_obra,costo_repuestos,fecha_realizado,hallazgos')
        .eq('institucion_id', INST)
    ])

    const eq  = equipos || []
    const mn  = mants   || []
    const hoy = new Date()
    const anioHoy = hoy.getFullYear()

    // ── DISPONIBILIDAD ─────────────────────────────────────────────
    const total       = eq.length
    const operativos  = eq.filter(e => e.estado === 'operativo').length
    const enMant      = eq.filter(e => e.estado === 'en_mantenimiento').length
    const fuera       = eq.filter(e => e.estado === 'fuera_servicio').length
    const baja        = eq.filter(e => e.estado === 'baja').length
    const disponibilidad = total > 0 ? ((operativos / total) * 100).toFixed(1) : '0'

    // ── RIESGO ─────────────────────────────────────────────────────
    const altoRiesgo  = eq.filter(e => e.riesgo === 'alto').length
    const medioRiesgo = eq.filter(e => e.riesgo === 'medio').length
    const bajoRiesgo  = eq.filter(e => e.riesgo === 'bajo').length

    // ── CLASE INVIMA ───────────────────────────────────────────────
    const claseIII  = eq.filter(e => e.clase_invima === 'III').length
    const claseIIb  = eq.filter(e => e.clase_invima === 'IIb').length
    const claseIIa  = eq.filter(e => e.clase_invima === 'IIa').length
    const claseI    = eq.filter(e => e.clase_invima === 'I').length

    // ── MANTENIMIENTO ─────────────────────────────────────────────
    const preventivos   = mn.filter(m => m.tipo === 'preventivo').length
    const correctivos   = mn.filter(m => m.tipo === 'correctivo').length
    const calibraciones = mn.filter(m => m.tipo === 'calibracion').length
    const totalMant     = mn.length
    const mantCompletados = mn.filter(m => m.estado === 'completado').length
    const mantPendientes  = mn.filter(m => m.estado === 'programado' || m.estado === 'pendiente').length
    const mantVencidos    = mn.filter(m => {
      if (m.estado !== 'programado') return false
      const fp = m.fecha_programada ? new Date(m.fecha_programada) : null
      return fp && fp < hoy
    }).length

    // ── MTTR ──────────────────────────────────────────────────────
    const duraciones = mn.filter(m => m.duracion_horas && Number(m.duracion_horas) > 0).map(m => Number(m.duracion_horas))
    const mttr = duraciones.length > 0
      ? (duraciones.reduce((a, b) => a + b, 0) / duraciones.length).toFixed(1)
      : '0'

    // ── MTBF ──────────────────────────────────────────────────────
    const corr = mn.filter(m => m.tipo === 'correctivo' && m.fecha_realizado)
    let mtbf = 365
    if (corr.length >= 2) {
      const fechas = corr.map(m => new Date(m.fecha_realizado!).getTime()).sort((a, b) => a - b)
      const intervalos = []
      for (let i = 1; i < fechas.length; i++) intervalos.push((fechas[i] - fechas[i-1]) / 86400000)
      mtbf = Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
    } else if (corr.length === 1) {
      mtbf = 365
    }

    // ── COSTOS ────────────────────────────────────────────────────
    const costoTotal    = mn.reduce((s, m) => s + Number(m.costo_total || 0), 0)
    const costoMO       = mn.reduce((s, m) => s + Number(m.costo_mano_obra || 0), 0)
    const costoRep      = mn.reduce((s, m) => s + Number(m.costo_repuestos || 0), 0)
    const costoCorr     = mn.filter(m => m.tipo === 'correctivo').reduce((s, m) => s + Number(m.costo_total || 0), 0)
    const costoPrev     = mn.filter(m => m.tipo === 'preventivo').reduce((s, m) => s + Number(m.costo_total || 0), 0)
    const costoProm     = mantCompletados > 0 ? Math.round(costoTotal / mantCompletados) : 0
    const pctCostoCorr  = costoTotal > 0 ? ((costoCorr / costoTotal) * 100).toFixed(1) : '0'
    const valorParque   = eq.reduce((s, e) => s + Number(e.valor_adquisicion || 0), 0)
    const cmr           = valorParque > 0 ? ((costoTotal / valorParque) * 100).toFixed(1) : '0'

    // ── VIDA UTIL ─────────────────────────────────────────────────
    const VIDA_UTIL_STD: Record<string, number> = {
      'monitor': 8, 'ventilador': 12, 'desfibrilador': 10, 'bomba': 8,
      'incubadora': 12, 'autoclave': 12, 'ecografo': 8, 'rayos': 12,
      'electrobisturi': 8, 'glucometro': 4, 'oximetro': 6, 'nebulizador': 4,
      'anestesia': 12, 'dialisis': 12, 'cardiotocografo': 8, 'cama': 12,
    }
    function getVidaUtil(eq: any): number {
      if (eq.vida_util_anos) return Number(eq.vida_util_anos)
      const n = (eq.nombre || '').toLowerCase()
      for (const [k, v] of Object.entries(VIDA_UTIL_STD)) if (n.includes(k)) return v
      return 8
    }

    const equiposVida = eq.map(e => {
      const anioAdq = e.anio_adquisicion || anioHoy - 3
      const edad    = anioHoy - Number(anioAdq)
      const vidaUtil = getVidaUtil(e)
      const pct     = Math.min(Math.round((edad / vidaUtil) * 100), 100)
      const valorRep = Number(e.valor_adquisicion || 0)
      const costoEq  = mn.filter(m => m.equipo_id === e.id).reduce((s, m) => s + Number(m.costo_total || 0), 0)
      const cmrEq    = valorRep > 0 ? ((costoEq / valorRep) * 100).toFixed(1) : null
      return { ...e, edad, vidaUtil, pctVida: pct, costoMant: costoEq, cmrEq }
    })

    const vidaCriticos   = equiposVida.filter(e => e.pctVida >= 80).length
    const vidaAdvertencia= equiposVida.filter(e => e.pctVida >= 60 && e.pctVida < 80).length
    const vidaSaludable  = equiposVida.filter(e => e.pctVida < 60).length
    const topReemplazar  = equiposVida.filter(e => e.pctVida >= 80).sort((a, b) => b.pctVida - a.pctVida).slice(0, 10).map(e => ({
      id: e.id, nombre: e.nombre, servicio: e.servicio, pctVida: e.pctVida,
      edad: e.edad, vidaUtil: e.vidaUtil, cmrEq: e.cmrEq, valor: e.valor_adquisicion
    }))

    // ── POR SERVICIO ──────────────────────────────────────────────
    const svcMap: Record<string, any> = {}
    eq.forEach(e => {
      const svc = e.servicio || 'Sin servicio'
      if (!svcMap[svc]) svcMap[svc] = { total: 0, operativos: 0, alto: 0, costo: 0 }
      svcMap[svc].total++
      if (e.estado === 'operativo') svcMap[svc].operativos++
      if (e.riesgo === 'alto') svcMap[svc].alto++
    })
    mn.forEach(m => {
      const eq_data = eq.find(e => e.id === m.equipo_id)
      const svc = eq_data?.servicio || 'Sin servicio'
      if (svcMap[svc]) svcMap[svc].costo += Number(m.costo_total || 0)
    })
    const porServicio = Object.entries(svcMap).map(([label, d]: any) => ({
      label, total: d.total, operativos: d.operativos, alto: d.alto,
      disp: ((d.operativos / d.total) * 100).toFixed(0),
      costo: d.costo,
    })).sort((a, b) => b.total - a.total)

    // ── POR TIPO EQUIPO ───────────────────────────────────────────
    const tipoMap: Record<string, number> = {}
    eq.forEach(e => {
      const t = e.tipo || 'Sin tipo'
      tipoMap[t] = (tipoMap[t] || 0) + 1
    })
    const porTipoEquipo = Object.entries(tipoMap).map(([label, value]) => ({
      label, value, pct: Math.round((value / total) * 100)
    })).sort((a, b) => b.value - a.value).slice(0, 8)

    // ── HALLAZGOS ─────────────────────────────────────────────────
    const conHallazgos = mn.filter(m => m.hallazgos && m.hallazgos.trim() !== '').length
    const tasaHallazgos = mantCompletados > 0 ? ((conHallazgos / mantCompletados) * 100).toFixed(1) : '0'

    // ── CUMPLIMIENTO PM ───────────────────────────────────────────
    // Equipos criticos (riesgo alto) deben tener PM semestral = 2 por año
    const equiposCriticos = eq.filter(e => e.riesgo === 'alto')
    const pmRequeridos = equiposCriticos.length * 2
    const pmEjecutados = mn.filter(m => {
      const eqData = eq.find(e => e.id === m.equipo_id)
      return m.tipo === 'preventivo' && m.estado === 'completado' && eqData?.riesgo === 'alto'
    }).length
    const cumplimientoPM = pmRequeridos > 0 ? Math.min(Math.round((pmEjecutados / pmRequeridos) * 100), 100) : 100

    // ── RATIO PREV/CORR ───────────────────────────────────────────
    const ratioPrevCorr = correctivos > 0 ? (preventivos / correctivos).toFixed(2) : 'N/D'

    return NextResponse.json({
      // Disponibilidad
      total, operativos, enMant, fuera, baja,
      disponibilidad, mtbf, mttr,
      // Riesgo
      altoRiesgo, medioRiesgo, bajoRiesgo,
      claseI, claseIIa, claseIIb, claseIII,
      // Mantenimiento
      totalMant, preventivos, correctivos, calibraciones,
      mantCompletados, mantPendientes, mantVencidos,
      cumplimientoPM, pmRequeridos, pmEjecutados,
      ratioPrevCorr, tasaHallazgos, conHallazgos,
      // Costos
      costoTotal, costoMO, costoRep, costoCorr, costoPrev,
      costoProm, pctCostoCorr, valorParque, cmr,
      // Vida util
      vidaCriticos, vidaAdvertencia, vidaSaludable, topReemplazar,
      // Detalle
      porServicio, porTipoEquipo,
      porTipo: [
        { label: 'Preventivo',   value: preventivos,   pct: totalMant > 0 ? Math.round((preventivos/totalMant)*100) : 0 },
        { label: 'Correctivo',   value: correctivos,   pct: totalMant > 0 ? Math.round((correctivos/totalMant)*100) : 0 },
        { label: 'Calibracion',  value: calibraciones, pct: totalMant > 0 ? Math.round((calibraciones/totalMant)*100) : 0 },
      ],
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
