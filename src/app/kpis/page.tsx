'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react'

export default function KpisPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/kpis')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setKpis(data)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const porTipo = kpis?.porTipo || []
  const porServicio = kpis?.porServicio || []

  const kpiCards = kpis ? [
    { label:'MTBF', value:`${kpis.mtbf}`, unit:'días', sub:'Tiempo medio entre fallas', color:'#2dd4bf', icon:<Activity className="w-5 h-5"/>, trend:'up' },
    { label:'MTTR', value: kpis.mttr === '0.0' ? 'N/D' : kpis.mttr, unit: kpis.mttr === '0.0' ? '' : 'hrs', sub:'Tiempo medio de reparación', color:'#818cf8', icon:<BarChart3 className="w-5 h-5"/> },
    { label:'Disponibilidad', value:kpis.disponibilidad, unit:'%', sub:'Equipos operativos / total', color: Number(kpis.disponibilidad)>=90?'#4ade80':'#f87171', icon:<CheckCircle className="w-5 h-5"/>, trend: Number(kpis.disponibilidad)>=90?'up':'down' },
    { label:'Ratio Prev/Corr', value:kpis.ratio, unit:'', sub:'Meta recomendada ≥ 0.80', color: Number(kpis.ratio)>=0.8?'#4ade80':'#f87171', icon:<TrendingUp className="w-5 h-5"/>, trend: Number(kpis.ratio)>=0.8?'up':'down' },
    { label:'Equipos Alto Riesgo', value:kpis.altoRiesgo, unit:'', sub:`de ${kpis.total} equipos`, color:'#f87171', icon:<AlertTriangle className="w-5 h-5"/> },
    { label:'Total Mantenimientos', value:kpis.totalMant, unit:'', sub:'Registros en historial', color:'#fb923c', icon:<BarChart3 className="w-5 h-5"/> },
  ] : []

  if (error) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'#080e16' }}>
      <div className="text-center p-8 rounded-xl" style={{ background:'#0d1626', border:'1px solid #ef444430' }}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color:'#f87171' }}/>
        <p className="text-sm font-bold mb-1" style={{ color:'#f87171' }}>Error cargando KPIs</p>
        <p className="text-xs" style={{ color:'#3d5166' }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'#080e16' }}>
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>KPIs</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color:'#e2e8f0' }}>Indicadores Clave de Desempeño</h1>
        </div>
        <div className="text-xs font-mono px-3 py-2 rounded-lg"
          style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#3d5166' }}>
          Res. 4816/2008 · INVIMA
        </div>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {loading
            ? Array.from({length:6}).map((_,i) => (
              <div key={i} className="rounded-xl p-5 animate-pulse"
                style={{ background:'#0d1626', border:'1px solid #1e2d3d', height:'120px' }}/>
            ))
            : kpiCards.map(k => (
              <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
                style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:k.color, opacity:0.6 }}/>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background:k.color+'15', color:k.color }}>{k.icon}</div>
                  {k.trend === 'up' && <TrendingUp className="w-4 h-4" style={{ color:'#4ade80' }}/>}
                  {k.trend === 'down' && <TrendingDown className="w-4 h-4" style={{ color:'#f87171' }}/>}
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold" style={{ color:k.color }}>{k.value}</span>
                  {k.unit && <span className="text-sm" style={{ color:k.color, opacity:0.7 }}>{k.unit}</span>}
                </div>
                <div className="text-xs font-bold mb-0.5" style={{ color:'#7a9bb5' }}>{k.label}</div>
                <div className="text-xs" style={{ color:'#3d5166' }}>{k.sub}</div>
              </div>
            ))
          }
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="text-sm font-bold mb-4" style={{ color:'#e2e8f0' }}>Distribución por Tipo</div>
            {loading
              ? Array.from({length:3}).map((_,i) => (
                <div key={i} className="mb-4 animate-pulse">
                  <div className="h-3 w-32 rounded mb-2" style={{ background:'#1e2d3d' }}/>
                  <div className="h-2 rounded" style={{ background:'#1e2d3d' }}/>
                </div>
              ))
              : porTipo.map((t: any) => (
                <div key={t.label} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color:'#7a9bb5' }}>{t.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono" style={{ color:t.color }}>{t.value}</span>
                      <span className="text-xs" style={{ color:'#3d5166' }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background:'#1e2d3d' }}>
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{ width:`${t.pct}%`, background:t.color }}/>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #1e2d3d' }}>
              <div className="text-sm font-bold" style={{ color:'#e2e8f0' }}>Disponibilidad por Servicio</div>
            </div>
            <div className="divide-y" style={{ borderColor:'#1e2d3d' }}>
              {loading
                ? Array.from({length:6}).map((_,i) => (
                  <div key={i} className="px-5 py-3 animate-pulse">
                    <div className="h-3 w-40 rounded" style={{ background:'#1e2d3d' }}/>
                  </div>
                ))
                : porServicio.map((s: any) => {
                  const disp = Number(s.disponibilidad)
                  const color = disp>=90?'#4ade80':disp>=70?'#fcd34d':'#f87171'
                  return (
                    <div key={s.nombre} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="text-xs font-medium" style={{ color:'#e2e8f0' }}>{s.nombre}</div>
                          <div className="text-xs" style={{ color:'#3d5166' }}>{s.total} equipos · {s.alto} alto riesgo</div>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color }}>{s.disponibilidad}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background:'#1e2d3d' }}>
                        <div className="h-1 rounded-full" style={{ width:`${s.disponibilidad}%`, background:color }}/>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
