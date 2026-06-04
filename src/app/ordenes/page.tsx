'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const MESES_LARGO=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'
const TEC_COLORS=['#3B4FE8','#7C3AED','#D97706']

const TIPO_COLOR:Record<string,{bg:string,text:string}>={
  preventivo: {bg:VE_BG,text:VE},
  calibracion:{bg:NA_BG,text:NA},
  correctivo: {bg:RO_BG,text:RO},
}
const PRIO_COLOR:Record<string,{bg:string,text:string}>={
  alta: {bg:RO_BG,text:RO},
  media:{bg:NA_BG,text:NA},
  baja: {bg:VE_BG,text:VE},
}
const COLS=[
  {id:'pendiente',  label:'Pendiente',  dot:'#94A3B8',bg:'#F8F9FA'},
  {id:'en_proceso', label:'En proceso', dot:NA,       bg:'#FFFBEB'},
  {id:'en_revision',label:'En revision',dot:'#7C3AED',bg:'#F5F3FF'},
  {id:'completado', label:'Completado', dot:VE,       bg:VE_BG},
]

export default function OrdenesPage(){
  const router=useRouter()
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[mesSel,setMesSel]=useState(new Date().getMonth()+1)
  const[ordenes,setOrdenes]=useState<any[]>([])
  const[tecFiltro,setTecFiltro]=useState('todos')
  const[tipFiltro,setTipFiltro]=useState('todos')
  const[priFilter,setPriFilter]=useState('todos')
  const[busqueda,setBusqueda]=useState('')
  const[selOT,setSelOT]=useState<any>(null)
  const[showCrear,setShowCrear]=useState(false)
  const[nuevaOT,setNuevaOT]=useState({equipo:'',tipo:'correctivo',tecnico:'',prioridad:'alta',descripcion:''})

  useEffect(()=>{
    fetch('/api/mantenimientos').then(r=>r.json()).then(d=>{
      setData(d)
      setOrdenes(genOrdenes(d,new Date().getMonth()+1))
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[])

  function genOrdenes(d:any,mes:number){
    const items=d?.cronogramaMensual?.[mes]||[]
    let c=1
    return items.flatMap((item:any)=>(item.asignaciones||[]).map((asig:any)=>({
      id:`OT-${String(mes).padStart(2,'0')}-${String(c++).padStart(3,'0')}`,
      equipo:item.nombre, tipo:item.tipo, tecnico:asig.tecnico,
      cantidad:asig.cantidad, horas:asig.horas, columna:'pendiente',
      prioridad:item.riesgo==='alto'?'alta':item.riesgo==='medio'?'media':'baja',
      riesgo:item.riesgo, progreso:0, servicio:item.servicio||'',
      descripcion:'Mantenimiento programado segun cronograma anual 2025',
      fechaProg:`2025-${String(mes).padStart(2,'0')}-${String(Math.floor(Math.random()*20)+1).padStart(2,'0')}`,
    }))).sort((a:any,b:any)=>({alta:0,media:1,baja:2}[a.prioridad as string]-{alta:0,media:1,baja:2}[b.prioridad as string]))
  }

  function cambiarMes(mes:number){
    setMesSel(mes)
    if(data) setOrdenes(genOrdenes(data,mes))
  }

  function mover(id:string,col:string){
    setOrdenes(p=>p.map(o=>o.id===id?{...o,columna:col,progreso:col==='completado'?100:col==='en_revision'?75:col==='en_proceso'?35:0}:o))
    if(selOT?.id===id) setSelOT((p:any)=>({...p,columna:col}))
  }

  function crearOT(){
    if(!nuevaOT.equipo||!nuevaOT.tecnico) return
    const id=`OT-${String(mesSel).padStart(2,'0')}-${String(ordenes.length+1).padStart(3,'0')}`
    const ot={...nuevaOT,id,columna:'pendiente',progreso:0,cantidad:1,horas:4,riesgo:nuevaOT.prioridad==='alta'?'alto':'medio',servicio:'',fechaProg:`2025-${String(mesSel).padStart(2,'0')}-01`}
    setOrdenes(p=>[ot,...p])
    setShowCrear(false)
    setNuevaOT({equipo:'',tipo:'correctivo',tecnico:'',prioridad:'alta',descripcion:''})
  }

  const tecnicos=data?.tecnicos||['Biomedico 1','Biomedico 2','Biomedico 3']

  const filtradas=ordenes.filter(o=>{
    if(tecFiltro!=='todos'&&o.tecnico!==tecFiltro) return false
    if(tipFiltro!=='todos'&&o.tipo!==tipFiltro) return false
    if(priFilter!=='todos'&&o.prioridad!==priFilter) return false
    if(busqueda&&!o.equipo.toLowerCase().includes(busqueda.toLowerCase())&&!o.id.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const stats={
    total:ordenes.length,
    completadas:ordenes.filter(o=>o.columna==='completado').length,
    enProceso:ordenes.filter(o=>o.columna==='en_proceso').length,
    pendientes:ordenes.filter(o=>o.columna==='pendiente').length,
    alta:ordenes.filter(o=>o.prioridad==='alta').length,
    horas:ordenes.reduce((a:number,b:any)=>a+b.horas,0),
  }

  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#fff'}}>

      {/* Sidebar meses */}
      <div style={{width:220,flexShrink:0,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'16px 14px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>SYNAP / Ordenes de trabajo</div>
          <div style={{fontSize:15,fontWeight:500,color:'#18181B'}}>Kanban 2025</div>
        </div>

        {/* Boton crear OT */}
        <div style={{padding:'10px'}}>
          <button onClick={()=>setShowCrear(true)} style={{width:'100%',padding:'8px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className="ti ti-plus" style={{fontSize:14}}/> Nueva OT correctiva
          </button>
        </div>

        {/* Meses */}
        <div style={{flex:1,overflowY:'auto',padding:'4px 10px'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',padding:'4px 8px',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Meses</div>
          {MESES_LARGO.map((mes,i)=>{
            const numMes=i+1
            const esActual=numMes===new Date().getMonth()+1
            const isSel=mesSel===numMes
            const r=data?.resumenAnual?.[i]
            const oc=r?.ocupacion||0
            const ocCol=oc>80?RO:oc>50?NA:VE
            return(
              <button key={mes} onClick={()=>cambiarMes(numMes)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:7,border:'none',cursor:'pointer',background:isSel?AZ_BG:'transparent',marginBottom:1,transition:'all 0.1s'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {esActual&&<div style={{width:5,height:5,borderRadius:'50%',background:AZ,flexShrink:0}}/>}
                  <span style={{fontSize:12,fontWeight:isSel?500:400,color:isSel?AZ:'#52525B'}}>{mes.substring(0,3)}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:24,height:4,background:'#F1F5F9',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:4,borderRadius:2,background:ocCol,width:`${Math.min(oc,100)}%`}}/>
                  </div>
                  <span style={{fontSize:10,color:ocCol,fontWeight:500,minWidth:22,textAlign:'right'}}>{oc}%</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7',background:'#FAFAFA'}}>
          {[
            {l:'Total OTs',    v:stats.total,       c:'#18181B'},
            {l:'Completadas',  v:stats.completadas, c:VE},
            {l:'Alta prioridad',v:stats.alta,       c:RO},
            {l:'Horas totales',v:stats.horas+'h',   c:NA},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main kanban */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#FAFAFA'}}>

        {/* Topbar */}
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexShrink:0}}>
          <div>
            <h1 style={{fontSize:15,fontWeight:500,color:'#18181B',margin:0}}>Ordenes de trabajo — {MESES_LARGO[mesSel-1]} 2025</h1>
            <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>{stats.total} ordenes · {stats.completadas} completadas · {stats.horas}h estimadas</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {/* Buscar */}
            <div style={{position:'relative'}}>
              <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
              <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar OT o equipo..." style={{paddingLeft:28,height:32,fontSize:11,width:180}}/>
            </div>
            {/* Filtros */}
            <select value={tecFiltro} onChange={e=>setTecFiltro(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todos">Todos los tecnicos</option>
              {tecnicos.map((t:string)=><option key={t} value={t}>{t}</option>)}
            </select>
            <select value={tipFiltro} onChange={e=>setTipFiltro(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todos">Todos los tipos</option>
              <option value="preventivo">Preventivo</option>
              <option value="calibracion">Calibracion</option>
              <option value="correctivo">Correctivo</option>
            </select>
            <select value={priFilter} onChange={e=>setPriFilter(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todos">Todas las prioridades</option>
              <option value="alta">Alta prioridad</option>
              <option value="media">Media prioridad</option>
              <option value="baja">Baja prioridad</option>
            </select>
            {/* Mini nav meses */}
            <div style={{display:'flex',gap:2}}>
              {MESES_CORTO.map((m,i)=>(
                <button key={m} onClick={()=>cambiarMes(i+1)} style={{padding:'3px 5px',borderRadius:4,border:`0.5px solid ${mesSel===i+1?AZ:'#E4E4E7'}`,background:mesSel===i+1?AZ_BG:'#fff',color:mesSel===i+1?AZ:GR,fontSize:9,cursor:'pointer',fontWeight:mesSel===i+1?500:400}}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:'12px 20px 0',flexShrink:0}}>
          {COLS.map(col=>{
            const n=filtradas.filter(o=>o.columna===col.id).length
            const pct=filtradas.length>0?Math.round((n/filtradas.length)*100):0
            return(
              <div key={col.id} style={{background:'#fff',border:`0.5px solid ${col.dot}30`,borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.dot,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:GR,marginBottom:2}}>{col.label}</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                    <span style={{fontSize:22,fontWeight:500,color:col.dot,lineHeight:1}}>{n}</span>
                    <span style={{fontSize:10,color:'#A1A1AA'}}>{pct}%</span>
                  </div>
                </div>
                <div style={{width:36,height:36}}>
                  <svg viewBox="0 0 36 36" role="img" aria-label={`${col.label} ${pct}%`}>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4"/>
                    <circle cx="18" cy="18" r="14" fill="none" stroke={col.dot} strokeWidth="4"
                      strokeDasharray={`${(pct/100)*88} 88`} strokeDashoffset="22" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        {/* Kanban */}
        <div style={{flex:1,overflowX:'auto',overflowY:'hidden',padding:'12px 20px 16px'}}>
          {loading?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,height:'100%'}}>
              {Array.from({length:4}).map((_,i)=><div key={i} style={{background:'#F8F9FA',borderRadius:12,border:'0.5px solid #E4E4E7'}}/>)}
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,minWidth:900,height:'100%'}}>
              {COLS.map((col,ci)=>{
                const colOrd=filtradas.filter(o=>o.columna===col.id)
                const antCol=ci>0?COLS[ci-1]:null
                const sigCol=ci<COLS.length-1?COLS[ci+1]:null
                return(
                  <div key={col.id} style={{display:'flex',flexDirection:'column',background:col.bg,borderRadius:12,border:`0.5px solid ${col.dot}30`,overflow:'hidden',minHeight:400}}>
                    {/* Header columna */}
                    <div style={{padding:'12px 14px',borderBottom:`0.5px solid ${col.dot}20`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:col.dot}}/>
                        <span style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{col.label}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:11,fontWeight:600,color:col.dot}}>{colOrd.length}</span>
                        {colOrd.filter(o=>o.prioridad==='alta').length>0&&(
                          <span style={{fontSize:10,padding:'1px 5px',borderRadius:20,background:RO_BG,color:RO,fontWeight:500}}>
                            {colOrd.filter(o=>o.prioridad==='alta').length} urgentes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cards */}
                    <div style={{flex:1,overflowY:'auto',padding:'10px 10px 10px'}}>
                      {colOrd.length===0?(
                        <div style={{textAlign:'center',padding:'32px 16px',color:'#A1A1AA'}}>
                          <i className="ti ti-inbox" style={{fontSize:24,display:'block',marginBottom:6,opacity:0.3}}/>
                          <div style={{fontSize:11}}>Sin ordenes</div>
                        </div>
                      ):colOrd.map((o:any)=>{
                        const tc=TIPO_COLOR[o.tipo]||TIPO_COLOR.preventivo
                        const pc=PRIO_COLOR[o.prioridad]||PRIO_COLOR.baja
                        const tecIdx=tecnicos.indexOf(o.tecnico)
                        const tecC=TEC_COLORS[tecIdx>=0?tecIdx%3:0]
                        return(
                          <div key={o.id}
                            onClick={()=>{sessionStorage.setItem(`orden-${o.id}`,JSON.stringify(o));router.push(`/ordenes/${o.id}`)}}
                            style={{background:'#fff',borderRadius:10,border:`0.5px solid ${o.prioridad==='alta'?RO+'40':'#E4E4E7'}`,padding:'12px',marginBottom:8,cursor:'pointer',transition:'all 0.15s',position:'relative'}}
                            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-1px)'}}
                            onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}>

                            {/* Prioridad alta — franja */}
                            {o.prioridad==='alta'&&<div style={{position:'absolute',top:0,left:0,width:3,height:'100%',background:RO,borderRadius:'10px 0 0 10px'}}/>}

                            <div style={{paddingLeft:o.prioridad==='alta'?6:0}}>
                              {/* Header card */}
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                                <span style={{fontSize:10,fontFamily:'monospace',color:'#A1A1AA'}}>{o.id}</span>
                                <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:pc.bg,color:pc.text,fontWeight:500}}>{o.prioridad}</span>
                              </div>

                              {/* Equipo */}
                              <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:6,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{o.equipo}</div>

                              {/* Tags */}
                              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                                <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:tc.bg,color:tc.text}}>{o.tipo}</span>
                                {o.servicio&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#F4F4F5',color:GR}}>{o.servicio.length>12?o.servicio.substring(0,12)+'…':o.servicio}</span>}
                              </div>

                              {/* Footer */}
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:8,borderTop:'0.5px solid #F4F4F5'}}>
                                <div style={{display:'flex',alignItems:'center',gap:5}}>
                                  <div style={{width:20,height:20,borderRadius:'50%',background:tecC+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:tecC}}>
                                    {o.tecnico?.split(' ').pop()?.charAt(0)||'T'}
                                  </div>
                                  <span style={{fontSize:10,color:GR}}>{o.tecnico?.replace('Biomédico ','B')?.replace('Biomedico ','B')}</span>
                                </div>
                                <div style={{display:'flex',gap:8,fontSize:10,color:'#A1A1AA'}}>
                                  <span><i className="ti ti-device-heart-monitor" style={{fontSize:10}}/> {o.cantidad}</span>
                                  <span><i className="ti ti-clock" style={{fontSize:10}}/> {o.horas}h</span>
                                </div>
                              </div>

                              {/* Barra progreso */}
                              {o.progreso>0&&(
                                <div style={{marginTop:8}}>
                                  <div style={{height:3,background:'#F4F4F5',borderRadius:2,overflow:'hidden'}}>
                                    <div style={{height:3,borderRadius:2,background:col.dot,width:`${o.progreso}%`}}/>
                                  </div>
                                </div>
                              )}

                              {/* Botones mover */}
                              <div style={{display:'flex',gap:4,marginTop:8}} onClick={e=>e.stopPropagation()}>
                                {antCol&&(
                                  <button onClick={()=>mover(o.id,antCol.id)} style={{flex:1,padding:'4px',borderRadius:5,border:'0.5px solid #E4E4E7',background:'#fff',color:GR,fontSize:10,cursor:'pointer',transition:'all 0.1s'}}
                                    onMouseEnter={e=>{e.currentTarget.style.background='#F8F9FA'}}
                                    onMouseLeave={e=>{e.currentTarget.style.background='#fff'}}>
                                    ← Atras
                                  </button>
                                )}
                                {sigCol&&(
                                  <button onClick={()=>mover(o.id,sigCol.id)} style={{flex:1,padding:'4px',borderRadius:5,border:'none',background:col.dot+'20',color:col.dot,fontSize:10,fontWeight:500,cursor:'pointer',transition:'all 0.1s'}}
                                    onMouseEnter={e=>{e.currentTarget.style.opacity='0.8'}}
                                    onMouseLeave={e=>{e.currentTarget.style.opacity='1'}}>
                                    {sigCol.label} →
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Footer columna */}
                    <div style={{padding:'8px 14px',borderTop:`0.5px solid ${col.dot}20`,background:'rgba(255,255,255,0.5)',flexShrink:0,fontSize:10,color:GR}}>
                      {colOrd.reduce((a:number,b:any)=>a+b.horas,0)}h · {colOrd.reduce((a:number,b:any)=>a+b.cantidad,0)} equipos
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal crear OT */}
      {showCrear&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setShowCrear(false)}>
          <div style={{background:'#fff',borderRadius:14,padding:'24px',width:480,boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:15,fontWeight:500,color:'#18181B',marginBottom:2}}>Nueva orden de trabajo</div>
                <div style={{fontSize:11,color:'#A1A1AA'}}>OT correctiva — {MESES_LARGO[mesSel-1]} 2025</div>
              </div>
              <button onClick={()=>setShowCrear(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:20}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {label:'Equipo *',key:'equipo',placeholder:'Nombre del equipo',type:'text'},
                {label:'Descripcion',key:'descripcion',placeholder:'Describe el problema o trabajo a realizar',type:'text'},
              ].map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:4}}>{f.label}</div>
                  <input value={(nuevaOT as any)[f.key]} onChange={e=>setNuevaOT(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{width:'100%',height:36,fontSize:13}}/>
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:4}}>Tipo</div>
                  <select value={nuevaOT.tipo} onChange={e=>setNuevaOT(p=>({...p,tipo:e.target.value}))} style={{width:'100%',height:36,fontSize:12,borderRadius:7,border:'0.5px solid #E4E4E7',padding:'0 8px'}}>
                    <option value="correctivo">Correctivo</option>
                    <option value="preventivo">Preventivo</option>
                    <option value="calibracion">Calibracion</option>
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:4}}>Tecnico *</div>
                  <select value={nuevaOT.tecnico} onChange={e=>setNuevaOT(p=>({...p,tecnico:e.target.value}))} style={{width:'100%',height:36,fontSize:12,borderRadius:7,border:'0.5px solid #E4E4E7',padding:'0 8px'}}>
                    <option value="">Seleccionar</option>
                    {tecnicos.map((t:string)=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:4}}>Prioridad</div>
                  <select value={nuevaOT.prioridad} onChange={e=>setNuevaOT(p=>({...p,prioridad:e.target.value}))} style={{width:'100%',height:36,fontSize:12,borderRadius:7,border:'0.5px solid #E4E4E7',padding:'0 8px'}}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={()=>setShowCrear(false)} style={{flex:1,padding:'10px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={crearOT} disabled={!nuevaOT.equipo||!nuevaOT.tecnico} style={{flex:2,padding:'10px',borderRadius:8,border:'none',background:!nuevaOT.equipo||!nuevaOT.tecnico?'#F4F4F5':AZ,color:!nuevaOT.equipo||!nuevaOT.tecnico?'#A1A1AA':'#fff',fontSize:13,fontWeight:500,cursor:!nuevaOT.equipo||!nuevaOT.tecnico?'default':'pointer'}}>
                Crear orden de trabajo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
