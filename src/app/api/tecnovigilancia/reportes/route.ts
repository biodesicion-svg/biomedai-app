import { getInstitutionId } from '@/lib/get-institution'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SH = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

export async function GET(req: NextRequest) {
  const IID = await getInstitutionId()
  const tipo = req.nextUrl.searchParams.get('tipo') || 'reteim'
  const trimestre = req.nextUrl.searchParams.get('trimestre') || ''
  const eventoId = req.nextUrl.searchParams.get('id') || ''

  const eventos = await fetch(
    `${SURL}/rest/v1/tecnovigilancia_eventos?select=*&institucion_id=eq.${IID}&order=fecha_ocurrencia.desc`,
    { headers: SH }
  ).then(r => r.json())

  const ts = Date.now()
  const script = `/tmp/tv_${ts}.py`
  const outFile = `/tmp/tv_out_${ts}.${tipo === 'foreia' ? 'pdf' : 'xlsx'}`
  const triLabel = trimestre || 'Todos'
  const noSerios = tipo === 'reteim'
    ? eventos.filter((e: any) => e.gravedad === 'no_serio' && (!trimestre || e.trimestre_consolidado === trimestre))
    : []
  const evSerio = tipo === 'foreia'
    ? (eventos.find((e: any) => e.id === eventoId) || eventos.find((e: any) => e.gravedad === 'serio') || eventos[0])
    : null

  const rowsJson = JSON.stringify(noSerios)
  const evJson = JSON.stringify(evSerio || {})

  let py = ''

  if (tipo === 'reteim') {
    py = `
import openpyxl, json, datetime
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

eventos = json.loads(${JSON.stringify(rowsJson)})
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "RETEIM-002"

def st(cell, bold=False, bg=None, fg="000000", sz=9, center=False, wrap=False):
    cell.font = Font(bold=bold, color=fg, size=sz, name="Calibri")
    if bg: cell.fill = PatternFill("solid", fgColor=bg)
    cell.alignment = Alignment(horizontal="center" if center else "left", vertical="center", wrap_text=wrap)
    s = Side(style="thin", color="D1D5DB")
    cell.border = Border(left=s, right=s, top=s, bottom=s)

ws.merge_cells("A1:T1")
t = ws["A1"]
t.value = "REPORTE MASIVO TRIMESTRAL DE EVENTOS E INCIDENTES ADVERSOS NO SERIOS - RETEIM-002"
st(t, bold=True, bg="1B2B5B", fg="FFFFFF", sz=11, center=True)
ws.row_dimensions[1].height = 28

ws.merge_cells("A2:T2")
s2 = ws["A2"]
s2.value = "Institucion: IPS Demo  |  Generado: " + datetime.date.today().strftime("%d/%m/%Y") + "  |  Trimestre: ${triLabel}  |  Total: " + str(len(eventos))
st(s2, bg="EEF2FF", fg="1B2B5B", center=True)
ws.row_dimensions[2].height = 16

ws.append([])
ws.row_dimensions[3].height = 6

headers = ["A1.Institucion","A2.Departamento","A3.Ciudad","A4.Complejidad",
           "B1.Dispositivo","B2.Reg.Sanitario","B3.Marca","B4.Modelo","B5.Serie","B6.Lote",
           "B7.Fabricante","B8.Importador","C1.Fecha Ocurrencia","C2.Tipo Reporte",
           "C3.Descripcion","C4.Consecuencia","D1.Causa Probable","E1.Disp.Disponible",
           "F1.Reportante","F2.Profesion"]

for ci, hdr in enumerate(headers, 1):
    c = ws.cell(row=4, column=ci, value=hdr)
    st(c, bold=True, bg="1B2B5B", fg="FFFFFF", center=True, wrap=True)
    ws.column_dimensions[get_column_letter(ci)].width = 16
ws.row_dimensions[4].height = 36

tipos = {"falla_funcionamiento":"Falla Funcionamiento","evento_adverso":"Evento Adverso","incidente_adverso":"Incidente Adverso"}

for i, ev in enumerate(eventos):
    row = i + 5
    bg = "FFFFFF" if i % 2 == 0 else "F8FAFC"
    vals = ["IPS Demo","Bogota D.C.","Bogota",str(ev.get("nivel_complejidad","alta")).capitalize(),
            ev.get("dispositivo_nombre",""),ev.get("registro_sanitario",""),ev.get("marca",""),
            ev.get("modelo",""),ev.get("serie",""),ev.get("lote",""),ev.get("fabricante",""),
            ev.get("importador",""),ev.get("fecha_ocurrencia",""),
            tipos.get(ev.get("tipo_reporte",""),ev.get("tipo_reporte","")),
            ev.get("descripcion",""),ev.get("consecuencia",""),
            ev.get("causa_probable","Sin identificar"),
            "Si" if ev.get("dispositivo_disponible") else "No",
            ev.get("reportante_nombre",""),ev.get("reportante_profesion","")]
    for ci, val in enumerate(vals, 1):
        c = ws.cell(row=row, column=ci, value=val)
        st(c, bg=bg, wrap=True)
    ws.row_dimensions[row].height = 28

ws.freeze_panes = "A5"
wb.save("${outFile}")
print("OK")
`
  } else {
    py = `
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER
import json, datetime

ev = json.loads(${JSON.stringify(evJson)})
doc = SimpleDocTemplate("${outFile}", pagesize=letter,
    rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

AZ = colors.HexColor("#1B2B5B")
RO = colors.HexColor("#DC2626")
GR = colors.HexColor("#F8FAFC")
BL = colors.HexColor("#0F172A")
WH = colors.white
styles = getSampleStyleSheet()

def ps(name, size=9, color=None, bold=False, align=TA_CENTER):
    return ParagraphStyle(name, parent=styles["Normal"], fontSize=size,
        textColor=color or BL, fontName="Helvetica-Bold" if bold else "Helvetica", alignment=align)

def sec(txt):
    t = Table([[Paragraph(txt, ps("s",9,WH,True))]], colWidths=[18*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),AZ),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8)]))
    return t

def frow(pairs, bg=WH):
    w = 18*cm/len(pairs)
    cells = [[Paragraph("<b><font size=7 color='#64748B'>" + l + "</font></b><br/>" + str(v or "-"), ps("f",8.5)) for l,v in pairs]]
    t = Table(cells, colWidths=[w]*len(pairs))
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),bg),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8),("LINEBELOW",(0,0),(-1,-1),0.5,colors.HexColor("#E2E8F0"))]))
    return t

def flong(label, val, bg=WH):
    t = Table([[Paragraph("<b><font size=7 color='#64748B'>" + label + "</font></b><br/>" + str(val or "-"), ps("fl",8.5))]], colWidths=[18*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),bg),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8),("LINEBELOW",(0,0),(-1,-1),0.5,colors.HexColor("#E2E8F0"))]))
    return t

tmap = {"falla_funcionamiento":"Falla de Funcionamiento","evento_adverso":"Evento Adverso","incidente_adverso":"Incidente Adverso"}
story = []

hdr = Table([[Paragraph("REPORTE INMEDIATO DE EVENTO O INCIDENTE ADVERSO - FOREIA-001", ps("h",13,WH,True))],
             [Paragraph("Programa Nacional de Tecnovigilancia INVIMA | Res. 4816/2008 Art. 15", ps("h2",8,AZ))]], colWidths=[18*cm])
hdr.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),AZ),("BACKGROUND",(0,1),(-1,1),colors.HexColor("#EEF2FF")),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
story += [hdr, Spacer(1,0.3*cm)]

warn = Table([[Paragraph("ADVERTENCIA: Evento SERIO - Reportar al INVIMA dentro de 72 horas via farmacoweb.invima.gov.co", ps("w",8,RO,True))]], colWidths=[18*cm])
warn.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FEF2F2")),("BOX",(0,0),(-1,-1),1,RO),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),("LEFTPADDING",(0,0),(-1,-1),8)]))
story += [warn, Spacer(1,0.3*cm)]

story += [sec("SECCION A. LUGAR DE OCURRENCIA"),
    frow([("A1. Institucion","IPS Demo"),("A2. Departamento","Bogota D.C."),("A3. Ciudad","Bogota"),("A4. Complejidad",str(ev.get("nivel_complejidad","alta")).capitalize())], GR), Spacer(1,0.2*cm)]
story += [sec("SECCION B. DISPOSITIVO MEDICO"),
    frow([("B1. Dispositivo",ev.get("dispositivo_nombre","")),("B2. Reg. Sanitario",ev.get("registro_sanitario",""))]),
    frow([("B3. Marca",ev.get("marca","")),("B4. Modelo",ev.get("modelo","")),("B5. Serie",ev.get("serie","")),("B6. Lote",ev.get("lote",""))], GR),
    frow([("B7. Fabricante",ev.get("fabricante","")),("B8. Importador",ev.get("importador",""))]), Spacer(1,0.2*cm)]
story += [sec("SECCION C. DESCRIPCION"),
    frow([("C1. Fecha ocurrencia",ev.get("fecha_ocurrencia","")),("C2. Fecha conocimiento",ev.get("fecha_conocimiento","")),("C3. Tipo",tmap.get(ev.get("tipo_reporte",""),ev.get("tipo_reporte","")))], GR),
    flong("C4. Descripcion detallada", ev.get("descripcion","")),
    flong("C5. Consecuencias", ev.get("consecuencia",""), GR), Spacer(1,0.2*cm)]
story += [sec("SECCION D. GRAVEDAD"),
    frow([("D1. Clasificacion","SERIO" if ev.get("gravedad")=="serio" else "NO SERIO"),("D2. Causa muerte","Si" if ev.get("causa_muerte") else "No"),("D3. Deterioro grave","Si" if ev.get("deterioro_grave") else "No"),("D4. Intervencion medica","Si" if ev.get("intervencion_medica") else "No")], GR), Spacer(1,0.2*cm)]
story += [sec("SECCION E. CAUSA"),
    flong("E1. Causa probable", ev.get("causa_probable","Sin identificar")),
    frow([("E2. Causa identificada","Si" if ev.get("causa_identificada") else "En investigacion"),("E3. Disp. disponible","Si" if ev.get("dispositivo_disponible") else "No"),("E4. Enviado importador","Si" if ev.get("enviado_importador") else "No")], GR), Spacer(1,0.2*cm)]
story += [sec("SECCION F. REPORTANTE"),
    frow([("F1. Nombre",ev.get("reportante_nombre","")),("F2. Profesion",ev.get("reportante_profesion","")),("F3. Fecha reporte",datetime.date.today().strftime("%d/%m/%Y"))], GR), Spacer(1,0.3*cm)]

pie = Table([[Paragraph("Informacion epidemiologica confidencial. Ley 9/1979 | tecnovigilancia@invima.gov.co | Carrera 10 #64-28 Bogota D.C.", ps("p",7,colors.HexColor("#64748B")))]], colWidths=[18*cm])
pie.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),GR),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
story.append(pie)
doc.build(story)
print("OK")
`
  }

  fs.writeFileSync(script, py)
  try {
    await execAsync(`pip install openpyxl reportlab --break-system-packages -q && python3 ${script}`)
    const buffer = fs.readFileSync(outFile)
    fs.unlinkSync(script)
    fs.unlinkSync(outFile)
    const isExcel = tipo === 'reteim'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': isExcel
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
        'Content-Disposition': `attachment; filename="${isExcel ? `RETEIM-002_${triLabel}.xlsx` : `FOREIA_${eventoId || 'serio'}.pdf`}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
