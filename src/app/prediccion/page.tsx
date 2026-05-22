'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Activity, Package, Calendar, ChevronRight, Search } from 'lucide-react'

const alertaColor: Record<string,{bg:string;text:string;border:string;label:string}> = {
  critico: {bg:'#ef444415',text:'#f87171',border:'#ef444430',label:'Crítico'},
  alto:    {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30',label:'Alto'},
  medio:   {bg:'#818cf815',text:'#818cf8',border:'#818cf830',label:'Medio'},
  bajo:    {bg:'#10b98115',text:'#4ade80',border:'#10b98130',label:'Bajo'},
}

function BarChart({ data, labels, color='#0d9488', height=120 }: any) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{height}}>
      {data.map((v: number, i: number) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-t transition-all"
            style={{height:`${(v/max)*100}%`, background:color, opacity: 0.7 + (i/data.length)*0.3, minHeight: v>0?'4px':'0'}}/>
          {labels && <div className="text-xs" style={{color:'#3d5166',fontSize:'9px'}}>{labels[i]}</div>}
        </div>
      ))}
    </div>
  )
}

function GaugeRing({ score }: {score: number}) {
  const color = score >= 70 ? '#ef4444' : score >= 45 ? '#f59e0b' : score >= 25 ? '#818cf8' : '#10b981'
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{width:100,height:100}}>
      <svg width={100} height={100} style={{transform:'rotate(-90deg)'}}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#1e2d3d" strokeWidth={10}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-black" style={{color}}>{score}</div>
        <div style={{fontSize:'9px',color:'#3d5166'}}>RIESGO</div>
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

  const equiposFiltrados = (data?.equipoRiesgo || []).filter((e: any) =>
    !search || e.nombre.toLowerCase().includes(search.toLowerCase()) ||
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
                {label:'Score de riesgo global', value:data?.kpis?.scoreGlobal, unit:'/100', color: data?.kpis?.scoreGlobal>=70?'#f87171':data?.kpis?.scoreGlobal>=45?'#fcd34d':'#4ade80', sub:'Promedio del parque de equipos'},
                {label:'Equipos en estado crítico', value:data?.kpis?.criticos, unit:'', color:'#f87171', sub:'Requieren intervención urgente'},
                {label:'Fallas esperadas 30 días', value:data?.kpis?.fallaEsperada30, unit:'', color:'#fcd34d', sub:'Basado en tendencia histórica'},
                {label:'Fallas esperadas 90 días', value:data?.kpis?.fallaEsperada90, unit:'', color:'#fb923c', sub:'Proyección trimestral'},
                {label:'Costo estimado fallas', value:`$${((data?.kpis?.costoEstimado||0)/1000000).toFixed(1)}M`, unit:'COP', color:'#818cf8', sub:'Estimado próximos 90 días'},
                {label:'Total equipos analizados', value:data?.kpis?.totalEquipos, unit:'', color:'#2dd4bf', sub:'Con modelo predictivo activo'},
              ].map(k => (
                <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
                  style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:k.color, opacity:0.6}}/>
                  <div className="text-2xl font-black mb-1" style={{color:k.color}}>{k.value}{k.unit && <span className="text-sm ml-1">{k.unit}</span>}</div>
                  <div className="text-xs font-bold mb-0.5" style={{color:'#7a9bb5'}}>{k.label}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Tendencia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Tendencia de Correctivos por Mes</div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>Historial 2024-2025 · Intervenciones correctivas</div>
                {loading
                  ? <div className="h-32 animate-pulse rounded" style={{background:'#1e2d3d'}}/>
                  : <BarChart data={data?.tendencia?.correctivos||[]} labels={data?.tendencia?.meses||[]} color="#f87171" height={130}/>
                }
              </div>

              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Proyección Próximos 3 Meses</div>
                <div className="text-xs mb-4" style={{color:'#3d5166'}}>Estimación basada en tendencia histórica</div>
                {loading
                  ? <div className="h-32 animate-pulse rounded" style={{background:'#1e2d3d'}}/>
                  : (
                    <div className="space-y-3">
                      {(data?.tendencia?.proyeccion||[]).map((p: any, i: number) => (
                        <div key={i} className="rounded-lg p-3" style={{background:'#111827'}}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold" style={{color:'#e2e8f0'}}>{p.mes}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span style={{color:'#f87171'}}>Correctivos: {p.correctivos}</span>
                              <span style={{color:'#4ade80'}}>Preventivos: {p.preventivos}</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                            <div className="h-2 rounded-full" style={{
                              width:`${Math.min((p.correctivos/20)*100,100)}%`,
                              background:'linear-gradient(90deg,#f59e0b,#ef4444)'
                            }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>

            {/* Top equipos críticos */}
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4 flex items-center justify-between" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
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
                    <div key={i} className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/20"
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
                        <div className="text-xs" style={{color:'#3d5166'}}>Prob. falla 90d</div>
                        <div className="text-xl font-black" style={{
                          color: e.probFalla>=70?'#f87171':e.probFalla>=45?'#fcd34d':'#4ade80'
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
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#3d5166'}}/>
                <input type="text" placeholder="Buscar equipo o servicio..."
                  value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{background:'#0d1626', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Lista */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d', maxHeight:'70vh', overflowY:'auto'}}>
                <div className="px-4 py-3 sticky top-0" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                  <div className="text-xs font-bold" style={{color:'#e2e8f0'}}>
                    {equiposFiltrados.length} equipos analizados
                  </div>
                </div>
                {equiposFiltrados.map((e: any, i: number) => {
                  const ac = alertaColor[e.alerta]
                  const selec = equipoSel?.id === e.id
                  return (
                    <div key={i} onClick={()=>setEquipoSel(e)}
                      className="px-4 py-3 cursor-pointer transition-all flex items-center gap-3"
                      style={{
                        background: selec?'#0d948815':i%2===0?'#080e16':'#0a1120',
                        borderBottom:'1px solid #1e2d3d',
                        borderLeft: selec?'3px solid #0d9488':'3px solid transparent',
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

              {/* Detalle */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                {!equipoSel ? (
                  <div className="flex flex-col items-center justify-center h-64" style={{color:'#3d5166'}}>
                    <TrendingUp className="w-10 h-10 mb-3 opacity-30"/>
                    <p className="text-sm">Selecciona un equipo para ver su análisis predictivo</p>
                  </div>
                ) : (() => {
                  const ac = alertaColor[equipoSel.alerta]
                  return (
                    <div>
                      <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                        <div className="flex items-center gap-3 mb-3">
                          <GaugeRing score={equipoSel.score}/>
                          <div>
                            <div className="text-base font-bold" style={{color:'#e2e8f0'}}>{equipoSel.nombre}</div>
                            <div className="text-xs" style={{color:'#3d5166'}}>{equipoSel.servicio} · {equipoSel.marca}</div>
                            <div className="mt-1">
                              <span className="text-xs px-2 py-0.5 rounded font-semibold"
                                style={{background:ac.bg, color:ac.text, border:`1px solid ${ac.border}`}}>
                                Riesgo {ac.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        {/* Probabilidad */}
                        <div className="rounded-lg p-4" style={{background:'#111827'}}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold" style={{color:'#7a9bb5'}}>Probabilidad de falla en 90 días</span>
                            <span className="text-2xl font-black" style={{
                              color: equipoSel.probFalla>=70?'#f87171':equipoSel.probFalla>=45?'#fcd34d':'#4ade80'
                            }}>{equipoSel.probFalla}%</span>
                          </div>
                          <div className="h-3 rounded-full" style={{background:'#1e2d3d'}}>
                            <div className="h-3 rounded-full transition-all"
                              style={{
                                width:`${equipoSel.probFalla}%`,
                                background: equipoSel.probFalla>=70?'#ef4444':equipoSel.probFalla>=45?'#f59e0b':'#10b981'
                              }}/>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {label:'Fecha estimada falla', value:equipoSel.fechaFalla, color:'#fcd34d'},
                            {label:'Días para falla', value:`~${equipoSel.diasParaFalla} días`, color:'#fb923c'},
                            {label:'Vida útil consumida', value:`${equipoSel.pctVida}%`, color:equipoSel.pctVida>=80?'#f87171':'#4ade80'},
                            {label:'Edad del equipo', value:`${equipoSel.edadAnios} años`, color:'#818cf8'},
                            {label:'Correctivos historial', value:equipoSel.correctivos, color:'#f87171'},
                            {label:'Total mantenimientos', value:equipoSel.total_mant, color:'#e2e8f0'},
                          ].map(m => (
                            <div key={m.label} className="rounded-lg p-3" style={{background:'#111827'}}>
                              <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{m.label}</div>
                              <div className="text-base font-bold" style={{color:m.color}}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Recomendación */}
                        <div className="rounded-lg p-3" style={{
                          background: equipoSel.alerta==='critico'?'#ef444410':equipoSel.alerta==='alto'?'#f59e0b10':'#0d948810',
                          border: `1px solid ${equipoSel.alerta==='critico'?'#ef444430':equipoSel.alerta==='alto'?'#f59e0b30':'#0d948830'}`
                        }}>
                          <div className="text-xs font-bold mb-1" style={{
                            color: equipoSel.alerta==='critico'?'#f87171':equipoSel.alerta==='alto'?'#fcd34d':'#2dd4bf'
                          }}>
                            💡 Recomendación
                          </div>
                          <p className="text-xs leading-relaxed" style={{color:'#7a9bb5'}}>
                            {equipoSel.alerta === 'critico'
                              ? `Intervención urgente requerida. Alta probabilidad de falla en los próximos ${equipoSel.diasParaFalla} días. Programar mantenimiento correctivo preventivo inmediato y evaluar reemplazo.`
                              : equipoSel.alerta === 'alto'
                              ? `Programar inspección técnica en los próximos 15 días. Verificar componentes críticos y asegurar disponibilidad de repuestos.`
                              : equipoSel.alerta === 'medio'
                              ? `Mantener plan de mantenimiento preventivo actual. Monitorear indicadores mensualmente.`
                              : `Equipo en buen estado predictivo. Continuar con cronograma de mantenimiento preventivo establecido.`
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
                            <span>{s.correctivos} correctivos históricos</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black" style={{color}}>{s.scorePromedio}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>score riesgo</div>
                        </div>
                      </div>
                      <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                        <div className="h-2 rounded-full transition-all"
                          style={{width:`${s.scorePromedio}%`, background:color}}/>
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
            {data?.repuestosCriticos?.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{background:'#0d1626', border:'1px solid #10b98130'}}>
                <Package className="w-10 h-10 mx-auto mb-3" style={{color:'#4ade80'}}/>
                <div className="text-base font-bold mb-1" style={{color:'#4ade80'}}>Stock en buen estado</div>
                <div className="text-sm" style={{color:'#3d5166'}}>No hay repuestos con stock por debajo del mínimo</div>
              </div>
            ) : (
              <>
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{background:'#ef444410', border:'1px solid #ef444430'}}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{color:'#f87171'}}/>
                  <div className="text-sm" style={{color:'#fca5a5'}}>
                    <strong>{data?.repuestosCriticos?.length} repuestos</strong> con stock bajo o agotado.
                    Reposición recomendada antes de la próxima ronda de mantenimientos.
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                  <div className="px-5 py-4" style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                    <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Repuestos a reponer</div>
                  </div>
                  <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                    {(data?.repuestosCriticos||[]).map((r: any, i: number) => (
                      <div key={i} className="px-5 py-4" style={{background:i%2===0?'#080e16':'#0a1120'}}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{r.nombre}</div>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              <span style={{color:r.stock===0?'#f87171':'#fcd34d'}}>
                                Stock: {r.stock} {r.stock===0?'— AGOTADO':'— BAJO'}
                              </span>
                              <span style={{color:'#3d5166'}}>Mínimo: {r.minimo}</span>
                              <span style={{color:'#f87171'}}>Déficit: {r.deficit}</span>
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
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full" style={{background:'#1e2d3d'}}>
                            <div className="h-2 rounded-full"
                              style={{
                                width:`${Math.min((r.stock/r.minimo)*100,100)}%`,
                                background: r.stock===0?'#ef4444':'#f59e0b'
                              }}/>
                          </div>
                          <span className="text-xs font-mono" style={{color:'#3d5166'}}>
                            {r.stock}/{r.minimo}
                          </span>
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
