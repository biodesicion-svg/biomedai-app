#!/usr/bin/env python3
"""Reporte general de repuestos: inventario valorizado + asignaciones."""
import sys, json
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

AZ=colors.HexColor("#1B2B5B"); VE=colors.HexColor("#16A34A"); RO=colors.HexColor("#DC2626")
NA=colors.HexColor("#D97706"); GR=colors.HexColor("#64748B"); BORD=colors.HexColor("#CBD5E1")
ZEB=colors.HexColor("#F8FAFC")

def P(t,s=7.5,b=False,al=TA_LEFT,c=colors.black):
    return Paragraph(str(t),ParagraphStyle("p",fontName="Helvetica-Bold" if b else "Helvetica",
                     fontSize=s,leading=s+2.5,alignment=al,textColor=c))

def seccion(t,w=25*cm):
    tb=Table([[P(t,10,True,TA_LEFT,colors.white)]],colWidths=[w])
    tb.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),AZ),("TOPPADDING",(0,0),(-1,-1),5),
                            ("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),10)]))
    return tb

def tabla(headers,rows,widths,aligns=None):
    data=[[P(h,7.5,True,TA_LEFT,colors.white) for h in headers]]
    for r in rows:
        fila=[]
        for i,x in enumerate(r):
            al = aligns[i] if aligns and i < len(aligns) else TA_LEFT
            fila.append(P(x,7.5,False,al))
        data.append(fila)
    t=Table(data,colWidths=widths,repeatRows=1)
    st=[("BACKGROUND",(0,0),(-1,0),AZ),("GRID",(0,0),(-1,-1),0.3,BORD),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),6),("VALIGN",(0,0),(-1,-1),"TOP")]
    for i in range(1,len(data)):
        if i%2==0: st.append(("BACKGROUND",(0,i),(-1,i),ZEB))
    t.setStyle(TableStyle(st)); return t

def money(n):
    try: return "$" + format(int(n), ",d").replace(",", ".")
    except Exception: return "$0"

def main():
    d=json.load(sys.stdin)
    out=d.get("out","/tmp/repuestos.pdf")
    inst=d.get("institucion","IPS Demo")
    reps=d.get("repuestos",[]); asig=d.get("asignaciones",[]); k=d.get("kpis",{})
    hoy=datetime.now().strftime("%d/%m/%Y %H:%M")

    doc=SimpleDocTemplate(out,pagesize=landscape(letter),topMargin=1.2*cm,bottomMargin=1.2*cm,
                          leftMargin=1.2*cm,rightMargin=1.2*cm)
    e=[]
    e.append(P("SYNAP",18,True,TA_LEFT,AZ))
    e.append(P("Reporte General de Repuestos",11,True))
    e.append(P("Institucion: "+inst+"   |   Generado: "+hoy,8,False,TA_LEFT,GR))
    e.append(Spacer(1,5*mm))

    # Resumen
    e.append(seccion("1. RESUMEN"))
    e.append(Spacer(1,3*mm))
    res=[["Total de repuestos",str(k.get("total",0))],
         ["Valor total del inventario",money(k.get("valor_inventario",0))],
         ["Repuestos criticos",str(k.get("criticos",0))],
         ["Unidades consumidas (historico)",str(k.get("consumo_total_unid",0))],
         ["Valor consumido (historico)",money(k.get("consumo_total_valor",0))],
         ["Movimientos registrados",str(k.get("movimientos",0))]]
    e.append(tabla(["Concepto","Valor"],res,[12*cm,6*cm]))
    e.append(Spacer(1,5*mm))

    # Inventario
    e.append(seccion("2. INVENTARIO VALORIZADO ("+str(len(reps))+" repuestos)"))
    e.append(Spacer(1,3*mm))
    filas=[]
    total_val=0
    for r in reps:
        stock=r.get("stock_actual",0) or 0
        costo=float(r.get("costo_unitario") or 0)
        val=stock*costo; total_val+=val
        estado = "SIN STOCK" if stock==0 else ("BAJO MINIMO" if stock<=(r.get("stock_minimo",0) or 0) else "OK")
        filas.append([r.get("nombre",""),r.get("referencia","") or "-",r.get("marca","") or "-",
                      str(stock)+" "+(r.get("unidad","") or ""),str(r.get("stock_minimo",0) or 0),
                      money(costo),money(val),estado])
    filas.append(["TOTAL","","","","","",money(total_val),""])
    e.append(tabla(["Repuesto","Referencia","Marca","Stock","Minimo","Costo unit.","Valor total","Estado"],
                   filas,[6*cm,3.2*cm,2.8*cm,2.2*cm,1.8*cm,2.8*cm,3*cm,2.6*cm],
                   [TA_LEFT,TA_LEFT,TA_LEFT,TA_CENTER,TA_CENTER,TA_RIGHT,TA_RIGHT,TA_CENTER]))

    # Asignaciones
    e.append(PageBreak())
    e.append(P("SYNAP - Trazabilidad de asignaciones",12,True,TA_LEFT,AZ))
    e.append(Spacer(1,4*mm))
    e.append(seccion("3. REPUESTOS ASIGNADOS A EQUIPOS ("+str(len(asig))+")"))
    e.append(Spacer(1,3*mm))
    if asig:
        fa=[[a.get("fecha","")[:10],a.get("repuesto",""),str(a.get("cantidad",0)),
             a.get("equipo","Sin equipo"),a.get("orden_trabajo","-") or "-",a.get("motivo","-") or "-"]
            for a in asig]
        e.append(tabla(["Fecha","Repuesto","Cant.","Equipo asignado","Orden de trabajo","Motivo"],
                       fa,[2.5*cm,5.5*cm,1.6*cm,6*cm,3.4*cm,6*cm],
                       [TA_LEFT,TA_LEFT,TA_CENTER,TA_LEFT,TA_LEFT,TA_LEFT]))
    else:
        e.append(P("No hay asignaciones registradas.",9))

    doc.build(e); print(out)

if __name__=="__main__": main()
