'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'

interface Pregunta {
  numero:number; categoria:string; pregunta:string
  tipo:'si_no'|'valor_numerico'|'texto'|'seleccion'|'checklist'
  opciones?:string[]; unidad?:string; valor_esperado?:string
  critica:boolean; advertencia?:string|null
}
interface Respuesta { pregunta:number; valor:any; conforme:boolean; observacion:string }
type Fase='cargando'|'ejecutando'|'revision'|'firmando'|'finalizado'

export default function OrdenDetallePage(){
  const params=useParams()
  const[orden,setOrden]=useState<any>(null)
  const[preguntas,setPreguntas]=useState<Pregunta[]>([])
  const[cargando,setCargando]=useState(true)
  const[pasoActual,setPasoActual]=useState(0)
  const[respuestas,setRespuestas]=useState<Record<number,Respuesta>>({})
  const[fase,setFase]=useState<Fase>('cargando')
  const[firma,setFirma]=useState('')
  const[firmaSupervisor,setFirmaSupervisor]=useState('')
  const[tiempoInicio,setTiempoInicio]=useState<Date|null>(null)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const canvasSuperRef=useRef<HTMLCanvasElement>(null)
  const[dibujando,setDibujando]=useState(false)
  const[dibujandoSuper,setDibujandoSuper]=useState(false)

  useEffect(()=>{
    const guardada=sessionStorage.getItem(`orden-${params.id}`)
    if(guardada){
      const ord=JSON.parse(guardada)
      setOrden(ord)
      cargarProtocolo(ord)
    }
  },[params.id])

  async function cargarProtocolo(ord:any){
    setCargando(true)
    try{
      const res=await fetch('/api/protocolo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({equipo:ord.equipo,tipo:ord.tipo})})
      const data=await res.json()
      if(data.preguntas){setPreguntas(data.preguntas);setFase('ejecutando');setTiempoInicio(new Date())}
    }catch(err){console.error(err)}
    setCargando(false)
  }

  function responderPaso(valor:any){
    const pregunta=preguntas[pasoActual]
    const conforme=determinarConformidad(pregunta,valor)
    setRespuestas(prev=>({...prev,[pasoActual]:{pregunta:pasoActual,valor,conforme,observacion:prev[pasoActual]?.observacion||''}}))
  }

  function setObservacion(obs:string){
    setRespuestas(prev=>({...prev,[pasoActual]:{...prev[pasoActual],observacion:obs}}))
  }

  function determinarConformidad(pregunta:Pregunta,valor:any):boolean{
    if(pregunta.tipo==='si_no') return valor==='si'
    if(pregunta.tipo==='seleccion') return ['Bueno','Conforme','Correcto','Óptimo','Optimo','Funciona correctamente','Sí — realizado'].includes(valor)
    if(pregunta.tipo==='valor_numerico') return true
    return true
  }

  function siguiente(){
    if(pasoActual<preguntas.length-1) setPasoActual(p=>p+1)
    else setFase('revision')
  }

  function anterior(){
    if(pasoActual>0) setPasoActual(p=>p-1)
  }

  function finalizar(){
    if(!firma) return
    setFase('finalizado')
    const kanbanOrdenes=JSON.parse(sessionStorage.getItem('kanban-ordenes')||'[]')
    const actualizadas=kanbanOrdenes.map((o:any)=>o.id===orden?.id?{...o,columna:'completado',progreso:100}:o)
    sessionStorage.setItem('kanban-ordenes',JSON.stringify(actualizadas))
  }

  const tiempoMin=tiempoInicio?Math.round((Date.now()-tiempoInicio.getTime())/60000):0
  const progreso=preguntas.length>0?Math.round((Object.keys(respuestas).length/preguntas.length)*100):0
  const noConformes=Object.values(respuestas).filter(r=>!r.conforme).length
  const pregunta=preguntas[pasoActual]
  const respuestaActual=respuestas[pasoActual]
  const fechaHoy=new Date().toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})

  // Categorias unicas
  const categorias=[...new Set(preguntas.map(p=>p.categoria))]
  const catActual=pregunta?.categoria

  if(cargando||!orden) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#fff',flexDirection:'column',gap:12}}>
      <i className="ti ti-loader-2" style={{fontSize:32,color:AZ,animation:'spin 1s linear infinite'}}/>
      <div style={{fontSize:13,color:GR}}>Cargando formulario...</div>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#FAFAFA'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'12px 24px',display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
        <Link href="/ordenes" style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#F8F9FA',textDecoration:'none',fontSize:12,color:GR,flexShrink:0}}>
          <i className="ti ti-arrow-left" style={{fontSize:13}}/> Volver
        </Link>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:1}}>{orden.id}</div>
          <h1 style={{fontSize:16,fontWeight:500,color:'#18181B',margin:0}}>{orden.equipo}</h1>
        </div>
        {/* Progreso */}
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600,color:progreso===100?VE:AZ,lineHeight:1}}>{progreso}%</div>
            <div style={{fontSize:10,color:'#A1A1AA'}}>Progreso</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600,color:NA,lineHeight:1}}>{tiempoMin}min</div>
            <div style={{fontSize:10,color:'#A1A1AA'}}>Tiempo</div>
          </div>
          {/* Fases */}
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            {[
              {id:'ejecutando',label:'Ejecucion',n:1},
              {id:'revision',  label:'Revision',  n:2},
              {id:'firmando',  label:'Firma',      n:3},
              {id:'finalizado',label:'Finalizado', n:4},
            ].map((f,i,arr)=>{
              const fases=['ejecutando','revision','firmando','finalizado']
              const fasesIdx=fases.indexOf(fase)
              const estaIdx=fases.indexOf(f.id)
              const activo=f.id===fase
              const pasado=fasesIdx>estaIdx
              const col=activo?AZ:pasado?VE:'#A1A1AA'
              return(
                <div key={f.id} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:20,background:activo?AZ_BG:pasado?VE_BG:'transparent',border:`0.5px solid ${activo?AZ:pasado?VE:'#E4E4E7'}`}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:activo?AZ:pasado?VE:'#E4E4E7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:'#fff'}}>
                      {pasado?'✓':f.n}
                    </div>
                    <span style={{fontSize:11,fontWeight:activo?500:400,color:col}}>{f.label}</span>
                  </div>
                  {i<arr.length-1&&<div style={{width:20,height:1,background:'#E4E4E7'}}/>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Barra progreso */}
      {fase==='ejecutando'&&(
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',flexShrink:0}}>
          <div style={{height:3,background:'#F1F5F9'}}>
            <div style={{height:3,background:VE,width:`${progreso}%`,transition:'width 0.5s'}}/>
          </div>
          <div style={{padding:'8px 24px',display:'flex',gap:4,overflowX:'auto'}}>
            {preguntas.map((_,i)=>{
              const resp=respuestas[i]
              const activo=i===pasoActual
              return(
                <button key={i} onClick={()=>setPasoActual(i)}
                  style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,flexShrink:0,border:`2px solid ${activo?AZ:resp?(resp.conforme?VE:RO):'#E4E4E7'}`,background:activo?AZ_BG:resp?(resp.conforme?VE_BG:RO_BG):'#fff',color:activo?AZ:resp?(resp.conforme?VE:RO):'#A1A1AA',cursor:'pointer',transition:'all 0.15s'}}>
                  {resp?(resp.conforme?'✓':'!'):i+1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div style={{flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px',overflowY:'auto'}}>

        {/* EJECUTANDO */}
        {fase==='ejecutando'&&pregunta&&(
          <div style={{width:'100%',maxWidth:680}}>

            {/* Categoria header */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{height:1,flex:1,background:'#E4E4E7'}}/>
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,background:'#F4F4F5',border:'0.5px solid #E4E4E7'}}>
                <span style={{fontSize:11,fontWeight:500,color:GR}}>{pregunta.categoria}</span>
              </div>
              <div style={{height:1,flex:1,background:'#E4E4E7'}}/>
            </div>

            {/* Card pregunta */}
            <div style={{background:'#fff',borderRadius:16,border:`0.5px solid ${pregunta.critica?RO+'40':'#E4E4E7'}`,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>

              {/* Header pregunta */}
              <div style={{padding:'20px 24px',borderBottom:'0.5px solid #F4F4F5'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:10,background:pregunta.critica?RO_BG:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:14,fontWeight:600,color:pregunta.critica?RO:AZ}}>{pregunta.numero}</span>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:16,fontWeight:500,color:'#18181B',margin:0,lineHeight:1.5}}>{pregunta.pregunta}</p>
                    {pregunta.valor_esperado&&(
                      <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:8,background:VE_BG,border:`0.5px solid ${VE}40`}}>
                        <i className="ti ti-check" style={{fontSize:12,color:VE}}/>
                        <span style={{fontSize:12,color:VE,fontWeight:500}}>Esperado: {pregunta.valor_esperado} {pregunta.unidad||''}</span>
                      </div>
                    )}
                  </div>
                  {pregunta.critica&&(
                    <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:RO_BG,border:`0.5px solid ${RO}40`,flexShrink:0}}>
                      <i className="ti ti-alert-triangle" style={{fontSize:12,color:RO}}/>
                      <span style={{fontSize:11,fontWeight:500,color:RO}}>Critico</span>
                    </div>
                  )}
                </div>
                {pregunta.advertencia&&(
                  <div style={{marginTop:12,display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',borderRadius:10,background:NA_BG,border:`0.5px solid ${NA}40`}}>
                    <i className="ti ti-alert-triangle" style={{fontSize:14,color:NA,flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:12,color:'#92400E'}}>{pregunta.advertencia}</span>
                  </div>
                )}
              </div>

              {/* Respuesta */}
              <div style={{padding:'20px 24px'}}>

                {/* SI/NO */}
                {pregunta.tipo==='si_no'&&(
                  <div style={{display:'flex',gap:12}}>
                    {[{v:'si',l:'Si',icon:'ti-check'},{v:'no',l:'No',icon:'ti-x'}].map(op=>{
                      const sel=respuestaActual?.valor===op.v
                      const isOk=op.v==='si'
                      return(
                        <button key={op.v} onClick={()=>responderPaso(op.v)}
                          style={{flex:1,padding:'16px',borderRadius:12,border:`2px solid ${sel?(isOk?VE:RO):'#E4E4E7'}`,background:sel?(isOk?VE_BG:RO_BG):'#FAFAFA',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all 0.15s'}}
                          onMouseEnter={e=>{if(!sel){e.currentTarget.style.borderColor=isOk?VE:RO;e.currentTarget.style.background=isOk?VE_BG:RO_BG}}}
                          onMouseLeave={e=>{if(!sel){e.currentTarget.style.borderColor='#E4E4E7';e.currentTarget.style.background='#FAFAFA'}}}>
                          <i className={`ti ${op.icon}`} style={{fontSize:20,color:sel?(isOk?VE:RO):'#A1A1AA'}}/>
                          <span style={{fontSize:16,fontWeight:600,color:sel?(isOk?VE:RO):'#52525B'}}>✓  {op.l}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* VALOR NUMERICO */}
                {pregunta.tipo==='valor_numerico'&&(
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <input type="number" step="0.1"
                      value={respuestaActual?.valor||''}
                      onChange={e=>responderPaso(e.target.value)}
                      placeholder="0.0"
                      style={{flex:1,fontSize:32,fontWeight:600,textAlign:'center',padding:'12px',borderRadius:12,border:'1.5px solid #E4E4E7',background:'#FAFAFA',color:'#18181B'}}/>
                    {pregunta.unidad&&<span style={{fontSize:20,fontWeight:600,color:'#A1A1AA'}}>{pregunta.unidad}</span>}
                  </div>
                )}

                {/* TEXTO */}
                {pregunta.tipo==='texto'&&(
                  <textarea value={respuestaActual?.valor||''} onChange={e=>responderPaso(e.target.value)}
                    placeholder="Describe lo observado..."
                    rows={4}
                    style={{width:'100%',fontSize:13,borderRadius:12,padding:'12px',border:'1.5px solid #E4E4E7',background:'#FAFAFA',color:'#18181B',resize:'none'}}/>
                )}

                {/* SELECCION */}
                {pregunta.tipo==='seleccion'&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {(pregunta.opciones||[]).map(op=>{
                      const sel=respuestaActual?.valor===op
                      const ok=['Bueno','Conforme','Correcto','Óptimo','Optimo','Funciona correctamente','Sí — realizado'].includes(op)
                      return(
                        <button key={op} onClick={()=>responderPaso(op)}
                          style={{padding:'14px',borderRadius:10,border:`2px solid ${sel?(ok?VE:NA):'#E4E4E7'}`,background:sel?(ok?VE_BG:NA_BG):'#FAFAFA',cursor:'pointer',fontSize:13,fontWeight:sel?500:400,color:sel?(ok?VE:NA):'#52525B',textAlign:'left',transition:'all 0.15s'}}>
                          <span style={{marginRight:6}}>{sel?'●':'○'}</span>{op}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* CHECKLIST */}
                {pregunta.tipo==='checklist'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {(pregunta.opciones||[]).map(op=>{
                      const sel:string[]=respuestaActual?.valor||[]
                      const marcado=sel.includes(op)
                      return(
                        <button key={op} onClick={()=>responderPaso(marcado?sel.filter((x:string)=>x!==op):[...sel,op])}
                          style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,border:`2px solid ${marcado?VE:'#E4E4E7'}`,background:marcado?VE_BG:'#FAFAFA',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}>
                          <div style={{width:22,height:22,borderRadius:6,background:marcado?VE:'#E4E4E7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            {marcado&&<i className="ti ti-check" style={{fontSize:13,color:'#fff'}}/>}
                          </div>
                          <span style={{fontSize:13,fontWeight:marcado?500:400,color:marcado?VE:'#52525B'}}>{op}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Observacion */}
                <div style={{marginTop:16}}>
                  <input type="text" value={respuestas[pasoActual]?.observacion||''} onChange={e=>setObservacion(e.target.value)}
                    placeholder="Observacion adicional (opcional)..."
                    style={{width:'100%',fontSize:12,padding:'10px 14px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#FAFAFA',color:GR}}/>
                </div>
              </div>

              {/* Navegacion */}
              <div style={{padding:'16px 24px',borderTop:'0.5px solid #F4F4F5',display:'flex',gap:10}}>
                <button onClick={anterior} disabled={pasoActual===0}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',color:pasoActual===0?'#A1A1AA':'#52525B',cursor:pasoActual===0?'default':'pointer',opacity:pasoActual===0?0.5:1,fontSize:13}}>
                  <i className="ti ti-chevron-left" style={{fontSize:14}}/> Anterior
                </button>
                <button onClick={siguiente}
                  disabled={!respuestaActual&&respuestaActual?.valor!==false}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',borderRadius:10,border:'none',background:respuestaActual?pasoActual===preguntas.length-1?AZ:VE:'#F1F5F9',color:respuestaActual?'#fff':'#A1A1AA',cursor:respuestaActual?'pointer':'default',fontSize:13,fontWeight:500,transition:'all 0.15s'}}>
                  {pasoActual===preguntas.length-1
                    ?<><i className="ti ti-file-text" style={{fontSize:14}}/> Enviar a revision</>
                    :<>Siguiente <i className="ti ti-chevron-right" style={{fontSize:14}}/></>
                  }
                </button>
              </div>
            </div>

            {/* Contador */}
            <div style={{textAlign:'center',marginTop:12,fontSize:12,color:'#A1A1AA'}}>
              {pasoActual+1} de {preguntas.length} · {Object.keys(respuestas).length} respondidas
            </div>
          </div>
        )}

        {/* REVISION */}
        {fase==='revision'&&(
          <div style={{width:'100%',maxWidth:680}}>
            <div style={{background:'#fff',borderRadius:16,border:'0.5px solid #E4E4E7',overflow:'hidden',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{padding:'20px 24px',borderBottom:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:noConformes>0?RO_BG:VE_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className={`ti ${noConformes>0?'ti-alert-triangle':'ti-check'}`} style={{fontSize:22,color:noConformes>0?RO:VE}}/>
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:500,color:'#18181B',marginBottom:2}}>
                    {noConformes>0?`${noConformes} items no conformes`:'Todos los items conformes'}
                  </div>
                  <div style={{fontSize:12,color:'#A1A1AA'}}>{Object.keys(respuestas).length} de {preguntas.length} respondidas · {tiempoMin} minutos</div>
                </div>
              </div>
              {/* Resumen por categoria */}
              <div style={{padding:'16px 24px'}}>
                {categorias.map(cat=>{
                  const pasosCat=preguntas.filter(p=>p.categoria===cat)
                  const respCat=pasosCat.map((_,i)=>respuestas[preguntas.findIndex(p=>p.categoria===cat&&p.numero===pasosCat[i].numero)]).filter(Boolean)
                  const noConformesCat=respCat.filter(r=>!r?.conforme).length
                  return(
                    <div key={cat} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'0.5px solid #F4F4F5'}}>
                      <span style={{fontSize:13,color:'#52525B'}}>{cat}</span>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:12,color:'#A1A1AA'}}>{respCat.length}/{pasosCat.length}</span>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:noConformesCat>0?RO_BG:VE_BG,color:noConformesCat>0?RO:VE,fontWeight:500}}>
                          {noConformesCat>0?`${noConformesCat} no conformes`:'Conforme'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* No conformes detalle */}
            {noConformes>0&&(
              <div style={{background:'#fff',borderRadius:12,border:`0.5px solid ${RO}40`,padding:'16px 20px',marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:500,color:RO,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                  <i className="ti ti-alert-triangle" style={{fontSize:15}}/> Items no conformes
                </div>
                {preguntas.map((p,i)=>{
                  const r=respuestas[i]
                  if(!r||r.conforme) return null
                  return(
                    <div key={i} style={{padding:'8px 0',borderBottom:'0.5px solid #FEE2E2',display:'flex',gap:10}}>
                      <span style={{fontSize:11,fontWeight:600,color:RO,flexShrink:0}}>#{p.numero}</span>
                      <div>
                        <div style={{fontSize:12,color:'#18181B'}}>{p.pregunta}</div>
                        <div style={{fontSize:11,color:RO}}>Respuesta: {String(r.valor)}</div>
                        {r.observacion&&<div style={{fontSize:11,color:GR}}>Obs: {r.observacion}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setFase('ejecutando');setPasoActual(0)}} style={{flex:1,padding:'12px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,color:GR,cursor:'pointer'}}>
                Revisar respuestas
              </button>
              <button onClick={()=>setFase('firmando')} style={{flex:2,padding:'12px',borderRadius:10,border:'none',background:AZ,color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <i className="ti ti-pen" style={{fontSize:14}}/> Proceder a firmar
              </button>
            </div>
          </div>
        )}

        {/* FIRMANDO */}
        {fase==='firmando'&&(
          <div style={{width:'100%',maxWidth:560}}>
            <div style={{background:'#fff',borderRadius:16,border:'0.5px solid #E4E4E7',overflow:'hidden',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{padding:'20px 24px',borderBottom:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-pen" style={{fontSize:20,color:AZ}}/>
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:500,color:'#18181B'}}>Firma y aprobacion</div>
                  <div style={{fontSize:11,color:'#A1A1AA'}}>Firma para certificar la ejecucion del mantenimiento</div>
                </div>
              </div>

              {/* Info orden */}
              <div style={{padding:'16px 24px',borderBottom:'0.5px solid #F4F4F5',background:'#FAFAFA'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    ['Orden',orden.id],['Equipo',orden.equipo],
                    ['Tecnico',orden.tecnico],['Fecha',fechaHoy],
                    ['Duracion',tiempoMin+' minutos'],['Resultado',noConformes>0?`${noConformes} no conformes`:'Conforme'],
                  ].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontSize:10,color:'#A1A1AA',marginBottom:1}}>{k}</div>
                      <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{padding:'20px 24px'}}>
                {/* Firma tecnico */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:AZ}}>1</div>
                    Firma del tecnico ejecutor
                  </div>
                  <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${firma?VE:'#E4E4E7'}`,background:'#FAFAFA'}}>
                    <canvas ref={canvasRef} width={480} height={120}
                      style={{width:'100%',height:120,cursor:'crosshair',display:'block',touchAction:'none'}}
                      onMouseDown={e=>{setDibujando(true);const r=canvasRef.current!.getBoundingClientRect();const ctx=canvasRef.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top)}}
                      onMouseMove={e=>{if(!dibujando) return;const r=canvasRef.current!.getBoundingClientRect();const ctx=canvasRef.current!.getContext('2d')!;ctx.strokeStyle=AZ;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();setFirma(canvasRef.current!.toDataURL())}}
                      onMouseUp={()=>setDibujando(false)} onMouseLeave={()=>setDibujando(false)}
                      onTouchStart={e=>{e.preventDefault();setDibujando(true);const r=canvasRef.current!.getBoundingClientRect();const t=e.touches[0];const ctx=canvasRef.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(t.clientX-r.left,t.clientY-r.top)}}
                      onTouchMove={e=>{e.preventDefault();if(!dibujando) return;const r=canvasRef.current!.getBoundingClientRect();const t=e.touches[0];const ctx=canvasRef.current!.getContext('2d')!;ctx.strokeStyle=AZ;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(t.clientX-r.left,t.clientY-r.top);ctx.stroke();setFirma(canvasRef.current!.toDataURL())}}
                      onTouchEnd={()=>setDibujando(false)}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                    {firma?<span style={{fontSize:11,color:VE}}>✓ Firma registrada</span>:<span style={{fontSize:11,color:'#A1A1AA'}}>Dibuja tu firma</span>}
                    <button onClick={()=>{canvasRef.current!.getContext('2d')!.clearRect(0,0,480,120);setFirma('')}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'0.5px solid #E4E4E7',background:'#fff',color:GR,cursor:'pointer'}}>Limpiar</button>
                  </div>
                </div>

                {/* Firma supervisor */}
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:'#F5F3FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'#7C3AED'}}>2</div>
                    Visto bueno del supervisor <span style={{fontSize:11,color:'#A1A1AA',fontWeight:400}}>(opcional)</span>
                  </div>
                  <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${firmaSupervisor?'#7C3AED':'#E4E4E7'}`,background:'#FAFAFA'}}>
                    <canvas ref={canvasSuperRef} width={480} height={100}
                      style={{width:'100%',height:100,cursor:'crosshair',display:'block',touchAction:'none'}}
                      onMouseDown={e=>{setDibujandoSuper(true);const r=canvasSuperRef.current!.getBoundingClientRect();const ctx=canvasSuperRef.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top)}}
                      onMouseMove={e=>{if(!dibujandoSuper) return;const r=canvasSuperRef.current!.getBoundingClientRect();const ctx=canvasSuperRef.current!.getContext('2d')!;ctx.strokeStyle='#7C3AED';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();setFirmaSupervisor(canvasSuperRef.current!.toDataURL())}}
                      onMouseUp={()=>setDibujandoSuper(false)} onMouseLeave={()=>setDibujandoSuper(false)}
                      onTouchStart={e=>{e.preventDefault();setDibujandoSuper(true);const r=canvasSuperRef.current!.getBoundingClientRect();const t=e.touches[0];const ctx=canvasSuperRef.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(t.clientX-r.left,t.clientY-r.top)}}
                      onTouchMove={e=>{e.preventDefault();if(!dibujandoSuper) return;const r=canvasSuperRef.current!.getBoundingClientRect();const t=e.touches[0];const ctx=canvasSuperRef.current!.getContext('2d')!;ctx.strokeStyle='#7C3AED';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(t.clientX-r.left,t.clientY-r.top);ctx.stroke();setFirmaSupervisor(canvasSuperRef.current!.toDataURL())}}
                      onTouchEnd={()=>setDibujandoSuper(false)}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                    {firmaSupervisor?<span style={{fontSize:11,color:'#7C3AED'}}>✓ Firma de supervisor</span>:<span style={{fontSize:11,color:'#A1A1AA'}}>Opcional</span>}
                    <button onClick={()=>{canvasSuperRef.current!.getContext('2d')!.clearRect(0,0,480,100);setFirmaSupervisor('')}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'0.5px solid #E4E4E7',background:'#fff',color:GR,cursor:'pointer'}}>Limpiar</button>
                  </div>
                </div>
              </div>

              <div style={{padding:'16px 24px',borderTop:'0.5px solid #F4F4F5',display:'flex',gap:10}}>
                <button onClick={()=>setFase('revision')} style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,color:GR,cursor:'pointer'}}>
                  Volver
                </button>
                <button onClick={finalizar} disabled={!firma}
                  style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:firma?VE:'#F1F5F9',color:firma?'#fff':'#A1A1AA',fontSize:13,fontWeight:500,cursor:firma?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.2s'}}>
                  <i className="ti ti-check" style={{fontSize:14}}/> Finalizar mantenimiento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINALIZADO */}
        {fase==='finalizado'&&(
          <div style={{width:'100%',maxWidth:560,textAlign:'center'}}>
            <div style={{background:'#fff',borderRadius:16,border:'0.5px solid #E4E4E7',padding:'40px 32px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:VE_BG,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <i className="ti ti-check" style={{fontSize:32,color:VE}}/>
              </div>
              <div style={{fontSize:20,fontWeight:500,color:'#18181B',marginBottom:6}}>Mantenimiento completado</div>
              <div style={{fontSize:13,color:GR,marginBottom:24}}>La orden {orden.id} ha sido finalizada y registrada</div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:24}}>
                {[
                  {l:'Duracion', v:tiempoMin+'min',    c:NA},
                  {l:'Respondidas',v:Object.keys(respuestas).length+'/'+preguntas.length, c:AZ},
                  {l:'Resultado',v:noConformes>0?noConformes+' NC':'Conforme', c:noConformes>0?RO:VE},
                ].map((k,i)=>(
                  <div key={i} style={{padding:'12px',borderRadius:10,background:'#FAFAFA',border:'0.5px solid #E4E4E7'}}>
                    <div style={{fontSize:18,fontWeight:500,color:k.c}}>{k.v}</div>
                    <div style={{fontSize:10,color:'#A1A1AA'}}>{k.l}</div>
                  </div>
                ))}
              </div>

              {firma&&(
                <div style={{padding:'12px',borderRadius:10,background:AZ_BG,border:`0.5px solid ${AZ}30`,marginBottom:16,textAlign:'left'}}>
                  <div style={{fontSize:11,color:'#A1A1AA',marginBottom:6}}>Firma del tecnico</div>
                  <img src={firma} style={{maxHeight:60,borderRadius:6}}/>
                </div>
              )}

              <div style={{display:'flex',gap:10}}>
                <Link href="/ordenes" style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,color:GR,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  Volver al kanban
                </Link>
                <button onClick={()=>window.print()} style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:AZ,color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <i className="ti ti-printer" style={{fontSize:14}}/> Imprimir reporte
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
