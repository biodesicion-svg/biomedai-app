'use client'
import { useState, useEffect, useRef } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',AZ_BG='#EEF2FF'

export default function FormularioCapacitacion({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paso, setPaso] = useState<'identificacion'|'evaluacion'|'firma'|'completado'>('identificacion')
  const [asistenteId, setAsisteenteId] = useState('')
  const [respuestas, setRespuestas] = useState<any[]>([])
  const [firmando, setFirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasFirma, setHasFirma] = useState(false)
  const [nota, setNota] = useState<number|null>(null)

  useEffect(() => {
    fetch(`/api/capacitaciones/formulario?token=${params.token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
  }, [params.token])

  function seleccionarAsistente(id: string) {
    setAsisteenteId(id)
    if (data.preguntas?.length > 0) {
      setPaso('evaluacion')
    } else {
      setPaso('firma')
    }
  }

  function responder(pregId: string, idx: number) {
    setRespuestas(prev => {
      const filtered = prev.filter(r => r.pregunta_id !== pregId)
      return [...filtered, { pregunta_id: pregId, respuesta_dada: idx }]
    })
  }

  function calcularNota() {
    if (!data.preguntas?.length) return 100
    const correctas = respuestas.filter(r => {
      const preg = data.preguntas.find((p: any) => p.id === r.pregunta_id)
      return preg?.respuesta_correcta === r.respuesta_dada
    }).length
    return Math.round((correctas / data.preguntas.length) * 100)
  }

  // Canvas firma
  function startDraw(e: any) {
    setDrawing(true)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY || e.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  function draw(e: any) {
    if (!drawing) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY || e.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = AZ
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    setHasFirma(true)
  }
  function endDraw() { setDrawing(false) }
  function limpiarFirma() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasFirma(false)
  }

  async function enviarFormulario() {
    if (!hasFirma) return
    setGuardando(true)
    const canvas = canvasRef.current!
    const firma_svg = canvas.toDataURL('image/png')
    const notaFinal = calcularNota()
    setNota(notaFinal)

    await fetch('/api/capacitaciones/formulario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asistente_id: asistenteId,
        firma_svg,
        respuestas,
        tema_id: data.tema?.id
      })
    })
    setGuardando(false)
    setPaso('completado')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <i className="ti ti-certificate" style={{ fontSize:40, color:AZ, display:'block', marginBottom:12 }}/>
        <div style={{ color:GR, fontSize:14 }}>Cargando...</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <i className="ti ti-alert-circle" style={{ fontSize:48, color:RO, display:'block', marginBottom:16 }}/>
        <div style={{ fontSize:16, fontWeight:700, color:RO, marginBottom:8 }}>{error}</div>
      </div>
    </div>
  )

  const { registro, tema, asistentes, preguntas } = data

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', fontFamily:'Inter,sans-serif', padding:20 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>

      <div style={{ maxWidth:500, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ background:AZ, borderRadius:16, padding:24, marginBottom:20, textAlign:'center' }}>
          <i className="ti ti-certificate" style={{ fontSize:32, color:'#fff', display:'block', marginBottom:8 }}/>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{tema?.nombre}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4 }}>
            {registro?.fecha} · {registro?.capacitador} · {registro?.lugar}
          </div>
        </div>

        {/* PASO 1: Identificación */}
        {paso === 'identificacion' && (
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:15, fontWeight:700, color:AZ, marginBottom:6 }}>¿Quién eres?</div>
            <div style={{ fontSize:13, color:GR, marginBottom:20 }}>Selecciona tu nombre de la lista de asistentes</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {asistentes.filter((a: any) => !a.evaluacion_completada).map((a: any) => (
                <button key={a.id} onClick={() => seleccionarAsistente(a.id)}
                  style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'12px 16px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:AZ_BG, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="ti ti-user" style={{ color:AZ, fontSize:16 }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{a.persona?.nombre}</div>
                    <div style={{ fontSize:11, color:GR }}>{a.persona?.cargo} · {a.persona?.servicio}</div>
                  </div>
                </button>
              ))}
              {asistentes.filter((a: any) => a.evaluacion_completada).length > 0 && (
                <div style={{ marginTop:8, padding:'10px 14px', background:VE_BG, borderRadius:10, fontSize:12, color:'#166534' }}>
                  <i className="ti ti-check"/> {asistentes.filter((a: any) => a.evaluacion_completada).length} persona(s) ya completaron el formulario
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: Evaluación */}
        {paso === 'evaluacion' && (
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:15, fontWeight:700, color:AZ, marginBottom:4 }}>Evaluación de conocimientos</div>
            <div style={{ fontSize:13, color:GR, marginBottom:20 }}>{preguntas?.length} pregunta(s) · Mínimo 70% para aprobar</div>
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {preguntas?.map((p: any, pi: number) => (
                <div key={p.id}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', marginBottom:10 }}>
                    {pi+1}. {p.pregunta}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {p.opciones.map((op: string, oi: number) => {
                      const seleccionada = respuestas.find(r => r.pregunta_id === p.id)?.respuesta_dada === oi
                      return (
                        <button key={oi} onClick={() => responder(p.id, oi)}
                          style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${seleccionada?AZ:'#E2E8F0'}`, background:seleccionada?AZ_BG:'#fff', cursor:'pointer', textAlign:'left', fontSize:13, color:seleccionada?AZ:'#334155', display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${seleccionada?AZ:'#CBD5E1'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {seleccionada && <div style={{ width:8, height:8, borderRadius:'50%', background:AZ }}/>}
                          </div>
                          {op}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setPaso('firma')}
              disabled={respuestas.length < (preguntas?.length||0)}
              style={{ width:'100%', marginTop:24, padding:14, background:respuestas.length < (preguntas?.length||0)?'#94A3B8':AZ, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:respuestas.length < (preguntas?.length||0)?'not-allowed':'pointer' }}>
              Continuar a firma →
            </button>
          </div>
        )}

        {/* PASO 3: Firma */}
        {paso === 'firma' && (
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:15, fontWeight:700, color:AZ, marginBottom:4 }}>Firma de asistencia</div>
            <div style={{ fontSize:13, color:GR, marginBottom:16 }}>Firma en el recuadro usando tu dedo o mouse</div>
            <div style={{ border:'2px solid #E2E8F0', borderRadius:10, overflow:'hidden', marginBottom:12, background:'#FAFAFA' }}>
              <canvas ref={canvasRef} width={460} height={180}
                style={{ width:'100%', height:180, touchAction:'none', cursor:'crosshair' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              <button onClick={limpiarFirma} style={{ flex:1, padding:10, background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, fontSize:13, cursor:'pointer', color:GR }}>
                <i className="ti ti-trash"/> Limpiar
              </button>
            </div>
            <button onClick={enviarFormulario} disabled={!hasFirma||guardando}
              style={{ width:'100%', padding:14, background:!hasFirma?'#94A3B8':VE, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:!hasFirma?'not-allowed':'pointer' }}>
              {guardando ? 'Guardando...' : '✓ Confirmar asistencia'}
            </button>
          </div>
        )}

        {/* PASO 4: Completado */}
        {paso === 'completado' && (
          <div style={{ background:'#fff', borderRadius:16, padding:32, border:'1px solid #E2E8F0', textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:nota!==null&&nota>=70?VE_BG:RO_BG, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <i className={`ti ${nota!==null&&nota>=70?'ti-circle-check':'ti-circle-x'}`} style={{ fontSize:32, color:nota!==null&&nota>=70?VE:RO }}/>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:nota!==null&&nota>=70?VE:RO, marginBottom:8 }}>
              {nota!==null&&nota>=70?'¡Capacitación completada!':'Capacitación completada'}
            </div>
            {nota !== null && (
              <div style={{ fontSize:24, fontWeight:700, color:AZ, marginBottom:8 }}>Nota: {nota}%</div>
            )}
            <div style={{ fontSize:13, color:GR, marginBottom:4 }}>{tema?.nombre}</div>
            <div style={{ fontSize:12, color:GR }}>{registro?.fecha} · {registro?.capacitador}</div>
            {nota !== null && nota < 70 && (
              <div style={{ background:RO_BG, borderRadius:8, padding:'10px 14px', marginTop:16, fontSize:12, color:RO }}>
                Nota inferior al 70%. Se recomienda refuerzo de la capacitación.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
