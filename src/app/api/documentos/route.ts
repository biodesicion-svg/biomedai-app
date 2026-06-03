import { NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const { tipo, nombre, marca, modelo, referencia, serial, servicio } = await req.json()

    if (!tipo || !nombre) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    const outDir = path.join(process.cwd(), 'public', 'documentos')
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

    const archivo = `SYNAP_${tipo}_${serial.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    const outPath = path.join(outDir, archivo)
    const logoPath = path.join(process.cwd(), 'public', 'synap_logo.jpg')
    const scriptPath = path.join(process.cwd(), 'tmp_synap_doc.py')

    const script = buildScript({ tipo, nombre, marca, modelo, referencia, serial, servicio, outPath, logoPath })
    writeFileSync(scriptPath, script)
    execSync(`python3 ${scriptPath}`, { timeout: 30000 })

    return NextResponse.json({ url: `/documentos/${archivo}`, nombre: archivo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function buildScript(d: any) {
  const { tipo, nombre, marca, modelo, referencia, serial, servicio, outPath, logoPath } = d
  const op = outPath.replace(/\\/g, '/')
  const lp = logoPath.replace(/\\/g, '/')

  return `
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

AZUL = colors.HexColor('#1B2B5B')
CYAN = colors.HexColor('#00B4D8')
GRIS = colors.HexColor('#64748B')
BORD = colors.HexColor('#E4E4E7')
GRIC = colors.HexColor('#F8F9FA')
AZUC = colors.HexColor('#EEF2FF')
BLAN = colors.white
NARC = colors.HexColor('#FFF7ED')
NARA = colors.HexColor('#EA580C')

EMPRESA = 'SYNAP'
DIR     = 'Bogota, Colombia'
CORREO  = 'admin@synap.co'
WEB     = 'www.synap.co'
NOMBRE  = '${nombre}'
MARCA   = '${marca}'
MODELO  = '${modelo}'
REF     = '${referencia}'
SERIAL  = '${serial}'
SVCIO   = '${servicio}'

b = [('GRID',(0,0),(-1,-1),0.3,BORD),('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'MIDDLE')]
PN = ParagraphStyle('n',fontName='Helvetica',fontSize=8.5,textColor=colors.HexColor('#18181B'),leading=13,spaceAfter=4,alignment=TA_JUSTIFY)
PT = ParagraphStyle('t',fontName='Helvetica-Bold',fontSize=10,textColor=BLAN)
PC = ParagraphStyle('c',fontName='Helvetica',fontSize=8.5,alignment=TA_CENTER)
PP = ParagraphStyle('p',fontName='Helvetica',fontSize=7,textColor=GRIS,alignment=TA_CENTER)

def lc():
    try:
        return Image('${lp}',width=3.5*cm,height=1.2*cm)
    except:
        return Paragraph('<b><font color="#1B2B5B" size="13">SYNAP</font></b>',PC)

def enc(dt,v,f,pr,pg):
    m=Table([['Version',v,'Fecha',f],['Proceso',pr,'Pagina',pg]],colWidths=[1.8*cm,2.5*cm,1.8*cm,2.5*cm])
    m.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),7.5),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(2,0),(2,-1),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(0,-1),AZUL),('TEXTCOLOR',(2,0),(2,-1),AZUL),('BACKGROUND',(0,0),(0,-1),AZUC),('BACKGROUND',(2,0),(2,-1),AZUC),('GRID',(0,0),(-1,-1),0.3,BORD),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
    e=Table([[lc(),[Paragraph(f'<b>{dt}</b>',ParagraphStyle('x',fontName='Helvetica-Bold',fontSize=10,alignment=TA_CENTER,textColor=AZUL)),Paragraph(EMPRESA,PC)],m]],colWidths=[4*cm,8.5*cm,9*cm])
    e.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BOX',(0,0),(-1,-1),0.5,AZUL),('LINEAFTER',(0,0),(0,0),0.5,BORD),('LINEAFTER',(1,0),(1,0),0.5,BORD),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),8)]))
    i=Table([['EQUIPO',NOMBRE,'MARCA',MARCA],['MODELO',MODELO,'REFERENCIA',REF],['SERIAL',SERIAL,'SERVICIO',SVCIO]],colWidths=[2.5*cm,8.5*cm,3*cm,7.5*cm])
    i.setStyle(TableStyle(b+[('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(2,0),(2,-1),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(0,-1),AZUL),('TEXTCOLOR',(2,0),(2,-1),AZUL),('BACKGROUND',(0,0),(0,-1),AZUC),('BACKGROUND',(2,0),(2,-1),AZUC)]))
    return [e,Spacer(1,2*mm),i,Spacer(1,4*mm)]

def sec(t):
    tb=Table([[Paragraph(f'<b>{t}</b>',PT)]],colWidths=[21.5*cm])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),8)]))
    return [tb,Spacer(1,2*mm)]

