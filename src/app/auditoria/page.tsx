'use client'

import { useState } from 'react'
import {
  ShieldCheck, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, FileText, Download,
  Clock, Award
} from 'lucide-react'

const AUDITORIAS = [
  { id:'msps',        label:'Habilitación MSPS',          icon:'🏥', desc:'Resolución 3100/2019 — Ministerio de Salud' },
  { id:'interna',     label:'Auditoría Interna Biomédica', icon:'🔧', desc:'Gestión de tecnología biomédica institucional' },
  { id:'supersalud',  label:'Visita Supersalud',           icon:'⚖️', desc:'Superintendencia Nacional de Salud' },
  { id:'acreditacion',label:'Acreditación ICONTEC',        icon:'🏆', desc:'Estándares de acreditación en salud' },
]

const ROLES = [
  { id:'biomedico', label:'Ingeniero Biomédico',    icon:'🔬' },
  { id:'director',  label:'Director Administrativo', icon:'👔' },
  { id:'ambos',     label:'Ambos',                   icon:'👥' },
]

const PREGUNTAS: Record<string, any[]> = {
  msps: [
    { id:1,  categoria:'Inventario y registro',    rol:'biomedico', pregunta:'¿La institución cuenta con un inventario actualizado de todos los dispositivos médicos?',                    normativa:'Res. 4816/2008 Art. 5',  peso:5, evidencia:'Inventario firmado y fechado' },
    { id:2,  categoria:'Inventario y registro',    rol:'biomedico', pregunta:'¿Cada equipo tiene asignado un código único de inventario?',                                                normativa:'Res. 4816/2008 Art. 5',  peso:4, evidencia:'Códigos visibles en equipos' },
    { id:3,  categoria:'Inventario y registro',    rol:'biomedico', pregunta:'¿Los equipos están clasificados por riesgo según normativa INVIMA (Clase I, IIa, IIb, III)?',              normativa:'Dec. 4725/2005',         peso:5, evidencia:'Clasificación en inventario' },
    { id:4,  categoria:'Mantenimiento preventivo', rol:'biomedico', pregunta:'¿Existe un programa anual de mantenimiento preventivo documentado y aprobado?',                             normativa:'Res. 4816/2008 Art. 7',  peso:5, evidencia:'Cronograma firmado por director' },
    { id:5,  categoria:'Mantenimiento preventivo', rol:'biomedico', pregunta:'¿El porcentaje de cumplimiento del mantenimiento preventivo es mayor al 80%?',                              normativa:'Res. 4816/2008 Art. 7',  peso:5, evidencia:'Indicador de cumplimiento' },
    { id:6,  categoria:'Mantenimiento preventivo', rol:'biomedico', pregunta:'¿Se registran todas las actividades de mantenimiento en hojas de vida de los equipos?',                    normativa:'Res. 4816/2008 Art. 8',  peso:4, evidencia:'Hojas de vida individuales' },
    { id:7,  categoria:'Mantenimiento correctivo', rol:'biomedico', pregunta:'¿Existe un procedimiento documentado para la gestión de averías y mantenimiento correctivo?',              normativa:'Res. 4816/2008 Art. 9',  peso:4, evidencia:'Procedimiento escrito y socializado' },
    { id:8,  categoria:'Mantenimiento correctivo', rol:'biomedico', pregunta:'¿Se registran los tiempos de respuesta ante fallas de equipos críticos?',                                  normativa:'Res. 4816/2008',         peso:3, evidencia:'Registros de tiempos MTTR' },
    { id:9,  categoria:'Calibración',              rol:'biomedico', pregunta:'¿Los equipos de medición cuentan con certificados de calibración vigentes?',                               normativa:'Res. 4816/2008 Art. 10', peso:5, evidencia:'Certificados de calibración' },
    { id:10, categoria:'Calibración',              rol:'biomedico', pregunta:'¿Los certificados son emitidos por laboratorios acreditados por ONAC?',                                    normativa:'NTC ISO/IEC 17025',      peso:4, evidencia:'Acreditación ONAC del laboratorio' },
    { id:11, categoria:'Tecnovigilancia',          rol:'biomedico', pregunta:'¿La institución tiene implementado el programa de tecnovigilancia?',                                        normativa:'Res. 4816/2008 Art. 15', peso:5, evidencia:'Programa de tecnovigilancia escrito' },
    { id:12, categoria:'Tecnovigilancia',          rol:'biomedico', pregunta:'¿Se reportan los eventos adversos relacionados con dispositivos médicos al INVIMA?',                       normativa:'Res. 4816/2008',         peso:5, evidencia:'Reportes enviados al INVIMA' },
    { id:13, categoria:'Personal',                 rol:'director',  pregunta:'¿El personal de ingeniería biomédica tiene formación certificada y pertinente?',                           normativa:'Res. 3100/2019',         peso:4, evidencia:'Hojas de vida y certificados' },
    { id:14, categoria:'Personal',                 rol:'director',  pregunta:'¿Existe un plan de capacitación anual para el personal biomédico?',                                        normativa:'Res. 3100/2019',         peso:3, evidencia:'Plan de capacitación aprobado' },
    { id:15, categoria:'Presupuesto',              rol:'director',  pregunta:'¿Se cuenta con presupuesto asignado para mantenimiento de tecnología biomédica?',                          normativa:'Res. 3100/2019',         peso:4, evidencia:'Presupuesto aprobado en acta' },
    { id:16, categoria:'Presupuesto',              rol:'director',  pregunta:'¿El presupuesto de mantenimiento preventivo es mayor al de correctivo?',                                   normativa:'Buenas prácticas OPS',   peso:3, evidencia:'Análisis de costos preventivo vs correctivo' },
    { id:17, categoria:'Baja y reposición',        rol:'ambos',     pregunta:'¿Existe un procedimiento para dar de baja equipos obsoletos o irreparables?',                             normativa:'Res. 4816/2008',         peso:3, evidencia:'Procedimiento de baja documentado' },
    { id:18, categoria:'Baja y reposición',        rol:'ambos',     pregunta:'¿Se documenta y justifica técnicamente cada baja de equipo?',                                             normativa:'Res. 4816/2008',         peso:3, evidencia:'Actas de baja firmadas' },
  ],
  interna: [
    { id:1,  categoria:'Gestión del inventario', rol:'biomedico', pregunta:'¿El inventario se actualiza con una frecuencia mínima trimestral?',                             normativa:'Política interna',    peso:4, evidencia:'Fecha de última actualización' },
    { id:2,  categoria:'Gestión del inventario', rol:'biomedico', pregunta:'¿Todos los equipos tienen hoja de vida individual actualizada?',                                normativa:'Política interna',    peso:5, evidencia:'Hojas de vida individuales' },
    { id:3,  categoria:'KPIs',                   rol:'biomedico', pregunta:'¿Se calcula y reporta el MTBF mensualmente?',                                                   normativa:'Indicadores OPS/OMS', peso:4, evidencia:'Reporte mensual de KPIs' },
    { id:4,  categoria:'KPIs',                   rol:'biomedico', pregunta:'¿La disponibilidad del parque de equipos es mayor al 90%?',                                     normativa:'Estándar OPS',        peso:5, evidencia:'Indicador de disponibilidad' },
    { id:5,  categoria:'KPIs',                   rol:'biomedico', pregunta:'¿El MTTR de equipos críticos es menor a 24 horas?',                                             normativa:'Estándar OPS',        peso:4, evidencia:'Registro de tiempos de reparación' },
    { id:6,  categoria:'Cronograma',             rol:'biomedico', pregunta:'¿El cumplimiento del cronograma de mantenimiento preventivo supera el 85%?',                    normativa:'Política interna',    peso:5, evidencia:'Informe de cumplimiento' },
    { id:7,  categoria:'Cronograma',             rol:'biomedico', pregunta:'¿Se generan órdenes de trabajo para cada intervención planificada?',                            normativa:'Política interna',    peso:4, evidencia:'Órdenes de trabajo en sistema' },
    { id:8,  categoria:'Repuestos',              rol:'biomedico', pregunta:'¿Se lleva un control de inventario de repuestos críticos?',                                     normativa:'Política interna',    peso:3, evidencia:'Kardex de repuestos' },
    { id:9,  categoria:'Proveedores',            rol:'director',  pregunta:'¿Los proveedores de mantenimiento tienen contratos vigentes con SLA definidos?',                normativa:'Política interna',    peso:4, evidencia:'Contratos vigentes' },
    { id:10, categoria:'Proveedores',            rol:'director',  pregunta:'¿Se evalúa el desempeño de los proveedores de mantenimiento?',                                  normativa:'Política interna',    peso:3, evidencia:'Evaluaciones de proveedores' },
    { id:11, categoria:'Gestión del riesgo',     rol:'ambos',     pregunta:'¿Se tiene identificado el plan de contingencia para equipos críticos fuera de servicio?',       normativa:'Política interna',    peso:5, evidencia:'Plan de contingencia documentado' },
    { id:12, categoria:'Gestión del riesgo',     rol:'ambos',     pregunta:'¿Los equipos de soporte vital tienen mantenimiento prioritario garantizado?',                   normativa:'Estándar clínico',    peso:5, evidencia:'Protocolo de priorización' },
  ],
  supersalud: [
    { id:1,  categoria:'Habilitación',          rol:'director',  pregunta:'¿La institución tiene registro de habilitación vigente ante el ente territorial?',              normativa:'Res. 3100/2019',         peso:5, evidencia:'Certificado de habilitación vigente' },
    { id:2,  categoria:'Habilitación',          rol:'director',  pregunta:'¿Los servicios habilitados cuentan con la tecnología requerida por los estándares?',            normativa:'Res. 3100/2019',         peso:5, evidencia:'Verificación de dotación mínima' },
    { id:3,  categoria:'Registros sanitarios',  rol:'biomedico', pregunta:'¿Todos los dispositivos médicos tienen registro sanitario INVIMA vigente?',                     normativa:'Dec. 4725/2005',         peso:5, evidencia:'Registros sanitarios por equipo' },
    { id:4,  categoria:'Registros sanitarios',  rol:'biomedico', pregunta:'¿Se verifica el registro sanitario al momento de la adquisición de nuevos equipos?',           normativa:'Dec. 4725/2005',         peso:4, evidencia:'Procedimiento de verificación' },
    { id:5,  categoria:'Seguridad paciente',    rol:'ambos',     pregunta:'¿Se realizan pruebas de seguridad eléctrica a los equipos electromédicos?',                    normativa:'IEC 60601 / NTC 3729',   peso:5, evidencia:'Certificados de seguridad eléctrica' },
    { id:6,  categoria:'Seguridad paciente',    rol:'ambos',     pregunta:'¿Los equipos tienen señalización de seguridad y advertencias visibles?',                       normativa:'Res. 3100/2019',         peso:3, evidencia:'Señalización en los equipos' },
    { id:7,  categoria:'Gestión incidentes',    rol:'director',  pregunta:'¿Existe un sistema de reporte interno de incidentes con dispositivos médicos?',                normativa:'Res. 4816/2008',         peso:4, evidencia:'Formato de reporte interno' },
    { id:8,  categoria:'Gestión incidentes',    rol:'director',  pregunta:'¿Los incidentes graves son reportados a la Supersalud en los tiempos establecidos?',           normativa:'Circular 049/2012',      peso:5, evidencia:'Reportes enviados a Supersalud' },
    { id:9,  categoria:'Documentación',         rol:'biomedico', pregunta:'¿Los procedimientos de mantenimiento están documentados y accesibles al personal?',            normativa:'Res. 3100/2019',         peso:3, evidencia:'Manuales y procedimientos disponibles' },
    { id:10, categoria:'Documentación',         rol:'director',  pregunta:'¿La documentación técnica de los equipos está organizada y disponible?',                       normativa:'Res. 4816/2008',         peso:3, evidencia:'Archivos de manuales y fichas técnicas' },
  ],
  acreditacion: [
    { id:1,  categoria:'Liderazgo',            rol:'director',  pregunta:'¿Existe una política institucional formal de gestión de tecnología biomédica?',                  normativa:'ICONTEC — Dirección',         peso:5, evidencia:'Política aprobada por junta directiva' },
    { id:2,  categoria:'Liderazgo',            rol:'director',  pregunta:'¿La alta dirección revisa indicadores de gestión biomédica en comités?',                        normativa:'ICONTEC — Mejoramiento',      peso:4, evidencia:'Actas de comité con indicadores' },
    { id:3,  categoria:'Riesgo clínico',       rol:'ambos',     pregunta:'¿Se realiza análisis de riesgo de falla (AMFE) para equipos críticos?',                        normativa:'ICONTEC — Seguridad',         peso:5, evidencia:'Matrices de riesgo AMFE' },
    { id:4,  categoria:'Riesgo clínico',       rol:'ambos',     pregunta:'¿Existen protocolos de respuesta ante fallas de equipos de soporte vital?',                    normativa:'ICONTEC — Seguridad',         peso:5, evidencia:'Protocolos documentados y socializados' },
    { id:5,  categoria:'Mejoramiento',         rol:'biomedico', pregunta:'¿Se implementan planes de mejora basados en los resultados de los KPIs biomédicos?',           normativa:'ICONTEC — Mejoramiento',      peso:4, evidencia:'Planes de mejora documentados' },
    { id:6,  categoria:'Mejoramiento',         rol:'biomedico', pregunta:'¿Se comparan los indicadores biomédicos con estándares nacionales e internacionales?',         normativa:'ICONTEC — Mejoramiento',      peso:3, evidencia:'Benchmarking documentado' },
    { id:7,  categoria:'Experiencia paciente', rol:'director',  pregunta:'¿Se mide el impacto de las fallas de equipos en la atención al paciente?',                    normativa:'ICONTEC — Atención Paciente', peso:4, evidencia:'Reportes de impacto clínico' },
    { id:8,  categoria:'Talento humano',       rol:'director',  pregunta:'¿El personal biomédico tiene plan de carrera y desarrollo profesional definido?',              normativa:'ICONTEC — Talento Humano',    peso:3, evidencia:'Plan de desarrollo del personal' },
    { id:9,  categoria:'Información',          rol:'biomedico', pregunta:'¿La información técnica de los equipos está integrada con el sistema de información hospitalario?', normativa:'ICONTEC — Información',  peso:4, evidencia:'Integración con HIS/RIS' },
    { id:10, categoria:'Alianzas',             rol:'director',  pregunta:'¿Existen acuerdos de colaboración con fabricantes para soporte técnico prioritario?',          normativa:'ICONTEC — Alianzas',          peso:3, evidencia:'Contratos de soporte con fabricantes' },
  ],
}

