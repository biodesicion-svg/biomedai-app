'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

export default function PresupuestoPage() {
  const [datos, setDatos] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      const { data: equipos } = await supabase
        .from('equipos')
        .select('valor_adquisicion, estado, riesgo, nombre')
        .eq('institucion_id', INSTITUCION_ID)
        .eq('activo', true)

      const { data: mantenimientos } = await supabase
        .from('mantenimientos')
        .select('tipo, costo_total, costo_mano_obra, costo_repuestos, estado')
        .eq('institucion_id', INSTITUCION_ID)

      if (!equipos || !mantenimientos) return

      // Valor total del parque
      const valorParque = equipos
        .filter(e => e.valor_adquisicion)
        .reduce((a, b) => a + Number(b.valor_adquisicion), 0)

      // Costos mantenimiento
      const costoPreventivo = mantenimientos
        .filter(m => m.tipo === 'preventivo' && m.costo_total)
        .reduce((a, b) => a + Number(b.costo_total), 0)

      const costoCorrectivo = mantenimientos
        .filter(m => m.tipo === 'correctivo' && m.costo_total)
        .reduce((a, b) => a + Number(b.costo_total), 0)

      const costoTotal = costoPreventivo + costoCorrectivo

      // Equipos por valor
      const topValor = equipos
        .filter(e => e.valor_adquisicion)
        .sort((a, b) => Number(b.valor_adquisicion) - Number(a.valor_adquisicion))
        .slice(0, 8)

      // Proyección siguiente año (+8% inflación médica)
      const proyeccion = costoTotal * 1.08

      // Recomendación ratio preventivo/correctivo
      const ratioActual = costoCorrectivo > 0 ? costoPreventivo / costoCorrectivo : 0

      setDatos({
        valorParque,
        costoPreventivo,
        costoCorrectivo,
        costoTotal,
        proyeccion,
        ratioActual: ratioActual.toFixed(2),
        topValor,
        totalEquipos: equipos.length,
        bajas: equipos.filter(e => e.estado === 'baja').length,
      })
      setLoading(false)
    }
    cargar()
  }, [])

  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n.toFixed(0)}`
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background:'#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>Presupuesto</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color:'#e2e8f0' }}>
            Control Presupuestal Biomédico
          </h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447' }}>
          <Download className="w-4 h-4"/> Exportar informe
        </button>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6">

        {/* Cards principales */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Valor del Parque',
              value: datos ? fmt(datos.valorParque) : '—',
              sub: 'Costo total de adquisición',
              color: '#2dd4bf',
              icon: <DollarSign className="w-5 h-5"/>
            },
            {
              label: 'Costo Preventivo',
              value: datos ? fmt(datos.costoPreventivo) : '—',
              sub: 'Mantenimientos preventivos',
              color: '#4ade80',
              icon: <TrendingUp className="w-5 h-5"/>
            },
            {
              label: 'Costo Correctivo',
              value: datos ? fmt(datos.costoCorrectivo) : '—',
              sub: 'Mantenimientos correctivos',
              color: '#f87171',
              icon: <TrendingDown className="w-5 h-5"/>
            },
            {
              label: 'Proyección 2026',
              value: datos ? fmt(datos.proyeccion) : '—',
              sub: '+8% inflación médica estimada',
              color: '#fb923c',
              icon: <AlertTriangle className="w-5 h-5"/>
            },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-5 relative overflow-hidden"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:c.color, opacity:0.5 }}/>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background:c.color+'15', color:c.color }}>
                {c.icon}
              </div>
              {loading
                ? <div className="h-8 w-24 rounded animate-pulse mb-2" style={{ background:'#1e2d3d' }}/>
                : <div className="text-2xl font-bold mb-1" style={{ color:c.color }}>{c.value}</div>
              }
              <div className="text-xs font-bold mb-0.5" style={{ color:'#7a9bb5' }}>{c.label}</div>
              <div className="text-xs" style={{ color:'#3d5166' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Fila 2 */}
        <div className="grid grid-cols-3 gap-4">

          {/* Análisis ratio */}
          <div className="rounded-xl p-5" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="text-sm font-bold mb-4" style={{ color:'#e2e8f0' }}>
              Análisis Presupuestal
            </div>

            {loading
              ? <div className="space-y-3">
                  {Array.from({length:4}).map((_,i) => (
                    <div key={i} className="h-10 rounded animate-pulse" style={{ background:'#1e2d3d' }}/>
                  ))}
                </div>
              : (
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ background:'#111827', border:'1px solid #1e2d3d' }}>
                    <div className="text-xs mb-1" style={{ color:'#3d5166' }}>Ratio Prev/Corr actual</div>
                    <div className="text-xl font-bold" style={{
                      color: Number(datos.ratioActual) >= 0.8 ? '#4ade80' : '#f87171'
                    }}>
                      {datos.costoCorrectivo > 0 ? datos.ratioActual : 'N/D'}
                    </div>
                    <div className="text-xs mt-1" style={{ color:'#3d5166' }}>Meta: ≥ 0.80</div>
                  </div>

                  <div className="rounded-lg p-3" style={{ background:'#111827', border:'1px solid #1e2d3d' }}>
                    <div className="text-xs mb-1" style={{ color:'#3d5166' }}>Equipos activos</div>
                    <div className="text-xl font-bold" style={{ color:'#e2e8f0' }}>{datos.totalEquipos}</div>
                  </div>

                  <div className="rounded-lg p-3" style={{ background:'#111827', border:'1px solid #1e2d3d' }}>
                    <div className="text-xs mb-1" style={{ color:'#3d5166' }}>Equipos dados de baja</div>
                    <div className="text-xl font-bold" style={{ color:'#f87171' }}>{datos.bajas}</div>
                    <div className="text-xs mt-1" style={{ color:'#3d5166' }}>Posible renovación de inversión</div>
                  </div>

                  {datos.costoCorrectivo > datos.costoPreventivo && (
                    <div className="rounded-lg p-3" style={{ background:'#ef444410', border:'1px solid #ef444430' }}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color:'#f87171' }}/>
                        <div>
                          <div className="text-xs font-bold mb-1" style={{ color:'#f87171' }}>Alerta presupuestal</div>
                          <div className="text-xs" style={{ color:'#fca5a5' }}>
                            El costo correctivo supera al preventivo. Se recomienda aumentar la frecuencia de mantenimientos preventivos.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          </div>

          {/* Top equipos por valor */}
          <div className="col-span-2 rounded-xl overflow-hidden"
            style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #1e2d3d' }}>
              <div className="text-sm font-bold" style={{ color:'#e2e8f0' }}>
                Top Equipos por Valor de Adquisición
              </div>
              <div className="text-xs mt-0.5" style={{ color:'#3d5166' }}>
                Equipos que representan mayor inversión en el parque
              </div>
            </div>
            <div className="divide-y" style={{ borderColor:'#1e2d3d' }}>
              {loading
                ? Array.from({length:7}).map((_,i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                    <div className="h-4 w-48 rounded" style={{ background:'#1e2d3d' }}/>
                    <div className="h-4 w-24 rounded ml-auto" style={{ background:'#1e2d3d' }}/>
                  </div>
                ))
                : datos?.topValor.map((e: any, i: number) => {
                  const pct = datos.valorParque > 0
                    ? ((Number(e.valor_adquisicion) / datos.valorParque) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="text-sm font-medium" style={{ color:'#e2e8f0' }}>{e.nombre}</div>
                          <div className="text-xs" style={{ color:'#3d5166' }}>
                            {e.riesgo === 'alto' ? '🔴' : e.riesgo === 'medio' ? '🟡' : '🟢'} {e.riesgo} · {e.estado}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono" style={{ color:'#2dd4bf' }}>
                            {fmt(Number(e.valor_adquisicion))}
                          </div>
                          <div className="text-xs" style={{ color:'#3d5166' }}>{pct}% del parque</div>
                        </div>
                      </div>
                      <div className="h-1 rounded-full" style={{ background:'#1e2d3d' }}>
                        <div className="h-1 rounded-full"
                          style={{ width:`${Math.min(Number(pct)*5, 100)}%`, background:'#0d9488' }}/>
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
