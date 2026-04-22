'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Wrench, AlertTriangle, CheckCircle, Download, User, BarChart3 } from 'lucide-react'

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const riesgoColor: Record<string,string> = { alto:'#ef4444', medio:'#f59e0b', bajo:'#10b981' }
const prioridadColor: Record<string,{bg:string;text:string;border:string}> = {
  alta:  {bg:'#ef444415',text:'#f87171',border:'#ef444430'},
  media: {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30'},
  baja:  {bg:'#10b98115',text:'#4ade80',border:'#10b98130'},
}
const tipoColor: Record<string,{bg:string;text:string;border:string}> = {
  preventivo:  {bg:'#16a34a15',text:'#4ade80',border:'#16a34a30'},
  calibracion: {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30'},
  correctivo:  {bg:'#ef444415',text:'#f87171',border:'#ef444430'},
}
const tecnicoColor = ['#2dd4bf','#818cf8','#fb923c']

export default function MantenimientoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seccion, setSeccion] = useState<'cronograma'|'asignacion'|'ordenes'>('cronograma')
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1)
  const [tecnicoFiltro, setTecnicoFiltro] = useState('todos')

  useEffect(() => {
    fetch('/api/mantenimientos')
      .then(r => r.json())
      .then(d => { if(d.error) setError(d.error); else setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const mesItems = data?.cronogramaMensual?.[mesSeleccionado] || []
  const horasMes = mesItems.reduce((a:number,b:any)=>a+b.horasTotales,0)
  const equiposMes = mesItems.reduce((a:number,b:any)=>a+b.cantidad,0)
  const resumenMes = data?.resumenAnual?.[mesSeleccionado-1]

  const ordenesFiltradas = (data?.ordenesProximas || []).filter((o:any) =>
    tecnicoFiltro === 'todos' || o.tecnico === tecnicoFiltro
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <div className="p-8 rounded-xl text-center" style={{background:'#0d1626',border:'1px solid #ef444430'}}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{color:'#f87171'}}/>
        <p className="text-sm" style={{color:'#f87171'}}>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{borderBottom:'1px solid #1e2d3d',background:'#0a1120'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{color:'#3d5166'}}>BioMed AI</span>
            <span style={{color:'#1e2d3d'}}>/</span>
            <span className="text-xs font-medium" style={{color:'#2dd4bf'}}>Mantenimiento</span>
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>Gestión de Mantenimiento Preventivo 2025</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
          <Download className="w-4 h-4"/> Exportar
        </button>
      </div>

      <div className="flex-1 px-8 py-6 space-y-5 overflow-auto">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            {label:'Equipos operativos', value:data?.stats?.totalEquipos,  color:'#e2e8f0'},
            {label:'Cada 6 meses',       value:data?.stats?.cada6meses,    color:'#f87171'},
            {label:'Cada 12 meses',      value:data?.stats?.cada12meses,   color:'#4ade80'},
            {label:'Intervenciones/año', value:data?.stats?.totalInterv,   color:'#2dd4bf'},
            {label:'Horas técnico/año',  value:data?.stats?.horasTotalesAno, color:'#fb923c'},
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              {loading
                ? <div className="h-7 w-14 rounded animate-pulse mb-1" style={{background:'#1e2d3d'}}/>
                : <div className="text-2xl font-bold mb-0.5" style={{color:s.color}}>{s.value?.toLocaleString()}</div>
              }
              <div className="text-xs" style={{color:'#3d5166'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Secciones */}
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit"
          style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
          {[
            {id:'cronograma', label:'📅 Cronograma General'},
            {id:'asignacion', label:'👷 Por Técnico'},
            {id:'ordenes',    label:'📋 Órdenes de Trabajo'},
          ].map(t => (
            <button key={t.id} onClick={()=>setSeccion(t.id as any)}
              className="px-4 py-2 rounded-md text-xs font-semibold transition-all"
              style={{
                background: seccion===t.id?'#1e2d3d':'transparent',
                color: seccion===t.id?'#e2e8f0':'#3d5166',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SECCIÓN 1: CRONOGRAMA GENERAL ── */}
        {seccion === 'cronograma' && (
          <div className="space-y-4">
            {/* Resumen anual por mes */}
            <div className="rounded-xl overflow-hidden" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4" style={{borderBottom:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Carga de Trabajo — Vista Anual 2025</div>
                <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Capacidad: {data?.stats?.capacidadMensual}h/mes · 3 técnicos × 8h × 22 días</div>
              </div>
              <div className="p-4 grid grid-cols-12 gap-2">
                {(data?.resumenAnual || Array.from({length:12},(_,i)=>({mes:i+1,nombre:MESES_LARGO[i],totalEquipos:0,totalHoras:0,ocupacion:0,items:0}))).map((r:any) => {
                  const esActual = r.mes === new Date().getMonth()+1
                  const color = r.ocupacion > 80 ? '#ef4444' : r.ocupacion > 50 ? '#f59e0b' : '#10b981'
                  return (
                    <button key={r.mes}
                      onClick={()=>setMesSeleccionado(r.mes)}
                      className="rounded-lg p-3 transition-all text-left"
                      style={{
                        background: mesSeleccionado===r.mes ? '#1e2d3d' : '#111827',
                        border: mesSeleccionado===r.mes ? '1px solid #2dd4bf' : '1px solid #1e2d3d',
                      }}>
                      <div className="text-xs font-bold mb-2" style={{color: esActual?'#2dd4bf':'#7a9bb5'}}>
                        {MESES_CORTO[r.mes-1]}
                        {esActual && <span className="ml-1 text-xs" style={{color:'#2dd4bf'}}>●</span>}
                      </div>
                      <div className="h-1.5 rounded-full mb-2" style={{background:'#1e2d3d'}}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{width:`${Math.min(r.ocupacion,100)}%`, background:color}}/>
                      </div>
                      <div className="text-xs font-bold" style={{color}}>{r.ocupacion}%</div>
                      <div className="text-xs" style={{color:'#3d5166'}}>{r.totalEquipos} equip.</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Detalle del mes seleccionado */}
            <div className="rounded-xl overflow-hidden" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom:'1px solid #1e2d3d'}}>
                <div>
                  <div className="text-base font-bold" style={{color:'#e2e8f0'}}>
                    {MESES_LARGO[mesSeleccionado-1]} 2025
                  </div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>
                    {equiposMes} equipos · {horasMes} horas · {mesItems.length} tipos
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-xs" style={{color:'#3d5166'}}>Ocupación</div>
                    <div className="text-xl font-bold" style={{color: resumenMes?.ocupacion>80?'#f87171':resumenMes?.ocupacion>50?'#fcd34d':'#4ade80'}}>
                      {loading ? '—' : `${resumenMes?.ocupacion||0}%`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{color:'#3d5166'}}>Intervenciones</div>
                    <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>{loading?'—':equiposMes}</div>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({length:5}).map((_,i)=>(
                    <div key={i} className="h-16 rounded animate-pulse" style={{background:'#1e2d3d'}}/>
                  ))}
                </div>
              ) : mesItems.length === 0 ? (
                <div className="py-12 text-center" style={{color:'#3d5166'}}>
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">No hay mantenimientos en este mes</p>
                </div>
              ) : (
                <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                  {mesItems
                    .sort((a:any,b:any)=>{const o:any={alto:0,medio:1,bajo:2};return o[a.riesgo]-o[b.riesgo]})
                    .map((item:any,i:number) => {
                      const tc = tipoColor[item.tipo]||tipoColor.preventivo
                      return (
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{background:riesgoColor[item.riesgo]}}/>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{item.nombre}</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                                  style={{background:tc.bg,color:tc.text,border:`1px solid ${tc.border}`}}>
                                  {item.tipo}
                                </span>
                                <span className="text-xs" style={{color:'#3d5166'}}>{item.frecuencia}</span>
                              </div>
                              {/* Distribución por técnico */}
                              <div className="flex gap-3 flex-wrap">
                                {item.asignaciones?.map((asig:any,j:number) => (
                                  <div key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                                    style={{background:'#111827',border:'1px solid #1e2d3d'}}>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{background:tecnicoColor[j]}}/>
                                    <span style={{color:'#7a9bb5'}}>{asig.tecnico}:</span>
                                    <span className="font-bold" style={{color:'#e2e8f0'}}>{asig.cantidad} equipos</span>
                                    <span style={{color:'#3d5166'}}>·</span>
                                    <span style={{color:tecnicoColor[j]}}>{asig.horas}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{item.cantidad}</div>
                              <div className="text-xs" style={{color:'#3d5166'}}>equipos</div>
                              <div className="text-sm font-bold mt-1" style={{color:'#2dd4bf'}}>{item.horasTotales}h</div>
                            </div>
                          </div>
                          {item.diasNecesarios > 7 && (
                            <div className="mt-2 ml-6 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-fit"
                              style={{background:'#f59e0b10',border:'1px solid #f59e0b20',color:'#fcd34d'}}>
                              <Clock className="w-3.5 h-3.5"/>
                              Distribuido en ~{item.diasNecesarios} días hábiles por técnico
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECCIÓN 2: POR TÉCNICO ── */}
        {seccion === 'asignacion' && (
          <div className="space-y-4">
            {/* Selector mes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{color:'#3d5166'}}>Mes:</span>
              <div className="flex gap-1">
                {MESES_CORTO.map((m,i) => (
                  <button key={m} onClick={()=>setMesSeleccionado(i+1)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                      background: mesSeleccionado===i+1?'#0d9488':'#0d1626',
                      color: mesSeleccionado===i+1?'#fff':'#3d5166',
                      border: `1px solid ${mesSeleccionado===i+1?'#0d9488':'#1e2d3d'}`,
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards por técnico */}
            <div className="grid grid-cols-3 gap-4">
              {(data?.tecnicos || ['Biomédico 1','Biomédico 2','Biomédico 3']).map((tec:string, ti:number) => {
                const tareasDelTecnico = mesItems.flatMap((item:any) =>
                  (item.asignaciones||[])
                    .filter((a:any) => a.tecnico === tec)
                    .map((a:any) => ({...a, nombre:item.nombre, tipo:item.tipo, riesgo:item.riesgo, frecuencia:item.frecuencia}))
                )
                const totalHoras = tareasDelTecnico.reduce((a:number,b:any)=>a+b.horas,0)
                const totalEquipos = tareasDelTecnico.reduce((a:number,b:any)=>a+b.cantidad,0)
                const ocupacion = Math.round((totalHoras / (8*22)) * 100)
                const color = tecnicoColor[ti]

                return (
                  <div key={tec} className="rounded-xl overflow-hidden"
                    style={{background:'#0d1626',border:`1px solid ${color}30`}}>
                    <div className="px-4 py-4" style={{borderBottom:'1px solid #1e2d3d'}}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{background:color+'20',border:`1px solid ${color}40`}}>
                          <User className="w-4 h-4" style={{color}}/>
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>{tec}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>{MESES_LARGO[mesSeleccionado-1]} 2025</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg p-2 text-center" style={{background:'#111827'}}>
                          <div className="text-lg font-bold" style={{color}}>{totalEquipos}</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>equipos</div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{background:'#111827'}}>
                          <div className="text-lg font-bold" style={{color:'#e2e8f0'}}>{totalHoras}h</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>horas</div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{background:'#111827'}}>
                          <div className="text-lg font-bold" style={{
                            color: ocupacion>80?'#f87171':ocupacion>50?'#fcd34d':'#4ade80'
                          }}>{ocupacion}%</div>
                          <div className="text-xs" style={{color:'#3d5166'}}>carga</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{background:'#1e2d3d'}}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{width:`${Math.min(ocupacion,100)}%`,background:color}}/>
                      </div>
                    </div>
                    <div className="divide-y max-h-80 overflow-y-auto" style={{borderColor:'#1e2d3d'}}>
                      {loading ? (
                        Array.from({length:3}).map((_,i)=>(
                          <div key={i} className="px-4 py-3 animate-pulse">
                            <div className="h-3 w-40 rounded" style={{background:'#1e2d3d'}}/>
                          </div>
                        ))
                      ) : tareasDelTecnico.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs" style={{color:'#3d5166'}}>
                          Sin asignaciones este mes
                        </div>
                      ) : tareasDelTecnico.map((tarea:any,i:number)=>{
                        const tc2 = tipoColor[tarea.tipo]||tipoColor.preventivo
                        return (
                          <div key={i} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{background:riesgoColor[tarea.riesgo]}}/>
                                  <span className="text-xs font-medium truncate" style={{color:'#e2e8f0'}}>{tarea.nombre}</span>
                                </div>
                                <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                                  style={{background:tc2.bg,color:tc2.text,border:`1px solid ${tc2.border}`}}>
                                  {tarea.tipo}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-bold" style={{color:'#e2e8f0'}}>{tarea.cantidad} eq.</div>
                                <div className="text-xs" style={{color}}>{tarea.horas}h</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SECCIÓN 3: ÓRDENES DE TRABAJO ── */}
        {seccion === 'ordenes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>
                Órdenes del mes actual — {MESES_LARGO[new Date().getMonth()]}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg ml-auto"
                style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                {['todos',...(data?.tecnicos||[])].map((tec:string) => (
                  <button key={tec} onClick={()=>setTecnicoFiltro(tec)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                      background: tecnicoFiltro===tec?'#1e2d3d':'transparent',
                      color: tecnicoFiltro===tec?'#e2e8f0':'#3d5166',
                    }}>
                    {tec === 'todos' ? 'Todos' : tec}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <table className="w-full">
                <thead>
                  <tr style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                    {['ID Orden','Equipo','Tipo','Prioridad','Técnico Asignado','Equipos','Horas Est.','Estado'].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{color:'#3d5166'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({length:6}).map((_,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #1e2d3d'}}>
                        {Array.from({length:8}).map((_,j)=>(
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded animate-pulse" style={{background:'#1e2d3d',width:j===0?'120px':'80px'}}/>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : ordenesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{color:'#3d5166'}}>
                        No hay órdenes para este filtro
                      </td>
                    </tr>
                  ) : ordenesFiltradas.map((o:any,i:number)=>{
                    const pc = prioridadColor[o.prioridad]||prioridadColor.baja
                    const tc = tipoColor[o.tipo]||tipoColor.preventivo
                    const tIdx = (data?.tecnicos||[]).indexOf(o.tecnico)
                    return (
                      <tr key={i} style={{
                        background:i%2===0?'#080e16':'#0a1120',
                        borderBottom:'1px solid #1e2d3d'
                      }}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{color:'#4a6580'}}>{o.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{background:riesgoColor[o.riesgo]}}/>
                            <span className="text-sm font-medium" style={{color:'#e2e8f0'}}>{o.equipo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                            style={{background:tc.bg,color:tc.text,border:`1px solid ${tc.border}`}}>
                            {o.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                            style={{background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`}}>
                            {o.prioridad}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full"
                              style={{background:tecnicoColor[tIdx>=0?tIdx:0]}}/>
                            <span className="text-sm" style={{color:'#7a9bb5'}}>{o.tecnico}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{color:'#e2e8f0'}}>{o.cantidad}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{color:'#2dd4bf'}}>{o.horas}h</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs font-medium" style={{color:'#7a9bb5'}}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{background:'#7a9bb5'}}/>
                            Programado
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3 flex items-center justify-between" style={{borderTop:'1px solid #1e2d3d'}}>
                <span className="text-xs" style={{color:'#3d5166'}}>
                  {ordenesFiltradas.length} órdenes · {ordenesFiltradas.reduce((a:number,b:any)=>a+b.cantidad,0)} equipos
                </span>
                <span className="text-xs font-mono" style={{color:'#253447'}}>Res. 4816/2008</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
