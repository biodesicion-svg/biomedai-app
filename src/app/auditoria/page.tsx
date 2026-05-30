'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const INST = '00000000-0000-0000-0000-000000000001'

const AUDITORIAS = [
  { id:'habilitacion',    nombre:'Auditoría de Habilitación',         subtitulo:'Resolución 3100 de 2019 — Ministerio de Salud',          icon:'ti-building-hospital',       color:'#3B4FE8', bg:'#EEF2FF' },
  { id:'biomedica',       nombre:'Auditoría de Equipos Biomédicos',   subtitulo:'Res. 4816/2008 · Dentro de Habilitación',                icon:'ti-device-heart-monitor',    color:'#7C3AED', bg:'#F5F3FF' },
  { id:'tecnovigilancia', nombre:'Auditoría de Tecnovigilancia',      subtitulo:'Programa Nacional INVIMA · Res. 4816/2008',              icon:'ti-shield-check',            color:'#D97706', bg:'#FFFBEB' },
  { id:'pamec',           nombre:'Auditoría PAMEC',                   subtitulo:'Programa de Auditoría para el Mejoramiento de la Calidad',icon:'ti-chart-arrows-vertical',   color:'#0891B2', bg:'#F0F9FF' },
  { id:'acreditacion',    nombre:'Acreditación en Salud',             subtitulo:'ICONTEC · No obligatoria · Nivel superior',              icon:'ti-award',                   color:'#16A34A', bg:'#F0FDF4' },
  { id:'secretaria',      nombre:'Visita Secretaría de Salud',        subtitulo:'Secretarías Departamentales o Distritales',              icon:'ti-building-community',      color:'#DC2626', bg:'#FEF2F2' },
  { id:'supersalud',      nombre:'Auditoría Supersalud',              subtitulo:'Superintendencia Nacional de Salud',                     icon:'ti-scale',                   color:'#7C3AED', bg:'#F5F3FF' },
  { id:'iso9001',         nombre:'ISO 9001:2015',                     subtitulo:'Sistema de Gestión de Calidad · Internacional',          icon:'ti-certificate',             color:'#0891B2', bg:'#F0F9FF' },
  { id:'iso13485',        nombre:'ISO 13485',                         subtitulo:'Dispositivos médicos · Gestión de calidad',              icon:'ti-certificate-2',           color:'#16A34A', bg:'#F0FDF4' },
  { id:'iso17025',        nombre:'ISO 17025',                         subtitulo:'Laboratorios de calibración y ensayo',                   icon:'ti-microscope',              color:'#D97706', bg:'#FFFBEB' },
]

