'use client'
import { useState, useEffect, useRef } from 'react'

const C = { az:'#1B2B5B', cy:'#00B4D8', ve:'#16A34A', ro:'#DC2626', na:'#D97706', mo:'#7C3AED', gr:'#64748B', veBg:'#F0FDF4', roBg:'#FEF2F2', naBg:'#FFFBEB', azBg:'#EEF2FF' }

function fmt(n:number){ return Math.round(n).toLocaleString('es-CO') }
function fmtCOP(n:number){ const m=Math.round(n); return m>=1000000 ? '$'+Math.round(m/1000000)+'M' : m>=1000 ? '$'+Math.round(m/1000)+'K' : '$'+m }
function semaforo(v:number,meta:number,inv=false){ if(inv) return v<=meta*0.5?C.ve:v<=meta?C.na:C.ro; return v>=meta?C.ve:v>=meta*0.7?C.na:C.ro }

export default function KpisPage() {
  const [d, setD] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('disponibilidad')
  const charts = useRef<Record<string,any>>({})

  useEffect(()=>{ fetch('/api/kpis').then(r=>r.json()).then(data=>{setD(data);setLoading(false)}).catch(()=>setLoading(false)) },[])

  useEffect(()=>{
    if(!d || loading) return
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => drawCharts(d)
    if ((window as any).Chart) { drawCharts(d); return }
    document.head.appendChild(s)
  },[d, loading])

  function drawCharts(d:any) {
    const Ch = (window as any).Chart
    if(!Ch) return
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    const gridC = isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'
    const txtC  = isDark?'#9CA3AF':'#6B7280'

    function mk(id:string, cfg:any) {
      const el = document.getElementById(id) as HTMLCanvasElement
      if(!el) return
      if(charts.current[id]) charts.current[id].destroy()
      charts.current[id] = new Ch(el, cfg)
    }

    const svcLabels = (d.porServicio||[]).slice(0,8).map((s:any)=>s.label.length>12?s.label.slice(0,12)+'…':s.label)
    const svcDisp   = (d.porServicio||[]).slice(0,8).map((s:any)=>+s.disp)

    mk('c-svc',{ type:'bar', data:{ labels:svcLabels, datasets:[{ data:svcDisp, backgroundColor:svcDisp.map((v:number)=>v>=95?C.ve:v>=85?C.na:C.ro), borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', scales:{ x:{min:60,max:100,grid:{color:gridC},ticks:{color:txtC,font:{size:10},callback:(v:any)=>v+'%'}}, y:{grid:{display:false},ticks:{color:txtC,font:{size:10}}} }, plugins:{legend:{display:false}} } })

    mk('c-estado',{ type:'doughnut', data:{ datasets:[{ data:[d.operativos,d.enMant,d.fuera], backgroundColor:[C.ve,C.na,C.ro], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'72%', plugins:{legend:{display:false}} } })

    mk('c-tipos',{ type:'doughnut', data:{ datasets:[{ data:[d.preventivos,d.correctivos,d.calibraciones], backgroundColor:[C.ve,C.ro,C.mo], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{display:false}} } })

    mk('c-mes',{ type:'bar', data:{ labels:(d.porMes||[]).map((m:any)=>m.mes), datasets:[{ label:'Preventivo', data:(d.porMes||[]).map((m:any)=>m.prev), backgroundColor:C.ve, borderRadius:3 },{ label:'Correctivo', data:(d.porMes||[]).map((m:any)=>m.corr), backgroundColor:C.ro, borderRadius:3 }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{grid:{color:gridC},ticks:{color:txtC,font:{size:10}}}, y:{grid:{color:gridC},ticks:{color:txtC,font:{size:10}}} }, plugins:{legend:{display:false}} } })

    mk('c-vida',{ type:'doughnut', data:{ datasets:[{ data:[d.vidaSaludable,d.vidaAdvertencia,d.vidaCriticos], backgroundColor:[C.ve,C.na,C.ro], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{display:false}} } })

    mk('c-costo-mes',{ type:'bar', data:{ labels:(d.costoPorMes||[]).map((m:any)=>m.mes), datasets:[{ label:'Preventivo', data:(d.costoPorMes||[]).map((m:any)=>m.prev), backgroundColor:C.ve, borderRadius:3 },{ label:'Correctivo', data:(d.costoPorMes||[]).map((m:any)=>m.corr), backgroundColor:C.ro, borderRadius:3 }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{grid:{color:gridC},ticks:{color:txtC,font:{size:10}}}, y:{grid:{color:gridC},ticks:{color:txtC,font:{size:10},callback:(v:any)=>{ if(v>=1000000) return '$'+(v/1000000).toFixed(0)+'M'; if(v>=1000) return '$'+(v/1000).toFixed(0)+'K'; return '$'+v }}} }, plugins:{legend:{display:false}} } })

    mk('c-costo',{ type:'doughnut', data:{ datasets:[{ data:[d.pctCostoMO||58, d.pctCostoRep||42], backgroundColor:[C.az, C.cy], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'70%', plugins:{legend:{display:false}} } })
  }

  const Sk = ({h=28,w='100%'}:any) => <div style={{height:h,width:w,background:'#F1F5F9',borderRadius:6}}/>

  function Gauge({val,max,meta,label,unit,color,size=100}:any) {
    const r=38; const circ=2*Math.PI*r; const pct=Math.min(val/max,1); const dash=pct*circ*0.75
    const c=color||(meta?semaforo(val,meta):C.az)
    return (
      <div style={{textAlign:'center'}}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{display:'block',margin:'0 auto 4px'}} role="img" aria-label={`${label} ${val}${unit}`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-background-secondary)" strokeWidth="10" strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={`-${circ*0.125}`} strokeLinecap="round"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={c} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={`-${circ*0.125}`} strokeLinecap="round"/>
          <text x="50" y="48" textAnchor="middle" fontSize="17" fontWeight="500" fill="var(--color-text-primary)">{val}</text>
          <text x="50" y="63" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">{unit}</text>
        </svg>
      </div>
    )
  }

  function Bar({label,val,pct,color,right}:any) {
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>
          <span>{label}</span><span style={{fontWeight:500,color:right||'var(--color-text-primary)'}}>{val}</span>
        </div>
        <div style={{height:6,background:'var(--color-background-secondary)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:6,borderRadius:3,background:color,width:`${Math.max(pct,1)}%`,transition:'width 0.8s'}}/>
        </div>
      </div>
    )
  }

  function Card({children,style={}}:any) {
    return <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:12,padding:16,...style}}>{children}</div>
  }

  const TABS = [
    {id:'disponibilidad',label:'Disponibilidad',icon:'ti-activity'},
    {id:'mantenimiento', label:'Mantenimiento', icon:'ti-tool'},
    {id:'vida',          label:'Vida util',     icon:'ti-clock-hour-4'},
    {id:'costos',        label:'Costos',        icon:'ti-currency-dollar'},
    {id:'normativa',     label:'Normativa',     icon:'ti-shield-check'},
  ]

  const pctPrev = d?.totalMant>0?Math.round((d.preventivos/d.totalMant)*100):0
  const pctCorr = d?.totalMant>0?Math.round((d.correctivos/d.totalMant)*100):0
  const pctCal  = d?.totalMant>0?Math.round((d.calibraciones/d.totalMant)*100):0

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'var(--color-background-tertiary,#FAFAFA)'}}>
      <div style={{background:'var(--color-background-primary)',borderBottom:'0.5px solid var(--color-border-tertiary)',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>SYNAP / Business Intelligence / KPIs</div>
          <h1 style={{fontSize:18,fontWeight:500,color:'var(--color-text-primary)',margin:0}}>Indicadores clave de desempeño</h1>
        </div>
        <div style={{fontSize:11,color:'var(--color-text-secondary)',display:'flex',alignItems:'center',gap:6}}>
          <i className="ti ti-database" style={{fontSize:13}}/> {loading?'Cargando...':`${d?.total||0} equipos · ${d?.totalMant||0} mantenimientos`}
        </div>
      </div>

      {/* Resumen siempre visible */}
      <div style={{padding:'16px 28px 0',display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
        {[
          {label:'Disponibilidad', val:loading?'—':d?.disponibilidad+'%', sub:`${d?.operativos||0}/${d?.total||0} operativos`, color:semaforo(d?.disponibilidad||0,95)},
          {label:'MTBF',           val:loading?'—':(d?.mtbf||0)+' días', sub:'Entre fallas',                                    color:C.az},
          {label:'MTTR',           val:loading?'—':(d?.mttr||0)+' h',    sub:'Tiempo de reparacion',                            color:semaforo(d?.mttr||0,4,true)},
          {label:'Cumplimiento PM',val:loading?'—':d?.cumplimientoPM+'%',sub:`${d?.pmEjecutados||0}/${d?.pmRequeridos||0} PM criticos`, color:semaforo(d?.cumplimientoPM||0,90)},
          {label:'Vida util critica',val:loading?'—':d?.vidaCriticos||0, sub:'>80% vida consumida',                             color:d?.vidaCriticos>0?C.ro:C.ve},
          {label:'OTs vencidas',   val:loading?'—':d?.vencidos||0,       sub:'Sin ejecutar',                                    color:d?.vencidos>0?C.ro:C.ve},
        ].map((k,i) => (
          <Card key={i} style={{padding:'14px 16px'}}>
            <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:500,color:k.color,lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{padding:'14px 28px 0'}}>
        <div style={{display:'flex',gap:4,background:'var(--color-background-secondary)',borderRadius:10,padding:4,width:'fit-content'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?500:400,background:tab===t.id?'var(--color-background-primary)':'transparent',color:tab===t.id?C.az:'var(--color-text-secondary)',boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 0.15s'}}>
              <i className={'ti '+t.icon} style={{fontSize:13}}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 28px 28px',display:'flex',flexDirection:'column',gap:14}}>

        {/* DISPONIBILIDAD */}
        {tab==='disponibilidad' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {label:'Disponibilidad',val:d?.disponibilidad||0,max:100,meta:95,unit:'%'},
                {label:'MTBF',         val:d?.mtbf||0,          max:90, unit:'días', color:C.az},
                {label:'MTTR',         val:d?.mttr||0,          max:8,  unit:'h',   meta:4,inv:true},
                {label:'Ratio Prev/Corr',val:d?.ratioPrevCorr||0,max:6,unit:':1',  color:d?.ratioPrevCorr>=4?C.ve:d?.ratioPrevCorr>=2?C.na:C.ro},
              ].map((g,i)=>(
                <Card key={i} style={{textAlign:'center'}}>
                  <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{g.label}</div>
                  {loading ? <Sk h={100}/> : <Gauge {...g} size={100}/>}
                  <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>
                    {g.label==='Disponibilidad'?'Meta ≥95%':g.label==='MTTR'?'Meta <4h criticos':g.label==='MTBF'?'Meta >30 dias':'Meta ≥4:1'}
                  </div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Disponibilidad por servicio</div>
              {loading?<Sk h={220}/>:<div style={{position:'relative',height:220}}><canvas id="c-svc" role="img" aria-label="Disponibilidad por servicio">Datos de disponibilidad por servicio hospitalario.</canvas></div>}
            </Card>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Estado del parque tecnologico</div>
                {loading?<Sk h={160}/>:<div style={{position:'relative',height:160}}><canvas id="c-estado" role="img" aria-label="Estado equipos">Estado de equipos.</canvas></div>}
                <div style={{display:'flex',gap:12,marginTop:10,flexWrap:'wrap',fontSize:11,color:'var(--color-text-secondary)'}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ve,display:'inline-block'}}/> Operativo {d?.operativos||0}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.na,display:'inline-block'}}/> En mant. {d?.enMant||0}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ro,display:'inline-block'}}/> Fuera {d?.fuera||0}</span>
                </div>
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Clasificacion por riesgo INVIMA</div>
                {loading?<Sk h={160}/>:<>
                  <Bar label="Clase III — Soporte vital"  val={`${d?.claseIII||0} equipos`}  pct={d?.total>0?Math.round(((d?.claseIII||0)/d?.total)*100):0}  color={C.ro}/>
                  <Bar label="Clase IIb — Alto riesgo"    val={`${d?.claseIIb||0} equipos`}   pct={d?.total>0?Math.round(((d?.claseIIb||0)/d?.total)*100):0}   color='#EA580C'/>
                  <Bar label="Clase IIa — Moderado"       val={`${d?.claseIIa||0} equipos`}   pct={d?.total>0?Math.round(((d?.claseIIa||0)/d?.total)*100):0}   color={C.na}/>
                  <Bar label="Clase I — Bajo riesgo"      val={`${d?.claseI||0} equipos`}     pct={d?.total>0?Math.round(((d?.claseI||0)/d?.total)*100):0}      color={C.ve}/>
                  <div style={{marginTop:10,padding:'8px 10px',borderRadius:8,background:C.azBg,fontSize:11,color:C.az}}>
                    {(d?.claseIIb||0)+(d?.claseIII||0)} equipos requieren PM semestral obligatorio
                  </div>
                </>}
              </Card>
            </div>
          </>
        )}

        {/* MANTENIMIENTO */}
        {tab==='mantenimiento' && (
          <>
            {/* Alerta critica: correctivos superan preventivos */}
            {!loading && (d?.correctivos||0) > (d?.preventivos||0) && (
              <div style={{padding:'14px 18px',borderRadius:12,background:C.roBg,border:`0.5px solid ${C.ro}40`,display:'flex',alignItems:'flex-start',gap:12}}>
                <i className="ti ti-alert-triangle" style={{fontSize:18,color:C.ro,flexShrink:0,marginTop:1}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:C.ro,marginBottom:2}}>Alerta — Los correctivos superan a los preventivos</div>
                  <div style={{fontSize:11,color:'#991B1B'}}>El {d?.porTipo?.[1]?.pct||0}% de las OTs son correctivas vs {d?.porTipo?.[0]?.pct||0}% preventivas. La meta es minimo 80% preventivo. Esto incrementa costos hasta un 40% y reduce la disponibilidad del parque.</div>
                </div>
              </div>
            )}

            {/* Fila 1 — KPIs principales */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Total OTs registradas</div>
                <div style={{fontSize:32,fontWeight:500,color:C.az,lineHeight:1,marginBottom:4}}>{loading?'—':d?.totalMant||0}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Ordenes de trabajo historicas</div>
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Cumplimiento PM criticos</div>
                <div style={{fontSize:32,fontWeight:500,color:semaforo(d?.cumplimientoPM||0,90),lineHeight:1,marginBottom:4}}>{loading?'—':(d?.cumplimientoPM||0)+'%'}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{d?.pmEjecutados||0}/{d?.pmRequeridos||0} PM equipos alto riesgo</div>
                {!loading && <div style={{marginTop:8,padding:'4px 8px',borderRadius:6,background:(d?.cumplimientoPM||0)>=90?C.veBg:C.roBg,fontSize:10,color:(d?.cumplimientoPM||0)>=90?C.ve:C.ro,fontWeight:500}}>{(d?.cumplimientoPM||0)>=90?'✓ Cumple Res. 4816/2008':'✗ Incumple Res. 4816/2008'}</div>}
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Ratio preventivo / correctivo</div>
                <div style={{fontSize:32,fontWeight:500,color:(d?.ratioPrevCorr||0)>=4?C.ve:(d?.ratioPrevCorr||0)>=2?C.na:C.ro,lineHeight:1,marginBottom:4}}>{loading?'—':(d?.ratioPrevCorr||'0')+':1'}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Meta minimo 4:1 segun ACCE</div>
                {!loading && <div style={{marginTop:8,padding:'4px 8px',borderRadius:6,background:(d?.ratioPrevCorr||0)>=4?C.veBg:(d?.ratioPrevCorr||0)>=2?C.naBg:C.roBg,fontSize:10,color:(d?.ratioPrevCorr||0)>=4?C.ve:(d?.ratioPrevCorr||0)>=2?C.na:C.ro,fontWeight:500}}>{(d?.ratioPrevCorr||0)>=4?'Optimo':(d?.ratioPrevCorr||0)>=2?'Por mejorar':'Critico — accion requerida'}</div>}
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>OTs vencidas</div>
                <div style={{fontSize:32,fontWeight:500,color:(d?.vencidos||0)>0?C.ro:C.ve,lineHeight:1,marginBottom:4}}>{loading?'—':d?.vencidos||0}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Programadas sin ejecutar</div>
                {!loading && (d?.vencidos||0)>0 && <div style={{marginTop:8,padding:'4px 8px',borderRadius:6,background:C.roBg,fontSize:10,color:C.ro,fontWeight:500}}>Accion inmediata requerida</div>}
              </Card>
            </div>

            {/* Fila 2 — Gauge cumplimiento + donut tipos */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <Card style={{textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Cumplimiento PM</div>
                {loading?<Sk h={110}/>:<Gauge val={d?.cumplimientoPM||0} max={100} meta={90} unit="%" size={110}/>}
                <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>Res. 4816/2008 — Meta 90%</div>
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Distribucion por tipo</div>
                {loading?<Sk h={110}/>:<div style={{position:'relative',height:110}}><canvas id="c-tipos" role="img" aria-label="Tipos de mantenimiento">Tipos de mantenimiento.</canvas></div>}
                <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:8,fontSize:11,color:'var(--color-text-secondary)'}}>
                  <span style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:C.ro,display:'inline-block'}}/> Correctivo</span>
                    <span style={{fontWeight:500,color:C.ro}}>{d?.porTipo?.[1]?.pct||0}% — {d?.correctivos||0} OTs</span>
                  </span>
                  <span style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:C.ve,display:'inline-block'}}/> Preventivo</span>
                    <span style={{fontWeight:500,color:C.ve}}>{d?.porTipo?.[0]?.pct||0}% — {d?.preventivos||0} OTs</span>
                  </span>
                  <span style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:C.mo,display:'inline-block'}}/> Calibracion</span>
                    <span style={{fontWeight:500,color:C.mo}}>{d?.porTipo?.[2]?.pct||0}% — {d?.calibraciones||0} OTs</span>
                  </span>
                </div>
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Estado de ordenes</div>
                {loading?<Sk h={110}/>:<>
                  <Bar label="Completadas" val={`${d?.completados||0}`} pct={d?.totalMant>0?Math.round(((d?.completados||0)/d?.totalMant)*100):0} color={C.ve} right={C.ve}/>
                  <Bar label="Pendientes"  val={`${d?.pendientes||0}`}  pct={d?.totalMant>0?Math.round(((d?.pendientes||0)/d?.totalMant)*100):0}  color={C.na} right={C.na}/>
                  <Bar label="Vencidas"    val={`${d?.vencidos||0}`}    pct={d?.totalMant>0?Math.round(((d?.vencidos||0)/d?.totalMant)*100):1}    color={C.ro} right={C.ro}/>
                </>}
                <div style={{marginTop:10,padding:'8px 10px',borderRadius:8,background:C.veBg,fontSize:11,color:C.ve}}>
                  {d?.completados||0} OTs completadas al 100%
                </div>
              </Card>
            </div>

            {/* Fila 3 — Barras por mes */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Mantenimientos por mes — ultimos 8 meses</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:10}}>Preventivo vs correctivo ejecutados</div>
              <div style={{display:'flex',gap:12,marginBottom:10,fontSize:11,color:'var(--color-text-secondary)'}}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ve,display:'inline-block'}}/> Preventivo</span>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ro,display:'inline-block'}}/> Correctivo</span>
              </div>
              {loading?<Sk h={200}/>:<div style={{position:'relative',height:200}}><canvas id="c-mes" role="img" aria-label="Mantenimientos por mes">Mantenimientos por mes.</canvas></div>}
            </Card>

            {/* Fila 4 — Por servicio */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Mantenimientos por servicio</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Preventivo vs correctivo por area</div>
                {loading?<Sk h={200}/>:
                  (d?.mantPorServicio||[]).slice(0,6).map((s:any,i:number)=>{
                    const tot = s.prev+s.corr
                    const pctP = tot>0?Math.round((s.prev/tot)*100):0
                    const pctC = tot>0?Math.round((s.corr/tot)*100):0
                    return (
                      <div key={i} style={{marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>
                          <span style={{fontWeight:500,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%'}}>{s.label}</span>
                          <span>{tot} OTs</span>
                        </div>
                        <div style={{height:8,background:'var(--color-background-secondary)',borderRadius:4,overflow:'hidden',display:'flex'}}>
                          <div style={{height:8,background:C.ve,width:`${pctP}%`,transition:'width 0.8s'}}/>
                          <div style={{height:8,background:C.ro,width:`${pctC}%`,transition:'width 0.8s'}}/>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--color-text-secondary)',marginTop:3}}>
                          <span style={{color:C.ve}}>{pctP}% prev ({s.prev})</span>
                          <span style={{color:C.ro}}>{pctC}% corr ({s.corr})</span>
                        </div>
                      </div>
                    )
                  })
                }
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Top tipos de equipo con mas correctivos</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Equipos que generan mas intervenciones no planificadas</div>
                {loading?<Sk h={200}/>:
                  (d?.topCorrectivos||[]).slice(0,7).map((t:any,i:number)=>(
                    <div key={i} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                        <span style={{color:'var(--color-text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}}>{t.tipo}</span>
                        <span style={{fontWeight:500,color:i<2?C.ro:i<4?C.na:C.az,flexShrink:0}}>{t.corr} correctivos</span>
                      </div>
                      <div style={{height:5,background:'var(--color-background-secondary)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:5,borderRadius:3,background:i<2?C.ro:i<4?C.na:C.az,width:`${Math.round((t.corr/(d?.topCorrectivos?.[0]?.corr||1))*100)}%`}}/>
                      </div>
                    </div>
                  ))
                }
              </Card>
            </div>

            {/* Fila 5 — Diagnostico e interpretacion */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-stethoscope" style={{fontSize:16,color:C.az}}/>
                Diagnostico del programa de mantenimiento
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  {
                    titulo:'Ratio Prev/Corr actual',
                    valor:(d?.ratioPrevCorr||0)+':1',
                    meta:'Meta: 4:1',
                    estado:(d?.ratioPrevCorr||0)>=4?'optimo':(d?.ratioPrevCorr||0)>=2?'advertencia':'critico',
                    desc:(d?.ratioPrevCorr||0)>=4?'El programa preventivo es solido y eficiente.':(d?.ratioPrevCorr||0)>=2?'Se recomienda aumentar la frecuencia de PM para equipos de alto riesgo.':'El 73% de intervenciones son correctivas. Se recomienda restructurar el plan de PM urgente.',
                    icono:(d?.ratioPrevCorr||0)>=4?'ti-check':'ti-alert-triangle'
                  },
                  {
                    titulo:'Correctivos en Salas de Cirugia',
                    valor:'227 OTs',
                    meta:'El servicio mas critico',
                    estado:'critico',
                    desc:'Salas de Cirugia concentra el 31% de todos los correctivos. Priorizar PM semestral en equipos de este servicio.',
                    icono:'ti-urgent'
                  },
                  {
                    titulo:'Datos por completar',
                    valor:'Sin duracion',
                    meta:'Para MTTR real',
                    estado:'advertencia',
                    desc:'Ninguna OT tiene duracion registrada. Completar este campo permite calcular MTTR real y mejorar la planificacion.',
                    icono:'ti-clock-edit'
                  },
                ].map((item,i)=>{
                  const col = item.estado==='optimo'?C.ve:item.estado==='advertencia'?C.na:C.ro
                  const bg  = item.estado==='optimo'?C.veBg:item.estado==='advertencia'?C.naBg:C.roBg
                  return (
                    <div key={i} style={{padding:'14px',borderRadius:10,background:bg,border:`0.5px solid ${col}30`}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <i className={'ti '+item.icono} style={{fontSize:16,color:col}}/>
                        <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)'}}>{item.titulo}</div>
                      </div>
                      <div style={{fontSize:22,fontWeight:500,color:col,marginBottom:4}}>{item.valor}</div>
                      <div style={{fontSize:10,color:col,marginBottom:6,fontWeight:500}}>{item.meta}</div>
                      <div style={{fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.5}}>{item.desc}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Fila 6 — Plan de accion */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-list-check" style={{fontSize:16,color:C.az}}/>
                Plan de accion recomendado
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[
                  {prioridad:'Alta',color:C.ro,bg:C.roBg,accion:'Programar PM inmediato para los 227 correctivos en Salas de Cirugia',responsable:'Ingeniero Biomedico',plazo:'30 dias'},
                  {prioridad:'Alta',color:C.ro,bg:C.roBg,accion:'Registrar la duracion de cada OT para habilitar calculo de MTTR real',responsable:'Tecnico ejecutor',plazo:'Inmediato'},
                  {prioridad:'Media',color:C.na,bg:C.naBg,accion:'Aumentar PM preventivos en Monitor De Signos Vitales (124 equipos, 73 correctivos)',responsable:'Ingeniero Biomedico',plazo:'60 dias'},
                  {prioridad:'Media',color:C.na,bg:C.naBg,accion:'Asignar tecnico responsable a cada OT para trazabilidad completa',responsable:'Coordinador biomedico',plazo:'45 dias'},
                  {prioridad:'Baja',color:C.ve,bg:C.veBg,accion:'Documentar hallazgos y repuestos usados en cada intervencion correctiva',responsable:'Tecnico ejecutor',plazo:'90 dias'},
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',borderRadius:10,background:item.bg,border:`0.5px solid ${item.color}30`}}>
                    <span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:item.color,color:'#fff',flexShrink:0,whiteSpace:'nowrap'}}>{item.prioridad}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)',marginBottom:2}}>{item.accion}</div>
                      <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Responsable: {item.responsable}</div>
                    </div>
                    <div style={{flexShrink:0,textAlign:'right'}}>
                      <div style={{fontSize:10,color:item.color,fontWeight:500}}>{item.plazo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* VIDA UTIL */}
        {tab==='vida' && (
          <>
            {/* Alerta de datos faltantes */}
            <div style={{padding:'14px 18px',borderRadius:12,background:'#FFFBEB',border:'0.5px solid #FDE68A',display:'flex',alignItems:'flex-start',gap:12,marginBottom:2}}>
              <i className="ti ti-alert-triangle" style={{fontSize:18,color:C.na,flexShrink:0,marginTop:1}}/>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'#92400E',marginBottom:2}}>Año de adquisicion no registrado en {d?.total||0} equipos</div>
                <div style={{fontSize:11,color:'#A16207'}}>El calculo de vida util requiere el año de adquisicion de cada equipo. Ve a Inventario → editar equipo → completar el campo "Año de adquisicion". Los datos actuales usan vida util estandar OMS por tipo de equipo.</div>
              </div>
            </div>

            {/* Resumen por categoria */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              <Card style={{background:C.veBg,border:`0.5px solid ${C.ve}40`,textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:500,color:C.ve,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Vida saludable</div>
                <div style={{fontSize:40,fontWeight:500,color:C.ve,lineHeight:1,marginBottom:6}}>{loading?'—':d?.vidaSaludable||0}</div>
                <div style={{fontSize:11,color:'#71717A'}}>Equipos con menos del 60% vida consumida</div>
              </Card>
              <Card style={{background:C.naBg,border:`0.5px solid ${C.na}40`,textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:500,color:C.na,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>En advertencia</div>
                <div style={{fontSize:40,fontWeight:500,color:C.na,lineHeight:1,marginBottom:6}}>{loading?'—':d?.vidaAdvertencia||0}</div>
                <div style={{fontSize:11,color:'#71717A'}}>Equipos con 60-80% vida consumida</div>
              </Card>
              <Card style={{background:C.roBg,border:`0.5px solid ${C.ro}40`,textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:500,color:C.ro,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Critico — reemplazar</div>
                <div style={{fontSize:40,fontWeight:500,color:C.ro,lineHeight:1,marginBottom:6}}>{loading?'—':d?.vidaCriticos||0}</div>
                <div style={{fontSize:11,color:'#71717A'}}>Equipos con mas del 80% vida consumida</div>
              </Card>
            </div>

            {/* Donut + Top reemplazar */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:12}}>Distribucion de vida util</div>
                {loading?<Sk h={180}/>:<div style={{position:'relative',height:180}}><canvas id="c-vida" role="img" aria-label="Distribucion vida util equipos">Distribucion vida util.</canvas></div>}
                <div style={{display:'flex',gap:14,marginTop:10,fontSize:11,color:'var(--color-text-secondary)'}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ve,display:'inline-block'}}/> Saludable {loading?'':d?.vidaSaludable||0}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.na,display:'inline-block'}}/> Advertencia {loading?'':d?.vidaAdvertencia||0}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ro,display:'inline-block'}}/> Critico {loading?'':d?.vidaCriticos||0}</span>
                </div>
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Equipos prioritarios para reemplazo</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Basado en vida util estandar OMS por tipo</div>
                {loading?<Sk h={180}/>:<>
                  {(d?.topReemplazar||[]).length > 0 ? (d?.topReemplazar||[]).map((eq:any,i:number)=>(
                    <div key={eq.id} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%',color:'var(--color-text-secondary)'}}>{eq.nombre}</span>
                        <span style={{fontWeight:500,color:eq.pctVida>=90?C.ro:C.na,flexShrink:0}}>{eq.pctVida}%</span>
                      </div>
                      <div style={{height:6,background:'var(--color-background-secondary)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:6,borderRadius:3,background:eq.pctVida>=90?C.ro:'#EA580C',width:`${eq.pctVida}%`}}/>
                      </div>
                    </div>
                  )) : (
                    <div style={{textAlign:'center',padding:'24px',color:C.ve,fontSize:13}}>
                      <i className="ti ti-check" style={{fontSize:28,display:'block',marginBottom:8}}/>
                      Sin equipos en vida util critica
                    </div>
                  )}
                  <div style={{marginTop:8,padding:'7px 10px',borderRadius:8,background:'var(--color-background-secondary)',fontSize:11,color:'var(--color-text-secondary)'}}>
                    Ingresa el año de adquisicion en Inventario para mayor precision
                  </div>
                </>}
              </Card>
            </div>

            {/* Tabla vida util estandar por tipo — con conteo real */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Vida util estandar por tipo de equipo — inventario actual</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:14}}>Fuente: OMS, IETSI/EsSalud, ECRI Institute. Cantidad real de equipos en el inventario SYNAP.</div>
              {loading?<Sk h={300}/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'var(--color-background-secondary)'}}>
                      {['Tipo de equipo','Cantidad','Vida util OMS','Clase riesgo','Frec. mant.','Accion recomendada'].map(h=>(
                        <th key={h} style={{padding:'8px 14px',fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textAlign:'left',borderBottom:'0.5px solid var(--color-border-tertiary)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {tipo:'Monitor De Signos Vitales',   vu:'7-10',clase:'IIb',frec:'Semestral',accion:'PM al dia'},
                      {tipo:'Glucometro',                  vu:'3-5', clase:'IIa',frec:'Trimestral',accion:'Verificar calibracion'},
                      {tipo:'Bascula Mecanica',            vu:'10-15',clase:'I',frec:'Anual',accion:'Verificar calibracion'},
                      {tipo:'Laringoscopio',               vu:'7-10',clase:'IIb',frec:'Semestral',accion:'PM al dia'},
                      {tipo:'Succionador Portatil',        vu:'7-10',clase:'IIa',frec:'Semestral',accion:'PM al dia'},
                      {tipo:'Desfibrilador',               vu:'10-12',clase:'IIb',frec:'Semestral',accion:'PM critico'},
                      {tipo:'Ventilador Mecanico',         vu:'10-15',clase:'IIb',frec:'Semestral',accion:'PM critico'},
                      {tipo:'Maquina De Anestesia',        vu:'10-15',clase:'III',frec:'Semestral',accion:'PM critico'},
                      {tipo:'Electrobisturi',              vu:'7-10',clase:'IIb',frec:'Semestral',accion:'PM al dia'},
                      {tipo:'Incubadora Cerrada',          vu:'10-15',clase:'IIb',frec:'Semestral',accion:'PM critico'},
                      {tipo:'Bomba De Infusion',           vu:'7-10',clase:'IIb',frec:'Semestral',accion:'PM critico'},
                      {tipo:'Ecografo',                    vu:'7-10',clase:'IIb',frec:'Anual',accion:'PM al dia'},
                      {tipo:'Termohigrometro Digital',     vu:'5-7', clase:'I', frec:'Anual',accion:'Calibracion anual'},
                      {tipo:'Bomba De Nutricion Amika',    vu:'7-10',clase:'IIb',frec:'Semestral',accion:'PM al dia'},
                      {tipo:'Rayos X Portatil',            vu:'10-15',clase:'III',frec:'Anual',accion:'PM critico'},
                    ].map((row,i)=>{
                      const cantidad = d?.porTipoEquipo?.find((t:any)=>t.label===row.tipo)?.value || 0
                      const colorClase = row.clase==='III'?C.ro:row.clase==='IIb'?'#EA580C':row.clase==='IIa'?C.na:C.ve
                      const bgClase   = row.clase==='III'?C.roBg:row.clase==='IIb'?'#FFF7ED':row.clase==='IIa'?C.naBg:C.veBg
                      return (
                        <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',background:i%2===0?'var(--color-background-primary)':'var(--color-background-secondary)'}}>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'var(--color-text-primary)',maxWidth:200}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.tipo}</div>
                          </td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:cantidad>0?C.az:'var(--color-text-secondary)'}}>{cantidad>0?cantidad:'—'}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'var(--color-text-secondary)'}}>{row.vu} años</td>
                          <td style={{padding:'9px 14px'}}>
                            <span style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:20,background:bgClase,color:colorClase}}>{row.clase}</span>
                          </td>
                          <td style={{padding:'9px 14px',fontSize:11,color:'var(--color-text-secondary)'}}>{row.frec}</td>
                          <td style={{padding:'9px 14px'}}>
                            <span style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:20,background:row.accion.includes('critico')?C.roBg:row.accion.includes('PM al dia')?C.veBg:C.naBg,color:row.accion.includes('critico')?C.ro:row.accion.includes('PM al dia')?C.ve:C.na}}>{row.accion}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              <div style={{marginTop:14,padding:'10px 14px',borderRadius:8,background:C.azBg,border:`0.5px solid ${C.az}30`,fontSize:11,color:C.az,display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-info-circle" style={{fontSize:14,flexShrink:0}}/>
                Para ver el porcentaje exacto de vida util consumida por equipo, ingresa el año de adquisicion en el modulo de Inventario. La tabla de vida util se actualizara automaticamente.
              </div>
            </Card>

            {/* Como registrar el año */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-clipboard-list" style={{fontSize:16,color:C.az}}/>
                Como activar el calculo de vida util en SYNAP
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {[
                  {n:'1',titulo:'Ir a Inventario',desc:'Menu lateral → Activos → Inventario',icon:'ti-package'},
                  {n:'2',titulo:'Editar cada equipo',desc:'Click en el equipo → boton Editar',icon:'ti-edit'},
                  {n:'3',titulo:'Completar año adquisicion',desc:'Campo "Año de adquisicion" en el formulario',icon:'ti-calendar'},
                  {n:'4',titulo:'KPI se actualiza solo',desc:'El porcentaje de vida util se calcula automaticamente',icon:'ti-chart-bar'},
                ].map((step,i)=>(
                  <div key={i} style={{padding:'14px',borderRadius:10,background:'var(--color-background-secondary)',border:'0.5px solid var(--color-border-tertiary)'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:C.azBg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
                      <span style={{fontSize:13,fontWeight:500,color:C.az}}>{step.n}</span>
                    </div>
                    <i className={'ti '+step.icon} style={{fontSize:18,color:C.az,display:'block',marginBottom:6}}/>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)',marginBottom:3}}>{step.titulo}</div>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* COSTOS */}
        {tab==='costos' && (
          <>
            {/* Fila 1 — KPIs principales */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Costo total historico</div>
                <div style={{fontSize:26,fontWeight:500,color:C.az,marginBottom:4}}>{loading?'—':fmtCOP(d?.costoTotal||0)}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>COP — {d?.totalMant||0} ordenes de trabajo</div>
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Costo promedio por OT</div>
                <div style={{fontSize:26,fontWeight:500,color:C.mo,marginBottom:4}}>{loading?'—':fmtCOP(d?.costoProm||0)}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>COP por orden completada</div>
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Correctivo vs Total</div>
                <div style={{fontSize:26,fontWeight:500,color:+(d?.pctCostoCorr||0)>30?C.ro:C.ve,marginBottom:4}}>{loading?'—':(d?.pctCostoCorr||0)+'%'}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Meta menos del 30%. Actual: {fmtCOP(d?.costoCorr||0)}</div>
                {!loading&&+(d?.pctCostoCorr||0)>30&&<div style={{marginTop:8,padding:'5px 8px',borderRadius:6,background:C.roBg,fontSize:10,color:C.ro}}>Alerta — gasto correctivo elevado</div>}
              </Card>
              <Card>
                <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Inventario repuestos</div>
                <div style={{fontSize:26,fontWeight:500,color:C.cy,marginBottom:4}}>{loading?'—':fmtCOP(d?.valorInventarioRep||0)}</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{d?.repBajoMinimo||0} repuestos bajo minimo</div>
                {!loading&&(d?.repBajoMinimo||0)>0&&<div style={{marginTop:8,padding:'5px 8px',borderRadius:6,background:C.naBg,fontSize:10,color:C.na}}>Reabastecer {d.repBajoMinimo} items</div>}
              </Card>
            </div>

            {/* Fila 2 — Grafico evolucion mensual */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Evolucion del costo mensual — ultimos 8 meses</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Preventivo vs correctivo en COP</div>
              <div style={{display:'flex',gap:12,marginBottom:10,fontSize:11,color:'var(--color-text-secondary)'}}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ve,display:'inline-block'}}/> Preventivo</span>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ro,display:'inline-block'}}/> Correctivo</span>
              </div>
              {loading?<Sk h={200}/>:<div style={{position:'relative',height:200}}><canvas id="c-costo-mes" role="img" aria-label="Costo mensual preventivo vs correctivo">Evolucion costos por mes.</canvas></div>}
            </Card>

            {/* Fila 3 — Por tipo + por servicio */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Costo por tipo de mantenimiento</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Distribucion del gasto total</div>
                {loading?<Sk h={160}/>:<>
                  <Bar label={'Correctivo — '+d?.pctCostoCorr+'%'} val={fmtCOP(d?.costoCorr||0)} pct={+( d?.pctCostoCorr||0)} color={C.ro} right={+(d?.pctCostoCorr||0)>30?C.ro:C.na}/>
                  <Bar label={'Preventivo — '+d?.pctCostoPrev+'%'} val={fmtCOP(d?.costoPrev||0)} pct={+(d?.pctCostoPrev||0)} color={C.ve} right={C.ve}/>
                  <Bar label={'Calibracion — '+d?.pctCostoCal+'%'} val={fmtCOP(d?.costoCal||0)}  pct={+(d?.pctCostoCal||0)}  color={C.mo} right={C.mo}/>
                  <div style={{marginTop:12,padding:'10px 12px',borderRadius:8,background:+(d?.pctCostoCorr||0)>30?C.roBg:C.veBg,border:`0.5px solid ${+(d?.pctCostoCorr||0)>30?C.ro:C.ve}30`}}>
                    <div style={{fontSize:12,fontWeight:500,color:+(d?.pctCostoCorr||0)>30?C.ro:C.ve}}>
                      {+(d?.pctCostoCorr||0)>30?'⚠ El correctivo supera la meta del 30%':'✓ Distribucion de costos dentro del rango'}
                    </div>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:2}}>
                      {+(d?.pctCostoCorr||0)>30?'Aumentar PM reduce costos correctivos hasta un 40%':'Continuar con el programa de mantenimiento preventivo'}
                    </div>
                  </div>
                </>}
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Costo por servicio</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Top servicios por gasto acumulado</div>
                {loading?<Sk h={160}/>:<>
                  {(d?.costoPorServicio||[]).slice(0,6).map((s:any,i:number)=>{
                    const max = d?.costoPorServicio?.[0]?.costo||1
                    return <Bar key={i} label={s.label} val={fmtCOP(s.costo)} pct={Math.round((s.costo/max)*100)} color={i===0?C.ro:i===1?C.na:C.az}/>
                  })}
                </>}
              </Card>
            </div>

            {/* Fila 4 — Top equipos mas costosos */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Top equipos con mayor gasto en mantenimiento</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Equipos que concentran el mayor costo historico — candidatos a evaluar CMR</div>
              {loading?<Sk h={180}/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'var(--color-background-secondary)'}}>
                      {['#','Equipo','Servicio','Costo historico','% del total'].map(h=>(
                        <th key={h} style={{padding:'8px 14px',fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textAlign:'left',borderBottom:'0.5px solid var(--color-border-tertiary)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(d?.topEquiposCosto||[]).map((eq:any,i:number)=>{
                      const pct = d?.costoTotal>0?((eq.costo/d.costoTotal)*100).toFixed(1):0
                      return (
                        <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',background:i%2===0?'var(--color-background-primary)':'var(--color-background-secondary)'}}>
                          <td style={{padding:'9px 14px',fontSize:12,color:'var(--color-text-secondary)'}}>{i+1}</td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'var(--color-text-primary)',maxWidth:200}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{eq.nombre}</div>
                          </td>
                          <td style={{padding:'9px 14px',fontSize:11,color:'var(--color-text-secondary)'}}>{eq.servicio||'N/D'}</td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:i<3?C.ro:i<5?C.na:C.az}}>{fmtCOP(eq.costo)}</td>
                          <td style={{padding:'9px 14px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:60,height:5,background:'var(--color-background-secondary)',borderRadius:3}}>
                                <div style={{height:5,borderRadius:3,background:i<3?C.ro:i<5?C.na:C.az,width:`${Math.min(+pct*5,100)}%`}}/>
                              </div>
                              <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Fila 5 — Repuestos */}
            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Inventario de repuestos — valor y stock</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>Valor en COP por repuesto. Alerta roja = bajo minimo</div>
              {loading?<Sk h={160}/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'var(--color-background-secondary)'}}>
                      {['Repuesto','Stock actual','Stock minimo','Costo unitario','Valor total','Estado'].map(h=>(
                        <th key={h} style={{padding:'8px 14px',fontSize:10,fontWeight:500,color:'var(--color-text-secondary)',textAlign:'left',borderBottom:'0.5px solid var(--color-border-tertiary)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(d?.topRepuestos||[]).map((r:any,i:number)=>{
                      const bajo = r.stock <= r.minimo
                      return (
                        <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',background:bajo?C.roBg:i%2===0?'var(--color-background-primary)':'var(--color-background-secondary)'}}>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'var(--color-text-primary)',maxWidth:200}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.nombre}</div>
                          </td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:bajo?700:400,color:bajo?C.ro:'var(--color-text-primary)'}}>{r.stock}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'var(--color-text-secondary)'}}>{r.minimo}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'var(--color-text-secondary)'}}>{fmtCOP(r.costo)}</td>
                          <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:'var(--color-text-primary)'}}>{fmtCOP(r.valor)}</td>
                          <td style={{padding:'9px 14px'}}>
                            <span style={{fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:20,background:bajo?C.roBg:C.veBg,color:bajo?C.ro:C.ve}}>
                              {bajo?'Reponer':'OK'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}

        {/* NORMATIVA */}
        {tab==='normativa' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {norma:'Res. 4816/2008',val:d?.cumplimientoPM||0,meta:90,label:'PM equipos criticos',ok:(d?.cumplimientoPM||0)>=90},
                {norma:'Res. 3100/2019',val:d?.disponibilidad||0,meta:85,label:'Disponibilidad parque',ok:(d?.disponibilidad||0)>=85},
                {norma:'OTs vencidas',  val:d?.vencidos||0,      max:true,label:'Sin ejecutar',        ok:(d?.vencidos||0)===0},
              ].map((item,i)=>(
                <Card key={i} style={{background:item.ok?C.veBg:C.roBg,border:`0.5px solid ${item.ok?C.ve:C.ro}40`,textAlign:'center'}}>
                  <div style={{fontSize:10,fontWeight:500,color:item.ok?C.ve:C.ro,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{item.norma}</div>
                  {loading?<Sk h={90}/>:(
                    <svg width={90} height={90} viewBox="0 0 90 90" style={{display:'block',margin:'0 auto 6px'}} role="img" aria-label={`${item.norma} ${item.val}`}>
                      <circle cx="45" cy="45" r="35" fill="none" stroke={item.ok?'#BBF7D0':'#FECACA'} strokeWidth="9"/>
                      <circle cx="45" cy="45" r="35" fill="none" stroke={item.ok?C.ve:C.ro} strokeWidth="9" strokeDasharray={`${(item.max?(item.val===0?220:Math.max(220-(item.val*10),0)):((item.val/100)*220)).toFixed(0)} 220`} strokeDashoffset="-55" strokeLinecap="round" transform="rotate(-90 45 45)"/>
                      <text x="45" y="42" textAnchor="middle" fontSize="18" fontWeight="500" fill={item.ok?C.ve:C.ro}>{item.max?item.val:item.val+'%'}</text>
                      <text x="45" y="57" textAnchor="middle" fontSize="8" fill={item.ok?C.ve:C.ro}>{item.ok?'cumple':'revisar'}</text>
                    </svg>
                  )}
                  <div style={{fontSize:11,color:'#71717A'}}>{item.label}</div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',marginBottom:14}}>Marco normativo — Colombia</div>
              {[
                {norma:'Res. 4816/2008',titulo:'Tecnovigilancia INVIMA',desc:`PM semestral equipos IIb/III documentado. ${d?.pmEjecutados||0}/${d?.pmRequeridos||0} PM ejecutados. ${d?.vencidos||0} OTs vencidas.`,tipo:'obligatorio',ok:(d?.cumplimientoPM||0)>=90},
                {norma:'Res. 3100/2019',titulo:'Habilitacion IPS',desc:`Disponibilidad del parque tecnologico. Hoja de vida y manuales disponibles. Actual: ${d?.disponibilidad||0}%.`,tipo:'obligatorio',ok:(d?.disponibilidad||0)>=85},
                {norma:'Dec. 4725/2005',titulo:'Dispositivos medicos',desc:`Registro INVIMA vigente para equipos IIa, IIb, III. Verificar ${d?.vidaCriticos||0} equipos en vida util critica.`,tipo:'obligatorio',ok:(d?.vidaCriticos||0)<10},
                {norma:'Res. 2003/2014',titulo:'Condiciones de habilitacion',desc:'Define estandares de dotacion de equipos biomedicos segun servicio habilitado.',tipo:'obligatorio',ok:true},
                {norma:'ISO 13485:2016',titulo:'Gestion de calidad',desc:'Control de equipos de medicion y seguimiento del ciclo de vida. Recomendado para acreditacion ICONTEC.',tipo:'recomendado',ok:true},
                {norma:'IEC 60601-1',  titulo:'Seguridad electrica',desc:'Corriente de fuga max 100 μA. Verificar en PM de equipos clase IIb y III.',tipo:'recomendado',ok:true},
              ].map((item,i)=>(
                <div key={i} style={{display:'flex',gap:14,padding:'12px 14px',borderRadius:10,background:item.tipo==='obligatorio'?(item.ok?C.veBg:C.roBg):'var(--color-background-secondary)',border:`0.5px solid ${item.tipo==='obligatorio'?(item.ok?C.ve:C.ro):'var(--color-border-tertiary)'}30`,marginBottom:8}}>
                  <div style={{flexShrink:0,minWidth:110}}>
                    <span style={{fontSize:9,fontWeight:500,padding:'2px 7px',borderRadius:20,background:item.tipo==='obligatorio'?C.ro:C.ve,color:'#fff'}}>{item.tipo==='obligatorio'?'OBLIGATORIO':'RECOMENDADO'}</span>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)',marginTop:5}}>{item.norma}</div>
                    {item.tipo==='obligatorio'&&<div style={{fontSize:10,fontWeight:500,color:item.ok?C.ve:C.ro,marginTop:3}}>{item.ok?'✓ Cumple':'✗ Revisar'}</div>}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)',marginBottom:2}}>{item.titulo}</div>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

      </div>
    </div>
  )
}
