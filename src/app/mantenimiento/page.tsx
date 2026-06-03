'use client'
import { useState, useEffect } from 'react'

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const tipoColor: Record<string,{bg:string;text:string}> = {
  preventivo:  {bg:'#F0FDF4',text:'#16A34A'},
  calibracion: {bg:'#FFFBEB',text:'#D97706'},
  correctivo:  {bg:'#FEF2F2',text:'#DC2626'},
}
const tecColor = ['#3B4FE8','#7C3AED','#D97706']

export default function MantenimientoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [seccion, setSeccion] = useState<'cronograma'|'asignacion'>('cronograma')
  const [mesSel, setMesSel] = useState(new Date().getMonth()+1)

  useEffect(()=>{
    fetch('/api/mantenimientos').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }).catch(()=>setLoading(false))
  },[])

  const mesItems = data?.cronogramaMensual?.[mesSel]||[]
  const horasMes = mesItems.reduce((a:number,b:any)=>a+b.horasTotales,0)
  const equiposMes = mesItems.reduce((a:number,b:any)=>a+b.cantidad,0)
  const resumenMes = data?.resumenAnual?.[mesSel-1]

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#fff'}}>

      {/* Sidebar meses */}
      <div style={{width:220,flexShrink:0,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'16px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Mantenimiento</div>
          <div style={{fontSize:14,fontWeight:600,color:'#18181B'}}>2025</div>
        </div>

        {/* Tabs */}
        <div style={{padding:'10px 10px 0',display:'flex',flexDirection:'column',gap:2}}>
          {[{id:'cronograma',icon:'ti-calendar',l:'Cronograma'},{id:'asignacion',icon:'ti-users',l:'Por técnico'}].map(s=>(
            <button key={s.id} onClick={()=>setSeccion(s.id as any)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:6,border:'none',cursor:'pointer',background:seccion===s.id?'#EEF2FF':'transparent',color:seccion===s.id?'#3B4FE8':'#71717A',fontSize:12,fontWeight:seccion===s.id?500:400,textAlign:'left'}}>
              <i className={'ti '+s.icon} style={{fontSize:14}}/>{s.l}
            </button>
          ))}
        </div>

        <div style={{padding:'10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',padding:'4px 8px',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Meses</div>
          {MESES_LARGO.map((mes,i)=>{
            const numMes=i+1
            const r=data?.resumenAnual?.[i]
            const esActual=numMes===new Date().getMonth()+1
            const isSel=mesSel===numMes
            const ocColor=r?.ocupacion>80?'#DC2626':r?.ocupacion>50?'#D97706':'#16A34A'
            return (
              <button key={mes} onClick={()=>setMesSel(numMes)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:6,border:'none',cursor:'pointer',background:isSel?'#EEF2FF':'transparent',marginBottom:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {esActual&&<div style={{width:5,height:5,borderRadius:'50%',background:'#3B4FE8',flexShrink:0}}/>}
                  <span style={{fontSize:12,fontWeight:isSel?500:400,color:isSel?'#3B4FE8':'#52525B'}}>{mes.substring(0,3)}</span>
                </div>
                {r&&<span style={{fontSize:10,fontWeight:500,color:ocColor}}>{r.ocupacion}%</span>}
              </button>
            )
          })}
        </div>

        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7'}}>
          {[{l:'Total equipos',v:data?.stats?.totalEquipos,c:'#18181B'},{l:'Intervenciones/año',v:data?.stats?.totalInterv?.toLocaleString(),c:'#3B4FE8'},{l:'Horas/año',v:data?.stats?.horasTotalesAno?.toLocaleString(),c:'#D97706'}].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <h1 style={{fontSize:16,fontWeight:600,color:'#18181B',margin:0}}>
              {seccion==='cronograma'?`Cronograma — ${MESES_LARGO[mesSel-1]} 2025`:`Asignación por técnico — ${MESES_LARGO[mesSel-1]} 2025`}
            </h1>
            <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>
              {equiposMes} equipos · {horasMes}h · ocupación {resumenMes?.ocupacion||0}%
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>{
              const r=data?.resumenAnual?.[i]
              const c=r?.ocupacion>80?'#DC2626':r?.ocupacion>50?'#D97706':'#16A34A'
              return (
                <button key={m} onClick={()=>setMesSel(i+1)} style={{padding:'3px 6px',borderRadius:4,border:`0.5px solid ${mesSel===i+1?'#3B4FE8':'#E4E4E7'}`,background:mesSel===i+1?'#EEF2FF':'#fff',color:mesSel===i+1?'#3B4FE8':'#71717A',fontSize:10,cursor:'pointer',fontWeight:mesSel===i+1?500:400}}>
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

          {/* CRONOGRAMA */}
          {seccion==='cronograma'&&(
            loading?(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {Array.from({length:5}).map((_,i)=>(
                  <div key={i} style={{height:80,background:'#F8F9FA',borderRadius:10,border:'0.5px solid #E4E4E7'}}/>
                ))}
              </div>
            ):mesItems.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'#A1A1AA'}}>
                <i className="ti ti-calendar-off" style={{fontSize:40,display:'block',marginBottom:12}}/>
                <p style={{fontSize:14,margin:0}}>Sin mantenimientos este mes</p>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {mesItems.sort((a:any,b:any)=>{const o:any={alto:0,medio:1,bajo:2};return o[a.riesgo]-o[b.riesgo]}).map((item:any,i:number)=>{
                  const tc=tipoColor[item.tipo]||tipoColor.preventivo
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'14px 18px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:item.riesgo==='alto'?'#DC2626':item.riesgo==='medio'?'#D97706':'#16A34A',marginTop:6,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                            <span style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{item.nombre}</span>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:tc.bg,color:tc.text,fontWeight:500,textTransform:'capitalize'}}>{item.tipo}</span>
                            <span style={{fontSize:11,color:'#A1A1AA'}}>{item.frecuencia}</span>
                          </div>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            {item.asignaciones?.map((asig:any,j:number)=>(
                              <div key={j} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:6,background:'#F8F9FA',border:'0.5px solid #E4E4E7',fontSize:11}}>
                                <div style={{width:6,height:6,borderRadius:'50%',background:tecColor[j%3]}}/>
                                <span style={{color:'#71717A'}}>{asig.tecnico}:</span>
                                <span style={{fontWeight:500,color:'#18181B'}}>{asig.cantidad} eq.</span>
                                <span style={{color:tecColor[j%3]}}>{asig.horas}h</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:18,fontWeight:600,color:'#18181B'}}>{item.cantidad}</div>
                          <div style={{fontSize:11,color:'#A1A1AA'}}>equipos</div>
                          <div style={{fontSize:13,fontWeight:600,color:'#3B4FE8',marginTop:2}}>{item.horasTotales}h</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* POR TÉCNICO */}
          {seccion==='asignacion'&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
              {(data?.tecnicos||['Biomédico 1','Biomédico 2','Biomédico 3']).map((tec:string,ti:number)=>{
                const tareas=mesItems.flatMap((item:any)=>(item.asignaciones||[]).filter((a:any)=>a.tecnico===tec).map((a:any)=>({...a,nombre:item.nombre,tipo:item.tipo,riesgo:item.riesgo})))
                const totalH=tareas.reduce((a:number,b:any)=>a+b.horas,0)
                const totalE=tareas.reduce((a:number,b:any)=>a+b.cantidad,0)
                const oc=Math.round((totalH/(8*22))*100)
                const tc=tecColor[ti]
                return (
                  <div key={tec} style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                    <div style={{padding:'16px 18px',borderBottom:'0.5px solid #F4F4F5'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                        <div style={{width:38,height:38,borderRadius:'50%',background:tc+'15',border:`1px solid ${tc}30`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <i className="ti ti-user" style={{fontSize:18,color:tc}}/>
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>{tec}</div>
                          <div style={{fontSize:11,color:'#A1A1AA'}}>{MESES_LARGO[mesSel-1]}</div>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                        {[{l:'Equipos',v:totalE,c:tc},{l:'Horas',v:`${totalH}h`,c:'#18181B'},{l:'Carga',v:`${oc}%`,c:oc>80?'#DC2626':oc>50?'#D97706':'#16A34A'}].map(s=>(
                          <div key={s.l} style={{background:'#F8F9FA',borderRadius:8,padding:'8px',textAlign:'center'}}>
                            <div style={{fontSize:18,fontWeight:600,color:s.c}}>{s.v}</div>
                            <div style={{fontSize:10,color:'#A1A1AA'}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{height:4,background:'#F4F4F5',borderRadius:2}}>
                        <div style={{height:4,borderRadius:2,width:`${Math.min(oc,100)}%`,background:tc}}/>
                      </div>
                    </div>
                    <div style={{maxHeight:300,overflowY:'auto'}}>
                      {loading?Array.from({length:3}).map((_,i)=><div key={i} style={{padding:'10px 16px'}}><div style={{height:14,background:'#F4F4F5',borderRadius:3}}/></div>):
                      tareas.length===0?<div style={{padding:'24px',textAlign:'center',fontSize:12,color:'#A1A1AA'}}>Sin asignaciones este mes</div>:
                      tareas.map((t:any,i:number)=>{
                        const tc2=tipoColor[t.tipo]||tipoColor.preventivo
                        return (
                          <div key={i} style={{padding:'10px 16px',borderBottom:'0.5px solid #F8F9FA',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                                <div style={{width:5,height:5,borderRadius:'50%',background:t.riesgo==='alto'?'#DC2626':t.riesgo==='medio'?'#D97706':'#16A34A'}}/>
                                <span style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{t.nombre}</span>
                              </div>
                              <span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:tc2.bg,color:tc2.text}}>{t.tipo}</span>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{t.cantidad} eq.</div>
                              <div style={{fontSize:11,color:tecColor[ti]}}>{t.horas}h</div>
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

        </div>
      </div>
    </div>
  )
}