function calcularCriterios(tipo: string, eq: any[], mant: any[], rep: any[]) {
  const sinSerie       = eq.filter(e=>!e.serie)
  const sinMarca       = eq.filter(e=>!e.marca)
  const sinClaseInvima = eq.filter(e=>!e.clase_invima)
  const sinAnioAdq     = eq.filter(e=>!e.anio_adquisicion)
  const sinVidaUtil    = eq.filter(e=>!e.vida_util_anos)
  const altoRiesgo     = eq.filter(e=>e.riesgo==='alto')
  const operativos     = eq.filter(e=>e.estado==='operativo')
  const completados    = mant.filter(m=>m.estado==='completado')
  const preventivos    = mant.filter(m=>m.tipo==='preventivo')
  const correctivos    = mant.filter(m=>m.tipo==='correctivo')
  const calibraciones  = mant.filter(m=>m.tipo==='calibracion')
  const sinFechaReal   = mant.filter(m=>!m.fecha_realizado)
  const sinCosto       = mant.filter(m=>!m.costo_total||Number(m.costo_total)===0)
  const sinDuracion    = mant.filter(m=>!m.duracion_horas)
  const sinDesc        = mant.filter(m=>!m.descripcion||String(m.descripcion).length<5)
  const conHallazgos   = mant.filter(m=>m.hallazgos&&String(m.hallazgos).length>5)
  const sinStock       = rep.filter(r=>r.stock_actual===0)
  const stockBajo      = rep.filter(r=>r.stock_actual>0&&r.stock_actual<=r.stock_minimo)
  const stockOk        = rep.filter(r=>r.stock_actual>r.stock_minimo)
  const eqConMant      = new Set(mant.map(m=>m.equipo_id))
  const sinMant        = eq.filter(e=>!eqConMant.has(e.id))
  const completos      = eq.filter(e=>e.serie&&e.marca&&e.clase_invima&&e.anio_adquisicion)

  const pct = (n:number,d:number) => d>0?Math.round((n/d)*100):0
  const pctComp   = pct(completos.length, eq.length)
  const pctCumpl  = pct(completados.length, mant.length)
  const pctDoc    = pct(mant.length-sinDesc.length, mant.length)
  const pctCosto  = pct(mant.length-sinCosto.length, mant.length)
  const pctStock  = pct(stockOk.length, rep.length)
  const pctVida   = pct(eq.length-sinVidaUtil.length, eq.length)
  const pctClase  = pct(eq.length-sinClaseInvima.length, eq.length)
  const mesesCub  = new Set(mant.map(m=>m.fecha_programada?.substring(0,7))).size
  const pctCronograma = Math.min(pct(mesesCub,12),100)
  const pctHV     = pct(eq.length-sinMant.length, eq.length)
  const pctAltoMant = pct(altoRiesgo.filter(e=>eqConMant.has(e.id)).length, altoRiesgo.length)
  const pctDisp   = pct(operativos.length, eq.length)

  const res = (puntaje:number, meta:number) =>
    puntaje>=meta?'cumple':puntaje>=meta*0.6?'parcial':'no_cumple'

  const CRITERIOS: Record<string,any[]> = {
    habilitacion: [
      { estandar:'Dotación', criterio:'Inventario biomédico completo (nombre, marca, modelo, serie)', normativa:'Res. 3100/2019 · Res. 4816/2008', resultado:res(pctComp,80), puntaje:pctComp, meta:100, impacto:'alto',
        hallazgo:`${completos.length}/${eq.length} equipos con datos completos (${pctComp}%). Sin serie: ${sinSerie.length}, sin marca: ${sinMarca.length}, sin clase INVIMA: ${sinClaseInvima.length}, sin año: ${sinAnioAdq.length}.`,
        mejora:pctComp<100?`Completar datos de ${eq.length-completos.length} equipos. Priorizar los ${altoRiesgo.length} de alto riesgo.`:null },
      { estandar:'Dotación', criterio:'Clasificación de riesgo INVIMA documentada', normativa:'Dec. 4725/2005', resultado:res(pctClase,90), puntaje:pctClase, meta:100, impacto:'alto',
        hallazgo:`${eq.length-sinClaseInvima.length}/${eq.length} equipos con clase INVIMA. Faltan: ${sinClaseInvima.length}.`,
        mejora:sinClaseInvima.length>0?'Consultar portal web.invima.gov.co y registrar la clase (I, IIa, IIb, III) de cada equipo.':null },
      { estandar:'Procesos prioritarios', criterio:'Plan anual de mantenimiento preventivo ≥ 80%', normativa:'Res. 4816/2008 Art. 7', resultado:res(pctCumpl,80), puntaje:pctCumpl, meta:80, impacto:'alto',
        hallazgo:`Cumplimiento: ${pctCumpl}%. ${completados.length}/${mant.length} completados. Cronograma cubre ${mesesCub}/12 meses. ${sinFechaReal.length} sin fecha de ejecución.`,
        mejora:pctCumpl<80?'Establecer cronograma formal con responsables. Registrar fecha real en cada intervención.':null },
      { estandar:'Procesos prioritarios', criterio:'Hojas de vida con historial de mantenimiento', normativa:'Res. 4816/2008 Art. 6', resultado:res(pctHV,90), puntaje:pctHV, meta:100, impacto:'alto',
        hallazgo:`${eq.length-sinMant.length}/${eq.length} equipos con historial. ${sinMant.length} sin ningún registro.`,
        mejora:sinMant.length>0?'Registrar al menos la recepción técnica de los equipos sin historial.':null },
      { estandar:'Historia clínica y registros', criterio:'Registros de mantenimiento con descripción de actividades', normativa:'Res. 4816/2008 Art. 8', resultado:res(pctDoc,80), puntaje:pctDoc, meta:80, impacto:'medio',
        hallazgo:`${mant.length-sinDesc.length}/${mant.length} con descripción (${pctDoc}%). ${sinDuracion.length} sin duración registrada.`,
        mejora:pctDoc<80?'Exigir descripción obligatoria en cada orden de trabajo.':null },
      { estandar:'Dotación', criterio:'Stock de repuestos e insumos biomédicos disponible', normativa:'Res. 3100/2019', resultado:sinStock.length===0&&stockBajo.length===0?'cumple':sinStock.length===0?'parcial':'no_cumple', puntaje:pctStock, meta:90, impacto:'medio',
        hallazgo:`${sinStock.length} agotados, ${stockBajo.length} stock bajo, ${stockOk.length} óptimo de ${rep.length} total.`,
        mejora:(sinStock.length>0||stockBajo.length>0)?`Reponer: ${[...sinStock,...stockBajo].slice(0,3).map((r:any)=>r.nombre).join(', ')}`:null },
      { estandar:'Talento humano', criterio:'Responsable de ingeniería biomédica designado', normativa:'Res. 3100/2019', resultado:'parcial', puntaje:50, meta:100, impacto:'alto',
        hallazgo:'No es posible verificar automáticamente si existe responsable formal designado. Requiere verificación de documentación RH.',
        mejora:'Designar formalmente un Ingeniero Biomédico mediante acto administrativo.' },
    ],
    biomedica: [
      { estandar:'Inventario biomédico', criterio:'Nombre, marca, modelo y serie registrados', normativa:'Res. 4816/2008 Art. 5', resultado:res(pctComp,90), puntaje:pctComp, meta:100, impacto:'alto',
        hallazgo:`${completos.length}/${eq.length} completos. Sin serie: ${sinSerie.length}, sin marca: ${sinMarca.length}, sin año: ${sinAnioAdq.length}.`,
        mejora:pctComp<100?'Completar desde placa del equipo y manual del fabricante.':null },
      { estandar:'Inventario biomédico', criterio:'Clasificación de riesgo INVIMA', normativa:'Dec. 4725/2005', resultado:res(pctClase,90), puntaje:pctClase, meta:100, impacto:'alto',
        hallazgo:`${eq.length-sinClaseInvima.length}/${eq.length} con clase INVIMA. Alto riesgo: ${altoRiesgo.length} equipos.`,
        mejora:sinClaseInvima.length>0?'Buscar en web.invima.gov.co y registrar la clase asignada.':null },
      { estandar:'Inventario biomédico', criterio:'Vida útil definida para cada equipo', normativa:'Res. 4816/2008', resultado:res(pctVida,80), puntaje:pctVida, meta:90, impacto:'medio',
        hallazgo:`${eq.length-sinVidaUtil.length}/${eq.length} con vida útil (${pctVida}%). Faltan: ${sinVidaUtil.length}.`,
        mejora:sinVidaUtil.length>0?'Definir vida útil según ficha técnica del fabricante o tabla OPS/OMS.':null },
      { estandar:'Hojas de vida', criterio:'Todos los equipos con al menos una intervención registrada', normativa:'Res. 4816/2008 Art. 6', resultado:res(pctHV,90), puntaje:pctHV, meta:100, impacto:'alto',
        hallazgo:`${eq.length-sinMant.length}/${eq.length} con historial. ${sinMant.length} sin ningún registro.`,
        mejora:sinMant.length>0?'Registrar mínimo recepción técnica inicial. Priorizar equipos de soporte vital.':null },
      { estandar:'Plan de mantenimiento', criterio:'Cronograma anual con cobertura de todos los meses', normativa:'Res. 4816/2008 Art. 7', resultado:res(pctCronograma,80), puntaje:pctCronograma, meta:80, impacto:'alto',
        hallazgo:`Cronograma cubre ${mesesCub}/12 meses. Total: ${mant.length} (${preventivos.length} prev, ${correctivos.length} corr).`,
        mejora:pctCronograma<80?'Distribuir cronograma en los 12 meses. Usar el módulo de mantenimiento para distribución automática.':null },
      { estandar:'Plan de mantenimiento', criterio:'Cumplimiento del plan preventivo ≥ 80%', normativa:'Res. 4816/2008 Art. 7', resultado:res(pctCumpl,80), puntaje:pctCumpl, meta:80, impacto:'alto',
        hallazgo:`${completados.length}/${mant.length} completados (${pctCumpl}%). ${sinFechaReal.length} sin fecha de ejecución real.`,
        mejora:pctCumpl<80?`Registrar fecha real en todos los mantenimientos. ${sinFechaReal.length} pendientes.`:null },
      { estandar:'Calibraciones', criterio:'Equipos de medición con calibración documentada', normativa:'NTC ISO/IEC 17025', resultado:calibraciones.length>0?res(pct(calibraciones.length,Math.max(altoRiesgo.length,1)),50):'no_cumple', puntaje:pct(calibraciones.length,Math.max(altoRiesgo.length,1)), meta:100, impacto:'alto',
        hallazgo:`${calibraciones.length} calibraciones registradas. Monitores, desfibriladores, bombas y ventiladores requieren calibración periódica.`,
        mejora:'Programar calibraciones con laboratorio acreditado ONAC. Registrar certificados en el sistema.' },
      { estandar:'Órdenes de trabajo', criterio:'Registros con descripción, costo y duración', normativa:'Res. 4816/2008 Art. 8', resultado:res(pctDoc,80), puntaje:pctDoc, meta:80, impacto:'medio',
        hallazgo:`Sin descripción: ${sinDesc.length}, sin costo: ${sinCosto.length}, sin duración: ${sinDuracion.length}.`,
        mejora:'Completar campos en todas las intervenciones históricas.' },
      { estandar:'Repuestos', criterio:'Stock de repuestos críticos disponible', normativa:'Res. 3100/2019', resultado:sinStock.length===0&&stockBajo.length===0?'cumple':sinStock.length===0?'parcial':'no_cumple', puntaje:pctStock, meta:90, impacto:'medio',
        hallazgo:`${sinStock.length} agotados, ${stockBajo.length} bajo mínimo, ${stockOk.length} óptimo.`,
        mejora:(sinStock.length>0||stockBajo.length>0)?`Reponer: ${[...sinStock,...stockBajo].slice(0,3).map((r:any)=>r.nombre).join(', ')}`:null },
    ],
    tecnovigilancia: [
      { estandar:'Programa', criterio:'Programa de tecnovigilancia documentado', normativa:'Res. 4816/2008 Art. 15', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'No se detecta programa formal de tecnovigilancia en el sistema.',
        mejora:'Elaborar Programa de Tecnovigilancia institucional con: objetivos, responsable, procedimientos y formatos de reporte.' },
      { estandar:'Responsable', criterio:'Responsable ante INVIMA designado formalmente', normativa:'Res. 4816/2008', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin evidencia de responsable formal designado ante el INVIMA.',
        mejora:'Designar responsable mediante acto administrativo y registrar en portal de tecnovigilancia INVIMA.' },
      { estandar:'Reporte de eventos', criterio:'Registro de eventos adversos con dispositivos médicos', normativa:'Dec. 4725/2005', resultado:correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?40:0, meta:100, impacto:'alto',
        hallazgo:`${correctivos.length} correctivos registrados. Sin categorización formal de eventos adversos ni reporte al INVIMA.`,
        mejora:'Implementar formato de reporte. Categorizar: incidente, casi incidente o evento adverso.' },
      { estandar:'Hallazgos documentados', criterio:'Fallas de equipos con hallazgos registrados', normativa:'Res. 4816/2008', resultado:res(pct(conHallazgos.length,mant.length),50), puntaje:pct(conHallazgos.length,mant.length), meta:80, impacto:'medio',
        hallazgo:`${conHallazgos.length}/${mant.length} intervenciones con hallazgos documentados.`,
        mejora:'Registrar hallazgos en cada intervención correctiva. Clasificar por tipo de falla.' },
      { estandar:'Alertas sanitarias', criterio:'Seguimiento de alertas INVIMA', normativa:'Circular INVIMA', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin registro de seguimiento de alertas sanitarias o retiro de dispositivos.',
        mejora:'Suscribirse a alertas INVIMA en invima.gov.co. Registrar equipos con alerta activa.' },
      { estandar:'Capacitación', criterio:'Personal capacitado en reporte de fallas', normativa:'Res. 4816/2008', resultado:'no_cumple', puntaje:0, meta:100, impacto:'medio',
        hallazgo:'Sin evidencia de capacitaciones en tecnovigilancia en el sistema.',
        mejora:'Programar capacitación anual al personal asistencial sobre identificación y reporte de fallas.' },
    ],
    pamec: [
      { estandar:'Seguridad del paciente', criterio:'Identificación de riesgos tecnológicos', normativa:'SOGCS · Decreto 1011/2006', resultado:altoRiesgo.length>0?'parcial':'cumple', puntaje:altoRiesgo.length>0?60:90, meta:90, impacto:'alto',
        hallazgo:`${altoRiesgo.length} equipos de alto riesgo identificados. ${operativos.length}/${eq.length} operativos.`,
        mejora:'Documentar plan de contingencia para equipos de alto riesgo y soporte vital.' },
      { estandar:'Indicadores de calidad', criterio:'KPIs calculados y reportados a dirección', normativa:'SOGCS · Indicadores OPS', resultado:mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?55:0, meta:80, impacto:'alto',
        hallazgo:`Disponibilidad: ${pctDisp}%. Ratio prev/corr: ${correctivos.length>0?(preventivos.length/correctivos.length).toFixed(1):'N/D'}. Cumplimiento: ${pctCumpl}%.`,
        mejora:'Reportar KPIs mensualmente a dirección. Establecer metas formales institucionales.' },
      { estandar:'Eventos adversos', criterio:'Registro y análisis de fallas de equipos', normativa:'Res. 4816/2008 · SOGCS', resultado:correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?45:0, meta:80, impacto:'alto',
        hallazgo:`${correctivos.length} correctivos registrados. Sin análisis formal de causa raíz.`,
        mejora:'Clasificar fallas por tipo. Analizar causas raíz mensualmente.' },
      { estandar:'Planes de mejora', criterio:'Plan de mejoramiento documentado con indicadores', normativa:'SOGCS', resultado:'no_cumple', puntaje:0, meta:100, impacto:'medio',
        hallazgo:'Sin planes de mejora formales documentados para el área biomédica.',
        mejora:'Crear plan de mejora con: problema, meta, acciones, responsable, plazo e indicador.' },
      { estandar:'Gestión del riesgo', criterio:'Equipos alto riesgo con mantenimiento al día', normativa:'SOGCS · Res. 4816/2008', resultado:res(pctAltoMant,90), puntaje:pctAltoMant, meta:100, impacto:'alto',
        hallazgo:`${altoRiesgo.filter(e=>eqConMant.has(e.id)).length}/${altoRiesgo.length} equipos alto riesgo con mantenimiento.`,
        mejora:altoRiesgo.filter(e=>!eqConMant.has(e.id)).length>0?`${altoRiesgo.filter(e=>!eqConMant.has(e.id)).length} equipos de alto riesgo sin intervención. Programar inmediatamente.`:null },
    ],
    acreditacion: [
      { estandar:'Gestión tecnológica', criterio:'Inventario 100% completo y actualizado', normativa:'ICONTEC', resultado:res(pctComp,90), puntaje:pctComp, meta:95, impacto:'alto',
        hallazgo:`Completitud: ${pctComp}%. Para acreditación se requiere inventario completo incluyendo vida útil y valor.`,
        mejora:pctComp<95?'Completar todos los campos incluyendo valor de adquisición y vida útil.':null },
      { estandar:'Mantenimiento biomédico', criterio:'Cumplimiento preventivo ≥ 90%', normativa:'ICONTEC · Nivel superior', resultado:res(pctCumpl,90), puntaje:pctCumpl, meta:90, impacto:'alto',
        hallazgo:`Cumplimiento: ${pctCumpl}%. Acreditación ICONTEC exige mínimo 90%.`,
        mejora:pctCumpl<90?'Aumentar frecuencia preventiva. Implementar alertas para vencimientos.':null },
      { estandar:'Gestión documental', criterio:'Documentación técnica completa de intervenciones', normativa:'ICONTEC', resultado:res(pctDoc,85), puntaje:pctDoc, meta:90, impacto:'alto',
        hallazgo:`${pctDoc}% documentado. Acreditación exige trazabilidad total.`,
        mejora:'Completar descripción, duración, costo y responsable en todas las intervenciones.' },
      { estandar:'Seguridad del paciente', criterio:'Plan de contingencia para equipos críticos', normativa:'ICONTEC', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin planes de contingencia formales para equipos de soporte vital.',
        mejora:'Documentar por equipo: reemplazo, proveedor de respaldo, tiempo máximo de indisponibilidad.' },
      { estandar:'Liderazgo organizacional', criterio:'KPIs reportados mensualmente a dirección', normativa:'ICONTEC', resultado:mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?50:0, meta:100, impacto:'medio',
        hallazgo:'KPIs calculados pero sin evidencia de presentación formal a comité de dirección.',
        mejora:'Generar informe ejecutivo mensual y presentar en comité de calidad. Documentar actas.' },
      { estandar:'Gestión clínica', criterio:'Calibraciones con laboratorio acreditado ONAC', normativa:'NTC ISO/IEC 17025 · ICONTEC', resultado:calibraciones.length>0?'parcial':'no_cumple', puntaje:calibraciones.length>0?50:0, meta:100, impacto:'alto',
        hallazgo:`${calibraciones.length} calibraciones registradas. Acreditación requiere certificado de laboratorio ONAC.`,
        mejora:'Contratar laboratorio acreditado ONAC para calibración de equipos de medición críticos.' },
    ],
    secretaria: [
      { estandar:'Habilitación', criterio:'Registro de habilitación vigente', normativa:'Res. 3100/2019', resultado:'parcial', puntaje:50, meta:100, impacto:'alto',
        hallazgo:'No verificable automáticamente. Requiere revisión del certificado del ente territorial.',
        mejora:'Verificar vigencia en portal del ente territorial. Mantener copia digital disponible.' },
      { estandar:'Equipos biomédicos', criterio:'Inventario actualizado disponible para inspección', normativa:'Res. 4816/2008', resultado:res(pctComp,70), puntaje:pctComp, meta:100, impacto:'alto',
        hallazgo:`Inventario al ${pctComp}%. ${eq.length-completos.length} equipos con datos incompletos que generarían observaciones.`,
        mejora:'Completar datos antes de visita. Tener inventario impreso y firmado disponible.' },
      { estandar:'Equipos biomédicos', criterio:'Hojas de vida con historial de mantenimiento', normativa:'Res. 4816/2008 Art. 6', resultado:res(pctHV,90), puntaje:pctHV, meta:95, impacto:'alto',
        hallazgo:`${eq.length-sinMant.length}/${eq.length} con historial. Inspectores revisarán muestra aleatoria.`,
        mejora:'Completar hojas de vida de equipos sin historial antes de visita programada.' },
      { estandar:'Mantenimiento', criterio:'Cronograma vigente con evidencias de ejecución', normativa:'Res. 4816/2008 Art. 7', resultado:res(Math.round((pctCumpl+pctCronograma)/2),75), puntaje:Math.round((pctCumpl+pctCronograma)/2), meta:80, impacto:'alto',
        hallazgo:`Cumplimiento: ${pctCumpl}%. Cobertura: ${mesesCub}/12 meses. ${sinFechaReal.length} sin fecha de ejecución.`,
        mejora:'Tener disponible cronograma firmado y órdenes de trabajo del año en curso.' },
      { estandar:'Documentación', criterio:'Órdenes de trabajo firmadas y con descripción', normativa:'Res. 4816/2008', resultado:res(pctDoc,70), puntaje:pctDoc, meta:90, impacto:'medio',
        hallazgo:`${pctDoc}% con descripción. Inspectores solicitan órdenes firmadas.`,
        mejora:'Implementar firma en todas las órdenes del año en curso.' },
    ],
    supersalud: [
      { estandar:'Calidad de atención', criterio:'Disponibilidad de equipos ≥ 90%', normativa:'Supersalud · Circular 049', resultado:res(pctDisp,90), puntaje:pctDisp, meta:90, impacto:'alto',
        hallazgo:`Disponibilidad: ${pctDisp}%. Supersalud exige mínimo 90%. ${eq.length-operativos.length} equipos no operativos.`,
        mejora:'Reducir equipos fuera de servicio. Documentar causa de cada uno no operativo.' },
      { estandar:'Seguridad del paciente', criterio:'Equipos de soporte vital operativos', normativa:'Supersalud', resultado:res(pct(altoRiesgo.filter(e=>e.estado==='operativo').length,altoRiesgo.length),90), puntaje:pct(altoRiesgo.filter(e=>e.estado==='operativo').length,altoRiesgo.length), meta:100, impacto:'alto',
        hallazgo:`${altoRiesgo.filter(e=>e.estado==='operativo').length}/${altoRiesgo.length} equipos alto riesgo operativos.`,
        mejora:'Priorizar reparación de equipos críticos. Documentar causa y tiempo de reparación.' },
      { estandar:'Cumplimiento normativo', criterio:'Plan de mantenimiento documentado', normativa:'Res. 4816/2008 · Supersalud', resultado:res(pctCumpl,80), puntaje:pctCumpl, meta:80, impacto:'alto',
        hallazgo:`Cumplimiento: ${pctCumpl}%. Supersalud puede solicitar evidencias de los últimos 2 años.`,
        mejora:'Mantener archivo histórico de órdenes de trabajo por año y por equipo.' },
      { estandar:'Gestión financiera', criterio:'Registro de costos de mantenimiento en COP', normativa:'Supersalud', resultado:res(pctCosto,80), puntaje:pctCosto, meta:90, impacto:'medio',
        hallazgo:`${mant.length-sinCosto.length}/${mant.length} con costo registrado. ${sinCosto.length} sin costo.`,
        mejora:'Completar costos históricos para análisis de inversión ante Supersalud.' },
      { estandar:'Habilitación', criterio:'Dotación mínima por servicio habilitado', normativa:'Res. 3100/2019', resultado:'parcial', puntaje:60, meta:100, impacto:'alto',
        hallazgo:`${eq.length} equipos en inventario. No verificable automáticamente si cubren dotación mínima por servicio.`,
        mejora:'Cruzar inventario con Res. 3100/2019 para verificar dotación mínima por servicio.' },
    ],
    iso9001: [
      { estandar:'Sistema de gestión', criterio:'Inventario como proceso documentado', normativa:'ISO 9001:2015 Cláusula 7.5', resultado:res(pctComp,80), puntaje:pctComp>=80?65:pctComp, meta:100, impacto:'alto',
        hallazgo:`Inventario al ${pctComp}%. ISO 9001 exige control total de documentos y registros.`,
        mejora:'Definir procedimiento para alta, baja y modificación de equipos en el inventario.' },
      { estandar:'Control de procesos', criterio:'Proceso de mantenimiento con indicadores medibles', normativa:'ISO 9001:2015 Cláusula 8.1', resultado:mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?60:0, meta:90, impacto:'alto',
        hallazgo:`${mant.length} registros. ISO 9001 requiere proceso definido con entradas, actividades, salidas e indicadores.`,
        mejora:'Documentar proceso de mantenimiento biomédico como proceso del SGC.' },
      { estandar:'Indicadores', criterio:'KPIs con metas definidas y seguimiento', normativa:'ISO 9001:2015 Cláusula 9.1', resultado:mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?55:0, meta:90, impacto:'alto',
        hallazgo:'KPIs calculados automáticamente. Sin metas formales aprobadas por dirección.',
        mejora:'Formalizar metas: disponibilidad ≥90%, cumplimiento preventivo ≥80%, MTTR ≤24h.' },
      { estandar:'Mejora continua', criterio:'No conformidades registradas y tratadas', normativa:'ISO 9001:2015 Cláusula 10.2', resultado:correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?50:0, meta:80, impacto:'medio',
        hallazgo:`${correctivos.length} correctivos como evidencia de fallas. Sin análisis formal de causa raíz.`,
        mejora:'Implementar registro CAPA para cada falla de equipo.' },
      { estandar:'Gestión de riesgos', criterio:'Análisis de riesgos tecnológicos (AMFE)', normativa:'ISO 9001:2015 Cláusula 6.1', resultado:altoRiesgo.length>0?'parcial':'cumple', puntaje:altoRiesgo.length>0?50:90, meta:90, impacto:'medio',
        hallazgo:`${altoRiesgo.length} equipos de alto riesgo identificados. Sin análisis formal AMFE documentado.`,
        mejora:'Elaborar matriz AMFE para equipos clase IIb y III.' },
    ],
    iso13485: [
      { estandar:'Control de dispositivos', criterio:'Trazabilidad completa de cada dispositivo', normativa:'ISO 13485:2016 Cláusula 8.3', resultado:res(pctComp,90), puntaje:pctComp>=90?70:pctComp, meta:100, impacto:'alto',
        hallazgo:`Trazabilidad al ${pctComp}%. ISO 13485 exige número de serie, lote y trazabilidad de toda la vida útil.`,
        mejora:'Completar número de serie, modelo y datos de adquisición de todos los equipos.' },
      { estandar:'Gestión de proveedores', criterio:'Proveedores de mantenimiento evaluados', normativa:'ISO 13485:2016 Cláusula 7.4', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin evaluación formal de proveedores de mantenimiento y calibración.',
        mejora:'Crear lista de proveedores calificados con criterios: certificaciones, experiencia, tiempo de respuesta.' },
      { estandar:'Control de calidad', criterio:'Acciones correctivas por falla de equipo (CAPA)', normativa:'ISO 13485:2016 Cláusula 8.5', resultado:correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?50:0, meta:90, impacto:'alto',
        hallazgo:`${correctivos.length} correctivos. Sin análisis formal de causa raíz por equipo.`,
        mejora:'Implementar proceso CAPA para cada falla significativa.' },
      { estandar:'Ciclo de vida', criterio:'Vida útil definida y control de obsolescencia', normativa:'ISO 13485:2016 Cláusula 7.3', resultado:res(pctVida,80), puntaje:pctVida, meta:95, impacto:'medio',
        hallazgo:`${eq.length-sinVidaUtil.length}/${eq.length} con vida útil definida. ISO 13485 exige gestión del ciclo de vida completo.`,
        mejora:'Definir vida útil de todos los equipos. Programar revisión de obsolescencia anual.' },
    ],
    iso17025: [
      { estandar:'Competencia técnica', criterio:'Personal con competencias en calibración', normativa:'ISO/IEC 17025:2017 Cláusula 6.2', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin certificaciones de personal en metrología o calibración en el sistema.',
        mejora:'Verificar y documentar capacitación en calibración del personal técnico.' },
      { estandar:'Trazabilidad metrológica', criterio:'Calibraciones con trazabilidad al patrón nacional', normativa:'ISO/IEC 17025:2017 Cláusula 6.5', resultado:calibraciones.length>0?'parcial':'no_cumple', puntaje:calibraciones.length>0?40:0, meta:100, impacto:'alto',
        hallazgo:`${calibraciones.length} calibraciones registradas. Sin evidencia de trazabilidad al INM Colombia.`,
        mejora:'Exigir a laboratorios contratados que demuestren trazabilidad al INM.' },
      { estandar:'Acreditación ONAC', criterio:'Laboratorio de calibración acreditado ONAC', normativa:'NTC ISO/IEC 17025', resultado:'parcial', puntaje:40, meta:100, impacto:'alto',
        hallazgo:'No verificable automáticamente si laboratorios contratados tienen acreditación ONAC vigente.',
        mejora:'Verificar acreditación en onac.org.co antes de contratar. Exigir certificado.' },
      { estandar:'Equipos de referencia', criterio:'Patrones de medición calibrados y vigentes', normativa:'ISO/IEC 17025:2017 Cláusula 6.4', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto',
        hallazgo:'Sin registro de equipos de referencia o patrones en el sistema.',
        mejora:'Registrar y calibrar los patrones utilizados. Si se terceriza, exigir certificados.' },
    ],
  }
  return CRITERIOS[tipo] || []
}

