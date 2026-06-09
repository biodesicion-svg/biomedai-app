'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'

function fmtCOP(n:number){
  if(!n||n===0) return '—'
  if(n>=1000000000) return '$'+(n/1000000000).toFixed(1)+'B'
  if(n>=1000000) return '$'+(n/1000000).toFixed(1)+'M'
  return '$'+Math.round(n/1000)+'K'
}
function fmtFecha(s:string){
  if(!s) return '—'
  return new Date(s+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

function RecBadge({r}:any){
  const map:any={
    reemplazar_inmediato:{c:RO,bg:RO_BG,l:'Reemplazar Ya',icon:'ti-alert-triangle'},
    evaluar_1_2_anios:{c:NA,bg:NA_BG,l:'Evaluar 1-2 años',icon:'ti-clock-exclamation'},
    mantener:{c:MO,bg:MO_BG,l:'Mantener',icon:'ti-eye'},
    continuar:{c:VE,bg:VE_BG,l:'Continuar',icon:'ti-circle-check'},
  }
  const s=map[r]||{c:GR,bg:'#F4F4F5',l:r,icon:'ti-circle'}
  return <span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:s.bg,color:s.c,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
    <i className={`ti ${s.icon}`} style={{fontSize:11}}/>{s.l}
  </span>
}

function ScoreGauge({score,size=80}:any){
  const r=size*0.38,circ=2*Math.PI*r,dash=(score/100)*circ
  const color=score<=30?RO:score<=60?NA:score<=80?MO:VE
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={size*0.1}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize={size*0.22} fontWeight={700} fill={color}>{Math.round(score)}</text>
    </svg>
  )
}

function HistorialChart({data,vidaUtilFab,vidaUtilEcri,anioAdq}:any){
  if(!data||data.length===0) return <div style={{color:GR,fontSize:12,textAlign:'center',padding:20}}>Sin historial de mantenimientos</div>
  const maxCost=Math.max(...data.map((d:any)=>d.costo),1)
  const maxMant=Math.max(...data.map((d:any)=>d.preventivos+d.correctivos),1)
  const W=500,H=160,PAD=40,PADR=60
  const anios=data.map((d:any)=>d.anio)
  const minAnio=Math.min(...anios)
  const maxAnio=Math.max(...anios,minAnio+1)
  const rangoAnios=maxAnio-minAnio||1
  const scaleX=(anio:number)=>PAD+(anio-minAnio)/rangoAnios*(W-PAD-PADR)
  const scaleY=(v:number)=>H-20-(v/maxCost)*(H-40)
  const scaleYM=(v:number)=>H-20-(v/maxMant)*(H-40)
  const ptsPrev=data.map((d:any,i:number)=>`${scaleX(d.anio)},${scaleYM(d.preventivos)}`).join(' ')
  const ptsCorr=data.map((d:any,i:number)=>`${scaleX(d.anio)},${scaleYM(d.correctivos)}`).join(' ')

  // Líneas de vida útil
  const xVUF=anioAdq?scaleX(anioAdq+(vidaUtilFab||10)):null
  const xVUE=anioAdq?scaleX(anioAdq+(vidaUtilEcri||10)):null

  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      {/* Grid */}
      {[0,25,50,75,100].map(p=>{
        const y=H-20-(p/100)*(H-40)
        return <line key={p} x1={PAD} y1={y} x2={W-PADR} y2={y} stroke="#F1F5F9" strokeWidth={1}/>
      })}
      {/* Barras costo */}
      {data.map((d:any,i:number)=>{
        const bw=Math.max((W-PAD-PADR)/data.length*0.5,8)
        const bh=(d.costo/maxCost)*(H-40)
        const bx=scaleX(d.anio)-bw/2
        return <rect key={i} x={bx} y={H-20-bh} width={bw} height={bh} fill={AZ} opacity={0.15} rx={2}/>
      })}
      {/* Línea preventivos */}
      {data.length>1&&<polyline points={ptsPrev} fill="none" stroke={VE} strokeWidth={2} strokeLinejoin="round"/>}
      {/* Línea correctivos */}
      {data.length>1&&<polyline points={ptsCorr} fill="none" stroke={RO} strokeWidth={2} strokeLinejoin="round"/>}
      {/* Puntos */}
      {data.map((d:any,i:number)=>(
        <g key={i}>
          <circle cx={scaleX(d.anio)} cy={scaleYM(d.preventivos)} r={4} fill={VE} stroke="#fff" strokeWidth={1.5}/>
          <circle cx={scaleX(d.anio)} cy={scaleYM(d.correctivos)} r={4} fill={RO} stroke="#fff" strokeWidth={1.5}/>
          <text x={scaleX(d.anio)} y={H-4} textAnchor="middle" fontSize={9} fill={GR}>{d.anio}</text>
        </g>
      ))}
      {/* Líneas vida útil */}
      {xVUF&&xVUF<W-PADR&&<>
        <line x1={xVUF} y1={10} x2={xVUF} y2={H-20} stroke={NA} strokeDasharray="4,3" strokeWidth={1.5}/>
        <text x={xVUF+3} y={20} fontSize={8} fill={NA}>VU Fab</text>
      </>}
      {xVUE&&xVUE<W-PADR&&xVUE!==xVUF&&<>
        <line x1={xVUE} y1={10} x2={xVUE} y2={H-20} stroke={MO} strokeDasharray="4,3" strokeWidth={1.5}/>
        <text x={xVUE+3} y={30} fontSize={8} fill={MO}>VU ECRI</text>
      </>}
      {/* Eje Y labels */}
      <text x={PAD-4} y={H-20} textAnchor="end" fontSize={8} fill={GR}>0</text>
      <text x={PAD-4} y={H-20-(H-40)/2} textAnchor="end" fontSize={8} fill={GR}>{Math.round(maxMant/2)}</text>
      <text x={PAD-4} y={14} textAnchor="end" fontSize={8} fill={GR}>{maxMant}</text>
      {/* Leyenda */}
      <circle cx={PAD} cy={H+15} r={4} fill={VE}/><text x={PAD+8} y={H+19} fontSize={9} fill={GR}>Preventivos</text>
      <circle cx={PAD+80} cy={H+15} r={4} fill={RO}/><text x={PAD+88} y={H+19} fontSize={9} fill={GR}>Correctivos</text>
      <rect x={PAD+160} y={H+10} width={12} height={8} fill={AZ} opacity={0.3}/><text x={PAD+175} y={H+19} fontSize={9} fill={GR}>Costo ($)</text>
    </svg>
  )
}

