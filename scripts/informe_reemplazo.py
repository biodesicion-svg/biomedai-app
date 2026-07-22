#!/usr/bin/env python3
"""Informe de evaluacion de reemplazo (EVDM) con trazabilidad de mantenimientos."""
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

def tabla(h,rows,w,al=None,cols=None):
    data=[[P(x,7.5,True,TA_LEFT,colors.white) for x in h]]
    for r in rows:
        data.append([P(x,7.5,False,al[i] if al and i<len(al) else TA_LEFT) for i,x in enumerate(r)])
    t=Table(data,colWidths=w,repeatRows=1)
    st=[("BACKGROUND",(0,0),(-1,0),AZ),("GRID",(0,0),(-1,-1),0.3,BORD),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),5),("VALIGN",(0,0),(-1,-1),"TOP")]
    for i in range(1,len(data)):
        if i%2==0: st.append(("BACKGROUND",(0,i),(-1,i),ZEB))
    if cols:
        for i,c in enumerate(cols):
            if c: st.append(("TEXTCOLOR",(len(h)-1,i+1),(len(h)-1,i+1),c))
    t.setStyle(TableStyle(st)); return t

def money(n):
    try: return "$"+format(int(n),",d").replace(",",".")
    except: return "$0"

REC={"reemplazar_inmediato":"REEMPLAZAR YA","evaluar_1_2_anios":"Evaluar 1-2 anios",
     "monitorear":"Monitorear","mantener":"Mantener en servicio"}
COL={"reemplazar_inmediato":RO,"evaluar_1_2_anios":NA,"monitorear":NA,"mantener":VE}

