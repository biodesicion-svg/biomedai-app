import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function buscarEquipo(query: string) {
  const { data } = await supabase
    .from('equipos')
    .select('*')
    .eq('institucion_id', INSTITUCION_ID)
    .or(`nombre.ilike.%${query}%,codigo_inventario.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%,servicio.ilike.%${query}%`)
    .limit(5)
  return data || []
}

async function getHistorial(equipoId: string) {
  const { data } = await supabase
    .from('mantenimientos')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('fecha_programada', { ascending: false })
    .limit(10)
  return data || []
}

async function getEstadisticasGenerales() {
  const { data: equipos } = await supabase
    .from('equipos')
    .select('riesgo, estado, servicio, nombre')
    .eq('institucion_id', INSTITUCION_ID)
    .eq('activo', true)

  const { data: mants } = await supabase
    .from('mantenimientos')
    .select('tipo, estado')
    .eq('institucion_id', INSTITUCION_ID)

  return { equipos: equipos || [], mants: mants || [] }
}

function formatearEquipo(e: any): string {
  const lines = [
    `📋 **${e.nombre}**`,
    `├ Código: ${e.codigo_inventario}`,
    `├ Marca / Modelo: ${e.marca || '—'} ${e.modelo || ''}`,
    `├ Serie: ${e.serie || '—'}`,
    `├ Servicio: ${e.servicio || '—'}`,
    `├ Ubicación: ${e.ubicacion || '—'}`,
    `├ Riesgo: ${e.riesgo || '—'}`,
    `├ Clase INVIMA: ${e.clase_invima || '—'}`,
    `├ Estado: ${e.estado?.replace('_',' ') || '—'}`,
    `├ Año adquisición: ${e.anio_adquisicion || '—'}`,
    `├ Vida útil: ${e.vida_util_anos ? e.vida_util_anos + ' años' : '—'}`,
    e.valor_adquisicion ? `└ Valor adquisición: $${Number(e.valor_adquisicion).toLocaleString('es-CO')} COP` : `└ Valor adquisición: —`,
  ]
  return lines.join('\n')
}

function formatearMantenimiento(m: any, idx: number): string {
  const fecha = m.fecha_programada
    ? new Date(m.fecha_programada).toLocaleDateString('es-CO', {year:'numeric',month:'short',day:'numeric'})
    : '—'
  return `${idx+1}. [${m.tipo?.toUpperCase()}] ${fecha} — ${m.estado} ${m.descripcion ? '· ' + m.descripcion.replace(/&#x0D;/g,'').replace(/\n/g,' ').substring(0,80) + '...' : ''}`
}

