import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const HORAS_DIA = 8
const DIAS_MES = 22
const HORAS_FALLBACK = 4  // si duracion_horas viene null

export async function GET(req: Request) {
  const IID = await getInstitutionId()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Año: por defecto el de las fechas reales (2026). Se puede pasar ?anio=
    const { searchParams } = new URL(req.url)
    const anio = parseInt(searchParams.get('anio') || '2026', 10)

    // 1) Traer TODOS los mantenimientos reales del año (paginado: Supabase corta en 1000)
    const mants: any[] = []
    const PAGE = 1000
    for (let from = 0; ; from += PAGE) {
      const { data: page, error } = await supabase
        .from('mantenimientos')
        .select('id, equipo_id, tecnico_id, tipo, estado, fecha_programada, duracion_horas')
        .eq('institucion_id', IID)
        .gte('fecha_programada', `${anio}-01-01`)
        .lte('fecha_programada', `${anio}-12-31`)
        .order('fecha_programada', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!page || page.length === 0) break
      mants.push(...page)
      if (page.length < PAGE) break
    }

    // 2) Resolver equipos: traer TODOS los de la institucion paginados con orden estable
    const equipoIds = [...new Set((mants || []).map(m => m.equipo_id).filter(Boolean))]
    const equiposMap: Record<string, any> = {}
    for (let from = 0; ; from += 1000) {
      const { data: eqs, error: eqErr } = await supabase
        .from('equipos')
        .select('id, nombre, servicio, riesgo')
        .eq('institucion_id', IID)
        .order('id', { ascending: true })
        .range(from, from + 999)
      if (eqErr) return NextResponse.json({ error: eqErr.message }, { status: 500 })
      if (!eqs || eqs.length === 0) break
      eqs.forEach(e => { equiposMap[e.id] = e })
      if (eqs.length < 1000) break
    }

    // 3) Resolver tecnicos reales
    const tecnicoIds = [...new Set((mants || []).map(m => m.tecnico_id).filter(Boolean))]
    const tecnicosMap: Record<string, string> = {}
    if (tecnicoIds.length) {
      const { data: tecs } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('id', tecnicoIds)
      tecs?.forEach(t => { tecnicosMap[t.id] = t.nombre })
    }
    const tecnicosLista = [...new Set(Object.values(tecnicosMap))].sort()

    // 4) Agrupar por mes -> por nombre de equipo -> asignaciones por tecnico
    // estructura temporal: porMes[mes][nombreEquipo] = { cantidad, horasTotales, tipo, riesgo, porTecnico:{tec:{cantidad,horas}} }
    const porMes: Record<number, Record<string, any>> = {}
    for (let m = 1; m <= 12; m++) porMes[m] = {}

    ;(mants || []).forEach(mant => {
      if (!mant.fecha_programada) return
      const mes = new Date(mant.fecha_programada + 'T00:00:00').getMonth() + 1
      const eq = equiposMap[mant.equipo_id] || {}
      const nombre = eq.nombre || 'Equipo sin nombre'
      const tipo = mant.tipo || 'preventivo'
      const riesgo = eq.riesgo || 'medio'
      const horas = mant.duracion_horas || HORAS_FALLBACK
      const tec = tecnicosMap[mant.tecnico_id] || 'Sin asignar'

      if (!porMes[mes][nombre]) {
        porMes[mes][nombre] = { nombre, cantidad: 0, horasTotales: 0, horas, tipo, riesgo, servicio: eq.servicio || '', porTecnico: {} }
      }
      const item = porMes[mes][nombre]
      item.cantidad++
      item.horasTotales += horas
      if (!item.porTecnico[tec]) item.porTecnico[tec] = { tecnico: tec, cantidad: 0, horas: 0 }
      item.porTecnico[tec].cantidad++
      item.porTecnico[tec].horas += horas
    })

    // 5) Convertir a cronogramaMensual con el shape que espera el page
    const cronogramaMensual: Record<number, any[]> = {}
    for (let m = 1; m <= 12; m++) {
      cronogramaMensual[m] = Object.values(porMes[m]).map((it: any) => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        horasTotales: it.horasTotales,
        horas: it.horas,
        tipo: it.tipo,
        riesgo: it.riesgo,
        frecuencia: 'Programado',
        asignaciones: Object.values(it.porTecnico),
        servicio: it.servicio || '',
      }))
    }

    // 6) Resumen anual por mes
    const nombresMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const resumenAnual = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const items = cronogramaMensual[mes]
      const totalEquipos = items.reduce((a, b) => a + b.cantidad, 0)
      const totalHoras = items.reduce((a, b) => a + b.horasTotales, 0)
      const preventivos = items.filter(x => x.tipo === 'preventivo').reduce((a, b) => a + b.cantidad, 0)
      const calibraciones = items.filter(x => x.tipo === 'calibracion').reduce((a, b) => a + b.cantidad, 0)
      const capacidad = HORAS_DIA * DIAS_MES * Math.max(tecnicosLista.length, 1)
      return {
        mes,
        nombre: nombresMes[i],
        totalEquipos,
        totalHoras,
        capacidad,
        ocupacion: capacidad ? Math.round((totalHoras / capacidad) * 100) : 0,
        preventivos,
        calibraciones,
        items: items.length,
      }
    })

    // 7) Stats globales
    const totalInterv = (mants || []).length
    const horasTotalesAno = (mants || []).reduce((a, m) => a + (m.duracion_horas || HORAS_FALLBACK), 0)

    return NextResponse.json({
      anio,
      cronogramaMensual,
      resumenAnual,
      tecnicos: tecnicosLista.length ? tecnicosLista : ['Sin asignar'],
      stats: {
        totalEquipos: equipoIds.length,
        totalInterv,
        horasTotalesAno,
        capacidadMensual: HORAS_DIA * DIAS_MES * Math.max(tecnicosLista.length, 1),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
