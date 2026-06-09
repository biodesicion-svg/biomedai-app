import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function GET() {
  const IID = await getInstitutionId()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, riesgo, estado, servicio, anio_adquisicion, vida_util_anos, marca, modelo')
    .eq('institucion_id', IID)
    .eq('activo', true)

  const { data: mants } = await supabase
    .from('mantenimientos')
    .select('equipo_id, tipo, estado, fecha_programada, duracion_horas, costo_total')
    .eq('institucion_id', IID)

  const { data: repuestos } = await supabase
    .from('repuestos')
    .select('nombre, stock_actual, stock_minimo, costo_unitario')
    .eq('institucion_id', IID)
    .eq('activo', true)

  if (!equipos || !mants) return NextResponse.json({ error: 'Sin datos' }, { status: 500 })

  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth() + 1

  // ── RIESGO DE FALLA POR EQUIPO ──
  const equipoRiesgo = equipos.map(eq => {
    const mEquipos = mants.filter(m => m.equipo_id === eq.id)
    const correctivos = mEquipos.filter(m => m.tipo === 'correctivo').length
    const total = mEquipos.length
    const edadAnios = eq.anio_adquisicion ? anioActual - eq.anio_adquisicion : 0
    const pctVida = eq.vida_util_anos ? Math.min((edadAnios / eq.vida_util_anos) * 100, 100) : 50
    const ratioCorrectivo = total > 0 ? (correctivos / total) * 100 : 0

    // Score de riesgo (0-100)
    let score = 0
    score += pctVida * 0.35
    score += ratioCorrectivo * 0.35
    score += (eq.riesgo === 'alto' ? 30 : eq.riesgo === 'medio' ? 15 : 5) * 1
    score = Math.min(Math.round(score), 100)

    // Probabilidad de falla próximos 90 días
    const probFalla = Math.min(Math.round(score * 0.85), 95)

    // Fecha estimada de próxima falla
    const diasParaFalla = Math.max(30, Math.round((100 - score) * 2.5))
    const fechaFalla = new Date(ahora)
    fechaFalla.setDate(fechaFalla.getDate() + diasParaFalla)

    // Nivel de alerta
    const alerta = score >= 70 ? 'critico' : score >= 45 ? 'alto' : score >= 25 ? 'medio' : 'bajo'

    return {
      id: eq.id,
      nombre: eq.nombre,
      servicio: eq.servicio,
      riesgo: eq.riesgo,
      marca: eq.marca,
      score,
      probFalla,
      diasParaFalla,
      fechaFalla: fechaFalla.toISOString().split('T')[0],
      alerta,
      edadAnios,
      pctVida: Math.round(pctVida),
      correctivos,
      total_mant: total,
      vidaUtil: eq.vida_util_anos,
    }
  }).sort((a, b) => b.score - a.score)

  // ── PREDICCIÓN POR SERVICIO ──
  const servicioMap: Record<string, { equipos: number; scoreTotal: number; criticos: number; correctivos: number }> = {}
  equipoRiesgo.forEach(e => {
    if (!servicioMap[e.servicio]) servicioMap[e.servicio] = { equipos: 0, scoreTotal: 0, criticos: 0, correctivos: 0 }
    servicioMap[e.servicio].equipos++
    servicioMap[e.servicio].scoreTotal += e.score
    if (e.alerta === 'critico') servicioMap[e.servicio].criticos++
    servicioMap[e.servicio].correctivos += e.correctivos
  })

  const prediccionServicios = Object.entries(servicioMap)
    .map(([nombre, d]) => ({
      nombre,
      equipos: d.equipos,
      scorePromedio: Math.round(d.scoreTotal / d.equipos),
      criticos: d.criticos,
      correctivos: d.correctivos,
    }))
    .sort((a, b) => b.scorePromedio - a.scorePromedio)
    .slice(0, 8)

  // ── TENDENCIA MENSUAL DE CORRECTIVOS ──
  const mesesLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const correctivosPorMes = Array(12).fill(0)
  const preventivosPorMes = Array(12).fill(0)

  mants.forEach(m => {
    if (m.fecha_programada) {
      const mes = new Date(m.fecha_programada).getMonth()
      if (m.tipo === 'correctivo') correctivosPorMes[mes]++
      if (m.tipo === 'preventivo') preventivosPorMes[mes]++
    }
  })

  // Proyección próximos 3 meses basada en tendencia
  const promCorr = correctivosPorMes.slice(0,mesActual).reduce((a,b)=>a+b,0) / mesActual || 1
  const proyeccion = [1,2,3].map(i => {
    const mes = (mesActual + i - 1) % 12
    return {
      mes: mesesLabels[mes],
      correctivos: Math.round(promCorr * (1 + (i * 0.05))),
      preventivos: Math.round(promCorr * 0.3),
    }
  })

  // ── REPUESTOS CRÍTICOS ──
  const repuestosCriticos = (repuestos || [])
    .filter(r => r.stock_actual <= r.stock_minimo)
    .map(r => ({
      nombre: r.nombre,
      stock: r.stock_actual,
      minimo: r.stock_minimo,
      deficit: r.stock_minimo - r.stock_actual,
      costoReposicion: r.costo_unitario ? (r.stock_minimo - r.stock_actual + 2) * r.costo_unitario : null,
    }))

  // ── KPIs PREDICTIVOS ──
  const totalEquipos = equipos.length
  const criticos = equipoRiesgo.filter(e => e.alerta === 'critico').length
  const scoreGlobal = Math.round(equipoRiesgo.reduce((a,b)=>a+b.score,0) / totalEquipos)
  const fallaEsperada30 = equipoRiesgo.filter(e => e.diasParaFalla <= 30).length
  const fallaEsperada90 = equipoRiesgo.filter(e => e.diasParaFalla <= 90).length

  // Costo estimado de fallas próximas
  const costoEstimado = fallaEsperada90 * 850000 // promedio correctivo COP

  return NextResponse.json({
    equipoRiesgo: equipoRiesgo.slice(0, 30),
    prediccionServicios,
    tendencia: {
      meses: mesesLabels,
      correctivos: correctivosPorMes,
      preventivos: preventivosPorMes,
      proyeccion,
    },
    repuestosCriticos,
    kpis: {
      totalEquipos,
      criticos,
      scoreGlobal,
      fallaEsperada30,
      fallaEsperada90,
      costoEstimado,
    }
  })
}