def main():
    d=json.load(sys.stdin)
    out=d.get("out","/tmp/reemplazo.pdf")
    inst=d.get("institucion","IPS Demo")
    evals=d.get("evaluaciones",[])
    detalle=d.get("detalle")     # evaluacion individual con trazabilidad
    hoy=datetime.now().strftime("%d/%m/%Y %H:%M")

    doc=SimpleDocTemplate(out,pagesize=landscape(letter),topMargin=1.2*cm,bottomMargin=1.2*cm,
                          leftMargin=1.2*cm,rightMargin=1.2*cm)
    e=[]
    e.append(P("SYNAP",18,True,TA_LEFT,AZ))
    e.append(P("Informe de Evaluacion de Reemplazo de Tecnologia Biomedica",11,True))
    e.append(P("Institucion: "+inst+"   |   Generado: "+hoy+"   |   Metodologia EVDM",8,False,TA_LEFT,GR))
    e.append(Spacer(1,3*mm))

    adv=Table([[P("EVALUACION PRELIMINAR: los valores de adquisicion y reposicion son estimados. "
                  "Validar con el area contable antes de tomar decisiones de inversion.",8,True,TA_LEFT,NA)]],colWidths=[25*cm])
    adv.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FFFBEB")),
                             ("BOX",(0,0),(-1,-1),0.5,NA),("TOPPADDING",(0,0),(-1,-1),6),
                             ("BOTTOMPADDING",(0,0),(-1,-1),6),("LEFTPADDING",(0,0),(-1,-1),10)]))
    e.append(adv); e.append(Spacer(1,4*mm))

    # Resumen
    k=d.get("kpis",{})
    e.append(seccion("1. RESUMEN DE LA EVALUACION")); e.append(Spacer(1,3*mm))
    kp=[["Equipos evaluados",str(k.get("total",len(evals)))],
        ["Reemplazo inmediato",str(k.get("reemplazar",0))],
        ["Evaluar en 1-2 anios",str(k.get("evaluar",0))],
        ["Mantener en servicio",str(k.get("mantener",0))],
        ["Inversion estimada requerida",money(k.get("inversion",0))]]
    e.append(tabla(["Concepto","Valor"],kp,[13*cm,5*cm])); e.append(Spacer(1,4*mm))

    # Ranking
    e.append(seccion("2. RANKING POR URGENCIA DE REEMPLAZO")); e.append(Spacer(1,3*mm))
    filas=[];cols=[]
    for ev in evals:
        filas.append([ev.get("equipo_nombre","-"), ev.get("codigo","-"), ev.get("servicio","-"),
                      str(ev.get("evdm_score",0)), str(ev.get("edad","-"))+"/"+str(ev.get("vida_util_fabricante","-")),
                      str(ev.get("cmr_pct",0))+"%", str(ev.get("correctivos_ultimo_anio",0)),
                      str(ev.get("eventos_adversos_count",0)), money(ev.get("valor_reposicion_actual",0)),
                      REC.get(ev.get("recomendacion",""),ev.get("recomendacion",""))])
        cols.append(COL.get(ev.get("recomendacion",""),GR))
    e.append(tabla(["Equipo","Codigo","Servicio","EVDM","Edad/Vida","CMR","Corr.","Ev.Adv.","Reposicion","Recomendacion"],
                   filas,[5*cm,2.2*cm,3.5*cm,1.5*cm,2*cm,1.5*cm,1.4*cm,1.6*cm,2.8*cm,3.5*cm],
                   [TA_LEFT,TA_LEFT,TA_LEFT,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER,TA_CENTER,TA_RIGHT,TA_CENTER],cols))

    # Detalle individual con trazabilidad
    if detalle:
        e.append(PageBreak())
        eq=detalle.get("equipo",{}); ev=detalle.get("evaluacion",{})
        e.append(P("SYNAP - Ficha de evaluacion individual",12,True,TA_LEFT,AZ)); e.append(Spacer(1,4*mm))
        e.append(seccion("3. DATOS DEL EQUIPO")); e.append(Spacer(1,3*mm))
        de=[["Equipo",eq.get("nombre","-"),"Codigo",eq.get("codigo_inventario","-")],
            ["Marca",eq.get("marca","-"),"Modelo",eq.get("modelo","-")],
            ["Serie",eq.get("serie","-"),"Servicio",eq.get("servicio","-")],
            ["Clase INVIMA",eq.get("clase_invima","-"),"Ano adquisicion",str(eq.get("anio_adquisicion","-"))]]
        e.append(tabla(["Campo","Valor","Campo","Valor"],de,[4*cm,8*cm,4*cm,8*cm]))
        e.append(Spacer(1,4*mm))

        e.append(seccion("4. RESULTADO EVDM")); e.append(Spacer(1,3*mm))
        sc=[["Evaluacion economica (EVE)",str(ev.get("eve_score",0))+" / 100"],
            ["Evaluacion clinica (EVC)",str(ev.get("evc_score",0))+" / 100"],
            ["Evaluacion tecnica",str(ev.get("evalscore_tecnica",0))+" / 100"],
            ["SCORE EVDM GLOBAL",str(ev.get("evdm_score",0))+" / 100"],
            ["Recomendacion",REC.get(ev.get("recomendacion",""),"-")],
            ["Costo mantenimiento anual",money(ev.get("costo_mantenimiento_anual",0))],
            ["Valor de reposicion",money(ev.get("valor_reposicion_actual",0))]]
        e.append(tabla(["Indicador","Resultado"],sc,[13*cm,5*cm]))
        e.append(Spacer(1,4*mm))

        # Trazabilidad de mantenimientos
        mts=detalle.get("mantenimientos",[])
        e.append(seccion("5. TRAZABILIDAD DE MANTENIMIENTOS ("+str(len(mts))+")")); e.append(Spacer(1,3*mm))
        if mts:
            fm=[[str(m.get("fecha","") or "-")[:10], m.get("tipo","-"), m.get("estado","-"),
                 m.get("tecnico","-"), m.get("resultado","-") or "-", money(m.get("costo",0))] for m in mts[:40]]
            e.append(tabla(["Fecha","Tipo","Estado","Tecnico","Resultado","Costo"],fm,
                           [3*cm,3.5*cm,3.5*cm,5*cm,4*cm,3*cm],
                           [TA_LEFT,TA_LEFT,TA_LEFT,TA_LEFT,TA_LEFT,TA_RIGHT]))
        else:
            e.append(P("Sin mantenimientos registrados para este equipo.",9))
        e.append(Spacer(1,4*mm))

        # Justificacion
        e.append(seccion("6. JUSTIFICACION TECNICA")); e.append(Spacer(1,3*mm))
        e.append(P(detalle.get("justificacion","-"),9,False,TA_LEFT))
        e.append(Spacer(1,4*mm))

        # Alternativas de compra
        alts=detalle.get("alternativas",[])
        if alts:
            e.append(seccion("7. ALTERNATIVAS DE REPOSICION")); e.append(Spacer(1,3*mm))
            fa=[[a.get("marca_propuesta","-"),a.get("modelo_propuesto","-"),a.get("proveedor","-"),
                 money(a.get("precio_oferta",0)),str(a.get("vida_util_propuesto","-"))+" anios",
                 str(a.get("garantia_meses","-"))+" meses",money(a.get("costo_total_propiedad_5anios",0)),
                 str(a.get("roi_estimado_anios","-"))+" anios",
                 ("Si" if a.get("incluye_capacitacion") else "No")] for a in alts]
            e.append(tabla(["Marca","Modelo","Proveedor","Precio","Vida util","Garantia","TCO 5 anos","ROI","Capacitacion"],
                           fa,[3*cm,3.5*cm,3.5*cm,3*cm,2.2*cm,2.2*cm,3*cm,2*cm,2.2*cm],
                           [TA_LEFT,TA_LEFT,TA_LEFT,TA_RIGHT,TA_CENTER,TA_CENTER,TA_RIGHT,TA_CENTER,TA_CENTER]))
            e.append(Spacer(1,3*mm))
            for a in alts:
                if a.get("mejoras_tecnicas"):
                    e.append(P("<b>"+a.get("marca_propuesta","")+" "+a.get("modelo_propuesto","")+":</b> "+a.get("mejoras_tecnicas",""),8))
            e.append(Spacer(1,3*mm))
            e.append(P("<b>Recomendacion final:</b> "+detalle.get("recomendacion_final","-"),9))

    doc.build(e); print(out)

if __name__=="__main__": main()