function ObsolescenciaRadar({ev}:any){
  // Radar simple con 5 dimensiones de obsolescencia
  const dims=[
    {l:'Económica',v:Math.min(ev.cmr_pct*2,100)},
    {l:'Edad/VU',v:ev.pct_vida_util},
    {l:'Técnica',v:100-ev.evalscore_tecnica},
    {l:'Tecnológica',v:ev.obsolescencia_tecnologica?80:ev.partes_obsoletas?50:10},
    {l:'Normativa',v:ev.obsolescencia_normativa?90:ev.estado_calibracion==='vencida'?60:10},
  ]
  const CX=120,CY=100,R=70
  const points=dims.map((d,i)=>{
    const angle=(i/dims.length)*2*Math.PI-Math.PI/2
    const r=(d.v/100)*R
    return {x:CX+r*Math.cos(angle),y:CY+r*Math.sin(angle),lx:CX+(R+18)*Math.cos(angle),ly:CY+(R+18)*Math.sin(angle),label:d.l,val:d.v}
  })
  const poly=points.map(p=>`${p.x},${p.y}`).join(' ')
  const grid=dims.map((_,i)=>{
    const angle=(i/dims.length)*2*Math.PI-Math.PI/2
    return `${CX+R*Math.cos(angle)},${CY+R*Math.sin(angle)}`
  }).join(' ')

  return(
    <svg width={240} height={220} viewBox="0 0 240 220">
      {[0.25,0.5,0.75,1].map(f=>(
        <polygon key={f} points={dims.map((_,i)=>{
          const a=(i/dims.length)*2*Math.PI-Math.PI/2
          return `${CX+R*f*Math.cos(a)},${CY+R*f*Math.sin(a)}`
        }).join(' ')} fill="none" stroke="#E2E8F0" strokeWidth={1}/>
      ))}
      {dims.map((_,i)=>{
        const a=(i/dims.length)*2*Math.PI-Math.PI/2
        return <line key={i} x1={CX} y1={CY} x2={CX+R*Math.cos(a)} y2={CY+R*Math.sin(a)} stroke="#E2E8F0" strokeWidth={1}/>
      })}
      <polygon points={poly} fill={RO} fillOpacity={0.2} stroke={RO} strokeWidth={1.5}/>
      {points.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={RO}/>
          <text x={p.lx} y={p.ly+3} textAnchor="middle" fontSize={8} fill={GR}>{p.label}</text>
          <text x={p.lx} y={p.ly+13} textAnchor="middle" fontSize={8} fontWeight={700} fill={p.val>70?RO:p.val>40?NA:VE}>{Math.round(p.val)}%</text>
        </g>
      ))}
    </svg>
  )
}

