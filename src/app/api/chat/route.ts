import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INST = '00000000-0000-0000-0000-000000000001'
const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
}
function fmtCOP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CO')} COP`
}

export async function POST(req: Request) {
  const { mensaje, contexto } = await req.json()
  const texto = (mensaje || '').toLowerCase().trim()
  const supabase = sb()

  // ── 1. BÚSQUEDA POR NOMBRE ESPECÍFICO DE EQUIPO ─────────────────
  // Si el mensaje tiene más de 4 palabras o parece nombre de equipo
  const palabrasClave = ['monitor', 'ventilador', 'desfibrilador', 'bomba', 'incubadora',
    'glucometro', 'camilla', 'ecografo', 'rayos', 'ultrasonido', 'electrobisturi',
    'nebulizador', 'oximetro', 'tensiometro', 'bascula', 'lampara', 'carro',
    'aspirador', 'compresor', 'autoclave', 'centrifuga', 'microscopio', 'analizador']

  const esBusquedaEquipo = palabrasClave.some(p => texto.includes(p)) ||
    texto.includes('equipo') || texto.includes('dispositivo') || texto.includes('aparato')

  const esAreaServicio = texto.includes('servicio') || texto.includes('area') || texto.includes('área') ||
    texto.includes('uci') || texto.includes('urgencias') || texto.includes('cirugia') ||
    texto.includes('cirugía') || texto.includes('pediatria') || texto.includes('neonatos') ||
    texto.includes('ginecologia') || texto.includes('laboratorio') || texto.includes('radiologia') ||
    texto.includes('consulta') || texto.includes('hospitalizacion')

  const esHojaVida = texto.includes('hoja de vida') || texto.includes('historial') ||
    texto.includes('todo sobre') || texto.includes('información completa') ||
    texto.includes('mantenimientos de') || texto.includes('vida de')

  const esEstadistica = texto.includes('cuantos') || texto.includes('cuántos') ||
    texto.includes('total') || texto.includes('resumen') || texto.includes('estadistica') ||
    texto.includes('estadística') || texto.includes('kpi') || texto.includes('indicador')

  const esRepuesto = texto.includes('repuesto') || texto.includes('stock') ||
    texto.includes('inventario de repuesto') || texto.includes('pieza')

  // ── NECESITA CONTEXTO (pregunta ambigua) ──────────────────────────
  // Si dice solo "monitor" sin más contexto, preguntar de qué servicio
  const soloPalabra = palabrasClave.find(p => texto === p || texto === `el ${p}` || texto === `los ${p}s` || texto === `los ${p}es`)

  if (soloPalabra && !esAreaServicio && !esHojaVida && !contexto?.servicio) {
    // Buscar en qué servicios hay este equipo
    const { data: servicios } = await supabase
      .from('equipos')
      .select('servicio')
      .eq('institucion_id', INST)
      .eq('activo', true)
      .ilike('nombre', `%${soloPalabra}%`)

    const serviciosUnicos = [...new Set((servicios || []).map(e => e.servicio).filter(Boolean))]
    const { count } = await supabase
      .from('equipos')
      .select('*', { count: 'exact', head: true })
      .eq('institucion_id', INST)
      .eq('activo', true)
      .ilike('nombre', `%${soloPalabra}%`)

    return NextResponse.json({
      tipo: 'pregunta_servicio',
      respuesta: `Encontré **${count} ${soloPalabra}(s)** distribuidos en **${serviciosUnicos.length} servicios**:\n\n${serviciosUnicos.map(s => `• ${s}`).join('\n')}\n\n¿De qué servicio quieres ver los ${soloPalabra}s? Puedes decirme "monitores de ${serviciosUnicos[0]}" o "todos los monitores".`,
      servicios: serviciosUnicos,
      equipoTipo: soloPalabra,
      total: count,
    })
  }

  // ── TODOS LOS EQUIPOS DE UN TIPO ─────────────────────────────────
  const tipoEncontrado = palabrasClave.find(p => texto.includes(p))
  if (tipoEncontrado && (texto.includes('todos') || texto.includes('lista') || texto.includes('dame') || esAreaServicio)) {
    let query = supabase
      .from('equipos')
      .select('id, nombre, codigo_inventario, marca, modelo, serie, servicio, estado, riesgo, clase_invima, anio_adquisicion')
      .eq('institucion_id', INST)
      .eq('activo', true)
      .ilike('nombre', `%${tipoEncontrado}%`)
      .order('servicio')

    // Filtrar por servicio si lo menciona
    const servicioMencionado = ['uci', 'urgencias', 'cirugia', 'cirugía', 'pediatria', 'neonatos',
      'ginecologia', 'laboratorio', 'radiologia', 'consulta', 'hospitalizacion'].find(s => texto.includes(s))

    if (servicioMencionado) {
      query = query.ilike('servicio', `%${servicioMencionado}%`)
    }

    const { data: equipos } = await query

    if (!equipos || equipos.length === 0) {
      return NextResponse.json({ tipo: 'sin_resultados', respuesta: `No encontré ${tipoEncontrado}s con ese filtro. ¿Quieres que busque en todos los servicios?` })
    }

    // Agrupar por servicio
    const porServicio: Record<string, any[]> = {}
    equipos.forEach(e => {
      const s = e.servicio || 'Sin servicio'
      if (!porServicio[s]) porServicio[s] = []
      porServicio[s].push(e)
    })

    const estadoIcon: Record<string, string> = { operativo: '🟢', mantenimiento: '🟡', fuera_servicio: '🔴', baja: '⚫' }
    const riesgoIcon: Record<string, string> = { alto: '🔴', medio: '🟡', bajo: '🟢' }

    let respuesta = `## 📋 ${tipoEncontrado.charAt(0).toUpperCase() + tipoEncontrado.slice(1)}s — ${equipos.length} equipos en ${Object.keys(porServicio).length} servicios\n\n`

    Object.entries(porServicio).forEach(([servicio, eqs]) => {
      respuesta += `### 🏥 ${servicio} (${eqs.length} equipos)\n\n`
      respuesta += `| Código | Nombre | Marca | Estado | Riesgo | Clase |\n`
      respuesta += `|--------|--------|-------|--------|--------|-------|\n`
      eqs.forEach(e => {
        respuesta += `| ${e.codigo_inventario || '—'} | ${e.nombre} | ${e.marca || '—'} | ${estadoIcon[e.estado] || '—'} ${e.estado} | ${riesgoIcon[e.riesgo] || '—'} ${e.riesgo} | ${e.clase_invima || '—'} |\n`
      })
      respuesta += `\n`
    })

    respuesta += `\n💡 Para ver la hoja de vida completa de un equipo específico, dime: **"hoja de vida del [nombre] [código]"**`

    return NextResponse.json({
      tipo: 'lista_equipos',
      respuesta,
      equipos: equipos.length,
      servicios: Object.keys(porServicio).length,
    })
  }

  // ── EQUIPOS POR SERVICIO/ÁREA ────────────────────────────────────
  if (esAreaServicio && !tipoEncontrado) {
    // Extraer el nombre del servicio del mensaje
    const { data: serviciosDB } = await supabase
      .from('equipos')
      .select('servicio')
      .eq('institucion_id', INST)
      .eq('activo', true)

    const serviciosUnicos = [...new Set((serviciosDB || []).map(e => e.servicio).filter(Boolean))]
    const servicioMatch = serviciosUnicos.find(s => texto.includes(s.toLowerCase()))

    if (!servicioMatch) {
      // Listar servicios disponibles
      const { data: porSvc } = await supabase
        .from('equipos')
        .select('servicio')
        .eq('institucion_id', INST)
        .eq('activo', true)

      const conConteo: Record<string, number> = {}
      ;(porSvc || []).forEach(e => {
        const s = e.servicio || 'Sin servicio'
        conConteo[s] = (conConteo[s] || 0) + 1
      })

      const lista = Object.entries(conConteo).sort((a, b) => b[1] - a[1])
        .map(([s, n]) => `• **${s}** — ${n} equipos`).join('\n')

      return NextResponse.json({
        tipo: 'lista_servicios',
        respuesta: `## 🏥 Servicios disponibles\n\n${lista}\n\n¿De qué servicio quieres ver los equipos? Ejemplo: "equipos de UCI" o "equipos de Urgencias"`,
      })
    }

    const { data: equiposSvc } = await supabase
      .from('equipos')
      .select('id, nombre, codigo_inventario, marca, modelo, estado, riesgo, clase_invima, serie')
      .eq('institucion_id', INST)
      .eq('activo', true)
      .ilike('servicio', `%${servicioMatch}%`)
      .order('nombre')

    const estadoIcon: Record<string, string> = { operativo: '🟢', mantenimiento: '🟡', fuera_servicio: '🔴', baja: '⚫' }
    const riesgoIcon: Record<string, string> = { alto: '🔴', medio: '🟡', bajo: '🟢' }

    let respuesta = `## 🏥 Servicio: ${servicioMatch}\n\n**${equiposSvc?.length || 0} equipos registrados**\n\n`
    respuesta += `| Código | Nombre | Marca | Estado | Riesgo | Clase INVIMA |\n`
    respuesta += `|--------|--------|-------|--------|--------|-------------|\n`
    ;(equiposSvc || []).forEach(e => {
      respuesta += `| ${e.codigo_inventario || '—'} | ${e.nombre} | ${e.marca || '—'} | ${estadoIcon[e.estado] || '—'} ${e.estado} | ${riesgoIcon[e.riesgo] || '—'} ${e.riesgo} | ${e.clase_invima || '—'} |\n`
    })

    const altoRiesgo = (equiposSvc || []).filter(e => e.riesgo === 'alto').length
    const operativos = (equiposSvc || []).filter(e => e.estado === 'operativo').length

    respuesta += `\n**Resumen:** ${operativos} operativos · ${altoRiesgo} de alto riesgo\n\n`
    respuesta += `💡 Para ver la hoja de vida completa de un equipo: **"hoja de vida del [nombre o código]"**`

    return NextResponse.json({ tipo: 'equipos_servicio', respuesta, total: equiposSvc?.length })
  }

  // ── HOJA DE VIDA COMPLETA ─────────────────────────────────────────
  if (esHojaVida || (texto.includes('codigo') || texto.includes('código') && texto.match(/[A-Z]{2,}/))) {
    // Extraer nombre o código del equipo
    let busqueda = texto
      .replace('hoja de vida', '').replace('historial', '').replace('todo sobre', '')
      .replace('información completa', '').replace('del', '').replace('de la', '')
      .replace('de', '').trim()

    if (busqueda.length < 2) {
      return NextResponse.json({
        tipo: 'pedir_equipo',
        respuesta: '¿De qué equipo quieres la hoja de vida? Puedes decirme el nombre (ej: "hoja de vida del Monitor de Signos Vitales") o el código de inventario (ej: "hoja de vida BBS-MONIT-001").',
      })
    }

    // Buscar equipo por nombre o código
    const { data: equipos } = await supabase
      .from('equipos')
      .select('*')
      .eq('institucion_id', INST)
      .eq('activo', true)
      .or(`nombre.ilike.%${busqueda}%,codigo_inventario.ilike.%${busqueda}%,serie.ilike.%${busqueda}%`)
      .limit(5)

    if (!equipos || equipos.length === 0) {
      return NextResponse.json({
        tipo: 'sin_resultados',
        respuesta: `No encontré ningún equipo con "${busqueda}". Intenta con el nombre exacto o el código de inventario. Ejemplo: "hoja de vida Monitor De Signos Vitales" o "todos los monitores".`,
      })
    }

    if (equipos.length > 1) {
      const lista = equipos.map(e => `• **${e.nombre}** (${e.codigo_inventario}) — ${e.servicio || 'Sin servicio'}`).join('\n')
      return NextResponse.json({
        tipo: 'multiples_resultados',
        respuesta: `Encontré ${equipos.length} equipos similares:\n\n${lista}\n\n¿Cuál de estos es? Puedes decirme el código exacto.`,
      })
    }

    const eq = equipos[0]

    // Obtener TODOS los mantenimientos del equipo ordenados por fecha
    const { data: mants } = await supabase
      .from('mantenimientos')
      .select('*')
      .eq('equipo_id', eq.id)
      .order('fecha_programada', { ascending: true })

    // Obtener repuestos asignados a este equipo
    const { data: repuestos } = await supabase
      .from('repuesto_equipo')
      .select('*, repuestos(nombre, referencia, marca, costo_unitario)')
      .eq('equipo_id', eq.id)
      .order('created_at', { ascending: true })

    const anioActual = new Date().getFullYear()
    const edad = eq.anio_adquisicion ? anioActual - eq.anio_adquisicion : null
    const pctVida = eq.vida_util_anos && edad ? Math.min(Math.round((edad / eq.vida_util_anos) * 100), 100) : null

    const preventivos = (mants || []).filter(m => m.tipo === 'preventivo')
    const correctivos = (mants || []).filter(m => m.tipo === 'correctivo')
    const calibraciones = (mants || []).filter(m => m.tipo === 'calibracion')
    const costoTotal = (mants || []).reduce((a, m) => a + Number(m.costo_total || 0), 0)

    const estadoEmoji: Record<string, string> = { operativo: '🟢', mantenimiento: '🟡', fuera_servicio: '🔴', baja: '⚫' }
    const riesgoEmoji: Record<string, string> = { alto: '🔴', medio: '🟡', bajo: '🟢' }

    let hv = `# 📋 HOJA DE VIDA — ${eq.nombre}\n\n`

    // Identificación
    hv += `## 🔍 Identificación del equipo\n\n`
    hv += `| Campo | Valor |\n|-------|-------|\n`
    hv += `| **Nombre** | ${eq.nombre} |\n`
    hv += `| **Código inventario** | ${eq.codigo_inventario || '—'} |\n`
    hv += `| **Marca** | ${eq.marca || '—'} |\n`
    hv += `| **Modelo** | ${eq.modelo || '—'} |\n`
    hv += `| **Número de serie** | ${eq.serie || '—'} |\n`
    hv += `| **Clase INVIMA** | ${eq.clase_invima || '—'} |\n`
    hv += `| **Servicio** | ${eq.servicio || '—'} |\n`
    hv += `| **Ubicación** | ${eq.ubicacion || '—'} |\n`
    hv += `| **Estado** | ${estadoEmoji[eq.estado] || ''} ${eq.estado?.replace('_', ' ') || '—'} |\n`
    hv += `| **Riesgo** | ${riesgoEmoji[eq.riesgo] || ''} ${eq.riesgo || '—'} |\n`
    hv += `| **Año fabricación** | ${eq.anio_fabricacion || '—'} |\n`
    hv += `| **Año adquisición** | ${eq.anio_adquisicion || '—'} |\n`
    hv += `| **Vida útil** | ${eq.vida_util_anos ? `${eq.vida_util_anos} años` : '—'} |\n`
    hv += `| **Edad del equipo** | ${edad !== null ? `${edad} años en servicio${pctVida !== null ? ` (${pctVida}% de vida útil consumida)` : ''}` : '—'} |\n`
    if (eq.valor_adquisicion) hv += `| **Valor adquisición** | ${fmtCOP(Number(eq.valor_adquisicion))} |\n`
    hv += `\n`

    // Resumen de intervenciones
    hv += `## 📊 Resumen de intervenciones\n\n`
    hv += `| Indicador | Valor |\n|-----------|-------|\n`
    hv += `| **Total intervenciones** | ${(mants || []).length} |\n`
    hv += `| **Mantenimientos preventivos** | ${preventivos.length} |\n`
    hv += `| **Mantenimientos correctivos** | ${correctivos.length} |\n`
    hv += `| **Calibraciones** | ${calibraciones.length} |\n`
    hv += `| **Costo total histórico** | ${costoTotal > 0 ? fmtCOP(costoTotal) : 'No registrado'} |\n`
    hv += `| **Repuestos instalados** | ${(repuestos || []).length} registros |\n`
    if (preventivos.length > 0 && correctivos.length > 0) {
      hv += `| **Ratio prev/corr** | ${(preventivos.length / correctivos.length).toFixed(2)} |\n`
    }
    hv += `\n`

    // Historial cronológico completo
    if ((mants || []).length > 0) {
      hv += `## 📅 Historial cronológico completo\n\n`

      const tipoEmoji: Record<string, string> = { preventivo: '🔧', correctivo: '🔴', calibracion: '📏' }
      const estadoMant: Record<string, string> = { completado: '✅', programado: '📋', en_progreso: '⏳', cancelado: '❌' }

      ;(mants || []).forEach((m, idx) => {
        const fecha = fmtFecha(m.fecha_programada)
        const fechaReal = m.fecha_realizado ? fmtFecha(m.fecha_realizado) : null
        const emoji = tipoEmoji[m.tipo] || '🔧'
        const est = estadoMant[m.estado] || '—'

        hv += `### ${emoji} ${idx + 1}. ${m.tipo?.charAt(0).toUpperCase() + m.tipo?.slice(1)} — ${fecha}\n\n`
        hv += `| Campo | Detalle |\n|-------|--------|\n`
        hv += `| **Tipo** | ${m.tipo} |\n`
        hv += `| **Estado** | ${est} ${m.estado} |\n`
        hv += `| **Fecha programada** | ${fecha} |\n`
        if (fechaReal) hv += `| **Fecha realizado** | ${fechaReal} |\n`
        if (m.duracion_horas) hv += `| **Duración** | ${m.duracion_horas} horas |\n`
        if (m.costo_total && Number(m.costo_total) > 0) hv += `| **Costo** | ${fmtCOP(Number(m.costo_total))} |\n`
        if (m.descripcion) hv += `| **Descripción** | ${String(m.descripcion).replace(/\n/g, ' ').substring(0, 200)} |\n`
        if (m.hallazgos) hv += `| **Hallazgos** | ⚠️ ${String(m.hallazgos).replace(/\n/g, ' ').substring(0, 200)} |\n`
        hv += `\n`
      })
    } else {
      hv += `## 📅 Historial\n\n⚠️ Este equipo no tiene intervenciones registradas en el sistema.\n\n`
    }

    // Repuestos instalados
    if ((repuestos || []).length > 0) {
      hv += `## 🔩 Repuestos instalados\n\n`
      hv += `| Repuesto | Referencia | Marca | Cantidad | Costo unit. | Fecha |\n`
      hv += `|----------|-----------|-------|----------|-------------|-------|\n`
      ;(repuestos || []).forEach(r => {
        const rep = (r as any).repuestos
        if (rep) {
          hv += `| ${rep.nombre || '—'} | ${rep.referencia || '—'} | ${rep.marca || '—'} | ${r.cantidad || 1} | ${rep.costo_unitario ? fmtCOP(Number(rep.costo_unitario)) : '—'} | ${fmtFecha(r.created_at)} |\n`
        }
      })
      hv += `\n`
    }

    // Análisis predictivo
    hv += `## 🔮 Análisis predictivo\n\n`
    if (pctVida !== null) {
      const nivelRiesgo = pctVida >= 80 ? '🔴 CRÍTICO — Evaluar reemplazo' : pctVida >= 60 ? '🟡 ALERTA — Monitorear de cerca' : '🟢 NORMAL — Continuar plan preventivo'
      hv += `| Indicador | Valor |\n|-----------|-------|\n`
      hv += `| **Vida útil consumida** | ${pctVida}% |\n`
      hv += `| **Años restantes estimados** | ${eq.vida_util_anos - edad!} años |\n`
      hv += `| **Nivel de riesgo** | ${nivelRiesgo} |\n`
      if (correctivos.length > 0) hv += `| **Correctivos/año** | ${(correctivos.length / Math.max(edad || 1, 1)).toFixed(1)} |\n`
      hv += `\n`
    }

    // Próximo mantenimiento
    const proxFecha = new Date()
    proxFecha.setMonth(proxFecha.getMonth() + 6)
    hv += `## 📌 Próximas acciones recomendadas\n\n`
    hv += `- **Próximo preventivo:** ${proxFecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}\n`
    if (calibraciones.length === 0) hv += `- ⚠️ **Sin calibraciones registradas** — programar con laboratorio ONAC\n`
    if (pctVida !== null && pctVida >= 70) hv += `- 🔴 **Iniciar proceso de reposición tecnológica** (${pctVida}% de vida útil consumida)\n`
    hv += `\n---\n*Hoja de vida generada por BioMed AI — ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}*`

    return NextResponse.json({ tipo: 'hoja_vida', respuesta: hv, equipo: eq.nombre })
  }

  // ── ESTADÍSTICAS GENERALES ────────────────────────────────────────
  if (esEstadistica) {
    const [eqRes, mantRes, repRes] = await Promise.all([
      supabase.from('equipos').select('estado, riesgo, servicio').eq('institucion_id', INST).eq('activo', true),
      supabase.from('mantenimientos').select('tipo, estado, costo_total').eq('institucion_id', INST),
      supabase.from('repuestos').select('stock_actual, stock_minimo').eq('institucion_id', INST),
    ])

    const eq = eqRes.data || []
    const mant = mantRes.data || []
    const rep = repRes.data || []

    const operativos = eq.filter(e => e.estado === 'operativo').length
    const altoRiesgo = eq.filter(e => e.riesgo === 'alto').length
    const preventivos = mant.filter(m => m.tipo === 'preventivo').length
    const correctivos = mant.filter(m => m.tipo === 'correctivo').length
    const costoTotal = mant.reduce((a, m) => a + Number(m.costo_total || 0), 0)
    const sinStock = rep.filter(r => r.stock_actual === 0).length

    const porServicio: Record<string, number> = {}
    eq.forEach(e => { const s = e.servicio || 'Sin servicio'; porServicio[s] = (porServicio[s] || 0) + 1 })
    const topServicios = Object.entries(porServicio).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const respuesta = `## 📊 Resumen general del sistema\n\n` +
      `### Inventario\n` +
      `| Indicador | Valor |\n|-----------|-------|\n` +
      `| Total equipos activos | **${eq.length}** |\n` +
      `| Operativos | **${operativos}** (${Math.round((operativos/eq.length)*100)}%) |\n` +
      `| Alto riesgo | **${altoRiesgo}** |\n` +
      `| Fuera de servicio | **${eq.filter(e=>e.estado==='fuera_servicio').length}** |\n\n` +
      `### Mantenimientos\n` +
      `| Indicador | Valor |\n|-----------|-------|\n` +
      `| Total registros | **${mant.length}** |\n` +
      `| Preventivos | **${preventivos}** |\n` +
      `| Correctivos | **${correctivos}** |\n` +
      `| Costo total histórico | **${fmtCOP(costoTotal)}** |\n` +
      `| Ratio prev/corr | **${correctivos > 0 ? (preventivos/correctivos).toFixed(2) : 'N/D'}** |\n\n` +
      `### Repuestos\n` +
      `| Total | Sin stock | Stock bajo |\n|-------|-----------|------------|\n` +
      `| ${rep.length} | ${sinStock} | ${rep.filter(r=>r.stock_actual>0&&r.stock_actual<=r.stock_minimo).length} |\n\n` +
      `### Top 5 servicios por equipos\n` +
      topServicios.map(([s, n]) => `- **${s}:** ${n} equipos`).join('\n') +
      `\n\n💡 Puedes preguntarme por equipos específicos, servicios, o pedir la hoja de vida de cualquier equipo.`

    return NextResponse.json({ tipo: 'estadisticas', respuesta })
  }

  // ── REPUESTOS ────────────────────────────────────────────────────
  if (esRepuesto) {
    const { data: rep } = await supabase
      .from('repuestos')
      .select('*')
      .eq('institucion_id', INST)
      .order('stock_actual', { ascending: true })

    const sinStock = (rep || []).filter(r => r.stock_actual === 0)
    const stockBajo = (rep || []).filter(r => r.stock_actual > 0 && r.stock_actual <= r.stock_minimo)
    const stockOk = (rep || []).filter(r => r.stock_actual > r.stock_minimo)

    let respuesta = `## 📦 Inventario de repuestos\n\n`
    respuesta += `**Total:** ${(rep||[]).length} repuestos · **Sin stock:** ${sinStock.length} · **Stock bajo:** ${stockBajo.length} · **Óptimo:** ${stockOk.length}\n\n`

    if (sinStock.length > 0) {
      respuesta += `### 🔴 SIN STOCK — Reposición urgente\n\n`
      respuesta += `| Repuesto | Referencia | Mínimo | Costo unit. |\n|----------|-----------|--------|------------|\n`
      sinStock.forEach(r => {
        respuesta += `| ${r.nombre} | ${r.referencia || '—'} | ${r.stock_minimo} | ${r.costo_unitario ? fmtCOP(Number(r.costo_unitario)) : '—'} |\n`
      })
      respuesta += `\n`
    }

    if (stockBajo.length > 0) {
      respuesta += `### 🟡 STOCK BAJO\n\n`
      respuesta += `| Repuesto | Stock actual | Mínimo | Faltante |\n|----------|-------------|--------|----------|\n`
      stockBajo.forEach(r => {
        respuesta += `| ${r.nombre} | ${r.stock_actual} | ${r.stock_minimo} | ${r.stock_minimo - r.stock_actual} |\n`
      })
      respuesta += `\n`
    }

    if (stockOk.length > 0) {
      respuesta += `### 🟢 STOCK ÓPTIMO (${stockOk.length} repuestos)\n\n`
      respuesta += stockOk.slice(0, 10).map(r => `- ${r.nombre}: **${r.stock_actual}** uds`).join('\n')
      if (stockOk.length > 10) respuesta += `\n- ... y ${stockOk.length - 10} más`
    }

    return NextResponse.json({ tipo: 'repuestos', respuesta })
  }

  // ── BÚSQUEDA LIBRE ───────────────────────────────────────────────
  const { data: equiposLibre } = await supabase
    .from('equipos')
    .select('id, nombre, codigo_inventario, marca, servicio, estado, riesgo')
    .eq('institucion_id', INST)
    .eq('activo', true)
    .or(`nombre.ilike.%${texto}%,codigo_inventario.ilike.%${texto}%,marca.ilike.%${texto}%,servicio.ilike.%${texto}%`)
    .limit(10)

  if (equiposLibre && equiposLibre.length > 0) {
    const lista = equiposLibre.map(e =>
      `• **${e.nombre}** (${e.codigo_inventario || '—'}) — ${e.servicio || 'Sin servicio'} — ${e.estado}`
    ).join('\n')

    return NextResponse.json({
      tipo: 'busqueda_libre',
      respuesta: `Encontré ${equiposLibre.length} resultado(s) para "${texto}":\n\n${lista}\n\n💡 Para ver la hoja de vida completa di: **"hoja de vida del [nombre]"**`,
    })
  }

  // ── AYUDA ─────────────────────────────────────────────────────────
  return NextResponse.json({
    tipo: 'ayuda',
    respuesta: `No entendí tu consulta. Puedo ayudarte con:\n\n` +
      `**🔍 Buscar equipos:**\n` +
      `- "todos los monitores"\n- "ventiladores de UCI"\n- "equipos de urgencias"\n\n` +
      `**📋 Hoja de vida:**\n` +
      `- "hoja de vida del Monitor De Signos Vitales"\n- "historial del desfibrilador"\n\n` +
      `**📊 Estadísticas:**\n` +
      `- "resumen general" o "estadísticas del sistema"\n\n` +
      `**📦 Repuestos:**\n` +
      `- "inventario de repuestos" o "repuestos sin stock"\n\n` +
      `¿Qué quieres consultar?`,
  })
}
