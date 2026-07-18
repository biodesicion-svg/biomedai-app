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
  const tipo = req.nextUrl.searchParams.get('tipo') || ''

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let q = supabase
    .from('movimientos')
    .select('equipo_nombre, equipo_codigo, servicio_origen, ubicacion_origen, servicio_destino, ubicacion_destino, tipo, motivo, responsable_nombre, estado, fecha_movimiento')
    .eq('institucion_id', IID)
    .order('fecha_movimiento', { ascending: false })
    .limit(2000)

  if (tipo && tipo !== 'todos') q = q.eq('tipo', tipo)

  const { data: movimientos, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!movimientos || movimientos.length === 0) {
    return NextResponse.json({ error: 'Sin movimientos para reportar' }, { status: 404 })
  }

  const ts = Date.now()
  const out = `/tmp/mov_${ts}.pdf`
  const script = path.join(process.cwd(), 'scripts', 'movimientos_pdf.py')

  const payload = JSON.stringify({
    institucion: 'IPS Demo',
    out,
    movimientos,
  })

  // Pasar el JSON por stdin al script python
  const tmpJson = `/tmp/mov_${ts}.json`
  fs.writeFileSync(tmpJson, payload)

  try {
    await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024 * 1024 * 20 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Error generando PDF: ' + e.message }, { status: 500 })
  }

  if (!fs.existsSync(out)) {
    return NextResponse.json({ error: 'El PDF no se genero' }, { status: 500 })
  }

  const pdf = fs.readFileSync(out)
  // limpieza
  try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_movimientos_${ts}.pdf"`,
    },
  })
}