def tkv(d,w1=4*cm):
    t=Table(d,colWidths=[w1,21.5*cm-w1])
    t.setStyle(TableStyle(b+[('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(0,-1),AZUL),('BACKGROUND',(0,0),(0,-1),AZUC),('ROWBACKGROUNDS',(1,0),(1,-1),[BLAN,GRIC])]))
    return t

def tg(w,r):
    t=Table(r,colWidths=w)
    t.setStyle(TableStyle(b+[('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(-1,0),AZUL),('BACKGROUND',(0,0),(-1,0),AZUC),('ROWBACKGROUNDS',(0,1),(-1,-1),[BLAN,GRIC])]))
    return t

def frm(lb,sb):
    fw=[21.5*cm/len(lb)]*len(lb)
    t=Table([['']* len(lb),['___________________________']*len(lb),lb,sb],colWidths=fw)
    t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.5),('ALIGN',(0,0),(-1,-1),'CENTER'),('TOPPADDING',(0,1),(-1,1),20),('FONTNAME',(0,2),(-1,2),'Helvetica-Bold'),('TEXTCOLOR',(0,3),(-1,3),GRIS)]))
    return t

def pie():
    return [Spacer(1,6*mm),HRFlowable(width='100%',thickness=0.5,color=AZUL,spaceAfter=3),Paragraph(f'<b>{EMPRESA}</b> &nbsp;|&nbsp; {DIR} &nbsp;|&nbsp; {CORREO} &nbsp;|&nbsp; {WEB}',PP)]

def mk(ruta,c):
    d=SimpleDocTemplate(ruta,pagesize=letter,leftMargin=1.5*cm,rightMargin=1.5*cm,topMargin=1.5*cm,bottomMargin=1.5*cm)
    d.build(c)

tipo='${tipo}'
c=[]

if tipo=='ficha':
    c+=enc('FICHA TECNICA','1','Junio 2025','Servicio Tecnico','1 de 1')
    c+=sec('DESCRIPCION DEL EQUIPO')
    c.append(Paragraph(f'{NOMBRE} fabricado por {MARCA}, modelo {MODELO}. Equipo de uso medico para uso en instituciones de salud.',PN))
    c.append(Spacer(1,3*mm))
    c+=sec('INFORMACION DE REGISTRO')
    c.append(tg([3.5*cm,7.25*cm,4.5*cm,6.25*cm],[['MARCA',MARCA,'MODELO',MODELO],['REFERENCIA',REF,'SERIAL',SERIAL],['SERVICIO',SVCIO,'CLASIFICACION','Segun fabricante']]))
    c.append(Spacer(1,4*mm))
    c+=sec('INFORMACION TECNICA')
    c.append(tkv([['Clase de proteccion','Segun ficha del fabricante'],['Condiciones de uso','Temperatura 10-30 C, Humedad 15-80%'],['Condiciones de almacenaje','Temperatura 0-60 C, Humedad max. 90%'],['Frecuencia de mantenimiento','SEMESTRAL — segun normativa Res. 4816/2008'],['Vida util estimada','5 anos — segun recomendacion del fabricante']],w1=5*cm))
    c.append(Spacer(1,4*mm))
    c+=sec('RECOMENDACIONES DEL FABRICANTE')
    c.append(Paragraph('Consultar el manual del fabricante para las recomendaciones especificas de mantenimiento, limpieza y esterilizacion de este modelo.',PN))
    c+=pie()

elif tipo=='hoja':
    c+=enc('HOJA DE VIDA EQUIPO BIOMEDICO','1','Junio 2025','Servicio Tecnico','1 de 1')
    c+=sec('DATOS GENERALES DEL EQUIPO')
    c.append(tg([4*cm,7.75*cm,3.5*cm,6.25*cm],[['NOMBRE DEL EQUIPO',NOMBRE,'',''],['MARCA',MARCA,'MODELO',MODELO],['REFERENCIA',REF,'SERIAL',SERIAL],['SERVICIO',SVCIO,'CLASIFICACION RIESGO','Segun fabricante'],['GARANTIA','Segun contrato','FRECUENCIA MANT.','SEMESTRAL']]))
    c.append(Spacer(1,4*mm))
    c+=sec('DATOS DEL PROVEEDOR')
    c.append(tg([3*cm,8.25*cm,3*cm,7.25*cm],[['PROVEEDOR','SYNAP','CONTACTO','Equipo SYNAP'],['DIRECCION',DIR,'CORREO',CORREO],['WEB',WEB,'','']]))
    c.append(Spacer(1,4*mm))
    c+=sec('HISTORIAL DE MANTENIMIENTO')
    c.append(tg([3*cm,4*cm,4*cm,5.5*cm,5*cm],[['Fecha','Tipo','Tecnico','Descripcion','Observaciones'],['','','','',''],['','','','',''],['','','','',''],['','','','','']]))
    c.append(Spacer(1,4*mm))
    c+=sec('FIRMAS')
    c.append(Spacer(1,4*mm))
    c.append(frm(['Tecnico Responsable','Supervisor','Representante IPS'],['SYNAP','SYNAP','(Institucion)']))
    c+=pie()

elif tipo=='cronograma':
    c+=enc('CRONOGRAMA DE MANTENIMIENTO PREVENTIVO','1','Enero 2025','Servicio Tecnico','1 de 1')
    c+=sec('FRECUENCIA Y PROGRAMACION')
    c.append(Paragraph(f'El equipo {NOMBRE} referencia {REF} serial {SERIAL} del servicio {SVCIO} tiene frecuencia de mantenimiento preventivo SEMESTRAL.',PN))
    c.append(Spacer(1,4*mm))
    c.append(tg([5*cm,5.5*cm,5.5*cm,5.5*cm],[['Actividad','Fecha inicio estimada','Fecha fin estimada','Responsable'],['Mantenimiento 1','01-ene-2025','31-ene-2025','Ingeniero Biomedico SYNAP'],['Mantenimiento 2','01-jul-2025','31-jul-2025','Ingeniero Biomedico SYNAP']]))
    c.append(Spacer(1,5*mm))
    c+=sec('OBSERVACIONES')
    obs=Table([[Paragraph('El mantenimiento se realizara conforme a los procedimientos establecidos. Con antelacion a la fecha programada, el tecnico de SYNAP se pondra en contacto para coordinar el servicio.',PN)]],colWidths=[21.5*cm])
    obs.setStyle(TableStyle([('BOX',(0,0),(-1,-1),0.3,BORD),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))
    c.append(obs)
    c.append(Spacer(1,10*mm))
    c+=sec('FIRMA DEL RESPONSABLE')
    c.append(Spacer(1,4*mm))
    c.append(frm(['Ingeniero Responsable','Aprobado por (Cliente)'],['Ingeniero Biomedico - SYNAP','Representante de la IPS']))
    c+=pie()

elif tipo=='protocolo':
    c+=enc('PROTOCOLO DE MANTENIMIENTO PREVENTIVO','1','Junio 2025','Servicio Tecnico','1 de 1')
    c+=sec('IDENTIFICACION DEL EQUIPO')
    c.append(tg([10.75*cm,10.75*cm],[['CLASIFICACION BIOMEDICA','CLASIFICACION DE RIESGO'],['Equipo de tratamiento / diagnostico','Segun registro fabricante']]))
    c.append(Spacer(1,4*mm))
    c+=sec('ACTIVIDADES DE MANTENIMIENTO PREVENTIVO')
    acts=Table([['PRUEBA / ACTIVIDAD','OBSERVACION / COMENTARIO','APROBO','NO APROBO'],['Inspeccion visual general','Verificar estado fisico del equipo, cables y accesorios. Sin danos visibles.','',''],['Limpieza exterior','Limpiar con pano suave. No usar solventes fuertes.','',''],['Revision de cables','Inspeccionar cables de conexion y alimentacion. Sin cortes ni resecamiento.','',''],['Verificacion de accesorios','Revisar todos los accesorios del equipo segun lista de componentes.','',''],['Prueba funcional','Encender el equipo y verificar todos los parametros. Sin alarmas activas.','',''],['Condiciones de uso','Temperatura 10-30 C. Humedad 15-80%. Presion atmosferica segun fabricante.','',''],['Lubricacion (si aplica)','Segun recomendacion del fabricante en el manual del equipo.','','']],colWidths=[4.5*cm,12*cm,2.5*cm,2.5*cm])
    acts.setStyle(TableStyle(b+[('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(-1,0),AZUL),('BACKGROUND',(0,0),(-1,0),AZUC),('ROWBACKGROUNDS',(0,1),(-1,-1),[BLAN,GRIC]),('ALIGN',(2,0),(3,-1),'CENTER')]))
    c.append(acts)
    c.append(Spacer(1,6*mm))
    c+=sec('FIRMA Y APROBACION')
    c.append(Spacer(1,4*mm))
    c.append(frm(['Tecnico Ejecutor','Ingeniero Supervisor','Representante IPS'],['SYNAP','SYNAP','(Institucion)']))
    c+=pie()

elif tipo=='preinstalacion':
    c+=enc('REQUISITOS DE PRE INSTALACION','1','Junio 2025','Servicio Tecnico','1 de 1')
    c+=sec('INSTALACION DEL EQUIPO')
    req=Table([['1.','El radio de accion del equipo no debe estar limitado por factores externos.'],['2.','La vista de la pantalla debe estar garantizada en todo momento para el operador.'],['3.','El enchufe de red debe estar siempre accesible para desconexion de emergencia.'],['4.','Las ranuras de ventilacion deben mantenerse libres para evitar sobrecalentamiento.'],['5.','Verificar que el voltaje de la red coincida con el voltaje indicado en la placa del equipo.'],['6.','El area debe cumplir: temperatura 10-30 C, humedad relativa 15-80%.']],colWidths=[0.8*cm,20.7*cm])
    req.setStyle(TableStyle(b+[('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(0,-1),AZUL),('BACKGROUND',(0,0),(0,-1),AZUC),('ROWBACKGROUNDS',(1,0),(1,-1),[BLAN,GRIC])]))
    c.append(req)
    c.append(Spacer(1,5*mm))
    c+=sec('ADVERTENCIA DE SEGURIDAD ELECTRICA')
    alerta=Table([[Paragraph('<b>ADVERTENCIA:</b> Verificar el voltaje de operacion antes de conectar el equipo. El voltaje incorrecto puede causar danos irreparables al equipo.',PN)]],colWidths=[21.5*cm])
    alerta.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NARC),('BOX',(0,0),(-1,-1),0.5,NARA),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))
    c.append(alerta)
    c.append(Spacer(1,4*mm))
    c+=sec('VERIFICACION POST-INSTALACION')
    ver=Table([['Item','Criterio de verificacion','Cumple','No Cumple'],['1','Radio de accion del equipo no restringido','',''],['2','Pantalla y controles visibles para el operador','',''],['3','Enchufe de red accesible','',''],['4','Ventilacion del equipo garantizada','',''],['5','Voltaje de red coincide con el del equipo','',''],['6','Cable de alimentacion en buen estado','',''],['7','Prueba funcional exitosa','','']],colWidths=[1*cm,14*cm,3.25*cm,3.25*cm])
    ver.setStyle(TableStyle(b+[('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(-1,0),AZUL),('BACKGROUND',(0,0),(-1,0),AZUC),('ROWBACKGROUNDS',(0,1),(-1,-1),[BLAN,GRIC]),('ALIGN',(2,0),(3,-1),'CENTER')]))
    c.append(ver)
    c.append(Spacer(1,6*mm))
    c+=sec('FIRMA DEL INSTALADOR')
    c.append(Spacer(1,4*mm))
    c.append(frm(['Tecnico Instalador','Recibido por (Cliente)'],['SYNAP','(Institucion)']))
    c+=pie()

mk('${op}',c)
print('OK')
`
}
