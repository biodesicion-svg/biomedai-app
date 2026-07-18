'use client'
import { useState, useEffect } from 'react'

const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'
const TEC_COLORS=['#3B4FE8','#7C3AED','#D97706']

const tipoColor:Record<string,{bg:string,text:string}>={
  preventivo: {bg:VE_BG,text:VE},
  calibracion:{bg:NA_BG,text:NA},
  correctivo: {bg:RO_BG,text:RO},
}
const riesgoColor:Record<string,string>={alto:RO,medio:NA,bajo:VE}

export default function MantenimientoPage(){
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[seccion,setSeccion]=useState<'cronograma'|'tecnico'|'anual'>('cronograma')
  const[mesSel,setMesSel]=useState(new Date().getMonth()+1)
  const[filtroRiesgo,setFiltroRiesgo]=useState('todos')
  const[filtroServicio,setFiltroServicio]=useState('todos')
  const[busqueda,setBusqueda]=useState('')

  useEffect(()=>{
    fetch('/api/mantenimientos').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const mesItems:any[]=data?.cronogramaMensual?.[mesSel]||[]
  const resumenMes=data?.resumenAnual?.[mesSel-1]

  const itemsFiltrados=mesItems.filter((item:any)=>{
    if(filtroRiesgo!=='todos'&&item.riesgo!==filtroRiesgo) return false
    if(filtroServicio!=='todos'&&item.servicio!==filtroServicio) return false
    if(busqueda&&!item.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const servicios=[...new Set(mesItems.map((i:any)=>i.servicio).filter(Boolean))] as string[]
  const horasMes=itemsFiltrados.reduce((a:number,b:any)=>a+b.horasTotales,0)
  const equiposMes=itemsFiltrados.reduce((a:number,b:any)=>a+b.cantidad,0)

  function Sk({h=24,w='100%'}:any){return <div style={{height:h,width:w,background:'#F1F5F9',borderRadius:6}}/>}

  function Card({children,style={}}:any){
    return <div style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:12,...style}}>{children}</div>
  }

  function GaugeOcupacion({pct,color,size=56}:any){
    const r=22,circ=2*Math.PI*r,dash=(pct/100)*circ*0.75
    return(
      <svg width={size} height={size} viewBox="0 0 56 56" role="img" aria-label={`Ocupacion ${pct}%`}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6" strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={`-${circ*0.125}`} strokeLinecap="round"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={`-${circ*0.125}`} strokeLinecap="round"/>
        <text x="28" y="31" textAnchor="middle" fontSize="10" fontWeight="500" fill={color}>{pct}%</text>
      </svg>
    )
  }

  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#fff'}}>

      {/* Sidebar izquierdo */}
      <div style={{width:228,flexShrink:0,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'16px 14px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>SYNAP / Mantenimiento</div>
          <div style={{fontSize:15,fontWeight:500,color:'#18181B'}}>Cronograma 2026</div>
        </div>

        {/* Vistas */}
        <div style={{padding:'10px 10px 6px',display:'flex',flexDirection:'column',gap:2}}>
          {[
            {id:'cronograma',icon:'ti-calendar-stats',l:'Por mes'},
            {id:'tecnico',   icon:'ti-users',         l:'Por tecnico'},
            {id:'anual',     icon:'ti-layout-grid',   l:'Vista anual'},
          ].map(s=>(
            <button key={s.id} onClick={()=>setSeccion(s.id as any)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:7,border:'none',cursor:'pointer',background:seccion===s.id?AZ_BG:'transparent',color:seccion===s.id?AZ:GR,fontSize:12,fontWeight:seccion===s.id?500:400,textAlign:'left',transition:'all 0.15s'}}>
              <i className={'ti '+s.icon} style={{fontSize:14}}/>{s.l}
            </button>
          ))}
        </div>

        {/* Meses */}
        <div style={{padding:'6px 10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',padding:'4px 8px',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Meses</div>
          {MESES_LARGO.map((mes,i)=>{
            const numMes=i+1
            const r=data?.resumenAnual?.[i]
            const esActual=numMes===new Date().getMonth()+1
            const isSel=mesSel===numMes
            const oc=r?.ocupacion||0
            const ocCol=oc>80?RO:oc>50?NA:VE
            return(
              <button key={mes} onClick={()=>setMesSel(numMes)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:7,border:'none',cursor:'pointer',background:isSel?AZ_BG:'transparent',marginBottom:1,transition:'all 0.1s'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {esActual&&<div style={{width:5,height:5,borderRadius:'50%',background:AZ,flexShrink:0}}/>}
                  <span style={{fontSize:12,fontWeight:isSel?500:400,color:isSel?AZ:'#52525B'}}>{mes.substring(0,3)}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {r&&<div style={{width:28,height:4,background:'#F1F5F9',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:4,borderRadius:2,background:ocCol,width:`${Math.min(oc,100)}%`}}/>
                  </div>}
                  {r&&<span style={{fontSize:10,fontWeight:500,color:ocCol,minWidth:24,textAlign:'right'}}>{oc}%</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7',background:'#FAFAFA'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Resumen anual</div>
          {[
            {l:'Total equipos',   v:data?.stats?.totalEquipos,        c:'#18181B'},
            {l:'Intervenciones',  v:data?.stats?.totalInterv?.toLocaleString('es-CO'), c:AZ},
            {l:'Horas totales',   v:data?.stats?.horasTotalesAno?.toLocaleString('es-CO')+'h', c:NA},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:s.c}}>{s.v||'—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#FAFAFA'}}>

        {/* Topbar del contenido */}
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:12}}>
          <div>
            <h1 style={{fontSize:15,fontWeight:500,color:'#18181B',margin:0}}>
              {seccion==='cronograma'?`${MESES_LARGO[mesSel-1]} 2026`:seccion==='tecnico'?`Por tecnico — ${MESES_LARGO[mesSel-1]}`:'Vista anual 2026'}
            </h1>
            <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>
              {seccion!=='anual'&&`${equiposMes} equipos · ${horasMes}h · ocupacion ${resumenMes?.ocupacion||0}%`}
            </div>
          </div>

          {/* Filtros */}
          {seccion==='cronograma'&&(
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{position:'relative'}}>
                <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar equipo..." style={{paddingLeft:28,height:32,fontSize:12,width:160}}/>
              </div>
              <select value={filtroRiesgo} onChange={e=>setFiltroRiesgo(e.target.value)} style={{height:32,fontSize:11,paddingLeft:8,paddingRight:8,borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
                <option value="todos">Todos los riesgos</option>
                <option value="alto">Alto riesgo</option>
                <option value="medio">Riesgo medio</option>
                <option value="bajo">Bajo riesgo</option>
              </select>
              <select value={filtroServicio} onChange={e=>setFiltroServicio(e.target.value)} style={{height:32,fontSize:11,paddingLeft:8,paddingRight:8,borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
                <option value="todos">Todos los servicios</option>
                {servicios.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Mini nav meses */}
          <div style={{display:'flex',gap:3,flexShrink:0}}>
            {MESES_CORTO.map((m,i)=>{
              const r=data?.resumenAnual?.[i]
              const oc=r?.ocupacion||0
              const ocCol=oc>80?RO:oc>50?NA:VE
              const isSel=mesSel===i+1
              return(
                <button key={m} onClick={()=>setMesSel(i+1)} style={{padding:'3px 6px',borderRadius:4,border:`0.5px solid ${isSel?AZ:'#E4E4E7'}`,background:isSel?AZ_BG:'#fff',color:isSel?AZ:GR,fontSize:10,cursor:'pointer',fontWeight:isSel?500:400,transition:'all 0.1s'}}>
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* KPIs del mes */}
        {seccion==='cronograma'&&!loading&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,padding:'14px 20px 0',flexShrink:0}}>
            {[
              {l:'Equipos programados',v:equiposMes,          c:AZ,     icon:'ti-device-heart-monitor'},
              {l:'Horas estimadas',     v:horasMes+'h',        c:NA,     icon:'ti-clock'},
              {l:'Ocupacion',           v:(resumenMes?.ocupacion||0)+'%', c:resumenMes?.ocupacion>80?RO:resumenMes?.ocupacion>50?NA:VE, icon:'ti-chart-bar'},
              {l:'Alto riesgo',         v:itemsFiltrados.filter((i:any)=>i.riesgo==='alto').reduce((a:number,b:any)=>a+b.cantidad,0), c:RO, icon:'ti-alert-triangle'},
              {l:'Calibraciones',       v:itemsFiltrados.filter((i:any)=>i.tipo==='calibracion').reduce((a:number,b:any)=>a+b.cantidad,0), c:'#7C3AED', icon:'ti-ruler-measure'},
            ].map((k,i)=>(
              <div key={i} style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:k.c+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={'ti '+k.icon} style={{fontSize:17,color:k.c}}/>
                </div>
                <div>
                  <div style={{fontSize:18,fontWeight:500,color:k.c,lineHeight:1,marginBottom:2}}>{k.v}</div>
                  <div style={{fontSize:10,color:'#A1A1AA'}}>{k.l}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenido scrollable */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 20px'}}>

          {/* VISTA CRONOGRAMA */}
          {seccion==='cronograma'&&(
            loading?(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {Array.from({length:6}).map((_,i)=><div key={i} style={{height:72,background:'#F8F9FA',borderRadius:10}}/>)}
              </div>
            ):itemsFiltrados.length===0?(
              <div style={{textAlign:'center',padding:'60px',color:'#A1A1AA'}}>
                <i className="ti ti-calendar-off" style={{fontSize:44,display:'block',marginBottom:12,opacity:0.3}}/>
                <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Sin mantenimientos programados</div>
                <div style={{fontSize:12}}>{busqueda||filtroRiesgo!=='todos'||filtroServicio!=='todos'?'Ajusta los filtros para ver mas resultados':'No hay equipos programados para este mes'}</div>
              </div>
            ):(
              <>
                {/* Agrupado por tipo */}
                {['preventivo','calibracion'].map(tipo=>{
                  const grupo=itemsFiltrados.filter((i:any)=>i.tipo===tipo)
                  if(!grupo.length) return null
                  const tc=tipoColor[tipo]
                  return(
                    <div key={tipo} style={{marginBottom:20}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:tc.bg,color:tc.text,textTransform:'capitalize'}}>{tipo}</span>
                        <span style={{fontSize:11,color:'#A1A1AA'}}>{grupo.length} tipos · {grupo.reduce((a:number,b:any)=>a+b.cantidad,0)} equipos · {grupo.reduce((a:number,b:any)=>a+b.horasTotales,0)}h</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {grupo.sort((a:any,b:any)=>{const o:any={alto:0,medio:1,bajo:2};return o[a.riesgo]-o[b.riesgo]}).map((item:any,i:number)=>(
                          <div key={i} style={{background:'#fff',borderRadius:10,border:`0.5px solid ${item.riesgo==='alto'?RO+'40':'#E4E4E7'}`,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}}
                            onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'}}>
                            {/* Indicador riesgo */}
                            <div style={{width:4,height:40,borderRadius:2,background:riesgoColor[item.riesgo]||VE,flexShrink:0}}/>
                            {/* Info principal */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                                <span style={{fontSize:13,fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:260}}>{item.nombre}</span>
                                <span style={{fontSize:10,color:'#A1A1AA',flexShrink:0}}>{item.servicio}</span>
                                <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:riesgoColor[item.riesgo]+'15',color:riesgoColor[item.riesgo],fontWeight:500,flexShrink:0}}>Riesgo {item.riesgo}</span>
                                <span style={{fontSize:10,color:'#A1A1AA',flexShrink:0}}>{item.frecuencia}</span>
                              </div>
                              {/* Asignaciones por tecnico */}
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                {(item.asignaciones||[]).map((asig:any,j:number)=>(
                                  <div key={j} style={{display:'flex',alignItems:'center',gap:5,padding:'3px 8px',borderRadius:6,background:'#F8F9FA',border:'0.5px solid #E4E4E7',fontSize:11}}>
                                    <div style={{width:5,height:5,borderRadius:'50%',background:TEC_COLORS[j%3]}}/>
                                    <span style={{color:GR}}>{asig.tecnico}:</span>
                                    <span style={{fontWeight:500,color:'#18181B'}}>{asig.cantidad} eq</span>
                                    <span style={{color:TEC_COLORS[j%3]}}>{asig.horas}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Metricas */}
                            <div style={{display:'flex',gap:16,flexShrink:0}}>
                              <div style={{textAlign:'center'}}>
                                <div style={{fontSize:20,fontWeight:500,color:'#18181B',lineHeight:1}}>{item.cantidad}</div>
                                <div style={{fontSize:10,color:'#A1A1AA'}}>equipos</div>
                              </div>
                              <div style={{textAlign:'center'}}>
                                <div style={{fontSize:20,fontWeight:500,color:AZ,lineHeight:1}}>{item.horasTotales}h</div>
                                <div style={{fontSize:10,color:'#A1A1AA'}}>horas</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )
          )}

          {/* VISTA POR TECNICO */}
          {seccion==='tecnico'&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
              {(data?.tecnicos||['Biomedico 1','Biomedico 2','Biomedico 3']).map((tec:string,ti:number)=>{
                const tareas=mesItems.flatMap((item:any)=>(item.asignaciones||[]).filter((a:any)=>a.tecnico===tec).map((a:any)=>({...a,nombre:item.nombre,tipo:item.tipo,riesgo:item.riesgo,servicio:item.servicio})))
                const totalH=tareas.reduce((a:number,b:any)=>a+b.horas,0)
                const totalE=tareas.reduce((a:number,b:any)=>a+b.cantidad,0)
                const oc=Math.round((totalH/(8*22))*100)
                const tc=TEC_COLORS[ti]
                const ocCol=oc>80?RO:oc>50?NA:VE
                return(
                  <div key={tec} style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                    {/* Header tecnico */}
                    <div style={{padding:'16px 18px',borderBottom:'0.5px solid #F4F4F5'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:38,height:38,borderRadius:'50%',background:tc+'15',border:`1px solid ${tc}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <i className="ti ti-user" style={{fontSize:18,color:tc}}/>
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{tec}</div>
                            <div style={{fontSize:11,color:'#A1A1AA'}}>{MESES_LARGO[mesSel-1]} 2026</div>
                          </div>
                        </div>
                        <GaugeOcupacion pct={oc} color={oc>100?RO:ocCol}/>
                      </div>
                      {/* KPIs tecnico */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                        {[
                          {l:'Equipos',v:totalE,  c:tc},
                          {l:'Horas',  v:totalH+'h',c:'#18181B'},
                          {l:'Carga',  v:oc+'%',c:oc>100?RO:ocCol},
                        ].map(s=>(
                          <div key={s.l} style={{background:'#F8F9FA',borderRadius:8,padding:'8px',textAlign:'center'}}>
                            <div style={{fontSize:18,fontWeight:500,color:s.c}}>{s.v}</div>
                            <div style={{fontSize:10,color:'#A1A1AA'}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      {/* Barra carga */}
                      <div style={{marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#A1A1AA',marginBottom:3}}>
                          <span>Carga del mes</span>
                          <span style={{color:oc>100?RO:ocCol}}>{totalH}h de {8*22}h disponibles</span>
                        </div>
                        <div style={{height:5,background:'#F1F5F9',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:5,borderRadius:3,background:oc>100?RO:tc,width:`${Math.min(oc,100)}%`,transition:'width 0.8s'}}/>
                        </div>
                        {oc>100&&(
                          <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:6,background:RO_BG,border:`0.5px solid ${RO}30`}}>
                            <i className="ti ti-alert-triangle" style={{fontSize:12,color:RO}}/>
                            <span style={{fontSize:10,color:RO,fontWeight:500}}>Sobrecarga: {totalH-8*22}h por encima de la capacidad ({oc-100}% extra)</span>
                          </div>
                        )}
                      </div>
                      {/* Por tipo */}
                      <div style={{display:'flex',gap:6}}>
                        {['preventivo','calibracion'].map(tipo=>{
                          const n=tareas.filter((t:any)=>t.tipo===tipo).reduce((a:number,b:any)=>a+b.cantidad,0)
                          if(!n) return null
                          const col=tipoColor[tipo]
                          return <span key={tipo} style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:col.bg,color:col.text}}>{tipo}: {n} eq</span>
                        })}
                      </div>
                    </div>
                    {/* Lista tareas */}
                    <div style={{flex:1,overflowY:'auto',maxHeight:320}}>
                      {loading?<div style={{padding:16}}><div style={{height:14,background:'#F4F4F5',borderRadius:3}}/></div>:
                      tareas.length===0?
                        <div style={{padding:'24px',textAlign:'center',fontSize:12,color:'#A1A1AA'}}>Sin asignaciones este mes</div>:
                      tareas.map((t:any,i:number)=>{
                        const tc2=tipoColor[t.tipo]||tipoColor.preventivo
                        return(
                          <div key={i} style={{padding:'10px 16px',borderBottom:'0.5px solid #F8F9FA',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                                <div style={{width:5,height:5,borderRadius:'50%',background:riesgoColor[t.riesgo]||VE,flexShrink:0}}/>
                                <span style={{fontSize:12,fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{t.nombre}</span>
                              </div>
                              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                                <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:tc2.bg,color:tc2.text}}>{t.tipo}</span>
                                {t.servicio&&<span style={{fontSize:10,color:'#A1A1AA'}}>{t.servicio}</span>}
                              </div>
                            </div>
                            <div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{t.cantidad} eq</div>
                              <div style={{fontSize:11,color:TEC_COLORS[ti]}}>{t.horas}h</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VISTA ANUAL */}
          {seccion==='anual'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Heatmap anual */}
              <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px 20px'}}>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:4}}>Ocupacion por mes — 2026</div>
                <div style={{fontSize:11,color:'#A1A1AA',marginBottom:16}}>Porcentaje de carga del equipo tecnico</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:8}}>
                  {MESES_CORTO.map((m,i)=>{
                    const r=data?.resumenAnual?.[i]
                    const oc=r?.ocupacion||0
                    const ocCol=oc>80?RO:oc>50?NA:VE
                    const esActual=i+1===new Date().getMonth()+1
                    return(
                      <button key={m} onClick={()=>{setMesSel(i+1);setSeccion('cronograma')}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'12px 8px',borderRadius:10,border:`0.5px solid ${esActual?AZ:oc>80?RO+'40':'#E4E4E7'}`,background:esActual?AZ_BG:'#FAFAFA',cursor:'pointer',transition:'all 0.15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=AZ;e.currentTarget.style.background=AZ_BG}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=esActual?AZ:oc>80?RO+'40':'#E4E4E7';e.currentTarget.style.background=esActual?AZ_BG:'#FAFAFA'}}>
                        <span style={{fontSize:12,fontWeight:500,color:esActual?AZ:'#52525B'}}>{m}</span>
                        <div style={{width:'100%',height:40,background:'#F1F5F9',borderRadius:6,overflow:'hidden',display:'flex',alignItems:'flex-end'}}>
                          <div style={{width:'100%',background:ocCol,height:`${oc}%`,borderRadius:6,transition:'height 0.8s'}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,color:ocCol}}>{oc}%</span>
                        <span style={{fontSize:10,color:'#A1A1AA'}}>{r?.totalEquipos||0} eq</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tabla resumen anual */}
              <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'0.5px solid #E4E4E7',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>Resumen anual por mes</div>
                  <div style={{fontSize:11,color:'#A1A1AA'}}>Haz clic en un mes para ver el detalle</div>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F8F9FA'}}>
                      {['Mes','Equipos','Horas totales','Preventivos','Calibraciones','Ocupacion','Accion'].map(h=>(
                        <th key={h} style={{padding:'9px 14px',fontSize:10,fontWeight:500,color:GR,textAlign:'left',borderBottom:'0.5px solid #E4E4E7',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MESES_LARGO.map((mes,i)=>{
                      const r=data?.resumenAnual?.[i]
                      const oc=r?.ocupacion||0
                      const ocCol=oc>80?RO:oc>50?NA:VE
                      const esActual=i+1===new Date().getMonth()+1
                      return(
                        <tr key={mes} style={{borderBottom:'0.5px solid #F4F4F5',background:esActual?AZ_BG:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}} onClick={()=>{setMesSel(i+1);setSeccion('cronograma')}}>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:esActual?500:400,color:esActual?AZ:'#18181B'}}>
                            {esActual&&<span style={{width:6,height:6,borderRadius:'50%',background:AZ,display:'inline-block',marginRight:6}}/>}
                            {mes}
                          </td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'#18181B'}}>{r?.totalEquipos||0}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'#52525B'}}>{r?.horasTotales||0}h</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:VE}}>{r?.preventivos||0}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:NA}}>{r?.calibraciones||0}</td>
                          <td style={{padding:'9px 14px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:50,height:5,background:'#F1F5F9',borderRadius:3,overflow:'hidden'}}>
                                <div style={{height:5,borderRadius:3,background:ocCol,width:`${oc}%`}}/>
                              </div>
                              <span style={{fontSize:11,fontWeight:600,color:ocCol}}>{oc}%</span>
                            </div>
                          </td>
                          <td style={{padding:'9px 14px'}}>
                            <span style={{fontSize:10,color:AZ,fontWeight:500}}>Ver detalle →</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