export default function ReemplazoPage(){
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState<'dashboard'|'lista'|'informe'>('dashboard')
  const[sel,setSel]=useState<any>(null)

  useEffect(()=>{
    fetch('/api/reemplazo').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  },[])

  function abrirInforme(ev:any){setSel(ev);setTab('informe')}

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <i className="ti ti-replace" style={{fontSize:40,color:AZ,display:'block',marginBottom:12}}/>
        <div style={{color:GR,fontSize:14}}>Cargando evaluaciones...</div>
      </div>
    </div>
  )

  const{evaluaciones=[],kpis={}}=data||{}
  const tabs=[
    {id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},
    {id:'lista',label:'Evaluaciones',icon:'ti-list-check'},
    {id:'informe',label:'Informe Gerencia',icon:'ti-file-description'},
  ]

  return(
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{padding:'20px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:NA_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-replace" style={{fontSize:20,color:NA}}/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:20,fontWeight:700,color:AZ}}>Evaluación de Reemplazo</h1>
                <p style={{margin:0,fontSize:12,color:GR}}>Metodología EVDM · Económica · Clínica · Técnica · Obsolescencia</p>
              </div>
            </div>
            {kpis.criticos>0&&(
              <div style={{background:RO_BG,border:`1px solid ${RO}`,borderRadius:8,padding:'8px 16px',display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-alert-triangle" style={{color:RO,fontSize:16}}/>
                <span style={{fontSize:12,fontWeight:700,color:RO}}>{kpis.criticos} equipo(s) críticos · Inversión: {fmtCOP(kpis.inversionReq)}</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:0}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)}
                style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:tab===t.id?AZ:GR,borderBottom:tab===t.id?`2px solid ${AZ}`:'2px solid transparent',display:'flex',alignItems:'center',gap:6}}>
                <i className={`ti ${t.icon}`}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:24}}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16,marginBottom:24}}>
              {[
                {label:'Evaluados',val:kpis.total,icon:'ti-clipboard-list',color:AZ,bg:AZ_BG},
                {label:'Reemplazar ya',val:kpis.criticos,icon:'ti-alert-triangle',color:RO,bg:RO_BG},
                {label:'Evaluar 1-2 años',val:kpis.evaluar,icon:'ti-clock-exclamation',color:NA,bg:NA_BG},
                {label:'En buen estado',val:kpis.ok,icon:'ti-circle-check',color:VE,bg:VE_BG},
                {label:'Obsoletos',val:kpis.obsoletos,icon:'ti-ban',color:MO,bg:MO_BG},
                {label:'Inversión req.',val:fmtCOP(kpis.inversionReq),icon:'ti-currency-dollar',color:RO,bg:RO_BG},
              ].map((k,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #E2E8F0'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <i className={`ti ${k.icon}`} style={{fontSize:17,color:k.color}}/>
                  </div>
                  <div style={{fontSize:typeof k.val==='number'?22:16,fontWeight:700,color:k.color}}>{k.val}</div>
                  <div style={{fontSize:11,color:GR,marginTop:2}}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Ranking por urgencia de reemplazo</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFC'}}>
                    {['Equipo','Score','CMR','Vida útil','Edad','Prev.','Corr.','Costo hist.','Recomendación',''].map(h=>(
                      <th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluaciones.map((ev:any,i:number)=>(
                    <tr key={i} style={{borderTop:'1px solid #F1F5F9'}}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{ev.equipo_nombre}</div>
                        <div style={{fontSize:11,color:GR}}>{ev.equipo_tipo}</div>
                      </td>
                      <td style={{padding:'10px 14px'}}><ScoreGauge score={ev.evdm_score} size={44}/></td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:700,color:ev.cmr_pct>30?RO:ev.cmr_pct>15?NA:VE}}>{ev.cmr_pct}%</td>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{height:5,background:'#F1F5F9',borderRadius:3,width:70,marginBottom:3}}>
                          <div style={{width:`${Math.min(ev.pct_vida_util,100)}%`,height:'100%',background:ev.pct_vida_util>=100?RO:ev.pct_vida_util>=80?NA:VE,borderRadius:3}}/>
                        </div>
                        <div style={{fontSize:10,color:GR}}>{ev.pct_vida_util}% consumida</div>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12}}>{ev.edad_actual} años</td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:700,color:VE}}>{ev.total_preventivos}</td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:700,color:ev.total_correctivos>3?RO:NA}}>{ev.total_correctivos}</td>
                      <td style={{padding:'10px 14px',fontSize:12}}>{fmtCOP(ev.costo_total_mantenimiento_historico)}</td>
                      <td style={{padding:'10px 14px'}}><RecBadge r={ev.recomendacion}/></td>
                      <td style={{padding:'10px 14px'}}>
                        <button onClick={()=>abrirInforme(ev)} style={{background:AZ,color:'#fff',border:'none',borderRadius:6,padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          Ver informe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LISTA */}
        {tab==='lista'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {evaluaciones.map((ev:any,i:number)=>(
              <div key={i} style={{background:'#fff',borderRadius:12,border:`1px solid ${ev.recomendacion==='reemplazar_inmediato'?RO:'#E2E8F0'}`,padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <ScoreGauge score={ev.evdm_score} size={64}/>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:AZ}}>{ev.equipo_nombre}</div>
                      <div style={{fontSize:12,color:GR}}>{ev.equipo_tipo} · {ev.equipo_servicio}</div>
                      <div style={{marginTop:6}}><RecBadge r={ev.recomendacion}/></div>
                    </div>
                  </div>
                  <button onClick={()=>abrirInforme(ev)} style={{background:AZ,color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-file-description"/>Informe gerencia
                  </button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
                  {[
                    {l:'CMR',v:`${ev.cmr_pct}%`,c:ev.cmr_pct>30?RO:ev.cmr_pct>15?NA:VE},
                    {l:'Vida útil',v:`${ev.pct_vida_util}% consumida`,c:ev.pct_vida_util>=100?RO:ev.pct_vida_util>=80?NA:VE},
                    {l:'Edad',v:`${ev.edad_actual} años`,c:'#0F172A'},
                    {l:'Preventivos',v:ev.total_preventivos,c:VE},
                    {l:'Correctivos',v:ev.total_correctivos,c:ev.total_correctivos>3?RO:NA},
                    {l:'Costo hist.',v:fmtCOP(ev.costo_total_mantenimiento_historico),c:'#0F172A'},
                  ].map((f,j)=>(
                    <div key={j} style={{background:'#F8FAFC',borderRadius:8,padding:'10px 14px'}}>
                      <div style={{fontSize:10,color:GR,marginBottom:2}}>{f.l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:f.c}}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INFORME GERENCIA — detalle completo */}
        {tab==='informe'&&(
          !sel?(
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:40,textAlign:'center'}}>
              <i className="ti ti-file-description" style={{fontSize:40,color:GR,display:'block',marginBottom:12}}/>
              <div style={{fontSize:14,color:GR}}>Selecciona un equipo desde el Dashboard → "Ver informe"</div>
            </div>
          ):(
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:32}}>

              {/* Header informe */}
              <div style={{borderBottom:`3px solid ${AZ}`,paddingBottom:16,marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                <div>
                  <div style={{fontSize:10,color:GR,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Informe Técnico para Gerencia · Metodología EVDM</div>
                  <div style={{fontSize:22,fontWeight:700,color:AZ}}>{sel.equipo_nombre}</div>
                  <div style={{fontSize:12,color:GR,marginTop:4}}>{sel.equipo_tipo} · {sel.equipo_marca} {sel.equipo_modelo} · S/N {sel.equipo_serie||'—'} · Clase INVIMA {sel.equipo_clase||'—'}</div>
                  <div style={{fontSize:12,color:GR}}>Servicio: {sel.equipo_servicio} · Ubicación: {sel.equipo_ubicacion} · Riesgo: {sel.equipo_riesgo}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <RecBadge r={sel.recomendacion}/>
                  <div style={{fontSize:11,color:GR,marginTop:4}}>Evaluado: {fmtFecha(sel.fecha_evaluacion)}</div>
                  <div style={{fontSize:11,color:GR}}>{sel.evaluador_nombre} · {sel.evaluador_cargo}</div>
                </div>
              </div>

              {/* Veredicto + radar */}
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:20,marginBottom:24}}>
                <div style={{background:sel.recomendacion==='reemplazar_inmediato'?RO_BG:sel.recomendacion==='evaluar_1_2_anios'?NA_BG:VE_BG,borderRadius:12,padding:20,display:'flex',alignItems:'center',gap:16}}>
                  <ScoreGauge score={sel.evdm_score} size={90}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:GR,marginBottom:6}}>RECOMENDACIÓN FINAL</div>
                    <div style={{marginBottom:8}}><RecBadge r={sel.recomendacion}/></div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{sel.observaciones}</div>
                  </div>
                </div>
                <div style={{background:'#F8FAFC',borderRadius:12,padding:16,border:'1px solid #E2E8F0',display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{fontSize:11,fontWeight:700,color:AZ,marginBottom:8}}>Radar de Obsolescencia</div>
                  <ObsolescenciaRadar ev={sel}/>
                </div>
              </div>

              {/* Vida útil */}
              <div style={{background:'#F8FAFC',borderRadius:12,padding:20,marginBottom:20,border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:13,fontWeight:700,color:AZ,marginBottom:14}}>Ciclo de vida y obsolescencia</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:14}}>
                  {[
                    {l:'Año adquisición',v:sel.anio_adquisicion||'—'},
                    {l:'Edad actual',v:`${sel.edad_actual} años`},
                    {l:'VU fabricante',v:`${sel.vida_util_fabricante} años`,c:sel.edad_actual>=(sel.vida_util_fabricante||99)?RO:VE},
                    {l:'VU ECRI',v:`${sel.vida_util_ecri} años`,c:sel.edad_actual>=(sel.vida_util_ecri||99)?RO:VE},
                    {l:'Años restantes',v:`${sel.anos_restantes} años`,c:sel.anos_restantes<=0?RO:sel.anos_restantes<=2?NA:VE},
                  ].map((it,i)=>(
                    <div key={i} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E2E8F0'}}>
                      <div style={{fontSize:10,color:GR}}>{it.l}</div>
                      <div style={{fontSize:18,fontWeight:700,color:it.c||'#0F172A'}}>{it.v}</div>
                    </div>
                  ))}
                </div>
                {/* Barra vida útil */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:11,color:GR}}>Vida útil consumida</span>
                    <span style={{fontSize:11,fontWeight:700,color:sel.pct_vida_util>=100?RO:sel.pct_vida_util>=80?NA:VE}}>{sel.pct_vida_util}%</span>
                  </div>
                  <div style={{height:10,background:'#F1F5F9',borderRadius:5,overflow:'hidden',position:'relative'}}>
                    <div style={{width:`${Math.min(sel.pct_vida_util,100)}%`,height:'100%',background:sel.pct_vida_util>=100?RO:sel.pct_vida_util>=80?NA:VE,borderRadius:5}}/>
                    {/* Marcador VU fabricante */}
                    {sel.vida_util_fabricante&&<div style={{position:'absolute',left:`${Math.min((sel.vida_util_fabricante/(sel.vida_util_fabricante+sel.anos_restantes+1))*100,95)}%`,top:0,height:'100%',width:2,background:NA}}/>}
                  </div>
                </div>
                {/* Badges obsolescencia */}
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[
                    {c:sel.obsolescencia_tecnologica,l:'Obsolescencia tecnológica',color:MO,bg:MO_BG},
                    {c:sel.obsolescencia_normativa,l:'Obsolescencia normativa',color:RO,bg:RO_BG},
                    {c:sel.obsolescencia_funcional,l:'Obsolescencia funcional',color:NA,bg:NA_BG},
                  ].map((o,i)=>o.c&&(
                    <span key={i} style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:o.bg,color:o.color,fontWeight:600}}>⚠ {o.l}</span>
                  ))}
                  <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#F4F4F5',color:GR,fontWeight:600}}>Repuestos: {sel.repuestos_disponibles}</span>
                  <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#F4F4F5',color:GR,fontWeight:600}}>Soporte fabricante: {sel.soporte_fabricante}</span>
                </div>
              </div>

              {/* Variables EVDM */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
                {[
                  {titulo:'Variable Económica (EVE)',peso:40,score:sel.eve_score,items:[
                    {l:'Valor adquisición',v:fmtCOP(sel.valor_adquisicion)},
                    {l:'Valor reposición actual',v:fmtCOP(sel.valor_reposicion_actual)},
                    {l:'Costo mantenimiento/año',v:fmtCOP(sel.costo_mantenimiento_anual)},
                    {l:'CMR (Costo/Reposición)',v:`${sel.cmr_pct}%`,alert:sel.cmr_pct>30},
                    {l:'Costo histórico total',v:fmtCOP(sel.costo_total_mantenimiento_historico)},
                  ]},
                  {titulo:'Variable Clínica (EVC)',peso:30,score:sel.evc_score,items:[
                    {l:'Frecuencia de uso',v:sel.frecuencia_uso},
                    {l:'Impacto clínico',v:sel.impacto_clinico},
                    {l:'Equipo alternativo',v:sel.equipo_alternativo?'Disponible':'No disponible'},
                    {l:'Eventos adversos',v:sel.eventos_adversos_count},
                    {l:'Calibración',v:sel.estado_calibracion},
                  ]},
                  {titulo:'Variable Técnica (EVT)',peso:30,score:sel.evalscore_tecnica,items:[
                    {l:'Correctivos último año',v:sel.correctivos_ultimo_anio,alert:sel.correctivos_ultimo_anio>3},
                    {l:'Fallas críticas',v:sel.fallas_criticas?'Sí':'No',alert:sel.fallas_criticas},
                    {l:'Partes obsoletas',v:sel.partes_obsoletas?'Sí':'No',alert:sel.partes_obsoletas},
                    {l:'Total preventivos',v:sel.total_preventivos},
                    {l:'Total correctivos',v:sel.total_correctivos},
                  ]},
                ].map((v,i)=>(
                  <div key={i} style={{background:'#F8FAFC',borderRadius:10,padding:16,border:'1px solid #E2E8F0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <div style={{fontSize:12,fontWeight:700,color:AZ}}>{v.titulo}</div>
                      <span style={{fontSize:10,color:GR,background:'#E2E8F0',padding:'2px 6px',borderRadius:10}}>Peso {v.peso}%</span>
                    </div>
                    <div style={{fontSize:26,fontWeight:700,color:v.score<=30?RO:v.score<=60?NA:VE,marginBottom:8}}>{v.score}<span style={{fontSize:12,color:GR}}>/100</span></div>
                    <div style={{height:4,background:'#E2E8F0',borderRadius:2,marginBottom:12}}>
                      <div style={{width:`${v.score}%`,height:'100%',background:v.score<=30?RO:v.score<=60?NA:VE,borderRadius:2}}/>
                    </div>
                    {v.items.map((it:any,j:number)=>(
                      <div key={j} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F1F5F9'}}>
                        <span style={{fontSize:11,color:GR}}>{it.l}</span>
                        <span style={{fontSize:11,fontWeight:600,color:it.alert?RO:'#0F172A'}}>{it.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Historial de mantenimientos gráfica */}
              <div style={{background:'#F8FAFC',borderRadius:12,padding:20,marginBottom:20,border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:13,fontWeight:700,color:AZ,marginBottom:4}}>Historial de mantenimientos</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
                  {[
                    {l:'Total mantenimientos',v:sel.total_mantenimientos,c:AZ},
                    {l:'Preventivos',v:sel.total_preventivos,c:VE},
                    {l:'Correctivos',v:sel.total_correctivos,c:sel.total_correctivos>5?RO:NA},
                    {l:'Horas trabajo',v:sel.horas_trabajo_total>0?`${sel.horas_trabajo_total}h`:'Sin registro',c:MO},
                  ].map((k,i)=>(
                    <div key={i} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E2E8F0',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
                      <div style={{fontSize:11,color:GR}}>{k.l}</div>
                    </div>
                  ))}
                </div>
                <HistorialChart data={sel.historial_anual} vidaUtilFab={sel.vida_util_fabricante} vidaUtilEcri={sel.vida_util_ecri} anioAdq={sel.anio_adquisicion}/>
              </div>

              {/* Tablas correctivos y preventivos */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                {[
                  {titulo:'Últimos correctivos',lista:sel.lista_correctivos,color:RO,icon:'ti-tool'},
                  {titulo:'Últimos preventivos',lista:sel.lista_preventivos,color:VE,icon:'ti-calendar-check'},
                ].map((sec,si)=>(
                  <div key={si} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:8}}>
                      <i className={`ti ${sec.icon}`} style={{color:sec.color,fontSize:15}}/>
                      <span style={{fontSize:13,fontWeight:700,color:AZ}}>{sec.titulo}</span>
                      <span style={{fontSize:11,color:GR,marginLeft:'auto'}}>{sec.lista?.length||0} registros</span>
                    </div>
                    {!sec.lista?.length?(
                      <div style={{padding:16,fontSize:12,color:GR,textAlign:'center'}}>Sin registros</div>
                    ):(
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{background:'#F8FAFC'}}>
                            {['Fecha','Descripción','Costo'].map(h=>(
                              <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,color:GR,fontWeight:600}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.lista.map((m:any,mi:number)=>(
                            <tr key={mi} style={{borderTop:'1px solid #F1F5F9'}}>
                              <td style={{padding:'8px 12px',fontSize:11,whiteSpace:'nowrap'}}>{fmtFecha(m.fecha_realizado)}</td>
                              <td style={{padding:'8px 12px',fontSize:11,color:'#334155',maxWidth:200}}>
                                <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.descripcion||'Sin descripción'}</div>
                                {m.hallazgos&&<div style={{fontSize:10,color:GR}}>{m.hallazgos}</div>}
                              </td>
                              <td style={{padding:'8px 12px',fontSize:11,fontWeight:600,color:sec.color}}>{fmtCOP(m.costo_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>

              {/* Comparativo equipo nuevo */}
              {sel.comparativos?.length>0&&(
                <div style={{border:`2px solid ${VE}`,borderRadius:12,padding:20,marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:AZ,marginBottom:14}}>Equipo propuesto como reemplazo</div>
                  {sel.comparativos.map((c:any,ci:number)=>(
                    <div key={ci}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
                        {[
                          {l:'Equipo',v:`${c.marca_propuesta} ${c.modelo_propuesto}`},
                          {l:'Proveedor',v:c.proveedor},
                          {l:'Precio oferta',v:fmtCOP(c.precio_oferta)},
                          {l:'Vida útil',v:`${c.vida_util_propuesto} años`},
                          {l:'Garantía',v:`${c.garantia_meses} meses`},
                          {l:'Ahorro mant./año',v:fmtCOP(c.ahorro_mantenimiento_anual)},
                          {l:'TCO 5 años',v:fmtCOP(c.costo_total_propiedad_5anios)},
                          {l:'ROI estimado',v:`${c.roi_estimado_anios} años`},
                        ].map((it,j)=>(
                          <div key={j} style={{background:'#F0FDF4',borderRadius:8,padding:'10px 14px'}}>
                            <div style={{fontSize:10,color:GR}}>{it.l}</div>
                            <div style={{fontSize:13,fontWeight:700,color:'#166534'}}>{it.v||'—'}</div>
                          </div>
                        ))}
                      </div>
                      {c.mejoras_tecnicas&&(
                        <div style={{background:VE_BG,borderRadius:8,padding:'10px 14px',fontSize:12,color:'#166534',marginBottom:8}}>
                          <strong>Mejoras técnicas:</strong> {c.mejoras_tecnicas}
                        </div>
                      )}
                      {c.certificaciones&&(
                        <div style={{fontSize:11,color:GR}}>Certificaciones: {c.certificaciones} · Capacitación incluida: {c.incluye_capacitacion?'Sí':'No'}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pie */}
              <div style={{background:'#F8FAFC',borderRadius:8,padding:'12px 16px',fontSize:11,color:GR,borderTop:'2px solid #E2E8F0'}}>
                Evaluación: <strong>{sel.evaluador_nombre}</strong> · {sel.evaluador_cargo} · Metodología EVDM (Universidad Icesi, 2020) · Referencia vida útil: ECRI Institute · Fecha: {fmtFecha(sel.fecha_evaluacion)}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
