#!/usr/bin/env python3
"""Acta de mantenimiento con diagnostico/procedimiento/recomendaciones auto-generados."""
import sys, json
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

VERDE = colors.HexColor("#C6D9A8"); VERDE_T = colors.HexColor("#3F5228")
AZ = colors.HexColor("#1B2B5B"); GR = colors.HexColor("#64748B")
BORD = colors.HexColor("#94A3B8"); GRIC = colors.HexColor("#F1F5F4")

def P(txt, size=8, bold=False, align=TA_LEFT, color=colors.black):
    return Paragraph(str(txt), ParagraphStyle("p", fontName="Helvetica-Bold" if bold else "Helvetica",
                     fontSize=size, leading=size+2.5, alignment=align, textColor=color))

def banda(titulo):
    t = Table([[P(titulo, 9, True, TA_CENTER, VERDE_T)]], colWidths=[19*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),VERDE),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
    return t

def gen_diagnostico(equipo, marca, modelo, resp_list):
    nc = [p for p,r in resp_list if r and not r.get("conforme", True)]
    nc_criticas = [p for p in nc if p.get("critica")]
    base = ("Durante la inspeccion tecnica del equipo " + str(equipo) + " marca " + str(marca or "N/D") +
            " modelo " + str(modelo or "N/D") + ", se realizo verificacion general de sus componentes "
            "mecanicos, electricos y funcionales. ")
    if not nc:
        return base + ("El equipo se encontro en condiciones adecuadas de funcionamiento, sin evidenciar "
                       "fallas en sus sistemas. Se verifico el correcto funcionamiento de todos los parametros "
                       "evaluados, observandose operacion normal dentro de los rangos establecidos por el fabricante.")
    hall = "; ".join(p["pregunta"].replace(chr(191),"").replace("?","") for p in nc[:5])
    crit = " Se identificaron no conformidades criticas que requieren atencion inmediata." if nc_criticas else ""
    return base + ("Se identificaron los siguientes hallazgos que no cumplen el parametro esperado: " +
                   hall + "." + crit + " Se recomienda realizar las acciones correctivas correspondientes "
                   "antes de la puesta en servicio del equipo.")

