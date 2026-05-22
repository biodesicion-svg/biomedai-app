'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Activity, Package, Search, ChevronRight, ChevronDown, Clock, Calendar, Users } from 'lucide-react'

const alertaColor: Record<string,{bg:string;text:string;border:string;label:string}> = {
  critico: {bg:'#ef444415',text:'#f87171',border:'#ef444430',label:'Crítico'},
  alto:    {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30',label:'Alto'},
  medio:   {bg:'#818cf815',text:'#818cf8',border:'#818cf830',label:'Medio'},
  bajo:    {bg:'#10b98115',text:'#4ade80',border:'#10b98130',label:'Bajo'},
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function GaugeRing({ score, size=100 }: {score:number;size?:number}) {
  const color = score>=70?'#ef4444':score>=45?'#f59e0b':score>=25?'#818cf8':'#10b981'
  const r=size*0.4, circ=2*Math.PI*r, dash=(score/100)*circ
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2d3d" strokeWidth={size*0.1}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute text-center">
        <div className="font-black" style={{color, fontSize:size*0.2}}>{score}</div>
        <div style={{fontSize:size*0.09, color:'#3d5166'}}>RIESGO</div>
      </div>
    </div>
  )
}

function LineCompareChart({ actual, prediccion, labels, height=160 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  const w=600, h=height, padX=30, padY=20
  function getPath(data: number[]) {
    return data.map((v,i)=>{
      const x=padX+(i/(data.length-1))*(w-padX*2)
      const y=padY+((max-v)/max)*(h-padY*2)
      return `${i===0?'M':'L'} ${x} ${y}`
    }).join(' ')
  }
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height}}>
        {[0,25,50,75,100].map(pct=>{
          const y=padY+((100-pct)/100)*(h-padY*2)
          return <g key={pct}>
            <line x1={padX} y1={y} x2={w-padX} y2={y} stroke="#1e2d3d" strokeWidth={1}/>
            <text x={padX-5} y={y+4} fontSize={8} fill="#3d5166" textAnchor="end">{Math.round((pct/100)*max)}</text>
          </g>
        })}
        <path d={`${getPath(prediccion)} L ${padX+((prediccion.length-1)/(prediccion.length-1))*(w-padX*2)} ${h-padY} L ${padX} ${h-padY} Z`} fill="#818cf820"/>
        <path d={getPath(prediccion)} fill="none" stroke="#818cf8" strokeWidth={2.5} strokeDasharray="6,3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={getPath(actual)} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {actual.map((v:number,i:number)=>{
          const x=padX+(i/(actual.length-1))*(w-padX*2)
          const y=padY+((max-v)/max)*(h-padY*2)
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#f87171" stroke="#080e16" strokeWidth={1.5}/>
        })}
        {prediccion.map((v:number,i:number)=>{
          const x=padX+(i/(prediccion.length-1))*(w-padX*2)
          const y=padY+((max-v)/max)*(h-padY*2)
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#818cf8" stroke="#080e16" strokeWidth={1.5}/>
        })}
        {labels.map((label:string,i:number)=>{
          const x=padX+(i/(labels.length-1))*(w-padX*2)
          return <text key={i} x={x} y={h-2} fontSize={9} fill="#3d5166" textAnchor="middle">{label}</text>
        })}
      </svg>
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2"><div className="w-6 h-0.5" style={{background:'#f87171'}}/><span className="text-xs" style={{color:'#3d5166'}}>Fallas actuales 2025</span></div>
        <div className="flex items-center gap-2"><div className="w-6 h-0.5 border-t-2 border-dashed" style={{borderColor:'#818cf8'}}/><span className="text-xs" style={{color:'#3d5166'}}>Predicción 2026</span></div>
      </div>
    </div>
  )
}

