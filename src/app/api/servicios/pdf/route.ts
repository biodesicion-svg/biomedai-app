import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getInstitutionId } from '@/lib/get-institution'

const execAsync = promisify(exec)
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

function tipoLabel(tipo: string, equipo: string): string {
  const eq = equipo.toUpperCase()
  const map: Record<string,string> = {
    'M.PREVENTIVO Y CALIBRACION': `MANTENIMIENTO PREVENTIVO Y CALIBRACION DE ${eq}`,
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': `MANTENIMIENTO CORRECTIVO Y CALIBRACION DE ${eq}`,
    'DIAGNOSTICO Y M.PREVENTIVO': `DIAGNOSTICO Y MANTENIMIENTO PREVENTIVO DE ${eq}`,
    'M.PREVENTIVO': `MANTENIMIENTO PREVENTIVO DE ${eq}`,
    'DIAGNOSTICO': `DIAGNOSTICO DE ${eq}`,
  }
  return map[tipo] || `${tipo} DE ${eq}`
}

function trabajoRealizado(tipo: string): string {
  const map: Record<string,string> = {
    'M.PREVENTIVO Y CALIBRACION': 'Se realiza inspeccion visual del equipo, verificacion del estado fisico general, revision de conectores, cables y accesorios, comprobacion de funcionamiento basico y medicion de parametros iniciales para determinar el estado del equipo previo a la intervencion.',
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': 'Se realiza inspeccion visual y diagnostico del equipo, identificacion de la falla reportada, verificacion del estado de componentes electronicos y mecanicos, y comprobacion del comportamiento del equipo bajo condiciones de falla.',
    'DIAGNOSTICO Y M.PREVENTIVO': 'Se realiza inspeccion visual completa del equipo, verificacion del estado fisico y electronico, revision de conectores y accesorios, medicion de parametros iniciales y evaluacion del estado general para determinar el alcance de la intervencion.',
    'M.PREVENTIVO': 'Se realiza inspeccion visual del equipo, verificacion del estado fisico general, revision de conectores, cables y accesorios, y comprobacion de funcionamiento basico previo al mantenimiento.',
    'DIAGNOSTICO': 'Se realiza inspeccion visual detallada del equipo, verificacion del estado fisico y electronico de componentes, medicion de parametros de funcionamiento y evaluacion del estado general para emitir concepto tecnico.',
  }
  return map[tipo] || 'Se realiza inspeccion visual, verificacion y revision de funcionamiento del equipo.'
}