PROCEDIMIENTOS = {
    "monitor": [
        "Inspeccion general del estado fisico del equipo y accesorios.",
        "Limpieza externa de carcasa y pantalla con productos adecuados.",
        "Verificacion y limpieza de cables de paciente y sensores.",
        "Limpieza de conectores con aire comprimido.",
        "Verificacion del sistema electrico y conexiones de alimentacion.",
        "Medicion de corriente de fuga y continuidad de tierra.",
        "Prueba funcional de parametros (SpO2, frecuencia cardiaca, presion).",
        "Verificacion del funcionamiento de alarmas.",
        "Prueba del estado y autonomia de la bateria.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "ventilador": [
        "Inspeccion general del estado fisico del equipo.",
        "Revision del circuito de paciente (mangueras, valvulas, conectores).",
        "Limpieza y desinfeccion del circuito externo.",
        "Limpieza del filtro de aire de la turbina y revision del filtro bacteriano.",
        "Verificacion del sistema electrico y corriente de fuga.",
        "Prueba de volumen tidal y frecuencia respiratoria con pulmon de prueba.",
        "Verificacion de alarmas de presion alta y desconexion.",
        "Prueba del sistema de humidificacion (si aplica).",
        "Ejecucion del autodiagnostico del equipo.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "anestesia": [
        "Inspeccion general del estado fisico de la maquina de anestesia.",
        "Revision del circuito respiratorio y absorbedor de CO2.",
        "Verificacion de fugas en el sistema de gases.",
        "Limpieza y desinfeccion de componentes del circuito.",
        "Verificacion de vaporizadores y calibracion.",
        "Prueba del ventilador integrado (volumen y presion).",
        "Verificacion de alarmas y sistemas de seguridad.",
        "Revision del sistema electrico y bateria de respaldo.",
        "Ejecucion del autodiagnostico del equipo.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "desfibrilador": [
        "Inspeccion general del estado fisico, carcasa y pantalla.",
        "Revision del estado de paletas o electrodos.",
        "Limpieza de paletas y superficie del equipo.",
        "Verificacion del sistema electrico y carga de bateria.",
        "Prueba de energia de descarga a 200J y 360J con analizador.",
        "Verificacion del tiempo de carga.",
        "Prueba del marcapasos externo (si aplica).",
        "Verificacion de la senal de ECG en pantalla.",
        "Prueba de descarga interna (test de seguridad).",
        "Prueba de funcionamiento general del equipo.",
    ],
    "bomba": [
        "Inspeccion general del estado fisico del equipo.",
        "Verificacion del mecanismo de carga del set de infusion.",
        "Limpieza externa del equipo.",
        "Verificacion del sistema electrico y bateria.",
        "Prueba de exactitud de flujo con equipo de medicion.",
        "Verificacion de alarmas de oclusion y aire en linea.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "incubadora": [
        "Inspeccion general del estado fisico del equipo.",
        "Limpieza y desinfeccion de camara y colchon.",
        "Verificacion del sistema de control de temperatura.",
        "Verificacion del sistema de humedad (si aplica).",
        "Prueba de sensores de temperatura de piel y aire.",
        "Verificacion de alarmas de temperatura y flujo de aire.",
        "Revision del sistema electrico y corriente de fuga.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "electrobisturi": [
        "Inspeccion general del estado fisico del equipo.",
        "Revision de cables activos y placa de retorno.",
        "Limpieza externa del equipo y accesorios.",
        "Verificacion del sistema electrico y corriente de fuga.",
        "Prueba de potencia de salida en modos corte y coagulacion.",
        "Verificacion de alarmas de placa de retorno.",
        "Prueba de funcionamiento general del equipo.",
    ],
    "bascula": [
        "Inspeccion general del estado fisico del equipo.",
        "Limpieza externa del equipo.",
        "Verificacion de nivelacion y estabilidad.",
        "Verificacion de exactitud con pesas patron.",
        "Ajuste de calibracion (si aplica).",
        "Prueba de funcionamiento general del equipo.",
    ],
    "refrigeracion": [
        "Inspeccion general del estado fisico del equipo.",
        "Limpieza externa e interna del equipo.",
        "Verificacion y limpieza del condensador y sellos de puerta.",
        "Verificacion del sistema de control de temperatura.",
        "Registro de temperatura y comparacion con rango establecido.",
        "Verificacion de alarmas de temperatura (si aplica).",
        "Prueba de funcionamiento general del equipo.",
    ],
}
PROC_GENERICO = [
    "Inspeccion general del estado fisico del equipo y accesorios.",
    "Limpieza externa del equipo.",
    "Verificacion del sistema electrico y conexiones de alimentacion.",
    "Verificacion del funcionamiento general segun especificaciones del fabricante.",
    "Prueba funcional del equipo.",
]

def familia_equipo(nombre):
    n = (nombre or "").upper()
    if "ANESTESIA" in n: return "anestesia"
    if "VENTILADOR" in n: return "ventilador"
    if "MONITOR" in n: return "monitor"
    if "DESFIBRILADOR" in n: return "desfibrilador"
    if "BOMBA" in n or "INFUSOR" in n: return "bomba"
    if "INCUBADOR" in n: return "incubadora"
    if "ELECTROBISTURI" in n or "BISTURI" in n: return "electrobisturi"
    if "BASCULA" in n or "BALANZA" in n or "PESA" in n or "TALLIMETRO" in n or "GRAMERA" in n: return "bascula"
    if "NEVERA" in n or "REFRIGERADOR" in n or "CONGELADOR" in n or "CUARTO FRIO" in n: return "refrigeracion"
    return None

def gen_procedimiento(preguntas, nombre_equipo=""):
    fam = familia_equipo(nombre_equipo)
    if fam and fam in PROCEDIMIENTOS:
        return PROCEDIMIENTOS[fam]
    return PROC_GENERICO

def gen_recomendaciones(resp_list):
    nc = [p for p,r in resp_list if r and not r.get("conforme", True)]
    recs = ["Realizar limpieza periodica del equipo segun cronograma establecido.",
            "Utilizar el equipo unicamente por personal capacitado.",
            "Mantener el equipo conectado a un sistema electrico estable.",
            "Cumplir con el programa de mantenimiento preventivo para prolongar la vida util del equipo."]
    if nc: recs.insert(0, "Atender las no conformidades identificadas antes de la puesta en servicio del equipo.")
    return recs