async function procesarMensaje(texto: string): Promise<string> {
  const t = texto.toLowerCase().trim()

  // Saludo
  if (['hola','buenos días','buenas','hey','hi'].some(s => t.includes(s))) {
    return `¡Hola! Soy el asistente biomédico de BioMed AI. Puedo ayudarte con:\n\n• Buscar información de un equipo (ej: "información del Monitor De Signos Vitales")\n• Ver el historial de mantenimientos de un equipo\n• Estadísticas del inventario\n• Estado de los equipos por servicio\n\n¿Qué necesitas consultar?`
  }

  // Estadísticas generales
  if (t.includes('estadística') || t.includes('resumen') || t.includes('total') || t.includes('cuántos') || t.includes('inventario general')) {
    const { equipos, mants } = await getEstadisticasGenerales()
    const operativos = equipos.filter(e=>e.estado==='operativo').length
    const alto = equipos.filter(e=>e.riesgo==='alto').length
    const preventivos = mants.filter(m=>m.tipo==='preventivo').length
    const correctivos = mants.filter(m=>m.tipo==='correctivo').length

    const servicios: Record<string,number> = {}
    equipos.forEach(e => { if(e.servicio) servicios[e.servicio] = (servicios[e.servicio]||0)+1 })
    const topServicios = Object.entries(servicios).sort((a,b)=>b[1]-a[1]).slice(0,5)

    return `📊 **Resumen del inventario**\n\nTotal equipos: ${equipos.length}\nOperativos: ${operativos} (${Math.round(operativos/equipos.length*100)}%)\nRiesgo alto: ${alto}\n\nMantenimientos registrados: ${mants.length}\nPreventivos: ${preventivos}\nCorrectivos: ${correctivos}\n\nTop servicios por equipos:\n${topServicios.map(([s,n])=>`• ${s}: ${n} equipos`).join('\n')}`
  }

  // Historial de mantenimientos
  if (t.includes('historial') || t.includes('mantenimiento') || t.includes('intervenciones')) {
    const nombreBusqueda = t
      .replace(/historial|mantenimiento|mantenimientos|intervenciones|del|de|la|las|los|equipo/g, '')
      .trim()

    if (nombreBusqueda.length < 2) {
      return `Para consultar el historial de un equipo, escribe por ejemplo:\n\n"Historial del Monitor De Signos Vitales"\n"Mantenimientos del Desfibrilador"\n"Intervenciones de la Incubadora"`
    }

    const equipos = await buscarEquipo(nombreBusqueda)
    if (equipos.length === 0) {
      return `No encontré equipos con "${nombreBusqueda}". Intenta con el nombre completo o el código de inventario.`
    }

    const equipo = equipos[0]
    const historial = await getHistorial(equipo.id)

    if (historial.length === 0) {
      return `El equipo **${equipo.nombre}** (${equipo.codigo_inventario}) no tiene mantenimientos registrados en el sistema.`
    }

    return `🔧 **Historial de mantenimientos — ${equipo.nombre}**\nCódigo: ${equipo.codigo_inventario} | Servicio: ${equipo.servicio || '—'}\n\nTotal: ${historial.length} intervenciones\n\n${historial.map(formatearMantenimiento).join('\n')}`
  }

  // Equipos por servicio
  if (t.includes('servicio') || t.includes('área') || t.includes('uci') || t.includes('urgencias') || t.includes('cirugía') || t.includes('hospitalización')) {
    const serviciosBusqueda: Record<string,string> = {
      'uci':'uci', 'urgencias':'urgencias', 'cirugía':'cirugia', 'cirugia':'cirugia',
      'hospitalización':'hospitalizacion', 'hospitalizacion':'hospitalizacion',
      'ginecología':'ginecologia', 'ginecologia':'ginecologia', 'neonatos':'neonatos',
      'laboratorio':'laboratorio', 'imagenología':'imagenologia'
    }

    let servicio = ''
    for (const [key, val] of Object.entries(serviciosBusqueda)) {
      if (t.includes(key)) { servicio = key; break }
    }

    if (servicio) {
      const { data: eqs } = await supabase
        .from('equipos')
        .select('nombre, codigo_inventario, riesgo, estado, marca')
        .eq('institucion_id', INSTITUCION_ID)
        .ilike('servicio', `%${servicio}%`)
        .limit(15)

      if (!eqs || eqs.length === 0) {
        return `No encontré equipos en el servicio "${servicio}".`
      }

      const operativos = eqs.filter(e=>e.estado==='operativo').length
      return `🏥 **Equipos en ${servicio.toUpperCase()}**\n\nTotal: ${eqs.length} | Operativos: ${operativos}\n\n${eqs.map(e=>`• ${e.nombre} (${e.codigo_inventario}) — Riesgo ${e.riesgo} — ${e.estado?.replace('_',' ')}`).join('\n')}`
    }
  }

  // Equipos de alto riesgo
  if (t.includes('alto riesgo') || t.includes('riesgo alto') || t.includes('críticos')) {
    const { data: eqs } = await supabase
      .from('equipos')
      .select('nombre, codigo_inventario, servicio, estado, marca')
      .eq('institucion_id', INSTITUCION_ID)
      .eq('riesgo', 'alto')
      .eq('activo', true)
      .limit(20)

    const operativos = (eqs||[]).filter(e=>e.estado==='operativo').length
    return `⚠️ **Equipos de alto riesgo**\n\nTotal: ${eqs?.length} | Operativos: ${operativos}\n\n${(eqs||[]).map(e=>`• ${e.nombre} — ${e.servicio || '—'} — ${e.estado?.replace('_',' ')}`).join('\n')}`
  }

  // Búsqueda de equipo específico
  const equipos = await buscarEquipo(t.replace(/información|info|datos|del|de|la|las|los|equipo|buscar|busca/g,'').trim())

  if (equipos.length === 0) {
    return `No encontré equipos con "${texto}". \n\nPrueba con:\n• Nombre del equipo: "Monitor De Signos Vitales"\n• Código: "BMO-MOSIV-00010553"\n• Marca: "Mindray"\n• Servicio: "equipos de urgencias"\n\nO escribe "resumen" para ver estadísticas generales.`
  }

  if (equipos.length === 1) {
    const e = equipos[0]
    const historial = await getHistorial(e.id)
    const ultimoMant = historial[0]

    return `${formatearEquipo(e)}\n\n📅 **Mantenimientos:** ${historial.length} registrados\n${ultimoMant ? `Último: ${ultimoMant.tipo} — ${new Date(ultimoMant.fecha_programada).toLocaleDateString('es-CO')}` : 'Sin mantenimientos registrados'}\n\nEscribe "historial de ${e.nombre}" para ver todas las intervenciones.`
  }

  return `Encontré ${equipos.length} equipos:\n\n${equipos.map(e=>`• **${e.nombre}** (${e.codigo_inventario}) — ${e.servicio || '—'} — ${e.riesgo}`).join('\n')}\n\nEscribe el nombre exacto para ver el detalle completo.`
}

export async function POST(req: Request) {
  try {
    const { mensajes } = await req.json()
    const ultimoMensaje = mensajes[mensajes.length - 1]
    const respuesta = await procesarMensaje(ultimoMensaje.contenido)
    return NextResponse.json({ respuesta })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
