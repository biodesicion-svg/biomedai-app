'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Activity, AlertTriangle, CheckCircle, Clock,
  TrendingUp, TrendingDown, Wrench, ClipboardList,
  BarChart3, DollarSign
} from 'lucide-react'
import Link from 'next/link'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0, operativos: 0, baja: 0,
    alto: 0, medio: 0, bajo: 0,
    loaded: false
  })
  const [topEquipos, setTopEquipos] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      const { data: equipos } = await supabase
        .from('equipos')
        .select('nombre, riesgo, estado, servicio, marca, codigo_inventario')
        .eq('institucion_id', INSTITUCION_ID)
        .eq('activo', true)

      if (!equipos) return

      // Stats globales
      const total      = equipos.length
      const operativos = equipos.filter(e => e.estado === 'operativo').length
      const baja       = equipos.filter(e => e.estado === 'baja').length
      const alto       = equipos.filter(e => e.riesgo === 'alto').length
      const medio      = equipos.filter(e => e.riesgo === 'medio').length
      const bajo       = equipos.filter(e => e.riesgo === 'bajo').length

      setStats({ total, operativos, baja, alto, medio, bajo, loaded: true })

      // Top equipos de alto riesgo operativos
      const criticos = equipos
        .filter(e => e.riesgo === 'alto' && e.estado === 'operativo')
        .slice(0, 6)
      setTopEquipos(criticos)

      // Equipos por servicio
      const svcMap: Record<string, number> = {}
      equipos.forEach(e => {
        if (e.servicio) svcMap[e.servicio] = (svcMap[e.servicio] || 0) + 1
      })
      const svcArr = Object.entries(svcMap)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setServicios(svcArr)
    }
    cargar()
  }, [])

  const disponibilidad = stats.total > 0
    ? ((stats.operativos / stats.total) * 100).toFixed(1)
    : '0.0'

  const kpis = [
    {
      label: 'Total Equipos',
      value: stats.total,
      sub: 'en inventario activo',
      icon: <ClipboardList className="w-5 h-5" />,
      color: '#2dd4bf',
      bg: '#0d948815',
      border: '#0d948830',
    },
    {
      label: 'Operativos',
      value: stats.operativos,
      sub: `${disponibilidad}% disponibilidad`,
      icon: <CheckCircle className="w-5 h-5" />,
      color: '#4ade80',
      bg: '#16a34a15',
      border: '#16a34a30',
      trend: 'up'
    },
    {
      label: 'Riesgo Alto',
      value: stats.alto,
      sub: 'requieren prioridad',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: '#f87171',
      bg: '#ef444415',
      border: '#ef444430',
    },
    {
      label: 'Dados de Baja',
      value: stats.baja,
      sub: 'fuera de servicio',
      icon: <TrendingDown className="w-5 h-5" />,
      color: '#94a3b8',
      bg: '#64748b15',
      border: '#64748b30',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e2d3d', background: '#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium" style={{ color: '#3d5166' }}>BioMed AI</span>
            <span style={{ color: '#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color: '#2dd4bf' }}>Dashboard</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#e2e8f0' }}>
            Panel de Control Biomédico
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{ background: '#0d948815', border: '1px solid #0d948830', color: '#2dd4bf' }}>
          <Activity className="w-4 h-4 animate-pulse" />
          Sistema activo
        </div>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: '#0d1626', border: `1px solid #1e2d3d` }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: k.color, opacity: 0.5 }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: k.bg, border: `1px solid ${k.border}`, color: k.color }}>
                  {k.icon}
                </div>
                {k.trend && <TrendingUp className="w-4 h-4" style={{ color: '#4ade80' }} />}
              </div>
              {!stats.loaded
                ? <div className="h-9 w-20 rounded animate-pulse mb-2" style={{ background: '#1e2d3d' }} />
                : <div className="text-3xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
              }
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#7a9bb5' }}>{k.label}</div>
              <div className="text-xs" style={{ color: '#3d5166' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Fila 2: Distribución riesgo + Equipos críticos */}
        <div className="grid grid-cols-3 gap-4">

          {/* Distribución por riesgo */}
          <div className="rounded-xl p-5" style={{ background: '#0d1626', border: '1px solid #1e2d3d' }}>
            <div className="text-sm font-bold mb-4" style={{ color: '#e2e8f0' }}>
              Distribución por Riesgo
            </div>
            {[
              { label: 'Alto', value: stats.alto, color: '#ef4444', bg: '#ef444420' },
              { label: 'Medio', value: stats.medio, color: '#f59e0b', bg: '#f59e0b20' },
              { label: 'Bajo', value: stats.bajo, color: '#10b981', bg: '#10b98120' },
            ].map(r => {
              const pct = stats.total > 0 ? (r.value / stats.total) * 100 : 0
              return (
                <div key={r.label} className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#7a9bb5' }}>{r.label}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: r.color }}>
                      {stats.loaded ? r.value : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1e2d3d' }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: stats.loaded ? `${pct}%` : '0%', background: r.color }} />
                  </div>
                </div>
              )
            })}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1e2d3d' }}>
              <div className="text-xs mb-2" style={{ color: '#3d5166' }}>Disponibilidad general</div>
              <div className="text-2xl font-bold" style={{ color: '#2dd4bf' }}>
                {stats.loaded ? `${disponibilidad}%` : '—'}
              </div>
            </div>
          </div>

          {/* Equipos críticos activos */}
          <div className="col-span-2 rounded-xl overflow-hidden"
            style={{ background: '#0d1626', border: '1px solid #1e2d3d' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #1e2d3d' }}>
              <div className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                Equipos Críticos — Riesgo Alto
              </div>
              <Link href="/inventario"
                className="text-xs font-medium transition-colors"
                style={{ color: '#2dd4bf' }}>
                Ver todos →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: '#1e2d3d' }}>
              {!stats.loaded
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className="h-4 w-48 rounded animate-pulse" style={{ background: '#1e2d3d' }} />
                    <div className="h-4 w-24 rounded animate-pulse ml-auto" style={{ background: '#1e2d3d' }} />
                  </div>
                ))
                : topEquipos.map((e, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-800/20 transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>{e.nombre}</div>
                      <div className="text-xs" style={{ color: '#3d5166' }}>{e.marca || '—'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono" style={{ color: '#4a6580' }}>{e.codigo_inventario}</div>
                      <div className="text-xs" style={{ color: '#2dd4bf' }}>{e.servicio || '—'}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Fila 3: Equipos por servicio */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d1626', border: '1px solid #1e2d3d' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e2d3d' }}>
            <div className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Equipos por Servicio</div>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            {!stats.loaded
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: '#1e2d3d' }} />
              ))
              : servicios.map(s => {
                const pct = stats.total > 0 ? ((s.count / stats.total) * 100).toFixed(1) : '0'
                return (
                  <div key={s.nombre} className="rounded-lg p-3"
                    style={{ background: '#111827', border: '1px solid #1e2d3d' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium truncate pr-2" style={{ color: '#7a9bb5' }}>{s.nombre}</div>
                      <div className="text-sm font-bold flex-shrink-0" style={{ color: '#e2e8f0' }}>{s.count}</div>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: '#1e2d3d' }}>
                      <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: '#0d9488' }} />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { href:'/inventario',    icon:<ClipboardList className="w-5 h-5"/>, label:'Ver Inventario',     color:'#2dd4bf' },
            { href:'/mantenimiento', icon:<Wrench className="w-5 h-5"/>,        label:'Mantenimiento',      color:'#818cf8' },
            { href:'/kpis',          icon:<BarChart3 className="w-5 h-5"/>,     label:'Ver KPIs',           color:'#fb923c' },
            { href:'/chat',          icon:<Activity className="w-5 h-5"/>,      label:'Asistente IA',       color:'#34d399' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d', color: a.color }}>
              {a.icon}
              {a.label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