const RS: Record<string,{bg:string;text:string;border:string;label:string;icon:string}> = {
  cumple:    {bg:'#F0FDF4',text:'#16A34A',border:'#BBF7D0',label:'Cumple',    icon:'ti-check'},
  parcial:   {bg:'#FFFBEB',text:'#D97706',border:'#FDE68A',label:'Parcial',   icon:'ti-alert-triangle'},
  no_cumple: {bg:'#FEF2F2',text:'#DC2626',border:'#FECACA',label:'No cumple', icon:'ti-x'},
}

function ScoreCircle({score,size=110}:{score:number;size?:number}) {
  const color=score>=80?'#16A34A':score>=60?'#D97706':'#DC2626'
  const label=score>=80?'Aprobado':score>=60?'Con observaciones':'No aprobado'
  const r=size*0.38,c=2*Math.PI*r,d=(score/100)*c
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F4F4F5" strokeWidth={size*0.1}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1} strokeDasharray={`${d} ${c-d}`} strokeLinecap="round"/>
      </svg>
      <div style={{textAlign:'center',zIndex:1}}>
        <div style={{fontSize:size*0.2,fontWeight:700,color,lineHeight:1}}>{score}%</div>
        <div style={{fontSize:size*0.1,color:'#A1A1AA',marginTop:2}}>{label}</div>
      </div>
    </div>
  )
}

