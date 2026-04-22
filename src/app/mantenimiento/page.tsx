'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Wrench, AlertTriangle, CheckCircle, Download } from 'lucide-react'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const riesgoColor: Record<string, string> = {
  alto: '#ef4444', medio: '#f59e0b', bajo: '#10b981'
}

const tipoColor: Record<string, { bg: string; text: string; border: string }> = {
  preventivo:  { bg:'#16a34a15', text:'#4ade80', border:'#16a34a30' },
  calibracion: { bg:'#f59e0b15', text:'#fcd34d', border:'#f59e0b30' },
  correctivo:  { bg:'#ef444415', text:'#f87171', border:'#ef444430' },
}

export default function MantenimientoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<'cronograma' | 'anual' | 'lista'>('cronograma')
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetch('/api/mantenimientos')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const mesActual = data?.cronogramaMensual?.[mesSeleccionado] || []
  const horasMes = mesActual.reduce((a: number, b: any) => a + b.horas, 0)

  if (error) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'#080e16' }}>
      <div className="text-center p-8 rounded-xl" style={{ background:'#0d1626', border:'1px solid #ef444430' }}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color:'#f87171' }}/>
        <p className="text-sm font-bold mb-1" style={{ color:'#f87171' }}>Error</p>
        <p className="text-xs" style={{ color:'#3d5166' }}>{error}</p>
      </div>
    </div>
  )

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
            Cronograma de Mantenimiento Preventivo 2025
          </h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447' }}>
          <Download className="w-4 h-4"/> Exportar PDF
        </button>
      </div>

      <div className="flex-1 px-8 py-6 space-y-5 overflow-auto">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label:'Equipos activos',     value: data?.stats?.totalEquipos,   color:'#e2e8f0' },
            { label:'Cada 6 meses',        value: data?.stats?.cada6meses,     color:'#f87171' },
            { label:'Cada 12 meses',       value: data?.stats?.cada12meses,    color:'#4ade80' },
            { label:'Intervenciones/año',  value: data?.stats?.totalInterv,    color:'#2dd4bf' },
            { label:'Horas técnico/año',   value: data?.stats?.horasTotales,   color:'#fb923c' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              {loading
                ? <div className="h-7 w-12 rounded animate-pulse mb-1" style={{ background:'#1e2d3d' }}/>
                : <div className="text-2xl font-bold mb-0.5" style={{ color:s.color }}>{s.value?.toLocaleString()}</div>
              }
              <div className="text-xs" style={{ color:'#3d5166' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit"
          style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
          {[
            { id:'cronograma', label:'📅 Cronograma Mensual' },
            { id:'anual',      label:'📊 Vista Anual' },
            { id:'lista',      label:'📋 Lista de Equipos' },
          ].map(t => (
            <button key={t.id} onClick={() => setVista(t.id as any)}
              className="px-4 py-2 rounded-md text-xs font-semibold transition-all"
              style={{
                background: vista === t.id ? '#1e2d3d' : 'transparent',
                color: vista === t.id ? '#e2e8f0' : '#3d5166',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* CRONOGRAMA MENSUAL */}
        {vista === 'cronograma' && (
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl overflow-hidden" style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                style={{ borderBottom:'1px solid #1e2d3d', color:'#3d5166' }}>
                Mes
              </div>
              <div className="p-2">
                {MESES.map((mes, i) => {
                  const numMes = i + 1
                  const items = data?.cronogramaMensual?.[numMes] || []
                  const horas = items.reduce((a: number, b: any) => a + b.horas, 0)
                  const esActual = numMes === new Date().getMonth() + 1
                  return (
                    <button key={mes} onClick={() => setMesSeleccionado(numMes)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-0.5 transition-all"
                      style={{
                        background: mesSeleccionado === numMes ? '#0d948820' : 'transparent',
                        border: mesSeleccionado === numMes ? '1px solid #0d948840' : '1px solid transparent',
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{
                          color: mesSeleccionado === numMes ? '#2dd4bf' : '#7a9bb5'
                        }}>{mes}</span>
                        {esActual && <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background:'#0d948820', color:'#2dd4bf' }}>Hoy</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold" style={{ color: items.length>0?'#e2e8f0':'#3d5166' }}>
                          {items.length} tipos
                        </div>
                        <div className="text-xs" style={{ color:'#3d5166' }}>{horas}h</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="col-span-3 rounded-xl overflow-hidden"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom:'1px solid #1e2d3d' }}>
                <div>
                  <div className="text-base font-bold" style={{ color:'#e2e8f0' }}>
                    {MESES[mesSeleccionado-1]} 2025 — Plan de Mantenimiento
                  </div>
                  <div className="text-xs mt-0.5" style={{ color:'#3d5166' }}>
                    {mesActual.length} tipos · {horasMes} horas estimadas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color:'#3d5166' }}>Intervenciones</div>
                  <div className="text-xl font-bold" style={{ color:'#2dd4bf' }}>
                    {mesActual.reduce((a: number, b: any) => a + b.cantidad, 0)}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({length:5}).map((_,i) => (
                    <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background:'#1e2d3d' }}/>
                  ))}
                </div>
              ) : mesActual.length === 0 ? (
                <div className="py-16 text-center" style={{ color:'#3d5166' }}>
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">No hay mantenimientos programados este mes</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor:'#1e2d3d' }}>
                  {mesActual
                    .sort((a: any, b: any) => {
                      const o: Record<string,number> = {alto:0,medio:1,bajo:2}
                      return (o[a.riesgo]||0)-(o[b.riesgo]||0)
                    })
                    .map((item: any, i: number) => {
                      const tc = tipoColor[item.tipo] || tipoColor.preventivo
                      return (
                        <div key={i} className="px-5 py-4 flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: riesgoColor[item.riesgo]||'#64748b' }}/>
                          <div className="flex-1">
                            <div className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>{item.nombre}</div>
                            <div className="text-xs mt-0.5" style={{ color:'#3d5166' }}>
                              {item.frecuencia} · {item.cantidad} unidades
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded"
                            style={{ background:tc.bg, color:tc.text, border:`1px solid ${tc.border}` }}>
                            {item.tipo}
                          </span>
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color:'#e2e8f0' }}>{item.cantidad}</div>
                            <div className="text-xs" style={{ color:'#3d5166' }}>unidades</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color:'#2dd4bf' }}>{item.horas}h</div>
                            <div className="text-xs" style={{ color:'#3d5166' }}>estimadas</div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA ANUAL */}
        {vista === 'anual' && (
          <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #1e2d3d' }}>
            <div style={{ overflowX:'auto' }}>
              <table className="w-full" style={{ minWidth:'1000px' }}>
                <thead>
                  <tr style={{ background:'#0d1626', borderBottom:'1px solid #1e2d3d' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color:'#3d5166', minWidth:'200px' }}>Equipo</th>
                    {MESES.map(m => (
                      <th key={m} className="px-2 py-3 text-xs font-semibold uppercase text-center"
                        style={{ color:'#3d5166', minWidth:'52px' }}>{m}</th>
                    ))}
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center"
                      style={{ color:'#3d5166' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:10}).map((_,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #1e2d3d' }}>
                        <td className="px-4 py-3"><div className="h-4 w-40 rounded animate-pulse" style={{ background:'#1e2d3d' }}/></td>
                        {MESES.map(m => <td key={m} className="px-2 py-3 text-center"><div className="h-6 w-8 rounded animate-pulse mx-auto" style={{ background:'#1e2d3d' }}/></td>)}
                        <td className="px-4 py-3 text-center"><div className="h-4 w-8 rounded animate-pulse mx-auto" style={{ background:'#1e2d3d' }}/></td>
                      </tr>
                    ))
                    : data?.tiposMap?.map((tipo: any, i: number) => {
                      const tc = tipoColor[tipo.tipo] || tipoColor.preventivo
                      const totalAno = tipo.cantidad * (12 / tipo.frecMeses)
                      return (
                        <tr key={i} style={{
                          background: i%2===0?'#080e16':'#0a1120',
                          borderBottom:'1px solid #1e2d3d'
                        }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full"
                                style={{ background: riesgoColor[tipo.riesgo] }}/>
                              <div>
                                <div className="text-xs font-semibold" style={{ color:'#e2e8f0' }}>{tipo.nombre}</div>
                                <div className="text-xs" style={{ color:'#3d5166' }}>{tipo.cantidad} uds</div>
                              </div>
                            </div>
                          </td>
                          {Array.from({length:12},(_,m)=>m+1).map(mes => {
                            const tiene = tipo.meses.includes(mes)
                            return (
                              <td key={mes} className="px-2 py-3 text-center">
                                {tiene ? (
                                  <div className="mx-auto w-8 h-7 rounded flex items-center justify-center text-xs font-bold"
                                    style={{ background:tc.bg, color:tc.text, border:`1px solid ${tc.border}` }}>
                                    {tipo.tipo==='calibracion'?'Cal':'P'}
                                  </div>
                                ) : (
                                  <span style={{ color:'#1e2d3d' }}>—</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold" style={{ color:'#2dd4bf' }}>{totalAno}</span>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop:'1px solid #1e2d3d' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background:'#4ade80' }}/>
                <span className="text-xs" style={{ color:'#3d5166' }}>P = Preventivo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background:'#fcd34d' }}/>
                <span className="text-xs" style={{ color:'#3d5166' }}>Cal = Calibración</span>
              </div>
              <span className="text-xs ml-auto" style={{ color:'#253447' }}>Res. 4816/2008</span>
            </div>
          </div>
        )}

        {/* LISTA */}
        {vista === 'lista' && (
          <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #1e2d3d' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background:'#0d1626', borderBottom:'1px solid #1e2d3d' }}>
                  {['Tipo de Equipo','Riesgo','Frecuencia','Tipo','Unidades','Horas/Interv','Meses','Total Año'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color:'#3d5166' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({length:8}).map((_,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #1e2d3d' }}>
                      {Array.from({length:8}).map((_,j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded animate-pulse" style={{ background:'#1e2d3d', width:j===0?'140px':'60px' }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                  : data?.tiposMap?.map((tipo: any, i: number) => {
                    const tc = tipoColor[tipo.tipo] || tipoColor.preventivo
                    return (
                      <tr key={i} style={{
                        background: i%2===0?'#080e16':'#0a1120',
                        borderBottom:'1px solid #1e2d3d'
                      }}>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color:'#e2e8f0' }}>{tipo.nombre}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background:riesgoColor[tipo.riesgo] }}/>
                            <span className="text-xs capitalize" style={{ color:riesgoColor[tipo.riesgo] }}>{tipo.riesgo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color:'#7a9bb5' }}>Cada {tipo.frecMeses} meses</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                            style={{ background:tc.bg, color:tc.text, border:`1px solid ${tc.border}` }}>
                            {tipo.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color:'#e2e8f0' }}>{tipo.cantidad}</td>
                        <td className="px-4 py-3 text-sm" style={{ color:'#7a9bb5' }}>{tipo.horas}h</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color:'#4a6580' }}>
                          {tipo.meses.map((m: number) => MESES[m-1]).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color:'#2dd4bf' }}>
                          {tipo.cantidad * (12 / tipo.frecMeses)}
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
