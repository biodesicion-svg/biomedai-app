'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const AUDITORIAS = [
  { id:'habilitacion',    nombre:'Auditoría de Habilitación',         subtitulo:'Resolución 3100 de 2019 — Ministerio de Salud',           icon:'ti-building-hospital',    color:'#3B4FE8', bg:'#EEF2FF' },
  { id:'biomedica',       nombre:'Auditoría de Equipos Biomédicos',   subtitulo:'Res. 4816/2008 · Dentro de Habilitación',                 icon:'ti-device-heart-monitor', color:'#7C3AED', bg:'#F5F3FF' },
  { id:'tecnovigilancia', nombre:'Auditoría de Tecnovigilancia',      subtitulo:'Programa Nacional INVIMA · Res. 4816/2008',               icon:'ti-shield-check',         color:'#D97706', bg:'#FFFBEB' },
  { id:'pamec',           nombre:'Auditoría PAMEC',                   subtitulo:'Programa Auditoría para el Mejoramiento de la Calidad',   icon:'ti-chart-arrows-vertical',color:'#0891B2', bg:'#F0F9FF' },
  { id:'acreditacion',    nombre:'Acreditación en Salud ICONTEC',     subtitulo:'No obligatoria · Nivel superior a habilitación',          icon:'ti-award',                color:'#16A34A', bg:'#F0FDF4' },
  { id:'secretaria',      nombre:'Visita Secretaría de Salud',        subtitulo:'Secretarías Departamentales o Distritales',               icon:'ti-building-community',   color:'#DC2626', bg:'#FEF2F2' },
  { id:'supersalud',      nombre:'Auditoría Supersalud',              subtitulo:'Superintendencia Nacional de Salud',                      icon:'ti-scale',                color:'#7C3AED', bg:'#F5F3FF' },
  { id:'iso9001',         nombre:'ISO 9001:2015',                     subtitulo:'Sistema de Gestión de Calidad · Internacional',           icon:'ti-certificate',          color:'#0891B2', bg:'#F0F9FF' },
  { id:'iso13485',        nombre:'ISO 13485',                         subtitulo:'Dispositivos médicos · Gestión de calidad',               icon:'ti-certificate-2',        color:'#16A34A', bg:'#F0FDF4' },
  { id:'iso17025',        nombre:'ISO 17025',                         subtitulo:'Laboratorios de calibración y ensayo',                    icon:'ti-microscope',           color:'#D97706', bg:'#FFFBEB' },
]

