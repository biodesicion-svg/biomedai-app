
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

AZUL=colors.HexColor('#1B2B5B'); GRIS=colors.HexColor('#64748B'); BORD=colors.HexColor('#E4E4E7')
GRIC=colors.HexColor('#F8F9FA'); AZUC=colors.HexColor('#EEF2FF'); BLAN=colors.white
NARC=colors.HexColor('#FFF7ED'); NARA=colors.HexColor('#EA580C')

EMPRESA='SYNAP'; DIR='Bogota, Colombia'; CORREO='admin@synap.co'; WEB='www.synap.co'
NOMBRE='Monitor De Signos Vitales'; MARCA='Mindray'; MODELO='Mec 1200'; REF='BMO-MOSIV-00010553'; SERIAL='CC22121790'; SVCIO='Ginecologia'

b=[('GRID',(0,0),(-1,-1),0.3,BORD),('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'MIDDLE')]
PN=ParagraphStyle('n',fontName='Helvetica',fontSize=8.5,textColor=colors.HexColor('#18181B'),leading=13,spaceAfter=4,alignment=TA_JUSTIFY)
PT=ParagraphStyle('t',fontName='Helvetica-Bold',fontSize=10,textColor=BLAN)
PC=ParagraphStyle('c',fontName='Helvetica',fontSize=8.5,alignment=TA_CENTER)
PP=ParagraphStyle('p',fontName='Helvetica',fontSize=7,textColor=GRIS,alignment=TA_CENTER)

def lc():
  try: return Image('/workspaces/biomedai-app/public/synap_logo.jpg',width=3.5*cm,height=1.2*cm)
  except: return Paragraph('<b><font color="#1B2B5B" size="13">SYNAP</font></b>',PC)

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
  return [Spacer(1,6*mm),HRFlowable(width='100%',thickness=0.5,color=AZUL,spaceAfter=3),Paragraph(f'<b>{EMPRESA}</b> | {DIR} | {CORREO} | {WEB}',PP)]

def mk(ruta,c):
  d=SimpleDocTemplate(ruta,pagesize=letter,leftMargin=1.5*cm,rightMargin=1.5*cm,topMargin=1.5*cm,bottomMargin=1.5*cm)
  d.build(c)

tipo='hoja'
c=[]

if tipo=='ficha':
  c+=enc('FICHA TECNICA','1','Junio 2025','Servicio Tecnico','1 de 1')
  c+=sec('DESCRIPCION DEL EQUIPO')
  c.append(Paragraph(f'Equipo {NOMBRE} fabricado por {MARCA}, modelo {MODELO}. Para uso en instituciones de salud del servicio {SVCIO}.',PN))
  c.append(Spacer(1,3*mm))
  c+=sec('INFORMACION DE REGISTRO')
  c.append(tg([3.5*cm,7.25*cm,4.5*cm,6.25*cm],[['MARCA',MARCA,'MODELO',MODELO],['REFERENCIA',REF,'SERIAL',SERIAL],['SERVICIO',SVCIO,'CLASIFICACION','Segun fabricante']]))
  c.append(Spacer(1,4*mm))
  c+=sec('INFORMACION TECNICA')
  c.append(tkv([['Clase de proteccion','Segun ficha del fabricante'],['Condiciones de uso','Temperatura 10-30 C, Humedad 15-80%'],['Condiciones de almacenaje','Temperatura 0-60 C, Humedad max. 90%'],['Frecuencia de mantenimiento','SEMESTRAL - Res. 4816/2008'],['Vida util estimada','Segun recomendacion del fabricante']],w1=5*cm))
  c+=pie()

elif tipo=='hoja':
  c+=enc('HOJA DE VIDA EQUIPO BIOMEDICO','1','Junio 2025','Servicio Tecnico','1 de 1')
  c+=sec('DATOS GENERALES DEL EQUIPO')
  c.append(tg([4*cm,7.75*cm,3.5*cm,6.25*cm],[['NOMBRE',NOMBRE,'',''],['MARCA',MARCA,'MODELO',MODELO],['REFERENCIA',REF,'SERIAL',SERIAL],['SERVICIO',SVCIO,'FRECUENCIA MANT.','SEMESTRAL']]))
  c.append(Spacer(1,4*mm))
  c+=sec('DATOS DEL PROVEEDOR')
  c.append(tg([3*cm,8.25*cm,3*cm,7.25*cm],[['PROVEEDOR','SYNAP','CONTACTO','Equipo SYNAP'],['DIRECCION',DIR,'CORREO',CORREO]]))
  c.append(Spacer(1,4*mm))
  c+=sec('HISTORIAL DE MANTENIMIENTO')
  c.append(tg([3*cm,4*cm,4*cm,5.25*cm,5.25*cm],[['Fecha','Tipo','Tecnico','Descripcion','Observaciones'],['','','','',''],['','','','',''],['','','','',''],['','','','','']]))
  c.append(Spacer(1,6*mm))
  c+=sec('FIRMAS')
  c.append(Spacer(1,4*mm))
  c.append(frm(['Tecnico Responsable','Supervisor','Representante IPS'],['SYNAP','SYNAP','(Institucion)']))
  c+=pie()

elif tipo=='cronograma':
  c+=enc('CRONOGRAMA DE MANTENIMIENTO PREVENTIVO','1','Enero 2025','Servicio Tecnico','1 de 1')
  c+=sec('FRECUENCIA Y PROGRAMACION')
  c.append(Paragraph(f'Equipo {NOMBRE} serial {SERIAL} del servicio {SVCIO}. Frecuencia: SEMESTRAL.',PN))
  c.append(Spacer(1,4*mm))
  c.append(tg([5*cm,5.5*cm,5.5*cm,5.5*cm],[['Actividad','Fecha inicio','Fecha fin','Responsable'],['Mantenimiento 1','01-ene-2025','31-ene-2025','Ingeniero Biomedico SYNAP'],['Mantenimiento 2','01-jul-2025','31-jul-2025','Ingeniero Biomedico SYNAP']]))
  c.append(Spacer(1,5*mm))
  c+=sec('OBSERVACIONES')
  obs=Table([[Paragraph('El mantenimiento se realizara conforme a los procedimientos establecidos. El tecnico de SYNAP se pondra en contacto para coordinar el servicio.',PN)]],colWidths=[21.5*cm])
  obs.setStyle(TableStyle([('BOX',(0,0),(-1,-1),0.3,BORD),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))
  c.append(obs)
  c.append(Spacer(1,10*mm))
  c+=sec('FIRMAS')
  c.append(Spacer(1,4*mm))
  c.append(frm(['Ingeniero Responsable','Aprobado por (Cliente)'],['Ingeniero Biomedico - SYNAP','Representante de la IPS']))
  c+=pie()

elif tipo=='protocolo':
  c+=enc('PROTOCOLO DE MANTENIMIENTO PREVENTIVO','1','Junio 2025','Servicio Tecnico','1 de 1')
  c+=sec('IDENTIFICACION DEL EQUIPO')
  c.append(tg([10.75*cm,10.75*cm],[['CLASIFICACION BIOMEDICA','CLASIFICACION DE RIESGO'],['Equipo de tratamiento / diagnostico','Segun registro fabricante']]))
  c.append(Spacer(1,4*mm))
  c+=sec('ACTIVIDADES DE MANTENIMIENTO PREVENTIVO')
  acts=Table([['ACTIVIDAD','DESCRIPCION','APROBO','NO APROBO'],['Inspeccion visual','Estado fisico del equipo, cables y accesorios.','',''],['Limpieza exterior','Pano suave. Sin solventes fuertes.','',''],['Revision de cables','Sin cortes ni resecamiento.','',''],['Verificacion accesorios','Segun lista de componentes del equipo.','',''],['Prueba funcional','Encender y verificar parametros. Sin alarmas.','',''],['Condiciones ambientales','Temp 10-30 C. Humedad 15-80%.','',''],['Lubricacion (si aplica)','Segun manual del fabricante.','','']],colWidths=[4.5*cm,12*cm,2.5*cm,2.5*cm])
  acts.setStyle(TableStyle(b+[('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(-1,0),AZUL),('BACKGROUND',(0,0),(-1,0),AZUC),('ROWBACKGROUNDS',(0,1),(-1,-1),[BLAN,GRIC]),('ALIGN',(2,0),(3,-1),'CENTER')]))
  c.append(acts)
  c.append(Spacer(1,6*mm))
  c+=sec('FIRMAS')
  c.append(Spacer(1,4*mm))
  c.append(frm(['Tecnico Ejecutor','Ingeniero Supervisor','Representante IPS'],['SYNAP','SYNAP','(Institucion)']))
  c+=pie()

elif tipo=='preinstalacion':
  c+=enc('REQUISITOS DE PRE INSTALACION','1','Junio 2025','Servicio Tecnico','1 de 1')
  c+=sec('INSTALACION DEL EQUIPO')
  req=Table([['1.','El radio de accion del equipo no debe estar limitado por factores externos.'],['2.','La vista de la pantalla debe estar garantizada en todo momento.'],['3.','El enchufe de red debe estar accesible para desconexion de emergencia.'],['4.','Las ranuras de ventilacion deben mantenerse libres.'],['5.','Verificar que el voltaje de la red coincida con la placa del equipo.'],['6.','Area con temperatura 10-30 C y humedad relativa 15-80%.']],colWidths=[0.8*cm,20.7*cm])
  req.setStyle(TableStyle(b+[('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(0,-1),AZUL),('BACKGROUND',(0,0),(0,-1),AZUC),('ROWBACKGROUNDS',(1,0),(1,-1),[BLAN,GRIC])]))
  c.append(req)
  c.append(Spacer(1,5*mm))
  c+=sec('ADVERTENCIA')
  alerta=Table([[Paragraph('<b>ADVERTENCIA:</b> Verificar voltaje antes de conectar el equipo. El voltaje incorrecto puede causar danos irreparables.',PN)]],colWidths=[21.5*cm])
  alerta.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NARC),('BOX',(0,0),(-1,-1),0.5,NARA),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))
  c.append(alerta)
  c.append(Spacer(1,4*mm))
  c+=sec('VERIFICACION POST-INSTALACION')
  ver=Table([['Item','Criterio','Cumple','No Cumple'],['1','Radio de accion no restringido','',''],['2','Pantalla visible para el operador','',''],['3','Enchufe de red accesible','',''],['4','Ventilacion garantizada','',''],['5','Voltaje de red correcto','',''],['6','Cable en buen estado','',''],['7','Prueba funcional exitosa','','']],colWidths=[1*cm,14*cm,3.25*cm,3.25*cm])
  ver.setStyle(TableStyle(b+[('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('TEXTCOLOR',(0,0),(-1,0),AZUL),('BACKGROUND',(0,0),(-1,0),AZUC),('ROWBACKGROUNDS',(0,1),(-1,-1),[BLAN,GRIC]),('ALIGN',(2,0),(3,-1),'CENTER')]))
  c.append(ver)
  c.append(Spacer(1,6*mm))
  c+=sec('FIRMA DEL INSTALADOR')
  c.append(Spacer(1,4*mm))
  c.append(frm(['Tecnico Instalador','Recibido por (Cliente)'],['SYNAP','(Institucion)']))
  c+=pie()

mk('/workspaces/biomedai-app/public/documentos/SYNAP_hoja_CC22121790.pdf',c)
print('OK')