const RESPUESTAS_OPC = [
  { valor:'cumple',         label:'Cumple',               color:'#4ade80', bg:'#16a34a20', border:'#16a34a40', puntaje:1.0 },
  { valor:'cumple_parcial', label:'Cumple parcialmente',  color:'#fcd34d', bg:'#f59e0b20', border:'#f59e0b40', puntaje:0.5 },
  { valor:'no_cumple',      label:'No cumple',            color:'#f87171', bg:'#ef444420', border:'#ef444440', puntaje:0.0 },
  { valor:'no_aplica',      label:'No aplica',            color:'#94a3b8', bg:'#64748b20', border:'#64748b40', puntaje:null },
]

const ACCIONES: Record<string, string> = {
  'Inventario y registro':    'Actualizar y completar el inventario con todos los campos requeridos por la Res. 4816/2008.',
  'Mantenimiento preventivo': 'Elaborar o actualizar el cronograma de mantenimiento preventivo y documentar todas las intervenciones.',
  'Mantenimiento correctivo': 'Documentar el procedimiento de gestión de averías y registrar tiempos de respuesta.',
  'Calibración':              'Programar calibración de equipos de medición con laboratorios acreditados por ONAC.',
  'Tecnovigilancia':          'Implementar el programa de tecnovigilancia y designar responsable institucional ante INVIMA.',
  'Presupuesto':              'Solicitar asignación formal de presupuesto para mantenimiento biomédico.',
  'KPIs':                     'Implementar el cálculo y reporte mensual de MTBF, MTTR y disponibilidad.',
  'Habilitación':             'Verificar el registro de habilitación y renovarlo ante la secretaría de salud.',
  'Registros sanitarios':     'Verificar y documentar el registro sanitario INVIMA de todos los dispositivos médicos.',
  'Seguridad paciente':       'Contratar pruebas de seguridad eléctrica con empresa certificada según IEC 60601.',
  'Gestión incidentes':       'Implementar sistema de reporte interno y externo de incidentes con dispositivos.',
  'Documentación':            'Organizar y hacer accesible toda la documentación técnica de los equipos.',
  'Personal':                 'Verificar certificaciones del personal y elaborar plan de capacitación anual.',
  'Cronograma':               'Generar órdenes de trabajo para cada intervención y medir cumplimiento.',
  'Gestión del riesgo':       'Documentar plan de contingencia para equipos críticos y socializarlo.',
  'Liderazgo':                'Formalizar política institucional de gestión biomédica aprobada por dirección.',
  'Riesgo clínico':           'Elaborar matrices AMFE y protocolos de respuesta ante fallas de soporte vital.',
  'Mejoramiento':             'Implementar planes de mejora basados en KPIs y comparar con benchmarks.',
}

