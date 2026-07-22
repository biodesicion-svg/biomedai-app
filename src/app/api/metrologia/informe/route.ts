import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function GET(req: NextRequest) {
  try {
    const tipo = req.nextUrl.searchParams.get('tipo') || 'general'

    // Reutilizar el handler de /api/metrologia sin fetch de red
    const { GET: getMetrologia } = await import('../route')
    const r = await getMetrologia()
    if (!r.ok) return NextResponse.json({ error: 'No se pudieron obtener los datos' }, { status: 500 })
    const data = await r.json()

    const ts = Date.now()
    const out = `/tmp/metrologia_${ts}.pdf`
    const tmpJson = `/tmp/metrologia_${ts}.json`
    const script = path.join(process.cwd(), 'scripts', 'informe_metrologia.py')

    fs.writeFileSync(tmpJson, JSON.stringify({
      out, tipo, institucion: 'IPS Demo',
      kpis: data.kpis || {},
      graficos: data.graficos || {},
      cronograma: data.cronograma || [],
    }))

    try {
      await execAsync(`python3 "${script}" < "${tmpJson}"`, { maxBuffer: 1024 * 1024 * 30 })
    } catch (e: any) {
      return NextResponse.json({ error: 'Error generando informe: ' + e.message }, { status: 500 })
    }
    if (!fs.existsSync(out)) return NextResponse.json({ error: 'El PDF no se genero' }, { status: 500 })

    const pdf = fs.readFileSync(out)
    try { fs.unlinkSync(out); fs.unlinkSync(tmpJson) } catch {}

    const nombre = tipo === 'cronograma' ? 'cronograma_calibracion' : 'informe_pame'
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}_${ts}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
