'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Clock, Loader2, FileText, Pen } from 'lucide-react'
import Link from 'next/link'

interface Pregunta {
  numero: number
  categoria: string
  pregunta: string
  tipo: 'si_no' | 'valor_numerico' | 'texto' | 'seleccion' | 'checklist'
  opciones?: string[]
  unidad?: string
  valor_esperado?: string
  critica: boolean
  advertencia?: string | null
}

interface Respuesta {
  pregunta: number
  valor: any
  conforme: boolean
  observacion: string
}

type Fase = 'cargando' | 'ejecutando' | 'revision' | 'firmando' | 'finalizado'

export default function OrdenDetallePage() {
  const params = useParams()
  const [orden, setOrden] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [cargando, setCargando] = useState(true)
  const [pasoActual, setPasoActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, Respuesta>>({})
  const [fase, setFase] = useState<Fase>('cargando')
  const [firma, setFirma] = useState('')
  const [firmaSupervisor, setFirmaSupervisor] = useState('')
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSuperRef = useRef<HTMLCanvasElement>(null)
  const [dibujando, setDibujando] = useState(false)
  const [dibujandoSuper, setDibujandoSuper] = useState(false)

  useEffect(() => {
    const guardada = sessionStorage.getItem(`orden-${params.id}`)
    if (guardada) {
      const ord = JSON.parse(guardada)
      setOrden(ord)
      cargarProtocolo(ord)
    }
  }, [params.id])

  async function cargarProtocolo(ord: any) {
    setCargando(true)
    try {
      const res = await fetch('/api/protocolo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo: ord.equipo, tipo: ord.tipo })
      })
      const data = await res.json()
      if (data.preguntas) {
        setPreguntas(data.preguntas)
        setFase('ejecutando')
        setTiempoInicio(new Date())
      }
    } catch (err) { console.error(err) }
    setCargando(false)
  }

  function responderPaso(valor: any) {
    const pregunta = preguntas[pasoActual]
    const conforme = determinarConformidad(pregunta, valor)
    setRespuestas(prev => ({
      ...prev,
      [pasoActual]: { pregunta: pasoActual, valor, conforme, observacion: prev[pasoActual]?.observacion || '' }
    }))
  }

  function setObservacion(obs: string) {
    setRespuestas(prev => ({
      ...prev,
      [pasoActual]: { ...prev[pasoActual], observacion: obs }
    }))
  }

  function determinarConformidad(pregunta: Pregunta, valor: any): boolean {
    if (pregunta.tipo === 'si_no') return valor === 'si'
    if (pregunta.tipo === 'seleccion') return ['Bueno','Conforme','Correcto','Óptimo','Funciona correctamente','Sí — realizado'].includes(valor)
    if (pregunta.tipo === 'valor_numerico') return true
    return true
  }

  function siguiente() {
    if (pasoActual < preguntas.length - 1) setPasoActual(p => p + 1)
    else setFase('revision')
  }

  function anterior() {
    if (pasoActual > 0) setPasoActual(p => p - 1)
  }

  function irAFirma() {
    setFase('firmando')
  }

  function finalizar() {
    if (!firma) return
    setFase('finalizado')
    // Actualizar estado en kanban
    const kanbanOrdenes = JSON.parse(sessionStorage.getItem('kanban-ordenes') || '[]')
    const actualizadas = kanbanOrdenes.map((o: any) =>
      o.id === orden?.id ? { ...o, columna: 'completado', progreso: 100 } : o
    )
    sessionStorage.setItem('kanban-ordenes', JSON.stringify(actualizadas))
  }

  function imprimirPDF() {
    window.print()
  }

  const tiempoMin = tiempoInicio ? Math.round((Date.now() - tiempoInicio.getTime()) / 60000) : 0
  const progreso = preguntas.length > 0 ? Math.round((Object.keys(respuestas).length / preguntas.length) * 100) : 0
  const noConformes = Object.values(respuestas).filter(r => !r.conforme).length
  const pregunta = preguntas[pasoActual]
  const respuestaActual = respuestas[pasoActual]
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

  if (cargando || !orden) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <Loader2 className="w-10 h-10 animate-spin mb-4" style={{color:'#2dd4bf'}}/>
      <p className="text-sm" style={{color:'#e2e8f0'}}>Cargando formulario...</p>
    </div>
  )

  return (
    <>
    {/* Estilos de impresión */}
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #reporte-pdf, #reporte-pdf * { visibility: visible; }
        #reporte-pdf { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `}</style>

    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-4 flex items-center gap-4 no-print"
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
          </div>
        )}
        {/* Indicador de fase */}
        <div className="flex items-center gap-2">
          {[
            {id:'ejecutando', label:'Ejecución'},
            {id:'revision',   label:'Revisión'},
            {id:'firmando',   label:'Firma'},
            {id:'finalizado', label:'Finalizado'},
          ].map((f, i, arr) => {
            const fases = ['ejecutando','revision','firmando','finalizado']
            const faseIdx = fases.indexOf(fase)
            const itemIdx = fases.indexOf(f.id)
            const activo = f.id === fase
            const completado = itemIdx < faseIdx
            return (
              <div key={f.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: completado?'#0d9488':activo?'#1e3a5f':'#1e2d3d',
                      color: completado?'#fff':activo?'#2dd4bf':'#3d5166',
                      border: activo?'1px solid #2dd4bf':'none'
                    }}>
                    {completado ? '✓' : i+1}
                  </div>
                  <span className="text-xs hidden md:block" style={{color:activo?'#2dd4bf':completado?'#4ade80':'#3d5166'}}>
                    {f.label}
                  </span>
                </div>
                {i < arr.length-1 && <div className="w-6 h-px" style={{background:'#1e2d3d'}}/>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Barra progreso ejecución */}
      {fase === 'ejecutando' && (
        <div className="no-print" style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
          <div className="h-1" style={{background:'#1e2d3d'}}>
            <div className="h-1 transition-all duration-500"
              style={{width:`${progreso}%`, background:'linear-gradient(90deg,#0d9488,#10b981)'}}/>
          </div>
          <div className="px-8 py-2 flex gap-1.5 overflow-x-auto">
            {preguntas.map((_,i) => {
              const resp = respuestas[i]
              return (
                <button key={i} onClick={()=>setPasoActual(i)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: resp?(resp.conforme?'#0d9488':'#ef4444'):i===pasoActual?'#1e3a5f':'#1e2d3d',
                    color: resp?'#fff':i===pasoActual?'#2dd4bf':'#3d5166',
                    border: i===pasoActual?'2px solid #2dd4bf':'none'
                  }}>
                  {resp?(resp.conforme?'✓':'!'):i+1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">

        {/* ── EJECUTANDO ── */}
        {fase === 'ejecutando' && pregunta && (
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
              <span className="text-xs font-semibold uppercase tracking-widest px-3" style={{color:'#3d5166'}}>
                {pregunta.categoria}
              </span>
              <div className="h-px flex-1" style={{background:'#1e2d3d'}}/>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
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
                      <div className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                        style={{background:'#0d948815', color:'#2dd4bf', border:'1px solid #0d948830'}}>
                        Esperado: <span className="font-bold">{pregunta.valor_esperado} {pregunta.unidad||''}</span>
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

              <div className="px-6 py-5">
                {/* SI/NO */}
                {pregunta.tipo === 'si_no' && (
                  <div className="flex gap-3">
                    {[{v:'si',l:'✓  Sí'},{v:'no',l:'✗  No'}].map(op => (
                      <button key={op.v} onClick={()=>responderPaso(op.v)}
                        className="flex-1 py-4 rounded-xl text-base font-bold transition-all"
                        style={{
                          background: respuestaActual?.valor===op.v?(op.v==='si'?'#0d9488':'#ef4444'):'#111827',
                          color: respuestaActual?.valor===op.v?'#fff':'#7a9bb5',
                          border: respuestaActual?.valor===op.v?'none':'1px solid #1e2d3d',
                        }}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                )}

                {/* VALOR NUMÉRICO */}
                {pregunta.tipo === 'valor_numerico' && (
                  <div className="flex items-center gap-3">
                    <input type="number" step="0.1"
                      value={respuestaActual?.valor || ''}
                      onChange={e=>responderPaso(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 text-3xl font-bold text-center py-4 rounded-xl focus:outline-none"
                      style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                    />
                    {pregunta.unidad && (
                      <span className="text-xl font-bold" style={{color:'#3d5166'}}>{pregunta.unidad}</span>
                    )}
                  </div>
                )}

                {/* TEXTO */}
                {pregunta.tipo === 'texto' && (
                  <textarea value={respuestaActual?.valor || ''}
                    onChange={e=>responderPaso(e.target.value)}
                    placeholder="Describe lo observado..."
                    rows={3}
                    className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none resize-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                  />
                )}

                {/* SELECCIÓN */}
                {pregunta.tipo === 'seleccion' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(pregunta.opciones||[]).map(op => (
                      <button key={op} onClick={()=>responderPaso(op)}
                        className="py-3 px-4 rounded-xl text-sm font-medium text-left transition-all"
                        style={{
                          background: respuestaActual?.valor===op?'#0d948820':'#111827',
                          color: respuestaActual?.valor===op?'#2dd4bf':'#7a9bb5',
                          border: respuestaActual?.valor===op?'1px solid #0d948840':'1px solid #1e2d3d',
                        }}>
                        {respuestaActual?.valor===op?'● ':'○ '}{op}
                      </button>
                    ))}
                  </div>
                )}

                {/* CHECKLIST */}
                {pregunta.tipo === 'checklist' && (
                  <div className="space-y-2">
                    {(pregunta.opciones||[]).map(op => {
                      const sel: string[] = respuestaActual?.valor || []
                      const marcado = sel.includes(op)
                      return (
                        <button key={op}
                          onClick={()=>responderPaso(marcado?sel.filter((x:string)=>x!==op):[...sel,op])}
                          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-left transition-all"
                          style={{
                            background: marcado?'#0d948815':'#111827',
                            color: marcado?'#2dd4bf':'#7a9bb5',
                            border: marcado?'1px solid #0d948830':'1px solid #1e2d3d',
                          }}>
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{background:marcado?'#0d9488':'#1e2d3d'}}>
                            {marcado && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          {op}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Observación */}
                <div className="mt-4">
                  <input type="text"
                    value={respuestas[pasoActual]?.observacion || ''}
                    onChange={e=>setObservacion(e.target.value)}
                    placeholder="Observación adicional (opcional)..."
                    className="w-full text-xs px-4 py-2.5 rounded-lg focus:outline-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#7a9bb5'}}
                  />
                </div>
              </div>

              {/* Navegación */}
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={anterior} disabled={pasoActual===0}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{background:'#111827', color:pasoActual===0?'#253447':'#7a9bb5', border:'1px solid #1e2d3d', opacity:pasoActual===0?0.4:1}}>
                  <ChevronLeft className="w-4 h-4"/> Anterior
                </button>
                <button onClick={siguiente}
                  disabled={!respuestaActual && respuestaActual?.valor !== false}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: respuestaActual
                      ? pasoActual===preguntas.length-1
                        ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                        : 'linear-gradient(135deg,#0d9488,#0f766e)'
                      : '#1e2d3d',
                    color: respuestaActual?'#fff':'#3d5166',
                  }}>
                  {pasoActual===preguntas.length-1
                    ? <><FileText className="w-4 h-4"/> Enviar a revisión</>
                    : <>Siguiente <ChevronRight className="w-4 h-4"/></>
                  }
                </button>
              </div>
            </div>
            <div className="mt-3 text-center text-xs" style={{color:'#3d5166'}}>
              {pasoActual+1} de {preguntas.length} · {Object.keys(respuestas).length} respondidas
            </div>
          </div>
        )}

        {/* ── REVISIÓN ── */}
        {fase === 'revision' && (
          <div className="w-full max-w-2xl space-y-4">
            <div className="rounded-2xl p-6" style={{background:'#0d1626', border:'1px solid #818cf840'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{background:'#818cf820', border:'1px solid #818cf840'}}>
                  <FileText className="w-5 h-5" style={{color:'#818cf8'}}/>
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Resumen de la orden</h2>
                  <p className="text-xs" style={{color:'#3d5166'}}>Revisa los resultados antes de firmar</p>
                </div>
              </div>

              {/* Stats resumen */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl p-3 text-center" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#e2e8f0'}}>{preguntas.length}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Total</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#4ade80'}}>
                    {Object.values(respuestas).filter(r=>r.conforme).length}
                  </div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Conformes</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:noConformes>0?'#f87171':'#4ade80'}}>
                    {noConformes}
                  </div>
                  <div className="text-xs" style={{color:'#3d5166'}}>No conformes</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{background:'#111827'}}>
                  <div className="text-xl font-bold" style={{color:'#fb923c'}}>{tiempoMin}min</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>Duración</div>
                </div>
              </div>

              {/* No conformes */}
              {noConformes > 0 && (
                <div className="rounded-xl overflow-hidden mb-4" style={{border:'1px solid #ef444430'}}>
                  <div className="px-4 py-2.5 text-xs font-bold" style={{background:'#ef444415', color:'#f87171'}}>
                    ⚠ Hallazgos no conformes — requieren atención
                  </div>
                  {Object.entries(respuestas).filter(([,r])=>!r.conforme).map(([idx,r])=>(
                    <div key={idx} className="px-4 py-3 text-xs" style={{borderTop:'1px solid #ef444420', color:'#7a9bb5'}}>
                      <div className="font-bold mb-0.5" style={{color:'#fca5a5'}}>
                        {preguntas[Number(idx)]?.pregunta}
                      </div>
                      <div>Respuesta: <span className="font-medium" style={{color:'#e2e8f0'}}>
                        {Array.isArray(r.valor)?r.valor.join(', '):r.valor}
                      </span></div>
                      {r.observacion && <div className="italic" style={{color:'#4a6580'}}>{r.observacion}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Todas las respuestas */}
              <details className="mb-4">
                <summary className="text-xs cursor-pointer font-semibold mb-2" style={{color:'#3d5166'}}>
                  Ver todas las respuestas ({Object.keys(respuestas).length})
                </summary>
                <div className="space-y-1 mt-2 max-h-48 overflow-y-auto">
                  {preguntas.map((p, i) => {
                    const r = respuestas[i]
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs py-1.5 px-3 rounded-lg"
                        style={{background:'#111827'}}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{background:r?(r.conforme?'#0d9488':'#ef4444'):'#1e2d3d', fontSize:'8px', color:'#fff'}}>
                          {r?(r.conforme?'✓':'!'):'?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{color:'#7a9bb5'}}>{p.pregunta}</div>
                          {r && <div className="font-medium" style={{color:'#e2e8f0'}}>
                            {Array.isArray(r.valor)?r.valor.join(', '):String(r.valor)}
                          </div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>

              <button onClick={irAFirma}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{background:'linear-gradient(135deg,#0d9488,#0f766e)', color:'#fff'}}>
                <Pen className="w-4 h-4"/> Proceder a firmar
              </button>
              <button onClick={()=>{ setPasoActual(0); setFase('ejecutando') }}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-medium"
                style={{background:'transparent', color:'#3d5166', border:'1px solid #1e2d3d'}}>
                ← Volver a editar respuestas
              </button>
            </div>
          </div>
        )}

        {/* ── FIRMANDO ── */}
        {fase === 'firmando' && (
          <div className="w-full max-w-xl space-y-4">
            <div className="rounded-2xl p-6" style={{background:'#0d1626', border:'1px solid #0d948840'}}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{background:'#0d948820', border:'1px solid #0d948840'}}>
                  <Pen className="w-5 h-5" style={{color:'#2dd4bf'}}/>
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Firma y aprobación</h2>
                  <p className="text-xs" style={{color:'#3d5166'}}>Firma para certificar la ejecución del mantenimiento</p>
                </div>
              </div>

              {/* Info de la orden */}
              <div className="rounded-xl p-4 mb-5" style={{background:'#111827'}}>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span style={{color:'#3d5166'}}>Orden:</span> <span className="font-mono font-bold" style={{color:'#e2e8f0'}}>{orden.id}</span></div>
                  <div><span style={{color:'#3d5166'}}>Equipo:</span> <span className="font-bold" style={{color:'#e2e8f0'}}>{orden.equipo}</span></div>
                  <div><span style={{color:'#3d5166'}}>Técnico:</span> <span style={{color:'#e2e8f0'}}>{orden.tecnico}</span></div>
                  <div><span style={{color:'#3d5166'}}>Fecha:</span> <span style={{color:'#e2e8f0'}}>{fechaHoy}</span></div>
                  <div><span style={{color:'#3d5166'}}>Duración:</span> <span style={{color:'#fb923c'}}>{tiempoMin} minutos</span></div>
                  <div><span style={{color:'#3d5166'}}>Resultado:</span> <span style={{color:noConformes>0?'#f87171':'#4ade80'}}>{noConformes>0?`${noConformes} no conformes`:'Conforme'}</span></div>
                </div>
              </div>

              {/* Firma técnico */}
              <div className="mb-4">
                <div className="text-xs font-bold mb-2 flex items-center gap-2" style={{color:'#7a9bb5'}}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{background:'#2dd4bf20', color:'#2dd4bf'}}>1</div>
                  Firma del técnico ejecutor
                </div>
                <div className="rounded-xl overflow-hidden" style={{border:`1px solid ${firma?'#0d948860':'#1e2d3d'}`, background:'#111827'}}>
                  <canvas ref={canvasRef} width={480} height={120}
                    style={{width:'100%', height:120, cursor:'crosshair', display:'block'}}
                    onMouseDown={e=>{
                      setDibujando(true)
                      const r=canvasRef.current!.getBoundingClientRect()
                      const ctx=canvasRef.current!.getContext('2d')!
                      ctx.beginPath(); ctx.moveTo(e.clientX-r.left, e.clientY-r.top)
                    }}
                    onMouseMove={e=>{
                      if(!dibujando) return
                      const r=canvasRef.current!.getBoundingClientRect()
                      const ctx=canvasRef.current!.getContext('2d')!
                      ctx.strokeStyle='#2dd4bf'; ctx.lineWidth=2; ctx.lineCap='round'
                      ctx.lineTo(e.clientX-r.left, e.clientY-r.top); ctx.stroke()
                      setFirma(canvasRef.current!.toDataURL())
                    }}
                    onMouseUp={()=>setDibujando(false)}
                    onMouseLeave={()=>setDibujando(false)}
                    onTouchStart={e=>{
                      e.preventDefault(); setDibujando(true)
                      const r=canvasRef.current!.getBoundingClientRect()
                      const t=e.touches[0]
                      const ctx=canvasRef.current!.getContext('2d')!
                      ctx.beginPath(); ctx.moveTo(t.clientX-r.left, t.clientY-r.top)
                    }}
                    onTouchMove={e=>{
                      e.preventDefault(); if(!dibujando) return
                      const r=canvasRef.current!.getBoundingClientRect()
                      const t=e.touches[0]
                      const ctx=canvasRef.current!.getContext('2d')!
                      ctx.strokeStyle='#2dd4bf'; ctx.lineWidth=2; ctx.lineCap='round'
                      ctx.lineTo(t.clientX-r.left, t.clientY-r.top); ctx.stroke()
                      setFirma(canvasRef.current!.toDataURL())
                    }}
                    onTouchEnd={()=>setDibujando(false)}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  {firma
                    ? <span className="text-xs" style={{color:'#2dd4bf'}}>✓ Firma registrada</span>
                    : <span className="text-xs" style={{color:'#3d5166'}}>Dibuja tu firma con el mouse o dedo</span>
                  }
                  <button onClick={()=>{ const ctx=canvasRef.current!.getContext('2d')!; ctx.clearRect(0,0,480,120); setFirma('') }}
                    className="text-xs px-3 py-1 rounded-lg" style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Firma supervisor (opcional) */}
              <div className="mb-6">
                <div className="text-xs font-bold mb-2 flex items-center gap-2" style={{color:'#7a9bb5'}}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{background:'#818cf820', color:'#818cf8'}}>2</div>
                  Visto bueno del supervisor <span style={{color:'#3d5166'}}>(opcional)</span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{border:`1px solid ${firmaSupervisor?'#818cf860':'#1e2d3d'}`, background:'#111827'}}>
                  <canvas ref={canvasSuperRef} width={480} height={100}
                    style={{width:'100%', height:100, cursor:'crosshair', display:'block'}}
                    onMouseDown={e=>{
                      setDibujandoSuper(true)
                      const r=canvasSuperRef.current!.getBoundingClientRect()
                      const ctx=canvasSuperRef.current!.getContext('2d')!
                      ctx.beginPath(); ctx.moveTo(e.clientX-r.left, e.clientY-r.top)
                    }}
                    onMouseMove={e=>{
                      if(!dibujandoSuper) return
                      const r=canvasSuperRef.current!.getBoundingClientRect()
                      const ctx=canvasSuperRef.current!.getContext('2d')!
                      ctx.strokeStyle='#818cf8'; ctx.lineWidth=2; ctx.lineCap='round'
                      ctx.lineTo(e.clientX-r.left, e.clientY-r.top); ctx.stroke()
                      setFirmaSupervisor(canvasSuperRef.current!.toDataURL())
                    }}
                    onMouseUp={()=>setDibujandoSuper(false)}
                    onMouseLeave={()=>setDibujandoSuper(false)}
                    onTouchStart={e=>{
                      e.preventDefault(); setDibujandoSuper(true)
                      const r=canvasSuperRef.current!.getBoundingClientRect()
                      const t=e.touches[0]
                      const ctx=canvasSuperRef.current!.getContext('2d')!
                      ctx.beginPath(); ctx.moveTo(t.clientX-r.left, t.clientY-r.top)
                    }}
                    onTouchMove={e=>{
                      e.preventDefault(); if(!dibujandoSuper) return
                      const r=canvasSuperRef.current!.getBoundingClientRect()
                      const t=e.touches[0]
                      const ctx=canvasSuperRef.current!.getContext('2d')!
                      ctx.strokeStyle='#818cf8'; ctx.lineWidth=2; ctx.lineCap='round'
                      ctx.lineTo(t.clientX-r.left, t.clientY-r.top); ctx.stroke()
                      setFirmaSupervisor(canvasSuperRef.current!.toDataURL())
                    }}
                    onTouchEnd={()=>setDibujandoSuper(false)}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  {firmaSupervisor
                    ? <span className="text-xs" style={{color:'#818cf8'}}>✓ Firma de supervisor registrada</span>
                    : <span className="text-xs" style={{color:'#3d5166'}}>Opcional — firma del supervisor</span>
                  }
                  <button onClick={()=>{ const ctx=canvasSuperRef.current!.getContext('2d')!; ctx.clearRect(0,0,480,100); setFirmaSupervisor('') }}
                    className="text-xs px-3 py-1 rounded-lg" style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                    Limpiar
                  </button>
                </div>
              </div>

              <button onClick={finalizar} disabled={!firma}
                className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: firma?'linear-gradient(135deg,#16a34a,#15803d)':'#1e2d3d',
                  color: firma?'#fff':'#3d5166',
                }}>
                <CheckCircle className="w-5 h-5"/>
                Firmar y finalizar orden
              </button>
            </div>
          </div>
        )}

        {/* ── FINALIZADO ── */}
        {fase === 'finalizado' && (
          <div className="w-full max-w-2xl space-y-4">

            {/* Mensaje de éxito */}
            <div className="rounded-2xl p-6 text-center no-print"
              style={{background:'#0d1626', border:'1px solid #16a34a40'}}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{background:'#16a34a20', border:'2px solid #16a34a'}}>
                <CheckCircle className="w-7 h-7" style={{color:'#4ade80'}}/>
              </div>
              <h2 className="text-lg font-bold mb-1" style={{color:'#e2e8f0'}}>¡Orden finalizada!</h2>
              <p className="text-sm mb-4" style={{color:'#3d5166'}}>
                {orden.equipo} · {tiempoMin} min · firmado por {firma}
              </p>
              <button onClick={imprimirPDF}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-3 transition-all hover:opacity-90"
                style={{background:'linear-gradient(135deg,#0d9488,#0f766e)', color:'#fff'}}>
                <FileText className="w-5 h-5"/>
                Exportar reporte en PDF
              </button>
              <Link href="/ordenes"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                <ArrowLeft className="w-4 h-4"/> Volver al tablero
              </Link>
            </div>

            {/* REPORTE PDF */}
            <div id="reporte-pdf" style={{background:'#fff', color:'#000', padding:'40px', fontFamily:'Arial, sans-serif', fontSize:'12px', lineHeight:'1.6'}}>
              {/* Header reporte */}
              <div style={{borderBottom:'3px solid #0d9488', paddingBottom:'20px', marginBottom:'24px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:'22px', fontWeight:'900', color:'#0d9488', marginBottom:'4px'}}>SYNAP</div>
                    <div style={{fontSize:'14px', fontWeight:'700', color:'#1a2332'}}>Reporte de Orden de Trabajo</div>
                    <div style={{fontSize:'11px', color:'#64748b'}}>Sistema de Gestión Biomédica · Res. 4816/2008</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'16px', fontWeight:'900', color:'#1a2332', fontFamily:'monospace'}}>{orden.id}</div>
                    <div style={{fontSize:'11px', color:'#64748b'}}>{fechaHoy}</div>
                    <div style={{marginTop:'6px', padding:'4px 12px', background:'#16a34a', color:'#fff', borderRadius:'4px', fontSize:'11px', fontWeight:'700', display:'inline-block'}}>
                      COMPLETADA
                    </div>
                  </div>
                </div>
              </div>

              {/* Info general */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'24px'}}>
                <div style={{background:'#f8fafc', padding:'16px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:'10px', fontWeight:'700', color:'#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px'}}>Información del Equipo</div>
                  {[
                    ['Equipo', orden.equipo],
                    ['Tipo de mantenimiento', orden.tipo],
                    ['Servicio', orden.servicio || 'No especificado'],
                    ['Unidades intervenidas', orden.cantidad],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'11px'}}>
                      <span style={{color:'#64748b'}}>{k}:</span>
                      <span style={{fontWeight:'600', color:'#1a2332'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'#f8fafc', padding:'16px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:'10px', fontWeight:'700', color:'#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px'}}>Resultados</div>
                  {[
                    ['Técnico', orden.tecnico],
                    ['Duración', `${tiempoMin} minutos`],
                    ['Ítems evaluados', preguntas.length],
                    ['Conformes', Object.values(respuestas).filter(r=>r.conforme).length],
                    ['No conformes', noConformes],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'11px'}}>
                      <span style={{color:'#64748b'}}>{k}:</span>
                      <span style={{fontWeight:'600', color: k==='No conformes'&&Number(v)>0?'#dc2626':'#1a2332'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla de respuestas */}
              <div style={{marginBottom:'24px'}}>
                <div style={{fontSize:'12px', fontWeight:'700', color:'#1a2332', marginBottom:'10px', paddingBottom:'6px', borderBottom:'2px solid #e2e8f0'}}>
                  Detalle de verificaciones
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'10px'}}>
                  <thead>
                    <tr style={{background:'#1a2332', color:'#fff'}}>
                      <th style={{padding:'8px', textAlign:'left', width:'30px'}}>#</th>
                      <th style={{padding:'8px', textAlign:'left'}}>Verificación</th>
                      <th style={{padding:'8px', textAlign:'center', width:'80px'}}>Resultado</th>
                      <th style={{padding:'8px', textAlign:'left', width:'120px'}}>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preguntas.map((p,i)=>{
                      const r = respuestas[i]
                      return (
                        <tr key={i} style={{background:i%2===0?'#fff':'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                          <td style={{padding:'6px 8px', color:'#64748b', fontFamily:'monospace'}}>{p.numero}</td>
                          <td style={{padding:'6px 8px', color:'#1a2332'}}>{p.pregunta}</td>
                          <td style={{padding:'6px 8px', textAlign:'center'}}>
                            {r ? (
                              <span style={{
                                padding:'2px 8px', borderRadius:'4px', fontWeight:'700',
                                background:r.conforme?'#dcfce7':'#fee2e2',
                                color:r.conforme?'#16a34a':'#dc2626',
                                fontSize:'9px'
                              }}>
                                {Array.isArray(r.valor)?r.valor.join(', '):String(r.valor)}
                              </span>
                            ) : <span style={{color:'#94a3b8'}}>—</span>}
                          </td>
                          <td style={{padding:'6px 8px', color:'#64748b', fontStyle:'italic'}}>
                            {r?.observacion || ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* No conformes destacados */}
              {noConformes > 0 && (
                <div style={{marginBottom:'24px', padding:'16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px'}}>
                  <div style={{fontSize:'11px', fontWeight:'700', color:'#dc2626', marginBottom:'8px'}}>
                    ⚠ Hallazgos no conformes — Requieren seguimiento
                  </div>
                  {Object.entries(respuestas).filter(([,r])=>!r.conforme).map(([idx,r])=>(
                    <div key={idx} style={{marginBottom:'6px', fontSize:'10px', color:'#7f1d1d'}}>
                      <span style={{fontWeight:'600'}}>• {preguntas[Number(idx)]?.pregunta}</span>
                      <span style={{color:'#dc2626'}}> → {Array.isArray(r.valor)?r.valor.join(', '):r.valor}</span>
                      {r.observacion && <span style={{color:'#9ca3af'}}> · {r.observacion}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Firmas */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginTop:'32px'}}>
                <div style={{borderTop:'2px solid #1a2332', paddingTop:'12px'}}>
                  <div style={{fontSize:'13px', fontStyle:'italic', fontWeight:'600', color:'#1a2332', marginBottom:'4px'}}>
                    {firma}
                  </div>
                  <div style={{fontSize:'10px', color:'#64748b'}}>{orden.tecnico} · Técnico ejecutor</div>
                  <div style={{fontSize:'10px', color:'#64748b'}}>{fechaHoy}</div>
                </div>
                <div style={{borderTop:'2px solid #1a2332', paddingTop:'12px'}}>
                  {firmaSupervisor ? (
                    <>
                      <div style={{fontSize:'13px', fontStyle:'italic', fontWeight:'600', color:'#1a2332', marginBottom:'4px'}}>
                        {firmaSupervisor}
                      </div>
                      <div style={{fontSize:'10px', color:'#64748b'}}>Supervisor / Jefe de área</div>
                    </>
                  ) : (
                    <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'8px'}}>Sin visto bueno de supervisor</div>
                  )}
                </div>
              </div>

              <div style={{marginTop:'24px', paddingTop:'12px', borderTop:'1px solid #e2e8f0', textAlign:'center', fontSize:'9px', color:'#94a3b8'}}>
                Documento generado por SYNAP · Sistema de Gestión Biomédica · {fechaHoy} · Res. 4816/2008 MSPS Colombia
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
    </>
  )
}
