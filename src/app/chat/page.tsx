'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
}

const preguntasRapidas = [
  '¿Cuáles son los equipos de mayor riesgo en el inventario?',
  '¿Qué equipos necesitan mantenimiento preventivo urgente?',
  '¿Cómo está la disponibilidad general del parque de equipos?',
  '¿Qué equipos recomendarías dar de baja este año?',
  'Analiza el estado del presupuesto de mantenimiento',
  '¿Cuáles son los equipos con más fallas históricas?',
]

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: 'assistant',
      contenido: `Hola, soy **BioMed AI**, tu copiloto de ingeniería biomédica. 

Tengo acceso al inventario completo de tu institución con **1,438 equipos** registrados. Puedo ayudarte con:

- 📋 Análisis del inventario y clasificación de riesgo
- 🔧 Recomendaciones de mantenimiento preventivo y correctivo  
- 📊 Interpretación de KPIs (MTBF, MTTR, disponibilidad)
- 💰 Análisis presupuestal y proyecciones
- ⚠️ Identificación de equipos críticos
- 🔄 Recomendaciones de reemplazo según vida útil

¿En qué te puedo ayudar hoy?`
    }
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [contexto, setContexto] = useState<string>('')
  const mensajesRef = useRef<HTMLDivElement>(null)

  // Cargar contexto del inventario al iniciar
  useEffect(() => {
    async function cargarContexto() {
      const supabase = createClient()
      const { data: equipos } = await supabase
        .from('equipos')
        .select('nombre, riesgo, estado, servicio, marca, modelo, codigo_inventario')
        .eq('institucion_id', INSTITUCION_ID)
        .eq('activo', true)
        .limit(100)

      if (equipos) {
        const resumen = `
INVENTARIO ACTUAL (muestra de 100 equipos):
Total equipos: ${equipos.length}
Por riesgo: Alto=${equipos.filter(e=>e.riesgo==='alto').length}, Medio=${equipos.filter(e=>e.riesgo==='medio').length}, Bajo=${equipos.filter(e=>e.riesgo==='bajo').length}
Por estado: Operativo=${equipos.filter(e=>e.estado==='operativo').length}, Baja=${equipos.filter(e=>e.estado==='baja').length}

Equipos de alto riesgo:
${equipos.filter(e=>e.riesgo==='alto').slice(0,20).map(e=>`- ${e.nombre} (${e.marca} ${e.modelo}) | ${e.servicio} | ${e.codigo_inventario}`).join('\n')}

Servicios presentes: ${[...new Set(equipos.map(e=>e.servicio).filter(Boolean))].join(', ')}
        `
        setContexto(resumen)
      }
    }
    cargarContexto()
  }, [])

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
    }
  }, [mensajes])

  async function enviar(texto?: string) {
    const pregunta = texto || input.trim()
    if (!pregunta || cargando) return

    setInput('')
    const nuevosMensajes: Mensaje[] = [
      ...mensajes,
      { rol: 'user', contenido: pregunta }
    ]
    setMensajes(nuevosMensajes)
    setCargando(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensajes: nuevosMensajes,
          contexto
        })
      })

      const data = await response.json()
      setMensajes(prev => [...prev, { rol: 'assistant', contenido: data.respuesta }])
    } catch (err) {
      setMensajes(prev => [...prev, {
        rol: 'assistant',
        contenido: 'Error al conectar con el motor de IA. Verifica la API key de Anthropic en el .env.local'
      }])
    }
    setCargando(false)
  }

  function renderMensaje(texto: string) {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/•/g, '&bull;')
  }

  return (
    <div className="flex flex-col h-screen" style={{ background:'#080e16' }}>

      {/* Topbar */}
      <div className="px-8 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom:'1px solid #1e2d3d', background:'#0a1120' }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs" style={{ color:'#3d5166' }}>BioMed AI</span>
            <span style={{ color:'#1e2d3d' }}>/</span>
            <span className="text-xs font-medium" style={{ color:'#2dd4bf' }}>Asistente IA</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color:'#e2e8f0' }}>Copiloto Biomédico</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background:'#0d948815', border:'1px solid #0d948830', color:'#2dd4bf' }}>
          <Activity className="w-3.5 h-3.5 animate-pulse"/>
          Claude Sonnet · Activo
        </div>
      </div>

      {/* Mensajes */}
      <div ref={mensajesRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.rol === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: m.rol === 'assistant' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#1e2d3d',
              }}>
              {m.rol === 'assistant'
                ? <Bot className="w-4 h-4 text-white"/>
                : <User className="w-4 h-4" style={{ color:'#7a9bb5' }}/>
              }
            </div>
            <div className="max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed"
              style={{
                background: m.rol === 'assistant' ? '#0d1626' : '#1e2d3d',
                border: '1px solid #1e2d3d',
                color: '#e2e8f0',
                borderRadius: m.rol === 'assistant' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
              }}
              dangerouslySetInnerHTML={{ __html: renderMensaje(m.contenido) }}
            />
          </div>
        ))}

        {cargando && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background:'linear-gradient(135deg, #0d9488, #0f766e)' }}>
              <Bot className="w-4 h-4 text-white"/>
            </div>
            <div className="px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background:'#0d1626', border:'1px solid #1e2d3d' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color:'#2dd4bf' }}/>
              <span className="text-sm" style={{ color:'#3d5166' }}>Analizando datos biomédicos...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preguntas rápidas */}
      {mensajes.length <= 1 && (
        <div className="px-8 pb-3 flex flex-wrap gap-2 flex-shrink-0">
          {preguntasRapidas.map((p, i) => (
            <button key={i} onClick={() => enviar(p)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background:'#0d1626',
                border:'1px solid #1e2d3d',
                color:'#7a9bb5',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0d9488'
                e.currentTarget.style.color = '#2dd4bf'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e2d3d'
                e.currentTarget.style.color = '#7a9bb5'
              }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-8 py-4 flex-shrink-0" style={{ borderTop:'1px solid #1e2d3d' }}>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder="Pregunta sobre equipos, mantenimiento, presupuesto..."
            className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{
              background:'#0d1626',
              border:'1px solid #1e2d3d',
              color:'#e2e8f0',
            }}
            disabled={cargando}
          />
          <button onClick={() => enviar()}
            disabled={cargando || !input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: input.trim() ? '#0d9488' : '#1e2d3d',
              color: input.trim() ? '#fff' : '#3d5166',
            }}>
            <Send className="w-4 h-4"/>
          </button>
        </div>
        <div className="mt-2 text-xs text-center" style={{ color:'#253447' }}>
          BioMed AI · Powered by Claude · Datos reales de tu institución
        </div>
      </div>
    </div>
  )
}
