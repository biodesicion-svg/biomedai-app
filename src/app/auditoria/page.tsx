'use client'
import { useState } from 'react'

const AUDITORIAS = [
  {id:'msps',        label:'Habilitación MSPS',          icon:'ti-building-hospital', desc:'Res. 3100/2019 — Ministerio de Salud'},
  {id:'interna',     label:'Auditoría Interna Biomédica', icon:'ti-tool',              desc:'Gestión de tecnología biomédica'},
  {id:'supersalud',  label:'Visita Supersalud',           icon:'ti-scale',             desc:'Superintendencia Nacional de Salud'},
  {id:'acreditacion',label:'Acreditación ICONTEC',        icon:'ti-award',             desc:'Estándares de acreditación en salud'},
]

const ROLES = [
  {id:'biomedico',label:'Ingeniero Biomédico',    icon:'ti-microscope'},
  {id:'director', label:'Director Administrativo', icon:'ti-briefcase'},
  {id:'ambos',    label:'Ambos',                   icon:'ti-users'},
]

const PREGUNTAS: Record<string,any[]> = {
  msps:[
    {id:1,categoria:'Inventario y registro',    rol:'biomedico',pregunta:'¿La institución cuenta con un inventario actualizado de todos los dispositivos médicos?',                  normativa:'Res. 4816/2008 Art. 5',  peso:5,evidencia:'Inventario firmado y fechado'},
    {id:2,categoria:'Inventario y registro',    rol:'biomedico',pregunta:'¿Cada equipo tiene asignado un código único de inventario?',                                              normativa:'Res. 4816/2008 Art. 5',  peso:4,evidencia:'Códigos visibles en equipos'},
    {id:3,categoria:'Inventario y registro',    rol:'biomedico',pregunta:'¿Los equipos están clasificados por riesgo según normativa INVIMA?',                                      normativa:'Dec. 4725/2005',         peso:5,evidencia:'Clasificación en inventario'},
    {id:4,categoria:'Mantenimiento preventivo', rol:'biomedico',pregunta:'¿Existe un programa anual de mantenimiento preventivo documentado y aprobado?',                           normativa:'Res. 4816/2008 Art. 7',  peso:5,evidencia:'Cronograma firmado por director'},
    {id:5,categoria:'Mantenimiento preventivo', rol:'biomedico',pregunta:'¿El porcentaje de cumplimiento del mantenimiento preventivo es mayor al 80%?',                            normativa:'Res. 4816/2008 Art. 7',  peso:5,evidencia:'Indicador de cumplimiento'},
    {id:6,categoria:'Mantenimiento preventivo', rol:'biomedico',pregunta:'¿Se registran todas las actividades de mantenimiento en hojas de vida de los equipos?',                  normativa:'Res. 4816/2008 Art. 8',  peso:4,evidencia:'Hojas de vida individuales'},
    {id:7,categoria:'Mantenimiento correctivo', rol:'biomedico',pregunta:'¿Existe un procedimiento documentado para la gestión de averías?',                                        normativa:'Res. 4816/2008 Art. 9',  peso:4,evidencia:'Procedimiento escrito'},
    {id:8,categoria:'Calibración',              rol:'biomedico',pregunta:'¿Los equipos de medición cuentan con certificados de calibración vigentes?',                              normativa:'Res. 4816/2008 Art. 10', peso:5,evidencia:'Certificados de calibración'},
    {id:9,categoria:'Calibración',              rol:'biomedico',pregunta:'¿Los certificados son emitidos por laboratorios acreditados por ONAC?',                                  normativa:'NTC ISO/IEC 17025',      peso:4,evidencia:'Acreditación ONAC'},
    {id:10,categoria:'Tecnovigilancia',         rol:'biomedico',pregunta:'¿La institución tiene implementado el programa de tecnovigilancia?',                                      normativa:'Res. 4816/2008 Art. 15', peso:5,evidencia:'Programa de tecnovigilancia escrito'},
    {id:11,categoria:'Tecnovigilancia',         rol:'biomedico',pregunta:'¿Se reportan los eventos adversos relacionados con dispositivos médicos al INVIMA?',                     normativa:'Res. 4816/2008',         peso:5,evidencia:'Reportes enviados al INVIMA'},
    {id:12,categoria:'Personal',                rol:'director', pregunta:'¿El personal de ingeniería biomédica tiene formación certificada?',                                       normativa:'Res. 3100/2019',         peso:4,evidencia:'Hojas de vida y certificados'},
    {id:13,categoria:'Presupuesto',             rol:'director', pregunta:'¿Se cuenta con presupuesto asignado para mantenimiento de tecnología biomédica?',                        normativa:'Res. 3100/2019',         peso:4,evidencia:'Presupuesto aprobado en acta'},
    {id:14,categoria:'Presupuesto',             rol:'director', pregunta:'¿El presupuesto de mantenimiento preventivo es mayor al de correctivo?',                                 normativa:'Buenas prácticas OPS',   peso:3,evidencia:'Análisis de costos'},
    {id:15,categoria:'Baja y reposición',       rol:'ambos',    pregunta:'¿Existe un procedimiento para dar de baja equipos obsoletos o irreparables?',                            normativa:'Res. 4816/2008',         peso:3,evidencia:'Procedimiento de baja documentado'},
  ],
  interna:[
    {id:1,categoria:'Inventario',    rol:'biomedico',pregunta:'¿El inventario se actualiza con una frecuencia mínima trimestral?',                  normativa:'Política interna',    peso:4,evidencia:'Fecha de última actualización'},
    {id:2,categoria:'Inventario',    rol:'biomedico',pregunta:'¿Todos los equipos tienen hoja de vida individual actualizada?',                     normativa:'Política interna',    peso:5,evidencia:'Hojas de vida individuales'},
    {id:3,categoria:'KPIs',          rol:'biomedico',pregunta:'¿Se calcula y reporta el MTBF mensualmente?',                                        normativa:'Indicadores OPS/OMS', peso:4,evidencia:'Reporte mensual de KPIs'},
    {id:4,categoria:'KPIs',          rol:'biomedico',pregunta:'¿La disponibilidad del parque de equipos es mayor al 90%?',                          normativa:'Estándar OPS',        peso:5,evidencia:'Indicador de disponibilidad'},
    {id:5,categoria:'KPIs',          rol:'biomedico',pregunta:'¿El MTTR de equipos críticos es menor a 24 horas?',                                 normativa:'Estándar OPS',        peso:4,evidencia:'Registro de tiempos de reparación'},
    {id:6,categoria:'Cronograma',    rol:'biomedico',pregunta:'¿El cumplimiento del cronograma de mantenimiento preventivo supera el 85%?',         normativa:'Política interna',    peso:5,evidencia:'Informe de cumplimiento'},
    {id:7,categoria:'Cronograma',    rol:'biomedico',pregunta:'¿Se generan órdenes de trabajo para cada intervención planificada?',                 normativa:'Política interna',    peso:4,evidencia:'Órdenes de trabajo en sistema'},
    {id:8,categoria:'Gestión riesgo',rol:'ambos',    pregunta:'¿Se tiene identificado el plan de contingencia para equipos críticos fuera de servicio?',normativa:'Política interna',peso:5,evidencia:'Plan de contingencia documentado'},
    {id:9,categoria:'Proveedores',   rol:'director', pregunta:'¿Los proveedores de mantenimiento tienen contratos vigentes con SLA definidos?',     normativa:'Política interna',    peso:4,evidencia:'Contratos vigentes'},
    {id:10,categoria:'Proveedores',  rol:'director', pregunta:'¿Se evalúa el desempeño de los proveedores de mantenimiento?',                      normativa:'Política interna',    peso:3,evidencia:'Evaluaciones de proveedores'},
  ],
  supersalud:[
    {id:1,categoria:'Habilitación',        rol:'director', pregunta:'¿La institución tiene registro de habilitación vigente ante el ente territorial?',     normativa:'Res. 3100/2019',   peso:5,evidencia:'Certificado de habilitación vigente'},
    {id:2,categoria:'Registros sanitarios',rol:'biomedico',pregunta:'¿Todos los dispositivos médicos tienen registro sanitario INVIMA vigente?',            normativa:'Dec. 4725/2005',   peso:5,evidencia:'Registros sanitarios por equipo'},
    {id:3,categoria:'Seguridad paciente',  rol:'ambos',    pregunta:'¿Se realizan pruebas de seguridad eléctrica a los equipos electromédicos?',           normativa:'IEC 60601',        peso:5,evidencia:'Certificados de seguridad eléctrica'},
    {id:4,categoria:'Gestión incidentes',  rol:'director', pregunta:'¿Existe un sistema de reporte interno de incidentes con dispositivos médicos?',       normativa:'Res. 4816/2008',   peso:4,evidencia:'Formato de reporte interno'},
    {id:5,categoria:'Gestión incidentes',  rol:'director', pregunta:'¿Los incidentes graves son reportados a la Supersalud en los tiempos establecidos?', normativa:'Circular 049/2012',peso:5,evidencia:'Reportes enviados a Supersalud'},
    {id:6,categoria:'Documentación',       rol:'biomedico',pregunta:'¿Los procedimientos de mantenimiento están documentados y accesibles al personal?',   normativa:'Res. 3100/2019',   peso:3,evidencia:'Manuales disponibles'},
  ],
  acreditacion:[
    {id:1,categoria:'Liderazgo',      rol:'director', pregunta:'¿Existe una política institucional formal de gestión de tecnología biomédica?',              normativa:'ICONTEC — Dirección',   peso:5,evidencia:'Política aprobada por junta'},
    {id:2,categoria:'Liderazgo',      rol:'director', pregunta:'¿La alta dirección revisa indicadores de gestión biomédica en comités?',                    normativa:'ICONTEC — Mejoramiento', peso:4,evidencia:'Actas de comité con indicadores'},
    {id:3,categoria:'Riesgo clínico', rol:'ambos',    pregunta:'¿Se realiza análisis de riesgo de falla (AMFE) para equipos críticos?',                    normativa:'ICONTEC — Seguridad',    peso:5,evidencia:'Matrices de riesgo AMFE'},
    {id:4,categoria:'Riesgo clínico', rol:'ambos',    pregunta:'¿Existen protocolos de respuesta ante fallas de equipos de soporte vital?',                normativa:'ICONTEC — Seguridad',    peso:5,evidencia:'Protocolos documentados'},
    {id:5,categoria:'Mejoramiento',   rol:'biomedico',pregunta:'¿Se implementan planes de mejora basados en los resultados de los KPIs biomédicos?',       normativa:'ICONTEC — Mejoramiento', peso:4,evidencia:'Planes de mejora documentados'},
    {id:6,categoria:'Talento humano', rol:'director', pregunta:'¿El personal biomédico tiene plan de carrera y desarrollo profesional definido?',          normativa:'ICONTEC — RRHH',         peso:3,evidencia:'Plan de desarrollo del personal'},
    {id:7,categoria:'Información',    rol:'biomedico',pregunta:'¿La información técnica de los equipos está integrada con el sistema de información hospitalario?',normativa:'ICONTEC — Info',peso:4,evidencia:'Integración con HIS/RIS'},
  ],
}

