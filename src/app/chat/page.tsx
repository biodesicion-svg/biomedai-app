'use client'
import { useState, useRef, useEffect } from 'react'

interface Msg { rol: 'user'|'assistant'; contenido: string; tipo?: string }

const RAPIDAS = [
  { texto: 'Resumen general del sistema', icon: 'ti-chart-bar' },
  { texto: 'Todos los monitores', icon: 'ti-device-heart-monitor' },
  { texto: 'Equipos de Urgencias', icon: 'ti-building-hospital' },
  { texto: 'Inventario de repuestos', icon: 'ti-package' },
  { texto: 'Hoja de vida del Monitor De Signos Vitales', icon: 'ti-file-description' },
  { texto: 'Ventiladores de UCI', icon: 'ti-wind' },
]

function renderMd(txt: string) {
  return txt
    .replace(/^# (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:#18181B;margin:16px 0 8px;border-bottom:1px solid #E4E4E7;padding-bottom:6px">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:14px;font-weight:600;color:#18181B;margin:12px 0 6px">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:13px;font-weight:600;color:#3B4FE8;margin:10px 0 4px">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#18181B">$1</strong>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#3B4FE8;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/\| (.+) \|/g, (match: string) => {
      const cells = match.split('|').filter(c => c.trim())
      const isHeader = false
      return '<tr>' + cells.map((c: string) => `<td style="padding:6px 10px;border:0.5px solid #E4E4E7;font-size:12px">${c.trim()}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (match: string) => {
      const rows = match.split('\n').filter(r => r.includes('<tr>'))
      if (rows.length === 0) return match
      const [header, ...body] = rows
      const styledHeader = header.replace(/<td/g, '<th style="padding:6px 10px;border:0.5px solid #E4E4E7;background:#F8F9FA;font-size:11px;font-weight:600;color:#71717A;text-transform:uppercase;letter-spacing:0.04em"').replace(/<\/td>/g, '</th>')
      return `<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden"><thead>${styledHeader}</thead><tbody>${body.join('\n')}</tbody></table></div>`
    })
    .replace(/⚠️(.+)/g, '<div style="padding:6px 10px;background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:4px;margin:4px 0;font-size:12px">⚠️$1</div>')
    .replace(/🔴(.+)/g, '<span style="color:#DC2626;font-weight:500">🔴$1</span>')
    .replace(/🟡(.+)/g, '<span style="color:#D97706;font-weight:500">🟡$1</span>')
    .replace(/🟢(.+)/g, '<span style="color:#16A34A;font-weight:500">🟢$1</span>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:0.5px solid #E4E4E7;margin:12px 0"/>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>')
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    rol: 'assistant',
    contenido: `## 👋 Bienvenido al Asistente Biomédico BioMed AI\n\nPuedo ayudarte con:\n\n- **Buscar equipos** por tipo o servicio\n- **Ver todos los monitores, ventiladores, bombas**, etc.\n- **Hoja de vida completa** de cualquier equipo\n- **Estadísticas** del inventario\n- **Repuestos** con stock bajo o agotado\n\n¿Qué quieres consultar?`,
    tipo: 'bienvenida',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [msgs])

  async function enviar(texto?: string) {
    const q = (texto || input).trim()
    if (!q || loading) return
    setInput('')

    const nuevos: Msg[] = [...msgs, { rol: 'user', contenido: q }]
    setMsgs(nuevos)
    setLoading(true)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: q }),
      })
      const d = await r.json()
      setMsgs(p => [...p, { rol: 'assistant', contenido: d.respuesta || 'Sin respuesta.', tipo: d.tipo }])
    } catch {
      setMsgs(p => [...p, { rol: 'assistant', contenido: 'Error de conexión. Verifica que el sistema esté activo.', tipo: 'error' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fff' }}>

      <div style={{ background:'#fff', borderBottom:'0.5px solid #E4E4E7', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:2 }}>BioMed AI / Asistente IA</div>
          <h1 style={{ fontSize:18, fontWeight:600, color:'#18181B', margin:0 }}>Asistente biomédico</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#F0FDF4', padding:'6px 12px', borderRadius:6, border:'0.5px solid #BBF7D0' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }}/>
          <span style={{ fontSize:11, color:'#16A34A', fontWeight:500 }}>Conectado a Supabase</span>
        </div>
      </div>

      <div ref={ref} style={{ flex:1, overflowY:'auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:14, background:'#FAFAFA' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:10, flexDirection: m.rol==='user' ? 'row-reverse' : 'row', alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: m.rol==='assistant' ? '#3B4FE8' : '#E4E4E7', marginTop:2 }}>
              <i className={`ti ${m.rol==='assistant' ? 'ti-robot' : 'ti-user'}`} style={{ fontSize:15, color: m.rol==='assistant' ? '#fff' : '#71717A' }}/>
            </div>
            <div style={{
              maxWidth: m.rol==='user' ? '70%' : '85%',
              padding: '12px 16px',
              borderRadius: m.rol==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
              background: m.rol==='user' ? '#3B4FE8' : '#fff',
              border: m.rol==='user' ? 'none' : '0.5px solid #E4E4E7',
              color: m.rol==='user' ? '#fff' : '#334155',
              fontSize: 13,
              lineHeight: 1.6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {m.rol === 'user'
                ? m.contenido
                : <div dangerouslySetInnerHTML={{ __html: renderMd(m.contenido) }}/>
              }
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'#3B4FE8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="ti ti-robot" style={{ fontSize:15, color:'#fff' }}/>
            </div>
            <div style={{ padding:'12px 16px', borderRadius:'4px 12px 12px 12px', background:'#fff', border:'0.5px solid #E4E4E7', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#94A3B8', animation:`bounce 1.2s ${i*0.2}s infinite` }}/>
                ))}
              </div>
              <span style={{ fontSize:12, color:'#94A3B8' }}>Consultando base de datos...</span>
            </div>
          </div>
        )}
      </div>

      {msgs.length <= 1 && (
        <div style={{ padding:'0 28px 12px', display:'flex', flexWrap:'wrap', gap:8, background:'#FAFAFA', flexShrink:0 }}>
          {RAPIDAS.map((p, i) => (
            <button key={i} onClick={() => enviar(p.texto)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, fontSize:12, background:'#fff', border:'0.5px solid #E4E4E7', color:'#475569', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#3B4FE8'; e.currentTarget.style.color='#3B4FE8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E4E4E7'; e.currentTarget.style.color='#475569' }}>
              <i className={'ti '+p.icon} style={{ fontSize:13 }}/>{p.texto}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding:'14px 28px', background:'#fff', borderTop:'0.5px solid #E4E4E7', flexShrink:0 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && enviar()}
            placeholder='Ej: "todos los ventiladores", "hoja de vida del Monitor", "equipos de UCI"...'
            disabled={loading}
            style={{ flex:1, height:42, fontSize:13 }}
          />
          <button onClick={() => enviar()} disabled={loading || !input.trim()}
            style={{ width:42, height:42, borderRadius:8, border:'none', background: input.trim() ? '#3B4FE8' : '#E4E4E7', color: input.trim() ? '#fff' : '#94A3B8', cursor: input.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
            <i className="ti ti-send" style={{ fontSize:16 }}/>
          </button>
        </div>
        <div style={{ fontSize:11, color:'#A1A1AA', textAlign:'center', marginTop:8 }}>
          Consulta directa a Supabase · Datos en tiempo real
        </div>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
