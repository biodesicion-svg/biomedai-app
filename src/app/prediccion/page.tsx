'use client'
import { useState, useEffect } from 'react'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const alertaStyle: Record<string,{bg:string;text:string;border:string;label:string}> = {
  critico: {bg:'#FEF2F2',text:'#DC2626',border:'#FECACA',label:'Crítico'},
  alto:    {bg:'#FFFBEB',text:'#D97706',border:'#FDE68A',label:'Alto'},
  medio:   {bg:'#EEF2FF',text:'#3B4FE8',border:'#C7D2FE',label:'Medio'},
  bajo:    {bg:'#F0FDF4',text:'#16A34A',border:'#BBF7D0',label:'Bajo'},
}

function BarChart({ actual, prediccion, labels, height=130 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:3,height}}>
        {labels.map((l:string,i:number)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <div style={{width:'100%',display:'flex',alignItems:'flex-end',gap:1,height:height-16}}>
              <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'#EF4444',opacity:0.8,height:`${(actual[i]/max)*100}%`,minHeight:actual[i]>0?3:0}}/>
              <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'#3B4FE8',opacity:0.6,height:`${(prediccion[i]/max)*100}%`,minHeight:prediccion[i]>0?3:0}}/>
            </div>
            <div style={{fontSize:9,color:'#A1A1AA'}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:12,marginTop:8}}>
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#71717A'}}><div style={{width:10,height:10,borderRadius:2,background:'#EF4444',opacity:0.8}}/> 2025 actual</div>
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#71717A'}}><div style={{width:10,height:10,borderRadius:2,background:'#3B4FE8',opacity:0.6}}/> 2026 predicción</div>
      </div>
    </div>
  )
}

function LineChart({ actual, prediccion, labels, height=130 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  const w=560, h=height, px=24, py=12
  const path = (d:number[]) => d.map((v,i)=>`${i===0?'M':'L'} ${px+(i/(d.length-1))*(w-px*2)} ${py+((max-v)/max)*(h-py*2)}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height}}>
        {[0,25,50,75,100].map(p=>{
          const y=py+((100-p)/100)*(h-py*2)
          return <g key={p}><line x1={px} y1={y} x2={w-px} y2={y} stroke="#F4F4F5" strokeWidth={1}/><text x={px-3} y={y+3} fontSize={8} fill="#D4D4D8" textAnchor="end">{Math.round((p/100)*max)}</text></g>
        })}
        <path d={`${path(prediccion)} L ${px+((prediccion.length-1)/(prediccion.length-1))*(w-px*2)} ${h-py} L ${px} ${h-py} Z`} fill="#3B4FE808"/>
        <path d={path(prediccion)} fill="none" stroke="#3B4FE8" strokeWidth={2} strokeDasharray="5,3" strokeLinecap="round"/>
        <path d={path(actual)} fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round"/>
        {actual.map((v:number,i:number)=>{ const x=px+(i/(actual.length-1))*(w-px*2),y=py+((max-v)/max)*(h-py*2); return <circle key={i} cx={x} cy={y} r={3} fill="#EF4444" stroke="#fff" strokeWidth={1.5}/> })}
        {prediccion.map((v:number,i:number)=>{ const x=px+(i/(prediccion.length-1))*(w-px*2),y=py+((max-v)/max)*(h-py*2); return <circle key={i} cx={x} cy={y} r={3} fill="#3B4FE8" stroke="#fff" strokeWidth={1.5}/> })}
        {labels.map((l:string,i:number)=>{ const x=px+(i/(labels.length-1))*(w-px*2); return <text key={i} x={x} y={h-1} fontSize={8} fill="#A1A1AA" textAnchor="middle">{l}</text> })}
      </svg>
      <div style={{display:'flex',gap:12,marginTop:6}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#71717A'}}><div style={{width:14,height:2,background:'#EF4444',borderRadius:1}}/> Fallas 2025</div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#71717A'}}><div style={{width:14,height:2,background:'#3B4FE8',borderRadius:1,borderTop:'2px dashed #3B4FE8'}}/> Predicción 2026</div>
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score:number }) {
  const color = score>=70?'#DC2626':score>=45?'#D97706':score>=25?'#3B4FE8':'#16A34A'
  const r=36, c=2*Math.PI*r, d=(score/100)*c
  return (
    <div style={{position:'relative',width:90,height:90,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width={90} height={90} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#F4F4F5" strokeWidth={8}/>
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${d} ${c-d}`} strokeLinecap="round"/>
      </svg>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:700,color,lineHeight:1}}>{score}</div>
        <div style={{fontSize:8,color:'#A1A1AA',textTransform:'uppercase',letterSpacing:'0.05em'}}>riesgo</div>
      </div>
    </div>
  )
}

