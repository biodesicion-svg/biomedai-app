import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getInstitutionId } from '@/lib/get-institution'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

export async function GET(req: NextRequest) {
  try {
    const IID = await getInstitutionId()
    const evalId = req.nextUrl.searchParams.get('id')  // opcional: ficha individual
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: evals } = await sb.from('reemplazo_evaluaciones')
      .select('*').eq('institucion_id', IID).order('evdm_score', { ascending: false })

    const eqIds = [...new Set((evals || []).map(e => e.equipo_id).filter(Boolean))]
    const eqMap: Record<string, any> = {}
    if (eqIds.length) {
      const { data: eqs } = await sb.from('equipos')
        .select('id,nombre,marca,modelo,serie,codigo_inventario,servicio,clase_invima,anio_adquisicion,vida_util_anos')
        .in('id', eqIds)
      eqs?.forEach(e => { eqMap[e.id] = e })
    }

    const anio = new Date().getFullYear()
    const evaluaciones = (evals || []).map(ev => {
      const eq = eqMap[ev.equipo_id] || {}
      const edad = ev.anio_adquisicion ? anio - ev.anio_adquisicion : null
      const cmr = ev.valor_reposicion_actual > 0
        ? Math.round((Number(ev.costo_mantenimiento_anual || 0) / Number(ev.valor_reposicion_actual)) * 100) : 0
      return { ...ev, equipo_nombre: eq.nombre || '-', codigo: eq.codigo_inventario || '-',
               servicio: eq.servicio || '-', edad, cmr_pct: cmr }
    })

    const kpis = {
      total: evaluaciones.length,
      reemplazar: evaluaciones.filter(e => e.recomendacion === 'reemplazar_inmediato').length,
      evaluar: evaluaciones.filter(e => e.recomendacion === 'evaluar_1_2_anios').length,
      mantener: evaluaciones.filter(e => e.recomendacion === 'mantener' || e.recomendacion === 'monitorear').length,
      inversion: evaluaciones.filter(e => e.recomendacion === 'reemplazar_inmediato')
        .reduce((a, e) => a + Number(e.valor_reposicion_actual || 0), 0),
    }

    // Ficha individual con trazabilidad
    let detalle: any = null
    if (evalId) {
      const ev = evaluaciones.find(x => x.id === evalId)
      if (ev) {
        const eq = eqMap[ev.equipo_id] || {}
        const { data: mts } = await sb.from('mantenimientos')
          .select('fecha_realizado,fecha_programada,tipo,estado,resultado,costo_total,tecnico_id')
          .eq('equipo_id', ev.equipo_id).order('fecha_programada', { ascending: false }).limit(60)
        const tecIds = [...new Set((mts || []).map(m => m.tecnico_id).filter(Boolean))]
        const tecMap: Record<string, string> = {}
        if (tecIds.length) {
          const { data: ts } = await sb.from('usuarios').select('id,nombre').in('id', tecIds)
          ts?.forEach(t => { tecMap[t.id] = t.nombre })
        }
        const { data: alts } = await sb.from('reemplazo_comparativos')
          .select('*').eq('evaluacion_id', evalId)

        detalle = {
          equipo: eq, evaluacion: ev,
          mantenimientos: (mts || []).map(m => ({
            fecha: m.fecha_realizado || m.fecha_programada, tipo: m.tipo, estado: m.estado,
            resultado: m.resultado, costo: m.costo_total || 0,
            tecnico: tecMap[m.tecnico_id] || 'Sin asignar',
          })),
          alternativas: alts || [],
          justificacion: `El equipo ${eq.nombre || ''} (${eq.codigo_inventario || ''}) presenta un score EVDM de ${ev.evdm_score}/100. `
            + `Con ${ev.edad || 0} anios de uso frente a una vida util estimada de ${ev.vida_util_fabricante || 0} anios, `
            + `un costo de mantenimiento anual de ${Number(ev.costo_mantenimiento_anual || 0).toLocaleString('es-CO')} COP `
            + `(CMR ${ev.cmr_pct}% del valor de reposicion), ${ev.correctivos_ultimo_anio || 0} mantenimientos correctivos en el ultimo anio `
            + `y ${ev.eventos_adversos_count || 0} eventos adversos asociados. `
            + (ev.obsolescencia_funcional ? 'Presenta obsolescencia funcional. ' : '')
            + (ev.obsolescencia_tecnologica ? 'Presenta obsolescencia tecnologica con disponibilidad limitada de repuestos. ' : '')
            + `Impacto clinico: ${ev.impacto_clinico || 'no definido'}.`,
          recomendacion_final: ev.recomendacion === 'reemplazar_inmediato'
            ? 'Se recomienda proceder con el reemplazo del equipo en el presente periodo presupuestal.'
            : ev.recomendacion === 'evaluar_1_2_anios'
            ? 'Se recomienda incluir el equipo en el plan de reposicion a 1-2 anios y mantener seguimiento de indicadores.'
            : 'Se recomienda mantener el equipo en servicio con el plan de mantenimiento vigente.',
        }
      }
    }

    const ts = Date.now()
    const out = `/tmp/reemplazo_${ts}.pdf`
    const tmpJson = `/tmp/reemplazo_${ts}.json`
    const script = path.join(process.cwd(), 'scripts', 'informe_reemplazo.py')
    fs.writeFileSync(tmpJson, JSON.stringify({ out, institucion: 'IPS Demo', evaluaciones, kpis, detalle }))

    try {
      await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024 * 1024 * 30 })
    } catch (e: any) {
      return NextResponse.json({ error: 'Error generando informe: ' + e.message }, { status: 500 })
    }
    if (!fs.existsSync(out)) return NextResponse.json({ error: 'El PDF no se genero' }, { status: 500 })

    const pdf = fs.readFileSync(out)
    try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

    return new NextResponse(pdf, { status: 200, headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evaluacion_reemplazo_${ts}.pdf"`,
    }})
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
