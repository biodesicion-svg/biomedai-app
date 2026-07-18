import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionId } from '@/lib/get-institution'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const IID = await getInstitutionId()
    const search = (req.nextUrl.searchParams.get('q') || '').toLowerCase()
    const tipoF = req.nextUrl.searchParams.get('tipo') || ''
    const equipoF = req.nextUrl.searchParams.get('equipo') || ''

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mantenimientos ejecutados (completados)
    const { data: mants, error } = await supabase
      .from('mantenimientos')
      .select('id, equipo_id, tecnico_id, tipo, estado, fecha_realizado, fecha_programada, duracion_minutos, resultado, descripcion, hallazgos, repuesto_usado')
      .eq('institucion_id', IID)
      .eq('estado', 'completado')
      .order('fecha_realizado', { ascending: false })
      .limit(1000)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Equipos
    const eqIds = [...new Set((mants || []).map(m => m.equipo_id).filter(Boolean))]
    const eqMap: Record<string, any> = {}
    if (eqIds.length) {
      const { data: eqs } = await supabase.from('equipos')
        .select('id, nombre, marca, modelo, serie, ubicacion, servicio, codigo_inventario')
        .in('id', eqIds)
      eqs?.forEach(e => { eqMap[e.id] = e })
    }

    // Tecnicos
    const tecIds = [...new Set((mants || []).map(m => m.tecnico_id).filter(Boolean))]
    const tecMap: Record<string, string> = {}
    if (tecIds.length) {
      const { data: tecs } = await supabase.from('usuarios').select('id, nombre').in('id', tecIds)
      tecs?.forEach(t => { tecMap[t.id] = t.nombre })
    }

    // Mapear al formato que espera la pantalla
    let servicios = (mants || []).map((m, idx) => {
      const eq = eqMap[m.equipo_id] || {}
      return {
        id: m.id,
        numero_reporte: `RS-${String(m.fecha_realizado || '').slice(0,4)}-${String(m.id).slice(0,6).toUpperCase()}`,
        fecha_servicio: m.fecha_realizado || m.fecha_programada,
        equipo: eq.nombre || 'Equipo sin nombre',
        marca: eq.marca || 'N/D',
        modelo: eq.modelo || 'N/D',
        serie_placa: eq.serie || eq.codigo_inventario || 'N/D',
        ubicacion: eq.ubicacion || eq.servicio || 'N/D',
        servicio_area: eq.servicio || 'N/D',
        tipo_servicio: m.tipo || 'preventivo',
        tecnico: tecMap[m.tecnico_id] || 'Sin asignar',
        resultado: m.resultado || 'conforme',
        duracion_minutos: m.duracion_minutos || 0,
        descripcion: m.descripcion || '',
        hallazgos: m.hallazgos || '',
        repuestos_utilizados: m.repuesto_usado || '',
      }
    })

    // Filtros
    if (tipoF)   servicios = servicios.filter(s => s.tipo_servicio.toLowerCase().includes(tipoF.toLowerCase()))
    if (equipoF) servicios = servicios.filter(s => s.equipo.toLowerCase().includes(equipoF.toLowerCase()))
    if (search)  servicios = servicios.filter(s =>
      s.equipo.toLowerCase().includes(search) ||
      s.serie_placa.toLowerCase().includes(search) ||
      s.numero_reporte.toLowerCase().includes(search) ||
      s.tecnico.toLowerCase().includes(search))

    // KPIs
    const tipos: any = {}, equipos: any = {}, tecnicos: any = {}, resultados: any = {}
    servicios.forEach(s => {
      tipos[s.tipo_servicio] = (tipos[s.tipo_servicio] || 0) + 1
      equipos[s.equipo] = (equipos[s.equipo] || 0) + 1
      tecnicos[s.tecnico] = (tecnicos[s.tecnico] || 0) + 1
      resultados[s.resultado] = (resultados[s.resultado] || 0) + 1
    })

    // Totales globales (para cumplimiento)
    const { count: totalProg } = await supabase.from('mantenimientos')
      .select('id', { count: 'exact', head: true }).eq('institucion_id', IID)
    const { count: totalComp } = await supabase.from('mantenimientos')
      .select('id', { count: 'exact', head: true }).eq('institucion_id', IID).eq('estado','completado')

    // ---- Datos para el dashboard: traer TODO paginado ----
    const todos: any[] = []
    for (let from = 0; ; from += 1000) {
      const { data: pg } = await supabase.from('mantenimientos')
        .select('id, equipo_id, tecnico_id, tipo, estado, fecha_programada, fecha_realizado, duracion_minutos, resultado')
        .eq('institucion_id', IID).order('fecha_programada', { ascending: true })
        .range(from, from + 999)
      if (!pg || pg.length === 0) break
      todos.push(...pg)
      if (pg.length < 1000) break
    }

    // Equipos (para agrupar por servicio)
    const eqMapAll: Record<string, any> = {}
    for (let from = 0; ; from += 1000) {
      const { data: eqs } = await supabase.from('equipos')
        .select('id, nombre, servicio').eq('institucion_id', IID)
        .order('id', { ascending: true }).range(from, from + 999)
      if (!eqs || eqs.length === 0) break
      eqs.forEach(e => { eqMapAll[e.id] = e })
      if (eqs.length < 1000) break
    }

    // Tecnicos (todos)
    const tecMapAll: Record<string, string> = {}
    const { data: tecsAll } = await supabase.from('usuarios')
      .select('id, nombre').eq('institucion_id', IID)
    tecsAll?.forEach(t => { tecMapAll[t.id] = t.nombre })

    const hoy = new Date().toISOString().slice(0,10)
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    let vencidos = 0, sumaMin = 0, cantMin = 0, conformes = 0, noConformes = 0
    const porTecnico: Record<string, {asignados:number, completados:number}> = {}
    const porMes: Record<number, {programados:number, completados:number}> = {}
    const pendPorServicio: Record<string, number> = {}
    const porEquipo: Record<string, number> = {}

    for (let i = 1; i <= 12; i++) porMes[i] = { programados: 0, completados: 0 }

    todos.forEach(m => {
      const comp = m.estado === 'completado'
      const eq = eqMapAll[m.equipo_id] || {}
      const tec = tecMapAll[m.tecnico_id] || 'Sin asignar'

      // Vencidos: fecha pasada y no completado
      if (!comp && m.fecha_programada && m.fecha_programada < hoy) vencidos++

      // Tiempo promedio
      if (comp && m.duracion_minutos) { sumaMin += m.duracion_minutos; cantMin++ }

      // Conformidad
      if (comp) { if (m.resultado === 'no_conforme') noConformes++; else conformes++ }

      // Por tecnico
      if (!porTecnico[tec]) porTecnico[tec] = { asignados: 0, completados: 0 }
      porTecnico[tec].asignados++
      if (comp) porTecnico[tec].completados++

      // Por mes
      if (m.fecha_programada) {
        const mes = parseInt(m.fecha_programada.slice(5,7), 10)
        if (porMes[mes]) { porMes[mes].programados++; if (comp) porMes[mes].completados++ }
      }

      // Pendientes por servicio
      if (!comp) {
        const sv = eq.servicio || 'Sin servicio'
        pendPorServicio[sv] = (pendPorServicio[sv] || 0) + 1
      }

      // Equipos mas intervenidos (completados)
      if (comp) {
        const nm = eq.nombre || 'Sin nombre'
        porEquipo[nm] = (porEquipo[nm] || 0) + 1
      }
    })

    const dashboard = {
      cumplimiento: totalProg ? Math.round(((totalComp || 0) / totalProg) * 100) : 0,
      pendientes: (totalProg || 0) - (totalComp || 0),
      vencidos,
      conformidad: (conformes + noConformes) ? Math.round((conformes / (conformes + noConformes)) * 100) : 0,
      tiempo_promedio: cantMin ? Math.round(sumaMin / cantMin) : 0,
      no_conformes: noConformes,
      por_tecnico: Object.entries(porTecnico).map(([nombre, v]) => ({
        nombre, asignados: v.asignados, completados: v.completados,
        pct: v.asignados ? Math.round((v.completados / v.asignados) * 100) : 0,
      })).sort((a,b) => b.asignados - a.asignados),
      por_mes: Object.entries(porMes).map(([m, v]) => ({
        mes: MESES[parseInt(m,10)-1], programados: v.programados, completados: v.completados,
        pct: v.programados ? Math.round((v.completados / v.programados) * 100) : 0,
      })),
      pendientes_servicio: Object.entries(pendPorServicio)
        .map(([servicio, n]) => ({ servicio, pendientes: n }))
        .sort((a,b) => b.pendientes - a.pendientes).slice(0, 10),
      equipos_top: Object.entries(porEquipo)
        .map(([equipo, n]) => ({ equipo, intervenciones: n }))
        .sort((a,b) => b.intervenciones - a.intervenciones).slice(0, 8),
    }

    return NextResponse.json({
      servicios,
      kpis: {
        total: servicios.length, tipos, equipos, tecnicos, resultados,
        programados: totalProg || 0,
        completados: totalComp || 0,
        pendientes: (totalProg || 0) - (totalComp || 0),
        cumplimiento: totalProg ? Math.round(((totalComp || 0) / totalProg) * 100) : 0,
      },
      dashboard,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