export default function PrediccionPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'general'|'equipos'|'servicios'|'repuestos'>('general')
  const [search, setSearch] = useState('')
  const [eqSel, setEqSel] = useState<any>(null)
  const [svcAbiertos, setSvcAbiertos] = useState<Record<string,boolean>>({})

  useEffect(()=>{ fetch('/api/prediccion').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }).catch(()=>setLoading(false)) },[])

  const corrActual = data?.tendencia?.correctivos||Array(12).fill(0)
  const corrPred   = corrActual.map((v:number)=>Math.round(v*1.18+1))
  const totalCA    = corrActual.reduce((a:number,b:number)=>a+b,0)
  const totalCP    = corrPred.reduce((a:number,b:number)=>a+b,0)

  const eqFiltrados = (data?.equipoRiesgo||[]).filter((e:any)=>!search||e.nombre.toLowerCase().includes(search.toLowerCase())||e.servicio?.toLowerCase().includes(search.toLowerCase()))
  const porServicio: Record<string,any[]> = {}
  eqFiltrados.forEach((e:any)=>{ const s=e.servicio||'Sin servicio'; if(!porServicio[s]) porServicio[s]=[]; porServicio[s].push(e) })
  const svcOrdenados = Object.entries(porServicio).sort(([,a],[,b])=>Math.max(...b.map((e:any)=>e.score))-Math.max(...a.map((e:any)=>e.score)))

  const Sk = ({h=20,w='100%'}:any) => <div style={{height:h,width:w,background:'#F4F4F5',borderRadius:4}}/>

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Predicción</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>Análisis predictivo de fallas</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:'#EEF2FF',padding:'6px 12px',borderRadius:6,border:'0.5px solid #C7D2FE'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#3B4FE8'}}/>
          <span style={{fontSize:11,color:'#3B4FE8',fontWeight:500}}>Modelo estadístico activo</span>
        </div>
      </div>

      <div style={{display:'flex',gap:1,padding:'0 28px',borderBottom:'0.5px solid #E4E4E7',background:'#fff'}}>
        {[{id:'general',l:'Vista general'},{id:'equipos',l:'Por equipo'},{id:'servicios',l:'Por servicio'},{id:'repuestos',l:'Repuestos críticos'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:'10px 16px',border:'none',borderBottom:`2px solid ${tab===t.id?'#3B4FE8':'transparent'}`,background:'transparent',color:tab===t.id?'#3B4FE8':'#71717A',fontSize:13,fontWeight:tab===t.id?500:400,cursor:'pointer'}}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:'24px 28px',overflowY:'auto'}}>

        {tab==='general'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:1100}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
              {loading?Array.from({length:6}).map((_,i)=><div key={i} style={{height:90,background:'#F8F9FA',borderRadius:10,border:'0.5px solid #E4E4E7'}}/>):[
                {l:'Score riesgo global',    v:data?.kpis?.scoreGlobal,    u:'/100', c:data?.kpis?.scoreGlobal>=70?'#DC2626':data?.kpis?.scoreGlobal>=45?'#D97706':'#16A34A', sub:'Promedio del parque'},
                {l:'Equipos críticos',       v:data?.kpis?.criticos,       u:'',     c:'#DC2626', sub:'Requieren intervención urgente'},
                {l:'Fallas esperadas 30d',   v:data?.kpis?.fallaEsperada30,u:'',     c:'#D97706', sub:'Basado en tendencia histórica'},
                {l:'Fallas esperadas 90d',   v:data?.kpis?.fallaEsperada90,u:'',     c:'#D97706', sub:'Proyección trimestral'},
                {l:'Incremento correctivos', v:`+${Math.round(((totalCP-totalCA)/Math.max(totalCA,1))*100)}%`,u:'', c:'#DC2626', sub:`${totalCA} → ${totalCP} anuales`},
                {l:'Equipos analizados',     v:data?.kpis?.totalEquipos,   u:'',     c:'#3B4FE8', sub:'Con modelo predictivo activo'},
              ].map((k:any)=>(
                <div key={k.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'18px 20px'}}>
                  <div style={{fontSize:12,color:'#71717A',marginBottom:8}}>{k.l}</div>
                  <div style={{fontSize:26,fontWeight:600,color:k.c,marginBottom:4}}>{k.v}<span style={{fontSize:13,marginLeft:2,opacity:0.7}}>{k.u}</span></div>
                  <div style={{fontSize:11,color:'#A1A1AA'}}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:4}}>Comparativa: Fallas 2025 vs Predicción 2026</div>
                  <div style={{fontSize:11,color:'#A1A1AA'}}>Proyección mensual sin intervención preventiva</div>
                </div>
                <div style={{display:'flex',gap:16,fontSize:12}}>
                  <div style={{textAlign:'right'}}><div style={{fontWeight:600,color:'#EF4444'}}>{totalCA}</div><div style={{color:'#A1A1AA'}}>Correctivos 2025</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontWeight:600,color:'#3B4FE8'}}>{totalCP}</div><div style={{color:'#A1A1AA'}}>Predicción 2026</div></div>
                </div>
              </div>
              {loading?<Sk h={130}/>:<LineChart actual={corrActual} prediccion={corrPred} labels={MESES} height={130}/>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'20px'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:4}}>Correctivos por mes — Actual vs Predicción</div>
                <div style={{fontSize:11,color:'#A1A1AA',marginBottom:16}}>Rojo = 2025 · Azul = 2026</div>
                {loading?<Sk h={130}/>:<BarChart actual={corrActual} prediccion={corrPred} labels={MESES} height={130}/>}
              </div>
              <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'20px'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#18181B',marginBottom:4}}>Impacto del mantenimiento preventivo</div>
                <div style={{fontSize:11,color:'#A1A1AA',marginBottom:16}}>Reducción estimada de correctivos en 2026</div>
                {loading?<Sk h={130}/>:(
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[{l:'Sin plan preventivo',pct:100,c:'#DC2626'},{l:'Preventivo básico (50%)',pct:65,c:'#D97706'},{l:'Preventivo completo (80%+)',pct:35,c:'#16A34A'}].map(s=>(
                      <div key={s.l}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
                          <span style={{color:'#52525B'}}>{s.l}</span>
                          <span style={{fontWeight:500,color:s.c}}>{Math.round(totalCP*(s.pct/100))} fallas</span>
                        </div>
                        <div style={{height:16,background:'#F4F4F5',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:16,width:`${s.pct}%`,background:s.c,borderRadius:4,display:'flex',alignItems:'center',paddingLeft:6}}>
                            <span style={{fontSize:10,fontWeight:600,color:'#fff'}}>{s.pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{padding:'10px 12px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE',fontSize:12,color:'#3B4FE8',marginTop:4}}>
                      💡 Plan preventivo completo: reducción del <strong>{Math.round(((totalCP-Math.round(totalCP*0.35))/totalCP)*100)}%</strong> · Ahorro ≈ <strong>${(((totalCP-Math.round(totalCP*0.35))*850000)/1000000).toFixed(1)}M COP</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Top equipos — Mayor riesgo de falla</div>
                  <div style={{fontSize:11,color:'#A1A1AA'}}>Ordenados por score predictivo</div>
                </div>
                <button onClick={()=>setTab('equipos')} style={{fontSize:12,color:'#3B4FE8',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                  Ver todos <i className="ti ti-chevron-right" style={{fontSize:13}}/>
                </button>
              </div>
              {loading?Array.from({length:4}).map((_,i)=><div key={i} style={{height:70,borderBottom:'0.5px solid #F8F9FA'}}/>):(data?.equipoRiesgo||[]).slice(0,5).map((e:any,i:number)=>{
                const as=alertaStyle[e.alerta]||alertaStyle.bajo
                return (
                  <div key={i} onClick={()=>{setEqSel(e);setTab('equipos')}} style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA',display:'flex',alignItems:'center',gap:16,cursor:'pointer',transition:'background 0.1s'}}
                    onMouseEnter={el=>el.currentTarget.style.background='#FAFAFA'}
                    onMouseLeave={el=>el.currentTarget.style.background='#fff'}>
                    <ScoreRing score={e.score}/>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{e.nombre}</span>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:as.bg,color:as.text,border:`0.5px solid ${as.border}`,fontWeight:500}}>{as.label}</span>
                      </div>
                      <div style={{fontSize:11,color:'#A1A1AA',marginBottom:4}}>{e.servicio} · {e.marca||''}</div>
                      <div style={{display:'flex',gap:12,fontSize:11}}>
                        <span style={{color:'#D97706'}}>⚡ Falla en ~{e.diasParaFalla} días</span>
                        <span style={{color:'#A1A1AA'}}>Vida útil: {e.pctVida}%</span>
                        <span style={{color:'#DC2626'}}>Correctivos: {e.correctivos}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>Prob. falla 90d</div>
                      <div style={{fontSize:24,fontWeight:700,color:e.probFalla>=70?'#DC2626':e.probFalla>=45?'#D97706':'#16A34A'}}>{e.probFalla}%</div>
                      <div style={{fontSize:11,color:'#A1A1AA'}}>{e.fechaFalla}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab==='equipos'&&(
          <div style={{display:'flex',gap:16,height:'75vh'}}>
            <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',border:'0.5px solid #E4E4E7',borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px',borderBottom:'0.5px solid #E4E4E7',background:'#FAFAFA'}}>
                <div style={{position:'relative'}}>
                  <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{paddingLeft:28,width:'100%',fontSize:12,height:32}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {loading?Array.from({length:8}).map((_,i)=><div key={i} style={{padding:'10px 14px'}}><Sk h={14} w="70%"/></div>):
                svcOrdenados.map(([svc,eqs])=>{
                  const abierto=svcAbiertos[svc]!==false
                  const maxScore=Math.max(...eqs.map((e:any)=>e.score))
                  const sc=maxScore>=70?'#DC2626':maxScore>=45?'#D97706':'#16A34A'
                  return (
                    <div key={svc}>
                      <button onClick={()=>setSvcAbiertos(p=>({...p,[svc]:!p[svc]}))} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:'none',borderBottom:'0.5px solid #F4F4F5',background:'#FAFAFA',cursor:'pointer'}}>
                        <i className={'ti '+(abierto?'ti-chevron-down':'ti-chevron-right')} style={{fontSize:12,color:'#A1A1AA',flexShrink:0}}/>
                        <div style={{flex:1,textAlign:'left'}}>
                          <div style={{fontSize:11,fontWeight:500,color:'#18181B'}}>{svc}</div>
                          <div style={{fontSize:10,color:'#A1A1AA'}}>{eqs.length} equipos</div>
                        </div>
                        <div style={{fontSize:11,fontWeight:600,color:sc}}>{maxScore}</div>
                      </button>
                      {abierto&&eqs.map((e:any,i:number)=>{
                        const as=alertaStyle[e.alerta]||alertaStyle.bajo
                        const sel=eqSel?.id===e.id
                        return (
                          <div key={i} onClick={()=>setEqSel(e)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'0.5px solid #F8F9FA',cursor:'pointer',background:sel?'#EEF2FF':'#fff',borderLeft:`2px solid ${sel?'#3B4FE8':'transparent'}`}}>
                            <div style={{width:28,height:28,borderRadius:6,background:as.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:as.text,flexShrink:0}}>{e.score}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,fontWeight:sel?500:400,color:sel?'#3B4FE8':'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</div>
                              <div style={{fontSize:10,color:'#A1A1AA'}}>{e.probFalla}% · {e.diasParaFalla}d</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{flex:1,border:'0.5px solid #E4E4E7',borderRadius:10,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              {!eqSel?(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#A1A1AA'}}>
                  <i className="ti ti-trending-up" style={{fontSize:40,marginBottom:12,opacity:0.3}}/>
                  <p style={{fontSize:13,margin:0}}>Selecciona un equipo</p>
                  <p style={{fontSize:11,margin:'4px 0 0',opacity:0.6}}>Ver vida útil, riesgo, similares y línea de tiempo</p>
                </div>
              ):(()=>{
                const as=alertaStyle[eqSel.alerta]||alertaStyle.bajo
                const similares=(data?.equipoRiesgo||[]).filter((e:any)=>e.servicio===eqSel.servicio&&e.id!==eqSel.id).slice(0,3)
                const hoy=new Date()
                const proximos=[
                  {tipo:'Preventivo',dias:30,c:'#16A34A'},
                  {tipo:'Calibración',dias:90,c:'#D97706'},
                  {tipo:'Preventivo',dias:180,c:'#16A34A'},
                  {tipo:'Correctivo est.',dias:eqSel.diasParaFalla,c:'#DC2626'},
                ].sort((a,b)=>a.dias-b.dias)
                return (
                  <div style={{flex:1,overflowY:'auto'}}>
                    <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5',background:'#FAFAFA',display:'flex',alignItems:'center',gap:14}}>
                      <ScoreRing score={eqSel.score}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#18181B',marginBottom:2}}>{eqSel.nombre}</div>
                        <div style={{fontSize:11,color:'#A1A1AA',marginBottom:6}}>{eqSel.servicio} · {eqSel.marca||'—'}</div>
                        <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:as.bg,color:as.text,border:`0.5px solid ${as.border}`,fontWeight:500}}>Riesgo {as.label}</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:11,color:'#A1A1AA'}}>Prob. falla 90d</div>
                        <div style={{fontSize:26,fontWeight:700,color:eqSel.probFalla>=70?'#DC2626':eqSel.probFalla>=45?'#D97706':'#16A34A'}}>{eqSel.probFalla}%</div>
                      </div>
                    </div>
                    <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>

                      {/* Vida útil */}
                      <div style={{background:'#F8F9FA',borderRadius:8,padding:'14px'}}>
                        <div style={{fontSize:12,fontWeight:500,color:'#52525B',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                          <i className="ti ti-clock" style={{fontSize:13,color:'#3B4FE8'}}/> Vida útil
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:6}}>
                          <span style={{color:'#71717A'}}>{eqSel.edadAnios} años en uso</span>
                          <span style={{fontWeight:500,color:eqSel.pctVida>=80?'#DC2626':'#16A34A'}}>{eqSel.pctVida}% consumido</span>
                        </div>
                        <div style={{height:8,background:'#E4E4E7',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:8,borderRadius:4,width:`${eqSel.pctVida}%`,background:eqSel.pctVida>=80?'#DC2626':eqSel.pctVida>=60?'#D97706':'#22C55E'}}/>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#A1A1AA',marginTop:4}}>
                          <span>{eqSel.vidaUtil?`${eqSel.vidaUtil} años útiles`:'—'}</span>
                          <span>{eqSel.vidaUtil&&eqSel.edadAnios?`Quedan ${Math.max(eqSel.vidaUtil-eqSel.edadAnios,0)} años`:'—'}</span>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      <div style={{background:'#F8F9FA',borderRadius:8,padding:'14px'}}>
                        <div style={{fontSize:12,fontWeight:500,color:'#52525B',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                          <i className="ti ti-activity" style={{fontSize:13,color:'#3B4FE8'}}/> Composición del score
                        </div>
                        {[
                          {l:'Vida útil consumida',v:Math.round(eqSel.pctVida*0.35),max:35,c:eqSel.pctVida>=80?'#DC2626':'#22C55E'},
                          {l:'Ratio correctivos',v:Math.round(eqSel.correctivos>0?30:0),max:35,c:eqSel.correctivos>0?'#DC2626':'#22C55E'},
                          {l:'Clase INVIMA',v:eqSel.riesgo==='alto'?30:eqSel.riesgo==='medio'?15:5,max:30,c:eqSel.riesgo==='alto'?'#DC2626':'#D97706'},
                        ].map(f=>(
                          <div key={f.l} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                            <div style={{fontSize:11,color:'#71717A',width:160,flexShrink:0}}>{f.l}</div>
                            <div style={{flex:1,height:5,background:'#E4E4E7',borderRadius:3}}>
                              <div style={{height:5,borderRadius:3,width:`${(f.v/f.max)*100}%`,background:f.c}}/>
                            </div>
                            <div style={{fontSize:11,fontWeight:500,color:f.c,width:24,textAlign:'right'}}>{f.v}</div>
                          </div>
                        ))}
                        <div style={{padding:'8px 10px',borderRadius:6,background:as.bg,border:`0.5px solid ${as.border}`,fontSize:11,color:as.text,marginTop:4}}>
                          💡 {eqSel.alerta==='critico'?`Intervención urgente. Falla probable en ~${eqSel.diasParaFalla} días.`:eqSel.alerta==='alto'?`Inspección técnica recomendada en los próximos 15 días.`:`Mantener plan preventivo actual.`}
                        </div>
                      </div>

                      {/* Similares */}
                      {similares.length>0&&(
                        <div style={{background:'#F8F9FA',borderRadius:8,padding:'14px'}}>
                          <div style={{fontSize:12,fontWeight:500,color:'#52525B',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            <i className="ti ti-users" style={{fontSize:13,color:'#3B4FE8'}}/> Comparativa con similares — {eqSel.servicio}
                          </div>
                          <div style={{padding:'8px 10px',borderRadius:6,background:'#EEF2FF',border:'0.5px solid #C7D2FE',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:11,fontWeight:500,color:'#3B4FE8',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{eqSel.nombre} (este)</span>
                            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                              <div style={{width:60,height:4,background:'#E4E4E7',borderRadius:2}}><div style={{height:4,width:`${eqSel.score}%`,background:'#3B4FE8',borderRadius:2}}/></div>
                              <span style={{fontSize:11,fontWeight:600,color:'#3B4FE8',width:24}}>{eqSel.score}</span>
                            </div>
                          </div>
                          {similares.map((s:any,i:number)=>{
                            const sas=alertaStyle[s.alerta]||alertaStyle.bajo
                            return (
                              <div key={i} onClick={()=>setEqSel(s)} style={{padding:'8px 10px',borderRadius:6,background:'#fff',border:'0.5px solid #E4E4E7',marginBottom:4,display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}>
                                <span style={{fontSize:11,color:'#52525B',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.nombre}</span>
                                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                                  <div style={{width:60,height:4,background:'#E4E4E7',borderRadius:2}}><div style={{height:4,width:`${s.score}%`,background:sas.text,borderRadius:2}}/></div>
                                  <span style={{fontSize:11,fontWeight:600,color:sas.text,width:24}}>{s.score}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Línea de tiempo */}
                      <div style={{background:'#F8F9FA',borderRadius:8,padding:'14px'}}>
                        <div style={{fontSize:12,fontWeight:500,color:'#52525B',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                          <i className="ti ti-calendar" style={{fontSize:13,color:'#3B4FE8'}}/> Próximas intervenciones
                        </div>
                        <div style={{position:'relative',paddingLeft:20}}>
                          <div style={{position:'absolute',left:7,top:0,bottom:0,width:1,background:'#E4E4E7'}}/>
                          {proximos.map((p,i)=>{
                            const fecha=new Date(hoy.getTime()+p.dias*86400000).toLocaleDateString('es-CO',{month:'short',day:'numeric'})
                            return (
                              <div key={i} style={{position:'relative',marginBottom:10,paddingLeft:16}}>
                                <div style={{position:'absolute',left:-6,top:4,width:10,height:10,borderRadius:'50%',background:p.c,border:'2px solid #fff'}}/>
                                <div style={{background:'#fff',borderRadius:6,padding:'6px 10px',border:'0.5px solid #E4E4E7'}}>
                                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                    <span style={{fontSize:11,fontWeight:500,color:p.c}}>{p.tipo}</span>
                                    <span style={{fontSize:10,color:'#A1A1AA'}}>{fecha} · {p.dias}d</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {tab==='servicios'&&(
          <div style={{maxWidth:800}}>
            <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Riesgo predictivo por servicio hospitalario</div>
              </div>
              {loading?Array.from({length:6}).map((_,i)=><div key={i} style={{height:60,borderBottom:'0.5px solid #F8F9FA'}}/>):(data?.prediccionServicios||[]).map((s:any,i:number)=>{
                const c=s.scorePromedio>=70?'#DC2626':s.scorePromedio>=45?'#D97706':'#16A34A'
                return (
                  <div key={i} style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:2}}>{s.nombre}</div>
                        <div style={{display:'flex',gap:10,fontSize:11,color:'#A1A1AA'}}>
                          <span>{s.equipos} equipos</span>
                          <span style={{color:'#DC2626'}}>{s.criticos} críticos</span>
                          <span>2025: {Math.round(s.correctivos)} → 2026: {Math.round(s.correctivos*1.18)}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:22,fontWeight:700,color:c}}>{s.scorePromedio}</div>
                        <div style={{fontSize:10,color:'#A1A1AA'}}>score riesgo</div>
                      </div>
                    </div>
                    <div style={{height:4,background:'#F4F4F5',borderRadius:2}}>
                      <div style={{height:4,borderRadius:2,width:`${s.scorePromedio}%`,background:c}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab==='repuestos'&&(
          <div style={{maxWidth:700}}>
            {!loading&&(!data?.repuestosCriticos||data.repuestosCriticos.length===0)?(
              <div style={{background:'#F0FDF4',borderRadius:10,border:'0.5px solid #BBF7D0',padding:'32px',textAlign:'center'}}>
                <i className="ti ti-package" style={{fontSize:36,color:'#16A34A',display:'block',marginBottom:10}}/>
                <div style={{fontSize:15,fontWeight:600,color:'#16A34A',marginBottom:4}}>Stock en buen estado</div>
                <div style={{fontSize:12,color:'#71717A'}}>No hay repuestos con stock bajo o agotado</div>
              </div>
            ):(
              <>
                {(data?.repuestosCriticos?.length>0)&&(
                  <div style={{padding:'12px 16px',borderRadius:8,background:'#FEF2F2',border:'0.5px solid #FECACA',marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}}>
                    <i className="ti ti-alert-triangle" style={{fontSize:16,color:'#DC2626',flexShrink:0,marginTop:1}}/>
                    <div style={{fontSize:12,color:'#DC2626'}}><strong>{data?.repuestosCriticos?.length} repuestos</strong> con stock bajo. Reposición recomendada antes de la próxima ronda.</div>
                  </div>
                )}
                <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                  <div style={{padding:'14px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Repuestos a reponer</div>
                  </div>
                  {loading?Array.from({length:4}).map((_,i)=><div key={i} style={{height:56,borderBottom:'0.5px solid #F8F9FA'}}/>):(data?.repuestosCriticos||[]).map((r:any,i:number)=>(
                    <div key={i} style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{r.nombre}</div>
                          <div style={{fontSize:11,color:r.stock===0?'#DC2626':'#D97706'}}>{r.stock===0?'Sin stock':r.stock+' unidades — Stock bajo'} · Mínimo: {r.minimo}</div>
                        </div>
                        {r.costoReposicion&&<div style={{textAlign:'right'}}><div style={{fontSize:11,color:'#A1A1AA'}}>Costo reposición</div><div style={{fontSize:13,fontWeight:600,color:'#3B4FE8'}}>${r.costoReposicion.toLocaleString('es-CO')}</div></div>}
                      </div>
                      <div style={{height:4,background:'#F4F4F5',borderRadius:2}}>
                        <div style={{height:4,borderRadius:2,width:`${Math.min((r.stock/r.minimo)*100,100)}%`,background:r.stock===0?'#DC2626':'#D97706'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