function calcularCriterios(tipo: string, eq: any[], mant: any[], rep: any[]) {
  // ── Cálculos base ──────────────────────────────────────────────
  const sinSerie       = eq.filter(e => !e.serie || e.serie.trim() === '')
  const sinMarca       = eq.filter(e => !e.marca || e.marca.trim() === '')
  const sinModelo      = eq.filter(e => !e.modelo || e.modelo.trim() === '')
  const sinClaseInvima = eq.filter(e => !e.clase_invima || e.clase_invima.trim() === '')
  const sinAnioAdq     = eq.filter(e => !e.anio_adquisicion)
  const sinVidaUtil    = eq.filter(e => !e.vida_util_anos)
  const altoRiesgo     = eq.filter(e => e.riesgo === 'alto')
  const medioRiesgo    = eq.filter(e => e.riesgo === 'medio')
  const operativos     = eq.filter(e => e.estado === 'operativo')
  const fueraSvc       = eq.filter(e => e.estado === 'fuera_servicio')
  const enBaja         = eq.filter(e => e.estado === 'baja')

  const completados    = mant.filter(m => m.estado === 'completado')
  const preventivos    = mant.filter(m => m.tipo === 'preventivo')
  const correctivos    = mant.filter(m => m.tipo === 'correctivo')
  const calibraciones  = mant.filter(m => m.tipo === 'calibracion')
  const sinFechaReal   = mant.filter(m => !m.fecha_realizado)
  const sinCosto       = mant.filter(m => !m.costo_total || Number(m.costo_total) === 0)
  const sinDuracion    = mant.filter(m => !m.duracion_horas)
  const sinDesc        = mant.filter(m => !m.descripcion || String(m.descripcion).trim().length < 5)
  const conHallazgos   = mant.filter(m => m.hallazgos && String(m.hallazgos).trim().length > 5)

  const sinStock       = rep.filter(r => r.stock_actual === 0)
  const stockBajo      = rep.filter(r => r.stock_actual > 0 && r.stock_actual <= r.stock_minimo)
  const stockOk        = rep.filter(r => r.stock_actual > r.stock_minimo)

  const eqConMant      = new Set(mant.map(m => m.equipo_id))
  const sinMant        = eq.filter(e => !eqConMant.has(e.id))

  // Equipos con datos completos (cada campo por separado)
  const conSerie       = eq.length - sinSerie.length
  const conMarca       = eq.length - sinMarca.length
  const conClase       = eq.length - sinClaseInvima.length
  const conAnio        = eq.length - sinAnioAdq.length
  const conVida        = eq.length - sinVidaUtil.length
  const conMantEq      = eq.length - sinMant.length
  const conDesc        = mant.length - sinDesc.length
  const conCosto       = mant.length - sinCosto.length

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0

  const pctSerie   = pct(conSerie, eq.length)
  const pctMarca   = pct(conMarca, eq.length)
  const pctClase   = pct(conClase, eq.length)
  const pctAnio    = pct(conAnio, eq.length)
  const pctVida    = pct(conVida, eq.length)
  const pctCumpl   = pct(completados.length, mant.length)
  const pctHV      = pct(conMantEq, eq.length)
  const pctDoc     = pct(conDesc, mant.length)
  const pctCosto   = pct(conCosto, mant.length)
  const pctStock   = pct(stockOk.length, rep.length)
  const pctDisp    = pct(operativos.length, eq.length)
  const pctAltoMant = pct(altoRiesgo.filter(e => eqConMant.has(e.id)).length, altoRiesgo.length)
  const mesesCub   = new Set(mant.map(m => m.fecha_programada?.substring(0, 7))).size
  const pctCron    = Math.min(pct(mesesCub, 12), 100)
  const pctCal     = pct(calibraciones.length, Math.max(altoRiesgo.length, 1))

  const res = (p: number, meta: number) => p >= meta ? 'cumple' : p >= meta * 0.6 ? 'parcial' : 'no_cumple'

  // ── CRITERIOS DETALLADOS ────────────────────────────────────────
  const CRITERIOS: Record<string, any[]> = {

    habilitacion: [
      {
        estandar: '2. Infraestructura · Dotación',
        criterio: 'Inventario de equipos biomédicos — Número de serie registrado',
        normativa: 'Res. 3100/2019 Anexo Técnico · Res. 4816/2008 Art. 5 numeral 1',
        articulo: 'Res. 4816/2008 Art. 5 numeral 1: "Las instituciones deben llevar un inventario de los dispositivos médicos que incluya como mínimo: nombre genérico, marca, modelo, serie, registro sanitario INVIMA y clasificación de riesgo."',
        resultado: res(pctSerie, 90),
        puntaje: pctSerie,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinSerie.length === 0
          ? `✓ Todos los equipos tienen número de serie registrado.`
          : `✗ ${sinSerie.length} de ${eq.length} equipos (${100-pctSerie}%) NO tienen número de serie registrado.\n\nEquipos sin serie: ${sinSerie.slice(0,5).map(e=>e.nombre).join(', ')}${sinSerie.length>5?` y ${sinSerie.length-5} más`:''}.\n\nEsto incumple directamente el Art. 5 numeral 1 de la Res. 4816/2008 y puede generar observación tipo "No conformidad mayor" en visita de habilitación.`,
        mejora: sinSerie.length > 0 ? {
          accion: 'Completar número de serie en los equipos faltantes',
          como: `1. Ir al módulo de Inventario en SYNAP\n2. Filtrar por equipos sin serie\n3. Verificar la placa física del equipo o el manual del fabricante\n4. Registrar el número de serie en la hoja de vida\n5. Si el equipo no tiene serie (equipos artesanales), registrar "S/N" y documentar el motivo`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días antes de cualquier visita de habilitación',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 5 numeral 1',
          riesgo_incumplimiento: 'Observación tipo No Conformidad Mayor — puede bloquear habilitación',
        } : null,
      },
      {
        estandar: '2. Infraestructura · Dotación',
        criterio: 'Inventario de equipos biomédicos — Marca y modelo registrados',
        normativa: 'Res. 3100/2019 Anexo Técnico · Res. 4816/2008 Art. 5 numeral 1',
        articulo: 'Res. 4816/2008 Art. 5 numeral 1: El inventario debe incluir "marca y modelo" de cada dispositivo médico.',
        resultado: res(pctMarca, 90),
        puntaje: pctMarca,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinMarca.length === 0
          ? `✓ Todos los ${eq.length} equipos tienen marca registrada.`
          : `✗ ${sinMarca.length} equipos sin marca (${100-pctMarca}% incompletos). ${sinModelo.length} sin modelo.\n\nEquipos sin marca: ${sinMarca.slice(0,5).map((e:any)=>e.nombre).join(', ')}${sinMarca.length>5?` y ${sinMarca.length-5} más`:''}`,
        mejora: sinMarca.length > 0 ? {
          accion: 'Registrar marca y modelo de los equipos faltantes',
          como: `1. Verificar la placa de identificación del equipo\n2. Consultar la factura de compra o contrato de adquisición\n3. Buscar en el portal del INVIMA: dispositivos médicos → búsqueda por nombre\n4. Registrar en el sistema: nombre del fabricante (marca) y referencia comercial (modelo)`,
          responsable: 'Auxiliar de ingeniería biomédica / Almacén',
          plazo: '15 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 5 numeral 1',
          riesgo_incumplimiento: 'No Conformidad Menor — se debe subsanar en el plan de mejora',
        } : null,
      },
      {
        estandar: '2. Infraestructura · Dotación',
        criterio: 'Clasificación de riesgo INVIMA documentada en inventario',
        normativa: 'Dec. 4725/2005 Art. 26 · Res. 4816/2008 Art. 5 numeral 3',
        articulo: 'Dec. 4725/2005 Art. 26: Los dispositivos médicos se clasifican en clases I, IIa, IIb y III según el riesgo que representan para el paciente y el operador. Res. 4816/2008 Art. 5 numeral 3 exige que esta clasificación esté documentada en el inventario.',
        resultado: res(pctClase, 90),
        puntaje: pctClase,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinClaseInvima.length === 0
          ? `✓ Todos los ${eq.length} equipos tienen clase INVIMA registrada. Alto riesgo (IIb/III): ${altoRiesgo.length}.`
          : `✗ ${sinClaseInvima.length} equipos (${100-pctClase}%) sin clasificación INVIMA.\n\nLa clasificación es OBLIGATORIA para determinar la frecuencia de mantenimiento preventivo (equipos clase IIb deben tener mínimo 2 mantenimientos/año; clase III: según recomendación del fabricante).\n\nEquipos sin clasificar: ${sinClaseInvima.slice(0,5).map((e:any)=>e.nombre).join(', ')}${sinClaseInvima.length>5?` y ${sinClaseInvima.length-5} más`:''}`,
        mejora: sinClaseInvima.length > 0 ? {
          accion: 'Clasificar los equipos sin clase INVIMA',
          como: `1. Ingresar a web.invima.gov.co → Dispositivos Médicos → Consulta de registros sanitarios\n2. Buscar por nombre del equipo o número de registro\n3. La clase aparece en el certificado de registro sanitario\n4. Equipos importados: buscar en el país de origen (FDA classification para EE.UU.)\n5. Registrar en SYNAP en el campo "Clase INVIMA" de cada equipo`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días',
          normativa_cumplimiento: 'Dec. 4725/2005 Art. 26 · Res. 4816/2008 Art. 5',
          riesgo_incumplimiento: 'No Conformidad Mayor — afecta plan de mantenimiento y habilitación',
        } : null,
      },
      {
        estandar: '2. Infraestructura · Dotación',
        criterio: 'Año de adquisición y vida útil documentados',
        normativa: 'Res. 4816/2008 Art. 5 numeral 4 · Circular 015/2009 MSPS',
        articulo: 'Res. 4816/2008 Art. 5 numeral 4: El inventario debe incluir "fecha de adquisición y vida útil estimada" para cada equipo biomédico, como insumo para la planeación del reemplazo tecnológico.',
        resultado: res(pctAnio, 70),
        puntaje: pctAnio,
        meta: 90,
        impacto: 'medio',
        hallazgo: sinAnioAdq.length === 0
          ? `✓ Todos los equipos tienen año de adquisición registrado.`
          : `✗ ${sinAnioAdq.length} equipos sin año de adquisición (${100-pctAnio}%). ${sinVidaUtil.length} sin vida útil definida.\n\nSin estos datos no es posible:\n• Calcular el ciclo de reposición tecnológica\n• Determinar equipos obsoletos o con vida útil vencida\n• Planear el presupuesto de reemplazo`,
        mejora: sinAnioAdq.length > 0 ? {
          accion: 'Completar fecha de adquisición y vida útil',
          como: `1. Consultar facturas de compra en el área de almacén o contabilidad\n2. Para vida útil: revisar manual del fabricante (sección "expected service life")\n3. Si no hay manual: usar tabla OPS/OMS de vida útil referencial por tipo de equipo\n4. Equipos sin documento: registrar año estimado con nota "estimado" en observaciones\n5. Priorizar equipos clase IIb y III`,
          responsable: 'Ingeniero Biomédico + Almacén',
          plazo: '45 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 5 numeral 4',
          riesgo_incumplimiento: 'Observación — puede ser No Conformidad Menor en auditoría',
        } : null,
      },
      {
        estandar: '5. Procesos prioritarios',
        criterio: 'Plan anual de mantenimiento preventivo con cronograma',
        normativa: 'Res. 4816/2008 Art. 7 · Res. 3100/2019 Estándar 5 — Procesos prioritarios',
        articulo: 'Res. 4816/2008 Art. 7: "Las instituciones prestadoras de servicios de salud deben elaborar un programa de mantenimiento preventivo anual para todos los dispositivos médicos, con cronograma de actividades, responsables y presupuesto asignado." La Res. 3100/2019 lo incluye como estándar obligatorio de habilitación.',
        resultado: res(pctCumpl, 80),
        puntaje: pctCumpl,
        meta: 80,
        impacto: 'alto',
        hallazgo: pctCumpl >= 80
          ? `✓ Cumplimiento del ${pctCumpl}%. ${completados.length} de ${mant.length} mantenimientos completados. Cronograma cubre ${mesesCub}/12 meses.`
          : `✗ Cumplimiento del ${pctCumpl}% — Por debajo del 80% exigido por la Res. 4816/2008 Art. 7.\n\n• Total mantenimientos programados: ${mant.length}\n• Completados: ${completados.length} (${pctCumpl}%)\n• Sin ejecutar: ${mant.length - completados.length}\n• Sin fecha de ejecución real: ${sinFechaReal.length}\n• Cronograma: cubre solo ${mesesCub} de 12 meses\n\nUn incumplimiento menor al 80% representa una NO CONFORMIDAD MAYOR en visita de habilitación y puede resultar en plan de mejora obligatorio con plazo de 3 meses.`,
        mejora: pctCumpl < 80 ? {
          accion: 'Aumentar cumplimiento del plan preventivo al 80% mínimo',
          como: `1. Identificar los ${mant.length - completados.length} mantenimientos no ejecutados\n2. Programar ejecución inmediata de los atrasados, priorizando equipos clase IIb y III\n3. Para cada mantenimiento completado sin fecha real: buscar en archivos físicos y registrar\n4. Distribuir el cronograma en los ${12 - mesesCub} meses sin cobertura\n5. Asignar responsable por servicio con meta mensual de cumplimiento\n6. Implementar alerta automática en SYNAP para mantenimientos próximos a vencer`,
          responsable: 'Coordinador de Ingeniería Biomédica',
          plazo: '60 días — antes de cualquier visita de habilitación',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 7',
          riesgo_incumplimiento: 'No Conformidad Mayor — puede generar plan de mejora obligatorio con seguimiento de la Secretaría de Salud',
        } : null,
      },
      {
        estandar: '6. Historia clínica y registros',
        criterio: 'Hojas de vida individuales con historial de mantenimiento',
        normativa: 'Res. 4816/2008 Art. 6 · Res. 3100/2019 Estándar 6',
        articulo: 'Res. 4816/2008 Art. 6: "Cada dispositivo médico debe contar con una hoja de vida que registre: fecha de adquisición, mantenimientos preventivos y correctivos realizados, calibraciones, repuestos instalados, fallas reportadas y responsable de cada intervención." Este registro es exigido como evidencia en toda visita de habilitación.',
        resultado: res(pctHV, 85),
        puntaje: pctHV,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinMant.length === 0
          ? `✓ Todos los ${eq.length} equipos tienen al menos un registro en su hoja de vida.`
          : `✗ ${sinMant.length} equipos (${100-pctHV}%) NO tienen ningún registro de mantenimiento en su hoja de vida.\n\nEquipos sin historial: ${sinMant.slice(0,5).map((e:any)=>e.nombre).join(', ')}${sinMant.length>5?` y ${sinMant.length-5} más`:''}.\n\nSin hoja de vida, el inspector no puede verificar que el equipo ha recibido mantenimiento. Esto genera NO CONFORMIDAD en el estándar 6 de la Res. 3100/2019.`,
        mejora: sinMant.length > 0 ? {
          accion: 'Crear hoja de vida para todos los equipos sin historial',
          como: `1. En SYNAP: ir al equipo sin historial → sección "Historial"\n2. Registrar mínimo la recepción técnica inicial del equipo (fecha en que ingresó al servicio)\n3. Si existe historial en papel: digitalizar los últimos 2 años de mantenimientos\n4. Para equipos nuevos: registrar la instalación, pruebas de aceptación y condiciones de garantía\n5. Priorizar los ${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} equipos de alto riesgo sin historial`,
          responsable: 'Ingeniero Biomédico / Técnico Biomédico',
          plazo: '30 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 6 · Res. 3100/2019 Estándar 6',
          riesgo_incumplimiento: 'No Conformidad Mayor — evidencia directa de falta de gestión biomédica',
        } : null,
      },
      {
        estandar: '6. Historia clínica y registros',
        criterio: 'Órdenes de trabajo con descripción de actividades realizadas',
        normativa: 'Res. 4816/2008 Art. 8 · Res. 3100/2019 Estándar 6',
        articulo: 'Res. 4816/2008 Art. 8: "Los registros de mantenimiento deben incluir: descripción de actividades realizadas, materiales y repuestos utilizados, tiempo empleado, nombre y firma del técnico responsable y resultado de las pruebas de funcionamiento post-mantenimiento."',
        resultado: res(pctDoc, 80),
        puntaje: pctDoc,
        meta: 80,
        impacto: 'alto',
        hallazgo: pctDoc >= 80
          ? `✓ ${conDesc} de ${mant.length} registros documentados (${pctDoc}%). ${conHallazgos.length} con hallazgos específicos.`
          : `✗ ${sinDesc.length} de ${mant.length} mantenimientos (${100-pctDoc}%) sin descripción de actividades.\n\n• Sin descripción: ${sinDesc.length} registros\n• Sin duración registrada: ${sinDuracion.length} registros\n• Sin costo registrado: ${sinCosto.length} registros\n• Con hallazgos documentados: ${conHallazgos.length}\n\nLos inspectores de habilitación solicitan órdenes de trabajo firmadas. Un registro sin descripción no es válido como evidencia.`,
        mejora: pctDoc < 80 ? {
          accion: 'Completar descripción en todos los registros de mantenimiento',
          como: `1. En SYNAP: filtrar mantenimientos sin descripción\n2. Para registros históricos: recuperar de formatos físicos y digitalizar\n3. Para nuevos: exigir descripción mínima de 3 actividades en cada OT:\n   - Actividades realizadas (ej: "Limpieza de filtros, verificación de alarmas, prueba funcional")\n   - Resultado: "Equipo en funcionamiento correcto" o hallazgo encontrado\n   - Nombre del técnico responsable\n4. Crear plantilla estándar de OT en el módulo de órdenes de SYNAP`,
          responsable: 'Técnico Biomédico (ejecución) · Ingeniero Biomédico (supervisión)',
          plazo: '30 días para registros históricos · Inmediato para nuevos registros',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 8',
          riesgo_incumplimiento: 'No Conformidad Menor en auditoría de habilitación',
        } : null,
      },
      {
        estandar: '4. Medicamentos e insumos · Dotación',
        criterio: 'Stock de repuestos e insumos biomédicos críticos disponible',
        normativa: 'Res. 3100/2019 Anexo Técnico · Res. 4816/2008 Art. 11',
        articulo: 'Res. 4816/2008 Art. 11: "Las IPS deben garantizar la disponibilidad de repuestos e insumos mínimos para mantener operativos los equipos biomédicos críticos, especialmente los de soporte vital." La Res. 3100/2019 incluye esto en el estándar de dotación.',
        resultado: sinStock.length === 0 && stockBajo.length === 0 ? 'cumple' : sinStock.length === 0 ? 'parcial' : 'no_cumple',
        puntaje: pctStock,
        meta: 90,
        impacto: 'medio',
        hallazgo: sinStock.length === 0 && stockBajo.length === 0
          ? `✓ Todos los ${rep.length} repuestos están en stock óptimo.`
          : `✗ Problemas de stock detectados:\n\n• Repuestos AGOTADOS (stock = 0): ${sinStock.length}\n  ${sinStock.slice(0,4).map((r:any)=>`- ${r.nombre}: 0 unidades (mínimo: ${r.stock_minimo})`).join('\n  ')}\n\n• Repuestos con STOCK BAJO: ${stockBajo.length}\n  ${stockBajo.slice(0,4).map((r:any)=>`- ${r.nombre}: ${r.stock_actual} uds (mínimo: ${r.stock_minimo})`).join('\n  ')}\n\nUn equipo sin repuesto disponible puede quedar fuera de servicio en caso de falla, lo cual impacta directamente la disponibilidad y puede generar observación en habilitación.`,
        mejora: (sinStock.length > 0 || stockBajo.length > 0) ? {
          accion: 'Reponer stock de repuestos críticos',
          como: `1. Generar orden de compra para los ${sinStock.length} repuestos agotados con prioridad inmediata\n2. Generar orden de compra para los ${stockBajo.length} repuestos con stock bajo\n3. Establecer punto de reorden en SYNAP (stock mínimo + tiempo de entrega del proveedor)\n4. Priorizar repuestos para equipos de soporte vital (ventiladores, monitores, desfibriladores)\n5. Negociar con proveedores un acuerdo de suministro inmediato para repuestos críticos`,
          responsable: 'Ingeniero Biomédico + Almacén + Compras',
          plazo: 'Inmediato para agotados · 15 días para stock bajo',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 11 · Res. 3100/2019 dotación',
          riesgo_incumplimiento: 'Observación en habilitación · Riesgo para la seguridad del paciente',
        } : null,
      },
    ],

    biomedica: [
      {
        estandar: 'Inventario biomédico',
        criterio: 'Número de serie de cada equipo registrado en inventario',
        normativa: 'Res. 4816/2008 Art. 5 numeral 1',
        articulo: 'Res. 4816/2008 Art. 5 numeral 1: "Las IPS deben llevar un inventario actualizado de todos los dispositivos médicos que incluya como mínimo: nombre genérico, marca, modelo, número de serie o lote, registro sanitario INVIMA y clasificación de riesgo."',
        resultado: res(pctSerie, 90),
        puntaje: pctSerie,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinSerie.length === 0
          ? `✓ ${eq.length} equipos con número de serie registrado.`
          : `✗ ${sinSerie.length} equipos sin número de serie:\n${sinSerie.slice(0,6).map((e:any)=>`• ${e.nombre} (${e.codigo_inventario||'sin código'})`).join('\n')}${sinSerie.length>6?`\n• ... y ${sinSerie.length-6} equipos más`:''}`,
        mejora: sinSerie.length > 0 ? {
          accion: 'Registrar número de serie de los equipos faltantes',
          como: `1. Inspección física: revisar placa de identificación en la parte posterior o inferior del equipo\n2. Documentación: consultar factura de compra, remisión o certificado de garantía\n3. Formato: el número de serie generalmente tiene entre 8-20 caracteres alfanuméricos\n4. Equipos sin serie (fabricados a medida): registrar "S/N" y documentar motivo en observaciones\n5. Evidencia: fotografiar la placa del equipo para respaldo documental`,
          responsable: 'Técnico Biomédico',
          plazo: '15 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 5 numeral 1',
          riesgo_incumplimiento: 'No Conformidad Mayor',
        } : null,
      },
      {
        estandar: 'Inventario biomédico',
        criterio: 'Clasificación de riesgo INVIMA (clase I, IIa, IIb, III)',
        normativa: 'Dec. 4725/2005 Art. 26 · Res. 4816/2008 Art. 5',
        articulo: 'Dec. 4725/2005 Art. 26: "Los dispositivos médicos se clasificarán en clases de riesgo I (bajo), IIa y IIb (moderado y alto) y III (máximo riesgo) de acuerdo con las reglas establecidas en el Anexo 1 de este decreto." Esta clasificación determina la frecuencia mínima de mantenimiento.',
        resultado: res(pctClase, 90),
        puntaje: pctClase,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinClaseInvima.length === 0
          ? `✓ ${eq.length} equipos clasificados. Alto riesgo IIb/III: ${altoRiesgo.length} equipos.`
          : `✗ ${sinClaseInvima.length} equipos sin clasificación INVIMA:\n\nEquipos sin clasificar: ${sinClaseInvima.slice(0,5).map((e:any)=>e.nombre).join(', ')}${sinClaseInvima.length>5?` y ${sinClaseInvima.length-5} más`:''}.\n\nSin esta clasificación no es posible definir la frecuencia correcta de mantenimiento preventivo, lo que incumple el Art. 7 de la Res. 4816/2008.`,
        mejora: sinClaseInvima.length > 0 ? {
          accion: 'Clasificar equipos según normativa INVIMA',
          como: `1. Portal INVIMA: https://www.invima.gov.co → Dispositivos Médicos → Consulta de registros\n2. Buscar por nombre del dispositivo o número de registro\n3. La clase aparece en el certificado de registro sanitario del fabricante\n4. Guía rápida de clasificación:\n   • Clase I: equipos no invasivos sin riesgo (camillas, básculas, nebulizadores simples)\n   • Clase IIa: riesgo moderado (monitores, bombas de infusión de bajo riesgo)\n   • Clase IIb: riesgo alto (ventiladores, desfibriladores, monitores de UCI)\n   • Clase III: riesgo máximo (implantes activos, equipos de soporte vital)\n5. Registrar en SYNAP con número de registro INVIMA si está disponible`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días',
          normativa_cumplimiento: 'Dec. 4725/2005 Art. 26',
          riesgo_incumplimiento: 'No Conformidad Mayor — base para todo el programa de mantenimiento',
        } : null,
      },
      {
        estandar: 'Hojas de vida',
        criterio: 'Historial de mantenimiento en hoja de vida de cada equipo',
        normativa: 'Res. 4816/2008 Art. 6',
        articulo: 'Res. 4816/2008 Art. 6: "Cada institución debe mantener una hoja de vida para cada dispositivo médico que registre: identificación del equipo, fecha de adquisición, mantenimientos preventivos, mantenimientos correctivos, calibraciones realizadas, repuestos instalados y fallas reportadas."',
        resultado: res(pctHV, 90),
        puntaje: pctHV,
        meta: 100,
        impacto: 'alto',
        hallazgo: sinMant.length === 0
          ? `✓ ${eq.length} equipos con historial en hoja de vida.`
          : `✗ ${sinMant.length} equipos sin ningún registro de mantenimiento:\n${sinMant.slice(0,6).map((e:any)=>`• ${e.nombre} — Servicio: ${e.servicio||'N/D'} — Riesgo: ${e.riesgo}`).join('\n')}${sinMant.length>6?`\n• ... y ${sinMant.length-6} más`:''}\n\nDe estos, ${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} son de ALTO RIESGO sin ningún historial, lo que representa el mayor riesgo para la seguridad del paciente.`,
        mejora: sinMant.length > 0 ? {
          accion: 'Crear historial de mantenimiento para equipos sin registro',
          como: `1. Prioridad 1 — Equipos alto riesgo sin historial (${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} equipos): registrar mantenimiento correctivo o preventivo inmediato\n2. Prioridad 2 — Demás equipos sin historial: registrar recepción técnica con:\n   • Fecha de ingreso al servicio\n   • Condición al ingreso (nuevo/usado/en garantía)\n   • Pruebas de aceptación realizadas\n3. Recuperar registros físicos de los últimos 2 años y digitalizarlos\n4. Para equipos sin historial conocido: documentar inspección visual actual como punto de partida`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días — equipos alto riesgo: inmediato',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 6',
          riesgo_incumplimiento: 'No Conformidad Mayor',
        } : null,
      },
      {
        estandar: 'Plan de mantenimiento',
        criterio: 'Cronograma de mantenimiento preventivo anual con cobertura mensual',
        normativa: 'Res. 4816/2008 Art. 7',
        articulo: 'Res. 4816/2008 Art. 7: "El programa de mantenimiento preventivo debe estar distribuido durante todo el año calendario, con actividades programadas para cada mes, evitando concentrar el mantenimiento en un solo período. Debe incluir: cronograma, frecuencia por tipo de equipo, responsable y presupuesto."',
        resultado: res(pctCron, 80),
        puntaje: pctCron,
        meta: 80,
        impacto: 'alto',
        hallazgo: pctCron >= 80
          ? `✓ Cronograma cubre ${mesesCub}/12 meses (${pctCron}%). ${preventivos.length} preventivos, ${correctivos.length} correctivos.`
          : `✗ Cronograma cubre solo ${mesesCub} de 12 meses (${pctCron}%).\n\n• Preventivos programados: ${preventivos.length}\n• Correctivos registrados: ${correctivos.length}\n• Calibraciones: ${calibraciones.length}\n• Sin fecha de ejecución real: ${sinFechaReal.length}\n\nLa Res. 4816/2008 Art. 7 exige cobertura en todos los meses. Un cronograma concentrado en pocos meses puede generar observación de incumplimiento.`,
        mejora: pctCron < 80 ? {
          accion: 'Distribuir el cronograma en todos los meses del año',
          como: `1. Usar el módulo de Mantenimiento en SYNAP → "Cronograma automático"\n2. El sistema distribuye equipos según su frecuencia (semestral, anual, trimestral)\n3. Criterios de distribución:\n   • Equipos clase IIb: mínimo 2 veces/año (enero y julio)\n   • Equipos clase IIa: 1 vez/año distribuido uniformemente\n   • Equipos de calibración: según especificación del fabricante\n4. Balancear carga de trabajo: máximo 40 equipos/técnico/mes (8 horas/día × 22 días)\n5. Imprimir cronograma firmado por el director médico para archivo`,
          responsable: 'Ingeniero Biomédico',
          plazo: '15 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 7',
          riesgo_incumplimiento: 'No Conformidad Menor',
        } : null,
      },
      {
        estandar: 'Plan de mantenimiento',
        criterio: 'Porcentaje de cumplimiento del plan preventivo ≥ 80%',
        normativa: 'Res. 4816/2008 Art. 7 · Circular 015/2009 MSPS',
        articulo: 'Res. 4816/2008 Art. 7 y Circular 015/2009 MSPS: "Las instituciones deben demostrar un porcentaje de cumplimiento del plan de mantenimiento preventivo no inferior al 80% anual. El incumplimiento debe justificarse documentalmente."',
        resultado: res(pctCumpl, 80),
        puntaje: pctCumpl,
        meta: 80,
        impacto: 'alto',
        hallazgo: pctCumpl >= 80
          ? `✓ Cumplimiento del ${pctCumpl}% — supera el mínimo del 80%. ${completados.length}/${mant.length} completados.`
          : `✗ Cumplimiento del ${pctCumpl}% — INCUMPLE el mínimo del 80% exigido.\n\n• Completados: ${completados.length} de ${mant.length}\n• Pendientes o sin ejecutar: ${mant.length - completados.length}\n• Sin fecha real de ejecución: ${sinFechaReal.length}\n\nBrecha: se requieren ${Math.ceil(mant.length * 0.8) - completados.length} mantenimientos adicionales para alcanzar el 80%.`,
        mejora: pctCumpl < 80 ? {
          accion: `Ejecutar ${Math.ceil(mant.length * 0.8) - completados.length} mantenimientos adicionales para alcanzar el 80%`,
          como: `1. Listar todos los mantenimientos pendientes ordenados por criticidad del equipo\n2. Programar jornadas intensivas de mantenimiento priorizando clase IIb y III\n3. Para mantenimientos realizados pero no registrados: digitalizar los registros físicos\n4. Registrar fecha real de ejecución en todos los mantenimientos completados\n5. Justificar documentalmente los mantenimientos que NO se pueden ejecutar (equipo dado de baja, en garantía, etc.)\n6. Meta mensual: ${Math.ceil((Math.ceil(mant.length * 0.8) - completados.length) / 2)} mantenimientos/mes durante 2 meses`,
          responsable: 'Técnicos Biomédicos (ejecución) · Ingeniero (seguimiento)',
          plazo: '60 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 7 · Circular 015/2009',
          riesgo_incumplimiento: 'No Conformidad Mayor con plan de mejora obligatorio',
        } : null,
      },
      {
        estandar: 'Calibraciones',
        criterio: 'Calibración vigente de equipos de medición críticos',
        normativa: 'NTC ISO/IEC 17025 · Res. 4816/2008 Art. 10 · Decreto 4725/2005',
        articulo: 'Res. 4816/2008 Art. 10: "Los equipos de medición biomédica (monitores de signos vitales, desfibriladores, bombas de infusión, ventiladores, electrobisturíes, entre otros) deben calibrarse periódicamente por laboratorios acreditados, con certificado que incluya trazabilidad metrológica."',
        resultado: calibraciones.length > 0 ? res(pctCal, 50) : 'no_cumple',
        puntaje: calibraciones.length > 0 ? pctCal : 0,
        meta: 100,
        impacto: 'alto',
        hallazgo: calibraciones.length === 0
          ? `✗ NO se encontraron calibraciones registradas en el sistema.\n\nEquipos que OBLIGATORIAMENTE requieren calibración periódica:\n• Monitores de signos vitales: ${eq.filter((e:any)=>e.nombre?.toLowerCase().includes('monitor')).length} equipos\n• Bombas de infusión: ${eq.filter((e:any)=>e.nombre?.toLowerCase().includes('bomba')).length} equipos\n• Desfibriladores: ${eq.filter((e:any)=>e.nombre?.toLowerCase().includes('desfibrilador')).length} equipos\n• Ventiladores mecánicos: ${eq.filter((e:any)=>e.nombre?.toLowerCase().includes('ventilador')).length} equipos\n\nLa falta de calibración es una NO CONFORMIDAD MAYOR que puede impactar directamente la seguridad del paciente.`
          : `⚠ ${calibraciones.length} calibraciones registradas. Se requieren para ${altoRiesgo.length} equipos de alto riesgo.\n\nEquipos de medición sin calibración registrada: verificar manualmente.`,
        mejora: {
          accion: 'Implementar programa de calibración periódica',
          como: `1. Identificar todos los equipos que requieren calibración (monitores, desfibriladores, bombas, ventiladores)\n2. Contratar laboratorio de calibración ACREDITADO POR ONAC (onac.org.co → directorio de laboratorios acreditados)\n3. Solicitar certificado de calibración con:\n   • Trazabilidad al INM (Instituto Nacional de Metrología)\n   • Incertidumbre de medición\n   • Resultados antes y después del ajuste\n4. Registrar calibraciones en SYNAP como tipo "calibracion"\n5. Programar próxima calibración según frecuencia recomendada por fabricante (generalmente anual)`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días para programar · 60 días para ejecutar',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 10 · NTC ISO/IEC 17025',
          riesgo_incumplimiento: 'No Conformidad Mayor — riesgo directo para la seguridad del paciente',
        },
      },
      {
        estandar: 'Órdenes de trabajo',
        criterio: 'Registros de mantenimiento con descripción, costo y responsable',
        normativa: 'Res. 4816/2008 Art. 8',
        articulo: 'Res. 4816/2008 Art. 8: "Las órdenes de trabajo de mantenimiento deben contener: descripción de las actividades realizadas, materiales y repuestos utilizados, tiempo empleado, costo de la intervención, nombre y firma del técnico responsable y resultado de las pruebas funcionales post-mantenimiento."',
        resultado: res(pctDoc, 80),
        puntaje: pctDoc,
        meta: 80,
        impacto: 'medio',
        hallazgo: pctDoc >= 80
          ? `✓ ${conDesc}/${mant.length} registros documentados (${pctDoc}%). Costo registrado: ${pctCosto}%.`
          : `✗ Documentación incompleta:\n• Sin descripción: ${sinDesc.length} registros (${100-pctDoc}%)\n• Sin costo en COP: ${sinCosto.length} registros\n• Sin duración: ${sinDuracion.length} registros\n• Con hallazgos: ${conHallazgos.length} (${pct(conHallazgos.length, mant.length)}%)\n\nLos inspectores solicitan muestras aleatorias de órdenes de trabajo. Un registro sin descripción no es válido como evidencia de mantenimiento realizado.`,
        mejora: pctDoc < 80 ? {
          accion: 'Completar la documentación de órdenes de trabajo',
          como: `1. Crear plantilla estándar de OT con campos obligatorios:\n   • Descripción de actividades (mínimo 3 actividades específicas)\n   • Materiales y repuestos usados\n   • Duración en horas\n   • Resultado: "equipo operativo" o descripción del hallazgo\n   • Nombre del técnico\n2. Para registros históricos sin descripción: recuperar de formatos físicos\n3. Implementar regla en SYNAP: no se puede cerrar una OT sin descripción\n4. Capacitar a los técnicos en documentación correcta de OT`,
          responsable: 'Técnicos Biomédicos + Ingeniero Biomédico',
          plazo: '15 días para nuevas OT · 45 días para historial',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 8',
          riesgo_incumplimiento: 'No Conformidad Menor',
        } : null,
      },
    ],

    tecnovigilancia: [
      {
        estandar: 'Programa de Tecnovigilancia',
        criterio: 'Programa institucional de tecnovigilancia documentado y aprobado',
        normativa: 'Res. 4816/2008 Art. 15 · Circular 300-011/2008 INVIMA',
        articulo: 'Res. 4816/2008 Art. 15: "Toda institución prestadora de servicios de salud que utilice dispositivos médicos debe implementar un Programa Institucional de Tecnovigilancia que incluya: objetivos, alcance, responsable, procedimientos de reporte, seguimiento de alertas sanitarias y capacitación del personal."',
        resultado: 'no_cumple',
        puntaje: 0,
        meta: 100,
        impacto: 'alto',
        hallazgo: `✗ No se detecta Programa Institucional de Tecnovigilancia en el sistema.\n\nEste programa es OBLIGATORIO para toda IPS que utilice dispositivos médicos, independientemente de su tamaño.\n\nSin este programa la institución incumple la Res. 4816/2008 Art. 15, lo cual puede resultar en:\n• Multa del INVIMA por incumplimiento al Programa Nacional de Tecnovigilancia\n• Observación en visita de habilitación\n• Responsabilidad civil en caso de evento adverso con dispositivo médico`,
        mejora: {
          accion: 'Elaborar e implementar el Programa Institucional de Tecnovigilancia',
          como: `1. Designar responsable de tecnovigilancia (puede ser el Ingeniero Biomédico)\n2. Registrar el responsable en el portal de tecnovigilancia del INVIMA: https://www.invima.gov.co\n3. Elaborar el documento del programa con:\n   a) Objetivo y alcance\n   b) Marco normativo (Res. 4816/2008, Dec. 4725/2005)\n   c) Definiciones: evento adverso, incidente, casi incidente\n   d) Procedimiento de detección y reporte interno\n   e) Procedimiento de reporte al INVIMA (portal SIVIGILA)\n   f) Plan de capacitación al personal\n   g) Seguimiento de alertas sanitarias\n4. Hacer aprobación por gerencia y socialización con personal asistencial\n5. Registrar el programa en INVIMA como parte del Programa Nacional de Tecnovigilancia`,
          responsable: 'Ingeniero Biomédico + Gerencia',
          plazo: '45 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 15',
          riesgo_incumplimiento: 'No Conformidad Mayor — puede generar multa del INVIMA',
        },
      },
      {
        estandar: 'Reporte de eventos adversos',
        criterio: 'Sistema de reporte de eventos adversos con dispositivos médicos',
        normativa: 'Res. 4816/2008 Art. 16 · Dec. 4725/2005 Art. 37',
        articulo: 'Res. 4816/2008 Art. 16: "Las IPS deben reportar al INVIMA, dentro de los 72 horas siguientes, todo evento adverso serio relacionado con un dispositivo médico. Los eventos no serios deben reportarse dentro de los 30 días."',
        resultado: correctivos.length > 0 ? 'parcial' : 'no_cumple',
        puntaje: correctivos.length > 0 ? 40 : 0,
        meta: 100,
        impacto: 'alto',
        hallazgo: `✗ No hay registro formal de eventos adversos categorizados.\n\n• Mantenimientos correctivos registrados (posibles fallas): ${correctivos.length}\n• Con hallazgos documentados: ${conHallazgos.length}\n\nLos correctivos registrados podrían contener eventos adversos no reportados al INVIMA. Cada falla de un equipo biomédico que afecte o pueda afectar a un paciente debe evaluarse como posible evento adverso.`,
        mejora: {
          accion: 'Implementar sistema de reporte y gestión de eventos adversos',
          como: `1. Crear formato institucional de reporte de eventos adversos con:\n   • Descripción del evento\n   • Equipo involucrado (nombre, serie, modelo)\n   • Paciente afectado (sin datos personales en el reporte inicial)\n   • Categorización: grave / moderado / leve / casi incidente\n2. Para reportar al INVIMA: portal https://tecnovigilancia.invima.gov.co\n3. Revisar los ${correctivos.length} correctivos históricos para identificar posibles eventos no reportados\n4. Capacitar al personal asistencial en identificación y reporte\n5. Establecer canal de comunicación directa entre personal clínico e ingeniería biomédica`,
          responsable: 'Responsable de Tecnovigilancia (Ingeniero Biomédico)',
          plazo: '30 días',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 16',
          riesgo_incumplimiento: 'Incumplimiento grave — responsabilidad penal y civil en caso de evento no reportado',
        },
      },
      {
        estandar: 'Alertas sanitarias',
        criterio: 'Sistema de seguimiento de alertas sanitarias del INVIMA',
        normativa: 'Res. 4816/2008 · Circular INVIMA sobre alertas sanitarias',
        articulo: 'El INVIMA emite alertas sanitarias y comunicaciones de retiro de dispositivos médicos del mercado. Las IPS tienen la obligación de verificar si sus equipos están afectados y tomar las medidas necesarias para proteger a los pacientes.',
        resultado: 'no_cumple',
        puntaje: 0,
        meta: 100,
        impacto: 'alto',
        hallazgo: `✗ No hay registro de seguimiento de alertas sanitarias en el sistema.\n\nActualmente el INVIMA tiene alertas activas para varias marcas de dispositivos médicos. Sin un sistema de seguimiento, la institución no puede saber si alguno de sus ${eq.length} equipos está afectado por:\n• Retiro del mercado\n• Alerta de seguridad\n• Modificación de instrucciones de uso\n• Actualización de software de seguridad`,
        mejora: {
          accion: 'Implementar sistema de seguimiento de alertas INVIMA',
          como: `1. Suscribirse a las alertas del INVIMA: https://www.invima.gov.co → alertas sanitarias\n2. Designar responsable de revisar alertas semanalmente\n3. Cuando llegue una alerta:\n   a) Verificar si algún equipo del inventario coincide (marca, modelo, serie)\n   b) Si hay coincidencia: aislar el equipo y contactar al proveedor\n   c) Registrar en SYNAP el estado del equipo como "alerta sanitaria activa"\n4. Documentar el seguimiento de cada alerta como evidencia para auditoría\n5. Informar al comité de calidad sobre alertas activas`,
          responsable: 'Responsable de Tecnovigilancia',
          plazo: '15 días',
          normativa_cumplimiento: 'Res. 4816/2008 · Circulares INVIMA',
          riesgo_incumplimiento: 'Responsabilidad civil y penal si un paciente resulta afectado por un equipo con alerta activa',
        },
      },
    ],

    pamec: [
      {
        estandar: 'Seguridad del paciente',
        criterio: 'Identificación y gestión de riesgos tecnológicos para el paciente',
        normativa: 'Decreto 1011/2006 Art. 3 · Resolución 1446/2006 MSPS',
        articulo: 'Decreto 1011/2006 Art. 3: "El SOGCS incluye como componente la gestión del riesgo, que comprende la identificación, análisis, evaluación y control de los riesgos para la seguridad del paciente, incluyendo los asociados a la tecnología biomédica." La Res. 1446/2006 define los indicadores de seguimiento.',
        resultado: res(pctAltoMant, 80),
        puntaje: pctAltoMant,
        meta: 100,
        impacto: 'alto',
        hallazgo: `• Equipos de alto riesgo identificados: ${altoRiesgo.length}\n• Con mantenimiento registrado: ${altoRiesgo.filter((e:any)=>eqConMant.has(e.id)).length} (${pctAltoMant}%)\n• Sin ninguna intervención: ${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length}\n• Operativos: ${operativos.length}/${eq.length} (${pctDisp}%)\n\n${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length > 0 ? `✗ ${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} equipos de ALTO RIESGO sin ninguna intervención registrada — riesgo directo para la seguridad del paciente.` : '✓ Todos los equipos de alto riesgo tienen mantenimiento registrado.'}`,
        mejora: altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length > 0 ? {
          accion: 'Intervenir los equipos de alto riesgo sin mantenimiento',
          como: `1. Prioridad INMEDIATA: realizar inspección visual de los ${altoRiesgo.filter((e:any)=>!eqConMant.has(e.id)).length} equipos de alto riesgo sin historial\n2. Verificar funcionamiento con pruebas básicas\n3. Programar mantenimiento preventivo completo\n4. Si el equipo no está en condiciones: retirar del servicio hasta reparación\n5. Documentar en SYNAP como mantenimiento correctivo de emergencia\n6. Notificar al director médico y jefe de servicio`,
          responsable: 'Ingeniero Biomédico — URGENTE',
          plazo: 'Inmediato',
          normativa_cumplimiento: 'Decreto 1011/2006 · Res. 1446/2006',
          riesgo_incumplimiento: 'Riesgo directo para la vida del paciente',
        } : null,
      },
      {
        estandar: 'Indicadores de calidad',
        criterio: 'KPIs biomédicos calculados, con metas y reporte periódico a dirección',
        normativa: 'Res. 1446/2006 MSPS · Res. 256/2016 MSPS',
        articulo: 'Res. 256/2016 MSPS: "Las IPS deben calcular y reportar periódicamente los indicadores de calidad en salud, incluyendo los indicadores de gestión tecnológica: disponibilidad de equipos, tiempo medio entre fallas (MTBF) y tiempo medio de reparación (MTTR)."',
        resultado: mant.length > 0 ? 'parcial' : 'no_cumple',
        puntaje: mant.length > 0 ? 55 : 0,
        meta: 80,
        impacto: 'alto',
        hallazgo: `• Disponibilidad actual: ${pctDisp}% (meta recomendada OPS: ≥ 90%)\n• Ratio preventivo/correctivo: ${correctivos.length > 0 ? (preventivos.length/correctivos.length).toFixed(2) : 'N/D'} (meta: ≥ 0.80)\n• Cumplimiento preventivo: ${pctCumpl}% (meta mínima: 80%)\n\nSYNAP calcula estos KPIs automáticamente pero no hay evidencia de:\n• Metas formales aprobadas por dirección\n• Reportes periódicos al comité de calidad\n• Acciones correctivas ante desviaciones`,
        mejora: {
          accion: 'Formalizar reporte mensual de KPIs biomédicos a dirección',
          como: `1. Usar el módulo de KPIs de SYNAP para generar informe mensual\n2. Definir metas institucionales (propuesta):\n   • Disponibilidad ≥ 90%\n   • Cumplimiento preventivo ≥ 80%\n   • MTTR ≤ 24 horas para equipos críticos\n   • Ratio prev/corr ≥ 0.80\n3. Presentar en comité de calidad mensual con:\n   • Indicadores del mes vs meta\n   • Tendencia últimos 3 meses\n   • Alertas y planes de acción\n4. Documentar en acta de comité (evidencia para PAMEC)\n5. Registrar en el sistema de información de calidad institucional`,
          responsable: 'Ingeniero Biomédico',
          plazo: '30 días',
          normativa_cumplimiento: 'Res. 256/2016 MSPS',
          riesgo_incumplimiento: 'Incumplimiento del SOGCS — observación en auditoría PAMEC',
        },
      },
    ],

    acreditacion: [
      {
        estandar: 'Gestión tecnológica',
        criterio: 'Inventario biomédico 100% completo con todos los campos',
        normativa: 'ICONTEC Manual de Estándares de Acreditación — Gestión de Tecnología',
        articulo: 'ICONTEC Estándares de Acreditación, Sección Gestión Tecnológica: "La organización cuenta con un inventario actualizado de todos los dispositivos médicos con información completa que incluye: identificación, características técnicas, vida útil, estado funcional, historial de mantenimiento y costo de adquisición."',
        resultado: res(pctSerie, 95),
        puntaje: Math.min(pctSerie, pctMarca, pctClase),
        meta: 95,
        impacto: 'alto',
        hallazgo: `Completitud del inventario:\n• Número de serie: ${pctSerie}% (${conSerie}/${eq.length})\n• Marca: ${pctMarca}% (${conMarca}/${eq.length})\n• Clase INVIMA: ${pctClase}% (${conClase}/${eq.length})\n• Año adquisición: ${pctAnio}% (${conAnio}/${eq.length})\n• Vida útil: ${pctVida}% (${conVida}/${eq.length})\n\nPara acreditación ICONTEC se requiere mínimo 95% en todos los campos.`,
        mejora: {
          accion: 'Alcanzar 95% de completitud en todos los campos del inventario',
          como: `1. Jornada de verificación física de todos los equipos (2-3 días)\n2. Para cada equipo incompleto: verificar placa, manual y documentación de compra\n3. Completar en orden de prioridad: serie → marca/modelo → clase INVIMA → año → vida útil\n4. Para acreditación: también registrar valor de adquisición y proveedor\n5. Fotografiar cada equipo como evidencia de verificación física`,
          responsable: 'Equipo de Ingeniería Biomédica',
          plazo: '60 días',
          normativa_cumplimiento: 'ICONTEC Manual de Acreditación — Gestión Tecnológica',
          riesgo_incumplimiento: 'Criterio no cumplido — impide obtener acreditación',
        },
      },
    ],

    secretaria: [
      {
        estandar: 'Habilitación',
        criterio: 'Certificado de habilitación vigente',
        normativa: 'Res. 3100/2019 · Decreto 780/2016',
        articulo: 'Decreto 780/2016 Art. 2.5.1.1: "Ninguna institución puede prestar servicios de salud sin contar con el registro de habilitación vigente otorgado por la Secretaría de Salud departamental o distrital correspondiente."',
        resultado: 'parcial',
        puntaje: 50,
        meta: 100,
        impacto: 'alto',
        hallazgo: `⚠ No es posible verificar automáticamente si el certificado de habilitación está vigente. Este es el primer documento que solicita cualquier inspector de la Secretaría de Salud.\n\nLos inspectores verifican:\n• Vigencia del certificado\n• Que los servicios prestados coincidan con los habilitados\n• Que el personal y dotación correspondan a lo declarado en la habilitación`,
        mejora: {
          accion: 'Verificar y mantener actualizado el certificado de habilitación',
          como: `1. Consultar el Registro Especial de Prestadores de Servicios de Salud (REPS): https://prestadores.minsalud.gov.co\n2. Verificar que todos los servicios actualmente prestados estén habilitados\n3. Si hay servicios sin habilitar: iniciar proceso ante la Secretaría de Salud\n4. Mantener copia impresa del certificado en lugar visible de la institución\n5. Programar renovación con 3 meses de anticipación a la fecha de vencimiento`,
          responsable: 'Gerente/Director + Coordinador de Calidad',
          plazo: 'Verificar inmediatamente',
          normativa_cumplimiento: 'Decreto 780/2016 · Res. 3100/2019',
          riesgo_incumplimiento: 'Cierre inmediato de la institución si el certificado está vencido',
        },
      },
      {
        estandar: 'Equipos biomédicos',
        criterio: 'Inventario disponible y actualizado para inspección',
        normativa: 'Res. 4816/2008 · Res. 3100/2019',
        articulo: 'Res. 3100/2019: El inventario de dispositivos médicos debe estar disponible y actualizado en el momento de la visita de habilitación. Debe incluir todos los equipos en uso con su identificación completa.',
        resultado: res(pctSerie, 70),
        puntaje: pctSerie,
        meta: 100,
        impacto: 'alto',
        hallazgo: `Estado del inventario para inspección:\n• Equipos registrados: ${eq.length}\n• Con datos completos: ${conSerie} (${pctSerie}%)\n• Con número de serie: ${conSerie}/${eq.length}\n• Con clase INVIMA: ${conClase}/${eq.length}\n\n${pctSerie < 80 ? `✗ El ${100-pctSerie}% del inventario tiene datos incompletos. Los inspectores pueden marcar esto como observación.` : `✓ Inventario en condiciones aceptables para inspección.`}`,
        mejora: pctSerie < 80 ? {
          accion: 'Completar el inventario antes de la visita',
          como: `1. Priorizar la completitud del inventario ANTES de cualquier visita de la Secretaría\n2. Los inspectores solicitan inventario impreso firmado por el representante legal\n3. Imprimir reporte de inventario desde SYNAP con todos los campos\n4. Complementar con hoja de vida de equipos críticos (ventiladores, monitores, desfibriladores)\n5. Tener disponible en formato físico Y digital`,
          responsable: 'Ingeniero Biomédico',
          plazo: '15 días antes de cualquier visita programada',
          normativa_cumplimiento: 'Res. 4816/2008 · Res. 3100/2019',
          riesgo_incumplimiento: 'Observación en visita — puede generar plan de mejora con plazo de 30 días',
        } : null,
      },
      {
        estandar: 'Mantenimiento',
        criterio: 'Cronograma y evidencias de mantenimiento disponibles para inspección',
        normativa: 'Res. 4816/2008 Art. 7',
        articulo: 'Res. 4816/2008 Art. 7: Las IPS deben tener disponible para consulta de los inspectores el cronograma de mantenimiento anual vigente y las evidencias de ejecución de los mantenimientos realizados (órdenes de trabajo firmadas).',
        resultado: res(pctCumpl, 75),
        puntaje: Math.round((pctCumpl + pctCron)/2),
        meta: 80,
        impacto: 'alto',
        hallazgo: `• Cumplimiento del plan: ${pctCumpl}% (mínimo 80%)\n• Cobertura mensual: ${mesesCub}/12 meses\n• Sin fecha de ejecución: ${sinFechaReal.length} registros\n• Sin descripción: ${sinDesc.length} registros\n\n${pctCumpl < 80 ? `✗ Cumplimiento por debajo del mínimo. Los inspectores pueden generar observación por incumplimiento del Art. 7.` : `✓ Cumplimiento aceptable para inspección.`}`,
        mejora: pctCumpl < 80 ? {
          accion: 'Preparar documentación de mantenimiento para inspección',
          como: `1. Imprimir cronograma anual firmado por el representante legal\n2. Preparar carpeta con órdenes de trabajo del año en curso, organizadas por mes\n3. Para cada OT tener: descripción de actividades, firma del técnico y fecha de ejecución\n4. Preparar indicador de cumplimiento mensual para presentar al inspector\n5. Si hay mantenimientos atrasados: tener justificación documentada`,
          responsable: 'Ingeniero Biomédico',
          plazo: 'Antes de cualquier visita',
          normativa_cumplimiento: 'Res. 4816/2008 Art. 7',
          riesgo_incumplimiento: 'Observación en visita de habilitación',
        } : null,
      },
    ],

    supersalud: [
      {
        estandar: 'Calidad de atención',
        criterio: 'Disponibilidad de equipos biomédicos ≥ 90%',
        normativa: 'Supersalud · Circular Externa 030/2006 · Res. 256/2016',
        articulo: 'Supersalud Circular 030/2006: "Las IPS deben garantizar una disponibilidad mínima del 90% de los equipos biomédicos esenciales para la prestación de los servicios habilitados. La indisponibilidad de equipos críticos debe reportarse y justificarse."',
        resultado: res(pctDisp, 90),
        puntaje: pctDisp,
        meta: 90,
        impacto: 'alto',
        hallazgo: `• Disponibilidad actual: ${pctDisp}% — ${pctDisp >= 90 ? '✓ Cumple la meta del 90%' : '✗ No cumple — meta: 90%'}\n• Equipos operativos: ${operativos.length}/${eq.length}\n• Fuera de servicio: ${fueraSvc.length}\n• Dados de baja: ${enBaja.length}\n\n${pctDisp < 90 ? `La Supersalud puede imponer multas o planes de mejora por disponibilidad inferior al 90%. Se requieren ${Math.ceil(eq.length * 0.9) - operativos.length} equipos adicionales en estado operativo para cumplir la meta.` : ''}`,
        mejora: pctDisp < 90 ? {
          accion: `Aumentar disponibilidad al 90% (${Math.ceil(eq.length * 0.9) - operativos.length} equipos adicionales deben quedar operativos)`,
          como: `1. Identificar los ${fueraSvc.length} equipos fuera de servicio y priorizar su reparación\n2. Para cada equipo no operativo: documentar causa, técnico responsable y fecha estimada de restitución\n3. Evaluar si equipos fuera de servicio por tiempo prolongado deben darse de baja y reemplazarse\n4. Para equipos en garantía: activar la garantía inmediatamente\n5. Para equipos sin repuesto: cotizar y adquirir con urgencia\n6. Reportar a la Supersalud si la indisponibilidad afecta servicios críticos`,
          responsable: 'Ingeniero Biomédico + Dirección',
          plazo: '30 días',
          normativa_cumplimiento: 'Supersalud Circular 030/2006',
          riesgo_incumplimiento: 'Multa administrativa · Plan de mejoramiento obligatorio',
        } : null,
      },
    ],

    iso9001: [
      {
        estandar: 'Sistema de gestión de calidad (SGC)',
        criterio: 'Proceso de gestión biomédica documentado en el SGC',
        normativa: 'ISO 9001:2015 Cláusula 4.4 · 7.5',
        articulo: 'ISO 9001:2015 Cláusula 4.4: "La organización debe establecer, implementar, mantener y mejorar continuamente el sistema de gestión de la calidad, incluyendo los procesos necesarios y sus interacciones." Cláusula 7.5: "La información documentada debe mantenerse y controlarse."',
        resultado: pctSerie >= 80 ? 'parcial' : 'no_cumple',
        puntaje: pctSerie >= 80 ? 60 : Math.round(pctSerie * 0.7),
        meta: 90,
        impacto: 'alto',
        hallazgo: `Estado del proceso de gestión biomédica:\n• Inventario documentado: ${pctSerie}% con serie, ${pctClase}% con clase INVIMA\n• Mantenimientos registrados: ${mant.length}\n• Documentación de OT: ${pctDoc}%\n\nISO 9001 requiere que el proceso esté completamente definido con: entradas, actividades, salidas, responsables, indicadores y mejora continua.`,
        mejora: {
          accion: 'Documentar el proceso de gestión biomédica en el mapa de procesos del SGC',
          como: `1. Elaborar ficha de proceso "Gestión de Tecnología Biomédica" con:\n   • Objetivo del proceso\n   • Entradas (requisitos de mantenimiento, fallas reportadas)\n   • Actividades principales (inventario, mantenimiento preventivo, correctivo, calibración)\n   • Salidas (equipos operativos, reportes de KPIs)\n   • Indicadores con metas\n   • Responsable del proceso\n2. Incorporar al mapa de procesos institucional\n3. Establecer revisión periódica del proceso (mínimo anual)\n4. Documentar el procedimiento de mantenimiento preventivo y correctivo`,
          responsable: 'Ingeniero Biomédico + Coordinador de Calidad',
          plazo: '60 días',
          normativa_cumplimiento: 'ISO 9001:2015 Cláusula 4.4 · 7.5',
          riesgo_incumplimiento: 'No conformidad en auditoría de certificación ISO 9001',
        },
      },
    ],

    iso13485: [
      {
        estandar: 'Trazabilidad de dispositivos',
        criterio: 'Trazabilidad completa de cada dispositivo médico (número de serie, historial)',
        normativa: 'ISO 13485:2016 Cláusula 7.5.9 · 8.3',
        articulo: 'ISO 13485:2016 Cláusula 7.5.9: "La organización debe mantener registros de trazabilidad para todos los dispositivos médicos, incluyendo: identificación única, historial de uso, mantenimientos, reparaciones y cualquier incidente o evento adverso relacionado con el dispositivo."',
        resultado: res(pctSerie, 90),
        puntaje: pctSerie,
        meta: 100,
        impacto: 'alto',
        hallazgo: `Trazabilidad actual:\n• Con número de serie: ${conSerie}/${eq.length} (${pctSerie}%)\n• Con historial de mantenimiento: ${conMantEq}/${eq.length} (${pctHV}%)\n• Con costo documentado: ${conCosto}/${mant.length} (${pctCosto}%)\n\nISO 13485 exige trazabilidad del 100% de los dispositivos durante toda su vida útil.`,
        mejora: {
          accion: 'Completar trazabilidad al 100% de los dispositivos',
          como: `1. Completar número de serie de todos los equipos sin este dato\n2. Para cada equipo: mantener registro continuo de toda intervención\n3. Implementar identificador único (QR o código de barras) en cada equipo\n4. Documentar: fecha de instalación, mantenimientos, reparaciones, repuestos y retiro del servicio\n5. Mantener trazabilidad por mínimo 10 años después de la vida útil del dispositivo`,
          responsable: 'Ingeniero Biomédico',
          plazo: '60 días',
          normativa_cumplimiento: 'ISO 13485:2016 Cláusula 7.5.9',
          riesgo_incumplimiento: 'No conformidad mayor en auditoría ISO 13485',
        },
      },
    ],

    iso17025: [
      {
        estandar: 'Trazabilidad metrológica',
        criterio: 'Calibraciones con trazabilidad al Instituto Nacional de Metrología (INM)',
        normativa: 'ISO/IEC 17025:2017 Cláusula 6.5',
        articulo: 'ISO/IEC 17025:2017 Cláusula 6.5: "Los resultados de medición deben ser trazables al Sistema Internacional de Unidades (SI) mediante una cadena ininterrumpida de calibraciones, cada una contribuyendo a la incertidumbre de medición, hasta el patrón primario nacional o internacional."',
        resultado: calibraciones.length > 0 ? 'parcial' : 'no_cumple',
        puntaje: calibraciones.length > 0 ? 40 : 0,
        meta: 100,
        impacto: 'alto',
        hallazgo: `• Calibraciones registradas: ${calibraciones.length}\n• Equipos de alto riesgo que requieren calibración: ${altoRiesgo.length}\n\nISO 17025 aplica principalmente cuando la IPS:\n1. Tiene su propio laboratorio de calibración interno\n2. Contrata laboratorios externos de calibración\n\nEn el segundo caso, la IPS debe exigir que el laboratorio contratado esté acreditado por ONAC con alcance de calibración para los equipos biomédicos correspondientes.`,
        mejora: {
          accion: 'Implementar control de calibraciones con trazabilidad ONAC',
          como: `1. Identificar todos los equipos de medición que requieren calibración:\n   • Monitores de signos vitales (presión, SpO2, temperatura)\n   • Desfibriladores (energía de descarga)\n   • Bombas de infusión (flujo y volumen)\n   • Ventiladores (volumen, presión, flujo)\n   • Glucómetros\n2. Para cada equipo: verificar si el fabricante especifica calibración periódica\n3. Buscar laboratorio ONAC acreditado: https://onac.org.co → directorio de acreditados\n4. Exigir en el contrato de calibración: certificado con trazabilidad al INM e incertidumbre de medición\n5. Registrar en SYNAP con número de certificado y fecha de vencimiento`,
          responsable: 'Ingeniero Biomédico',
          plazo: '45 días',
          normativa_cumplimiento: 'ISO/IEC 17025:2017 Cláusula 6.5 · NTC ISO/IEC 17025',
          riesgo_incumplimiento: 'Mediciones no confiables — riesgo para la seguridad del paciente',
        },
      },
    ],
  }

  const eqConMant2 = new Set(mant.map(m => m.equipo_id))
  return CRITERIOS[tipo]?.map(c => ({
    ...c,
    _eqConMant: eqConMant2,
  })) || []
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

async function getIID(): Promise<string> {
  try {
    const r = await fetch('/api/auth/me')
    const d = await r.json()
    return d.institucion_id || '00000000-0000-0000-0000-000000000001'
  } catch {
    return '00000000-0000-0000-0000-000000000001'
  }
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
    try {
      const supabase = createClient()
      const IID = await getIID()
      const [eqR, mantR, repR] = await Promise.all([
        supabase.from('equipos').select('*').eq('institucion_id',IID).eq('activo',true),
        supabase.from('mantenimientos').select('*').eq('institucion_id',IID),
        supabase.from('repuestos').select('*').eq('institucion_id',IID),
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
        altoRiesgo: eq.filter(e=>e.riesgo==='alto').length,
      })
    } catch(err) {
      console.error(err)
    }
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
      <style>{`
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .hallazgo-text{white-space:pre-line;line-height:1.7}
        @media print{.no-print{display:none!important}}
      `}</style>

      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}} className="no-print">
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Calidad / Auditoría</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>
            {fase==='seleccion'?'Seleccionar tipo de auditoría':fase==='ejecutando'?'Analizando datos reales...':audSel?.nombre}
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
              Selecciona el tipo de auditoría. El sistema consultará directamente tus datos en Supabase y generará hallazgos específicos con los artículos exactos de la normativa incumplida y el plan de mejora detallado.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20}}>
              {AUDITORIAS.map(a=>(
                <div key={a.id} onClick={()=>setTipoSel(a.id)}
                  style={{padding:'16px',borderRadius:12,border:`${tipoSel===a.id?'2px':'0.5px'} solid ${tipoSel===a.id?a.color:'#E4E4E7'}`,background:tipoSel===a.id?a.bg:'#fff',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:9,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className={'ti '+a.icon} style={{fontSize:18,color:a.color}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:1}}>{a.nombre}</div>
                    <div style={{fontSize:11,color:a.color,fontWeight:500}}>{a.subtitulo}</div>
                  </div>
                  {tipoSel===a.id&&<i className="ti ti-check" style={{fontSize:17,color:a.color,flexShrink:0}}/>}
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
            <div style={{fontSize:15,fontWeight:600,color:'#18181B'}}>Consultando Supabase directamente...</div>
            <div style={{fontSize:13,color:'#71717A',textAlign:'center',maxWidth:400}}>Analizando equipos, mantenimientos, repuestos y cronogramas. Calculando cumplimiento por artículo normativo.</div>
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

            {/* RESUMEN */}
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
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500,flexShrink:0}}>{rs.label}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{padding:'12px 16px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE',fontSize:12,color:'#3B4FE8',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <i className="ti ti-database" style={{fontSize:14,flexShrink:0}}/>
                  <strong>Datos analizados en tiempo real:</strong>
                  {resumen&&[{l:'Equipos',v:resumen.equipos},{l:'Mant.',v:resumen.mantenimientos},{l:'Repuestos',v:resumen.repuestos},{l:'Preventivos',v:resumen.preventivos},{l:'Correctivos',v:resumen.correctivos},{l:'Alto riesgo',v:resumen.altoRiesgo}].map(s=>(
                    <span key={s.l}><strong>{s.v?.toLocaleString('es-CO')}</strong> {s.l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* DETALLE */}
            {tab==='detalle'&&(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {criterios.map((c,i)=>{
                  const rs=RS[c.resultado]||RS.no_cumple
                  const exp=expandidos[i]
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,border:`0.5px solid ${c.resultado==='no_cumple'?'#FECACA':c.resultado==='parcial'?'#FDE68A':'#E4E4E7'}`,overflow:'hidden'}}>
                      <div onClick={()=>setExpandidos(p=>({...p,[i]:!p[i]}))} style={{padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{width:34,height:34,borderRadius:8,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                          <i className={'ti '+rs.icon} style={{fontSize:17,color:rs.text}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:5}}>
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'#F4F4F5',color:'#52525B',fontWeight:500}}>{c.estandar}</span>
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:c.impacto==='alto'?'#FEF2F2':'#FFFBEB',color:c.impacto==='alto'?'#DC2626':'#D97706',fontWeight:600}}>Impacto {c.impacto.toUpperCase()}</span>
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'#EEF2FF',color:'#3B4FE8',fontWeight:500}}>{c.normativa}</span>
                          </div>
                          <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:6}}>{c.criterio}</div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:6,background:'#F4F4F5',borderRadius:3,maxWidth:200}}>
                              <div style={{height:6,borderRadius:3,width:`${c.puntaje}%`,background:rs.text}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:700,color:rs.text}}>{c.puntaje}% / meta {c.meta}%</span>
                            <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:600}}>{rs.label}</span>
                          </div>
                        </div>
                        <i className={'ti '+(exp?'ti-chevron-up':'ti-chevron-down')} style={{fontSize:14,color:'#A1A1AA',flexShrink:0,marginTop:8}}/>
                      </div>

                      {exp&&(
                        <div style={{borderTop:'0.5px solid #F4F4F5',padding:'16px 18px',background:'#FAFAFA',display:'flex',flexDirection:'column',gap:10}}>
                          {/* Artículo */}
                          <div style={{padding:'10px 14px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                            <div style={{fontSize:11,fontWeight:600,color:'#3B4FE8',marginBottom:4}}>📖 Normativa aplicable</div>
                            <div style={{fontSize:12,color:'#3F3F46',lineHeight:1.6,fontStyle:'italic'}}>{c.articulo}</div>
                          </div>
                          {/* Hallazgo */}
                          <div style={{padding:'10px 14px',borderRadius:8,background:rs.bg,border:`0.5px solid ${rs.border}`}}>
                            <div style={{fontSize:11,fontWeight:600,color:rs.text,marginBottom:4}}>📋 Hallazgo del análisis</div>
                            <div className="hallazgo-text" style={{fontSize:12,color:'#52525B'}}>{c.hallazgo}</div>
                          </div>
                          {/* Mejora */}
                          {c.mejora&&typeof c.mejora==='object'&&(
                            <div style={{padding:'10px 14px',borderRadius:8,background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                              <div style={{fontSize:11,fontWeight:600,color:'#16A34A',marginBottom:8}}>✅ Acción de mejora recomendada</div>
                              <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:6}}>{c.mejora.accion}</div>
                              <div className="hallazgo-text" style={{fontSize:12,color:'#52525B',marginBottom:8}}>{c.mejora.como}</div>
                              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                                {[
                                  {l:'👤 Responsable',v:c.mejora.responsable,c:'#3B4FE8',bg:'#EEF2FF'},
                                  {l:'⏱ Plazo',v:c.mejora.plazo,c:c.impacto==='alto'?'#DC2626':'#D97706',bg:c.impacto==='alto'?'#FEF2F2':'#FFFBEB'},
                                  {l:'⚠ Riesgo si no cumple',v:c.mejora.riesgo_incumplimiento,c:'#DC2626',bg:'#FEF2F2'},
                                ].map(m=>(
                                  <div key={m.l} style={{padding:'6px 10px',borderRadius:6,background:m.bg,border:`0.5px solid ${m.c}30`,flex:'1 1 auto'}}>
                                    <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>{m.l}</div>
                                    <div style={{fontSize:11,fontWeight:500,color:m.c}}>{m.v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{fontSize:11,color:'#A1A1AA',display:'flex',gap:16}}>
                            <span>Meta: <strong style={{color:'#18181B'}}>{c.meta}%</strong></span>
                            <span>Actual: <strong style={{color:rs.text}}>{c.puntaje}%</strong></span>
                            <span>Brecha: <strong style={{color:'#DC2626'}}>{Math.max(c.meta-c.puntaje,0)}%</strong></span>
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
                {noConf.length===0?(
                  <div style={{textAlign:'center',padding:'48px',background:'#F0FDF4',borderRadius:12,border:'0.5px solid #BBF7D0'}}>
                    <i className="ti ti-award" style={{fontSize:40,color:'#16A34A',display:'block',marginBottom:10}}/>
                    <div style={{fontSize:18,fontWeight:700,color:'#16A34A',marginBottom:4}}>¡Sin no conformidades!</div>
                    <div style={{fontSize:13,color:'#71717A'}}>La institución cumple con todos los criterios evaluados.</div>
                  </div>
                ):(
                  <>
                    <div style={{padding:'12px 16px',borderRadius:8,background:'#FEF2F2',border:'0.5px solid #FECACA',fontSize:13,color:'#DC2626',display:'flex',gap:8,alignItems:'center'}}>
                      <i className="ti ti-alert-triangle" style={{fontSize:15,flexShrink:0}}/><strong>{noCumple} no conformidades</strong> y <strong>{parcial} ítems parciales</strong> requieren acción. Total: {noConf.length} hallazgos.
                    </div>
                    {noConf
                      .sort((a,b)=>{const o:any={no_cumple:0,parcial:1}; return (o[a.resultado]||1)-(o[b.resultado]||1)})
                      .map((c,i)=>{
                      const rs=RS[c.resultado]
                      const m=c.mejora
                      return (
                        <div key={i} style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                          {/* Header */}
                          <div style={{padding:'14px 20px',borderBottom:'0.5px solid #F4F4F5',background:'#FAFAFA',display:'flex',gap:12,alignItems:'flex-start'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#3B4FE8',flexShrink:0,marginTop:2}}>{i+1}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:600,color:'#18181B',marginBottom:4}}>{c.criterio}</div>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:600}}>{rs.label}</span>
                                <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#F4F4F5',color:'#52525B'}}>{c.estandar}</span>
                                <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#EEF2FF',color:'#3B4FE8',fontWeight:500}}>{c.normativa}</span>
                              </div>
                            </div>
                            {m&&<div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>Plazo</div>
                              <div style={{fontSize:12,fontWeight:700,color:c.impacto==='alto'?'#DC2626':'#D97706'}}>{m.plazo}</div>
                            </div>}
                          </div>
                          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
                            {/* Artículo */}
                            <div style={{padding:'10px 14px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                              <div style={{fontSize:11,fontWeight:600,color:'#3B4FE8',marginBottom:3}}>📖 Artículo incumplido</div>
                              <div style={{fontSize:12,color:'#3F3F46',lineHeight:1.6,fontStyle:'italic'}}>{c.articulo}</div>
                            </div>
                            {/* Hallazgo */}
                            <div style={{padding:'10px 14px',borderRadius:8,background:'#FEF2F2',border:'0.5px solid #FECACA'}}>
                              <div style={{fontSize:11,fontWeight:600,color:'#DC2626',marginBottom:3}}>📋 Hallazgo específico</div>
                              <div className="hallazgo-text" style={{fontSize:12,color:'#52525B'}}>{c.hallazgo}</div>
                            </div>
                            {/* Acción */}
                            {m&&<div style={{padding:'12px 14px',borderRadius:8,background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                              <div style={{fontSize:11,fontWeight:600,color:'#16A34A',marginBottom:6}}>✅ Acción de mejora — Paso a paso</div>
                              <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:8}}>{m.accion}</div>
                              <div className="hallazgo-text" style={{fontSize:12,color:'#52525B',marginBottom:10}}>{m.como}</div>
                              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                                {[
                                  {l:'👤 Responsable',v:m.responsable,c:'#3B4FE8',bg:'#EEF2FF'},
                                  {l:'⏱ Plazo',v:m.plazo,c:c.impacto==='alto'?'#DC2626':'#D97706',bg:c.impacto==='alto'?'#FEF2F2':'#FFFBEB'},
                                  {l:'⚠ Riesgo si no cumple',v:m.riesgo_incumplimiento,c:'#DC2626',bg:'#FEF2F2'},
                                ].map(x=>(
                                  <div key={x.l} style={{padding:'8px 10px',borderRadius:6,background:x.bg,border:`0.5px solid ${x.c}30`}}>
                                    <div style={{fontSize:10,color:'#A1A1AA',marginBottom:3}}>{x.l}</div>
                                    <div style={{fontSize:11,fontWeight:500,color:x.c}}>{x.v}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{marginTop:8,padding:'6px 10px',borderRadius:6,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                                <span style={{fontSize:11,color:'#3B4FE8'}}>📋 Normativa que se cumple al implementar: <strong>{m.normativa_cumplimiento}</strong></span>
                              </div>
                            </div>}
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