def main():
    d = json.load(sys.stdin)
    out = d.get("out", "/tmp/acta.pdf")
    eq = d.get("equipo", {}); ej = d.get("ejecucion", {})
    preguntas = ej.get("preguntas", []); respuestas = ej.get("respuestas", {}) or {}
    resp_list = []
    for i, p in enumerate(preguntas):
        r = respuestas.get(str(i)) or respuestas.get(i)
        resp_list.append((p, r))
    nombre=eq.get("nombre","N/D"); marca=eq.get("marca","N/D"); modelo=eq.get("modelo","N/D")
    serie=eq.get("serie","N/D"); servicio=eq.get("servicio","N/D")
    clase=eq.get("clase_invima","N/D"); riesgo=eq.get("riesgo","N/D")
    cliente=d.get("cliente","N/D"); institucion=d.get("institucion","IPS Demo")
    consecutivo=d.get("consecutivo","N/D"); fecha=d.get("fecha", datetime.now().strftime("%d/%m/%Y"))
    hora_ini=d.get("hora_inicio",""); hora_fin=d.get("hora_fin","")
    obs=d.get("observaciones","Sin observaciones adicionales."); resultado=d.get("resultado","conforme")
    diagnostico=gen_diagnostico(nombre,marca,modelo,resp_list)
    procedimiento=gen_procedimiento(preguntas, nombre); recomendaciones=gen_recomendaciones(resp_list)
    doc=SimpleDocTemplate(out,pagesize=letter,topMargin=1*cm,bottomMargin=1*cm,leftMargin=1*cm,rightMargin=1*cm)
    e=[]
    head=Table([[P("SYNAP",16,True,TA_CENTER,AZ),P(institucion+"<br/>INFORME DE MANTENIMIENTO PREVENTIVO",9,True,TA_CENTER),P("VERSION 1<br/>N "+str(consecutivo)+"<br/>FECHA: "+fecha,7,False,TA_CENTER)]],colWidths=[5*cm,9*cm,5*cm])
    head.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.5,BORD),("INNERGRID",(0,0),(-1,-1),0.5,BORD),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    e.append(head); e.append(Spacer(1,3*mm))
    e.append(banda("1. DATOS DEL CLIENTE"))
    c1=Table([[P("NOMBRE O RAZON SOCIAL",7,True),P(cliente,8),P("CIUDAD",7,True),P("Bogota",8)],[P("SERVICIO",7,True),P(servicio,8),P("FECHA",7,True),P(fecha,8)]],colWidths=[4*cm,7*cm,3*cm,5*cm])
    c1.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.4,BORD),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
    e.append(c1); e.append(Spacer(1,2*mm))
    e.append(banda("2. DATOS DEL EQUIPO"))
    c2=Table([[P("EQUIPO",7,True),P(nombre,8),P("MARCA",7,True),P(marca,8)],[P("MODELO",7,True),P(modelo,8),P("SERIE",7,True),P(serie,8)],[P("CLASIFICACION BIOMEDICA",7,True),P("Clase "+str(clase),8),P("CLASIFICACION DE RIESGO",7,True),P(str(riesgo).upper(),8)]],colWidths=[4.5*cm,6.5*cm,4*cm,4*cm])
    c2.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.4,BORD),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
    e.append(c2); e.append(Spacer(1,2*mm))
    e.append(banda("3. DIAGNOSTICO")); e.append(Spacer(1,1*mm)); e.append(P(diagnostico,8.5,False,TA_JUSTIFY)); e.append(Spacer(1,2*mm))
    e.append(banda("4. PROCEDIMIENTO")); e.append(Spacer(1,1*mm))
    for a in procedimiento: e.append(P("- "+a,8))
    e.append(Spacer(1,2*mm))
    e.append(banda("5. RECOMENDACIONES")); e.append(Spacer(1,1*mm))
    for r in recomendaciones: e.append(P("- "+r,8))
    e.append(Spacer(1,2*mm))
    e.append(banda("6. REGISTRO DEL SERVICIO"))
    rescol = colors.HexColor("#16A34A") if resultado=="conforme" else colors.HexColor("#DC2626")
    reg=Table([[P("HORA INICIO",7,True),P(hora_ini,8),P("HORA FIN",7,True),P(hora_fin,8)],[P("OBSERVACIONES",7,True),P(obs,8),P("RESULTADO",7,True),P(str(resultado).upper(),8,True,TA_LEFT,rescol)]],colWidths=[3.5*cm,7*cm,4*cm,4.5*cm])
    reg.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.4,BORD),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
    e.append(reg); e.append(Spacer(1,10*mm))
    firmas=Table([[P("_______________________",9,False,TA_CENTER),P("_______________________",9,False,TA_CENTER)],[P("FIRMA CLIENTE",7,True,TA_CENTER),P("FIRMA TECNICO SYNAP",7,True,TA_CENTER)]],colWidths=[9.5*cm,9.5*cm])
    firmas.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),4)]))
    e.append(firmas)
    doc.build(e); print(out)

if __name__ == "__main__":
    main()