const OPTS = [
  {v:'cumple',        l:'Cumple',               c:'#16A34A',bg:'#F0FDF4',border:'#BBF7D0',pts:1.0},
  {v:'cumple_parcial',l:'Cumple parcialmente',  c:'#D97706',bg:'#FFFBEB',border:'#FDE68A',pts:0.5},
  {v:'no_cumple',     l:'No cumple',            c:'#DC2626',bg:'#FEF2F2',border:'#FECACA',pts:0.0},
  {v:'no_aplica',     l:'No aplica',            c:'#71717A',bg:'#F8F9FA',border:'#E4E4E7',pts:null},
]

const ACCIONES: Record<string,string> = {
  'Inventario y registro':'Actualizar y completar el inventario con todos los campos requeridos por la Res. 4816/2008.',
  'Inventario':'Actualizar y completar el inventario con todos los campos requeridos por la Res. 4816/2008.',
  'Mantenimiento preventivo':'Elaborar o actualizar el cronograma de mantenimiento preventivo y documentar intervenciones.',
  'Mantenimiento correctivo':'Documentar el procedimiento de gestión de averías y registrar tiempos de respuesta.',
  'Calibración':'Programar calibración de equipos de medición con laboratorios acreditados por ONAC.',
  'Tecnovigilancia':'Implementar el programa de tecnovigilancia y designar responsable ante INVIMA.',
  'Presupuesto':'Solicitar asignación formal de presupuesto para mantenimiento biomédico.',
  'KPIs':'Implementar el cálculo y reporte mensual de MTBF, MTTR y disponibilidad.',
  'Habilitación':'Verificar el registro de habilitación y renovarlo ante la secretaría de salud.',
  'Registros sanitarios':'Verificar y documentar el registro sanitario INVIMA de todos los dispositivos.',
  'Seguridad paciente':'Contratar pruebas de seguridad eléctrica según IEC 60601.',
  'Gestión incidentes':'Implementar sistema de reporte interno y externo de incidentes.',
  'Documentación':'Organizar y hacer accesible toda la documentación técnica.',
  'Personal':'Verificar certificaciones del personal y elaborar plan de capacitación.',
  'Cronograma':'Generar órdenes de trabajo para cada intervención y medir cumplimiento.',
  'Gestión riesgo':'Documentar plan de contingencia para equipos críticos.',
  'Liderazgo':'Formalizar política institucional de gestión biomédica.',
  'Riesgo clínico':'Elaborar matrices AMFE y protocolos ante fallas de soporte vital.',
  'Mejoramiento':'Implementar planes de mejora basados en KPIs.',
  'Talento humano':'Definir plan de carrera y desarrollo para el personal biomédico.',
  'Información':'Integrar información técnica con el sistema de información hospitalario.',
  'Proveedores':'Formalizar contratos con SLA y evaluar desempeño de proveedores.',
}

