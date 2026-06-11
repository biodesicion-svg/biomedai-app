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

function tipoServicioLabel(tipo: string, equipo: string): string {
  const eq = equipo.toUpperCase()
  const map: Record<string, string> = {
    'M.PREVENTIVO Y CALIBRACION': `MANTENIMIENTO PREVENTIVO Y CALIBRACION DE ${eq}`,
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': `MANTENIMIENTO CORRECTIVO Y CALIBRACION DE ${eq}`,
    'DIAGNOSTICO Y M.PREVENTIVO': `DIAGNOSTICO Y MANTENIMIENTO PREVENTIVO DE ${eq}`,
    'M.PREVENTIVO': `MANTENIMIENTO PREVENTIVO DE ${eq}`,
    'DIAGNOSTICO': `DIAGNOSTICO DE ${eq}`,
  }
  return map[tipo] || `${tipo} DE ${eq}`
}

function trabajoRealizado(tipo: string): string {
  const map: Record<string, string> = {
    'M.PREVENTIVO Y CALIBRACION': 'Se realiza inspeccion visual del equipo, verificacion del estado fisico general, revision de conectores, cables y accesorios, comprobacion de funcionamiento basico y medicion de parametros iniciales para determinar el estado del equipo previo a la intervencion.',
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': 'Se realiza inspeccion visual y diagnostico del equipo, identificacion de la falla reportada, verificacion del estado de componentes electronicos y mecanicos, y comprobacion del comportamiento del equipo bajo condiciones de falla.',
    'DIAGNOSTICO Y M.PREVENTIVO': 'Se realiza inspeccion visual completa del equipo, verificacion del estado fisico y electronico, revision de conectores y accesorios, medicion de parametros iniciales y evaluacion del estado general para determinar el alcance de la intervencion.',
    'M.PREVENTIVO': 'Se realiza inspeccion visual del equipo, verificacion del estado fisico general, revision de conectores, cables y accesorios, y comprobacion de funcionamiento basico previo al mantenimiento.',
    'DIAGNOSTICO': 'Se realiza inspeccion visual detallada del equipo, verificacion del estado fisico y electronico de componentes, medicion de parametros de funcionamiento y evaluacion del estado general para emitir concepto tecnico.',
  }
  return map[tipo] || 'Se realiza inspeccion visual, verificacion y revision de funcionamiento del equipo.'
}

function accionesSGC(tipo: string): string {
  const map: Record<string, string> = {
    'M.PREVENTIVO Y CALIBRACION': 'Se realizo revision fisica completa del equipo: limpieza interna y externa con productos adecuados, verificacion de conectores, cables y accesorios. Se realizo ajuste de componentes mecanicos y electronicos, verificacion de parametros de funcionamiento segun especificaciones del fabricante, pruebas funcionales completas y calibracion de los parametros criticos del equipo. Se actualizo la hoja de vida del equipo con los resultados obtenidos.',
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION': 'Se realizo diagnostico del equipo identificando la falla reportada. Se procedio con la intervencion correctiva mediante la reparacion o reemplazo de componentes defectuosos. Se verifico el correcto funcionamiento del equipo post-intervencion, se realizaron pruebas funcionales y calibracion de parametros criticos. Se documento la intervencion en la hoja de vida del equipo.',
    'DIAGNOSTICO Y M.PREVENTIVO': 'Se realizo inspeccion visual y electronica del equipo para identificar su estado actual. Se ejecuto mantenimiento preventivo con limpieza, ajuste de componentes y verificacion de parametros de funcionamiento. Los hallazgos encontrados fueron documentados con las recomendaciones pertinentes para garantizar la continuidad operativa del equipo.',
    'M.PREVENTIVO': 'Se realizo mantenimiento preventivo programado del equipo incluyendo: limpieza interna y externa, verificacion de conectores y cables, ajuste de componentes mecanicos, verificacion de parametros de funcionamiento y pruebas funcionales. El equipo queda en condiciones operativas optimas.',
    'DIAGNOSTICO': 'Se realizo inspeccion tecnica completa del equipo mediante revision fisica y electronica, verificacion de componentes internos, medicion de parametros electricos y funcionales. Se identificaron las condiciones actuales del equipo y se emiten las recomendaciones correspondientes.',
  }
  return map[tipo] || 'Se realizo intervencion tecnica sobre el equipo segun requerimiento del servicio.'
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''

  const servicios = await fetch(
    `${SURL}/rest/v1/servicios_tecnicos?id=eq.${id}&select=*`,
    { headers: h }
  ).then(r => r.json())

  if (!servicios.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const s = servicios[0]
  const ts = Date.now()
  const template = path.join(process.cwd(), 'public', 'emmc_template.xlsx')
  const outFile = `/tmp/emmc_reporte_${ts}.xlsx`

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
    tipo_label: tipoServicioLabel(s.tipo_servicio || '', s.equipo || ''),
    trabajo: trabajoRealizado(s.tipo_servicio || ''),
    acciones: accionesSGC(s.tipo_servicio || ''),
    repuestos: s.repuestos_utilizados || 'No se utilizaron repuestos',
    observaciones: s.observaciones || 'Sin observaciones adicionales',
    parametros: s.parametros_verificados || '',
    conclusiones: s.conclusiones || '',
  }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  const py = `
import openpyxl, json, shutil
shutil.copy('${template}', '${outFile}')
wb = openpyxl.load_workbook('${outFile}')
ws = wb['David Medina']
d = json.loads('${dataJson}')

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

wb.save('${outFile}')
print('OK')
`

  const script = `/tmp/emmc_script_${ts}.py`
  fs.writeFileSync(script, py)

  try {
    await execAsync(`pip install openpyxl --break-system-packages -q && python3 ${script}`)
    const buffer = fs.readFileSync(outFile)
    fs.unlinkSync(script)
    fs.unlinkSync(outFile)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="EMMC_${s.numero_reporte}.xlsx"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
