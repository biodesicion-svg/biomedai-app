'use client'

import { useState } from 'react'
import {
  Search, Plus, AlertTriangle, CheckCircle,
  Clock, ChevronDown, Filter, Download
} from 'lucide-react'
import type { Equipo } from '@/types'

const equiposMuestra: Equipo[] = [
  { id:'1', codigo_inventario:'UCI-VM-01', nombre:'Ventilador Mecánico', tipo:'Ventilador', marca:'Dräger', modelo:'Evita 4', serie:'SN-2891', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2018, anio_adquisicion:2019, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:85000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-03-01' },
  { id:'2', codigo_inventario:'UCI-MON-01', nombre:'Monitor Signos Vitales', tipo:'Monitor', marca:'Philips', modelo:'IntelliVue MX700', serie:'SN-4421', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2021, anio_adquisicion:2021, vida_util_anos:8, riesgo:'alto', clase_invima:'IIb', estado:'operativo', valor_adquisicion:45000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-02-20' },
  { id:'3', codigo_inventario:'URG-DEF-01', nombre:'Desfibrilador', tipo:'Desfibrilador', marca:'Zoll', modelo:'R Series', serie:'SN-7731', ubicacion:'Urgencias', servicio:'Urgencias', anio_fabricacion:2022, anio_adquisicion:2022, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:32000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-03-15' },
  { id:'4', codigo_inventario:'UCI-BOM-01', nombre:'Bomba de Infusión', tipo:'Bomba', marca:'Braun', modelo:'Infusomat Space', serie:'SN-1192', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2020, anio_adquisicion:2020, vida_util_anos:8, riesgo:'medio', clase_invima:'IIb', estado:'mantenimiento', valor_adquisicion:12000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-02-15' },
  { id:'5', codigo_inventario:'LAB-CEN-01', nombre:'Centrífuga', tipo:'Laboratorio', marca:'Thermo', modelo:'Heraeus Megafuge', serie:'SN-3341', ubicacion:'Laboratorio', servicio:'Laboratorio', anio_fabricacion:2019, anio_adquisicion:2019, vida_util_anos:12, riesgo:'bajo', clase_invima:'I', estado:'operativo', valor_adquisicion:8000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-01-10' },
  { id:'6', codigo_inventario:'QX-EM-01', nombre:'Electrobisturí', tipo:'Quirúrgico', marca:'Covidien', modelo:'Force FX', serie:'SN-9981', ubicacion:'Cirugía', servicio:'Quirófano', anio_fabricacion:2019, anio_adquisicion:2020, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:22000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-01-28' },
  { id:'7', codigo_inventario:'NEO-INC-01', nombre:'Incubadora Neonatal', tipo:'Neonatal', marca:'Dräger', modelo:'Isolette 8000', serie:'SN-5512', ubicacion:'Neonatos', servicio:'Neonatología', anio_fabricacion:2018, anio_adquisicion:2018, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:68000000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-01-20' },
  { id:'8', codigo_inventario:'HOD-ECG-01', nombre:'Electrocardiógrafo', tipo:'Diagnóstico', marca:'Mortara', modelo:'Eli 250c', serie:'SN-6621', ubicacion:'Hospitalización', servicio:'Hospitalización', anio_fabricacion:2021, anio_adquisicion:2021, vida_util_anos:8, riesgo:'medio', clase_invima:'IIa', estado:'operativo', valor_adquisicion:9500000, notas:'', activo:true, created_at:'2024-01-15', updated_at:'2025-03-01' },
]

const riesgoConfig: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  alto:  { label:'Alto',  dot:'#ef4444', text:'#fca5a5', bg:'#ef444410', border:'#ef444425' },
  medio: { label:'Medio', dot:'#f59e0b', text:'#fcd34d', bg:'#f59e0b10', border:'#f59e0b25' },
  bajo:  { label:'Bajo',  dot:'#10b981', text:'#6ee7b7', bg:'#10b98110', border:'#10b98125' },
}

const estadoConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  operativo:      { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Operativo',      color: '#10b981' },
  mantenimiento:  { icon: <Clock className="w-3.5 h-3.5" />,       label: 'Mantenimiento',  color: '#f59e0b' },
  fuera_servicio: { icon: <AlertTriangle className="w-3.5 h-3.5" />,label: 'Fuera servicio', color: '#ef4444' },
  baja:           { icon: <AlertTriangle className="w-3.5 h-3.5" />,label: 'Baja',           color: '#64748b' },
}

export default function InventarioPage() {
  const [search, setSearch] = useState('')
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtrados = equiposMuestra.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.nombre.toLowerCase().includes(q) ||
      e.codigo_inventario.toLowerCase().includes(q) ||
      e.marca.toLowerCase().includes(q) ||
      e.ubicacion.toLowerCase().includes(q)
    const matchRiesgo = filtroRiesgo === 'todos' || e.riesgo === filtroRiesgo
    return matchSearch && matchRiesgo
  })

  const stats = [
    { label: 'Total equipos',  value: equiposMuestra.length,                              color: '#e2e8f0' },
    { label: 'Riesgo alto',    value: equiposMuestra.filter(e=>e.riesgo==='alto').length,  color: '#fca5a5' },
    { label: 'Riesgo medio',   value: equiposMuestra.filter(e=>e.riesgo==='medio').length, color: '#fcd34d' },
    { label: 'En mantenimiento', value: equiposMuestra.filter(e=>e.estado==='mantenimiento').length, color: '#7dd3fc' },
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
            <span className="text-xs font-medium" style={{ color: '#2dd4bf' }}>Inventario</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#e2e8f0' }}>
            Inventario de Equipos Biomédicos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: '#1e2d3d', color: '#7a9bb5', border: '1px solid #253447' }}>
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#0d9488', color: '#fff' }}>
            <Plus className="w-4 h-4" />
            Nuevo equipo
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl p-5"
              style={{ background: '#0d1626', border: '1px solid #1e2d3d' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: '#3d5166' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3d5166' }} />
            <input
              type="text"
              placeholder="Buscar equipo, código, marca, ubicación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none transition-all"
              style={{
                background: '#0d1626',
                border: '1px solid #1e2d3d',
                color: '#e2e8f0',
              }}
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#0d1626', border: '1px solid #1e2d3d' }}>
            {['todos', 'alto', 'medio', 'bajo'].map(f => (
              <button key={f} onClick={() => setFiltroRiesgo(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={{
                  background: filtroRiesgo === f ? '#1e2d3d' : 'transparent',
                  color: filtroRiesgo === f
                    ? f === 'alto' ? '#fca5a5' : f === 'medio' ? '#fcd34d' : f === 'bajo' ? '#6ee7b7' : '#e2e8f0'
                    : '#3d5166',
                }}>
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: '#0d1626', border: '1px solid #1e2d3d', color: '#3d5166' }}>
            <Filter className="w-4 h-4" />
            <span className="text-xs">{filtrados.length} resultados</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d3d' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0d1626', borderBottom: '1px solid #1e2d3d' }}>
                {['Código', 'Equipo / Servicio', 'Fabricante', 'Ubicación', 'Clase INVIMA', 'Riesgo', 'Estado', 'Últ. actualización'].map(h => (
                  <th key={h} className="text-left px-4 py-3">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#3d5166' }}>
                      {h}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((equipo, i) => {
                const rc = riesgoConfig[equipo.riesgo]
                const ec = estadoConfig[equipo.estado]
                const isSelected = selectedId === equipo.id
                return (
                  <tr key={equipo.id}
                    onClick={() => setSelectedId(isSelected ? null : equipo.id)}
                    className="cursor-pointer transition-all"
                    style={{
                      background: isSelected ? '#0d9488' + '08' : i % 2 === 0 ? '#080e16' : '#0a1120',
                      borderBottom: '1px solid #1e2d3d',
                      borderLeft: isSelected ? '2px solid #0d9488' : '2px solid transparent',
                    }}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-medium" style={{ color: '#4a6580' }}>
                        {equipo.codigo_inventario}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{equipo.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#3d5166' }}>{equipo.servicio}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm" style={{ color: '#7a9bb5' }}>{equipo.marca}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#3d5166' }}>{equipo.modelo}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ background: '#1e2d3d', color: '#7a9bb5' }}>
                        {equipo.ubicacion}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-bold" style={{ color: '#4a6580' }}>
                        {equipo.clase_invima}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc.dot }} />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                          {rc.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: ec.color }}>
                        {ec.icon}
                        {ec.label}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: '#3d5166' }}>
                        {equipo.updated_at}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <div className="py-16 text-center" style={{ color: '#3d5166' }}>
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron equipos con ese criterio</p>
            </div>
          )}
        </div>

        {/* Footer tabla */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-xs" style={{ color: '#3d5166' }}>
            Mostrando {filtrados.length} de {equiposMuestra.length} equipos
          </span>
          <span className="text-xs font-mono" style={{ color: '#253447' }}>
            Res. 4816/2008 · INVIMA
          </span>
        </div>

      </div>
    </div>
  )
}
