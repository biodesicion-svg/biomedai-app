'use client'
import { useState, useEffect } from 'react'

const AUDITORIAS = [
  {
    id: 'habilitacion',
    nombre: 'Auditoría de Habilitación',
    subtitulo: 'Resolución 3100 de 2019 — Ministerio de Salud',
    icon: 'ti-building-hospital',
    color: '#3B4FE8',
    bg: '#EEF2FF',
    aplica: 'Hospitales, Clínicas, IPS, Consultorios, Laboratorios',
    descripcion: 'Verifica los 7 estándares de habilitación exigidos por el MSPS para la prestación de servicios de salud.',
    estandares: ['Talento humano','Infraestructura','Dotación','Medicamentos e insumos','Procesos prioritarios','Historia clínica y registros','Interdependencia de servicios'],
  },
  {
    id: 'biomedica',
    nombre: 'Auditoría de Equipos Biomédicos',
    subtitulo: 'Res. 4816/2008 · Dentro de Habilitación',
    icon: 'ti-device-heart-monitor',
    color: '#7C3AED',
    bg: '#F5F3FF',
    aplica: 'IPS con equipos biomédicos',
    descripcion: 'Revisa inventario, hojas de vida, plan de mantenimiento, calibraciones y documentación técnica de cada equipo.',
    estandares: ['Inventario biomédico completo','Hojas de vida individuales','Plan y cronograma de mantenimiento','Calibraciones vigentes','Órdenes de trabajo con firmas','Repuestos e insumos'],
  },
  {
    id: 'tecnovigilancia',
    nombre: 'Auditoría de Tecnovigilancia',
    subtitulo: 'Programa Nacional INVIMA · Res. 4816/2008',
    icon: 'ti-shield-check',
    color: '#D97706',
    bg: '#FFFBEB',
    aplica: 'Toda IPS que use dispositivos médicos',
    descripcion: 'Verifica el programa de tecnovigilancia, reporte de eventos adversos, alertas sanitarias y gestión de incidentes.',
    estandares: ['Programa de tecnovigilancia','Responsable designado','Reporte de eventos adversos','Alertas sanitarias','Formatos de reporte','Capacitación del personal'],
  },
  {
    id: 'pamec',
    nombre: 'Auditoría PAMEC',
    subtitulo: 'Programa de Auditoría para el Mejoramiento de la Calidad',
    icon: 'ti-chart-arrows-vertical',
    color: '#0891B2',
    bg: '#F0F9FF',
    aplica: 'Toda institución del Sistema de Salud',
    descripcion: 'Evalúa seguridad del paciente, indicadores de calidad, eventos adversos y planes de mejora continua.',
    estandares: ['Seguridad del paciente','Indicadores de calidad','Gestión de eventos adversos','Planes de mejora','Gestión del riesgo','Mejora continua'],
  },
  {
    id: 'acreditacion',
    nombre: 'Acreditación en Salud',
    subtitulo: 'ICONTEC · No obligatoria · Nivel superior',
    icon: 'ti-award',
    color: '#16A34A',
    bg: '#F0FDF4',
    aplica: 'IPS que buscan nivel superior a habilitación',
    descripcion: 'Evalúa estándares superiores de calidad: gestión clínica, tecnológica, humanización y liderazgo organizacional.',
    estandares: ['Seguridad del paciente','Gestión clínica','Gestión tecnológica biomédica','Mantenimiento biomédico','Humanización del servicio','Gestión documental','Liderazgo organizacional'],
  },
  {
    id: 'secretaria',
    nombre: 'Visita Secretaría de Salud',
    subtitulo: 'Secretarías Departamentales o Distritales',
    icon: 'ti-building-community',
    color: '#DC2626',
    bg: '#FEF2F2',
    aplica: 'Toda IPS habilitada',
    descripcion: 'Visitas programadas, de seguimiento o por quejas. Pueden realizarse sin previo aviso.',
    estandares: ['Habilitación vigente','Equipos biomédicos','Infraestructura','Medicamentos','Talento humano','Documentación'],
  },
  {
    id: 'supersalud',
    nombre: 'Auditoría Supersalud',
    subtitulo: 'Superintendencia Nacional de Salud',
    icon: 'ti-scale',
    color: '#7C3AED',
    bg: '#F5F3FF',
    aplica: 'Toda EPS, IPS y entidades del sistema',
    descripcion: 'Auditorías de alto impacto. Pueden terminar en multas, planes de mejoramiento o suspensión de servicios.',
    estandares: ['Calidad de atención','Seguridad del paciente','Gestión financiera','Cumplimiento normativo','Habilitación','Indicadores'],
  },
  {
    id: 'iso9001',
    nombre: 'ISO 9001:2015',
    subtitulo: 'Sistema de Gestión de Calidad · Internacional',
    icon: 'ti-certificate',
    color: '#0891B2',
    bg: '#F0F9FF',
    aplica: 'Organizaciones que buscan certificación internacional',
    descripcion: 'Revisa el sistema de gestión de calidad, procesos, indicadores y mejora continua.',
    estandares: ['Sistema de gestión de calidad','Control de procesos','Indicadores de desempeño','Mejora continua','Gestión de riesgos','Auditoría interna'],
  },
  {
    id: 'iso13485',
    nombre: 'ISO 13485',
    subtitulo: 'Dispositivos médicos · Gestión de calidad',
    icon: 'ti-certificate-2',
    color: '#16A34A',
    bg: '#F0FDF4',
    aplica: 'Fabricantes, distribuidores y empresas biomédicas',
    descripcion: 'Especializada en dispositivos médicos y equipos biomédicos. Muy valorada en ingeniería clínica.',
    estandares: ['Gestión del ciclo de vida del dispositivo','Control de diseño','Trazabilidad','Gestión de proveedores','Control de calidad','Acciones correctivas'],
  },
  {
    id: 'iso17025',
    nombre: 'ISO 17025',
    subtitulo: 'Laboratorios de calibración y ensayo',
    icon: 'ti-microscope',
    color: '#D97706',
    bg: '#FFFBEB',
    aplica: 'Laboratorios de calibración · Contratistas biomédicos',
    descripcion: 'Aplica cuando la IPS contrata empresas para calibrar equipos. Verifica competencia técnica del laboratorio.',
    estandares: ['Competencia técnica del personal','Trazabilidad metrológica','Incertidumbre de medición','Equipos de referencia','Procedimientos documentados','Acreditación ONAC'],
  },
]

