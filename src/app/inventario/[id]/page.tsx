'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock, Activity, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const riesgoColor: Record<string,{text:string;bg:string;border:string}> = {
  alto:  {text:'#f87171', bg:'#ef444415', border:'#ef444430'},
  medio: {text:'#fcd34d', bg:'#f59e0b15', border:'#f59e0b30'},
  bajo:  {text:'#4ade80', bg:'#10b98115', border:'#10b98130'},
}

const estadoColor: Record<string,string> = {
  operativo:'#4ade80', mantenimiento:'#fcd34d', fuera_servicio:'#f87171', baja:'#64748b'
}

const tipoColor: Record<string,{bg:string;text:string}> = {
  preventivo:  {bg:'#16a34a20',text:'#4ade80'},
  correctivo:  {bg:'#ef444420',text:'#f87171'},
  calibracion: {bg:'#f59e0b20',text:'#fcd34d'},
  inspeccion:  {bg:'#818cf820',text:'#818cf8'},
}

export default function EquipoDetallePage() {
  const params = useParams()
  const [equipo, setEquipo] = useState<any>(null)
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info'|'historial'|'kpis'>('info')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      const { data: eq } = await supabase
        .from('equipos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (eq) setEquipo(eq)

      const { data: mants } = await supabase
        .from('mantenimientos')
        .select('*')
        .eq('equipo_id', params.id)
        .order('fecha_programada', { ascending: false })

      setMantenimientos(mants || [])
      setLoading(false)
    }
    cargar()
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <Activity className="w-8 h-8 animate-pulse" style={{color:'#2dd4bf'}}/>
    </div>
  )

  if (!equipo) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <AlertTriangle className="w-10 h-10 mb-4" style={{color:'#f59e0b'}}/>
      <p className="text-sm" style={{color:'#7a9bb5'}}>Equipo no encontrado</p>
      <Link href="/inventario" className="mt-4 text-xs" style={{color:'#2dd4bf'}}>← Volver</Link>
    </div>
  )

  const rc = riesgoColor[equipo.riesgo] || riesgoColor.bajo
  const vidaUtil = equipo.anio_adquisicion ? new Date().getFullYear() - equipo.anio_adquisicion : null
  const vidaRestante = equipo.vida_util_anos && vidaUtil ? equipo.vida_util_anos - vidaUtil : null
  const pctVida = equipo.vida_util_anos && vidaUtil ? Math.min((vidaUtil / equipo.vida_util_anos) * 100, 100) : 0

  const totalMants = mantenimientos.length
  const preventivos = mantenimientos.filter(m=>m.tipo==='preventivo').length
  const correctivos = mantenimientos.filter(m=>m.tipo==='correctivo').length

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center gap-4"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        <Link href="/inventario"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
          <ArrowLeft className="w-3.5 h-3.5"/> Inventario
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono" style={{color:'#4a6580'}}>{equipo.codigo_inventario}</span>
            <span style={{color:'#1e2d3d'}}>/</span>
            <span className="text-xs" style={{color:'#2dd4bf'}}>Hoja de vida</span>
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>{equipo.nombre}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{background:rc.bg, color:rc.text, border:`1px solid ${rc.border}`}}>
            <div className="w-1.5 h-1.5 rounded-full" style={{background:rc.text}}/>
            Riesgo {equipo.riesgo}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{background:'#1e2d3d', color:estadoColor[equipo.estado]||'#7a9bb5'}}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:estadoColor[equipo.estado]||'#7a9bb5'}}/>
            {equipo.estado?.replace('_',' ')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-3"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        {[
          {id:'info',     label:'📋 Información general'},
          {id:'historial',label:'📅 Historial e intervenciones'},
          {id:'kpis',     label:'📊 Indicadores'},
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

        {/* ── INFO GENERAL ── */}
        {tab === 'info' && (
          <div className="grid grid-cols-3 gap-5 max-w-5xl">

            {/* Datos básicos */}
            <div className="col-span-2 space-y-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'#3d5166'}}>
                  Datos del equipo
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Nombre', equipo.nombre],
                    ['Tipo', equipo.tipo],
                    ['Marca', equipo.marca || '—'],
                    ['Modelo', equipo.modelo || '—'],
                    ['Serie', equipo.serie || '—'],
                    ['Código inventario', equipo.codigo_inventario],
                    ['Clase INVIMA', equipo.clase_invima || '—'],
                    ['Servicio', equipo.servicio || '—'],
                    ['Ubicación', equipo.ubicacion || '—'],
                    ['Estado', equipo.estado?.replace('_',' ') || '—'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{k}</div>
                      <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'#3d5166'}}>
                  Datos de adquisición
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ['Año fabricación', equipo.anio_fabricacion || '—'],
                    ['Año adquisición', equipo.anio_adquisicion || '—'],
                    ['Vida útil', equipo.vida_util_anos ? `${equipo.vida_util_anos} años` : '—'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{k}</div>
                      <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{v}</div>
                    </div>
                  ))}
                </div>
                {equipo.valor_adquisicion && (
                  <div className="mt-4 pt-4" style={{borderTop:'1px solid #1e2d3d'}}>
                    <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>Valor de adquisición</div>
                    <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>
                      ${Number(equipo.valor_adquisicion).toLocaleString('es-CO')} COP
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-4">
              {/* Vida útil */}
              {equipo.vida_util_anos && (
                <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#3d5166'}}>
                    Vida útil
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{color:'#7a9bb5'}}>{vidaUtil} años en uso</span>
                    <span style={{color:pctVida>80?'#f87171':'#fcd34d'}}>{Math.round(pctVida)}%</span>
                  </div>
                  <div className="h-3 rounded-full mb-3" style={{background:'#1e2d3d'}}>
                    <div className="h-3 rounded-full transition-all"
                      style={{
                        width:`${pctVida}%`,
                        background: pctVida>80?'#ef4444':pctVida>50?'#f59e0b':'#10b981'
                      }}/>
                  </div>
                  <div className="text-sm font-bold" style={{
                    color: vidaRestante && vidaRestante < 2 ? '#f87171' : '#4ade80'
                  }}>
                    {vidaRestante !== null
                      ? vidaRestante > 0
                        ? `${vidaRestante} años restantes`
                        : 'Vida útil vencida'
                      : '—'}
                  </div>
                  {vidaRestante !== null && vidaRestante <= 2 && (
                    <div className="mt-2 text-xs p-2 rounded-lg" style={{background:'#ef444415', color:'#f87171', border:'1px solid #ef444430'}}>
                      ⚠ Considerar renovación
                    </div>
                  )}
                </div>
              )}

              {/* Resumen mantenimientos */}
              <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#3d5166'}}>
                  Mantenimientos
                </div>
                {[
                  {label:'Total intervenciones', value:totalMants, color:'#e2e8f0'},
                  {label:'Preventivos', value:preventivos, color:'#4ade80'},
                  {label:'Correctivos', value:correctivos, color:'#f87171'},
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2"
                    style={{borderBottom:'1px dashed #1e2d3d'}}>
                    <span className="text-xs" style={{color:'#3d5166'}}>{s.label}</span>
                    <span className="text-sm font-bold" style={{color:s.color}}>{s.value}</span>
                  </div>
                ))}
              </div>

              {equipo.notas && (
                <div className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#3d5166'}}>Notas</div>
                  <p className="text-xs leading-relaxed" style={{color:'#7a9bb5'}}>{equipo.notas}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === 'historial' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Línea de tiempo de intervenciones</h2>
                <p className="text-xs mt-0.5" style={{color:'#3d5166'}}>{totalMants} intervenciones registradas</p>
              </div>
            </div>

            {mantenimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16" style={{color:'#3d5166'}}>
                <Wrench className="w-10 h-10 mb-3 opacity-30"/>
                <p className="text-sm">Sin intervenciones registradas</p>
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5"
                  style={{background:'linear-gradient(to bottom, #0d9488, #1e2d3d)'}}/>

                <div className="space-y-0">
                  {mantenimientos.map((m, i) => {
                    const tc = tipoColor[m.tipo] || tipoColor.preventivo
                    const fecha = m.fecha_programada
                      ? new Date(m.fecha_programada).toLocaleDateString('es-CO', {year:'numeric',month:'short',day:'numeric'})
                      : '—'
                    const isLast = i === mantenimientos.length - 1

                    return (
                      <div key={m.id} className="relative flex gap-5 pb-8">
                        {/* Dot en la línea */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                              background: m.estado==='completado'?'#0d9488':'#1e2d3d',
                              border: `2px solid ${m.estado==='completado'?'#0d9488':'#253447'}`,
                            }}>
                            {m.estado==='completado'
                              ? <CheckCircle className="w-4 h-4 text-white"/>
                              : m.estado==='en_progreso'
                                ? <Clock className="w-4 h-4" style={{color:'#fcd34d'}}/>
                                : <Wrench className="w-4 h-4" style={{color:'#3d5166'}}/>
                            }
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 rounded-xl p-4 mb-0"
                          style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded capitalize"
                                style={{background:tc.bg, color:tc.text}}>
                                {m.tipo}
                              </span>
                              <span className="text-xs" style={{color:'#3d5166'}}>{fecha}</span>
                              {m.estado === 'completado' && (
                                <span className="text-xs px-2 py-0.5 rounded"
                                  style={{background:'#16a34a15', color:'#4ade80'}}>
                                  Completado
                                </span>
                              )}
                            </div>
                            {m.costo_total && Number(m.costo_total) > 0 && (
                              <div className="flex items-center gap-1 text-xs"
                                style={{color:'#2dd4bf'}}>
                                <DollarSign className="w-3 h-3"/>
                                ${Number(m.costo_total).toLocaleString('es-CO')}
                              </div>
                            )}
                          </div>

                          {m.descripcion && (
                            <p className="text-xs leading-relaxed mb-2" style={{color:'#7a9bb5'}}>
                              {m.descripcion.replace(/&#x0D;/g,'').replace(/\n/g,' ').substring(0,200)}
                              {m.descripcion.length > 200 && '...'}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs" style={{color:'#3d5166'}}>
                            {m.duracion_horas && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {m.duracion_horas}h
                              </span>
                            )}
                            {m.hallazgos && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" style={{color:'#f59e0b'}}/>
                                {m.hallazgos.substring(0,60)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Punto inicial — adquisición */}
                  {equipo.anio_adquisicion && (
                    <div className="relative flex gap-5">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{background:'#0d948820', border:'2px solid #0d9488'}}>
                          <Calendar className="w-4 h-4" style={{color:'#2dd4bf'}}/>
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl p-4"
                        style={{background:'#0d1626', border:'1px solid #0d948830'}}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{color:'#2dd4bf'}}>Adquisición del equipo</span>
                          <span className="text-xs" style={{color:'#3d5166'}}>{equipo.anio_adquisicion}</span>
                        </div>
                        <p className="text-xs" style={{color:'#3d5166'}}>
                          {equipo.nombre} — {equipo.marca} {equipo.modelo}
                          {equipo.valor_adquisicion && ` · $${Number(equipo.valor_adquisicion).toLocaleString('es-CO')} COP`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KPIS ── */}
        {tab === 'kpis' && (
          <div className="max-w-3xl">
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                {
                  label:'Disponibilidad estimada',
                  value: equipo.estado==='operativo'?'✓ Operativo':'✗ No disponible',
                  color: equipo.estado==='operativo'?'#4ade80':'#f87171',
                  sub:'Estado actual del equipo'
                },
                {
                  label:'Total intervenciones',
                  value: totalMants,
                  color:'#2dd4bf',
                  sub:'Historial completo'
                },
                {
                  label:'Ratio Prev/Corr',
                  value: correctivos>0?(preventivos/correctivos).toFixed(1):'N/D',
                  color: correctivos>0&&(preventivos/correctivos)>=0.8?'#4ade80':'#f59e0b',
                  sub:'Meta ≥ 0.80'
                },
                {
                  label:'Años en servicio',
                  value: vidaUtil !== null ? `${vidaUtil} años` : '—',
                  color:'#fb923c',
                  sub:`De ${equipo.vida_util_anos||'?'} años de vida útil`
                },
                {
                  label:'Correctivos registrados',
                  value: correctivos,
                  color: correctivos>5?'#f87171':'#4ade80',
                  sub: correctivos>5?'Alto número de fallas':'Bajo número de fallas'
                },
                {
                  label:'Desgaste vida útil',
                  value: `${Math.round(pctVida)}%`,
                  color: pctVida>80?'#f87171':pctVida>50?'#fcd34d':'#4ade80',
                  sub: vidaRestante!==null?`${vidaRestante>0?vidaRestante+' años restantes':'Vencida'}`:'—'
                },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-5"
                  style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
                  <div className="text-2xl font-bold mb-1" style={{color:k.color}}>{k.value}</div>
                  <div className="text-xs font-bold mb-0.5" style={{color:'#7a9bb5'}}>{k.label}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Recomendación */}
            <div className="rounded-xl p-5" style={{
              background: pctVida>80?'#ef444410':'#0d948810',
              border: `1px solid ${pctVida>80?'#ef444430':'#0d948830'}`
            }}>
              <div className="text-sm font-bold mb-2" style={{color: pctVida>80?'#f87171':'#2dd4bf'}}>
                {pctVida>80 ? '⚠ Recomendación: Evaluar reemplazo' : '✓ Equipo en buen estado operativo'}
              </div>
              <p className="text-xs leading-relaxed" style={{color:'#7a9bb5'}}>
                {pctVida>80
                  ? `El equipo ha consumido el ${Math.round(pctVida)}% de su vida útil estimada. Se recomienda iniciar proceso de evaluación para reemplazo o extensión de vida útil mediante un análisis costo-beneficio.`
                  : `El equipo se encuentra dentro de los parámetros normales de operación. Continúe con el plan de mantenimiento preventivo establecido para garantizar su disponibilidad.`
                }
                {correctivos > 5 && ` El alto número de correctivos (${correctivos}) sugiere revisar la frecuencia del mantenimiento preventivo.`}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
