#!/usr/bin/env python3
"""Informes de Metrologia PAME: cronograma de calibracion e informe general."""
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

def tabla(headers,rows,widths,aligns=None,colores=None):
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
        ("LEFTPADDING",(0,0),(-1,-1),5),("VALIGN",(0,0),(-1,-1),"TOP")]
    for i in range(1,len(data)):
        if i%2==0: st.append(("BACKGROUND",(0,i),(-1,i),ZEB))
    if colores:
        for i,c in enumerate(colores):
            if c: st.append(("TEXTCOLOR",(len(headers)-1,i+1),(len(headers)-1,i+1),c))
    t.setStyle(TableStyle(st)); return t

def encabezado(e, inst, titulo):
    e.append(P("SYNAP",18,True,TA_LEFT,AZ))
    e.append(P(titulo,11,True))
    e.append(P("Institucion: "+inst+"   |   Generado: "+datetime.now().strftime("%d/%m/%Y %H:%M")+
               "   |   ISO/IEC 17025 - Res. 2003/2014",8,False,TA_LEFT,GR))
    e.append(Spacer(1,5*mm))

def informe_general(e, d):
    k=d.get("kpis",{}); g=d.get("graficos",{})
    encabezado(e, d.get("institucion","IPS Demo"), "Informe General - Plan de Aseguramiento Metrologico (PAME)")

    e.append(seccion("1. INDICADORES METROLOGICOS")); e.append(Spacer(1,3*mm))
    kp=[["Equipos en el PAME",str(k.get("total",0))],
        ["Calibraciones vigentes",str(k.get("vigentes",0))],
        ["Proximas a vencer (30 dias)",str(k.get("proximos",0))],
        ["Calibraciones VENCIDAS",str(k.get("vencidos",0))],
        ["Equipos sin calibrar",str(k.get("sinCal",0))],
        ["Cumplimiento del plan",str(k.get("cumplimiento",0))+" %"],
        ["Equipos fuera de tolerancia",str(k.get("fueraTol",0))],
        ["Sin dato para evaluar tolerancia",str(k.get("sinDatoTol",0))]]
    e.append(tabla(["Indicador","Valor"],kp,[13*cm,5*cm])); e.append(Spacer(1,4*mm))

    venc=k.get("vencidos",0); sinc=k.get("sinCal",0)
    if venc or sinc:
        msg=("ALERTA: "+str(venc)+" equipos con calibracion vencida y "+str(sinc)+
             " sin calibrar. Un instrumento de medicion sin calibracion vigente no debe utilizarse "
             "para decisiones clinicas. Riesgo de hallazgo en auditoria.")
        al=Table([[P(msg,8.5,True,TA_LEFT,RO)]],colWidths=[25*cm])
        al.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FEF2F2")),
                                ("BOX",(0,0),(-1,-1),0.5,RO),("TOPPADDING",(0,0),(-1,-1),6),
                                ("BOTTOMPADDING",(0,0),(-1,-1),6),("LEFTPADDING",(0,0),(-1,-1),10)]))
        e.append(al); e.append(Spacer(1,4*mm))

    e.append(seccion("2. CUMPLIMIENTO POR MAGNITUD")); e.append(Spacer(1,3*mm))
    rm=[[m.get("magnitud",""),str(m.get("total",0)),str(m.get("vigentes",0)),
         str(m.get("vencidos",0)),str(m.get("sin_calibrar",0)),str(m.get("pct",0))+" %"]
        for m in g.get("porMagnitud",[])]
    cols=[VE if m.get("pct",0)>=80 else (NA if m.get("pct",0)>=50 else RO) for m in g.get("porMagnitud",[])]
    e.append(tabla(["Magnitud","Equipos","Vigentes","Vencidos","Sin calibrar","Cumplimiento"],
                   rm,[7*cm,3*cm,3*cm,3*cm,3.5*cm,3.5*cm],
                   [TA_LEFT,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER,TA_RIGHT],cols))
    e.append(Spacer(1,4*mm))

    e.append(seccion("3. SERVICIOS CON MAYOR INCUMPLIMIENTO")); e.append(Spacer(1,3*mm))
    rs=[[s.get("servicio",""),str(s.get("total",0)),str(s.get("vigentes",0)),
         str(s.get("vencidos",0)),str(s.get("pct",0))+" %"] for s in g.get("porServicio",[])]
    e.append(tabla(["Servicio","Equipos","Vigentes","Vencidos","Cumplimiento"],
                   rs,[9*cm,3*cm,3*cm,3*cm,4*cm],
                   [TA_LEFT,TA_CENTER,TA_CENTER,TA_CENTER,TA_RIGHT]))

    cm_=g.get("calibracionesPorMes",[])
    if cm_:
        e.append(Spacer(1,4*mm))
        e.append(seccion("4. CALIBRACIONES REALIZADAS POR MES")); e.append(Spacer(1,3*mm))
        rc=[[c.get("periodo",""),str(c.get("cantidad",0))] for c in cm_]
        e.append(tabla(["Periodo","Calibraciones"],rc,[6*cm,4*cm],[TA_LEFT,TA_CENTER]))

def informe_cronograma(e, d):
    cron=d.get("cronograma",[])
    encabezado(e, d.get("institucion","IPS Demo"), "Cronograma de Calibracion - PAME")
    e.append(seccion("CRONOGRAMA DE CALIBRACION ("+str(len(cron))+" equipos)")); e.append(Spacer(1,3*mm))
    est_lbl={"vigente":"Vigente","proximo":"Proximo","vencido":"VENCIDO","sin_calibrar":"Sin calibrar"}
    filas=[];cols=[]
    for c in cron:
        est=c.get("estado","")
        tol=c.get("tolerancia")
        tol_txt = ("+/- "+str(tol)+" "+str(c.get("unidad","") or "")) if tol is not None else "-"
        dias=c.get("dias")
        dias_txt = (str(dias)+" d") if dias is not None else "-"
        filas.append([c.get("equipo","") or "-", c.get("servicio","") or "-",
                      c.get("magnitud","") or "-", tol_txt,
                      str(c.get("ultima","") or "-")[:10], str(c.get("proxima","") or "-")[:10],
                      dias_txt, "SI" if c.get("requiere_onac") else "No",
                      est_lbl.get(est,est)])
        cols.append(RO if est=="vencido" else (NA if est=="proximo" else (VE if est=="vigente" else GR)))
    e.append(tabla(["Equipo","Servicio","Magnitud","Tolerancia","Ultima cal.","Proxima cal.","Dias","ONAC","Estado"],
                   filas,[5.5*cm,4*cm,3.5*cm,2.8*cm,2.4*cm,2.4*cm,1.6*cm,1.4*cm,2.4*cm],
                   [TA_LEFT,TA_LEFT,TA_LEFT,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER],cols))

def main():
    d=json.load(sys.stdin)
    out=d.get("out","/tmp/metrologia.pdf")
    tipo=d.get("tipo","general")
    doc=SimpleDocTemplate(out,pagesize=landscape(letter),topMargin=1.2*cm,bottomMargin=1.2*cm,
                          leftMargin=1.2*cm,rightMargin=1.2*cm)
    e=[]
    if tipo=="cronograma": informe_cronograma(e,d)
    else: informe_general(e,d)
    doc.build(e); print(out)

if __name__=="__main__": main()
