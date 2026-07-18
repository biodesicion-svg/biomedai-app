import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getInstitutionId } from '@/lib/get-institution'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

export async function GET(req: NextRequest) {
  const IID = await getInstitutionId()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id de la orden' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1) Orden con ejecucion
  const { data: m, error } = await supabase
    .from('mantenimientos')
    .select('id, equipo_id, tipo, estado, fecha_realizado, fecha_programada, duracion_minutos, ejecucion_respuestas, resultado, descripcion')
    .eq('id', id).eq('institucion_id', IID).single()
  if (error || !m) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  // 2) Equipo
  let equipo: any = {}
  if (m.equipo_id) {
    const { data: eq } = await supabase.from('equipos')
      .select('nombre, marca, modelo, serie, servicio, clase_invima, riesgo, codigo_inventario')
      .eq('id', m.equipo_id).single()
    equipo = eq || {}
  }

  // 3) Preguntas del protocolo (mismo criterio que el detalle)
  let preguntas: any[] = []
  try {
    const proto = await fetch(`${req.nextUrl.origin}/api/protocolo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo: equipo.nombre || '', tipo: m.tipo || 'preventivo' })
    })
    const pd = await proto.json()
    preguntas = pd.preguntas || []
  } catch (e) { /* sin preguntas, el diagnostico usa lo que haya */ }

  // 4) Consecutivo simple (fecha + id corto)
  const consecutivo = `ACTA-${new Date().getFullYear()}-${String(id).slice(0,8).toUpperCase()}`
  const fecha = (m.fecha_realizado || m.fecha_programada || '').slice(0,10)

  const ts = Date.now()
  const out = `/tmp/acta_${ts}.pdf`
  const tmpJson = `/tmp/acta_${ts}.json`
  const script = path.join(process.cwd(), 'scripts', 'acta_mantenimiento.py')

  const payload = {
    out, institucion: 'IPS Demo', cliente: 'IPS Demo',
    consecutivo, fecha,
    resultado: m.resultado || 'conforme',
    hora_inicio: '', hora_fin: '',
    observaciones: m.descripcion || 'Mantenimiento preventivo programado.',
    equipo: {
      nombre: equipo.nombre || 'N/D', marca: equipo.marca || 'N/D', modelo: equipo.modelo || 'N/D',
      serie: equipo.serie || 'N/D', servicio: equipo.servicio || 'N/D',
      clase_invima: equipo.clase_invima || 'N/D', riesgo: equipo.riesgo || 'N/D',
    },
    ejecucion: { preguntas, respuestas: m.ejecucion_respuestas || {} },
  }
  fs.writeFileSync(tmpJson, JSON.stringify(payload))

  try {
    await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024*1024*20 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Error generando acta: ' + e.message }, { status: 500 })
  }
  if (!fs.existsSync(out)) return NextResponse.json({ error: 'El acta no se genero' }, { status: 500 })

  const pdf = fs.readFileSync(out)
  try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta_mantenimiento_${consecutivo}.pdf"`,
    },
  })
}
