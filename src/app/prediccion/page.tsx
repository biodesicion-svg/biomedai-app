'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Activity, Package, Search, ChevronRight } from 'lucide-react'

const alertaColor: Record<string,{bg:string;text:string;border:string;label:string}> = {
  critico: {bg:'#ef444415',text:'#f87171',border:'#ef444430',label:'Crítico'},
  alto:    {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30',label:'Alto'},
  medio:   {bg:'#818cf815',text:'#818cf8',border:'#818cf830',label:'Medio'},
  bajo:    {bg:'#10b98115',text:'#4ade80',border:'#10b98130',label:'Bajo'},
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function GaugeRing({ score }: {score:number}) {
  const color = score>=70?'#ef4444':score>=45?'#f59e0b':score>=25?'#818cf8':'#10b981'
  const r=40, circ=2*Math.PI*r, dash=(score/100)*circ
  return (
    <div className="relative flex items-center justify-center" style={{width:100,height:100}}>
      <svg width={100} height={100} style={{transform:'rotate(-90deg)'}}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#1e2d3d" strokeWidth={10}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-black" style={{color}}>{score}</div>
        <div style={{fontSize:'9px',color:'#3d5166'}}>RIESGO</div>
      </div>
    </div>
  )
}

// Gráfica de barras comparativa doble
function DoubleBarChart({ actual, prediccion, labels, height=160 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  return (
    <div>
      <div className="flex items-end gap-2" style={{height}}>
        {labels.map((label: string, i: number) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end gap-0.5" style={{height:height-20}}>
              {/* Barra actual */}
              <div className="flex-1 rounded-t-sm transition-all"
                style={{
                  height:`${(actual[i]/max)*100}%`,
                  background:'#f87171',
                  opacity:0.85,
                  minHeight: actual[i]>0?'3px':'0'
                }}/>
              {/* Barra predicción */}
              <div className="flex-1 rounded-t-sm transition-all"
                style={{
                  height:`${(prediccion[i]/max)*100}%`,
                  background:'#818cf8',
                  opacity:0.85,
                  minHeight: prediccion[i]>0?'3px':'0'
                }}/>
            </div>
            <div style={{fontSize:'9px',color:'#3d5166',textAlign:'center'}}>{label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{background:'#f87171'}}/>
          <span className="text-xs" style={{color:'#3d5166'}}>Fallas actuales 2025</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{background:'#818cf8'}}/>
          <span className="text-xs" style={{color:'#3d5166'}}>Predicción 2026</span>
        </div>
      </div>
    </div>
  )
}

// Gráfica de línea comparativa
function LineCompareChart({ actual, prediccion, labels, height=160 }: any) {
  const max = Math.max(...actual, ...prediccion, 1)
  const w = 600, h = height
  const padX = 30, padY = 20

  function getPoints(data: number[]) {
    return data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * (w - padX * 2)
      const y = padY + ((max - v) / max) * (h - padY * 2)
      return `${x},${y}`
    }).join(' ')
  }

  function getPath(data: number[]) {
    return data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * (w - padX * 2)
      const y = padY + ((max - v) / max) * (h - padY * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%', height}}>
        {/* Grid lines */}
        {[0,25,50,75,100].map(pct => {
          const y = padY + ((100-pct)/100) * (h - padY*2)
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={w-padX} y2={y} stroke="#1e2d3d" strokeWidth={1}/>
              <text x={padX-5} y={y+4} fontSize={8} fill="#3d5166" textAnchor="end">
                {Math.round((pct/100)*max)}
              </text>
            </g>
          )
        })}
        {/* Línea actual */}
        <path d={getPath(actual)} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Área predicción */}
        <path d={`${getPath(prediccion)} L ${padX + ((prediccion.length-1)/(prediccion.length-1))*(w-padX*2)} ${h-padY} L ${padX} ${h-padY} Z`}
          fill="#818cf820"/>
        {/* Línea predicción */}
        <path d={getPath(prediccion)} fill="none" stroke="#818cf8" strokeWidth={2.5}
          strokeDasharray="6,3" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Puntos actual */}
        {actual.map((v: number, i: number) => {
          const x = padX + (i/(actual.length-1))*(w-padX*2)
          const y = padY + ((max-v)/max)*(h-padY*2)
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#f87171" stroke="#080e16" strokeWidth={1.5}/>
        })}
        {/* Puntos predicción */}
        {prediccion.map((v: number, i: number) => {
          const x = padX + (i/(prediccion.length-1))*(w-padX*2)
          const y = padY + ((max-v)/max)*(h-padY*2)
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#818cf8" stroke="#080e16" strokeWidth={1.5}/>
        })}
        {/* Labels meses */}
        {labels.map((label: string, i: number) => {
          const x = padX + (i/(labels.length-1))*(w-padX*2)
          return <text key={i} x={x} y={h-2} fontSize={9} fill="#3d5166" textAnchor="middle">{label}</text>
        })}
      </svg>
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5" style={{background:'#f87171'}}/>
          <span className="text-xs" style={{color:'#3d5166'}}>Fallas actuales 2025</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed" style={{borderColor:'#818cf8'}}/>
          <span className="text-xs" style={{color:'#3d5166'}}>Predicción 2026</span>
        </div>
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

  useEffect(() => {
    fetch('/api/prediccion')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Construir datos de comparativa actual vs predicción
  const corrActual = data?.tendencia?.correctivos || Array(12).fill(0)
  const prevActual = data?.tendencia?.preventivos || Array(12).fill(0)

  // Predicción 2026: tendencia actual + crecimiento por falta de preventivos
  const corrPrediccion = corrActual.map((v: number) => Math.round(v * 1.18 + 1))
  const prevPrediccion = prevActual.map((v: number) => Math.round(v * 1.35 + 2))

  // Total anual
  const totalCorrActual = corrActual.reduce((a: number, b: number) => a + b, 0)
  const totalCorrPred   = corrPrediccion.reduce((a: number, b: number) => a + b, 0)
  const totalPrevActual = prevActual.reduce((a: number, b: number) => a + b, 0)
  const totalPrevPred   = prevPrediccion.reduce((a: number, b: number) => a + b, 0)

  const equiposFiltrados = (data?.equipoRiesgo || []).filter((e: any) =>
    !search ||
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.servicio?.toLowerCase().includes(search.toLowerCase())
  )

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
        ].map(t => (
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
        {tab === 'general' && (
          <div className="space-y-5 max-w-6xl">

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {loading ? Array.from({length:6}).map((_,i)=>(
                <div key={i} className="rounded-xl p-5 animate-pulse h-28" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}/>
              )) : [
                {label:'Score riesgo global',      value:data?.kpis?.scoreGlobal,    unit:'/100', color:data?.kpis?.scoreGlobal>=70?'#f87171':data?.kpis?.scoreGlobal>=45?'#fcd34d':'#4ade80', sub:'Promedio del parque'},
                {label:'Equipos críticos',          value:data?.kpis?.criticos,       unit:'',     color:'#f87171',  sub:'Intervención urgente'},
                {label:'Fallas esperadas 30 días',  value:data?.kpis?.fallaEsperada30,unit:'',     color:'#fcd34d',  sub:'Basado en tendencia'},
                {label:'Fallas esperadas 90 días',  value:data?.kpis?.fallaEsperada90,unit:'',     color:'#fb923c',  sub:'Proyección trimestral'},
                {label:'Incremento correctivos 2026',value:`+${Math.round(((totalCorrPred-totalCorrActual)/Math.max(totalCorrActual,1))*100)}%`, unit:'', color:'#f87171', sub:`${totalCorrActual} → ${totalCorrPred} anuales`},
                {label:'Equipos analizados',        value:data?.kpis?.totalEquipos,   unit:'',     color:'#2dd4bf',  sub:'Con modelo predictivo'},
              ].map(k => (
                <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
                  style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:k.color, opacity:0.6}}/>
                  <div className="text-2xl font-black mb-1" style={{color:k.color}}>
                    {k.value}{k.unit && <span className="text-sm ml-1">{k.unit}</span>}
                  </div>
                  <div className="text-xs font-bold mb-0.5" style={{color:'#7a9bb5'}}>{k.label}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* GRÁFICA COMPARATIVA PRINCIPAL — Línea */}
            <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>
                    Comparativa: Fallas Actuales 2025 vs Predicción 2026
                  </div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>
                    Proyección mensual basada en tendencia histórica de correctivos · Sin intervención preventiva
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="text-right">
                    <div className="font-bold" style={{color:'#f87171'}}>{totalCorrActual}</div>
                    <div style={{color:'#3d5166'}}>Correctivos 2025</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{color:'#818cf8'}}>{totalCorrPred}</div>
                    <div style={{color:'#3d5166'}}>Predicción 2026</div>
                  </div>
                </div>
              </div>
              {loading
                ? <div className="animate-pulse rounded" style={{height:160, background:'#1e2d3d'}}/>
                : <LineCompareChart
                    actual={corrActual}
                    prediccion={corrPrediccion}
                    labels={MESES}
                    height={160}
                  />
              }
            </div>

            {/* GRÁFICA BARRAS COMPARATIVA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>
                  Correctivos por Mes — Actual vs Predicción
                </div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>
                  Barras: rojo = 2025 · morado = predicción 2026
                </div>
                {loading
                  ? <div className="animate-pulse rounded" style={{height:140, background:'#1e2d3d'}}/>
                  : <DoubleBarChart
                      actual={corrActual}
                      prediccion={corrPrediccion}
                      labels={MESES}
                      height={140}
                    />
                }
              </div>

              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>
                  Impacto si se implementa Mantenimiento Preventivo
                </div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>
                  Reducción estimada de correctivos con plan preventivo activo
                </div>
                {loading ? (
                  <div className="animate-pulse rounded" style={{height:140, background:'#1e2d3d'}}/>
                ) : (
                  <div className="space-y-3">
                    {/* Escenario sin preventivo */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{color:'#f87171'}}>Sin plan preventivo (predicción)</span>
                        <span className="font-bold" style={{color:'#f87171'}}>{totalCorrPred} fallas/año</span>
                      </div>
                      <div className="h-5 rounded-lg overflow-hidden" style={{background:'#1e2d3d'}}>
                        <div className="h-5 rounded-lg flex items-center px-2"
                          style={{width:'100%', background:'linear-gradient(90deg,#ef4444,#dc2626)'}}>
                          <span className="text-xs font-bold text-white">{totalCorrPred} correctivos</span>
                        </div>
                      </div>
                    </div>
                    {/* Escenario con preventivo 50% */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{color:'#fcd34d'}}>Con preventivo básico (50%)</span>
                        <span className="font-bold" style={{color:'#fcd34d'}}>{Math.round(totalCorrPred*0.65)} fallas/año</span>
                      </div>
                      <div className="h-5 rounded-lg overflow-hidden" style={{background:'#1e2d3d'}}>
                        <div className="h-5 rounded-lg flex items-center px-2"
                          style={{width:'65%', background:'linear-gradient(90deg,#f59e0b,#d97706)'}}>
                          <span className="text-xs font-bold text-white">{Math.round(totalCorrPred*0.65)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Escenario con preventivo completo */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{color:'#4ade80'}}>Con preventivo completo (80%+)</span>
                        <span className="font-bold" style={{color:'#4ade80'}}>{Math.round(totalCorrPred*0.35)} fallas/año</span>
                      </div>
                      <div className="h-5 rounded-lg overflow-hidden" style={{background:'#1e2d3d'}}>
                        <div className="h-5 rounded-lg flex items-center px-2"
                          style={{width:'35%', background:'linear-gradient(90deg,#16a34a,#15803d)'}}>
                          <span className="text-xs font-bold text-white">{Math.round(totalCorrPred*0.35)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg p-3 mt-2" style={{background:'#0d948810', border:'1px solid #0d948830'}}>
                      <div className="text-xs" style={{color:'#2dd4bf'}}>
                        💡 Con un plan preventivo completo podrías reducir las fallas en un
                        <strong style={{color:'#4ade80'}}> {Math.round(((totalCorrPred - Math.round(totalCorrPred*0.35))/totalCorrPred)*100)}%</strong>
                        , ahorrando aproximadamente
                        <strong style={{color:'#4ade80'}}> ${(((totalCorrPred - Math.round(totalCorrPred*0.35)) * 850000)/1000000).toFixed(1)}M COP</strong> anuales.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top equipos críticos */}
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4 flex items-center justify-between"
                style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                <div>
                  <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Top Equipos — Mayor Riesgo de Falla</div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Ordenados por score de riesgo predictivo</div>
                </div>
                <button onClick={()=>setTab('equipos')} className="text-xs flex items-center gap-1" style={{color:'#2dd4bf'}}>
                  Ver todos <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {loading ? Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                    <div className="w-20 h-16 rounded" style={{background:'#1e2d3d'}}/>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded" style={{background:'#1e2d3d'}}/>
                      <div className="h-3 w-32 rounded" style={{background:'#1e2d3d'}}/>
                    </div>
                  </div>
                )) : (data?.equipoRiesgo||[]).slice(0,5).map((e: any, i: number) => {
                  const ac = alertaColor[e.alerta]
                  return (
                    <div key={i} className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
                      onClick={()=>{setEquipoSel(e);setTab('equipos')}}>
                      <GaugeRing score={e.score}/>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold" style={{color:'#e2e8f0'}}>{e.nombre}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-semibold"
                            style={{background:ac.bg, color:ac.text, border:`1px solid ${ac.border}`}}>
                            {ac.label}
                          </span>
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
                        <div className="text-2xl font-black" style={{
                          color:e.probFalla>=70?'#f87171':e.probFalla>=45?'#fcd34d':'#4ade80'
                        }}>{e.probFalla}%</div>
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
        {tab === 'equipos' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#3d5166'}}/>
              <input type="text" placeholder="Buscar equipo o servicio..."
                value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
                style={{background:'#0d1626', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Lista */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d', maxHeight:'70vh', overflowY:'auto'}}>
                <div className="px-4 py-3 sticky top-0" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                  <div className="text-xs font-bold" style={{color:'#e2e8f0'}}>{equiposFiltrados.length} equipos analizados</div>
                </div>
                {equiposFiltrados.map((e: any, i: number) => {
                  const ac = alertaColor[e.alerta]
                  const sel = equipoSel?.id === e.id
                  return (
                    <div key={i} onClick={()=>setEquipoSel(e)}
                      className="px-4 py-3 cursor-pointer transition-all flex items-center gap-3"
                      style={{
                        background: sel?'#0d948815':i%2===0?'#080e16':'#0a1120',
                        borderBottom:'1px solid #1e2d3d',
                        borderLeft: sel?'3px solid #0d9488':'3px solid transparent',
                      }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{background:ac.bg, color:ac.text}}>
                        {e.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{color:'#e2e8f0'}}>{e.nombre}</div>
                        <div className="text-xs" style={{color:'#3d5166'}}>{e.servicio}</div>
                      </div>
                      <div className="text-xs text-right flex-shrink-0">
                        <div style={{color:e.probFalla>=70?'#f87171':e.probFalla>=45?'#fcd34d':'#4ade80'}}>{e.probFalla}%</div>
                        <div style={{color:'#3d5166'}}>{e.diasParaFalla}d</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Detalle con gráfica comparativa */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                {!equipoSel ? (
                  <div className="flex flex-col items-center justify-center h-64" style={{color:'#3d5166'}}>
                    <TrendingUp className="w-10 h-10 mb-3 opacity-30"/>
                    <p className="text-sm">Selecciona un equipo</p>
                  </div>
                ) : (() => {
                  const ac = alertaColor[equipoSel.alerta]
                  // Datos del equipo específico
                  const eqCorrActual = MESES.map((_, i) => i < 6 ? Math.round(equipoSel.correctivos / 6) : 0)
                  const eqCorrPred   = eqCorrActual.map((v: number) => Math.round(v * 1.25 + 0.5))
                  return (
                    <div>
                      <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                        <div className="flex items-center gap-3 mb-2">
                          <GaugeRing score={equipoSel.score}/>
                          <div>
                            <div className="text-base font-bold" style={{color:'#e2e8f0'}}>{equipoSel.nombre}</div>
                            <div className="text-xs" style={{color:'#3d5166'}}>{equipoSel.servicio} · {equipoSel.marca}</div>
                            <span className="text-xs px-2 py-0.5 rounded font-semibold mt-1 inline-block"
                              style={{background:ac.bg, color:ac.text, border:`1px solid ${ac.border}`}}>
                              Riesgo {ac.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Gráfica comparativa del equipo */}
                        <div>
                          <div className="text-xs font-bold mb-3" style={{color:'#7a9bb5'}}>
                            Fallas actuales vs predicción 2026 — Este equipo
                          </div>
                          <DoubleBarChart
                            actual={eqCorrActual}
                            prediccion={eqCorrPred}
                            labels={MESES}
                            height={100}
                          />
                        </div>
                        {/* Probabilidad */}
                        <div className="rounded-lg p-3" style={{background:'#111827'}}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs" style={{color:'#7a9bb5'}}>Probabilidad falla 90 días</span>
                            <span className="text-xl font-black" style={{
                              color:equipoSel.probFalla>=70?'#f87171':equipoSel.probFalla>=45?'#fcd34d':'#4ade80'
                            }}>{equipoSel.probFalla}%</span>
                          </div>
                          <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                            <div className="h-2 rounded-full"
                              style={{width:`${equipoSel.probFalla}%`, background:equipoSel.probFalla>=70?'#ef4444':equipoSel.probFalla>=45?'#f59e0b':'#10b981'}}/>
                          </div>
                        </div>
                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {label:'Fecha est. falla', value:equipoSel.fechaFalla, color:'#fcd34d'},
                            {label:'Días para falla', value:`~${equipoSel.diasParaFalla}d`, color:'#fb923c'},
                            {label:'Vida útil', value:`${equipoSel.pctVida}%`, color:equipoSel.pctVida>=80?'#f87171':'#4ade80'},
                            {label:'Correctivos hist.', value:equipoSel.correctivos, color:'#f87171'},
                          ].map(m => (
                            <div key={m.label} className="rounded-lg p-2.5" style={{background:'#111827'}}>
                              <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{m.label}</div>
                              <div className="text-sm font-bold" style={{color:m.color}}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Recomendación */}
                        <div className="rounded-lg p-3" style={{
                          background:equipoSel.alerta==='critico'?'#ef444410':'#0d948810',
                          border:`1px solid ${equipoSel.alerta==='critico'?'#ef444430':'#0d948830'}`
                        }}>
                          <div className="text-xs font-bold mb-1" style={{color:equipoSel.alerta==='critico'?'#f87171':'#2dd4bf'}}>
                            💡 Recomendación
                          </div>
                          <p className="text-xs leading-relaxed" style={{color:'#7a9bb5'}}>
                            {equipoSel.alerta==='critico'
                              ? `Intervención urgente. Alta probabilidad de falla en ${equipoSel.diasParaFalla} días. Programar correctivo preventivo inmediato.`
                              : equipoSel.alerta==='alto'
                              ? `Inspección técnica en los próximos 15 días. Verificar componentes críticos.`
                              : `Mantener plan preventivo actual. Monitoreo mensual.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── POR SERVICIO ── */}
        {tab === 'servicios' && (
          <div className="space-y-4 max-w-4xl">
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Riesgo predictivo por servicio hospitalario</div>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <div key={i} className="px-5 py-5 animate-pulse">
                    <div className="h-4 w-48 rounded mb-3" style={{background:'#1e2d3d'}}/>
                    <div className="h-3 rounded" style={{background:'#1e2d3d'}}/>
                  </div>
                )) : (data?.prediccionServicios||[]).map((s: any, i: number) => {
                  const color = s.scorePromedio>=70?'#f87171':s.scorePromedio>=45?'#fcd34d':'#4ade80'
                  const corrSvc = Math.round(s.correctivos)
                  const predSvc = Math.round(s.correctivos * 1.18)
                  return (
                    <div key={i} className="px-5 py-5" style={{background:i%2===0?'#080e16':'#0a1120'}}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>{s.nombre}</div>
                          <div className="flex items-center gap-3 text-xs" style={{color:'#3d5166'}}>
                            <span>{s.equipos} equipos</span>
                            <span>·</span>
                            <span style={{color:'#f87171'}}>{s.criticos} críticos</span>
                            <span>·</span>
                            <span style={{color:'#f87171'}}>Corr. 2025: {corrSvc}</span>
                            <span>→</span>
                            <span style={{color:'#818cf8'}}>Pred. 2026: {predSvc}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black" style={{color}}>{s.scorePromedio}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>score riesgo</div>
                        </div>
                      </div>
                      {/* Mini doble barra */}
                      <div className="flex gap-1 h-4">
                        <div className="flex-1 rounded-sm" style={{background:'#f87171', opacity:0.7, width:`${(corrSvc/Math.max(corrSvc,predSvc))*100}%`}}/>
                        <div className="flex-1 rounded-sm" style={{background:'#818cf8', opacity:0.7, width:`${(predSvc/Math.max(corrSvc,predSvc))*100}%`}}/>
                      </div>
                      <div className="h-2 rounded-full mt-1" style={{background:'#1e2d3d'}}>
                        <div className="h-2 rounded-full" style={{width:`${s.scorePromedio}%`, background:color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── REPUESTOS CRÍTICOS ── */}
        {tab === 'repuestos' && (
          <div className="space-y-4 max-w-3xl">
            {!loading && data?.repuestosCriticos?.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{background:'#0d1626', border:'1px solid #10b98130'}}>
                <Package className="w-10 h-10 mx-auto mb-3" style={{color:'#4ade80'}}/>
                <div className="text-base font-bold mb-1" style={{color:'#4ade80'}}>Stock en buen estado</div>
                <div className="text-sm" style={{color:'#3d5166'}}>No hay repuestos con stock bajo</div>
              </div>
            ) : (
              <>
                {data?.repuestosCriticos?.length > 0 && (
                  <div className="rounded-xl p-4 flex items-center gap-3"
                    style={{background:'#ef444410', border:'1px solid #ef444430'}}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{color:'#f87171'}}/>
                    <div className="text-sm" style={{color:'#fca5a5'}}>
                      <strong>{data?.repuestosCriticos?.length} repuestos</strong> con stock bajo.
                      Reposición recomendada antes de la próxima ronda de mantenimientos.
                    </div>
                  </div>
                )}
                <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                  <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                    <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Repuestos a reponer</div>
                  </div>
                  <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                    {loading ? Array.from({length:4}).map((_,i)=>(
                      <div key={i} className="px-5 py-4 animate-pulse">
                        <div className="h-4 w-48 rounded mb-2" style={{background:'#1e2d3d'}}/>
                        <div className="h-2 rounded" style={{background:'#1e2d3d'}}/>
                      </div>
                    )) : (data?.repuestosCriticos||[]).map((r: any, i: number) => (
                      <div key={i} className="px-5 py-4" style={{background:i%2===0?'#080e16':'#0a1120'}}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{r.nombre}</div>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              <span style={{color:r.stock===0?'#f87171':'#fcd34d'}}>
                                Stock: {r.stock} {r.stock===0?'— AGOTADO':'— BAJO'}
                              </span>
                              <span style={{color:'#3d5166'}}>Mín: {r.minimo}</span>
                            </div>
                          </div>
                          {r.costoReposicion && (
                            <div className="text-right">
                              <div className="text-xs" style={{color:'#3d5166'}}>Costo reposición</div>
                              <div className="text-sm font-bold" style={{color:'#2dd4bf'}}>
                                ${r.costoReposicion.toLocaleString('es-CO')}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                          <div className="h-2 rounded-full"
                            style={{width:`${Math.min((r.stock/r.minimo)*100,100)}%`,
                              background:r.stock===0?'#ef4444':'#f59e0b'}}/>
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