type Fase = 'inicio'|'ejecutando'|'resultado'

export default function AuditoriaPage() {
  const [fase, setFase] = useState<Fase>('inicio')
  const [tipo, setTipo] = useState('')
  const [rol, setRol] = useState('')
  const [paso, setPaso] = useState(0)
  const [resps, setResps] = useState<Record<number,{valor:string;obs:string}>>({})
  const [tInicio, setTInicio] = useState<Date|null>(null)

  const pregs = (PREGUNTAS[tipo]||[]).filter((p:any)=>rol==='ambos'||p.rol===rol||p.rol==='ambos')
  const preg = pregs[paso]
  const respActual = resps[paso]
  const progreso = pregs.length>0?Math.round((Object.keys(resps).length/pregs.length)*100):0
  const tiempoMin = tInicio?Math.round((Date.now()-tInicio.getTime())/60000):0
  const fechaHoy = new Date().toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})

  function iniciar() {
    if(!tipo||!rol) return
    setPaso(0); setResps({}); setTInicio(new Date()); setFase('ejecutando')
  }

  function responder(v:string) {
    setResps(p=>({...p,[paso]:{valor:v,obs:p[paso]?.obs||''}}))
  }
  function setObs(obs:string) {
    setResps(p=>({...p,[paso]:{...p[paso],obs}}))
  }
  function siguiente() {
    if(paso<pregs.length-1) setPaso(p=>p+1); else setFase('resultado')
  }
  function anterior() { if(paso>0) setPaso(p=>p-1) }

  function calcular() {
    let total=0,max=0
    const porCat:Record<string,{t:number;o:number}>={}
    const noConf:any[]=[], parc:any[]=[]
    pregs.forEach((p:any,i:number)=>{
      const r=resps[i]; const op=OPTS.find(o=>o.v===r?.valor)
      const cat=p.categoria
      if(!porCat[cat]) porCat[cat]={t:0,o:0}
      if(op&&op.pts!==null&&op.pts!==undefined){
        const pts=p.peso*op.pts; total+=pts; max+=p.peso
        porCat[cat].t+=p.peso; porCat[cat].o+=pts
        if(op.v==='no_cumple') noConf.push({...p,obs:r?.obs})
        if(op.v==='cumple_parcial') parc.push({...p,obs:r?.obs})
      } else if(op?.v!=='no_aplica'){ max+=p.peso; porCat[cat].t+=p.peso }
    })
    const pct=max>0?Math.round((total/max)*100):0
    return {pct,total,max,porCat,noConf,parc}
  }

  const res = fase==='resultado'?calcular():null
  const scColor = res?(res.pct>=80?'#16A34A':res.pct>=60?'#D97706':'#DC2626'):'#A1A1AA'
  const scLabel = res?(res.pct>=80?'Aprobado':res.pct>=60?'Con observaciones':'No aprobado'):'—'

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>
      <style>{`@media print{body *{visibility:hidden}#rep-audit,#rep-audit *{visibility:visible}#rep-audit{position:absolute;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>

      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}} className="no-print">
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>BioMed AI / Auditoría</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>Simulación de auditoría</h1>
        </div>
        {fase==='ejecutando'&&(
          <div style={{display:'flex',gap:20}}>
            {[{l:'Progreso',v:`${progreso}%`,c:'#3B4FE8'},{l:'Pregunta',v:`${paso+1}/${pregs.length}`,c:'#18181B'},{l:'Tiempo',v:`${tiempoMin}min`,c:'#D97706'}].map(s=>(
              <div key={s.l} style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</div>
                <div style={{fontSize:18,fontWeight:600,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fase==='ejecutando'&&(
        <div className="no-print" style={{height:3,background:'#F4F4F5'}}>
          <div style={{height:3,width:`${progreso}%`,background:'#3B4FE8',transition:'width 0.3s'}}/>
        </div>
      )}

      <div style={{flex:1,padding:'24px 28px',background:'#fff'}}>

        {/* INICIO */}
        {fase==='inicio'&&(
          <div style={{maxWidth:640,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:32}}>
              <div style={{width:56,height:56,borderRadius:12,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <i className="ti ti-shield-check" style={{fontSize:28,color:'#3B4FE8'}}/>
              </div>
              <h2 style={{fontSize:20,fontWeight:600,color:'#18181B',margin:'0 0 8px'}}>Simulación de auditoría biomédica</h2>
              <p style={{fontSize:13,color:'#71717A',margin:0}}>Responde las preguntas que haría un auditor externo y obtén tu puntaje, hallazgos y plan de mejora.</p>
            </div>

            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:12}}>1. Tipo de auditoría</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {AUDITORIAS.map(a=>(
                  <button key={a.id} onClick={()=>setTipo(a.id)} style={{padding:'16px',borderRadius:10,textAlign:'left',cursor:'pointer',background:'#fff',border:`0.5px solid ${tipo===a.id?'#3B4FE8':'#E4E4E7'}`,transition:'all 0.15s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <i className={'ti ' + a.icon} style={{fontSize:20,color:tipo===a.id?'#3B4FE8':'#A1A1AA'}}/>
                      <span style={{fontSize:13,fontWeight:500,color:tipo===a.id?'#3B4FE8':'#18181B'}}>{a.label}</span>
                    </div>
                    <div style={{fontSize:11,color:'#A1A1AA'}}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:12}}>2. ¿Quién responde?</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {ROLES.map(r=>(
                  <button key={r.id} onClick={()=>setRol(r.id)} style={{padding:'16px',borderRadius:10,textAlign:'center',cursor:'pointer',background:'#fff',border:`0.5px solid ${rol===r.id?'#3B4FE8':'#E4E4E7'}`}}>
                    <i className={'ti ' + r.icon} style={{fontSize:22,color:rol===r.id?'#3B4FE8':'#A1A1AA',display:'block',marginBottom:6}}/>
                    <span style={{fontSize:12,fontWeight:500,color:rol===r.id?'#3B4FE8':'#18181B'}}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {tipo&&rol&&(
              <div style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',border:'0.5px solid #E4E4E7',fontSize:12,color:'#71717A',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-clock" style={{fontSize:14,color:'#3B4FE8'}}/>
                {pregs.length} preguntas · ~{Math.ceil(pregs.length*1.5)} minutos estimados
              </div>
            )}

            <button onClick={iniciar} disabled={!tipo||!rol} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:tipo&&rol?'#3B4FE8':'#F4F4F5',color:tipo&&rol?'#fff':'#A1A1AA',fontSize:14,fontWeight:500,cursor:tipo&&rol?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <i className="ti ti-shield-check" style={{fontSize:18}}/> Iniciar simulación
            </button>
          </div>
        )}

        {/* EJECUTANDO */}
        {fase==='ejecutando'&&preg&&(
          <div style={{maxWidth:620,margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
              <div style={{flex:1,height:1,background:'#E4E4E7'}}/>
              <span style={{fontSize:11,fontWeight:500,color:'#A1A1AA',textTransform:'uppercase',letterSpacing:'0.06em'}}>{preg.categoria}</span>
              <div style={{flex:1,height:1,background:'#E4E4E7'}}/>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
              <div style={{padding:'20px',borderBottom:'0.5px solid #F4F4F5'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{width:36,height:36,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14,fontWeight:600,color:'#3B4FE8'}}>{preg.id}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#EEF2FF',color:'#3B4FE8',fontWeight:500}}>
                        {preg.rol==='biomedico'?'Ing. Biomédico':preg.rol==='director'?'Director':'Ambos'}
                      </span>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#F4F4F5',color:'#71717A'}}>Peso: {preg.peso}/5</span>
                    </div>
                    <p style={{fontSize:15,fontWeight:500,color:'#18181B',margin:'0 0 8px',lineHeight:1.5}}>{preg.pregunta}</p>
                    <div style={{fontSize:11,color:'#A1A1AA'}}>📖 {preg.normativa}</div>
                  </div>
                </div>
                <div style={{marginTop:12,padding:'8px 12px',borderRadius:8,background:'#EEF2FF',fontSize:12,color:'#3B4FE8',display:'flex',gap:6,alignItems:'center'}}>
                  <i className="ti ti-file-text" style={{fontSize:14,flexShrink:0}}/>
                  <strong>Evidencia requerida:</strong> {preg.evidencia}
                </div>
              </div>
              <div style={{padding:'20px'}}>
                <div style={{fontSize:12,fontWeight:500,color:'#71717A',marginBottom:12}}>¿Cómo está tu institución frente a este requisito?</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                  {OPTS.map(op=>(
                    <button key={op.v} onClick={()=>responder(op.v)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,cursor:'pointer',textAlign:'left',background:respActual?.valor===op.v?op.bg:'#fff',border:`0.5px solid ${respActual?.valor===op.v?op.border:'#E4E4E7'}`,transition:'all 0.15s'}}>
                      <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${respActual?.valor===op.v?op.c:'#D4D4D8'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {respActual?.valor===op.v&&<div style={{width:8,height:8,borderRadius:'50%',background:op.c}}/>}
                      </div>
                      <span style={{fontSize:13,fontWeight:500,color:respActual?.valor===op.v?op.c:'#3F3F46'}}>{op.l}</span>
                      {op.pts!==null&&<span style={{marginLeft:'auto',fontSize:11,color:'#A1A1AA'}}>{op.pts===1?`+${preg.peso} pts`:op.pts===0.5?`+${preg.peso*0.5} pts`:'0 pts'}</span>}
                    </button>
                  ))}
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#71717A',marginBottom:6}}>Observaciones (opcional)</div>
                  <textarea value={respActual?.obs||''} onChange={e=>setObs(e.target.value)} placeholder="Describe la evidencia disponible..." rows={2}
                    style={{width:'100%',resize:'none',fontSize:13}}/>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={anterior} disabled={paso===0} style={{padding:'8px 16px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:paso===0?'default':'pointer',opacity:paso===0?0.4:1,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-chevron-left" style={{fontSize:14}}/> Anterior
                  </button>
                  <button onClick={siguiente} disabled={!respActual?.valor} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:respActual?.valor?(paso===pregs.length-1?'#7C3AED':'#3B4FE8'):'#F4F4F5',color:respActual?.valor?'#fff':'#A1A1AA',cursor:respActual?.valor?'pointer':'default',fontSize:13,fontWeight:500,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    {paso===pregs.length-1?<><i className="ti ti-award" style={{fontSize:14}}/> Ver resultados</>:<>Siguiente <i className="ti ti-chevron-right" style={{fontSize:14}}/></>}
                  </button>
                </div>
              </div>
            </div>
            <div style={{textAlign:'center',fontSize:11,color:'#A1A1AA',marginTop:8}}>{paso+1} de {pregs.length} · {Object.keys(resps).length} respondidas</div>
          </div>
        )}

        {/* RESULTADO */}
        {fase==='resultado'&&res&&(
          <div style={{maxWidth:800,margin:'0 auto',display:'flex',flexDirection:'column',gap:16}} className="no-print">
            <div style={{background:'#fff',borderRadius:12,border:`0.5px solid ${scColor}40`,padding:'28px',textAlign:'center'}}>
              <div style={{width:100,height:100,borderRadius:'50%',border:`4px solid ${scColor}`,background:`${scColor}10`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <div>
                  <div style={{fontSize:28,fontWeight:700,color:scColor}}>{res.pct}%</div>
                  <div style={{fontSize:10,color:scColor,textTransform:'uppercase',letterSpacing:'0.05em'}}>cumplimiento</div>
                </div>
              </div>
              <div style={{fontSize:20,fontWeight:700,color:scColor,marginBottom:4}}>{scLabel}</div>
              <div style={{fontSize:12,color:'#A1A1AA',marginBottom:20}}>{AUDITORIAS.find(a=>a.id===tipo)?.label} · {tiempoMin} min · {pregs.length} preguntas</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[
                  {l:'Puntos',v:`${res.total.toFixed(1)}/${res.max}`,c:'#18181B'},
                  {l:'No conformes',v:res.noConf.length,c:'#DC2626'},
                  {l:'Parciales',v:res.parc.length,c:'#D97706'},
                  {l:'Cumplen',v:Object.values(resps).filter((r:any)=>r.valor==='cumple').length,c:'#16A34A'},
                ].map(s=>(
                  <div key={s.l} style={{background:'#F8F9FA',borderRadius:8,padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:600,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>window.print()} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#3B4FE8',color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <i className="ti ti-download" style={{fontSize:14}}/> Exportar PDF
                </button>
                <button onClick={()=>{setFase('inicio');setResps({});setPaso(0)}} style={{flex:1,padding:'10px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',fontSize:13,cursor:'pointer'}}>
                  Nueva auditoría
                </button>
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Cumplimiento por categoría</div>
              </div>
              {Object.entries(res.porCat).map(([cat,d]:any)=>{
                const pct=d.t>0?Math.round((d.o/d.t)*100):0
                const c=pct>=80?'#22C55E':pct>=60?'#F59E0B':'#EF4444'
                return (
                  <div key={cat} style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:500,color:'#3F3F46'}}>{cat}</span>
                      <span style={{fontSize:13,fontWeight:600,color:c}}>{pct}%</span>
                    </div>
                    <div style={{height:5,background:'#F4F4F5',borderRadius:3}}>
                      <div style={{height:5,borderRadius:3,width:`${pct}%`,background:c}}/>
                    </div>
                    <div style={{fontSize:11,color:'#A1A1AA',marginTop:3}}>{d.o.toFixed(1)} / {d.t} puntos</div>
                  </div>
                )
              })}
            </div>

            {res.noConf.length>0&&(
              <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #FECACA',overflow:'hidden'}}>
                <div style={{padding:'16px 20px',background:'#FEF2F2',borderBottom:'0.5px solid #FECACA'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#DC2626',display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-alert-triangle" style={{fontSize:15}}/> No conformidades — Acción inmediata
                  </div>
                </div>
                {res.noConf.map((nc:any,i:number)=>(
                  <div key={i} style={{padding:'14px 20px',borderBottom:'0.5px solid #FEF2F2',display:'flex',gap:12}}>
                    <i className="ti ti-x" style={{fontSize:14,color:'#DC2626',flexShrink:0,marginTop:2}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:2}}>{nc.pregunta}</div>
                      <div style={{fontSize:11,color:'#A1A1AA'}}>{nc.normativa} · Peso: {nc.peso}</div>
                      {nc.obs&&<div style={{fontSize:11,color:'#71717A',fontStyle:'italic'}}>{nc.obs}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {res.noConf.length>0&&(
              <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#18181B',display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-clipboard-list" style={{fontSize:15,color:'#3B4FE8'}}/> Plan de mejora automático
                  </div>
                </div>
                {res.noConf.map((nc:any,i:number)=>(
                  <div key={i} style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA',display:'flex',gap:12}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,fontWeight:600,color:'#3B4FE8'}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:4}}>{nc.pregunta}</div>
                      <div style={{fontSize:11,color:'#71717A',marginBottom:4}}>{nc.normativa}</div>
                      <div style={{fontSize:12,padding:'8px 12px',borderRadius:6,background:'#F8F9FA',color:'#52525B'}}>
                        <strong style={{color:'#3B4FE8'}}>Acción: </strong>
                        {ACCIONES[nc.categoria]||'Documentar e implementar el procedimiento correspondiente.'}
                      </div>
                      <div style={{display:'flex',gap:12,marginTop:6,fontSize:11,color:'#A1A1AA'}}>
                        <span>⏱ Plazo: {nc.peso>=5?'30 días':nc.peso>=4?'60 días':'90 días'}</span>
                        <span>👤 {nc.rol==='biomedico'?'Ing. Biomédico':nc.rol==='director'?'Director':'Ambos'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {res.noConf.length===0&&(
              <div style={{background:'#F0FDF4',borderRadius:12,border:'0.5px solid #BBF7D0',padding:'24px',textAlign:'center'}}>
                <i className="ti ti-check" style={{fontSize:32,color:'#16A34A',display:'block',marginBottom:8}}/>
                <div style={{fontSize:15,fontWeight:600,color:'#16A34A',marginBottom:4}}>¡Sin no conformidades!</div>
                <div style={{fontSize:13,color:'#71717A'}}>La institución cumple con todos los requisitos evaluados.</div>
              </div>
            )}

            <div id="rep-audit" style={{background:'#fff',color:'#000',padding:40,fontFamily:'Arial,sans-serif',fontSize:12,lineHeight:1.6}}>
              <div style={{borderBottom:'3px solid #3B4FE8',paddingBottom:20,marginBottom:24,display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:22,fontWeight:900,color:'#3B4FE8'}}>BioMed AI</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#18181B'}}>Reporte de Simulación de Auditoría</div>
                  <div style={{fontSize:11,color:'#71717A'}}>{AUDITORIAS.find(a=>a.id===tipo)?.label}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:32,fontWeight:900,color:scColor}}>{res.pct}%</div>
                  <div style={{padding:'4px 12px',background:scColor,color:'#fff',borderRadius:4,fontSize:11,fontWeight:700,display:'inline-block'}}>{scLabel.toUpperCase()}</div>
                  <div style={{fontSize:11,color:'#71717A',marginTop:4}}>{fechaHoy}</div>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:10,borderBottom:'1px solid #E4E4E7',paddingBottom:6}}>Resultado por categoría</div>
                {Object.entries(res.porCat).map(([cat,d]:any)=>{
                  const pct=d.t>0?Math.round((d.o/d.t)*100):0
                  return (
                    <div key={cat} style={{marginBottom:8,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:180,fontSize:11,fontWeight:600}}>{cat}</div>
                      <div style={{flex:1,height:8,background:'#F4F4F5',borderRadius:4}}>
                        <div style={{height:8,borderRadius:4,width:`${pct}%`,background:pct>=80?'#16A34A':pct>=60?'#D97706':'#DC2626'}}/>
                      </div>
                      <div style={{width:36,textAlign:'right',fontSize:11,fontWeight:700,color:pct>=80?'#16A34A':pct>=60?'#D97706':'#DC2626'}}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
              {res.noConf.length>0&&(
                <div style={{marginBottom:16,padding:12,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:6}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#DC2626',marginBottom:6}}>No conformidades</div>
                  {res.noConf.map((nc:any,i:number)=>(
                    <div key={i} style={{fontSize:10,color:'#7F1D1D',marginBottom:4}}>{i+1}. {nc.pregunta} — {nc.normativa}</div>
                  ))}
                </div>
              )}
              <div style={{marginTop:24,paddingTop:12,borderTop:'1px solid #E4E4E7',textAlign:'center',fontSize:9,color:'#A1A1AA'}}>
                BioMed AI · Simulación de auditoría · {fechaHoy} · Solo para uso interno
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
