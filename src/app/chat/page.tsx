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

function MdBlock({ texto }: { texto: string }) {
  const lineas = texto.split('\n')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2, fontSize:13, color:'#334155', lineHeight:1.6 }}>
      {lineas.map((linea, i) => {
        if (!linea.trim()) return null

        // H1
        if (linea.startsWith('# ')) return (
          <div key={i} style={{ fontSize:16, fontWeight:700, color:'#18181B', borderBottom:'1px solid #E4E4E7', paddingBottom:6, marginTop:8, marginBottom:4 }}>
            {linea.replace('# ', '')}
          </div>
        )
        // H2
        if (linea.startsWith('## ')) return (
          <div key={i} style={{ fontSize:14, fontWeight:600, color:'#18181B', marginTop:10, marginBottom:3 }}>
            {linea.replace('## ', '')}
          </div>
        )
        // H3
        if (linea.startsWith('### ')) return (
          <div key={i} style={{ fontSize:13, fontWeight:600, color:'#3B4FE8', marginTop:8, marginBottom:2 }}>
            {linea.replace('### ', '')}
          </div>
        )
        // H4
        if (linea.startsWith('#### ')) return (
          <div key={i} style={{ fontSize:12, fontWeight:600, color:'#7C3AED', marginTop:6, marginBottom:2 }}>
            {linea.replace('#### ', '')}
          </div>
        )
        // HR
        if (linea.trim() === '---') return <hr key={i} style={{ border:'none', borderTop:'0.5px solid #E4E4E7', margin:'6px 0' }}/>
        // Lista
        if (linea.startsWith('- ') || linea.startsWith('• ')) return (
          <div key={i} style={{ display:'flex', gap:8, marginLeft:4 }}>
            <span style={{ color:'#3B4FE8', flexShrink:0, marginTop:1 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: linea.replace(/^[-•] /, '').replace(/\*\*(.+?)\*\*/g, '<strong style="color:#18181B">$1</strong>').replace(/⚠️/g, '⚠️') }}/>
          </div>
        )
        // Tabla
        if (linea.startsWith('|')) {
          // Acumular filas de tabla
          const esHeader = lineas[i+1]?.includes('|---') || lineas[i+1]?.includes('|:--')
          const esSeparador = linea.includes('|---') || linea.includes('|:--')
          if (esSeparador) return null

          const celdas = linea.split('|').filter(c => c.trim())
          const esFilaHeader = lineas[i+1]?.includes('|---') || lineas[i+1]?.includes('|:--') ||
            (i > 0 && (lineas[i-1]?.includes('|---') || lineas[i-1]?.includes('|:--') || !lineas[i-1]?.startsWith('|')))
          const esPrimerFila = !lineas[i-1]?.startsWith('|') || lineas[i-1]?.includes('|---')

          if (esPrimerFila) {
            // Renderizar tabla completa desde aquí
            const filas: string[][] = []
            let j = i
            while (j < lineas.length && lineas[j].startsWith('|')) {
              if (!lineas[j].includes('|---') && !lineas[j].includes('|:--')) {
                filas.push(lineas[j].split('|').filter(c => c.trim()))
              }
              j++
            }
            if (filas.length === 0) return null
            const [headerFila, ...bodyFilas] = filas
            return (
              <div key={i} style={{ overflowX:'auto', margin:'6px 0' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>
                      {headerFila.map((c, ci) => (
                        <th key={ci} style={{ padding:'6px 10px', border:'0.5px solid #E4E4E7', background:'#F8F9FA', fontWeight:600, color:'#71717A', textTransform:'uppercase', fontSize:10, letterSpacing:'0.04em', textAlign:'left' }}>
                          {c.trim().replace(/\*\*/g, '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyFilas.map((fila, fi) => (
                      <tr key={fi} style={{ background: fi%2===0?'#fff':'#FAFAFA' }}>
                        {fila.map((c, ci) => (
                          <td key={ci} style={{ padding:'6px 10px', border:'0.5px solid #E4E4E7', color:'#334155' }}
                            dangerouslySetInnerHTML={{ __html: c.trim().replace(/\*\*(.+?)\*\*/g, '<strong style="color:#18181B">$1</strong>') }}/>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
          return null // Las filas siguientes de la tabla ya se renderizaron
        }
        // Línea normal con bold
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: linea.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#18181B">$1</strong>') }}/>
        )
      })}
    </div>
  )
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    rol: 'assistant',
    contenido: `## 👋 Bienvenido al Asistente Biomédico\n\nPuedo ayudarte con:\n\n- **Buscar equipos** por tipo o servicio\n- **Hoja de vida completa** de cualquier equipo\n- **Estadísticas** del inventario\n- **Repuestos** con stock bajo o agotado\n\n¿Qué quieres consultar?`,
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
    const nuevos: Msg[] = [...msgs, { rol:'user', contenido:q }]
    setMsgs(nuevos)
    setLoading(true)
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mensaje: q }) })
      const d = await r.json()
      setMsgs(p => [...p, { rol:'assistant', contenido: d.respuesta || 'Sin respuesta.', tipo: d.tipo }])
    } catch {
      setMsgs(p => [...p, { rol:'assistant', contenido:'Error de conexión.', tipo:'error' }])
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
          <span style={{ fontSize:11, color:'#16A34A', fontWeight:500 }}>Conectado · Datos en tiempo real</span>
        </div>
      </div>

      <div ref={ref} style={{ flex:1, overflowY:'auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:12, background:'#FAFAFA' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:10, flexDirection: m.rol==='user'?'row-reverse':'row', alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: m.rol==='assistant'?'#3B4FE8':'#E4E4E7', marginTop:2 }}>
              <i className={`ti ${m.rol==='assistant'?'ti-robot':'ti-user'}`} style={{ fontSize:15, color: m.rol==='assistant'?'#fff':'#71717A' }}/>
            </div>
            <div style={{
              maxWidth: m.rol==='user'?'65%':'88%',
              padding:'12px 16px',
              borderRadius: m.rol==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',
              background: m.rol==='user'?'#3B4FE8':'#fff',
              border: m.rol==='user'?'none':'0.5px solid #E4E4E7',
              color: m.rol==='user'?'#fff':'#334155',
              fontSize:13,
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {m.rol==='user'
                ? <span>{m.contenido}</span>
                : <MdBlock texto={m.contenido}/>
              }
            </div>
          </div>
        ))}

        {loading&&(
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'#3B4FE8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="ti ti-robot" style={{ fontSize:15, color:'#fff' }}/>
            </div>
            <div style={{ padding:'12px 16px', borderRadius:'4px 12px 12px 12px', background:'#fff', border:'0.5px solid #E4E4E7', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#94A3B8', animation:`bounce 1.2s ${i*0.2}s infinite` }}/>)}
              </div>
              <span style={{ fontSize:12, color:'#94A3B8' }}>Consultando base de datos...</span>
            </div>
          </div>
        )}
      </div>

      {msgs.length<=1&&(
        <div style={{ padding:'0 28px 12px', display:'flex', flexWrap:'wrap', gap:8, background:'#FAFAFA', flexShrink:0 }}>
          {RAPIDAS.map((p,i)=>(
            <button key={i} onClick={()=>enviar(p.texto)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, fontSize:12, background:'#fff', border:'0.5px solid #E4E4E7', color:'#475569', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#3B4FE8';e.currentTarget.style.color='#3B4FE8'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E4E4E7';e.currentTarget.style.color='#475569'}}>
              <i className={'ti '+p.icon} style={{ fontSize:13 }}/>{p.texto}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding:'14px 28px', background:'#fff', borderTop:'0.5px solid #E4E4E7', flexShrink:0 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enviar()}
            placeholder='Ej: "todos los ventiladores", "hoja de vida del Monitor", "equipos de UCI"...'
            disabled={loading} style={{ flex:1, height:42, fontSize:13 }}/>
          <button onClick={()=>enviar()} disabled={loading||!input.trim()} style={{ width:42, height:42, borderRadius:8, border:'none', background:input.trim()?'#3B4FE8':'#E4E4E7', color:input.trim()?'#fff':'#94A3B8', cursor:input.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-send" style={{ fontSize:16 }}/>
          </button>
        </div>
        <div style={{ fontSize:11, color:'#A1A1AA', textAlign:'center', marginTop:8 }}>Consulta directa a Supabase · Sin intermediarios</div>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