function DoubleBarChart({ actual, prediccion, labels, height=140 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{height}}>
        {labels.map((label:string,i:number)=>(
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end gap-0.5" style={{height:height-18}}>
              <div className="flex-1 rounded-t-sm" style={{height:`${(actual[i]/max)*100}%`,background:'#f87171',opacity:0.8,minHeight:actual[i]>0?'3px':'0'}}/>
              <div className="flex-1 rounded-t-sm" style={{height:`${(prediccion[i]/max)*100}%`,background:'#818cf8',opacity:0.8,minHeight:prediccion[i]>0?'3px':'0'}}/>
            </div>
            <div style={{fontSize:'9px',color:'#3d5166',textAlign:'center'}}>{label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{background:'#f87171'}}/><span className="text-xs" style={{color:'#3d5166'}}>2025 actual</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{background:'#818cf8'}}/><span className="text-xs" style={{color:'#3d5166'}}>2026 predicción</span></div>
      </div>
    </div>
  )
}

export default function PrediccionPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'general'|'equipos'|'servicios'|'repuestos'>('general')
  const [search, setSearch] = useState('')
  const [equipoSel, setEquipoSel] = useState<any>(null)
  const [serviciosAbiertos, setServiciosAbiertos] = useState<Record<string,boolean>>({})

  useEffect(()=>{
    fetch('/api/prediccion').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const corrActual    = data?.tendencia?.correctivos || Array(12).fill(0)
  const prevActual    = data?.tendencia?.preventivos || Array(12).fill(0)
  const corrPrediccion = corrActual.map((v:number)=>Math.round(v*1.18+1))
  const prevPrediccion = prevActual.map((v:number)=>Math.round(v*1.35+2))
  const totalCorrActual = corrActual.reduce((a:number,b:number)=>a+b,0)
  const totalCorrPred   = corrPrediccion.reduce((a:number,b:number)=>a+b,0)

  // Agrupar equipos por servicio
  const equiposPorServicio: Record<string,any[]> = {}
  const equiposFiltrados = (data?.equipoRiesgo||[]).filter((e:any)=>
    !search || e.nombre.toLowerCase().includes(search.toLowerCase()) || e.servicio?.toLowerCase().includes(search.toLowerCase())
  )
  equiposFiltrados.forEach((e:any)=>{
    const svc = e.servicio || 'Sin servicio'
    if (!equiposPorServicio[svc]) equiposPorServicio[svc]=[]
    equiposPorServicio[svc].push(e)
  })
  const serviciosOrdenados = Object.entries(equiposPorServicio)
    .sort(([,a],[,b])=>Math.max(...b.map((e:any)=>e.score))-Math.max(...a.map((e:any)=>e.score)))

  function toggleServicio(svc:string){
    setServiciosAbiertos(prev=>({...prev,[svc]:!prev[svc]}))
  }

  // Detalle del equipo seleccionado
  function DetalleEquipo({e}: {e:any}) {
    const ac = alertaColor[e.alerta]
    const pctVida = e.pctVida
    const vidaRestante = e.vidaUtil ? e.vidaUtil - e.edadAnios : null
    const color = e.score>=70?'#ef4444':e.score>=45?'#f59e0b':e.score>=25?'#818cf8':'#10b981'

    // Similares del mismo servicio
    const similares = (data?.equipoRiesgo||[])
      .filter((eq:any)=>eq.servicio===e.servicio && eq.id!==e.id)
      .slice(0,3)

    // Próximos mantenimientos (simulados basados en frecuencia)
    const hoy = new Date()
    const proximos = [
      {tipo:'Preventivo', fecha: new Date(hoy.getTime()+30*24*3600000).toLocaleDateString('es-CO',{month:'short',day:'numeric'}), dias:30, color:'#4ade80'},
      {tipo:'Calibración', fecha: new Date(hoy.getTime()+90*24*3600000).toLocaleDateString('es-CO',{month:'short',day:'numeric'}), dias:90, color:'#fcd34d'},
      {tipo:'Preventivo', fecha: new Date(hoy.getTime()+180*24*3600000).toLocaleDateString('es-CO',{month:'short',day:'numeric'}), dias:180, color:'#4ade80'},
      {tipo:'Correctivo est.', fecha: e.fechaFalla, dias:e.diasParaFalla, color:'#f87171'},
    ].sort((a,b)=>a.dias-b.dias)

    // Datos para gráfica mensual del equipo
    const eqCorr = MESES.map((_,i)=> i < 6 ? Math.max(0,Math.round((e.correctivos/Math.max(6,1))*1)) : 0)
    const eqPred = eqCorr.map((v:number)=>Math.round(v*1.3+0.3))

    return (
      <div className="overflow-y-auto" style={{maxHeight:'78vh'}}>
        {/* Header */}
        <div className="px-5 py-4 sticky top-0 z-10" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
          <div className="flex items-center gap-3">
            <GaugeRing score={e.score} size={70}/>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{e.nombre}</div>
              <div className="text-xs" style={{color:'#3d5166'}}>{e.servicio} · {e.marca||'—'}</div>
              <span className="text-xs px-2 py-0.5 rounded font-semibold mt-1 inline-block"
                style={{background:ac.bg,color:ac.text,border:`1px solid ${ac.border}`}}>
                Riesgo {ac.label}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Prob. falla 90d</div>
              <div className="text-2xl font-black" style={{color:e.probFalla>=70?'#f87171':e.probFalla>=45?'#fcd34d':'#4ade80'}}>{e.probFalla}%</div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* 1. VIDA ÚTIL */}
          <div className="rounded-xl p-4" style={{background:'#111827', border:'1px solid #1e2d3d'}}>
            <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'#7a9bb5'}}>
              <Clock className="w-3.5 h-3.5"/> Vida útil consumida vs restante
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{color:'#3d5166'}}>Consumido</span>
                  <span className="font-bold" style={{color:pctVida>=80?'#f87171':pctVida>=60?'#fcd34d':'#4ade80'}}>{pctVida}%</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden" style={{background:'#1e2d3d'}}>
                  <div className="h-4 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{
                      width:`${pctVida}%`,
                      background: pctVida>=80?'linear-gradient(90deg,#f59e0b,#ef4444)':pctVida>=60?'linear-gradient(90deg,#fcd34d,#f59e0b)':'linear-gradient(90deg,#10b981,#4ade80)',
                      minWidth:'20px'
                    }}>
                    <span className="text-white font-bold" style={{fontSize:'9px'}}>{e.edadAnios}a</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{color:'#3d5166'}}>0 años</span>
                  <span style={{color:vidaRestante!==null&&vidaRestante<=2?'#f87171':'#3d5166'}}>
                    {vidaRestante!==null
                      ? vidaRestante>0?`Quedan ${vidaRestante} años`:'⚠ Vida útil vencida'
                      : `${e.edadAnios} años en uso`
                    }
                  </span>
                  <span style={{color:'#3d5166'}}>{e.vidaUtil||'?'} años</span>
                </div>
              </div>
            </div>
            {vidaRestante!==null && vidaRestante<=2 && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{background:'#ef444410',color:'#fca5a5',border:'1px solid #ef444430'}}>
                ⚠ Este equipo vence su vida útil en {vidaRestante<=0?'este año':`${vidaRestante} año(s)`}. Evaluar reemplazo.
              </div>
            )}
          </div>

          {/* 2. SEMÁFORO DE RIESGO */}
          <div className="rounded-xl p-4" style={{background:'#111827', border:'1px solid #1e2d3d'}}>
            <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'#7a9bb5'}}>
              <Activity className="w-3.5 h-3.5"/> Score de riesgo con justificación
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black"
                style={{background:ac.bg, color:ac.text, border:`2px solid ${ac.border}`}}>
                {e.score}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold mb-1" style={{color:ac.text}}>Riesgo {ac.label}</div>
                <div className="space-y-1">
                  {[
                    {label:'Vida útil consumida', valor:Math.round(pctVida*0.35), max:35, color:pctVida>=80?'#f87171':'#4ade80'},
                    {label:'Ratio correctivos', valor:Math.round(e.correctivos>0?30:0), max:35, color:e.correctivos>0?'#f87171':'#4ade80'},
                    {label:'Clase de riesgo INVIMA', valor:e.riesgo==='alto'?30:e.riesgo==='medio'?15:5, max:30, color:e.riesgo==='alto'?'#f87171':'#fcd34d'},
                  ].map(f=>(
                    <div key={f.label} className="flex items-center gap-2">
                      <div className="text-xs w-36 truncate" style={{color:'#3d5166'}}>{f.label}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{background:'#1e2d3d'}}>
                        <div className="h-1.5 rounded-full" style={{width:`${(f.valor/f.max)*100}%`, background:f.color}}/>
                      </div>
                      <div className="text-xs font-mono w-8 text-right" style={{color:f.color}}>{f.valor}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed" style={{background:'#0d1626',color:'#7a9bb5'}}>
              <strong style={{color:ac.text}}>💡 </strong>
              {e.alerta==='critico'
                ? `Intervención urgente requerida. Falla probable en ~${e.diasParaFalla} días. Programar mantenimiento preventivo inmediato y evaluar reemplazo.`
                : e.alerta==='alto'
                ? `Inspección técnica recomendada en los próximos 15 días. Verificar componentes críticos y asegurar stock de repuestos.`
                : e.alerta==='medio'
                ? `Mantener plan de mantenimiento preventivo. Monitoreo mensual de indicadores de funcionamiento.`
                : `Equipo en buen estado predictivo. Continuar con cronograma establecido.`
              }
            </div>
          </div>

          {/* 3. COMPARATIVA CON SIMILARES */}
          {similares.length > 0 && (
            <div className="rounded-xl p-4" style={{background:'#111827', border:'1px solid #1e2d3d'}}>
              <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'#7a9bb5'}}>
                <Users className="w-3.5 h-3.5"/> Comparativa con equipos similares — {e.servicio}
              </div>
              <div className="space-y-2">
                {/* Equipo actual */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{background:'#0d948815', border:'1px solid #0d948830'}}>
                  <div className="w-2 h-2 rounded-full" style={{background:'#2dd4bf'}}/>
                  <div className="flex-1 text-xs font-bold truncate" style={{color:'#2dd4bf'}}>{e.nombre} (este)</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{color:ac.text}}>{e.score} pts</span>
                    <div className="w-20 h-1.5 rounded-full" style={{background:'#1e2d3d'}}>
                      <div className="h-1.5 rounded-full" style={{width:`${e.score}%`, background:ac.text}}/>
                    </div>
                  </div>
                </div>
                {similares.map((sim:any,i:number)=>{
                  const sac = alertaColor[sim.alerta]
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
                      style={{background:'#0d1626'}}
                      onClick={()=>setEquipoSel(sim)}>
                      <div className="w-2 h-2 rounded-full" style={{background:sac.text}}/>
                      <div className="flex-1 text-xs truncate" style={{color:'#7a9bb5'}}>{sim.nombre}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{color:sac.text}}>{sim.score} pts</span>
                        <div className="w-20 h-1.5 rounded-full" style={{background:'#1e2d3d'}}>
                          <div className="h-1.5 rounded-full" style={{width:`${sim.score}%`, background:sac.text}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. LÍNEA DE TIEMPO */}
          <div className="rounded-xl p-4" style={{background:'#111827', border:'1px solid #1e2d3d'}}>
            <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'#7a9bb5'}}>
              <Calendar className="w-3.5 h-3.5"/> Línea de tiempo — Próximas intervenciones
            </div>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5" style={{background:'linear-gradient(to bottom, #0d9488, #1e2d3d)'}}/>
              <div className="space-y-3">
                {proximos.map((p,i)=>(
                  <div key={i} className="flex items-start gap-4 pl-8 relative">
                    <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{background:p.color+'20', border:`2px solid ${p.color}`, top:0}}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{background:p.color}}/>
                    </div>
                    <div className="flex-1 rounded-lg px-3 py-2" style={{background:'#0d1626'}}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{color:p.color}}>{p.tipo}</span>
                        <span className="text-xs font-mono" style={{color:'#3d5166'}}>{p.fecha}</span>
                      </div>
                      <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>En ~{p.dias} días</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. GRÁFICA FALLAS HISTÓRICAS VS PREDICCIÓN */}
          <div className="rounded-xl p-4" style={{background:'#111827', border:'1px solid #1e2d3d'}}>
            <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'#7a9bb5'}}>
              <TrendingUp className="w-3.5 h-3.5"/> Correctivos actuales vs predicción 2026
            </div>
            <DoubleBarChart actual={eqCorr} prediccion={eqPred} labels={MESES} height={90}/>
            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{background:'#0d1626', color:'#3d5166'}}>
              Sin plan preventivo se esperan <strong style={{color:'#818cf8'}}>{eqPred.reduce((a:number,b:number)=>a+b,0)} intervenciones</strong> en 2026
              vs <strong style={{color:'#f87171'}}>{eqCorr.reduce((a:number,b:number)=>a+b,0)} actuales</strong>.
            </div>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{color:'#3d5166'}}>BioMed AI</span>
            <span style={{color:'#1e2d3d'}}>/</span>
            <span className="text-xs font-medium" style={{color:'#2dd4bf'}}>Predicción</span>
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>Análisis Predictivo de Fallas</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{background:'#0d948815', border:'1px solid #0d948830', color:'#2dd4bf'}}>
          <Activity className="w-3.5 h-3.5"/>
          Modelo estadístico activo
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-3"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        {[
          {id:'general',   label:'🔮 Vista General'},
          {id:'equipos',   label:'🔧 Por Equipo'},
          {id:'servicios', label:'🏥 Por Servicio'},
          {id:'repuestos', label:'📦 Repuestos Críticos'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab===t.id?'#0d948820':'transparent',
              color: tab===t.id?'#2dd4bf':'#3d5166',
              border: tab===t.id?'1px solid #0d948840':'1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-8 py-6 overflow-y-auto">

        {/* ── VISTA GENERAL ── */}
        {tab==='general' && (
          <div className="space-y-5 max-w-6xl">
            <div className="grid grid-cols-3 gap-4">
              {loading ? Array.from({length:6}).map((_,i)=>(
                <div key={i} className="rounded-xl p-5 animate-pulse h-28" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}/>
              )) : [
                {label:'Score riesgo global', value:data?.kpis?.scoreGlobal, unit:'/100', color:data?.kpis?.scoreGlobal>=70?'#f87171':data?.kpis?.scoreGlobal>=45?'#fcd34d':'#4ade80', sub:'Promedio del parque'},
                {label:'Equipos críticos', value:data?.kpis?.criticos, unit:'', color:'#f87171', sub:'Intervención urgente'},
                {label:'Fallas esperadas 30d', value:data?.kpis?.fallaEsperada30, unit:'', color:'#fcd34d', sub:'Basado en tendencia'},
                {label:'Fallas esperadas 90d', value:data?.kpis?.fallaEsperada90, unit:'', color:'#fb923c', sub:'Proyección trimestral'},
                {label:'Incremento correctivos 2026', value:`+${Math.round(((totalCorrPred-totalCorrActual)/Math.max(totalCorrActual,1))*100)}%`, unit:'', color:'#f87171', sub:`${totalCorrActual} → ${totalCorrPred} anuales`},
                {label:'Equipos analizados', value:data?.kpis?.totalEquipos, unit:'', color:'#2dd4bf', sub:'Con modelo predictivo'},
              ].map(k=>(
                <div key={k.label} className="rounded-xl p-5 relative overflow-hidden" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:k.color,opacity:0.6}}/>
                  <div className="text-2xl font-black mb-1" style={{color:k.color}}>{k.value}{k.unit&&<span className="text-sm ml-1">{k.unit}</span>}</div>
                  <div className="text-xs font-bold mb-0.5" style={{color:'#7a9bb5'}}>{k.label}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Gráfica comparativa línea */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Comparativa: Fallas 2025 vs Predicción 2026</div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Proyección mensual sin intervención preventiva</div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="text-right"><div className="font-bold" style={{color:'#f87171'}}>{totalCorrActual}</div><div style={{color:'#3d5166'}}>Corr. 2025</div></div>
                  <div className="text-right"><div className="font-bold" style={{color:'#818cf8'}}>{totalCorrPred}</div><div style={{color:'#3d5166'}}>Pred. 2026</div></div>
                </div>
              </div>
              {loading ? <div className="animate-pulse rounded" style={{height:160,background:'#1e2d3d'}}/> : <LineCompareChart actual={corrActual} prediccion={corrPrediccion} labels={MESES} height={160}/>}
            </div>

            {/* Barras + Escenarios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Correctivos por Mes — Actual vs Predicción</div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>Rojo=2025 · Morado=predicción 2026</div>
                {loading ? <div className="animate-pulse rounded" style={{height:140,background:'#1e2d3d'}}/> : <DoubleBarChart actual={corrActual} prediccion={corrPrediccion} labels={MESES} height={140}/>}
              </div>
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Impacto del Mantenimiento Preventivo</div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>Reducción estimada de correctivos en 2026</div>
                {loading ? <div className="animate-pulse rounded" style={{height:140,background:'#1e2d3d'}}/> : (
                  <div className="space-y-3">
                    {[
                      {label:'Sin plan preventivo', pct:100, color:'#ef4444', grad:'linear-gradient(90deg,#ef4444,#dc2626)'},
                      {label:'Preventivo básico (50%)', pct:65, color:'#f59e0b', grad:'linear-gradient(90deg,#f59e0b,#d97706)'},
                      {label:'Preventivo completo (80%+)', pct:35, color:'#16a34a', grad:'linear-gradient(90deg,#16a34a,#15803d)'},
                    ].map(s=>(
                      <div key={s.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span style={{color:'#7a9bb5'}}>{s.label}</span>
                          <span className="font-bold" style={{color:s.color}}>{Math.round(totalCorrPred*(s.pct/100))} fallas</span>
                        </div>
                        <div className="h-5 rounded-lg overflow-hidden" style={{background:'#1e2d3d'}}>
                          <div className="h-5 rounded-lg flex items-center px-2" style={{width:`${s.pct}%`,background:s.grad,minWidth:'30px'}}>
                            <span className="text-white font-bold" style={{fontSize:'10px'}}>{s.pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-lg p-2.5 mt-1" style={{background:'#0d948810',border:'1px solid #0d948830'}}>
                      <div className="text-xs" style={{color:'#2dd4bf'}}>
                        💡 Plan preventivo completo: reducción del <strong style={{color:'#4ade80'}}>{Math.round(((totalCorrPred-Math.round(totalCorrPred*0.35))/totalCorrPred)*100)}%</strong> de fallas · Ahorro ≈ <strong style={{color:'#4ade80'}}>${(((totalCorrPred-Math.round(totalCorrPred*0.35))*850000)/1000000).toFixed(1)}M COP</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top 5 críticos */}
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4 flex items-center justify-between" style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                <div>
                  <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Top Equipos — Mayor Riesgo</div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Ordenados por score predictivo</div>
                </div>
                <button onClick={()=>setTab('equipos')} className="text-xs flex items-center gap-1" style={{color:'#2dd4bf'}}>
                  Ver todos <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {loading ? Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                    <div className="w-20 h-16 rounded" style={{background:'#1e2d3d'}}/>
                    <div className="flex-1 space-y-2"><div className="h-4 w-48 rounded" style={{background:'#1e2d3d'}}/><div className="h-3 w-32 rounded" style={{background:'#1e2d3d'}}/></div>
                  </div>
                )) : (data?.equipoRiesgo||[]).slice(0,5).map((e:any,i:number)=>{
                  const ac=alertaColor[e.alerta]
                  return (
                    <div key={i} className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
                      onClick={()=>{setEquipoSel(e);setTab('equipos')}}>
                      <GaugeRing score={e.score} size={80}/>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold" style={{color:'#e2e8f0'}}>{e.nombre}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{background:ac.bg,color:ac.text,border:`1px solid ${ac.border}`}}>{ac.label}</span>
                        </div>
                        <div className="text-xs mb-2" style={{color:'#3d5166'}}>{e.servicio} · {e.marca||''}</div>
                        <div className="flex items-center gap-4 text-xs">
                          <span style={{color:'#fcd34d'}}>⚡ Falla en ~{e.diasParaFalla} días</span>
                          <span style={{color:'#3d5166'}}>Vida útil: {e.pctVida}%</span>
                          <span style={{color:'#f87171'}}>Correctivos: {e.correctivos}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>Prob. falla 90d</div>
                        <div className="text-2xl font-black" style={{color:e.probFalla>=70?'#f87171':e.probFalla>=45?'#fcd34d':'#4ade80'}}>{e.probFalla}%</div>
                        <div className="text-xs" style={{color:'#3d5166'}}>~{e.fechaFalla}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── POR EQUIPO ── */}
        {tab==='equipos' && (
          <div className="flex gap-4" style={{height:'80vh'}}>

            {/* Lista agrupada por servicio */}
            <div className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-4 py-3 flex-shrink-0" style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'#3d5166'}}/>
                  <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{background:'#111827',border:'1px solid #1e2d3d',color:'#e2e8f0'}}/>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  Array.from({length:8}).map((_,i)=>(
                    <div key={i} className="px-4 py-3 animate-pulse">
                      <div className="h-3 w-32 rounded" style={{background:'#1e2d3d'}}/>
                    </div>
                  ))
                ) : serviciosOrdenados.map(([svc, eqs])=>{
                  const abierto = serviciosAbiertos[svc] !== false
                  const maxScore = Math.max(...eqs.map((e:any)=>e.score))
                  const criticos = eqs.filter((e:any)=>e.alerta==='critico').length
                  const svcColor = maxScore>=70?'#f87171':maxScore>=45?'#fcd34d':'#4ade80'
                  return (
                    <div key={svc}>
                      <button onClick={()=>toggleServicio(svc)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 transition-all"
                        style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                          style={{color:'#3d5166',transform:abierto?'rotate(0)':'rotate(-90deg)'}}/>
                        <div className="flex-1 text-left">
                          <div className="text-xs font-bold truncate" style={{color:'#e2e8f0'}}>{svc}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>{eqs.length} equipos{criticos>0?` · ${criticos} críticos`:''}</div>
                        </div>
                        <div className="text-xs font-bold w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{background:svcColor+'20',color:svcColor}}>{maxScore}</div>
                      </button>
                      {abierto && eqs.map((e:any,i:number)=>{
                        const ac=alertaColor[e.alerta]
                        const sel=equipoSel?.id===e.id
                        return (
                          <div key={i} onClick={()=>setEquipoSel(e)}
                            className="flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all"
                            style={{
                              background:sel?'#0d948815':'#080e16',
                              borderBottom:'1px solid #1e2d3d',
                              borderLeft:sel?'3px solid #0d9488':'3px solid transparent',
                              paddingLeft:sel?'13px':'16px'
                            }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{background:ac.bg,color:ac.text}}>{e.score}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate" style={{color:sel?'#2dd4bf':'#e2e8f0'}}>{e.nombre}</div>
                              <div className="text-xs" style={{color:'#3d5166'}}>{e.probFalla}% · {e.diasParaFalla}d</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detalle */}
            <div className="flex-1 rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d', background:'#0d1626'}}>
              {!equipoSel ? (
                <div className="flex flex-col items-center justify-center h-full" style={{color:'#3d5166'}}>
                  <TrendingUp className="w-12 h-12 mb-4 opacity-20"/>
                  <p className="text-sm">Selecciona un equipo del listado</p>
                  <p className="text-xs mt-1 opacity-60">Ver vida útil, riesgo, similares y línea de tiempo</p>
                </div>
              ) : <DetalleEquipo e={equipoSel}/>}
            </div>
          </div>
        )}

        {/* ── POR SERVICIO ── */}
        {tab==='servicios' && (
          <div className="space-y-4 max-w-4xl">
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4" style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Riesgo predictivo por servicio hospitalario</div>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <div key={i} className="px-5 py-5 animate-pulse"><div className="h-4 w-48 rounded mb-3" style={{background:'#1e2d3d'}}/><div className="h-3 rounded" style={{background:'#1e2d3d'}}/></div>
                )) : (data?.prediccionServicios||[]).map((s:any,i:number)=>{
                  const color=s.scorePromedio>=70?'#f87171':s.scorePromedio>=45?'#fcd34d':'#4ade80'
                  const corrSvc=Math.round(s.correctivos)
                  const predSvc=Math.round(s.correctivos*1.18)
                  return (
                    <div key={i} className="px-5 py-5" style={{background:i%2===0?'#080e16':'#0a1120'}}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>{s.nombre}</div>
                          <div className="flex items-center gap-3 text-xs" style={{color:'#3d5166'}}>
                            <span>{s.equipos} equipos</span>·
                            <span style={{color:'#f87171'}}>{s.criticos} críticos</span>·
                            <span style={{color:'#f87171'}}>2025: {corrSvc}</span>→
                            <span style={{color:'#818cf8'}}>2026: {predSvc}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black" style={{color}}>{s.scorePromedio}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>score riesgo</div>
                        </div>
                      </div>
                      <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                        <div className="h-2 rounded-full" style={{width:`${s.scorePromedio}%`,background:color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── REPUESTOS ── */}
        {tab==='repuestos' && (
          <div className="space-y-4 max-w-3xl">
            {!loading && data?.repuestosCriticos?.length===0 ? (
              <div className="rounded-xl p-8 text-center" style={{background:'#0d1626',border:'1px solid #10b98130'}}>
                <Package className="w-10 h-10 mx-auto mb-3" style={{color:'#4ade80'}}/>
                <div className="text-base font-bold mb-1" style={{color:'#4ade80'}}>Stock en buen estado</div>
                <div className="text-sm" style={{color:'#3d5166'}}>No hay repuestos con stock bajo</div>
              </div>
            ) : (
              <>
                {(data?.repuestosCriticos?.length>0) && (
                  <div className="rounded-xl p-4 flex items-center gap-3" style={{background:'#ef444410',border:'1px solid #ef444430'}}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{color:'#f87171'}}/>
                    <div className="text-sm" style={{color:'#fca5a5'}}>
                      <strong>{data?.repuestosCriticos?.length} repuestos</strong> con stock bajo. Reposición recomendada.
                    </div>
                  </div>
                )}
                <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                  <div className="px-5 py-4" style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                    <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Repuestos a reponer</div>
                  </div>
                  <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                    {loading ? Array.from({length:4}).map((_,i)=>(
                      <div key={i} className="px-5 py-4 animate-pulse"><div className="h-4 w-48 rounded mb-2" style={{background:'#1e2d3d'}}/><div className="h-2 rounded" style={{background:'#1e2d3d'}}/></div>
                    )) : (data?.repuestosCriticos||[]).map((r:any,i:number)=>(
                      <div key={i} className="px-5 py-4" style={{background:i%2===0?'#080e16':'#0a1120'}}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{r.nombre}</div>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              <span style={{color:r.stock===0?'#f87171':'#fcd34d'}}>Stock: {r.stock} {r.stock===0?'— AGOTADO':'— BAJO'}</span>
                              <span style={{color:'#3d5166'}}>Mín: {r.minimo}</span>
                            </div>
                          </div>
                          {r.costoReposicion && (
                            <div className="text-right">
                              <div className="text-xs" style={{color:'#3d5166'}}>Costo reposición</div>
                              <div className="text-sm font-bold" style={{color:'#2dd4bf'}}>${r.costoReposicion.toLocaleString('es-CO')}</div>
                            </div>
                          )}
                        </div>
                        <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                          <div className="h-2 rounded-full" style={{width:`${Math.min((r.stock/r.minimo)*100,100)}%`,background:r.stock===0?'#ef4444':'#f59e0b'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
