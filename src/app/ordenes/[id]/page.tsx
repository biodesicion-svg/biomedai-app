'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, Circle, Clock, Wrench,
  AlertTriangle, ChevronRight, ChevronLeft,
  Shield, Tool, FileText, Loader2, User
} from 'lucide-react'
import Link from 'next/link'

const tecnicoColor = ['#2dd4bf', '#818cf8', '#fb923c']
const riesgoColor: Record<string,string> = { alto:'#ef4444', medio:'#f59e0b', bajo:'#10b981' }

export default function OrdenDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [orden, setOrden] = useState<any>(null)
  const [protocolo, setProtocolo] = useState<any>(null)
  const [cargandoProtocolo, setCargandoProtocolo] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [pasosCompletados, setPasosCompletados] = useState<Set<number>>(new Set())
  const [fase, setFase] = useState<'info'|'ejecutando'|'completado'>('info')
  const [notas, setNotas] = useState<Record<number, string>>({})
  const [firmaTexto, setFirmaTexto] = useState('')
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null)

  // Cargar orden desde localStorage o sessionStorage
  useEffect(() => {
    const ordenGuardada = sessionStorage.getItem(`orden-${params.id}`)
    if (ordenGuardada) {
      setOrden(JSON.parse(ordenGuardada))
    }
  }, [params.id])

  async function generarProtocolo() {
    if (!orden) return
    setCargandoProtocolo(true)
    try {
      const res = await fetch('/api/protocolo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipo: orden.equipo,
          marca: orden.marca || '',
          modelo: orden.modelo || '',
          tipo: orden.tipo,
          servicio: orden.servicio || '',
        })
      })
      const data = await res.json()
      if (data.protocolo) {
        setProtocolo(data.protocolo)
        setFase('info')
      }
    } catch (err) {
      console.error(err)
    }
    setCargandoProtocolo(false)
  }

  function iniciarEjecucion() {
    setFase('ejecutando')
    setPasoActual(0)
    setTiempoInicio(new Date())
  }

  function completarPaso(num: number) {
    setPasosCompletados(prev => new Set([...prev, num]))
    if (protocolo && num < protocolo.pasos.length - 1) {
      setPasoActual(num + 1)
    }
  }

  function finalizarOrden() {
    setFase('completado')
  }

  const tiempoTranscurrido = tiempoInicio
    ? Math.round((Date.now() - tiempoInicio.getTime()) / 60000)
    : 0

  const progreso = protocolo
    ? Math.round((pasosCompletados.size / protocolo.pasos.length) * 100)
    : 0

  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{background:'#080e16'}}>
        <AlertTriangle className="w-10 h-10 mb-4" style={{color:'#f59e0b'}}/>
        <p className="text-sm mb-4" style={{color:'#7a9bb5'}}>Orden no encontrada</p>
        <Link href="/ordenes"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{background:'#0d9488',color:'#fff'}}>
          <ArrowLeft className="w-4 h-4"/> Volver a órdenes
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-4 flex items-center gap-4 flex-shrink-0"
        style={{borderBottom:'1px solid #1e2d3d',background:'#0a1120'}}>
        <Link href="/ordenes"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
          style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
          <ArrowLeft className="w-3.5 h-3.5"/> Volver
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono" style={{color:'#4a6580'}}>{orden.id}</span>
            <span style={{color:'#1e2d3d'}}>·</span>
            <span className="text-xs" style={{color:'#2dd4bf'}}>
              {fase === 'info' && 'Revisión del protocolo'}
              {fase === 'ejecutando' && `Ejecutando — Paso ${pasoActual + 1} de ${protocolo?.pasos?.length}`}
              {fase === 'completado' && 'Orden completada ✓'}
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{color:'#e2e8f0'}}>{orden.equipo}</h1>
        </div>
        {fase === 'ejecutando' && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Progreso</div>
              <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>{progreso}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Tiempo</div>
              <div className="text-xl font-bold" style={{color:'#fb923c'}}>{tiempoTranscurrido}min</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── FASE: INFO (sin protocolo aún) ── */}
        {!protocolo && fase === 'info' && (
          <div className="max-w-2xl mx-auto">
            {/* Info de la orden */}
            <div className="rounded-xl p-6 mb-6" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Equipo</div>
                  <div className="text-base font-bold" style={{color:'#e2e8f0'}}>{orden.equipo}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Tipo</div>
                  <div className="text-sm font-semibold capitalize" style={{color:'#2dd4bf'}}>{orden.tipo}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Técnico asignado</div>
                  <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{orden.tecnico}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Equipos a intervenir</div>
                  <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{orden.cantidad} unidades</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Horas estimadas</div>
                  <div className="text-sm font-semibold" style={{color:'#fb923c'}}>{orden.horas}h</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Prioridad</div>
                  <div className="text-sm font-semibold capitalize" style={{
                    color: orden.prioridad==='alta'?'#f87171':orden.prioridad==='media'?'#fcd34d':'#4ade80'
                  }}>{orden.prioridad}</div>
                </div>
              </div>
            </div>

            {/* Botón generar protocolo */}
            <button onClick={generarProtocolo} disabled={cargandoProtocolo}
              className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all"
              style={{
                background: cargandoProtocolo ? '#1e2d3d' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                color: cargandoProtocolo ? '#3d5166' : '#fff',
                border: '1px solid #0d948840',
              }}>
              {cargandoProtocolo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin"/>
                  Generando protocolo con IA...
                </>
              ) : (
                <>
                  <Wrench className="w-5 h-5"/>
                  Generar Protocolo de Mantenimiento con IA
                </>
              )}
            </button>

            {cargandoProtocolo && (
              <div className="mt-4 p-4 rounded-xl text-sm text-center" style={{background:'#0d1626',color:'#3d5166'}}>
                Claude está analizando el equipo y generando el protocolo completo con pasos, herramientas y criterios de aceptación...
              </div>
            )}
          </div>
        )}

        {/* ── PROTOCOLO GENERADO — VISTA INFO ── */}
        {protocolo && fase === 'info' && (
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Header protocolo */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold mb-1" style={{color:'#e2e8f0'}}>{protocolo.titulo}</h2>
                  <div className="flex items-center gap-3 text-xs" style={{color:'#3d5166'}}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5"/> {protocolo.duracion_estimada}
                    </span>
                    <span>·</span>
                    <span>{protocolo.pasos?.length} pasos</span>
                    <span>·</span>
                    <span style={{color:'#2dd4bf'}}>{protocolo.normativa}</span>
                  </div>
                </div>
                <button onClick={generarProtocolo}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
                  Regenerar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* EPPs */}
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5" style={{color:'#818cf8'}}/>
                    <span className="text-xs font-bold" style={{color:'#818cf8'}}>EPPs Requeridos</span>
                  </div>
                  {protocolo.epps?.map((e:string,i:number)=>(
                    <div key={i} className="text-xs mb-1 flex items-center gap-1.5" style={{color:'#7a9bb5'}}>
                      <div className="w-1 h-1 rounded-full" style={{background:'#818cf8'}}/>
                      {e}
                    </div>
                  ))}
                </div>

                {/* Herramientas */}
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-3.5 h-3.5" style={{color:'#fb923c'}}/>
                    <span className="text-xs font-bold" style={{color:'#fb923c'}}>Herramientas</span>
                  </div>
                  {protocolo.herramientas?.map((h:string,i:number)=>(
                    <div key={i} className="text-xs mb-1 flex items-center gap-1.5" style={{color:'#7a9bb5'}}>
                      <div className="w-1 h-1 rounded-full" style={{background:'#fb923c'}}/>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Advertencias */}
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" style={{color:'#f87171'}}/>
                    <span className="text-xs font-bold" style={{color:'#f87171'}}>Advertencias</span>
                  </div>
                  {protocolo.advertencias?.map((a:string,i:number)=>(
                    <div key={i} className="text-xs mb-1 flex items-center gap-1.5" style={{color:'#7a9bb5'}}>
                      <div className="w-1 h-1 rounded-full" style={{background:'#f87171'}}/>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de pasos */}
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
              <div className="px-5 py-4" style={{background:'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold" style={{color:'#e2e8f0'}}>Pasos del Protocolo</div>
              </div>
              <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                {protocolo.pasos?.map((paso:any, i:number)=>(
                  <div key={i} className="px-5 py-4" style={{background: i%2===0?'#080e16':'#0a1120'}}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{background:'#0d948820',color:'#2dd4bf',border:'1px solid #0d948840'}}>
                        {paso.numero}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>{paso.titulo}</div>
                        <div className="text-xs mb-2 leading-relaxed" style={{color:'#7a9bb5'}}>{paso.descripcion}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {paso.duracion && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded"
                              style={{background:'#1e2d3d',color:'#3d5166'}}>
                              <Clock className="w-3 h-3"/> {paso.duracion}
                            </span>
                          )}
                          {paso.valores_esperados && (
                            <span className="px-2 py-0.5 rounded" style={{background:'#0d948815',color:'#2dd4bf'}}>
                              Valor: {paso.valores_esperados}
                            </span>
                          )}
                          {paso.criterio_aceptacion && (
                            <span className="px-2 py-0.5 rounded" style={{background:'#16a34a15',color:'#4ade80'}}>
                              ✓ {paso.criterio_aceptacion}
                            </span>
                          )}
                        </div>
                        {paso.advertencia && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs px-2 py-1.5 rounded"
                            style={{background:'#ef444410',color:'#f87171',border:'1px solid #ef444425'}}>
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                            {paso.advertencia}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón iniciar */}
            <button onClick={iniciarEjecucion}
              className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3"
              style={{background:'linear-gradient(135deg,#0d9488,#0f766e)',color:'#fff'}}>
              <CheckCircle className="w-5 h-5"/>
              Iniciar Ejecución del Mantenimiento
            </button>
          </div>
        )}

        {/* ── FASE: EJECUTANDO ── */}
        {protocolo && fase === 'ejecutando' && (
          <div className="max-w-3xl mx-auto">

            {/* Barra de progreso */}
            <div className="rounded-xl p-4 mb-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{color:'#e2e8f0'}}>
                  Progreso del mantenimiento
                </span>
                <span className="text-xs font-mono" style={{color:'#2dd4bf'}}>{pasosCompletados.size}/{protocolo.pasos.length} pasos</span>
              </div>
              <div className="h-2 rounded-full" style={{background:'#1e2d3d'}}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{width:`${progreso}%`,background:'linear-gradient(90deg,#0d9488,#10b981)'}}/>
              </div>
              {/* Mini stepper */}
              <div className="flex gap-1 mt-3 flex-wrap">
                {protocolo.pasos.map((_:any,i:number)=>(
                  <button key={i} onClick={()=>setPasoActual(i)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: pasosCompletados.has(i)?'#0d9488':pasoActual===i?'#1e3a5f':'#1e2d3d',
                      color: pasosCompletados.has(i)?'#fff':pasoActual===i?'#2dd4bf':'#3d5166',
                      border: pasoActual===i?'1px solid #2dd4bf':'1px solid transparent',
                    }}>
                    {pasosCompletados.has(i) ? '✓' : i+1}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso actual */}
            {(() => {
              const paso = protocolo.pasos[pasoActual]
              const completado = pasosCompletados.has(pasoActual)
              return (
                <div className="rounded-xl overflow-hidden mb-5"
                  style={{border:`1px solid ${completado?'#0d948840':'#1e2d3d'}`}}>
                  {/* Header paso */}
                  <div className="px-6 py-4 flex items-center gap-4"
                    style={{background: completado?'#0d948815':'#0d1626',borderBottom:'1px solid #1e2d3d'}}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{
                        background: completado?'#0d9488':'#1e2d3d',
                        color: completado?'#fff':'#2dd4bf',
                        border: completado?'none':'1px solid #0d948840',
                      }}>
                      {completado ? '✓' : paso.numero}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold" style={{color:'#e2e8f0'}}>{paso.titulo}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs" style={{color:'#3d5166'}}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3"/> {paso.duracion}
                        </span>
                        <span>Paso {pasoActual+1} de {protocolo.pasos.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo del paso */}
                  <div className="px-6 py-5" style={{background:'#080e16'}}>
                    <p className="text-sm leading-relaxed mb-4" style={{color:'#c9d1d9'}}>
                      {paso.descripcion}
                    </p>

                    {/* Herramientas del paso */}
                    {paso.herramientas?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{color:'#fb923c'}}>
                          <Wrench className="w-3.5 h-3.5"/> Herramientas para este paso
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {paso.herramientas.map((h:string,i:number)=>(
                            <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                              style={{background:'#fb923c15',color:'#fb923c',border:'1px solid #fb923c25'}}>
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valores esperados */}
                    {paso.valores_esperados && (
                      <div className="mb-4 p-3 rounded-lg" style={{background:'#0d948810',border:'1px solid #0d948825'}}>
                        <div className="text-xs font-bold mb-1" style={{color:'#2dd4bf'}}>
                          📊 Valores esperados
                        </div>
                        <div className="text-sm" style={{color:'#7a9bb5'}}>{paso.valores_esperados}</div>
                      </div>
                    )}

                    {/* Criterio de aceptación */}
                    {paso.criterio_aceptacion && (
                      <div className="mb-4 p-3 rounded-lg" style={{background:'#16a34a10',border:'1px solid #16a34a25'}}>
                        <div className="text-xs font-bold mb-1" style={{color:'#4ade80'}}>
                          ✓ Criterio de aceptación
                        </div>
                        <div className="text-sm" style={{color:'#7a9bb5'}}>{paso.criterio_aceptacion}</div>
                      </div>
                    )}

                    {/* Advertencia del paso */}
                    {paso.advertencia && (
                      <div className="mb-4 p-3 rounded-lg flex items-start gap-2"
                        style={{background:'#ef444410',border:'1px solid #ef444425'}}>
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:'#f87171'}}/>
                        <div className="text-sm" style={{color:'#fca5a5'}}>{paso.advertencia}</div>
                      </div>
                    )}

                    {/* Notas del técnico */}
                    <div className="mb-5">
                      <div className="text-xs font-bold mb-2" style={{color:'#3d5166'}}>
                        📝 Notas del técnico (opcional)
                      </div>
                      <textarea
                        value={notas[pasoActual] || ''}
                        onChange={e => setNotas(prev => ({...prev, [pasoActual]: e.target.value}))}
                        placeholder="Observaciones, hallazgos o novedades..."
                        rows={2}
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                        style={{background:'#0d1626',border:'1px solid #1e2d3d',color:'#e2e8f0'}}
                      />
                    </div>

                    {/* Botones de navegación */}
                    <div className="flex gap-3">
                      {pasoActual > 0 && (
                        <button onClick={()=>setPasoActual(p=>p-1)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                          style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
                          <ChevronLeft className="w-4 h-4"/> Anterior
                        </button>
                      )}
                      {!completado ? (
                        <button onClick={()=>completarPaso(pasoActual)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold"
                          style={{background:'linear-gradient(135deg,#0d9488,#10b981)',color:'#fff'}}>
                          <CheckCircle className="w-4 h-4"/>
                          Marcar paso como completado
                        </button>
                      ) : (
                        pasoActual < protocolo.pasos.length - 1 ? (
                          <button onClick={()=>setPasoActual(p=>p+1)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold"
                            style={{background:'#0d9488',color:'#fff'}}>
                            Siguiente paso <ChevronRight className="w-4 h-4"/>
                          </button>
                        ) : (
                          <button onClick={finalizarOrden}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold"
                            style={{background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff'}}>
                            <CheckCircle className="w-4 h-4"/>
                            Finalizar y cerrar orden
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── FASE: COMPLETADO ── */}
        {fase === 'completado' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl p-8 text-center mb-6"
              style={{background:'#0d1626',border:'1px solid #0d948840'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background:'#0d948820',border:'2px solid #0d9488'}}>
                <CheckCircle className="w-8 h-8" style={{color:'#2dd4bf'}}/>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{color:'#e2e8f0'}}>
                ¡Mantenimiento completado!
              </h2>
              <p className="text-sm mb-4" style={{color:'#3d5166'}}>
                {orden.equipo} · {orden.tipo} · {tiempoTranscurrido} minutos
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#4ade80'}}>{pasosCompletados.size}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Pasos completados</div>
                </div>
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>{tiempoTranscurrido}min</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Tiempo empleado</div>
                </div>
                <div className="rounded-lg p-3" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#fb923c'}}>{orden.cantidad}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Equipos intervenidos</div>
                </div>
              </div>

              {/* Firma */}
              <div className="text-left mb-4">
                <div className="text-xs font-bold mb-2" style={{color:'#3d5166'}}>
                  Firma del técnico responsable
                </div>
                <input
                  type="text"
                  value={firmaTexto}
                  onChange={e => setFirmaTexto(e.target.value)}
                  placeholder={`Escribe tu nombre completo: ${orden.tecnico}`}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none"
                  style={{background:'#111827',border:'1px solid #1e2d3d',color:'#e2e8f0'}}
                />
              </div>

              <button
                disabled={!firmaTexto}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: firmaTexto?'linear-gradient(135deg,#0d9488,#0f766e)':'#1e2d3d',
                  color: firmaTexto?'#fff':'#3d5166',
                }}>
                Generar Reporte y Cerrar Orden
              </button>
            </div>

            <Link href="/ordenes"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
              <ArrowLeft className="w-4 h-4"/> Volver al tablero de órdenes
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
