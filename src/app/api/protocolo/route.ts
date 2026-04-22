import { NextResponse } from 'next/server'

const PROTOCOLOS: Record<string, any[]> = {
  'monitor': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos visibles en carcasa o pantalla?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿El estado físico general del equipo es?', tipo:'seleccion', opciones:['Bueno','Regular','Malo'], valor_esperado:'Bueno', critica:false, advertencia:null },
    { numero:3, categoria:'Inspección inicial', pregunta:'¿Los cables de paciente están en buen estado (sin cortes ni dobladuras)?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Cables dañados pueden causar lecturas incorrectas' },
    { numero:4, categoria:'Limpieza', pregunta:'¿Se realizó limpieza externa del equipo con paño húmedo?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:5, categoria:'Limpieza', pregunta:'¿Se limpió la pantalla con producto apropiado?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:'No usar alcohol directamente sobre la pantalla' },
    { numero:6, categoria:'Limpieza', pregunta:'¿Se limpiaron los conectores de cables con aire comprimido?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:7, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación medido', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:'Desconectar antes de abrir el equipo' },
    { numero:8, categoria:'Verificación eléctrica', pregunta:'¿La corriente de fuga está dentro del rango permitido?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Valor máximo permitido: 100 μA según IEC 60601' },
    { numero:9, categoria:'Verificación eléctrica', pregunta:'¿El cable de tierra está correctamente conectado?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:10, categoria:'Verificación funcional', pregunta:'¿El equipo enciende correctamente sin alarmas de error?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:11, categoria:'Verificación funcional', pregunta:'¿La medición de SpO2 con simulador es correcta?', tipo:'valor_numerico', unidad:'%', valor_esperado:'98-100', critica:true, advertencia:'Usar simulador de paciente calibrado' },
    { numero:12, categoria:'Verificación funcional', pregunta:'¿La medición de frecuencia cardíaca con simulador es correcta?', tipo:'valor_numerico', unidad:'lpm', valor_esperado:'60-100', critica:true, advertencia:null },
    { numero:13, categoria:'Verificación funcional', pregunta:'¿La alarma de SpO2 bajo funciona correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:14, categoria:'Verificación funcional', pregunta:'¿El estado de la batería es?', tipo:'seleccion', opciones:['Óptimo','Requiere carga','Reemplazar'], valor_esperado:'Óptimo', critica:false, advertencia:null },
    { numero:15, categoria:'Cierre', pregunta:'Selecciona los ítems verificados en este mantenimiento', tipo:'checklist', opciones:['Limpieza externa','Limpieza interna','Verificación eléctrica','Prueba funcional','Revisión de cables','Verificación de alarmas'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:16, categoria:'Cierre', pregunta:'¿El equipo queda en condiciones óptimas para uso clínico?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:17, categoria:'Cierre', pregunta:'Observaciones generales del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'ventilador': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos visibles?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿El circuito de paciente está completo y sin daños?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Verificar mangueras, válvulas y conectores' },
    { numero:3, categoria:'Limpieza', pregunta:'¿Se realizó limpieza y desinfección del circuito externo?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Usar desinfectante de nivel intermedio' },
    { numero:4, categoria:'Limpieza', pregunta:'¿Se limpió el filtro de aire de la turbina?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:5, categoria:'Limpieza', pregunta:'¿El estado del filtro bacteriano es?', tipo:'seleccion', opciones:['Bueno — conservar','Regular — reemplazar pronto','Malo — reemplazar ya'], valor_esperado:'Bueno — conservar', critica:true, advertencia:null },
    { numero:6, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:'Verificar con multímetro calibrado' },
    { numero:7, categoria:'Verificación eléctrica', pregunta:'¿La corriente de fuga es menor a 100 μA?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Valor crítico para equipos de soporte vital' },
    { numero:8, categoria:'Verificación funcional', pregunta:'¿El equipo enciende sin alarmas de fallo?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:9, categoria:'Verificación funcional', pregunta:'Registra el volumen tidal entregado con pulmón de prueba', tipo:'valor_numerico', unidad:'mL', valor_esperado:'500', critica:true, advertencia:'Diferencia máxima aceptable: ±10%' },
    { numero:10, categoria:'Verificación funcional', pregunta:'Registra la frecuencia respiratoria medida', tipo:'valor_numerico', unidad:'rpm', valor_esperado:'12-20', critica:true, advertencia:null },
    { numero:11, categoria:'Verificación funcional', pregunta:'¿La alarma de presión alta funciona correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:12, categoria:'Verificación funcional', pregunta:'¿La alarma de desconexión de paciente funciona?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Alarma crítica para seguridad del paciente' },
    { numero:13, categoria:'Verificación funcional', pregunta:'¿El humidificador funciona correctamente si aplica?', tipo:'seleccion', opciones:['Funciona correctamente','No aplica','Requiere revisión'], valor_esperado:'Funciona correctamente', critica:false, advertencia:null },
    { numero:14, categoria:'Pruebas de seguridad', pregunta:'¿El test automático de autodiagnóstico pasa sin errores?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:15, categoria:'Cierre', pregunta:'Selecciona los ítems verificados', tipo:'checklist', opciones:['Circuito paciente','Filtros','Verificación eléctrica','Prueba volumétrica','Alarmas','Autodiagnóstico'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:16, categoria:'Cierre', pregunta:'¿El equipo queda apto para soporte ventilatorio?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:17, categoria:'Cierre', pregunta:'Observaciones y hallazgos del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'desfibrilador': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos en carcasa o pantalla?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿Las paletas/electrodos están en buen estado?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Paletas dañadas pueden causar quemaduras o descarga inefectiva' },
    { numero:3, categoria:'Limpieza', pregunta:'¿Se realizó limpieza de paletas con paño húmedo?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'No usar solventes en las paletas' },
    { numero:4, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:null },
    { numero:5, categoria:'Verificación eléctrica', pregunta:'¿La batería tiene carga suficiente (>80%)?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Batería baja puede impedir descarga en emergencia' },
    { numero:6, categoria:'Verificación funcional', pregunta:'Registra la energía de descarga medida a 200J', tipo:'valor_numerico', unidad:'J', valor_esperado:'180-220', critica:true, advertencia:'Usar analizador de desfibriladores calibrado' },
    { numero:7, categoria:'Verificación funcional', pregunta:'Registra la energía de descarga medida a 360J', tipo:'valor_numerico', unidad:'J', valor_esperado:'324-396', critica:true, advertencia:null },
    { numero:8, categoria:'Verificación funcional', pregunta:'¿El tiempo de carga a 200J es menor a 10 segundos?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:9, categoria:'Verificación funcional', pregunta:'¿El marcapasos externo funciona si aplica?', tipo:'seleccion', opciones:['Funciona correctamente','No aplica','Requiere revisión'], valor_esperado:'Funciona correctamente', critica:false, advertencia:null },
    { numero:10, categoria:'Verificación funcional', pregunta:'¿El ECG en pantalla es legible y sin ruido?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:11, categoria:'Pruebas de seguridad', pregunta:'¿La descarga interna (test) se completa sin errores?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Nunca descargar sin carga resistiva' },
    { numero:12, categoria:'Cierre', pregunta:'Selecciona los ítems verificados', tipo:'checklist', opciones:['Inspección física','Limpieza','Verificación batería','Prueba de energía','Prueba ECG','Test interno'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:13, categoria:'Cierre', pregunta:'¿El equipo queda apto para uso en emergencias?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:14, categoria:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'bomba': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos visibles?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿El mecanismo de carga del set de infusión funciona correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:3, categoria:'Limpieza', pregunta:'¿Se realizó limpieza externa con paño húmedo?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:'No permitir entrada de líquidos al equipo' },
    { numero:4, categoria:'Limpieza', pregunta:'¿Se limpió el canal de infusión?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:5, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:null },
    { numero:6, categoria:'Verificación eléctrica', pregunta:'¿El estado de la batería es?', tipo:'seleccion', opciones:['Óptimo','Requiere carga','Reemplazar'], valor_esperado:'Óptimo', critica:true, advertencia:null },
    { numero:7, categoria:'Verificación funcional', pregunta:'Registra el error de caudal medido con set de prueba a 10 mL/h', tipo:'valor_numerico', unidad:'%', valor_esperado:'<5', critica:true, advertencia:'Error >5% requiere calibración o reemplazo' },
    { numero:8, categoria:'Verificación funcional', pregunta:'¿La alarma de oclusión funciona correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:9, categoria:'Verificación funcional', pregunta:'¿La alarma de batería baja funciona?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:10, categoria:'Verificación funcional', pregunta:'¿La alarma de fin de infusión funciona?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:11, categoria:'Cierre', pregunta:'Selecciona los ítems verificados', tipo:'checklist', opciones:['Limpieza canal','Verificación eléctrica','Prueba de caudal','Alarma oclusión','Alarma batería','Alarma fin infusión'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:12, categoria:'Cierre', pregunta:'¿La bomba queda apta para uso clínico?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:13, categoria:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'incubadora': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos en estructura o domo?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿Las portillas de acceso abren y cierran correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:3, categoria:'Limpieza', pregunta:'¿Se realizó limpieza y desinfección completa del domo?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Usar desinfectante compatible con neonatos' },
    { numero:4, categoria:'Limpieza', pregunta:'¿Se limpió el filtro de aire?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:5, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:null },
    { numero:6, categoria:'Verificación eléctrica', pregunta:'¿La corriente de fuga es menor a 100 μA?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Crítico para seguridad del neonato' },
    { numero:7, categoria:'Verificación funcional', pregunta:'Registra la temperatura interior medida a set de 36.5°C', tipo:'valor_numerico', unidad:'°C', valor_esperado:'36.3-36.7', critica:true, advertencia:'Usar termómetro patrón calibrado' },
    { numero:8, categoria:'Verificación funcional', pregunta:'Registra la humedad relativa interior medida', tipo:'valor_numerico', unidad:'%HR', valor_esperado:'50-80', critica:true, advertencia:null },
    { numero:9, categoria:'Verificación funcional', pregunta:'¿La alarma de temperatura alta funciona?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:10, categoria:'Verificación funcional', pregunta:'¿La alarma de temperatura baja funciona?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:11, categoria:'Verificación funcional', pregunta:'¿El sistema de oxígeno funciona correctamente si aplica?', tipo:'seleccion', opciones:['Funciona correctamente','No aplica','Requiere revisión'], valor_esperado:'Funciona correctamente', critica:false, advertencia:null },
    { numero:12, categoria:'Cierre', pregunta:'Selecciona los ítems verificados', tipo:'checklist', opciones:['Limpieza domo','Filtro de aire','Verificación eléctrica','Control de temperatura','Control de humedad','Alarmas'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:13, categoria:'Cierre', pregunta:'¿La incubadora queda apta para uso con neonatos?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:14, categoria:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'glucometro': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos visibles?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Limpieza', pregunta:'¿Se realizó limpieza externa del equipo?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:3, categoria:'Verificación funcional', pregunta:'¿Las baterías tienen carga suficiente?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:4, categoria:'Calibración', pregunta:'Registra el valor de glucosa con solución control baja', tipo:'valor_numerico', unidad:'mg/dL', valor_esperado:'40-70', critica:true, advertencia:'Usar solución control del mismo lote que las tiras' },
    { numero:5, categoria:'Calibración', pregunta:'Registra el valor de glucosa con solución control alta', tipo:'valor_numerico', unidad:'mg/dL', valor_esperado:'250-350', critica:true, advertencia:null },
    { numero:6, categoria:'Calibración', pregunta:'¿Los resultados de control están dentro del rango indicado en el inserto?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Si está fuera de rango, no usar el equipo' },
    { numero:7, categoria:'Cierre', pregunta:'¿El glucómetro queda apto para uso clínico?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:8, categoria:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ],
  'default': [
    { numero:1, categoria:'Inspección inicial', pregunta:'¿El equipo presenta daños físicos visibles en su estructura?', tipo:'si_no', valor_esperado:'No', critica:false, advertencia:null },
    { numero:2, categoria:'Inspección inicial', pregunta:'¿El estado físico general del equipo es?', tipo:'seleccion', opciones:['Bueno','Regular','Malo'], valor_esperado:'Bueno', critica:false, advertencia:null },
    { numero:3, categoria:'Limpieza', pregunta:'¿Se realizó limpieza externa completa del equipo?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:4, categoria:'Limpieza', pregunta:'¿Se limpió el interior del equipo si aplica?', tipo:'seleccion', opciones:['Sí — realizado','No aplica'], valor_esperado:'Sí — realizado', critica:false, advertencia:null },
    { numero:5, categoria:'Verificación eléctrica', pregunta:'Registra el voltaje de alimentación medido', tipo:'valor_numerico', unidad:'V', valor_esperado:'110-120', critica:true, advertencia:'Verificar con multímetro calibrado' },
    { numero:6, categoria:'Verificación eléctrica', pregunta:'¿El cable de alimentación está en buen estado?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:7, categoria:'Verificación eléctrica', pregunta:'¿La corriente de fuga es menor a 100 μA?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:'Según norma IEC 60601' },
    { numero:8, categoria:'Verificación funcional', pregunta:'¿El equipo enciende correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:9, categoria:'Verificación funcional', pregunta:'¿El equipo realiza su función principal sin errores?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:10, categoria:'Verificación funcional', pregunta:'¿Las alarmas o indicadores visuales funcionan correctamente?', tipo:'si_no', valor_esperado:'Sí', critica:false, advertencia:null },
    { numero:11, categoria:'Verificación funcional', pregunta:'¿El estado de la batería es adecuado si aplica?', tipo:'seleccion', opciones:['Óptimo','Requiere carga','Reemplazar','No aplica'], valor_esperado:'Óptimo', critica:false, advertencia:null },
    { numero:12, categoria:'Cierre', pregunta:'Selecciona todos los ítems verificados en este mantenimiento', tipo:'checklist', opciones:['Inspección física','Limpieza externa','Limpieza interna','Verificación eléctrica','Prueba funcional','Verificación de alarmas'], valor_esperado:'Todos', critica:false, advertencia:null },
    { numero:13, categoria:'Cierre', pregunta:'¿El equipo queda en condiciones óptimas para uso clínico?', tipo:'si_no', valor_esperado:'Sí', critica:true, advertencia:null },
    { numero:14, categoria:'Cierre', pregunta:'Observaciones generales y hallazgos del mantenimiento', tipo:'texto', valor_esperado:'', critica:false, advertencia:null },
  ]
}

function getProtocolo(equipo: string, tipo: string): any[] {
  const nombre = equipo.toLowerCase()
  if (nombre.includes('monitor') || nombre.includes('signos vitales') || nombre.includes('multiparametro')) return PROTOCOLOS.monitor
  if (nombre.includes('ventilador')) return PROTOCOLOS.ventilador
  if (nombre.includes('desfibrilador')) return PROTOCOLOS.desfibrilador
  if (nombre.includes('bomba') || nombre.includes('infusion') || nombre.includes('jeringa')) return PROTOCOLOS.bomba
  if (nombre.includes('incubadora')) return PROTOCOLOS.incubadora
  if (nombre.includes('glucometro') || nombre.includes('glucómetro')) return PROTOCOLOS.glucometro
  return PROTOCOLOS.default
}

export async function POST(req: Request) {
  try {
    const { equipo, tipo } = await req.json()
    const preguntas = getProtocolo(equipo, tipo)
    return NextResponse.json({ preguntas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
