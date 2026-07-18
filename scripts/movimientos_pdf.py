#!/usr/bin/env python3
"""Genera un PDF con el reporte de movimientos de equipos. Recibe JSON por stdin."""
import sys, json
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

AZ = colors.HexColor('#1B2B5B')
GR = colors.HexColor('#64748B')
LINE = colors.HexColor('#E2E8F0')
HEADBG = colors.HexColor('#1B2B5B')
ZEBRA = colors.HexColor('#F8FAFC')

TIPO_LABEL = {
    'traslado':'Traslado','instalacion':'Instalacion','cambio_ubicacion':'Cambio ubicacion',
    'cambio_servicio':'Cambio servicio','cambio_sede':'Cambio sede','prestamo':'Prestamo',
    'devolucion':'Devolucion','cambio_propietario':'Cambio propietario',
    'baja_temporal':'Baja temporal','baja_definitiva':'Baja definitiva',
}

def fmt_fecha(s):
    if not s: return '-'
    try:
        return datetime.fromisoformat(s.replace('Z','+00:00')).strftime('%d/%m/%Y')
    except Exception:
        return s[:10]

def main():
    data = json.load(sys.stdin)
    movs = data.get('movimientos', [])
    institucion = data.get('institucion', 'IPS Demo')
    out = data.get('out', '/tmp/movimientos.pdf')

    styles = getSampleStyleSheet()
    st_cell = ParagraphStyle('cell', parent=styles['Normal'], fontSize=7, leading=9, textColor=colors.HexColor('#0F172A'))
    st_head = ParagraphStyle('head', parent=styles['Normal'], fontSize=7.5, leading=9, textColor=colors.white, alignment=TA_LEFT)
    st_title = ParagraphStyle('title', parent=styles['Normal'], fontSize=16, leading=20, textColor=AZ)
    st_sub = ParagraphStyle('sub', parent=styles['Normal'], fontSize=9, leading=12, textColor=GR)

    doc = SimpleDocTemplate(out, pagesize=landscape(letter),
                            topMargin=1.2*cm, bottomMargin=1.2*cm,
                            leftMargin=1*cm, rightMargin=1*cm)
    elems = []

    # Encabezado
    elems.append(Paragraph('SYNAP', st_title))
    elems.append(Paragraph('Reporte de Movimientos de Equipos Biomedicos', st_sub))
    hoy = datetime.now().strftime('%d/%m/%Y %H:%M')
    elems.append(Paragraph(f'Institucion: {institucion} &nbsp;&nbsp;|&nbsp;&nbsp; Generado: {hoy} &nbsp;&nbsp;|&nbsp;&nbsp; Total: {len(movs)} movimientos', st_sub))
    elems.append(Spacer(1, 0.4*cm))

    # Tabla
    headers = ['Fecha','Equipo','Codigo','Tipo','Origen','Destino','Motivo','Responsable','Estado']
    rows = [[Paragraph(h, st_head) for h in headers]]
    for m in movs:
        origen = f"{m.get('servicio_origen') or '-'}"
        destino = f"{m.get('servicio_destino') or '-'}"
        rows.append([
            Paragraph(fmt_fecha(m.get('fecha_movimiento','')), st_cell),
            Paragraph(str(m.get('equipo_nombre') or '-'), st_cell),
            Paragraph(str(m.get('equipo_codigo') or '-'), st_cell),
            Paragraph(TIPO_LABEL.get(m.get('tipo',''), m.get('tipo','-')), st_cell),
            Paragraph(origen, st_cell),
            Paragraph(destino, st_cell),
            Paragraph(str(m.get('motivo') or '-'), st_cell),
            Paragraph(str(m.get('responsable_nombre') or '-'), st_cell),
            Paragraph(str(m.get('estado') or '-'), st_cell),
        ])

    col_w = [2*cm, 4*cm, 2*cm, 2.6*cm, 3.2*cm, 3.2*cm, 4*cm, 3*cm, 2*cm]
    t = Table(rows, colWidths=col_w, repeatRows=1)
    style = [
        ('BACKGROUND',(0,0),(-1,0),HEADBG),
        ('TOPPADDING',(0,0),(-1,-1),4),
        ('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),5),
        ('RIGHTPADDING',(0,0),(-1,-1),5),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LINEBELOW',(0,0),(-1,-1),0.4,LINE),
        ('GRID',(0,0),(-1,-1),0.25,LINE),
    ]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style.append(('BACKGROUND',(0,i),(-1,i),ZEBRA))
    t.setStyle(TableStyle(style))
    elems.append(t)

    # Resumen por tipo
    elems.append(Spacer(1, 0.5*cm))
    conteo = {}
    for m in movs:
        k = TIPO_LABEL.get(m.get('tipo',''), m.get('tipo','-'))
        conteo[k] = conteo.get(k,0)+1
    resumen = ' &nbsp;·&nbsp; '.join(f'{k}: {v}' for k,v in sorted(conteo.items()))
    elems.append(Paragraph(f'<b>Resumen por tipo:</b> {resumen}', st_sub))

    doc.build(elems)
    print(out)

if __name__ == '__main__':
    main()
