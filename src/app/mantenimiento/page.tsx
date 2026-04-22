'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Search, Plus, Filter, CheckCircle,
  Clock, AlertTriangle, Wrench, Calendar, Download
} from 'lucide-react'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

const tipoConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  preventivo:  { label:'Preventivo',  color:'#4ade80', bg:'#16a34a15', border:'#16a34a30' },
  correctivo:  { label:'Correctivo',  color:'#f87171', bg:'#ef444415', border:'#ef444430' },
  calibracion: { label:'Calibración', color:'#fcd34d', bg:'#f59e0b15', border:'#f59e0b30' },
  inspeccion:  { label:'Inspección',  color:'#818cf8', bg:'#6366f115', border:'#6366f130' },
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  programado:   { label:'Programado',  color:'#7a9bb5', icon:<Calendar className="w-3.5 h-3.5"/> },
  en_progreso:  { label:'En progreso', color:'#fcd34d', icon:<Clock className="w-3.5 h-3.5"/> },
  completado:   { label:'Completado',  color:'#4ade80', icon:<CheckCircle className="w-3.5 h-3.5"/> },
  cancelado:    { label:'Cancelado',   color:'#f87171', icon:<AlertTriangle className="w-3.5 h-3.5"/> },
}

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('mantenimientos')
        .select(`
          *,
          equipos (
            nombre,
            marca,
            codigo_inventario,
            servicio,
            riesgo
          )
        `)
        .eq('institucion_id', INSTITUCION_ID)
        .order('fecha_programada', { ascending: false })
        .limit(200)

      if (error) console.error(error)
      else setMantenimientos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const filtrados = mantenimientos.filter(m => {
    const q = search.toLowerCase()
    const equipo = m.equipos
    const matchSearch = !q ||
      equipo?.nombre?.toLowerCase().includes(q) ||
      equipo?.codigo_inventario?.toLowerCase().includes(q) ||
      equipo?.servicio?.toLowerCase().includes(q) ||
      m.descripcion?.toLowerCase().includes(q)
    const matchTipo   = filtroTipo === 'todos' || m.tipo === filtroTipo
    const matchEstado = filtroEstado === 'todos' || m.estado === filtroEstado
    return matchSearch && matchTipo && matchEstado
  })

  const stats = [
    { label:'Total órdenes',   value: mantenimientos.length,                                        color:'#e2e8f0' },
    { label:'Completados',     value: mantenimientos.filter(m=>m.estado==='completado').length,     color:'#4ade80' },
    { label:'Programados',     value: mantenimientos.filter(m=>m.estado==='programado').length,     color:'#7a9bb5' },
    { label:'Correctivos',     value: mantenimientos.filter(m=>m.tipo==='correctivo').length,       color:'#f87171' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>Mantenimiento</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color:'#e2e8f0' }}>
            Gestión de Mantenimiento
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447' }}>
            <Download className="w-4 h-4"/> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background:'#0d9488', color:'#fff' }}>
            <Plus className="w-4 h-4"/> Nueva orden
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl p-5"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              {loading
                ? <div className="h-9 w-16 rounded animate-pulse mb-2" style={{ background:'#1e2d3d' }}/>
                : <div className="text-3xl font-bold mb-1" style={{ color:s.color }}>{s.value}</div>
              }
              <div className="text-sm" style={{ color:'#3d5166' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'#3d5166' }}/>
            <input
              type="text"
              placeholder="Buscar por equipo, código, servicio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#e2e8f0' }}
            />
          </div>

          {/* Tipo */}
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            {['todos','preventivo','correctivo','calibracion'].map(f => (
              <button key={f} onClick={() => setFiltroTipo(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={{
                  background: filtroTipo === f ? '#1e2d3d' : 'transparent',
                  color: filtroTipo === f ? '#e2e8f0' : '#3d5166',
                }}>
                {f === 'todos' ? 'Todos' : tipoConfig[f]?.label}
              </button>
            ))}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            {['todos','programado','completado'].map(f => (
              <button key={f} onClick={() => setFiltroEstado(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={{
                  background: filtroEstado === f ? '#1e2d3d' : 'transparent',
                  color: filtroEstado === f ? '#e2e8f0' : '#3d5166',
                }}>
                {f === 'todos' ? 'Todos' : estadoConfig[f]?.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#3d5166' }}>
            <Filter className="w-4 h-4"/>
            <span className="text-xs">{filtrados.length} órdenes</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #1e2d3d' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background:'#0d1626', borderBottom:'1px solid #1e2d3d' }}>
                {['Equipo / Servicio','Tipo','Estado','Fecha programada','Duración','Costo total','Técnico'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color:'#3d5166' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #1e2d3d' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 rounded animate-pulse"
                          style={{ background:'#1e2d3d', width: j===0?'160px':'80px' }}/>
                      </td>
                    ))}
                  </tr>
                ))
                : filtrados.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm" style={{ color:'#3d5166' }}>
                        <Wrench className="w-8 h-8 mx-auto mb-3 opacity-30"/>
                        <p>No hay órdenes de mantenimiento registradas aún.</p>
                        <p className="mt-1 text-xs">Crea la primera orden con el botón "Nueva orden"</p>
                      </td>
                    </tr>
                  )
                  : filtrados.map((m, i) => {
                    const tc = tipoConfig[m.tipo] || tipoConfig.preventivo
                    const ec = estadoConfig[m.estado] || estadoConfig.programado
                    const equipo = m.equipos
                    return (
                      <tr key={m.id}
                        className="transition-all cursor-pointer"
                        style={{
                          background: i % 2 === 0 ? '#080e16' : '#0a1120',
                          borderBottom:'1px solid #1e2d3d',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#0d1626')}
                        onMouseLeave={e => (e.currentTarget.style.background = i%2===0?'#080e16':'#0a1120')}
                      >
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>
                            {equipo?.nombre || '—'}
                          </div>
                          <div className="text-xs mt-0.5 font-mono" style={{ color:'#3d5166' }}>
                            {equipo?.codigo_inventario} · {equipo?.servicio}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded"
                            style={{ background:tc.bg, color:tc.color, border:`1px solid ${tc.border}` }}>
                            {tc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color:ec.color }}>
                            {ec.icon} {ec.label}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono" style={{ color:'#7a9bb5' }}>
                            {m.fecha_programada || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm" style={{ color:'#7a9bb5' }}>
                            {m.duracion_horas ? `${m.duracion_horas}h` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono" style={{ color:'#4ade80' }}>
                            {m.costo_total
                              ? `$${Number(m.costo_total).toLocaleString('es-CO')}`
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs" style={{ color:'#4a6580' }}>
                            {m.tecnico_id ? 'Asignado' : 'Sin asignar'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-xs" style={{ color:'#3d5166' }}>
            {filtrados.length} órdenes · tabla de mantenimiento
          </span>
          <span className="text-xs font-mono" style={{ color:'#253447' }}>
            Res. 4816/2008
          </span>
        </div>

      </div>
    </div>
  )
}
