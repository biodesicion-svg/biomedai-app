'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Clock, Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'

const riesgoColor: Record<string,string> = { alto:'#ef4444', medio:'#f59e0b', bajo:'#10b981' }

interface Pregunta {
  numero: number
  categoria: string
  pregunta: string
  tipo: 'si_no' | 'valor_numerico' | 'texto' | 'seleccion' | 'checklist'
  opciones?: string[]
  unidad?: string
  valor_esperado?: string
  critica: boolean
  advertencia?: string
}

interface Respuesta {
  pregunta: number
  valor: any
  conforme: boolean
  observacion: string
}

export default function OrdenDetallePage() {
  const params = useParams()
  const [orden, setOrden] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [cargando, setCargando] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, Respuesta>>({})
  const [fase, setFase] = useState<'generando' | 'ejecutando' | 'completado'>('generando')
  const [firma, setFirma] = useState('')
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null)

  useEffect(() => {
    const guardada = sessionStorage.getItem(`orden-${params.id}`)
    if (guardada) {
      const ord = JSON.parse(guardada)
      setOrden(ord)
      generarPreguntas(ord)
    }
  }, [params.id])

  async function generarPreguntas(ord: any) {
    setCargando(true)
    try {
      const res = await fetch('/api/protocolo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipo: ord.equipo,
          marca: ord.marca || '',
          modelo: ord.modelo || '',
          tipo: ord.tipo,
          servicio: ord.servicio || '',
          modo: 'formulario'
        })
      })
      const data = await res.json()
      if (data.preguntas) {
        setPreguntas(data.preguntas)
        setFase('ejecutando')
        setTiempoInicio(new Date())
      }
    } catch (err) {
      console.error(err)
    }
    setCargando(false)
  }

  function responderPaso(valor: any) {
    const pregunta = preguntas[pasoActual]
    const conforme = determinarConformidad(pregunta, valor)
    setRespuestas(prev => ({
      ...prev,
      [pasoActual]: {
        pregunta: pasoActual,
        valor,
        conforme,
        observacion: prev[pasoActual]?.observacion || ''
      }
    }))
  }

  function setObservacion(obs: string) {
    setRespuestas(prev => ({
      ...prev,
      [pasoActual]: {
        ...prev[pasoActual],
        observacion: obs
      }
    }))
  }

  function determinarConformidad(pregunta: Pregunta, valor: any): boolean {
    if (pregunta.tipo === 'si_no') return valor === 'si'
    if (pregunta.tipo === 'seleccion') return valor === 'Conforme' || valor === 'Bueno' || valor === 'Correcto'
    return true
  }

  function siguiente() {
    if (pasoActual < preguntas.length - 1) setPasoActual(p => p + 1)
    else setFase('completado')
  }

  function anterior() {
    if (pasoActual > 0) setPasoActual(p => p - 1)
  }

  const pregunta = preguntas[pasoActual]
  const respuestaActual = respuestas[pasoActual]
  const tiempoMin = tiempoInicio ? Math.round((Date.now() - tiempoInicio.getTime()) / 60000) : 0
  const progreso = preguntas.length > 0 ? Math.round((Object.keys(respuestas).length / preguntas.length) * 100) : 0
  const noConformes = Object.values(respuestas).filter(r => !r.conforme).length

  if (!orden || cargando) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <Loader2 className="w-10 h-10 animate-spin mb-4" style={{color:'#2dd4bf'}}/>
      <p className="text-sm mb-1" style={{color:'#e2e8f0'}}>Generando formulario de mantenimiento...</p>
      <p className="text-xs" style={{color:'#3d5166'}}>La IA está creando las preguntas para {orden?.equipo}</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-4 flex items-center gap-4 flex-shrink-0"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        <Link href="/ordenes"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
          <ArrowLeft className="w-3.5 h-3.5"/> Volver
        </Link>
        <div className="flex-1">
          <div className="text-xs font-mono mb-0.5" style={{color:'#4a6580'}}>{orden.id}</div>
          <h1 className="text-base font-bold" style={{color:'#e2e8f0'}}>{orden.equipo}</h1>
        </div>
        {fase === 'ejecutando' && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Progreso</div>
              <div className="text-lg font-bold" style={{color:'#2dd4bf'}}>{progreso}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:'#3d5166'}}>Tiempo</div>
              <div className="text-lg font-bold" style={{color:'#fb923c'}}>{tiempoMin}min</div>
            </div>
            {noConformes > 0 && (
              <div className="text-right">
                <div className="text-xs" style={{color:'#3d5166'}}>No conformes</div>
                <div className="text-lg font-bold" style={{color:'#f87171'}}>{noConformes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {fase === 'ejecutando' && (
        <div style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
          <div className="h-1" style={{background:'#1e2d3d'}}>
            <div className="h-1 transition-all duration-500"
              style={{width:`${progreso}%`, background:'linear-gradient(90deg,#0d9488,#10b981)'}}/>
          </div>
          {/* Stepper */}
          <div className="px-8 py-3 flex gap-1.5 overflow-x-auto">
            {preguntas.map((_,i) => {
              const resp = respuestas[i]
              const esActual = i === pasoActual
              return (
                <button key={i} onClick={()=>setPasoActual(i)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                  style={{
                    background: resp ? (resp.conforme ? '#0d9488' : '#ef4444') : esActual ? '#1e3a5f' : '#1e2d3d',
                    color: resp ? '#fff' : esActual ? '#2dd4bf' : '#3d5166',
                    border: esActual ? '2px solid #2dd4bf' : '1px solid transparent',
                  }}>
                  {resp ? (resp.conforme ? '✓' : '!') : i+1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">

        {/* ── EJECUTANDO ── */}
        {fase === 'ejecutando' && pregunta && (
          <div className="w-full max-w-2xl">

            {/* Categoría */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
              <span className="text-xs font-semibold uppercase tracking-widest px-3"
                style={{color:'#3d5166'}}>{pregunta.categoria}</span>
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
            </div>

            {/* Card de pregunta */}
            <div className="rounded-2xl overflow-hidden"
              style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>

              {/* Header */}
              <div className="px-6 py-5" style={{borderBottom:'1px solid #1e2d3d'}}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{background:'#0d948820', color:'#2dd4bf', border:'1px solid #0d948840'}}>
                    {pregunta.numero}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold leading-relaxed" style={{color:'#e2e8f0'}}>
                      {pregunta.pregunta}
                    </p>
                    {pregunta.valor_esperado && (
                      <div className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-fit"
                        style={{background:'#0d948815', color:'#2dd4bf', border:'1px solid #0d948830'}}>
                        <span>Valor esperado:</span>
                        <span className="font-bold">{pregunta.valor_esperado} {pregunta.unidad||''}</span>
                      </div>
                    )}
                  </div>
                  {pregunta.critica && (
                    <span className="text-xs px-2 py-1 rounded flex-shrink-0"
                      style={{background:'#ef444415', color:'#f87171', border:'1px solid #ef444430'}}>
                      Crítico
                    </span>
                  )}
                </div>

                {pregunta.advertencia && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg text-xs"
                    style={{background:'#f59e0b10', border:'1px solid #f59e0b25', color:'#fcd34d'}}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                    {pregunta.advertencia}
                  </div>
                )}
              </div>

              {/* Área de respuesta */}
              <div className="px-6 py-5">

                {/* SI / NO */}
                {pregunta.tipo === 'si_no' && (
                  <div className="flex gap-3">
                    {['si','no'].map(op => (
                      <button key={op} onClick={()=>responderPaso(op)}
                        className="flex-1 py-4 rounded-xl text-sm font-bold capitalize transition-all"
                        style={{
                          background: respuestaActual?.valor === op
                            ? (op==='si'?'#0d9488':'#ef4444')
                            : '#111827',
                          color: respuestaActual?.valor === op ? '#fff' : '#7a9bb5',
                          border: respuestaActual?.valor === op
                            ? 'none'
                            : '1px solid #1e2d3d',
                          fontSize: '1.1rem'
                        }}>
                        {op === 'si' ? '✓ Sí' : '✗ No'}
                      </button>
                    ))}
                  </div>
                )}

                {/* VALOR NUMÉRICO */}
                {pregunta.tipo === 'valor_numerico' && (
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        value={respuestaActual?.valor || ''}
                        onChange={e => responderPaso(e.target.value)}
                        placeholder="Ingresa el valor medido..."
                        className="flex-1 text-2xl font-bold text-center py-4 rounded-xl focus:outline-none"
                        style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                      />
                      {pregunta.unidad && (
                        <span className="text-lg font-bold" style={{color:'#3d5166'}}>{pregunta.unidad}</span>
                      )}
                    </div>
                    {respuestaActual?.valor && pregunta.valor_esperado && (
                      <div className="mt-2 text-xs text-center" style={{
                        color: respuestaActual.conforme ? '#4ade80' : '#f87171'
                      }}>
                        {respuestaActual.conforme ? '✓ Valor dentro del rango' : '⚠ Valor fuera del rango esperado'}
                      </div>
                    )}
                  </div>
                )}

                {/* TEXTO LIBRE */}
                {pregunta.tipo === 'texto' && (
                  <textarea
                    value={respuestaActual?.valor || ''}
                    onChange={e => responderPaso(e.target.value)}
                    placeholder="Describe lo observado..."
                    rows={3}
                    className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none resize-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                  />
                )}

                {/* SELECCIÓN */}
                {pregunta.tipo === 'seleccion' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(pregunta.opciones || []).map(op => (
                      <button key={op} onClick={()=>responderPaso(op)}
                        className="py-3 px-4 rounded-xl text-sm font-medium text-left transition-all"
                        style={{
                          background: respuestaActual?.valor === op ? '#0d948820' : '#111827',
                          color: respuestaActual?.valor === op ? '#2dd4bf' : '#7a9bb5',
                          border: respuestaActual?.valor === op
                            ? '1px solid #0d948840'
                            : '1px solid #1e2d3d',
                        }}>
                        {respuestaActual?.valor === op ? '● ' : '○ '}{op}
                      </button>
                    ))}
                  </div>
                )}

                {/* CHECKLIST */}
                {pregunta.tipo === 'checklist' && (
                  <div className="space-y-2">
                    {(pregunta.opciones || []).map(op => {
                      const seleccionados: string[] = respuestaActual?.valor || []
                      const marcado = seleccionados.includes(op)
                      return (
                        <button key={op}
                          onClick={() => {
                            const actual: string[] = respuestaActual?.valor || []
                            const nuevo = marcado ? actual.filter(x=>x!==op) : [...actual, op]
                            responderPaso(nuevo)
                          }}
                          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-left transition-all"
                          style={{
                            background: marcado ? '#0d948815' : '#111827',
                            color: marcado ? '#2dd4bf' : '#7a9bb5',
                            border: marcado ? '1px solid #0d948830' : '1px solid #1e2d3d',
                          }}>
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{background: marcado?'#0d9488':'#1e2d3d', border: marcado?'none':'1px solid #253447'}}>
                            {marcado && <span className="text-white text-xs">✓</span>}
                          </div>
                          {op}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Observación adicional */}
                <div className="mt-4">
                  <input
                    type="text"
                    value={respuestas[pasoActual]?.observacion || ''}
                    onChange={e => setObservacion(e.target.value)}
                    placeholder="Observación adicional (opcional)..."
                    className="w-full text-xs px-4 py-2.5 rounded-lg focus:outline-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#7a9bb5'}}
                  />
                </div>
              </div>

              {/* Navegación */}
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={anterior} disabled={pasoActual === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background:'#111827', color: pasoActual===0?'#253447':'#7a9bb5',
                    border:'1px solid #1e2d3d',
                    opacity: pasoActual===0?0.4:1
                  }}>
                  <ChevronLeft className="w-4 h-4"/> Anterior
                </button>

                <button
                  onClick={siguiente}
                  disabled={!respuestaActual?.valor && respuestaActual?.valor !== 'no' && !Array.isArray(respuestaActual?.valor)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: respuestaActual
                      ? (pasoActual === preguntas.length-1
                          ? 'linear-gradient(135deg,#16a34a,#15803d)'
                          : 'linear-gradient(135deg,#0d9488,#0f766e)')
                      : '#1e2d3d',
                    color: respuestaActual ? '#fff' : '#3d5166',
                  }}>
                  {pasoActual === preguntas.length - 1 ? (
                    <><CheckCircle className="w-4 h-4"/> Finalizar formulario</>
                  ) : (
                    <>Siguiente <ChevronRight className="w-4 h-4"/></>
                  )}
                </button>
              </div>
            </div>

            {/* Contador */}
            <div className="mt-4 text-center text-xs" style={{color:'#3d5166'}}>
              Pregunta {pasoActual+1} de {preguntas.length} · {Object.keys(respuestas).length} respondidas
            </div>
          </div>
        )}

        {/* ── COMPLETADO ── */}
        {fase === 'completado' && (
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl p-8 text-center mb-5"
              style={{background:'#0d1626', border:'1px solid #0d948840'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background:'#0d948820', border:'2px solid #0d9488'}}>
                <CheckCircle className="w-8 h-8" style={{color:'#2dd4bf'}}/>
              </div>
              <h2 className="text-xl font-bold mb-1" style={{color:'#e2e8f0'}}>Formulario completado</h2>
              <p className="text-sm mb-5" style={{color:'#3d5166'}}>
                {orden.equipo} · {orden.tipo} · {tiempoMin} minutos
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl p-3" style={{background:'#111827'}}>
                  <div className="text-2xl font-bold" style={{color:'#4ade80'}}>
                    {Object.values(respuestas).filter(r=>r.conforme).length}
                  </div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Conformes</div>
                </div>
                <div className="rounded-xl p-3" style={{background:'#111827'}}>
                  <div className="text-2xl font-bold" style={{color: noConformes>0?'#f87171':'#4ade80'}}>
                    {noConformes}
                  </div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>No conformes</div>
                </div>
                <div className="rounded-xl p-3" style={{background:'#111827'}}>
                  <div className="text-2xl font-bold" style={{color:'#fb923c'}}>{tiempoMin}min</div>
                  <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>Duración</div>
                </div>
              </div>

              {/* No conformes */}
              {noConformes > 0 && (
                <div className="mb-5 rounded-xl overflow-hidden text-left"
                  style={{border:'1px solid #ef444430'}}>
                  <div className="px-4 py-3 text-xs font-bold" style={{background:'#ef444415', color:'#f87171'}}>
                    ⚠ Hallazgos no conformes
                  </div>
                  {Object.entries(respuestas)
                    .filter(([,r])=>!r.conforme)
                    .map(([idx,r])=>(
                      <div key={idx} className="px-4 py-3 text-xs" style={{borderTop:'1px solid #ef444420', color:'#7a9bb5'}}>
                        <span className="font-bold" style={{color:'#fca5a5'}}>
                          {preguntas[Number(idx)]?.pregunta}
                        </span>
                        <span className="ml-2">→ Respuesta: {Array.isArray(r.valor)?r.valor.join(', '):r.valor}</span>
                        {r.observacion && <span className="ml-2 italic">· {r.observacion}</span>}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Firma */}
              <div className="text-left mb-4">
                <div className="text-xs font-bold mb-2" style={{color:'#3d5166'}}>
                  Firma del técnico responsable
                </div>
                <input
                  type="text"
                  value={firma}
                  onChange={e=>setFirma(e.target.value)}
                  placeholder={`Nombre completo: ${orden.tecnico}`}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                />
              </div>

              <button disabled={!firma}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: firma?'linear-gradient(135deg,#0d9488,#0f766e)':'#1e2d3d',
                  color: firma?'#fff':'#3d5166',
                }}>
                Cerrar orden y generar reporte PDF
              </button>
            </div>

            <Link href="/ordenes"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
              style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
              <ArrowLeft className="w-4 h-4"/> Volver al tablero
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
