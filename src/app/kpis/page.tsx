'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart3, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

export default function KpisPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [porServicio, setPorServicio] = useState<any[]>([])
  const [porTipo, setPorTipo] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      // Equipos
      const { data: equipos } = await supabase
        .from('equipos')
        .select('riesgo, estado, servicio, nombre')
        .eq('institucion_id', INSTITUCION_ID)
        .eq('activo', true)

      // Mantenimientos
      const { data: mantenimientos } = await supabase
        .from('mantenimientos')
        .select('tipo, estado, duracion_horas, costo_total, fecha_programada')
        .eq('institucion_id', INSTITUCION_ID)

      if (!equipos || !mantenimientos) return

      const total       = equipos.length
      const operativos  = equipos.filter(e => e.estado === 'operativo').length
      const bajas       = equipos.filter(e => e.estado === 'baja').length
      const altoRiesgo  = equipos.filter(e => e.riesgo === 'alto').length
      const disponibilidad = total > 0 ? ((operativos / total) * 100) : 0

      const completados  = mantenimientos.filter(m => m.estado === 'completado')
      const preventivos  = mantenimientos.filter(m => m.tipo === 'preventivo').length
      const correctivos  = mantenimientos.filter(m => m.tipo === 'correctivo').length
      const calibraciones = mantenimientos.filter(m => m.tipo === 'calibracion').length

      const duraciones   = completados.filter(m => m.duracion_horas).map(m => Number(m.duracion_horas))
      const mttr         = duraciones.length > 0
        ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length
        : 0

      const costos       = completados.filter(m => m.costo_total).map(m => Number(m.costo_total))
      const costoTotal   = costos.reduce((a, b) => a + b, 0)

      // MTBF estimado — días entre mantenimientos
      const mtbf = total > 0 ? Math.round(365 / (mantenimientos.length / total)) : 0

      // Ratio preventivo/correctivo
      const ratio = correctivos > 0 ? (preventivos / correctivos).toFixed(2) : '∞'

      setKpis({
        total, operativos, bajas, altoRiesgo,
        disponibilidad: disponibilidad.toFixed(1),
        mtbf, mttr: mttr.toFixed(1),
        preventivos, correctivos, calibraciones,
        costoTotal, ratio,
        totalMant: mantenimientos.length
      })

      // KPIs por servicio
      const svcMap: Record<string, { total: number; operativos: number; alto: number }> = {}
      equipos.forEach(e => {
        if (!e.servicio) return
        if (!svcMap[e.servicio]) svcMap[e.servicio] = { total: 0, operativos: 0, alto: 0 }
        svcMap[e.servicio].total++
        if (e.estado === 'operativo') svcMap[e.servicio].operativos++
        if (e.riesgo === 'alto') svcMap[e.servicio].alto++
      })

      const svcArr = Object.entries(svcMap)
        .map(([nombre, d]) => ({
          nombre,
          total: d.total,
          operativos: d.operativos,
          alto: d.alto,
          disponibilidad: ((d.operativos / d.total) * 100).toFixed(0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
      setPorServicio(svcArr)

      // Por tipo de mantenimiento
      const tipos = [
        { label: 'Preventivo',  value: preventivos,   color: '#4ade80', pct: 0 },
        { label: 'Correctivo',  value: correctivos,   color: '#f87171', pct: 0 },
        { label: 'Calibración', value: calibraciones, color: '#fcd34d', pct: 0 },
      ]
      const totalT = mantenimientos.length
      tipos.forEach(t => t.pct = totalT > 0 ? Math.round((t.value / totalT) * 100) : 0)
      setPorTipo(tipos)

      setLoading(false)
    }
    cargar()
  }, [])

  const kpiCards = kpis ? [
    {
      label: 'MTBF',
      value: `${kpis.mtbf}`,
      unit: 'días',
      sub: 'Tiempo medio entre fallas',
      color: '#2dd4bf',
      icon: <Activity className="w-5 h-5"/>,
      trend: 'up'
    },
    {
      label: 'MTTR',
      value: kpis.mttr === '0.0' ? 'N/D' : kpis.mttr,
      unit: kpis.mttr === '0.0' ? '' : 'horas',
      sub: 'Tiempo medio de reparación',
      color: '#818cf8',
      icon: <BarChart3 className="w-5 h-5"/>,
    },
    {
      label: 'Disponibilidad',
      value: kpis.disponibilidad,
      unit: '%',
      sub: 'Equipos operativos / total',
      color: Number(kpis.disponibilidad) >= 90 ? '#4ade80' : '#f87171',
      icon: <CheckCircle className="w-5 h-5"/>,
      trend: Number(kpis.disponibilidad) >= 90 ? 'up' : 'down'
    },
    {
      label: 'Ratio Prev/Corr',
      value: kpis.ratio,
      unit: '',
      sub: 'Meta recomendada ≥ 0.80',
      color: Number(kpis.ratio) >= 0.8 ? '#4ade80' : '#f87171',
      icon: <TrendingUp className="w-5 h-5"/>,
      trend: Number(kpis.ratio) >= 0.8 ? 'up' : 'down'
    },
    {
      label: 'Equipos Alto Riesgo',
      value: kpis.altoRiesgo,
      unit: '',
      sub: `de ${kpis.total} equipos totales`,
      color: '#f87171',
      icon: <AlertTriangle className="w-5 h-5"/>,
    },
    {
      label: 'Total Mantenimientos',
      value: kpis.totalMant,
      unit: '',
      sub: 'Registros en historial',
      color: '#fb923c',
      icon: <BarChart3 className="w-5 h-5"/>,
    },
  ] : []

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>KPIs</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color:'#e2e8f0' }}>
            Indicadores Clave de Desempeño
          </h1>
        </div>
        <div className="text-xs font-mono px-3 py-2 rounded-lg"
          style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#3d5166' }}>
          Res. 4816/2008 · INVIMA
        </div>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5 animate-pulse"
                style={{ background:'#0d1626', border:'1px solid #1e2d3d', height:'120px' }}/>
            ))
            : kpiCards.map(k => (
              <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
                style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: k.color, opacity: 0.6 }}/>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: k.color + '15', color: k.color }}>
                    {k.icon}
                  </div>
                  {k.trend === 'up' && <TrendingUp className="w-4 h-4" style={{ color:'#4ade80' }}/>}
                  {k.trend === 'down' && <TrendingDown className="w-4 h-4" style={{ color:'#f87171' }}/>}
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</span>
                  {k.unit && <span className="text-sm" style={{ color: k.color, opacity: 0.7 }}>{k.unit}</span>}
                </div>
                <div className="text-xs font-bold mb-0.5" style={{ color:'#7a9bb5' }}>{k.label}</div>
                <div className="text-xs" style={{ color:'#3d5166' }}>{k.sub}</div>
              </div>
            ))
          }
        </div>

        {/* Fila 2 */}
        <div className="grid grid-cols-2 gap-4">

          {/* Distribución por tipo */}
          <div className="rounded-xl p-5" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="text-sm font-bold mb-4" style={{ color:'#e2e8f0' }}>
              Distribución por Tipo de Mantenimiento
            </div>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4 animate-pulse">
                  <div className="h-3 w-32 rounded mb-2" style={{ background:'#1e2d3d' }}/>
                  <div className="h-2 rounded" style={{ background:'#1e2d3d' }}/>
                </div>
              ))
              : porTipo.map(t => (
                <div key={t.label} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color:'#7a9bb5' }}>{t.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono" style={{ color: t.color }}>{t.value}</span>
                      <span className="text-xs" style={{ color:'#3d5166' }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background:'#1e2d3d' }}>
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{ width:`${t.pct}%`, background: t.color }}/>
                  </div>
                </div>
              ))
            }

            {kpis && (
              <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop:'1px solid #1e2d3d' }}>
                <div className="rounded-lg p-3" style={{ background:'#111827' }}>
                  <div className="text-xs" style={{ color:'#3d5166' }}>Costo total registrado</div>
                  <div className="text-lg font-bold mt-1" style={{ color:'#4ade80' }}>
                    ${kpis.costoTotal > 0
                      ? (kpis.costoTotal / 1000000).toFixed(1) + 'M'
                      : 'N/D'}
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background:'#111827' }}>
                  <div className="text-xs" style={{ color:'#3d5166' }}>Equipos dados de baja</div>
                  <div className="text-lg font-bold mt-1" style={{ color:'#f87171' }}>
                    {kpis.bajas}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KPIs por servicio */}
          <div className="rounded-xl overflow-hidden" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #1e2d3d' }}>
              <div className="text-sm font-bold" style={{ color:'#e2e8f0' }}>
                Disponibilidad por Servicio
              </div>
            </div>
            <div className="divide-y" style={{ borderColor:'#1e2d3d' }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 animate-pulse">
                    <div className="h-3 w-40 rounded" style={{ background:'#1e2d3d' }}/>
                  </div>
                ))
                : porServicio.map(s => {
                  const disp = Number(s.disponibilidad)
                  const color = disp >= 90 ? '#4ade80' : disp >= 70 ? '#fcd34d' : '#f87171'
                  return (
                    <div key={s.nombre} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="text-xs font-medium" style={{ color:'#e2e8f0' }}>{s.nombre}</div>
                          <div className="text-xs" style={{ color:'#3d5166' }}>
                            {s.total} equipos · {s.alto} alto riesgo
                          </div>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color }}>{s.disponibilidad}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background:'#1e2d3d' }}>
                        <div className="h-1 rounded-full transition-all duration-500"
                          style={{ width:`${s.disponibilidad}%`, background: color }}/>
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