// Criterios por tipo de auditoría
function getCriterios(tipo: string, datos: any) {
  const eq  = datos?.equipos  || []
  const mant = datos?.mantenimientos || []
  const rep  = datos?.repuestos || []
  const anioActual = new Date().getFullYear()

  const sinSerie       = eq.filter((e:any)=>!e.serie)
  const sinMarca       = eq.filter((e:any)=>!e.marca)
  const sinClaseInvima = eq.filter((e:any)=>!e.clase_invima)
  const sinAnioAdq     = eq.filter((e:any)=>!e.anio_adquisicion)
  const sinVidaUtil    = eq.filter((e:any)=>!e.vida_util_anos)
  const altoRiesgo     = eq.filter((e:any)=>e.riesgo==='alto')
  const operativos     = eq.filter((e:any)=>e.estado==='operativo')
  const completados    = mant.filter((m:any)=>m.estado==='completado')
  const preventivos    = mant.filter((m:any)=>m.tipo==='preventivo')
  const correctivos    = mant.filter((m:any)=>m.tipo==='correctivo')
  const sinFechaReal   = mant.filter((m:any)=>!m.fecha_realizado)
  const sinCosto       = mant.filter((m:any)=>!m.costo_total||m.costo_total===0)
  const sinDuracion    = mant.filter((m:any)=>!m.duracion_horas)
  const sinDescripcion = mant.filter((m:any)=>!m.descripcion||m.descripcion.length<5)
  const sinStock       = rep.filter((r:any)=>r.stock_actual===0)
  const stockBajo      = rep.filter((r:any)=>r.stock_actual>0&&r.stock_actual<=r.stock_minimo)
  const eqConMant      = new Set(mant.map((m:any)=>m.equipo_id))
  const sinMant        = eq.filter((e:any)=>!eqConMant.has(e.id))
  const completos      = eq.filter((e:any)=>e.serie&&e.marca&&e.clase_invima&&e.anio_adquisicion)
  const pctCompletos   = eq.length>0?Math.round((completos.length/eq.length)*100):0
  const pctCumpl       = mant.length>0?Math.round((completados.length/mant.length)*100):0
  const pctDoc         = mant.length>0?Math.round(((mant.length-sinDescripcion.length)/mant.length)*100):0
  const mesesCubiertos = new Set(mant.map((m:any)=>m.fecha_programada?.substring(0,7))).size
  const pctCronograma  = Math.min(Math.round((mesesCubiertos/12)*100),100)
  const pctStock       = rep.length>0?Math.round(((rep.length-sinStock.length-stockBajo.length)/rep.length)*100):100

  const CRITERIOS: Record<string,any[]> = {
    habilitacion: [
      { estandar:'Talento humano', criterio:'Responsable de ingeniería biomédica designado', normativa:'Res. 3100/2019', resultado: pctCompletos>0?'parcial':'no_cumple', puntaje:50, meta:100, impacto:'alto', hallazgo:'No es posible verificar desde el sistema si existe un responsable formal designado. Se requiere verificar documentación RH.', mejora:'Designar formalmente un Ingeniero Biomédico o Tecnólogo Biomédico responsable del programa. Documentar en acto administrativo.' },
      { estandar:'Dotación', criterio:'Inventario de equipos biomédicos completo', normativa:'Res. 3100/2019 · Res. 4816/2008', resultado: pctCompletos>=80?'cumple':pctCompletos>=50?'parcial':'no_cumple', puntaje:pctCompletos, meta:100, impacto:'alto', hallazgo:`${completos.length} de ${eq.length} equipos con datos completos (${pctCompletos}%). Faltan: ${sinSerie.length} sin serie, ${sinMarca.length} sin marca, ${sinClaseInvima.length} sin clase INVIMA.`, mejora: pctCompletos<100?`Completar datos de ${eq.length-completos.length} equipos. Priorizar equipos clase IIb y III (alto riesgo: ${altoRiesgo.length} equipos).`:null },
      { estandar:'Dotación', criterio:'Equipos con registro INVIMA y clasificación de riesgo', normativa:'Dec. 4725/2005', resultado: sinClaseInvima.length===0?'cumple':sinClaseInvima.length<eq.length*0.2?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinClaseInvima.length)/Math.max(eq.length,1))*100), meta:100, impacto:'alto', hallazgo:`${sinClaseInvima.length} equipos sin clasificación INVIMA. ${eq.length-sinClaseInvima.length} equipos clasificados correctamente.`, mejora:sinClaseInvima.length>0?'Consultar portal web.invima.gov.co para cada equipo y registrar la clase (I, IIa, IIb, III).':null },
      { estandar:'Procesos prioritarios', criterio:'Plan anual de mantenimiento preventivo', normativa:'Res. 4816/2008 Art. 7', resultado: pctCumpl>=80?'cumple':pctCumpl>=60?'parcial':'no_cumple', puntaje:pctCumpl, meta:80, impacto:'alto', hallazgo:`Cumplimiento del ${pctCumpl}%. ${completados.length} de ${mant.length} intervenciones completadas. Cronograma cubre ${mesesCubiertos}/12 meses.`, mejora:pctCumpl<80?`Establecer cronograma formal distribuido en todos los meses. Actualmente ${sinFechaReal.length} mantenimientos sin fecha de realización.`:null },
      { estandar:'Procesos prioritarios', criterio:'Hojas de vida actualizadas de todos los equipos', normativa:'Res. 4816/2008 Art. 6', resultado: sinMant.length===0?'cumple':sinMant.length<eq.length*0.1?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinMant.length)/Math.max(eq.length,1))*100), meta:100, impacto:'alto', hallazgo:`${sinMant.length} equipos (${Math.round((sinMant.length/Math.max(eq.length,1))*100)}%) sin ningún registro de mantenimiento. ${eq.length-sinMant.length} con historial.`, mejora:sinMant.length>0?'Registrar al menos la recepción técnica inicial de los equipos sin historial.':null },
      { estandar:'Historia clínica y registros', criterio:'Órdenes de trabajo con descripción y evidencia', normativa:'Res. 4816/2008 Art. 8', resultado: pctDoc>=80?'cumple':pctDoc>=50?'parcial':'no_cumple', puntaje:pctDoc, meta:80, impacto:'medio', hallazgo:`${mant.length-sinDescripcion.length} de ${mant.length} intervenciones documentadas (${pctDoc}%). ${sinDuracion.length} sin duración registrada.`, mejora:pctDoc<80?'Exigir descripción obligatoria en cada orden de trabajo. Registrar duración, técnico responsable y hallazgos.':null },
      { estandar:'Dotación', criterio:'Stock de repuestos e insumos biomédicos', normativa:'Res. 3100/2019', resultado: sinStock.length===0&&stockBajo.length===0?'cumple':sinStock.length===0?'parcial':'no_cumple', puntaje:pctStock, meta:90, impacto:'medio', hallazgo:`${sinStock.length} repuestos sin stock, ${stockBajo.length} con stock bajo. ${rep.length-sinStock.length-stockBajo.length} en nivel óptimo de ${rep.length} total.`, mejora:(sinStock.length>0||stockBajo.length>0)?`Reponer: ${[...sinStock,...stockBajo].slice(0,3).map((r:any)=>r.nombre).join(', ')}`:null },
    ],
    biomedica: [
      { estandar:'Inventario biomédico', criterio:'Nombre, marca, modelo y serie registrados', normativa:'Res. 4816/2008 Art. 5', resultado: pctCompletos>=90?'cumple':pctCompletos>=70?'parcial':'no_cumple', puntaje:pctCompletos, meta:100, impacto:'alto', hallazgo:`${completos.length}/${eq.length} equipos completos. Sin serie: ${sinSerie.length}, sin marca: ${sinMarca.length}, sin año adquisición: ${sinAnioAdq.length}.`, mejora:pctCompletos<100?'Completar datos desde placa del equipo y manual del fabricante. Registrar en el sistema uno por uno.':null },
      { estandar:'Inventario biomédico', criterio:'Clasificación de riesgo INVIMA documentada', normativa:'Dec. 4725/2005', resultado: sinClaseInvima.length===0?'cumple':sinClaseInvima.length<eq.length*0.1?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinClaseInvima.length)/Math.max(eq.length,1))*100), meta:100, impacto:'alto', hallazgo:`${sinClaseInvima.length} equipos sin clase INVIMA. Alto riesgo clase IIb/III: ${altoRiesgo.length} equipos.`, mejora:sinClaseInvima.length>0?'Buscar cada equipo en web.invima.gov.co y registrar la clase asignada.':null },
      { estandar:'Inventario biomédico', criterio:'Vida útil definida para cada equipo', normativa:'Res. 4816/2008', resultado: sinVidaUtil.length===0?'cumple':sinVidaUtil.length<eq.length*0.3?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinVidaUtil.length)/Math.max(eq.length,1))*100), meta:90, impacto:'medio', hallazgo:`${sinVidaUtil.length} equipos sin vida útil definida (${Math.round((sinVidaUtil.length/Math.max(eq.length,1))*100)}%).`, mejora:'Definir vida útil según ficha técnica del fabricante o tabla OPS/OMS por tipo de equipo.' },
      { estandar:'Hojas de vida', criterio:'Todos los equipos con al menos una intervención registrada', normativa:'Res. 4816/2008 Art. 6', resultado: sinMant.length===0?'cumple':sinMant.length<eq.length*0.05?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinMant.length)/Math.max(eq.length,1))*100), meta:100, impacto:'alto', hallazgo:`${sinMant.length} equipos sin ningún registro. ${eq.length-sinMant.length} con historial documentado.`, mejora:sinMant.length>0?'Registrar mínimo recepción técnica inicial para los equipos sin historial. Priorizar equipos de soporte vital.':null },
      { estandar:'Plan de mantenimiento', criterio:'Cronograma anual con cobertura de todos los meses', normativa:'Res. 4816/2008 Art. 7', resultado: pctCronograma>=80?'cumple':pctCronograma>=50?'parcial':'no_cumple', puntaje:pctCronograma, meta:80, impacto:'alto', hallazgo:`Cronograma cubre ${mesesCubiertos}/12 meses. Total intervenciones: ${mant.length} (${preventivos.length} prev, ${correctivos.length} corr).`, mejora:pctCronograma<80?'Distribuir el cronograma en los 12 meses del año. Usar el módulo de mantenimiento para distribución automática.':null },
      { estandar:'Plan de mantenimiento', criterio:'Cumplimiento del plan preventivo ≥ 80%', normativa:'Res. 4816/2008 Art. 7', resultado: pctCumpl>=80?'cumple':pctCumpl>=60?'parcial':'no_cumple', puntaje:pctCumpl, meta:80, impacto:'alto', hallazgo:`${completados.length}/${mant.length} completados (${pctCumpl}%). ${sinFechaReal.length} sin fecha de ejecución real.`, mejora:pctCumpl<80?`Registrar fecha real de ejecución en todos los mantenimientos. Actualmente ${sinFechaReal.length} sin este dato.`:null },
      { estandar:'Calibraciones', criterio:'Equipos de medición con calibración documentada', normativa:'NTC ISO/IEC 17025', resultado: mant.filter((m:any)=>m.tipo==='calibracion').length>0?'parcial':'no_cumple', puntaje:mant.filter((m:any)=>m.tipo==='calibracion').length>0?60:0, meta:100, impacto:'alto', hallazgo:`${mant.filter((m:any)=>m.tipo==='calibracion').length} calibraciones registradas. Monitores, desfibriladores, bombas y ventiladores requieren calibración periódica.`, mejora:'Programar calibraciones con laboratorio acreditado por ONAC. Registrar certificados en el sistema.' },
      { estandar:'Órdenes de trabajo', criterio:'Registros con costo, duración y responsable', normativa:'Res. 4816/2008 Art. 8', resultado: pctDoc>=80?'cumple':pctDoc>=50?'parcial':'no_cumple', puntaje:pctDoc, meta:80, impacto:'medio', hallazgo:`${sinCosto.length} sin costo, ${sinDuracion.length} sin duración. Documentación completa: ${pctDoc}%.`, mejora:'Completar costos en COP y duraciones de todas las intervenciones históricas.' },
      { estandar:'Repuestos', criterio:'Stock de repuestos críticos disponible', normativa:'Res. 3100/2019', resultado: sinStock.length===0?'cumple':stockBajo.length<3?'parcial':'no_cumple', puntaje:pctStock, meta:90, impacto:'medio', hallazgo:`${sinStock.length} agotados, ${stockBajo.length} stock bajo, ${rep.length-sinStock.length-stockBajo.length} óptimo.`, mejora:(sinStock.length>0||stockBajo.length>0)?'Generar orden de compra para repuestos críticos con stock bajo.':null },
    ],
    tecnovigilancia: [
      { estandar:'Programa', criterio:'Programa de tecnovigilancia documentado', normativa:'Res. 4816/2008 Art. 15', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No se detecta programa de tecnovigilancia formal en el sistema. Este es un requisito obligatorio ante el INVIMA.', mejora:'Elaborar y aprobar el Programa de Tecnovigilancia institucional. Incluir: objetivos, responsable, procedimientos de reporte y seguimiento.' },
      { estandar:'Responsable', criterio:'Responsable de tecnovigilancia designado formalmente', normativa:'Res. 4816/2008', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay evidencia en el sistema de un responsable formal designado ante el INVIMA.', mejora:'Designar responsable mediante acto administrativo y registrar en el portal de tecnovigilancia del INVIMA.' },
      { estandar:'Reporte de eventos', criterio:'Registro de eventos adversos con dispositivos médicos', normativa:'Res. 4816/2008 · Dec. 4725/2005', resultado: correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?40:0, meta:100, impacto:'alto', hallazgo:`${correctivos.length} correctivos registrados que podrían contener reportes de fallas. Sin categorización formal de eventos adversos.`, mejora:'Implementar formato de reporte de eventos adversos. Categorizar fallas como: incidente, casi incidente o evento adverso.' },
      { estandar:'Alertas sanitarias', criterio:'Sistema de seguimiento de alertas INVIMA', normativa:'Circular INVIMA', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay registro en el sistema de seguimiento de alertas sanitarias o retiro de dispositivos del mercado.', mejora:'Suscribirse a las alertas del INVIMA en invima.gov.co. Registrar en el sistema cuando un equipo tiene alerta activa.' },
      { estandar:'Capacitación', criterio:'Personal capacitado en reporte de fallas biomédicas', normativa:'Res. 4816/2008', resultado:'no_cumple', puntaje:0, meta:100, impacto:'medio', hallazgo:'No hay evidencia en el sistema de capacitaciones realizadas al personal sobre tecnovigilancia.', mejora:'Programar capacitación anual al personal asistencial sobre identificación y reporte de fallas en dispositivos médicos.' },
      { estandar:'Documentación', criterio:'Hojas de vida con registro de fallas y hallazgos', normativa:'Res. 4816/2008 Art. 8', resultado: mant.filter((m:any)=>m.hallazgos&&m.hallazgos.length>5).length>0?'parcial':'no_cumple', puntaje:Math.round((mant.filter((m:any)=>m.hallazgos&&m.hallazgos.length>5).length/Math.max(mant.length,1))*100), meta:80, impacto:'medio', hallazgo:`${mant.filter((m:any)=>m.hallazgos&&m.hallazgos.length>5).length} intervenciones con hallazgos documentados de ${mant.length} total.`, mejora:'Registrar hallazgos en cada intervención correctiva. Clasificar por tipo de falla.' },
    ],
    pamec: [
      { estandar:'Seguridad del paciente', criterio:'Identificación y gestión de riesgos tecnológicos', normativa:'SOGCS · Decreto 1011/2006', resultado: altoRiesgo.length>0?'parcial':'cumple', puntaje:altoRiesgo.length>0?60:90, meta:90, impacto:'alto', hallazgo:`${altoRiesgo.length} equipos de alto riesgo identificados. ${operativos.length} equipos operativos de ${eq.length} total.`, mejora:altoRiesgo.length>0?`Documentar plan de contingencia para los ${altoRiesgo.length} equipos de alto riesgo. Priorizar equipos de soporte vital.`:null },
      { estandar:'Indicadores de calidad', criterio:'MTBF, MTTR y disponibilidad calculados y reportados', normativa:'SOGCS · Indicadores OPS', resultado: mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?55:0, meta:80, impacto:'alto', hallazgo:`Sistema calcula KPIs automáticamente. Disponibilidad: ${Math.round((operativos.length/Math.max(eq.length,1))*100)}%. Ratio prev/corr: ${correctivos.length>0?(preventivos.length/correctivos.length).toFixed(1):'N/D'}.`, mejora:'Reportar KPIs mensualmente a la dirección. Establecer metas y umbrales de alerta institucionales.' },
      { estandar:'Eventos adversos', criterio:'Registro y análisis de fallas de equipos', normativa:'Res. 4816/2008 · SOGCS', resultado: correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?45:0, meta:80, impacto:'alto', hallazgo:`${correctivos.length} mantenimientos correctivos registrados. Sin categorización formal de eventos adversos relacionados con tecnología.`, mejora:'Clasificar cada correctivo como: falla mecánica, eléctrica, de software o de usuario. Analizar causas raíz mensualmente.' },
      { estandar:'Planes de mejora', criterio:'Plan de mejoramiento documentado con indicadores', normativa:'SOGCS', resultado:'no_cumple', puntaje:0, meta:100, impacto:'medio', hallazgo:'No hay evidencia de planes de mejora formales documentados en el sistema para el área biomédica.', mejora:'Crear plan de mejora con: problema identificado, meta, acciones, responsable, plazo e indicador de seguimiento.' },
      { estandar:'Gestión del riesgo', criterio:'Equipos de alto riesgo con mantenimiento preventivo al día', normativa:'SOGCS · Res. 4816/2008', resultado: altoRiesgo.filter((e:any)=>eqConMant.has(e.id)).length===altoRiesgo.length?'cumple':altoRiesgo.filter((e:any)=>eqConMant.has(e.id)).length>altoRiesgo.length*0.7?'parcial':'no_cumple', puntaje:Math.round((altoRiesgo.filter((e:any)=>eqConMant.has(e.id)).length/Math.max(altoRiesgo.length,1))*100), meta:100, impacto:'alto', hallazgo:`${altoRiesgo.filter((e:any)=>eqConMant.has(e.id)).length} de ${altoRiesgo.length} equipos de alto riesgo con mantenimiento registrado.`, mejora:altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length>0?`${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} equipos de alto riesgo sin intervención. Programar mantenimiento inmediato.`:null },
    ],
    acreditacion: [
      { estandar:'Gestión tecnológica', criterio:'Inventario biomédico completo y actualizado', normativa:'ICONTEC · Estándares de acreditación', resultado: pctCompletos>=90?'cumple':pctCompletos>=70?'parcial':'no_cumple', puntaje:pctCompletos, meta:95, impacto:'alto', hallazgo:`Completitud del inventario: ${pctCompletos}%. ${completos.length}/${eq.length} equipos con todos los campos.`, mejora:pctCompletos<95?'Para acreditación se requiere inventario 100% completo incluyendo vida útil, año de adquisición y valor.':null },
      { estandar:'Mantenimiento biomédico', criterio:'Cumplimiento preventivo ≥ 90% (acreditación exige más)', normativa:'ICONTEC · Estándares superiores', resultado: pctCumpl>=90?'cumple':pctCumpl>=70?'parcial':'no_cumple', puntaje:pctCumpl, meta:90, impacto:'alto', hallazgo:`Cumplimiento actual: ${pctCumpl}%. Para acreditación ICONTEC se requiere mínimo 90%.`, mejora:pctCumpl<90?'Aumentar frecuencia de mantenimiento preventivo. Implementar sistema de alertas para vencimientos.':null },
      { estandar:'Gestión documental', criterio:'Documentación técnica completa de todas las intervenciones', normativa:'ICONTEC', resultado: pctDoc>=85?'cumple':pctDoc>=65?'parcial':'no_cumple', puntaje:pctDoc, meta:90, impacto:'alto', hallazgo:`${pctDoc}% de intervenciones documentadas. Para acreditación se requiere trazabilidad total.`, mejora:'Completar descripción, duración, costo y firma en todas las intervenciones históricas.' },
      { estandar:'Seguridad del paciente', criterio:'Plan de contingencia para equipos críticos documentado', normativa:'ICONTEC', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay evidencia de planes de contingencia formales para equipos de soporte vital en el sistema.', mejora:'Documentar plan de contingencia por equipo crítico: equipo de reemplazo, proveedor de respaldo, tiempo máximo de indisponibilidad.' },
      { estandar:'Liderazgo organizacional', criterio:'Indicadores biomédicos reportados a dirección mensualmente', normativa:'ICONTEC', resultado: mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?50:0, meta:100, impacto:'medio', hallazgo:'KPIs calculados automáticamente pero sin evidencia de presentación formal a comité de dirección.', mejora:'Generar informe ejecutivo mensual con KPIs y presentar en comité de calidad. Documentar actas.' },
      { estandar:'Gestión clínica', criterio:'Equipos calibrados por laboratorios ONAC', normativa:'NTC ISO/IEC 17025 · ICONTEC', resultado: mant.filter((m:any)=>m.tipo==='calibracion').length>0?'parcial':'no_cumple', puntaje:mant.filter((m:any)=>m.tipo==='calibracion').length>0?50:0, meta:100, impacto:'alto', hallazgo:`${mant.filter((m:any)=>m.tipo==='calibracion').length} calibraciones en sistema. Para acreditación se requiere certificado de laboratorio ONAC.`, mejora:'Contratar laboratorio acreditado ONAC para calibración de equipos de medición críticos.' },
    ],
    secretaria: [
      { estandar:'Habilitación', criterio:'Registro de habilitación vigente', normativa:'Res. 3100/2019', resultado:'parcial', puntaje:50, meta:100, impacto:'alto', hallazgo:'No se puede verificar desde el sistema si el registro de habilitación está vigente. Requiere verificación manual.', mejora:'Verificar vigencia del registro en el portal del ente territorial. Mantener copia digital en el sistema.' },
      { estandar:'Equipos biomédicos', criterio:'Inventario actualizado y disponible para inspección', normativa:'Res. 4816/2008', resultado: pctCompletos>=70?'parcial':'no_cumple', puntaje:pctCompletos, meta:100, impacto:'alto', hallazgo:`Inventario al ${pctCompletos}% de completitud. ${eq.length} equipos registrados. Posibles observaciones en ${eq.length-completos.length} equipos con datos incompletos.`, mejora:'Completar todos los campos antes de una visita. Tener inventario impreso y firmado disponible.' },
      { estandar:'Equipos biomédicos', criterio:'Hojas de vida con historial de mantenimiento', normativa:'Res. 4816/2008 Art. 6', resultado: sinMant.length<eq.length*0.05?'cumple':sinMant.length<eq.length*0.2?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinMant.length)/Math.max(eq.length,1))*100), meta:95, impacto:'alto', hallazgo:`${eq.length-sinMant.length} equipos con historial. ${sinMant.length} sin ningún registro. Inspectores revisarán una muestra aleatoria.`, mejora:'Priorizar completar hojas de vida de equipos sin historial antes de una visita programada.' },
      { estandar:'Mantenimiento', criterio:'Cronograma vigente y evidencias de ejecución', normativa:'Res. 4816/2008 Art. 7', resultado: pctCumpl>=80&&pctCronograma>=70?'cumple':pctCumpl>=60?'parcial':'no_cumple', puntaje:Math.round((pctCumpl+pctCronograma)/2), meta:80, impacto:'alto', hallazgo:`Cumplimiento: ${pctCumpl}%. Cobertura mensual: ${mesesCubiertos}/12 meses. ${sinFechaReal.length} sin fecha de ejecución.`, mejora:'Tener disponible el cronograma firmado y las órdenes de trabajo de al menos el año en curso.' },
      { estandar:'Documentación', criterio:'Registros de mantenimiento con firmas de responsables', normativa:'Res. 4816/2008', resultado: pctDoc>=70?'parcial':'no_cumple', puntaje:pctDoc, meta:90, impacto:'medio', hallazgo:`${pctDoc}% de intervenciones con descripción. Los inspectores solicitarán órdenes de trabajo firmadas.`, mejora:'Implementar firma digital o física en todas las órdenes de trabajo del año en curso.' },
    ],
    supersalud: [
      { estandar:'Calidad de atención', criterio:'Indicadores de disponibilidad de equipos', normativa:'Supersalud · Circular 049', resultado: operativos.length/Math.max(eq.length,1)>=0.8?'cumple':'parcial', puntaje:Math.round((operativos.length/Math.max(eq.length,1))*100), meta:90, impacto:'alto', hallazgo:`Disponibilidad: ${Math.round((operativos.length/Math.max(eq.length,1))*100)}%. ${operativos.length} operativos de ${eq.length} total. Supersalud exige mínimo 90%.`, mejora:'Reducir equipos en mantenimiento o fuera de servicio. Documentar causa de cada equipo no operativo.' },
      { estandar:'Seguridad del paciente', criterio:'Equipos de soporte vital operativos y mantenidos', normativa:'Supersalud', resultado: altoRiesgo.filter((e:any)=>e.estado==='operativo').length===altoRiesgo.length?'cumple':'parcial', puntaje:Math.round((altoRiesgo.filter((e:any)=>e.estado==='operativo').length/Math.max(altoRiesgo.length,1))*100), meta:100, impacto:'alto', hallazgo:`${altoRiesgo.filter((e:any)=>e.estado==='operativo').length} de ${altoRiesgo.length} equipos alto riesgo operativos. ${altoRiesgo.filter((e:any)=>e.estado!=='operativo').length} no operativos.`, mejora:'Priorizar reparación de equipos de alto riesgo no operativos. Documentar causa y tiempo estimado de reparación.' },
      { estandar:'Cumplimiento normativo', criterio:'Plan de mantenimiento con cumplimiento documentado', normativa:'Res. 4816/2008 · Supersalud', resultado: pctCumpl>=80?'cumple':pctCumpl>=60?'parcial':'no_cumple', puntaje:pctCumpl, meta:80, impacto:'alto', hallazgo:`Cumplimiento del plan: ${pctCumpl}%. Supersalud puede solicitar evidencias de los últimos 2 años.`, mejora:'Mantener archivo histórico de órdenes de trabajo organizadas por año y por equipo.' },
      { estandar:'Habilitación', criterio:'Dotación mínima por servicio habilitado', normativa:'Res. 3100/2019', resultado:'parcial', puntaje:60, meta:100, impacto:'alto', hallazgo:`${eq.length} equipos en inventario. No es posible verificar automáticamente si cubren la dotación mínima exigida por cada servicio habilitado.`, mejora:'Cruzar el inventario con la Resolución 3100/2019 para verificar dotación mínima por servicio.' },
      { estandar:'Gestión financiera', criterio:'Registro de costos de mantenimiento en COP', normativa:'Supersalud', resultado: sinCosto.length<mant.length*0.1?'cumple':sinCosto.length<mant.length*0.3?'parcial':'no_cumple', puntaje:Math.round(((mant.length-sinCosto.length)/Math.max(mant.length,1))*100), meta:90, impacto:'medio', hallazgo:`${mant.length-sinCosto.length} intervenciones con costo registrado. ${sinCosto.length} sin costo. Supersalud puede solicitar análisis de inversión.`, mejora:'Completar costos históricos para poder presentar análisis de inversión en mantenimiento.' },
    ],
    iso9001: [
      { estandar:'Sistema de gestión', criterio:'Inventario como proceso documentado y controlado', normativa:'ISO 9001:2015 Cláusula 7.5', resultado: pctCompletos>=80?'parcial':'no_cumple', puntaje:pctCompletos>=80?65:pctCompletos, meta:100, impacto:'alto', hallazgo:`Inventario al ${pctCompletos}% de completitud. ISO 9001 exige control total de documentos y registros.`, mejora:'Definir procedimiento documentado para alta, baja y modificación de equipos en el inventario.' },
      { estandar:'Control de procesos', criterio:'Proceso de mantenimiento con indicadores medibles', normativa:'ISO 9001:2015 Cláusula 8.1', resultado: mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?60:0, meta:90, impacto:'alto', hallazgo:`${mant.length} registros de mantenimiento. ISO 9001 requiere proceso definido con entradas, actividades, salidas e indicadores.`, mejora:'Documentar el proceso de mantenimiento biomédico como proceso del SGC. Establecer indicadores y metas formales.' },
      { estandar:'Indicadores', criterio:'KPIs con metas definidas y seguimiento periódico', normativa:'ISO 9001:2015 Cláusula 9.1', resultado: mant.length>0?'parcial':'no_cumple', puntaje:mant.length>0?55:0, meta:90, impacto:'alto', hallazgo:'KPIs calculados automáticamente en el sistema. Sin evidencia de metas formales aprobadas por dirección.', mejora:'Formalizar metas de KPIs en documento aprobado. Ej: disponibilidad ≥90%, cumplimiento preventivo ≥80%, MTTR ≤24h.' },
      { estandar:'Mejora continua', criterio:'No conformidades registradas y tratadas', normativa:'ISO 9001:2015 Cláusula 10.2', resultado: correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?50:0, meta:80, impacto:'medio', hallazgo:`${correctivos.length} correctivos como evidencia de fallas. Sin registro formal de no conformidades con análisis de causa raíz.`, mejora:'Implementar registro de no conformidades para cada falla de equipo. Incluir: descripción, causa raíz, acción correctiva y verificación.' },
      { estandar:'Gestión de riesgos', criterio:'Análisis de riesgos tecnológicos documentado', normativa:'ISO 9001:2015 Cláusula 6.1', resultado: altoRiesgo.length>0?'parcial':'cumple', puntaje:altoRiesgo.length>0?50:90, meta:90, impacto:'medio', hallazgo:`${altoRiesgo.length} equipos clasificados como alto riesgo. Sin evidencia de análisis formal de riesgos tecnológicos (AMFE).`, mejora:'Elaborar matriz de riesgos tecnológicos para equipos clase IIb y III. Incluir: probabilidad, impacto y controles.' },
    ],
    iso13485: [
      { estandar:'Control de dispositivos', criterio:'Trazabilidad completa de cada dispositivo médico', normativa:'ISO 13485:2016 Cláusula 8.3', resultado: pctCompletos>=90?'parcial':'no_cumple', puntaje:pctCompletos>=90?70:pctCompletos, meta:100, impacto:'alto', hallazgo:`Trazabilidad al ${pctCompletos}%. ISO 13485 exige número de serie, lote y trazabilidad de toda la vida útil.`, mejora:'Completar número de serie, modelo y datos de adquisición de todos los equipos. Documentar cada intervención.' },
      { estandar:'Gestión de proveedores', criterio:'Proveedores de mantenimiento evaluados y calificados', normativa:'ISO 13485:2016 Cláusula 7.4', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay evidencia en el sistema de evaluación formal de proveedores de mantenimiento y calibración.', mejora:'Crear lista de proveedores calificados con criterios de evaluación: certificaciones, experiencia, tiempo de respuesta.' },
      { estandar:'Control de calidad', criterio:'Registro de acciones correctivas por falla de equipo', normativa:'ISO 13485:2016 Cláusula 8.5', resultado: correctivos.length>0?'parcial':'no_cumple', puntaje:correctivos.length>0?50:0, meta:90, impacto:'alto', hallazgo:`${correctivos.length} correctivos registrados. Sin análisis formal de causa raíz documentado por equipo.`, mejora:'Implementar proceso CAPA (Corrective and Preventive Actions) para cada falla significativa.' },
      { estandar:'Ciclo de vida', criterio:'Vida útil definida y seguimiento de obsolescencia', normativa:'ISO 13485:2016 Cláusula 7.3', resultado: sinVidaUtil.length<eq.length*0.1?'cumple':sinVidaUtil.length<eq.length*0.4?'parcial':'no_cumple', puntaje:Math.round(((eq.length-sinVidaUtil.length)/Math.max(eq.length,1))*100), meta:95, impacto:'medio', hallazgo:`${sinVidaUtil.length} equipos sin vida útil definida. ISO 13485 exige gestión del ciclo de vida completo.`, mejora:'Definir vida útil de todos los equipos. Programar revisión de obsolescencia anual.' },
    ],
    iso17025: [
      { estandar:'Competencia técnica', criterio:'Personal con competencias en calibración documentadas', normativa:'ISO/IEC 17025:2017 Cláusula 6.2', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay evidencia en el sistema de certificaciones del personal en metrología o calibración.', mejora:'Verificar que el personal técnico tenga capacitación en calibración. Documentar hojas de vida técnicas.' },
      { estandar:'Trazabilidad metrológica', criterio:'Calibraciones con trazabilidad al patrón nacional', normativa:'ISO/IEC 17025:2017 Cláusula 6.5', resultado: mant.filter((m:any)=>m.tipo==='calibracion').length>0?'parcial':'no_cumple', puntaje:mant.filter((m:any)=>m.tipo==='calibracion').length>0?40:0, meta:100, impacto:'alto', hallazgo:`${mant.filter((m:any)=>m.tipo==='calibracion').length} calibraciones registradas. Sin evidencia de trazabilidad al INVIMA o INM (Instituto Nacional de Metrología).`, mejora:'Exigir a los laboratorios de calibración contratados que demuestren trazabilidad al INM Colombia.' },
      { estandar:'Equipos de referencia', criterio:'Patrones de medición calibrados y vigentes', normativa:'ISO/IEC 17025:2017 Cláusula 6.4', resultado:'no_cumple', puntaje:0, meta:100, impacto:'alto', hallazgo:'No hay registro en el sistema de equipos de referencia o patrones utilizados en calibraciones.', mejora:'Si se realizan calibraciones internamente, registrar y calibrar los patrones utilizados. Si se terceriza, exigir certificados al proveedor.' },
      { estandar:'Acreditación ONAC', criterio:'Laboratorio de calibración contratado acreditado por ONAC', normativa:'NTC ISO/IEC 17025', resultado:'parcial', puntaje:40, meta:100, impacto:'alto', hallazgo:'No se puede verificar desde el sistema si los laboratorios contratados tienen acreditación ONAC vigente.', mejora:'Verificar acreditación ONAC en onac.org.co antes de contratar servicios de calibración. Exigir certificado.' },
    ],
  }

  return CRITERIOS[tipo] || []
}

const RESULTADO_STYLE: Record<string,{bg:string;text:string;border:string;label:string;icon:string}> = {
  cumple:    {bg:'#F0FDF4',text:'#16A34A',border:'#BBF7D0',label:'Cumple',    icon:'ti-check'},
  parcial:   {bg:'#FFFBEB',text:'#D97706',border:'#FDE68A',label:'Parcial',   icon:'ti-alert-triangle'},
  no_cumple: {bg:'#FEF2F2',text:'#DC2626',border:'#FECACA',label:'No cumple', icon:'ti-x'},
}
const IMPACTO_STYLE: Record<string,{bg:string;text:string}> = {
  alto:  {bg:'#FEF2F2',text:'#DC2626'},
  medio: {bg:'#FFFBEB',text:'#D97706'},
  bajo:  {bg:'#EEF2FF',text:'#3B4FE8'},
}

function ScoreCircle({score,size=100}:{score:number;size?:number}) {
  const color=score>=80?'#16A34A':score>=60?'#D97706':'#DC2626'
  const label=score>=80?'Aprobado':score>=60?'Con observaciones':'No aprobado'
  const r=size*0.38,c=2*Math.PI*r,d=(score/100)*c
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F4F4F5" strokeWidth={size*0.1}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
          strokeDasharray={`${d} ${c-d}`} strokeLinecap="round"/>
      </svg>
      <div style={{textAlign:'center',zIndex:1}}>
        <div style={{fontSize:size*0.2,fontWeight:700,color,lineHeight:1}}>{score}%</div>
        <div style={{fontSize:size*0.1,color:'#A1A1AA',lineHeight:1.3,maxWidth:size*0.7,textAlign:'center'}}>{label}</div>
      </div>
    </div>
  )
}

