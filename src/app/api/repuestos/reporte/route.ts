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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Repuestos
    const { data: reps, error } = await supabase
      .from('repuestos')
      .select('id, nombre, referencia, marca, unidad, stock_actual, stock_minimo, costo_unitario')
      .eq('institucion_id', IID).eq('activo', true).order('nombre')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const repMap: Record<string, any> = {}
    ;(reps || []).forEach(r => { repMap[r.id] = r })

    // Movimientos de salida (asignaciones a equipos)
    const { data: movs } = await supabase
      .from('repuesto_movimientos')
      .select('repuesto_id, equipo_id, tipo, cantidad, motivo, orden_trabajo, created_at')
      .eq('institucion_id', IID)
      .in('tipo', ['salida', 'asignacion'])
      .order('created_at', { ascending: false })
      .limit(2000)

    // Equipos
    const eqIds = [...new Set((movs || []).map(m => m.equipo_id).filter(Boolean))]
    const eqMap: Record<string, string> = {}
    if (eqIds.length) {
      const { data: eqs } = await supabase.from('equipos')
        .select('id, nombre, codigo_inventario').in('id', eqIds)
      eqs?.forEach(e => { eqMap[e.id] = `${e.nombre} (${e.codigo_inventario || 's/c'})` })
    }

    const asignaciones = (movs || []).map(m => ({
      fecha: m.created_at || '',
      repuesto: repMap[m.repuesto_id]?.nombre || 'N/D',
      cantidad: m.cantidad,
      equipo: m.equipo_id ? (eqMap[m.equipo_id] || 'Equipo no encontrado') : 'Sin equipo',
      orden_trabajo: m.orden_trabajo || '-',
      motivo: m.motivo || '-',
    }))

    // KPIs
    let valorInventario = 0, criticos = 0
    ;(reps || []).forEach(r => {
      const st = r.stock_actual || 0
      valorInventario += st * (r.costo_unitario || 0)
      if (st === 0 || st <= (r.stock_minimo || 0)) criticos++
    })
    let consumoUnid = 0, consumoValor = 0
    ;(movs || []).forEach(m => {
      consumoUnid += m.cantidad
      consumoValor += m.cantidad * (repMap[m.repuesto_id]?.costo_unitario || 0)
    })

    const ts = Date.now()
    const out = `/tmp/repuestos_${ts}.pdf`
    const tmpJson = `/tmp/repuestos_${ts}.json`
    const script = path.join(process.cwd(), 'scripts', 'reporte_repuestos.py')

    fs.writeFileSync(tmpJson, JSON.stringify({
      out, institucion: 'IPS Demo',
      repuestos: reps || [],
      asignaciones,
      kpis: {
        total: (reps || []).length,
        valor_inventario: Math.round(valorInventario),
        criticos,
        consumo_total_unid: consumoUnid,
        consumo_total_valor: Math.round(consumoValor),
        movimientos: (movs || []).length,
      },
    }))

    try {
      await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024 * 1024 * 30 })
    } catch (e: any) {
      return NextResponse.json({ error: 'Error generando reporte: ' + e.message }, { status: 500 })
    }
    if (!fs.existsSync(out)) return NextResponse.json({ error: 'El PDF no se genero' }, { status: 500 })

    const pdf = fs.readFileSync(out)
    try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_repuestos_${ts}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