type Fase = 'inicio' | 'ejecutando' | 'resultado'

export default function AuditoriaPage() {
  const [fase, setFase] = useState<Fase>('inicio')
  const [tipoAuditoria, setTipoAuditoria] = useState('')
  const [rolAuditor, setRolAuditor] = useState('')
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, {valor:string;observacion:string}>>({})
  const [tiempoInicio, setTiempoInicio] = useState<Date|null>(null)

  const todasPreguntas = PREGUNTAS[tipoAuditoria] || []
  const preguntasFiltradas = todasPreguntas.filter((p: any) =>
    rolAuditor === 'ambos' || p.rol === rolAuditor || p.rol === 'ambos'
  )

  function iniciarAuditoria() {
    if (!tipoAuditoria || !rolAuditor) return
    setPreguntaActual(0)
    setRespuestas({})
    setTiempoInicio(new Date())
    setFase('ejecutando')
  }

  function responder(valor: string) {
    setRespuestas(prev => ({
      ...prev,
      [preguntaActual]: { valor, observacion: prev[preguntaActual]?.observacion || '' }
    }))
  }

  function setObservacion(obs: string) {
    setRespuestas(prev => ({
      ...prev,
      [preguntaActual]: { ...prev[preguntaActual], observacion: obs }
    }))
  }

  function siguiente() {
    if (preguntaActual < preguntasFiltradas.length - 1) setPreguntaActual(p => p + 1)
    else setFase('resultado')
  }

  function anterior() {
    if (preguntaActual > 0) setPreguntaActual(p => p - 1)
  }

  function calcularResultados() {
    let puntajeTotal = 0
    let puntajeMaximo = 0
    const porCategoria: Record<string, {total:number;obtenido:number}> = {}
    const noConformes: any[] = []
    const parciales: any[] = []

    preguntasFiltradas.forEach((p: any, i: number) => {
      const resp = respuestas[i]
      const opcion = RESPUESTAS_OPC.find(o => o.valor === resp?.valor)
      const cat = p.categoria

      if (!porCategoria[cat]) porCategoria[cat] = { total:0, obtenido:0 }

      if (opcion && opcion.puntaje !== null && opcion.puntaje !== undefined) {
        const pts = p.peso * opcion.puntaje
        puntajeTotal += pts
        puntajeMaximo += p.peso
        porCategoria[cat].total += p.peso
        porCategoria[cat].obtenido += pts
        if (opcion.valor === 'no_cumple') noConformes.push({ ...p, observacion: resp?.observacion })
        if (opcion.valor === 'cumple_parcial') parciales.push({ ...p, observacion: resp?.observacion })
      } else if (opcion?.valor !== 'no_aplica') {
        puntajeMaximo += p.peso
        porCategoria[cat].total += p.peso
      }
    })

    const porcentaje = puntajeMaximo > 0 ? Math.round((puntajeTotal / puntajeMaximo) * 100) : 0
    return { porcentaje, puntajeTotal, puntajeMaximo, porCategoria, noConformes, parciales }
  }

  const tiempoMin = tiempoInicio ? Math.round((Date.now() - tiempoInicio.getTime()) / 60000) : 0
  const progreso = preguntasFiltradas.length > 0
    ? Math.round((Object.keys(respuestas).length / preguntasFiltradas.length) * 100)
    : 0
  const pregunta = preguntasFiltradas[preguntaActual]
  const respActual = respuestas[preguntaActual]
  const fechaHoy = new Date().toLocaleDateString('es-CO', {year:'numeric',month:'long',day:'numeric'})

  const resultados = fase === 'resultado' ? calcularResultados() : null

  const semaforoColor = (resultados === null)
    ? '#3d5166'
    : resultados.porcentaje >= 80
    ? '#4ade80'
    : resultados.porcentaje >= 60
    ? '#fcd34d'
    : '#f87171'

  const semaforoLabel = (resultados === null)
    ? 'PENDIENTE'
    : resultados.porcentaje >= 80
    ? 'APROBADO'
    : resultados.porcentaje >= 60
    ? 'CON OBSERVACIONES'
    : 'NO APROBADO'

  function imprimirPDF() { window.print() }

  return (
    <>
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #reporte-auditoria, #reporte-auditoria * { visibility: visible; }
        #reporte-auditoria { position: absolute; left:0; top:0; width:100%; }
        .no-print { display: none !important; }
      }
    `}</style>

    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between no-print"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{color:'#3d5166'}}>BioMed AI</span>
            <span style={{color:'#1e2d3d'}}>/</span>
            <span className="text-xs font-medium" style={{color:'#2dd4bf'}}>Auditoría</span>
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>Simulación de Auditoría</h1>
        </div>
        {fase === 'ejecutando' && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Progreso</div>
              <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>{progreso}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Tiempo</div>
              <div className="text-xl font-bold" style={{color:'#fb923c'}}>{tiempoMin}min</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Pregunta</div>
              <div className="text-xl font-bold" style={{color:'#e2e8f0'}}>{preguntaActual+1}/{preguntasFiltradas.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Barra progreso */}
      {fase === 'ejecutando' && (
        <div className="no-print" style={{borderBottom:'1px solid #1e2d3d'}}>
          <div className="h-1.5" style={{background:'#1e2d3d'}}>
            <div className="h-1.5 transition-all duration-500"
              style={{width:`${progreso}%`, background:'linear-gradient(90deg,#0d9488,#10b981)'}}/>
          </div>
          <div className="px-8 py-2 flex gap-1.5 overflow-x-auto">
            {preguntasFiltradas.map((_: any, i: number) => {
              const r = respuestas[i]
              const dotColor = r?.valor==='cumple'?'#4ade80'
                :r?.valor==='cumple_parcial'?'#fcd34d'
                :r?.valor==='no_cumple'?'#f87171'
                :r?.valor==='no_aplica'?'#64748b'
                :undefined
              return (
                <button key={i} onClick={()=>setPreguntaActual(i)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: dotColor||(i===preguntaActual?'#1e3a5f':'#1e2d3d'),
                    color: dotColor?'#fff':i===preguntaActual?'#2dd4bf':'#3d5166',
                    border: i===preguntaActual?'2px solid #2dd4bf':'none',
                  }}>
                  {r?'●':i+1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── INICIO ── */}
        {fase === 'inicio' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{background:'linear-gradient(135deg,#0d9488,#0f766e)'}}>
                <ShieldCheck className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{color:'#e2e8f0'}}>Simulación de Auditoría Biomédica</h2>
              <p className="text-sm" style={{color:'#3d5166'}}>
                Responde las preguntas que haría un auditor externo. Al final recibirás tu puntaje, hallazgos y plan de mejora.
              </p>
            </div>

            <div>
              <div className="text-sm font-bold mb-3" style={{color:'#e2e8f0'}}>1. Tipo de auditoría</div>
              <div className="grid grid-cols-2 gap-3">
                {AUDITORIAS.map(a => (
                  <button key={a.id} onClick={()=>setTipoAuditoria(a.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: tipoAuditoria===a.id?'#0d948820':'#0d1626',
                      border: tipoAuditoria===a.id?'1px solid #0d948860':'1px solid #1e2d3d',
                    }}>
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <div className="text-sm font-bold mb-1" style={{color:tipoAuditoria===a.id?'#2dd4bf':'#e2e8f0'}}>{a.label}</div>
                    <div className="text-xs" style={{color:'#3d5166'}}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold mb-3" style={{color:'#e2e8f0'}}>2. ¿Quién responde?</div>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <button key={r.id} onClick={()=>setRolAuditor(r.id)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: rolAuditor===r.id?'#0d948820':'#0d1626',
                      border: rolAuditor===r.id?'1px solid #0d948860':'1px solid #1e2d3d',
                    }}>
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <div className="text-xs font-bold" style={{color:rolAuditor===r.id?'#2dd4bf':'#e2e8f0'}}>{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {tipoAuditoria && rolAuditor && (
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <Clock className="w-4 h-4" style={{color:'#2dd4bf'}}/>
                <span className="text-sm" style={{color:'#7a9bb5'}}>
                  {preguntasFiltradas.length} preguntas · ~{Math.ceil(preguntasFiltradas.length * 1.5)} minutos estimados
                </span>
              </div>
            )}

            <button onClick={iniciarAuditoria} disabled={!tipoAuditoria || !rolAuditor}
              className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all"
              style={{
                background: tipoAuditoria&&rolAuditor?'linear-gradient(135deg,#0d9488,#0f766e)':'#1e2d3d',
                color: tipoAuditoria&&rolAuditor?'#fff':'#3d5166',
              }}>
              <ShieldCheck className="w-5 h-5"/>
              Iniciar simulación
            </button>
          </div>
        )}

        {/* ── EJECUTANDO ── */}
        {fase === 'ejecutando' && pregunta && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
              <span className="text-xs font-semibold uppercase tracking-widest px-3" style={{color:'#3d5166'}}>
                {pregunta.categoria}
              </span>
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
              <div className="px-6 py-5" style={{borderBottom:'1px solid #1e2d3d'}}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{background:'#0d948820', color:'#2dd4bf', border:'1px solid #0d948840'}}>
                    {pregunta.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{background:'#818cf820', color:'#818cf8'}}>
                        {pregunta.rol==='biomedico'?'🔬 Ing. Biomédico':pregunta.rol==='director'?'👔 Director':'👥 Ambos'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{background:'#1e2d3d', color:'#3d5166'}}>
                        Peso: {pregunta.peso}/5
                      </span>
                    </div>
                    <p className="text-base font-semibold leading-relaxed" style={{color:'#e2e8f0'}}>
                      {pregunta.pregunta}
                    </p>
                    <div className="mt-1 text-xs" style={{color:'#3d5166'}}>📖 {pregunta.normativa}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{background:'#0d948810', border:'1px solid #0d948825', color:'#2dd4bf'}}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                  <span><strong>Evidencia requerida:</strong> {pregunta.evidencia}</span>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="text-xs font-bold mb-3" style={{color:'#3d5166'}}>
                  ¿Cómo está tu institución frente a este requisito?
                </div>
                <div className="space-y-2 mb-5">
                  {RESPUESTAS_OPC.map(op => (
                    <button key={op.valor} onClick={()=>responder(op.valor)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: respActual?.valor===op.valor?op.bg:'#111827',
                        border: respActual?.valor===op.valor?`1px solid ${op.border}`:'1px solid #1e2d3d',
                        color: respActual?.valor===op.valor?op.color:'#7a9bb5',
                      }}>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{borderColor:respActual?.valor===op.valor?op.color:'#253447'}}>
                        {respActual?.valor===op.valor && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:op.color}}/>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{op.label}</span>
                      {op.puntaje !== null && (
                        <span className="ml-auto text-xs" style={{color:'#3d5166'}}>
                          {op.puntaje===1?`+${pregunta.peso} pts`:op.puntaje===0.5?`+${pregunta.peso*0.5} pts`:'0 pts'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="text-xs font-bold mb-2" style={{color:'#3d5166'}}>Observaciones / Evidencia disponible</div>
                  <textarea value={respActual?.observacion||''}
                    onChange={e=>setObservacion(e.target.value)}
                    placeholder="Describe la evidencia que tienes..."
                    rows={2}
                    className="w-full text-xs rounded-xl px-4 py-3 focus:outline-none resize-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={anterior} disabled={preguntaActual===0}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{background:'#111827', color:'#7a9bb5', border:'1px solid #1e2d3d', opacity:preguntaActual===0?0.4:1}}>
                    <ChevronLeft className="w-4 h-4"/> Anterior
                  </button>
                  <button onClick={siguiente} disabled={!respActual?.valor}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: respActual?.valor
                        ? preguntaActual===preguntasFiltradas.length-1
                          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                          : 'linear-gradient(135deg,#0d9488,#0f766e)'
                        : '#1e2d3d',
                      color: respActual?.valor?'#fff':'#3d5166',
                    }}>
                    {preguntaActual===preguntasFiltradas.length-1
                      ? <><Award className="w-4 h-4"/> Ver resultados</>
                      : <>Siguiente <ChevronRight className="w-4 h-4"/></>
                    }
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center text-xs" style={{color:'#3d5166'}}>
              {preguntaActual+1} de {preguntasFiltradas.length} · {Object.keys(respuestas).length} respondidas
            </div>
          </div>
        )}

        {/* ── RESULTADO ── */}
        {fase === 'resultado' && resultados && (
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Score */}
            <div className="rounded-2xl p-8 text-center no-print"
              style={{background:'#0d1626', border:`2px solid ${semaforoColor}40`}}>
              <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background:`${semaforoColor}15`, border:`4px solid ${semaforoColor}`}}>
                <div>
                  <div className="text-4xl font-black" style={{color:semaforoColor}}>{resultados.porcentaje}%</div>
                  <div className="text-xs font-bold" style={{color:semaforoColor}}>CUMPLIMIENTO</div>
                </div>
              </div>
              <div className="text-xl font-black mb-1" style={{color:semaforoColor}}>{semaforoLabel}</div>
              <div className="text-sm mb-5" style={{color:'#3d5166'}}>
                {AUDITORIAS.find(a=>a.id===tipoAuditoria)?.label} · {tiempoMin} min · {preguntasFiltradas.length} preguntas
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  {label:'Puntos', value:`${resultados.puntajeTotal.toFixed(1)}/${resultados.puntajeMaximo}`, color:'#e2e8f0'},
                  {label:'No conformes', value:resultados.noConformes.length, color:'#f87171'},
                  {label:'Parciales', value:resultados.parciales.length, color:'#fcd34d'},
                  {label:'Cumplen', value:Object.values(respuestas).filter((r:any)=>r.valor==='cumple').length, color:'#4ade80'},
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3" style={{background:'#111827'}}>
                    <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
                    <div className="text-xs" style={{color:'#3d5166'}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={imprimirPDF}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{background:'linear-gradient(135deg,#0d9488,#0f766e)', color:'#fff'}}>
                  <Download className="w-4 h-4"/> Exportar PDF
                </button>
                <button onClick={()=>{setFase('inicio');setRespuestas({});setPreguntaActual(0)}}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                  style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                  Nueva auditoría
                </button>
              </div>
            </div>

            {/* Por categoría */}
            <div className="rounded-xl overflow-hidden no-print" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Cumplimiento por categoría</div>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {Object.entries(resultados.porCategoria).map(([cat, data]: [string, any]) => {
                  const pct = data.total > 0 ? Math.round((data.obtenido/data.total)*100) : 0
                  const color = pct>=80?'#4ade80':pct>=60?'#fcd34d':'#f87171'
                  return (
                    <div key={cat} className="px-5 py-4" style={{background:'#080e16'}}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{cat}</span>
                        <span className="text-sm font-bold" style={{color}}>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                        <div className="h-2 rounded-full" style={{width:`${pct}%`, background:color}}/>
                      </div>
                      <div className="text-xs mt-1" style={{color:'#3d5166'}}>{data.obtenido.toFixed(1)} / {data.total} pts</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* No conformidades */}
            {resultados.noConformes.length > 0 && (
              <div className="rounded-xl overflow-hidden no-print" style={{border:'1px solid #ef444430'}}>
                <div className="px-5 py-4" style={{background:'#ef444415', borderBottom:'1px solid #ef444430'}}>
                  <div className="text-sm font-bold" style={{color:'#f87171'}}>⚠ No conformidades — Acción inmediata</div>
                </div>
                <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                  {resultados.noConformes.map((nc: any, i: number) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-3" style={{background:'#080e16'}}>
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:'#f87171'}}/>
                      <div>
                        <div className="text-sm font-semibold mb-0.5" style={{color:'#e2e8f0'}}>{nc.pregunta}</div>
                        <div className="text-xs" style={{color:'#3d5166'}}>{nc.normativa} · Peso: {nc.peso}</div>
                        {nc.observacion && <div className="text-xs italic mt-0.5" style={{color:'#4a6580'}}>{nc.observacion}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan de mejora */}
            <div className="rounded-xl overflow-hidden no-print" style={{border:'1px solid #818cf830'}}>
              <div className="px-5 py-4" style={{background:'#818cf815', borderBottom:'1px solid #818cf830'}}>
                <div className="text-sm font-bold" style={{color:'#818cf8'}}>📋 Plan de mejora automático</div>
              </div>
              <div className="p-5 space-y-3">
                {resultados.noConformes.map((nc: any, i: number) => (
                  <div key={i} className="rounded-xl p-4" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{background:'#818cf820', color:'#818cf8'}}>{i+1}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold mb-1" style={{color:'#e2e8f0'}}>{nc.pregunta}</div>
                        <div className="text-xs mb-2" style={{color:'#3d5166'}}>{nc.normativa}</div>
                        <div className="text-xs p-2.5 rounded-lg" style={{background:'#111827', color:'#7a9bb5'}}>
                          <strong style={{color:'#818cf8'}}>Acción: </strong>
                          {ACCIONES[nc.categoria] || 'Documentar e implementar el procedimiento o política correspondiente.'}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{color:'#3d5166'}}>
                          <span>⏱ Plazo: {nc.peso>=5?'30 días':nc.peso>=4?'60 días':'90 días'}</span>
                          <span>·</span>
                          <span>👤 {nc.rol==='biomedico'?'Ing. Biomédico':nc.rol==='director'?'Director':'Ambos'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {resultados.noConformes.length === 0 && resultados.parciales.length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{color:'#4ade80'}}/>
                    <p className="text-sm" style={{color:'#4ade80'}}>¡Excelente! No se encontraron no conformidades.</p>
                  </div>
                )}
              </div>
            </div>

            {/* PDF */}
            <div id="reporte-auditoria" style={{background:'#fff',color:'#000',padding:'40px',fontFamily:'Arial,sans-serif',fontSize:'12px',lineHeight:'1.6'}}>
              <div style={{borderBottom:'3px solid #0d9488',paddingBottom:'20px',marginBottom:'24px',display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'22px',fontWeight:'900',color:'#0d9488'}}>BioMed AI</div>
                  <div style={{fontSize:'14px',fontWeight:'700',color:'#1a2332'}}>Reporte de Simulación de Auditoría</div>
                  <div style={{fontSize:'11px',color:'#64748b'}}>{AUDITORIAS.find(a=>a.id===tipoAuditoria)?.label}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'32px',fontWeight:'900',color:semaforoColor}}>{resultados.porcentaje}%</div>
                  <div style={{padding:'4px 12px',background:semaforoColor,color:'#fff',borderRadius:'4px',fontSize:'11px',fontWeight:'700',display:'inline-block'}}>{semaforoLabel}</div>
                  <div style={{fontSize:'11px',color:'#64748b',marginTop:'4px'}}>{fechaHoy}</div>
                </div>
              </div>
              <div style={{marginBottom:'20px'}}>
                <div style={{fontSize:'12px',fontWeight:'700',marginBottom:'10px',borderBottom:'2px solid #e2e8f0',paddingBottom:'6px'}}>Resultado por categoría</div>
                {Object.entries(resultados.porCategoria).map(([cat, data]: [string, any]) => {
                  const pct = data.total>0?Math.round((data.obtenido/data.total)*100):0
                  return (
                    <div key={cat} style={{marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'200px',fontSize:'11px',fontWeight:'600'}}>{cat}</div>
                      <div style={{flex:1,height:'8px',background:'#e2e8f0',borderRadius:'4px'}}>
                        <div style={{height:'8px',borderRadius:'4px',width:`${pct}%`,background:pct>=80?'#16a34a':pct>=60?'#d97706':'#dc2626'}}/>
                      </div>
                      <div style={{width:'40px',textAlign:'right',fontSize:'11px',fontWeight:'700',color:pct>=80?'#16a34a':pct>=60?'#d97706':'#dc2626'}}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
              {resultados.noConformes.length>0 && (
                <div style={{marginBottom:'16px',padding:'12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',color:'#dc2626',marginBottom:'6px'}}>No conformidades</div>
                  {resultados.noConformes.map((nc: any,i: number)=>(
                    <div key={i} style={{marginBottom:'4px',fontSize:'10px',color:'#7f1d1d'}}>
                      {i+1}. {nc.pregunta} — {nc.normativa}
                    </div>
                  ))}
                </div>
              )}
              {resultados.noConformes.length>0 && (
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',marginBottom:'8px',borderBottom:'1px solid #e2e8f0',paddingBottom:'4px'}}>Plan de mejora</div>
                  {resultados.noConformes.map((nc: any,i: number)=>(
                    <div key={i} style={{marginBottom:'8px',padding:'8px',background:'#f8fafc',borderRadius:'4px',fontSize:'10px'}}>
                      <div style={{fontWeight:'700',marginBottom:'2px'}}>{i+1}. {nc.pregunta}</div>
                      <div style={{color:'#64748b'}}>Acción: {ACCIONES[nc.categoria]||'Documentar e implementar el procedimiento.'}</div>
                      <div style={{color:'#94a3b8'}}>Plazo: {nc.peso>=5?'30 días':nc.peso>=4?'60 días':'90 días'} · Responsable: {nc.rol==='biomedico'?'Ing. Biomédico':nc.rol==='director'?'Director':'Ambos'}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:'24px',paddingTop:'12px',borderTop:'1px solid #e2e8f0',textAlign:'center',fontSize:'9px',color:'#94a3b8'}}>
                BioMed AI · Simulación de auditoría · {fechaHoy} · Solo para uso interno
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
    </>
  )
}
