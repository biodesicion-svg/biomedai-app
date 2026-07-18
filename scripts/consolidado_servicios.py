#!/usr/bin/env python3
"""Consolidado de gestion de mantenimiento - informe ejecutivo."""
import sys, json
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT

AZ=colors.HexColor("#1B2B5B"); VE=colors.HexColor("#16A34A"); RO=colors.HexColor("#DC2626")
NA=colors.HexColor("#D97706"); GR=colors.HexColor("#64748B"); BORD=colors.HexColor("#CBD5E1")
ZEB=colors.HexColor("#F8FAFC")

def P(t,s=8,b=False,al=TA_LEFT,c=colors.black):
    return Paragraph(str(t),ParagraphStyle("p",fontName="Helvetica-Bold" if b else "Helvetica",
                     fontSize=s,leading=s+2.5,alignment=al,textColor=c))

def seccion(t):
    tb=Table([[P(t,10,True,TA_LEFT,colors.white)]],colWidths=[25*cm])
    tb.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),AZ),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),10)]))
    return tb

def tabla(headers,rows,widths):
    data=[[P(h,7.5,True,TA_LEFT,colors.white) for h in headers]]
    for r in rows: data.append([P(x,7.5) for x in r])
    t=Table(data,colWidths=widths,repeatRows=1)
    st=[("BACKGROUND",(0,0),(-1,0),AZ),("GRID",(0,0),(-1,-1),0.3,BORD),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),6),("VALIGN",(0,0),(-1,-1),"TOP")]
    for i in range(1,len(data)):
        if i%2==0: st.append(("BACKGROUND",(0,i),(-1,i),ZEB))
    t.setStyle(TableStyle(st)); return t

def main():
    d=json.load(sys.stdin)
    out=d.get("out","/tmp/consolidado.pdf")
    inst=d.get("institucion","IPS Demo")
    D=d.get("dashboard",{}); servicios=d.get("servicios",[])
    hoy=datetime.now().strftime("%d/%m/%Y %H:%M")

    doc=SimpleDocTemplate(out,pagesize=landscape(letter),topMargin=1.2*cm,bottomMargin=1.2*cm,leftMargin=1.2*cm,rightMargin=1.2*cm)
    e=[]
    # Encabezado
    e.append(P("SYNAP",18,True,TA_LEFT,AZ))
    e.append(P("Informe Consolidado de Gestion de Mantenimiento",11,True))
    e.append(P("Institucion: "+inst+"   |   Generado: "+hoy+"   |   Res. 4816/2008 - Res. 3100/2019",8,False,TA_LEFT,GR))
    e.append(Spacer(1,5*mm))

    # KPIs
    e.append(seccion("1. INDICADORES DE GESTION"))
    e.append(Spacer(1,3*mm))
    kp=[["Cumplimiento del plan",str(D.get("cumplimiento",0))+" %"],
        ["Mantenimientos pendientes",str(D.get("pendientes",0))],
        ["Mantenimientos VENCIDOS",str(D.get("vencidos",0))],
        ["Conformidad de ejecucion",str(D.get("conformidad",0))+" %"],
        ["No conformidades",str(D.get("no_conformes",0))],
        ["Tiempo promedio de intervencion",str(D.get("tiempo_promedio",0))+" min"]]
    e.append(tabla(["Indicador","Valor"],kp,[12*cm,5*cm]))
    e.append(Spacer(1,4*mm))

    if D.get("vencidos",0)>0:
        al=Table([[P("ALERTA: "+str(D.get("vencidos"))+" mantenimientos con fecha programada vencida sin ejecutar. Riesgo de hallazgo en auditoria INVIMA.",8.5,True,TA_LEFT,RO)]],colWidths=[25*cm])
        al.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FEF2F2")),("BOX",(0,0),(-1,-1),0.5,RO),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),("LEFTPADDING",(0,0),(-1,-1),10)]))
        e.append(al); e.append(Spacer(1,4*mm))

    # Por tecnico
    e.append(seccion("2. CUMPLIMIENTO POR TECNICO"))
    e.append(Spacer(1,3*mm))
    rt=[[t.get("nombre",""),str(t.get("asignados",0)),str(t.get("completados",0)),
         str(t.get("asignados",0)-t.get("completados",0)),str(t.get("pct",0))+" %"] for t in D.get("por_tecnico",[])]
    e.append(tabla(["Tecnico","Asignados","Completados","Pendientes","Cumplimiento"],rt,[8*cm,4*cm,4*cm,4*cm,4*cm]))
    e.append(Spacer(1,4*mm))

    # Pendientes por servicio
    e.append(seccion("3. PENDIENTES POR SERVICIO"))
    e.append(Spacer(1,3*mm))
    rs=[[s.get("servicio",""),str(s.get("pendientes",0))] for s in D.get("pendientes_servicio",[])]
    e.append(tabla(["Servicio","Mantenimientos pendientes"],rs,[16*cm,6*cm]))
    e.append(Spacer(1,4*mm))

    # Por mes
    e.append(seccion("4. CUMPLIMIENTO MENSUAL"))
    e.append(Spacer(1,3*mm))
    rm=[[m.get("mes",""),str(m.get("programados",0)),str(m.get("completados",0)),str(m.get("pct",0))+" %"] for m in D.get("por_mes",[])]
    e.append(tabla(["Mes","Programados","Completados","Cumplimiento"],rm,[6*cm,5*cm,5*cm,5*cm]))

    # Detalle
    if servicios:
        e.append(PageBreak())
        e.append(P("SYNAP - Detalle de servicios ejecutados",12,True,TA_LEFT,AZ))
        e.append(Spacer(1,4*mm))
        e.append(seccion("5. SERVICIOS EJECUTADOS ("+str(len(servicios))+")"))
        e.append(Spacer(1,3*mm))
        rd=[[s.get("numero_reporte",""),str(s.get("fecha_servicio",""))[:10],s.get("equipo",""),
             s.get("serie_placa",""),s.get("tipo_servicio",""),s.get("tecnico",""),
             str(s.get("resultado","")).upper()] for s in servicios]
        e.append(tabla(["Reporte","Fecha","Equipo","Serie","Tipo","Tecnico","Resultado"],rd,
                       [3.5*cm,2.5*cm,6*cm,3.5*cm,3*cm,4.5*cm,3*cm]))

    doc.build(e); print(out)

if __name__=="__main__": main()