function accionesSGC(tipo: string): string {
  const map: Record<string,string> = {
    'M.PREVENTIVO Y CALIBRACION': 'Se realizo revision fisica completa del equipo: limpieza interna y externa con productos adecuados, verificacion de conectores, cables y accesorios. Se realizo ajuste de componentes mecanicos y electronicos, verificacion de parametros de funcionamiento segun especificaciones del fabricante, pruebas funcionales completas y calibracion de los parametros criticos del equipo.',
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': 'Se realizo diagnostico del equipo identificando la falla reportada. Se procedio con la intervencion correctiva mediante la reparacion o reemplazo de componentes defectuosos. Se verifico el correcto funcionamiento del equipo post-intervencion, se realizaron pruebas funcionales y calibracion de parametros criticos.',
    'DIAGNOSTICO Y M.PREVENTIVO': 'Se realizo inspeccion visual y electronica del equipo para identificar su estado actual. Se ejecuto mantenimiento preventivo con limpieza, ajuste de componentes y verificacion de parametros de funcionamiento. Los hallazgos encontrados fueron documentados con las recomendaciones pertinentes.',
    'M.PREVENTIVO': 'Se realizo mantenimiento preventivo programado del equipo incluyendo: limpieza interna y externa, verificacion de conectores y cables, ajuste de componentes mecanicos, verificacion de parametros de funcionamiento y pruebas funcionales.',
    'DIAGNOSTICO': 'Se realizo inspeccion tecnica completa del equipo mediante revision fisica y electronica, verificacion de componentes internos, medicion de parametros electricos y funcionales. Se identificaron las condiciones actuales del equipo y se emiten las recomendaciones correspondientes.',
  }
  return map[tipo] || 'Se realizo intervencion tecnica sobre el equipo segun requerimiento del servicio.'
}

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get('tipo') || 'reporte'
  const id = req.nextUrl.searchParams.get('id') || ''
  const IID = await getInstitutionId()

  let servicios: any[] = []
  if (id) {
    servicios = await fetch(`${SURL}/rest/v1/servicios_tecnicos?id=eq.${id}&select=*`, { headers: h }).then(r => r.json())
  } else {
    servicios = await fetch(`${SURL}/rest/v1/servicios_tecnicos?select=*&institucion_id=eq.${IID}&order=fecha_servicio.desc`, { headers: h }).then(r => r.json())
  }

  if (!servicios.length) return NextResponse.json({ error: 'Sin datos' }, { status: 404 })

  const ts = Date.now()
  const script = `/tmp/svc_${ts}.py`
  const out = `/tmp/svc_${ts}.pdf`
  const s = servicios[0]
  const pub = path.join(process.cwd(), 'public')
  const template = `${pub}/emmc_template.xlsx`
  const logo0 = `${pub}/emmc_logo_0.png`
  const logo1 = `${pub}/emmc_logo_1.png`

  const dataJson = JSON.stringify({
    numero_reporte: s.numero_reporte || '',
    fecha_servicio: s.fecha_servicio || '',
    equipo: s.equipo || '',
    cliente: s.cliente || '',
    marca: s.marca || '',
    sede: s.sede || '',
    modelo: s.modelo || '',
    ubicacion: s.ubicacion || '',
    serie_placa: s.serie_placa || '',
    tipo_label: tipoLabel(s.tipo_servicio || '', s.equipo || ''),
    trabajo: trabajoRealizado(s.tipo_servicio || ''),
    acciones: accionesSGC(s.tipo_servicio || ''),
    repuestos: s.repuestos_utilizados || 'No se utilizaron repuestos',
    observaciones: s.observaciones || 'Sin observaciones adicionales',
    parametros: s.parametros_verificados || '',
    conclusiones: s.conclusiones || '',
  }).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '')

  const py = `
import json, os, shutil, base64
import openpyxl
from xlsx2html import xlsx2html
from weasyprint import HTML

d = json.loads('${dataJson}')

# Llenar Excel
shutil.copy('${template}', '/tmp/emmc_work_${ts}.xlsx')
wb = openpyxl.load_workbook('/tmp/emmc_work_${ts}.xlsx')
ws = wb['David Medina']
ws._images = []
wb_imgs = []

ws['O1'] = d['numero_reporte']
ws['J2'] = d['fecha_servicio']
ws['C6'] = d['equipo']
ws['K6'] = d['cliente']
ws['C7'] = d['marca']
ws['K7'] = d['sede']
ws['C8'] = d['modelo']
ws['K8'] = d['ubicacion']
ws['C9'] = d['serie_placa']
ws['A12'] = d['tipo_label']
ws['A15'] = d['trabajo']
ws['A19'] = d['acciones']
ws['A24'] = d['repuestos']
ws['A28'] = d['observaciones']
ws['A34'] = d['parametros']
ws['A40'] = d['conclusiones']
wb.save('/tmp/emmc_work_${ts}.xlsx')

# Convertir a HTML
xlsx2html('/tmp/emmc_work_${ts}.xlsx', '/tmp/emmc_work_${ts}.html', sheet='David Medina')

# Inyectar logo y firma como base64
html = open('/tmp/emmc_work_${ts}.html').read()

logo_b64 = ''
firma_b64 = ''
if os.path.exists('${logo0}'):
    with open('${logo0}', 'rb') as f:
        logo_b64 = base64.b64encode(f.read()).decode()
if os.path.exists('${logo1}'):
    with open('${logo1}', 'rb') as f:
        firma_b64 = base64.b64encode(f.read()).decode()

# Insertar estilos y logo en el header
logo_style = """
<style>
  body { font-family: Arial, sans-serif; font-size: 8pt; }
  @page { size: letter; margin: 1cm; }
  table { border-collapse: collapse; }
</style>
"""

logo_html = ""
if logo_b64:
    logo_html = f"""
<div style="position:fixed;top:8px;left:8px;z-index:999;">
  <img src="data:image/png;base64,{logo_b64}" style="height:55px;" />
</div>
"""

firma_html = ""
if firma_b64:
    firma_html = f"""
<div style="position:fixed;bottom:45px;left:15px;z-index:999;">
  <img src="data:image/png;base64,{firma_b64}" style="height:35px;" />
</div>
"""

html = html.replace('<head>', '<head>' + logo_style)
html = html.replace('<body>', '<body>' + logo_html + firma_html)

open('/tmp/emmc_work_${ts}.html', 'w').write(html)

# Generar PDF
HTML(filename='/tmp/emmc_work_${ts}.html').write_pdf('${out}')

# Limpiar
os.remove('/tmp/emmc_work_${ts}.xlsx')
os.remove('/tmp/emmc_work_${ts}.html')
print('OK')
`

  fs.writeFileSync(script, py)
  try {
    await execAsync(`pip install xlsx2html weasyprint openpyxl --break-system-packages -q && python3 ${script}`)
    const buffer = fs.readFileSync(out)
    fs.unlinkSync(script)
    fs.unlinkSync(out)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="EMMC_${s.numero_reporte}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
