import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function GET(req: NextRequest) {
  try {
    // Llamar al handler de /api/servicios directamente (sin fetch de red)
    const { GET: getServicios } = await import('../route')
    const fakeReq = new Request('http://localhost/api/servicios') as any
    fakeReq.nextUrl = new URL('http://localhost/api/servicios')
    const r = await getServicios(fakeReq)
    if (!r.ok) return NextResponse.json({ error: 'No se pudieron obtener los datos' }, { status: 500 })
    const data = await r.json()

    const ts = Date.now()
    const out = `/tmp/consolidado_${ts}.pdf`
    const tmpJson = `/tmp/consolidado_${ts}.json`
    const script = path.join(process.cwd(), 'scripts', 'consolidado_servicios.py')

    fs.writeFileSync(tmpJson, JSON.stringify({
      out,
      institucion: 'IPS Demo',
      dashboard: data.dashboard || {},
      servicios: data.servicios || [],
    }))

    try {
      await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024 * 1024 * 30 })
    } catch (e: any) {
      return NextResponse.json({ error: 'Error generando consolidado: ' + e.message }, { status: 500 })
    }
    if (!fs.existsSync(out)) return NextResponse.json({ error: 'El PDF no se genero' }, { status: 500 })

    const pdf = fs.readFileSync(out)
    try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consolidado_mantenimiento_${ts}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