export default function AuditoriaPage() {
  const [fase, setFase] = useState<'seleccion'|'ejecutando'|'resultado'>('seleccion')
  const [tipoSel, setTipoSel] = useState<string|null>(null)
  const [criterios, setCriterios] = useState<any[]>([])
  const [resumen, setResumen] = useState<any>(null)
  const [tab, setTab] = useState<'resumen'|'detalle'|'plan'>('resumen')
  const [expandidos, setExpandidos] = useState<Record<number,boolean>>({})

  async function ejecutar() {
    if (!tipoSel) return
    setFase('ejecutando')
    const supabase = createClient()
    const INST = '00000000-0000-0000-0000-000000000001'
    const [eqR, mantR, repR] = await Promise.all([
      supabase.from('equipos').select('*').eq('institucion_id',INST).eq('activo',true),
      supabase.from('mantenimientos').select('*').eq('institucion_id',INST),
      supabase.from('repuestos').select('*').eq('institucion_id',INST),
    ])
    const eq   = eqR.data   || []
    const mant = mantR.data || []
    const rep  = repR.data  || []
    const crits = calcularCriterios(tipoSel, eq, mant, rep)
    setCriterios(crits)
    setResumen({
      equipos: eq.length,
      mantenimientos: mant.length,
      repuestos: rep.length,
      preventivos: mant.filter(m=>m.tipo==='preventivo').length,
      correctivos: mant.filter(m=>m.tipo==='correctivo').length,
      operativos: eq.filter(e=>e.estado==='operativo').length,
    })
    setFase('resultado')
    setTab('resumen')
    setExpandidos({})
  }

  const audSel = AUDITORIAS.find(a=>a.id===tipoSel)
  const cumple   = criterios.filter(c=>c.resultado==='cumple').length
  const parcial  = criterios.filter(c=>c.resultado==='parcial').length
  const noCumple = criterios.filter(c=>c.resultado==='no_cumple').length
  const totalPeso = criterios.reduce((a,c)=>a+(c.impacto==='alto'?2:1),0)
  const score = totalPeso>0?Math.round(criterios.reduce((a,c)=>{
    const p=c.resultado==='cumple'?c.puntaje:c.resultado==='parcial'?c.puntaje*0.5:0
    return a+p*(c.impacto==='alto'?2:1)
  },0)/totalPeso):0
  const estandares = [...new Set(criterios.map(c=>c.estandar))]
  const noConf = criterios.filter(c=>c.resultado!=='cumple'&&c.mejora)

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @media print{.no-print{display:none!important}}`}</style>

      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}} className="no-print">
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>BioMed AI / Calidad / Auditoría</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>
            {fase==='seleccion'?'Seleccionar tipo de auditoría':fase==='ejecutando'?'Analizando datos...':audSel?.nombre}
          </h1>
        </div>
        <div style={{display:'flex',gap:8}}>
          {fase==='resultado'&&<>
            <button onClick={()=>{setFase('seleccion');setTipoSel(null);setCriterios([])}} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:12}}>
              <i className="ti ti-arrow-left" style={{fontSize:13}}/> Nueva auditoría
            </button>
            <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'none',background:'#3B4FE8',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:500}}>
              <i className="ti ti-download" style={{fontSize:13}}/> Exportar PDF
            </button>
          </>}
        </div>
      </div>

      <div style={{flex:1,padding:'24px 28px',overflowY:'auto'}}>

        {/* SELECCIÓN */}
        {fase==='seleccion'&&(
          <div style={{maxWidth:960}}>
            <p style={{fontSize:13,color:'#71717A',marginBottom:20}}>
              Selecciona el tipo de auditoría. El sistema consultará tu información real (equipos, mantenimientos, repuestos) y generará el resultado automáticamente.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20}}>
              {AUDITORIAS.map(a=>(
                <div key={a.id} onClick={()=>setTipoSel(a.id)}
                  style={{padding:'18px',borderRadius:12,border:`${tipoSel===a.id?'2px':'0.5px'} solid ${tipoSel===a.id?a.color:'#E4E4E7'}`,background:tipoSel===a.id?a.bg:'#fff',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:9,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className={'ti '+a.icon} style={{fontSize:19,color:a.color}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:2}}>{a.nombre}</div>
                    <div style={{fontSize:11,color:a.color,fontWeight:500}}>{a.subtitulo}</div>
                  </div>
                  {tipoSel===a.id&&<i className="ti ti-check" style={{fontSize:18,color:a.color,flexShrink:0}}/>}
                </div>
              ))}
            </div>
            <button onClick={ejecutar} disabled={!tipoSel}
              style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:tipoSel?'#3B4FE8':'#F4F4F5',color:tipoSel?'#fff':'#A1A1AA',fontSize:14,fontWeight:600,cursor:tipoSel?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <i className="ti ti-search" style={{fontSize:17}}/> Analizar con datos reales del sistema
            </button>
          </div>
        )}

        {/* EJECUTANDO */}
        {fase==='ejecutando'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px',gap:16}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:audSel?.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={'ti '+(audSel?.icon||'ti-search')} style={{fontSize:28,color:audSel?.color}}/>
            </div>
            <div style={{fontSize:15,fontWeight:600,color:'#18181B'}}>Consultando Supabase...</div>
            <div style={{fontSize:13,color:'#71717A',textAlign:'center',maxWidth:400}}>Analizando {resumen?.equipos||'...'} equipos, mantenimientos y repuestos.</div>
            <div style={{display:'flex',gap:8}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#3B4FE8',animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {fase==='resultado'&&criterios.length>0&&(
          <div style={{maxWidth:1000}}>
            <div style={{display:'flex',gap:0,borderBottom:'0.5px solid #E4E4E7',marginBottom:20}}>
              {[{id:'resumen',l:'Resumen ejecutivo'},{id:'detalle',l:'Análisis por criterio'},{id:'plan',l:'Plan de mejora'}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:'9px 16px',border:'none',borderBottom:`2px solid ${tab===t.id?'#3B4FE8':'transparent'}`,background:'transparent',color:tab===t.id?'#3B4FE8':'#71717A',fontSize:13,fontWeight:tab===t.id?500:400,cursor:'pointer'}}>
                  {t.l}
                  {t.id==='plan'&&noConf.length>0&&<span style={{marginLeft:6,padding:'1px 6px',borderRadius:10,background:'#FEF2F2',color:'#DC2626',fontSize:10,fontWeight:600}}>{noConf.length}</span>}
                </button>
              ))}
            </div>

            {tab==='resumen'&&(
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:'#fff',borderRadius:12,border:`0.5px solid ${score>=80?'#BBF7D0':score>=60?'#FDE68A':'#FECACA'}`,padding:'24px',display:'flex',gap:24,alignItems:'center'}}>
                  <ScoreCircle score={score} size={110}/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:8,background:audSel?.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <i className={'ti '+(audSel?.icon||'')} style={{fontSize:17,color:audSel?.color}}/>
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:'#18181B'}}>{audSel?.nombre}</div>
                        <div style={{fontSize:11,color:'#A1A1AA'}}>{audSel?.subtitulo}</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10}}>
                      {[{l:'Criterios',v:criterios.length,c:'#18181B'},{l:'Cumple',v:cumple,c:'#16A34A'},{l:'Parcial',v:parcial,c:'#D97706'},{l:'No cumple',v:noCumple,c:'#DC2626'}].map(s=>(
                        <div key={s.l} style={{textAlign:'center',padding:'10px',borderRadius:8,background:'#F8F9FA'}}>
                          <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
                          <div style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                  <div style={{padding:'14px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Resultado por estándar</div>
                  </div>
                  {estandares.map(est=>{
                    const crit=criterios.filter(c=>c.estandar===est)
                    const avg=Math.round(crit.reduce((a,c)=>a+(c.resultado==='cumple'?c.puntaje:c.resultado==='parcial'?c.puntaje*0.5:0),0)/crit.length)
                    const rs=RS[avg>=80?'cumple':avg>=50?'parcial':'no_cumple']
                    return (
                      <div key={est} style={{padding:'12px 20px',borderBottom:'0.5px solid #F8F9FA',display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:28,height:28,borderRadius:6,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className={'ti '+rs.icon} style={{fontSize:14,color:rs.text}}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{est}</span>
                            <span style={{fontSize:12,fontWeight:600,color:rs.text}}>{avg}%</span>
                          </div>
                          <div style={{height:5,background:'#F4F4F5',borderRadius:3}}>
                            <div style={{height:5,borderRadius:3,width:`${avg}%`,background:avg>=80?'#22C55E':avg>=50?'#F59E0B':'#EF4444'}}/>
                          </div>
                        </div>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500,flexShrink:0,whiteSpace:'nowrap'}}>{rs.label}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{padding:'12px 16px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE',fontSize:12,color:'#3B4FE8',display:'flex',gap:8,flexWrap:'wrap'}}>
                  <i className="ti ti-database" style={{fontSize:14,flexShrink:0}}/>
                  <strong>Datos analizados:</strong>
                  {[{l:'Equipos',v:resumen?.equipos},{l:'Mantenimientos',v:resumen?.mantenimientos},{l:'Repuestos',v:resumen?.repuestos},{l:'Preventivos',v:resumen?.preventivos},{l:'Correctivos',v:resumen?.correctivos}].map(s=>(
                    <span key={s.l}><strong>{s.v?.toLocaleString('es-CO')}</strong> {s.l}</span>
                  ))}
                </div>
              </div>
            )}

            {tab==='detalle'&&(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {criterios.map((c,i)=>{
                  const rs=RS[c.resultado]||RS.no_cumple
                  const exp=expandidos[i]
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,border:`0.5px solid ${c.resultado==='no_cumple'?'#FECACA':c.resultado==='parcial'?'#FDE68A':'#E4E4E7'}`,overflow:'hidden'}}>
                      <div onClick={()=>setExpandidos(p=>({...p,[i]:!p[i]}))} style={{padding:'13px 18px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{width:32,height:32,borderRadius:8,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className={'ti '+rs.icon} style={{fontSize:16,color:rs.text}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:4}}>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'#F4F4F5',color:'#71717A'}}>{c.estandar}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:c.impacto==='alto'?'#FEF2F2':'#FFFBEB',color:c.impacto==='alto'?'#DC2626':'#D97706',fontWeight:500}}>Impacto {c.impacto}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'#F8F9FA',color:'#A1A1AA'}}>{c.normativa}</span>
                          </div>
                          <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:5}}>{c.criterio}</div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:5,background:'#F4F4F5',borderRadius:3,maxWidth:200}}>
                              <div style={{height:5,borderRadius:3,width:`${c.puntaje}%`,background:rs.text}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:600,color:rs.text}}>{c.puntaje}%</span>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                          </div>
                        </div>
                        <i className={'ti '+(exp?'ti-chevron-up':'ti-chevron-down')} style={{fontSize:13,color:'#A1A1AA',flexShrink:0}}/>
                      </div>
                      {exp&&(
                        <div style={{borderTop:'0.5px solid #F4F4F5',padding:'13px 18px',background:'#FAFAFA',display:'flex',flexDirection:'column',gap:8}}>
                          <div style={{padding:'9px 13px',borderRadius:7,background:rs.bg,border:`0.5px solid ${rs.border}`}}>
                            <div style={{fontSize:11,fontWeight:500,color:rs.text,marginBottom:3}}>📋 Hallazgo</div>
                            <div style={{fontSize:12,color:'#52525B',lineHeight:1.6}}>{c.hallazgo}</div>
                          </div>
                          {c.mejora&&(
                            <div style={{padding:'9px 13px',borderRadius:7,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#3B4FE8',marginBottom:3}}>💡 Acción de mejora</div>
                              <div style={{fontSize:12,color:'#3F3F46',lineHeight:1.6}}>{c.mejora}</div>
                            </div>
                          )}
                          <div style={{fontSize:11,color:'#A1A1AA'}}>Meta: {c.meta}% · Actual: {c.puntaje}% · Brecha: {Math.max(c.meta-c.puntaje,0)}%</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {tab==='plan'&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {noConf.length===0?(
                  <div style={{textAlign:'center',padding:'48px',background:'#F0FDF4',borderRadius:12,border:'0.5px solid #BBF7D0'}}>
                    <i className="ti ti-award" style={{fontSize:40,color:'#16A34A',display:'block',marginBottom:10}}/>
                    <div style={{fontSize:18,fontWeight:700,color:'#16A34A',marginBottom:4}}>¡Sin no conformidades!</div>
                    <div style={{fontSize:13,color:'#71717A'}}>La institución cumple con todos los criterios evaluados.</div>
                  </div>
                ):(
                  <>
                    <div style={{padding:'10px 14px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE',fontSize:13,color:'#3B4FE8',display:'flex',gap:8}}>
                      <i className="ti ti-info-circle" style={{fontSize:15,flexShrink:0}}/>{noConf.length} hallazgos requieren acción. Ordenados por impacto.
                    </div>
                    {noConf.sort((a,b)=>({no_cumple:0,parcial:1}[a.resultado]||1)-({no_cumple:0,parcial:1}[b.resultado]||1)).map((c,i)=>{
                      const rs=RS[c.resultado]
                      const plazoColor=c.impacto==='alto'?'#DC2626':'#D97706'
                      return (
                        <div key={i} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                          <div style={{padding:'12px 18px',borderBottom:'0.5px solid #F4F4F5',display:'flex',gap:10,alignItems:'center'}}>
                            <div style={{width:24,height:24,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#3B4FE8',flexShrink:0}}>{i+1}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:3}}>{c.criterio}</div>
                              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F4F4F5',color:'#71717A'}}>{c.estandar}</span>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F4F4F5',color:'#71717A'}}>{c.normativa}</span>
                              </div>
                            </div>
                            <div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontSize:10,color:'#A1A1AA'}}>Plazo</div>
                              <div style={{fontSize:11,fontWeight:700,color:plazoColor}}>{c.impacto==='alto'?'≤ 30 días':'≤ 90 días'}</div>
                            </div>
                          </div>
                          <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:7}}>
                            <div style={{padding:'8px 12px',borderRadius:7,background:'#FEF2F2',border:'0.5px solid #FECACA'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#DC2626',marginBottom:2}}>Hallazgo</div>
                              <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.hallazgo}</div>
                            </div>
                            <div style={{padding:'8px 12px',borderRadius:7,background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#16A34A',marginBottom:2}}>Acción de mejora</div>
                              <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.mejora}</div>
                            </div>
                            <div style={{fontSize:11,color:'#A1A1AA'}}>
                              Puntaje actual: <strong style={{color:'#18181B'}}>{c.puntaje}%</strong> · Meta: <strong style={{color:'#18181B'}}>{c.meta}%</strong> · Brecha: <strong style={{color:plazoColor}}>{Math.max(c.meta-c.puntaje,0)}%</strong>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
