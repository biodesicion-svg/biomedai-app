'use client'

import { useState } from 'react'
import { Search, Filter, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Equipo } from '@/types'

const equiposMuestra: Equipo[] = [
  { id:'1', codigo_inventario:'UCI-VM-01', nombre:'Ventilador Mecánico', tipo:'Ventilador', marca:'Dräger', modelo:'Evita 4', serie:'SN-2891', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2018, anio_adquisicion:2019, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:85000000, notas:'', activo:true, created_at:'', updated_at:'' },
  { id:'2', codigo_inventario:'UCI-MON-01', nombre:'Monitor Signos Vitales', tipo:'Monitor', marca:'Philips', modelo:'IntelliVue MX700', serie:'SN-4421', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2021, anio_adquisicion:2021, vida_util_anos:8, riesgo:'alto', clase_invima:'IIb', estado:'operativo', valor_adquisicion:45000000, notas:'', activo:true, created_at:'', updated_at:'' },
  { id:'3', codigo_inventario:'URG-DEF-01', nombre:'Desfibrilador', tipo:'Desfibrilador', marca:'Zoll', modelo:'R Series', serie:'SN-7731', ubicacion:'Urgencias', servicio:'Urgencias', anio_fabricacion:2022, anio_adquisicion:2022, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:32000000, notas:'', activo:true, created_at:'', updated_at:'' },
  { id:'4', codigo_inventario:'UCI-BOM-01', nombre:'Bomba de Infusión', tipo:'Bomba', marca:'Braun', modelo:'Infusomat Space', serie:'SN-1192', ubicacion:'UCI', servicio:'Cuidados Intensivos', anio_fabricacion:2020, anio_adquisicion:2020, vida_util_anos:8, riesgo:'medio', clase_invima:'IIb', estado:'mantenimiento', valor_adquisicion:12000000, notas:'', activo:true, created_at:'', updated_at:'' },
  { id:'5', codigo_inventario:'LAB-CEN-01', nombre:'Centrífuga', tipo:'Laboratorio', marca:'Thermo', modelo:'Heraeus Megafuge', serie:'SN-3341', ubicacion:'Laboratorio', servicio:'Laboratorio', anio_fabricacion:2019, anio_adquisicion:2019, vida_util_anos:12, riesgo:'bajo', clase_invima:'I', estado:'operativo', valor_adquisicion:8000000, notas:'', activo:true, created_at:'', updated_at:'' },
  { id:'6', codigo_inventario:'QX-EM-01', nombre:'Electrobisturí', tipo:'Quirúrgico', marca:'Covidien', modelo:'Force FX', serie:'SN-9981', ubicacion:'Cirugía', servicio:'Quirófano', anio_fabricacion:2019, anio_adquisicion:2020, vida_util_anos:10, riesgo:'alto', clase_invima:'III', estado:'operativo', valor_adquisicion:22000000, notas:'', activo:true, created_at:'', updated_at:'' },
]

const riesgoBadge: Record<string, string> = {
  alto:  'bg-red-500/10 text-red-400 border border-red-500/20',
  medio: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  bajo:  'bg-green-500/10 text-green-400 border border-green-500/20',
}

const estadoIcon: Record<string, React.ReactNode> = {
  operativo:      <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  mantenimiento:  <Clock className="w-3.5 h-3.5 text-amber-400" />,
  fuera_servicio: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  baja:           <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />,
}

export default function InventarioPage() {
  const [search, setSearch] = useState('')
  const [filtroRiesgo, setFiltroRiesgo] = useState<string>('todos')

  const equiposFiltrados = equiposMuestra.filter(e => {
    const matchSearch = search === '' ||
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo_inventario.toLowerCase().includes(search.toLowerCase()) ||
      e.marca.toLowerCase().includes(search.toLowerCase()) ||
      e.ubicacion.toLowerCase().includes(search.toLowerCase())
    const matchRiesgo = filtroRiesgo === 'todos' || e.riesgo === filtroRiesgo
    return matchSearch && matchRiesgo
  })

  const stats = {
    total: equiposMuestra.length,
    alto: equiposMuestra.filter(e => e.riesgo === 'alto').length,
    medio: equiposMuestra.filter(e => e.riesgo === 'medio').length,
    bajo: equiposMuestra.filter(e => e.riesgo === 'bajo').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario de Equipos</h1>
          <p className="text-slate-400 text-sm mt-1">{stats.total} equipos registrados</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo equipo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total equipos', value: stats.total, color: 'text-white' },
          { label: 'Riesgo Alto', value: stats.alto, color: 'text-red-400' },
          { label: 'Riesgo Medio', value: stats.medio, color: 'text-amber-400' },
          { label: 'Riesgo Bajo', value: stats.bajo, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, marca, ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-teal-500"
          />
        </div>
        {['todos', 'alto', 'medio', 'bajo'].map(f => (
          <button
            key={f}
            onClick={() => setFiltroRiesgo(f)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filtroRiesgo === f
                ? 'bg-teal-500 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f === 'todos' ? 'Todos' : `🔴`.replace('🔴', f === 'alto' ? '🔴' : f === 'medio' ? '🟡' : '🟢')} {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {['Código', 'Equipo', 'Marca / Modelo', 'Ubicación', 'Clase INVIMA', 'Riesgo', 'Estado'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {equiposFiltrados.map(equipo => (
              <tr key={equipo.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{equipo.codigo_inventario}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-white">{equipo.nombre}</div>
                  <div className="text-xs text-slate-500">{equipo.servicio}</div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{equipo.marca} · {equipo.modelo}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{equipo.ubicacion}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300 font-mono">{equipo.clase_invima}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${riesgoBadge[equipo.riesgo]}`}>
                    {equipo.riesgo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 capitalize">
                    {estadoIcon[equipo.estado]}
                    {equipo.estado.replace('_', ' ')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {equiposFiltrados.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No se encontraron equipos con ese criterio de búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}
