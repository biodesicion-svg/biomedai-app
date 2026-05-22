'use client'
import { useState, useRef, useEffect } from 'react'

interface Msg { rol:'user'|'assistant'; contenido:string }

const RAPIDAS = [
  '¿Cuántos equipos hay en inventario?',
  'Información del Monitor De Signos Vitales',
  'Equipos de alto riesgo',
  'Historial del Desfibrilador',
  'Equipos en Urgencias',
  'Resumen general del inventario',
]

function renderTexto(t:string) {
  return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{rol:'assistant',contenido:`¡Hola! Soy el asistente biomédico de BioMed AI.\n\nPuedo ayudarte con:\n\n**Información de equipos** — nombre, código o marca\n**Historial de mantenimientos** — "historial del Monitor"\n**Estadísticas** — "resumen del inventario"\n**Por servicio** — "equipos de urgencias"`}])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(()=>{ if(ref.current) ref.current.scrollTop=ref.current.scrollHeight },[msgs])

  async function enviar(texto?:string) {
    const q = texto||input.trim()
    if(!q||cargando) return
    setInput('')
    const nuevos:Msg[] = [...msgs,{rol:'user',contenido:q}]
    setMsgs(nuevos)
    setCargando(true)
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensajes:nuevos})})
      const data = await res.json()
      setMsgs(p=>[...p,{rol:'assistant',contenido:data.respuesta||data.error||'Error al procesar.'}])
    } catch { setMsgs(p=>[...p,{rol:'assistant',contenido:'Error de conexión.'}]) }
    setCargando(false)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E2E8F0',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>BioMed AI / Asistente</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#0F172A',margin:0}}>Asistente biomédico</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:'#F0FDF4',padding:'6px 12px',borderRadius:6,border:'0.5px solid #BBF7D0'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E'}}/>
          <span style={{fontSize:11,color:'#16A34A',fontWeight:500}}>Conectado a base de datos</span>
        </div>
      </div>

      <div ref={ref} style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:16,background:'#F8F9FB'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:10,flexDirection:m.rol==='user'?'row-reverse':'row'}}>
            <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:m.rol==='assistant'?'#3B4FE8':'#E2E8F0'}}>
              <i className={`ti ${m.rol==='assistant'?'ti-robot':'ti-user'}`} style={{fontSize:15,color:m.rol==='assistant'?'#fff':'#64748B'}}/>
            </div>
            <div style={{maxWidth:'70%',padding:'12px 16px',borderRadius:12,background:m.rol==='user'?'#3B4FE8':'#fff',border:m.rol==='user'?'none':'0.5px solid #E2E8F0',color:m.rol==='user'?'#fff':'#334155',fontSize:13,lineHeight:1.6,fontFamily:'monospace',borderRadius:m.rol==='assistant'?'4px 12px 12px 12px':'12px 4px 12px 12px'}}
              dangerouslySetInnerHTML={{__html:renderTexto(m.contenido)}}/>
          </div>
        ))}
        {cargando&&(
          <div style={{display:'flex',gap:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'#3B4FE8',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-robot" style={{fontSize:15,color:'#fff'}}/>
            </div>
            <div style={{padding:'12px 16px',borderRadius:'4px 12px 12px 12px',background:'#fff',border:'0.5px solid #E2E8F0',display:'flex',alignItems:'center',gap:8}}>
              <div style={{display:'flex',gap:4}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#94A3B8',animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
              </div>
              <span style={{fontSize:12,color:'#94A3B8'}}>Consultando base de datos...</span>
            </div>
          </div>
        )}
      </div>

      {msgs.length<=1&&(
        <div style={{padding:'0 28px 12px',display:'flex',flexWrap:'wrap',gap:8,background:'#F8F9FB'}}>
          {RAPIDAS.map((p,i)=>(
            <button key={i} onClick={()=>enviar(p)} style={{padding:'6px 12px',borderRadius:20,fontSize:12,background:'#fff',border:'0.5px solid #E2E8F0',color:'#475569',cursor:'pointer',transition:'all 0.15s'}}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='#3B4FE8'; e.currentTarget.style.color='#3B4FE8' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.color='#475569' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:'16px 28px',background:'#fff',borderTop:'0.5px solid #E2E8F0',flexShrink:0}}>
        <div style={{display:'flex',gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enviar()}
            placeholder="Escribe el nombre de un equipo, código, servicio..." disabled={cargando}
            style={{flex:1,height:40}}/>
          <button onClick={()=>enviar()} disabled={cargando||!input.trim()}
            style={{width:40,height:40,borderRadius:8,border:'none',background:input.trim()?'#3B4FE8':'#E2E8F0',color:input.trim()?'#fff':'#94A3B8',cursor:input.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
            <i className="ti ti-send" style={{fontSize:16}}/>
          </button>
        </div>
        <div style={{fontSize:11,color:'#94A3B8',textAlign:'center',marginTop:8}}>
          BioMed AI · Consulta directa a base de datos · Sin IA generativa
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}
