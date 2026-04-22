'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, CheckCircle, Clock, Filter, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

const riesgoConfig: Record<string, { dot: string; text: string; bg: string; border: string; label: string }> = {
  alto:  { dot:'#ef4444', text:'#fca5a5', bg:'#ef444410', border:'#ef444425', label:'Alto' },
  medio: { dot:'#f59e0b', text:'#fcd34d', bg:'#f59e0b10', border:'#f59e0b25', label:'Medio' },
  bajo:  { dot:'#10b981', text:'#6ee7b7', bg:'#10b98110', border:'#10b98125', label:'Bajo' },
}

const estadoConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  operativo:      { icon: <CheckCircle className="w-3.5 h-3.5" />, label:'Operativo',      color:'#10b981' },
  mantenimiento:  { icon: <Clock className="w-3.5 h-3.5" />,       label:'Mantenimiento',  color:'#f59e0b' },
  fuera_servicio: { icon: <AlertTriangle className="w-3.5 h-3.5" />,label:'Fuera servicio', color:'#ef4444' },
  baja:           { icon: <AlertTriangle className="w-3.5 h-3.5" />,label:'Baja',           color:'#64748b' },
}

export default function InventarioPage() {
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    async function cargarEquipos() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('institucion_id', INSTITUCION_ID)
        .eq('activo', true)
        .order('nombre')

      if (error) {
        console.error('Error cargando equipos:', error)
      } else {
        setEquipos(data || [])
      }
      setLoading(false)
    }
    cargarEquipos()
  }, [])

  const filtrados = equipos.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.nombre?.toLowerCase().includes(q) ||
      e.codigo_inventario?.toLowerCase().includes(q) ||
      e.marca?.toLowerCase().includes(q) ||
      e.servicio?.toLowerCase().includes(q) ||
      e.modelo?.toLowerCase().includes(q)
    const matchRiesgo = filtroRiesgo === 'todos' || e.riesgo === filtroRiesgo
    const matchEstado = filtroEstado === 'todos' || e.estado === filtroEstado
    return matchSearch && matchRiesgo && matchEstado
  })

  const stats = [
    { label:'Total equipos',    value: equipos.length,                               color:'#e2e8f0' },
    { label:'Riesgo alto',      value: equipos.filter(e=>e.riesgo==='alto').length,  color:'#fca5a5' },
    { label:'Riesgo medio',     value: equipos.filter(e=>e.riesgo==='medio').length, color:'#fcd34d' },
    { label:'Dados de baja',    value: equipos.filter(e=>e.estado==='baja').length,  color:'#94a3b8' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>Inventario</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color:'#e2e8f0' }}>
            Inventario de Equipos Biomédicos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447' }}>
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background:'#0d9488', color:'#fff' }}>
            <Plus className="w-4 h-4" /> Nuevo equipo
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
                ? <div className="h-8 w-16 rounded animate-pulse" style={{ background:'#1e2d3d' }} />
                : <div className="text-3xl font-bold mb-1" style={{ color:s.color }}>{s.value}</div>
              }
              <div className="text-sm" style={{ color:'#3d5166' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'#3d5166' }} />
            <input
              type="text"
              placeholder="Buscar equipo, código, marca, servicio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#e2e8f0' }}
            />
          </div>

          {/* Filtro riesgo */}
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            {['todos','alto','medio','bajo'].map(f => (
              <button key={f} onClick={() => setFiltroRiesgo(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={{
                  background: filtroRiesgo === f ? '#1e2d3d' : 'transparent',
                  color: filtroRiesgo === f
                    ? f==='alto' ? '#fca5a5' : f==='medio' ? '#fcd34d' : f==='bajo' ? '#6ee7b7' : '#e2e8f0'
                    : '#3d5166',
                }}>
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>

          {/* Filtro estado */}
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            {[
              { val:'todos', label:'Todos' },
              { val:'operativo', label:'Operativo' },
              { val:'baja', label:'Baja' },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltroEstado(f.val)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: filtroEstado === f.val ? '#1e2d3d' : 'transparent',
                  color: filtroEstado === f.val ? '#e2e8f0' : '#3d5166',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d', color:'#3d5166' }}>
            <Filter className="w-4 h-4" />
            <span className="text-xs">{filtrados.length} resultados</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #1e2d3d' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background:'#0d1626', borderBottom:'1px solid #1e2d3d' }}>
                {['Código','Equipo / Servicio','Marca · Modelo','Serie','Clase INVIMA','Riesgo','Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color:'#3d5166' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #1e2d3d' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 rounded animate-pulse" style={{ background:'#1e2d3d', width: j===1?'140px':'80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtrados.slice(0, 100).map((equipo, i) => {
                const rc = riesgoConfig[equipo.riesgo] || riesgoConfig.bajo
                const ec = estadoConfig[equipo.estado] || estadoConfig.operativo
                return (
                  <tr key={equipo.id} className="transition-all cursor-pointer"
                    style={{
                      background: i % 2 === 0 ? '#080e16' : '#0a1120',
                      borderBottom:'1px solid #1e2d3d',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0d1626')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#080e16' : '#0a1120')}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs" style={{ color:'#4a6580' }}>
                        {equipo.codigo_inventario}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>{equipo.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color:'#3d5166' }}>{equipo.servicio || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm" style={{ color:'#7a9bb5' }}>{equipo.marca || '—'}</div>
                      <div className="text-xs mt-0.5" style={{ color:'#3d5166' }}>{equipo.modelo || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs" style={{ color:'#4a6580' }}>
                        {equipo.serie || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-bold" style={{ color:'#4a6580' }}>
                        {equipo.clase_invima || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background:rc.dot }} />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background:rc.bg, color:rc.text, border:`1px solid ${rc.border}` }}>
                          {rc.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color:ec.color }}>
                        {ec.icon} {ec.label}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!loading && filtrados.length === 0 && (
            <div className="py-16 text-center" style={{ color:'#3d5166' }}>
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron equipos</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-xs" style={{ color:'#3d5166' }}>
            Mostrando {Math.min(filtrados.length, 100)} de {filtrados.length} equipos
            {filtrados.length !== equipos.length && ` (filtrado de ${equipos.length} total)`}
          </span>
          <span className="text-xs font-mono" style={{ color:'#253447' }}>
            Res. 4816/2008 · INVIMA
          </span>
        </div>
      </div>
    </div>
  )
}
