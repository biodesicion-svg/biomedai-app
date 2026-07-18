import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mapeo canonico estado(DB) <-> columna(board)
const ESTADO_A_COLUMNA: Record<string, string> = {
  programado:  'pendiente',
  en_progreso: 'en_proceso',
  en_revision: 'en_revision',
  completado:  'completado',
}
const COLUMNA_A_ESTADO: Record<string, string> = {
  pendiente:    'programado',
  en_proceso:   'en_progreso',
  en_revision:  'en_revision',
  completado:   'completado',
}
const PROGRESO: Record<string, number> = {
  pendiente: 0, en_proceso: 35, en_revision: 75, completado: 100,
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  const IID = await getInstitutionId()
  try {
    const supabase = db()
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get('id')
    const mes  = searchParams.get('mes')
    const anio = searchParams.get('anio')

    // --- Traer UNA orden individual con su ejecucion completa ---
    if (idParam) {
      const { data: m, error } = await supabase
        .from('mantenimientos')
        .select('id, equipo_id, tecnico_id, tipo, estado, fecha_programada, fecha_realizado, duracion_horas, duracion_minutos, descripcion, ejecucion_respuestas, firma_tecnico, firma_supervisor, resultado')
        .eq('id', idParam).eq('institucion_id', IID).single()
      if (error || !m) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      let equipo:any = {}
      if (m.equipo_id) {
        const { data: eq } = await supabase.from('equipos')
          .select('nombre, servicio, codigo_inventario, riesgo').eq('id', m.equipo_id).single()
        equipo = eq || {}
      }
      let tecnico = 'Sin asignar'
      if (m.tecnico_id) {
        const { data: t } = await supabase.from('usuarios').select('nombre').eq('id', m.tecnico_id).single()
        if (t) tecnico = t.nombre
      }
      const columna = ESTADO_A_COLUMNA[m.estado] || 'pendiente'
      return NextResponse.json({ orden: {
        id: m.id,
        equipo: equipo.nombre || 'Equipo sin nombre',
        codigo: equipo.codigo_inventario || '',
        servicio: equipo.servicio || '',
        riesgo: equipo.riesgo || 'medio',
        tipo: m.tipo || 'preventivo',
        tecnico,
        columna,
        estado: m.estado,
        fechaProg: m.fecha_programada || '',
        fechaRealizado: m.fecha_realizado || '',
        descripcion: m.descripcion || '',
        respuestas: m.ejecucion_respuestas || null,
        firma_tecnico: m.firma_tecnico || '',
        firma_supervisor: m.firma_supervisor || '',
        resultado: m.resultado || '',
        duracion_minutos: m.duracion_minutos || 0,
      }})
    }

    let q = supabase
      .from('mantenimientos')
      .select('id, equipo_id, tecnico_id, tipo, estado, fecha_programada, fecha_realizado, duracion_horas, descripcion')
      .eq('institucion_id', IID)
      .order('fecha_programada', { ascending: true })
      .limit(400)

    if (mes && anio) {
      const m = String(mes).padStart(2, '0')
      const ini = `${anio}-${m}-01`
      const fin = `${anio}-${m}-31`
      q = q.gte('fecha_programada', ini).lte('fecha_programada', fin)
    }

    const { data: mants, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Traer equipos referenciados (segunda query, sin depender de FK embebida)
    const equipoIds = [...new Set((mants || []).map(m => m.equipo_id).filter(Boolean))]
    const equiposMap: Record<string, any> = {}
    if (equipoIds.length) {
      const { data: eqs } = await supabase
        .from('equipos')
        .select('id, nombre, servicio, codigo_inventario, riesgo')
        .in('id', equipoIds)
      eqs?.forEach(e => { equiposMap[e.id] = e })
    }

    // Resolver nombres de tecnicos (misma tecnica que equipos)
    const tecnicoIds = [...new Set((mants || []).map(m => m.tecnico_id).filter(Boolean))]
    const tecnicosMap: Record<string, any> = {}
    if (tecnicoIds.length) {
      const { data: tecs } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('id', tecnicoIds)
      tecs?.forEach(t => { tecnicosMap[t.id] = t })
    }

    const riesgoAPrioridad: Record<string, string> = { alto: 'alta', medio: 'media', bajo: 'baja' }

    const ordenes = (mants || []).map(m => {
      const eq = equiposMap[m.equipo_id] || {}
      const columna = ESTADO_A_COLUMNA[m.estado] || 'pendiente'
      return {
        id: m.id,
        equipo: eq.nombre || 'Equipo sin nombre',
        codigo: eq.codigo_inventario || '',
        tipo: m.tipo || 'preventivo',
        tecnico: tecnicosMap[m.tecnico_id]?.nombre || 'Sin asignar',
        cantidad: 1,
        horas: m.duracion_horas || 4,
        columna,
        progreso: PROGRESO[columna] ?? 0,
        prioridad: riesgoAPrioridad[eq.riesgo] || 'media',
        riesgo: eq.riesgo || 'medio',
        servicio: eq.servicio || '',
        descripcion: m.descripcion || 'Mantenimiento programado',
        fechaProg: m.fecha_programada || '',
      }
    })

    return NextResponse.json({ ordenes, total: ordenes.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const IID = await getInstitutionId()
  try {
    const supabase = db()
    const { id, columna, respuestas, firma_tecnico, firma_supervisor, resultado, duracion_minutos } = await req.json()
    if (!id || !columna) {
      return NextResponse.json({ error: 'Faltan id o columna' }, { status: 400 })
    }
    const estado = COLUMNA_A_ESTADO[columna]
    if (!estado) {
      return NextResponse.json({ error: 'Columna invalida' }, { status: 400 })
    }

    const patch: Record<string, any> = { estado }
    if (columna === 'completado') {
      patch.fecha_realizado = new Date().toISOString().slice(0, 10)
    }
    // Guardar la ejecucion si viene (al finalizar el mantenimiento)
    if (respuestas !== undefined)      patch.ejecucion_respuestas = respuestas
    if (firma_tecnico !== undefined)   patch.firma_tecnico = firma_tecnico
    if (firma_supervisor !== undefined) patch.firma_supervisor = firma_supervisor
    if (resultado !== undefined)       patch.resultado = resultado
    if (duracion_minutos !== undefined) patch.duracion_minutos = duracion_minutos

    const { error } = await supabase
      .from('mantenimientos')
      .update(patch)
      .eq('id', id)
      .eq('institucion_id', IID)   // aislamiento multi-tenant

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, estado })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
