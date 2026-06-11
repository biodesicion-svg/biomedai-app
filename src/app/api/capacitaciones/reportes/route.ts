import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import { getInstitutionId } from '@/lib/get-institution'

const execAsync = promisify(exec)
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

export async function GET(req: NextRequest) {
  const registroId = req.nextUrl.searchParams.get('registro_id')
  if (!registroId) return NextResponse.json({ error: 'registro_id requerido' }, { status: 400 })

  const [registros, asistentesRaw, personal, temas] = await Promise.all([
    fetch(`${SURL}/rest/v1/capacitaciones_registros?id=eq.${registroId}&select=*`, { headers: h }).then(r => r.json()),
    fetch(`${SURL}/rest/v1/capacitaciones_asistentes?registro_id=eq.${registroId}&select=*`, { headers: h }).then(r => r.json()),
    fetch(`${SURL}/rest/v1/capacitaciones_personal?select=*`, { headers: h }).then(r => r.json()),
    fetch(`${SURL}/rest/v1/capacitaciones_temas?select=*`, { headers: h }).then(r => r.json()),
  ])

  const registro = registros[0]
  if (!registro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const tema = temas.find((t: any) => t.id === registro.tema_id)
  const asistentes = asistentesRaw.map((a: any) => ({
    ...a,
    persona: personal.find((p: any) => p.id === a.personal_id)
  }))

  const ts = Date.now()
  const script = `/tmp/cap_pdf_${ts}.py`
  const outFile = `/tmp/cap_acta_${ts}.pdf`

  const dataJson = JSON.stringify({ registro, tema, asistentes }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  const py = `
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import json, datetime

data = json.loads('${dataJson}')
reg = data['registro']
tema = data['tema'] or {}
asis = data['asistentes']

doc = SimpleDocTemplate("${outFile}", pagesize=letter,
    rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

AZ = colors.HexColor("#1B2B5B")
VE = colors.HexColor("#16A34A")
RO = colors.HexColor("#DC2626")
GR = colors.HexColor("#F8FAFC")
BL = colors.HexColor("#0F172A")
WH = colors.white
styles = getSampleStyleSheet()

def ps(name, size=9, color=None, bold=False, align=TA_LEFT):
    return ParagraphStyle(name, parent=styles["Normal"], fontSize=size,
        textColor=color or BL, fontName="Helvetica-Bold" if bold else "Helvetica", alignment=align)

story = []

# Header
hdr = Table([[Paragraph("ACTA DE CAPACITACIÓN EN EQUIPOS BIOMÉDICOS", ps("h",13,WH,True,TA_CENTER))],
             [Paragraph("SYNAP · Sistema de Gestión Biomédica · Res. 2003/2014", ps("s",8,AZ,False,TA_CENTER))]], colWidths=[17*cm])
hdr.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),AZ),("BACKGROUND",(0,1),(-1,1),colors.HexColor("#EEF2FF")),
    ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
story += [hdr, Spacer(1,0.4*cm)]

# Info capacitación
info_data = [
    [Paragraph("<b>Tema:</b>", ps("l",9)), Paragraph(tema.get('nombre',''), ps("v",9)),
     Paragraph("<b>Fecha:</b>", ps("l",9)), Paragraph(reg.get('fecha',''), ps("v",9))],
    [Paragraph("<b>Capacitador:</b>", ps("l",9)), Paragraph(reg.get('capacitador',''), ps("v",9)),
     Paragraph("<b>Lugar:</b>", ps("l",9)), Paragraph(reg.get('lugar',''), ps("v",9))],
    [Paragraph("<b>Duración:</b>", ps("l",9)), Paragraph(str(reg.get('duracion_horas','')) + ' horas', ps("v",9)),
     Paragraph("<b>Equipo:</b>", ps("l",9)), Paragraph(tema.get('tipo_equipo',''), ps("v",9))],
]
info = Table(info_data, colWidths=[3.5*cm,5*cm,3*cm,5.5*cm])
info.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),GR),("TOPPADDING",(0,0),(-1,-1),5),
    ("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),6),
    ("LINEBELOW",(0,0),(-1,-1),0.5,colors.HexColor("#E2E8F0"))]))
story += [info, Spacer(1,0.4*cm)]

# Tabla asistentes
story.append(Paragraph("LISTA DE ASISTENTES", ps("sec",10,AZ,True)))
story.append(Spacer(1,0.2*cm))

headers = ["#","Nombre","Cargo","Servicio","Nota","Aprobado","Firma"]
col_w = [0.8*cm,4.5*cm,3*cm,3*cm,1.5*cm,1.8*cm,2.4*cm]
rows = [headers]
for i, a in enumerate(asis):
    p = a.get('persona') or {}
    nota = str(int(a.get('nota') or 0)) + "%" if a.get('nota') else "—"
    aprobado = "SÍ" if a.get('aprobado') else "NO"
    rows.append([
        str(i+1),
        p.get('nombre','—'),
        p.get('cargo','—'),
        p.get('servicio','—'),
        nota,
        aprobado,
        "Firmado" if a.get('firma_svg') else "Pendiente"
    ])

tbl = Table(rows, colWidths=col_w)
tbl.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),AZ),
    ("TEXTCOLOR",(0,0),(-1,0),WH),
    ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
    ("FONTSIZE",(0,0),(-1,-1),8),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[WH,GR]),
    ("ALIGN",(0,0),(-1,-1),"CENTER"),
    ("ALIGN",(1,1),(3,-1),"LEFT"),
    ("TOPPADDING",(0,0),(-1,-1),5),
    ("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#E2E8F0")),
    ("TEXTCOLOR",(5,1),(5,-1),VE),
]))
story += [tbl, Spacer(1,0.5*cm)]

# Firma capacitador
firma_tbl = Table([
    [Paragraph("_" * 40, ps("f",9,BL,False,TA_CENTER)), "", Paragraph("_" * 40, ps("f",9,BL,False,TA_CENTER))],
    [Paragraph("Firma del Capacitador", ps("fl",8,colors.HexColor("#64748B"),False,TA_CENTER)), "",
     Paragraph("Sello Institucional", ps("fl",8,colors.HexColor("#64748B"),False,TA_CENTER))],
], colWidths=[7*cm,3*cm,7*cm])
story += [firma_tbl, Spacer(1,0.3*cm)]

pie = Table([[Paragraph(
    f"Documento generado por SYNAP · {datetime.date.today().strftime('%d/%m/%Y')} · Este documento es de carácter confidencial y de uso institucional.",
    ps("p",7,colors.HexColor("#64748B"),False,TA_CENTER)
)]], colWidths=[17*cm])
pie.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),GR),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
story.append(pie)

doc.build(story)
print("OK")
`

  fs.writeFileSync(script, py)
  try {
    await execAsync(`pip install reportlab --break-system-packages -q && python3 ${script}`)
    const buffer = fs.readFileSync(outFile)
    fs.unlinkSync(script)
    fs.unlinkSync(outFile)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="acta_capacitacion_${registroId}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