export default function AuditoriaPage() {
  const [fase, setFase] = useState<'seleccion'|'ejecutando'|'resultado'>('seleccion')
  const [tipoSel, setTipoSel] = useState<string|null>(null)
  const [datos, setDatos] = useState<any>(null)
  const [criterios, setCriterios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'resumen'|'detalle'|'plan'>('resumen')
  const [expandidos, setExpandidos] = useState<Record<number,boolean>>({})

  async function ejecutarAuditoria() {
    if (!tipoSel) return
    setLoading(true)
    setFase('ejecutando')
    const r = await fetch('/api/auditoria-inteligente').then(x=>x.json()).catch(()=>null)
    if (r) {
      setDatos(r)
      const crits = getCriterios(tipoSel, {
        equipos: r._equipos || [],
        mantenimientos: r._mantenimientos || [],
        repuestos: r._repuestos || [],
      })
      setCriterios(crits)
    }
    setLoading(false)
    setFase('resultado')
    setTab('resumen')
  }

  const audSel = AUDITORIAS.find(a=>a.id===tipoSel)
  const cumple    = criterios.filter(c=>c.resultado==='cumple').length
  const parcial   = criterios.filter(c=>c.resultado==='parcial').length
  const noCumple  = criterios.filter(c=>c.resultado==='no_cumple').length
  const scoreGlobal = criterios.length>0 ? Math.round(
    criterios.reduce((acc,c)=>{
      const pts = c.resultado==='cumple'?c.puntaje:c.resultado==='parcial'?c.puntaje*0.5:0
      const peso = c.impacto==='alto'?2:1
      return acc + {v:pts*peso, p:peso}
    },{v:0,p:0}).v /
    criterios.reduce((acc,c)=>acc+(c.impacto==='alto'?2:1),0)
  ) : 0

  // Calcular score correcto
  const totalPeso = criterios.reduce((a,c)=>a+(c.impacto==='alto'?2:1),0)
  const scoreReal = totalPeso>0 ? Math.round(
    criterios.reduce((acc,c)=>{
      const pts = c.resultado==='cumple'?c.puntaje:c.resultado==='parcial'?c.puntaje*0.5:0
      return acc + pts*(c.impacto==='alto'?2:1)
    },0) / totalPeso
  ) : 0

  const noConformidades = criterios.filter(c=>c.resultado==='no_cumple'||c.resultado==='parcial').filter(c=>c.mejora)

  const Sk = ({h=16,w='100%'}:any)=><div style={{height:h,width:w,background:'#F4F4F5',borderRadius:4}}/>

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>BioMed AI / Calidad / Auditoría</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>
            {fase==='seleccion'?'Seleccionar tipo de auditoría':fase==='ejecutando'?'Analizando...':audSel?.nombre||'Auditoría'}
          </h1>
        </div>
        <div style={{display:'flex',gap:8}}>
          {fase==='resultado'&&(
            <>
              <button onClick={()=>{setFase('seleccion');setTipoSel(null);setCriterios([])}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:12}}>
                <i className="ti ti-arrow-left" style={{fontSize:13}}/> Nueva auditoría
              </button>
              <button onClick={()=>window.print()}
                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'none',background:'#3B4FE8',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:500}}>
                <i className="ti ti-download" style={{fontSize:13}}/> Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{flex:1,padding:'24px 28px',overflowY:'auto'}}>

        {/* ── SELECCIÓN ── */}
        {fase==='seleccion'&&(
          <div style={{maxWidth:1000}}>
            <div style={{fontSize:13,color:'#71717A',marginBottom:20}}>
              Selecciona el tipo de auditoría que deseas simular. El sistema analizará automáticamente tu información real y generará el resultado con hallazgos y plan de mejora.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20}}>
              {AUDITORIAS.map(a=>(
                <div key={a.id} onClick={()=>setTipoSel(a.id)}
                  style={{padding:'18px',borderRadius:12,border:`${tipoSel===a.id?'2px':'0.5px'} solid ${tipoSel===a.id?a.color:'#E4E4E7'}`,background:tipoSel===a.id?a.bg:'#fff',cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:9,background:tipoSel===a.id?a.color+'25':a.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <i className={'ti '+a.icon} style={{fontSize:19,color:a.color}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:2}}>{a.nombre}</div>
                      <div style={{fontSize:11,color:a.color,fontWeight:500,marginBottom:6}}>{a.subtitulo}</div>
                      <div style={{fontSize:12,color:'#71717A',lineHeight:1.5,marginBottom:8}}>{a.descripcion}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {a.estandares.slice(0,3).map(e=>(
                          <span key={e} style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:a.color+'15',color:a.color,fontWeight:500}}>{e}</span>
                        ))}
                        {a.estandares.length>3&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'#F4F4F5',color:'#71717A'}}>+{a.estandares.length-3} más</span>}
                      </div>
                    </div>
                    {tipoSel===a.id&&<i className="ti ti-check" style={{fontSize:18,color:a.color,flexShrink:0}}/>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={ejecutarAuditoria} disabled={!tipoSel}
              style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:tipoSel?'#3B4FE8':'#F4F4F5',color:tipoSel?'#fff':'#A1A1AA',fontSize:14,fontWeight:600,cursor:tipoSel?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <i className="ti ti-search" style={{fontSize:17}}/> Analizar con datos reales del sistema
            </button>
          </div>
        )}

        {/* ── EJECUTANDO ── */}
        {fase==='ejecutando'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:16}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:audSel?.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={'ti '+(audSel?.icon||'ti-search')} style={{fontSize:28,color:audSel?.color}}/>
            </div>
            <div style={{fontSize:16,fontWeight:600,color:'#18181B'}}>Analizando {audSel?.nombre}...</div>
            <div style={{fontSize:13,color:'#71717A',textAlign:'center',maxWidth:400}}>
              Consultando equipos, mantenimientos, repuestos y cronogramas del sistema. Calculando cumplimiento por criterio.
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#3B4FE8',animation:`bounce 1.2s ${i*0.2}s infinite`}}/>
              ))}
            </div>
            <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
          </div>
        )}

        {/* ── RESULTADO ── */}
        {fase==='resultado'&&criterios.length>0&&(
          <div style={{maxWidth:1000}}>

            {/* Tabs */}
            <div style={{display:'flex',gap:0,borderBottom:'0.5px solid #E4E4E7',marginBottom:20}}>
              {[{id:'resumen',l:'Resumen ejecutivo'},{id:'detalle',l:'Análisis por criterio'},{id:'plan',l:'Plan de mejora'}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:'9px 16px',border:'none',borderBottom:`2px solid ${tab===t.id?'#3B4FE8':'transparent'}`,background:'transparent',color:tab===t.id?'#3B4FE8':'#71717A',fontSize:13,fontWeight:tab===t.id?500:400,cursor:'pointer'}}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* RESUMEN */}
            {tab==='resumen'&&(
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {/* Score */}
                <div style={{background:'#fff',borderRadius:12,border:`0.5px solid ${scoreReal>=80?'#BBF7D0':scoreReal>=60?'#FDE68A':'#FECACA'}`,padding:'24px',display:'flex',gap:24,alignItems:'center'}}>
                  <ScoreCircle score={scoreReal} size={120}/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <div style={{width:32,height:32,borderRadius:8,background:audSel?.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <i className={'ti '+(audSel?.icon||'')} style={{fontSize:17,color:audSel?.color}}/>
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:600,color:'#18181B'}}>{audSel?.nombre}</div>
                        <div style={{fontSize:11,color:'#A1A1AA'}}>{audSel?.subtitulo}</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:12}}>
                      {[
                        {l:'Criterios',v:criterios.length,c:'#18181B'},
                        {l:'Cumple',v:cumple,c:'#16A34A'},
                        {l:'Parcial',v:parcial,c:'#D97706'},
                        {l:'No cumple',v:noCumple,c:'#DC2626'},
                      ].map(s=>(
                        <div key={s.l} style={{textAlign:'center',padding:'10px',borderRadius:8,background:'#F8F9FA'}}>
                          <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                          <div style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Por estándar */}
                <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                  <div style={{padding:'14px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Resultado por estándar</div>
                  </div>
                  {[...new Set(criterios.map(c=>c.estandar))].map(est=>{
                    const crit=criterios.filter(c=>c.estandar===est)
                    const avg=Math.round(crit.reduce((a,c)=>a+(c.resultado==='cumple'?c.puntaje:c.resultado==='parcial'?c.puntaje*0.5:0),0)/crit.length)
                    const estado=avg>=80?'cumple':avg>=50?'parcial':'no_cumple'
                    const rs=RESULTADO_STYLE[estado]
                    return (
                      <div key={est} style={{padding:'12px 20px',borderBottom:'0.5px solid #F8F9FA',display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:28,height:28,borderRadius:6,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className={'ti '+rs.icon} style={{fontSize:14,color:rs.text}}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                            <span style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{est}</span>
                            <span style={{fontSize:12,fontWeight:600,color:rs.text}}>{avg}%</span>
                          </div>
                          <div style={{height:5,background:'#F4F4F5',borderRadius:3}}>
                            <div style={{height:5,borderRadius:3,width:`${avg}%`,background:avg>=80?'#22C55E':avg>=50?'#F59E0B':'#EF4444'}}/>
                          </div>
                        </div>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500,flexShrink:0}}>{rs.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Datos analizados */}
                <div style={{background:'#EEF2FF',borderRadius:10,border:'0.5px solid #C7D2FE',padding:'14px 18px',display:'flex',gap:24,flexWrap:'wrap'}}>
                  <div style={{fontSize:11,fontWeight:500,color:'#3B4FE8',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-database" style={{fontSize:14}}/> Datos analizados en tiempo real:
                  </div>
                  {[
                    {l:'Equipos',v:datos?.resumen?.equipos},
                    {l:'Mantenimientos',v:datos?.resumen?.mantenimientos},
                    {l:'Repuestos',v:datos?.resumen?.repuestos},
                    {l:'Preventivos',v:datos?.resumen?.preventivos},
                  ].map(s=>(
                    <div key={s.l} style={{fontSize:11,color:'#3B4FE8'}}>
                      <strong>{s.v?.toLocaleString('es-CO')}</strong> {s.l}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DETALLE */}
            {tab==='detalle'&&(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {criterios.map((c,i)=>{
                  const rs=RESULTADO_STYLE[c.resultado]||RESULTADO_STYLE.no_cumple
                  const imp=IMPACTO_STYLE[c.impacto]||IMPACTO_STYLE.medio
                  const exp=expandidos[i]
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,border:`0.5px solid ${c.resultado==='no_cumple'?'#FECACA':c.resultado==='parcial'?'#FDE68A':'#E4E4E7'}`,overflow:'hidden'}}>
                      <div onClick={()=>setExpandidos(p=>({...p,[i]:!p[i]}))}
                        style={{padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{width:34,height:34,borderRadius:8,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                          <i className={'ti '+rs.icon} style={{fontSize:17,color:rs.text}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4}}>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'#F4F4F5',color:'#71717A'}}>{c.estandar}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:imp.bg,color:imp.text,fontWeight:500}}>Impacto {c.impacto}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'#F8F9FA',color:'#A1A1AA'}}>{c.normativa}</span>
                          </div>
                          <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:6}}>{c.criterio}</div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:5,background:'#F4F4F5',borderRadius:3,maxWidth:180}}>
                              <div style={{height:5,borderRadius:3,width:`${c.puntaje}%`,background:rs.text}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:600,color:rs.text}}>{c.puntaje}%</span>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                          </div>
                        </div>
                        <i className={'ti '+(exp?'ti-chevron-up':'ti-chevron-down')} style={{fontSize:14,color:'#A1A1AA',flexShrink:0}}/>
                      </div>
                      {exp&&(
                        <div style={{borderTop:'0.5px solid #F4F4F5',padding:'14px 18px',background:'#FAFAFA',display:'flex',flexDirection:'column',gap:10}}>
                          <div style={{padding:'10px 14px',borderRadius:8,background:rs.bg,border:`0.5px solid ${rs.border}`}}>
                            <div style={{fontSize:11,fontWeight:500,color:rs.text,marginBottom:4}}>📋 Hallazgo</div>
                            <div style={{fontSize:12,color:'#52525B',lineHeight:1.6}}>{c.hallazgo}</div>
                          </div>
                          {c.mejora&&(
                            <div style={{padding:'10px 14px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#3B4FE8',marginBottom:4}}>💡 Acción de mejora</div>
                              <div style={{fontSize:12,color:'#3F3F46',lineHeight:1.6}}>{c.mejora}</div>
                            </div>
                          )}
                          <div style={{display:'flex',gap:12,fontSize:11,color:'#A1A1AA'}}>
                            <span>Meta: {c.meta}%</span>
                            <span>Actual: {c.puntaje}%</span>
                            <span>Brecha: {Math.max(c.meta-c.puntaje,0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* PLAN DE MEJORA */}
            {tab==='plan'&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {noConformidades.length===0?(
                  <div style={{textAlign:'center',padding:'48px',background:'#F0FDF4',borderRadius:12,border:'0.5px solid #BBF7D0'}}>
                    <i className="ti ti-award" style={{fontSize:40,color:'#16A34A',display:'block',marginBottom:10}}/>
                    <div style={{fontSize:18,fontWeight:700,color:'#16A34A',marginBottom:4}}>¡Sin no conformidades!</div>
                    <div style={{fontSize:13,color:'#71717A'}}>La institución cumple con todos los criterios evaluados.</div>
                  </div>
                ):(
                  <>
                    <div style={{padding:'12px 16px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE',fontSize:13,color:'#3B4FE8',display:'flex',gap:8,alignItems:'center'}}>
                      <i className="ti ti-info-circle" style={{fontSize:15,flexShrink:0}}/>
                      <div>{noConformidades.length} hallazgos requieren acción. Ordenados por impacto y urgencia.</div>
                    </div>
                    {noConformidades
                      .sort((a,b)=>({no_cumple:0,parcial:1}[a.resultado]||1)-({no_cumple:0,parcial:1}[b.resultado]||1))
                      .map((c,i)=>{
                      const rs=RESULTADO_STYLE[c.resultado]
                      const imp=IMPACTO_STYLE[c.impacto]||IMPACTO_STYLE.medio
                      const plazo=c.impacto==='alto'?'≤ 30 días':'≤ 90 días'
                      const plazoColor=c.impacto==='alto'?'#DC2626':'#D97706'
                      return (
                        <div key={i} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                          <div style={{padding:'12px 18px',borderBottom:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#3B4FE8',flexShrink:0}}>{i+1}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:3}}>{c.criterio}</div>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:imp.bg,color:imp.text,fontWeight:500}}>Impacto {c.impacto}</span>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F4F4F5',color:'#71717A'}}>{c.estandar}</span>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F4F4F5',color:'#71717A'}}>{c.normativa}</span>
                              </div>
                            </div>
                            <div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontSize:10,color:'#A1A1AA'}}>Plazo recomendado</div>
                              <div style={{fontSize:12,fontWeight:700,color:plazoColor}}>{plazo}</div>
                            </div>
                          </div>
                          <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:8}}>
                            <div style={{padding:'8px 12px',borderRadius:7,background:'#FEF2F2',border:'0.5px solid #FECACA'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#DC2626',marginBottom:3}}>Hallazgo</div>
                              <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.hallazgo}</div>
                            </div>
                            <div style={{padding:'8px 12px',borderRadius:7,background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                              <div style={{fontSize:11,fontWeight:500,color:'#16A34A',marginBottom:3}}>Acción de mejora</div>
                              <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.mejora}</div>
                            </div>
                            <div style={{display:'flex',gap:12,fontSize:11,color:'#A1A1AA'}}>
                              <span>Puntaje actual: <strong style={{color:'#18181B'}}>{c.puntaje}%</strong></span>
                              <span>Meta: <strong style={{color:'#18181B'}}>{c.meta}%</strong></span>
                              <span>Brecha: <strong style={{color:plazoColor}}>{Math.max(c.meta-c.puntaje,0)}%</strong></span>
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
