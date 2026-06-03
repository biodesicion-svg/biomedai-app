'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const INST = '00000000-0000-0000-0000-000000000001'
const DOCS = [
  { id: 'ficha',          label: 'Ficha tecnica',                 icon: 'ti-clipboard-data',   desc: 'Especificaciones tecnicas del equipo' },
  { id: 'hoja',           label: 'Hoja de vida',                  icon: 'ti-file-description', desc: 'Historial completo del equipo' },
  { id: 'cronograma',     label: 'Cronograma de mantenimiento',   icon: 'ti-calendar-stats',   desc: 'Programacion anual de intervenciones' },
  { id: 'protocolo',      label: 'Protocolo de mantenimiento',    icon: 'ti-list-check',       desc: 'Procedimiento paso a paso' },
  { id: 'preinstalacion', label: 'Requisitos de pre-instalacion', icon: 'ti-tool',             desc: 'Condiciones para instalacion' },
]

export default function DocumentosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [equipos, setEquipos] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  const [equipoSel, setEquipoSel] = useState<any>(null)
  const [generando, setGenerando] = useState<string | null>(null)
  const [generados, setGenerados] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  async function buscar() {
    if (busqueda.trim().length < 2) return
    setBuscando(true)
    const sb = createClient()
    const { data } = await sb.from('equipos')
      .select('id,nombre,marca,modelo,serie,codigo_inventario,servicio')
      .eq('institucion_id', INST).eq('activo', true)
      .or(`nombre.ilike.%${busqueda}%,serie.ilike.%${busqueda}%,codigo_inventario.ilike.%${busqueda}%`)
      .limit(10)
    setEquipos(data || [])
    setBuscando(false)
  }

  function sel(eq: any) {
    setEquipoSel(eq)
    setEquipos([])
    setBusqueda(eq.nombre)
    setGenerados({})
    setError('')
  }

  async function generar(tipo: string) {
    if (!equipoSel) return
    setGenerando(tipo)
    setError('')
    try {
      const r = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nombre: equipoSel.nombre,
          marca: equipoSel.marca || 'N/D',
          modelo: equipoSel.modelo || 'N/D',
          referencia: equipoSel.codigo_inventario || 'N/D',
          serial: equipoSel.serie || 'N/D',
          servicio: equipoSel.servicio || 'N/D',
        }),
      })
      const d = await r.json()
      if (d.url) {
        setGenerados(p => ({ ...p, [tipo]: true }))
        const a = document.createElement('a')
        a.href = d.url
        a.download = d.nombre
        a.click()
      } else {
        setError(d.error || 'Error al generar.')
      }
    } catch { setError('Error de conexion.') }
    setGenerando(null)
  }

  async function generarTodos() {
    for (const doc of DOCS) await generar(doc.id)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#fff' }}>
      <div style={{ background:'#fff', borderBottom:'0.5px solid #E4E4E7', padding:'14px 28px' }}>
        <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:2 }}>SYNAP / Activos / Documentacion</div>
        <h1 style={{ fontSize:18, fontWeight:600, color:'#18181B', margin:0 }}>Generador de documentos</h1>
      </div>

      <div style={{ flex:1, padding:'24px 28px', maxWidth:860 }}>
        <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E4E4E7', padding:'20px', marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:4 }}>Seleccionar equipo</div>
          <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:14 }}>Busca por nombre, serial o codigo. Los datos se completan automaticamente.</div>
          <div style={{ position:'relative', marginBottom:12 }}>
            <i className="ti ti-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#A1A1AA', fontSize:14 }}/>
            <input value={busqueda} onChange={e => { setBusqueda(e.target.value); if (equipoSel) setEquipoSel(null) }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ej: Monitor, Ventilador, serial..."
              style={{ width:'100%', paddingLeft:32, paddingRight:100, height:38, fontSize:13 }}/>
            <button onClick={buscar} disabled={buscando || busqueda.length < 2}
              style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', padding:'5px 14px', borderRadius:6, border:'none', background: busqueda.length >= 2 ? '#1B2B5B' : '#F4F4F5', color: busqueda.length >= 2 ? '#fff' : '#A1A1AA', fontSize:12, cursor:'pointer' }}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {equipos.length > 0 && (
            <div style={{ border:'0.5px solid #E4E4E7', borderRadius:8, overflow:'hidden', marginBottom:12 }}>
              {equipos.map((eq, i) => (
                <div key={eq.id} onClick={() => sel(eq)}
                  style={{ padding:'10px 14px', borderBottom: i < equipos.length-1 ? '0.5px solid #F4F4F5' : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}
                  onMouseEnter={e => (e.currentTarget.style.background='#F8F9FA')}
                  onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="ti ti-device-heart-monitor" style={{ fontSize:15, color:'#1B2B5B' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#18181B' }}>{eq.nombre}</div>
                    <div style={{ fontSize:11, color:'#A1A1AA' }}>{eq.marca} {eq.modelo} · Serie: {eq.serie || 'N/D'} · {eq.servicio || 'Sin servicio'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {equipoSel && (
            <div style={{ padding:'12px 16px', borderRadius:8, background:'#F0FDF4', border:'0.5px solid #BBF7D0', display:'flex', alignItems:'center', gap:12 }}>
              <i className="ti ti-check" style={{ fontSize:16, color:'#16A34A', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#16A34A' }}>{equipoSel.nombre}</div>
                <div style={{ fontSize:11, color:'#71717A' }}>{equipoSel.marca} {equipoSel.modelo} · Serie: {equipoSel.serie || 'N/D'}</div>
              </div>
              <button onClick={() => { setEquipoSel(null); setBusqueda(''); setGenerados({}) }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#A1A1AA', fontSize:20 }}>×</button>
            </div>
          )}

          {error && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:6, background:'#FEF2F2', color:'#DC2626', fontSize:12, border:'0.5px solid #FECACA' }}>
              {error}
            </div>
          )}
        </div>

        {equipoSel && (
          <>
            <button onClick={generarTodos} disabled={generando !== null}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'#1B2B5B', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <i className="ti ti-files" style={{ fontSize:16 }}/>
              Generar y descargar todos los documentos
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {DOCS.map(doc => (
                <div key={doc.id} style={{ background:'#fff', borderRadius:10, border:`0.5px solid ${generados[doc.id]?'#BBF7D0':'#E4E4E7'}`, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:generados[doc.id]?'#F0FDF4':'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${generados[doc.id]?'ti-check':doc.icon}`} style={{ fontSize:19, color:generados[doc.id]?'#16A34A':'#1B2B5B' }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#18181B' }}>{doc.label}</div>
                    <div style={{ fontSize:11, color:'#A1A1AA' }}>{doc.desc}</div>
                  </div>
                  <button onClick={() => generar(doc.id)} disabled={generando===doc.id}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:7, border:'none', background:generando===doc.id?'#F4F4F5':generados[doc.id]?'#F0FDF4':'#1B2B5B', color:generando===doc.id?'#A1A1AA':generados[doc.id]?'#16A34A':'#fff', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                    {generando===doc.id ? <><i className="ti ti-loader-2" style={{fontSize:13}}/> Generando...</>
                     : generados[doc.id] ? <><i className="ti ti-check" style={{fontSize:13}}/> Listo</>
                     : <><i className="ti ti-file-type-pdf" style={{fontSize:13}}/> Generar PDF</>}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!equipoSel && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#A1A1AA' }}>
            <i className="ti ti-files" style={{ fontSize:52, display:'block', marginBottom:12, opacity:0.2 }}/>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>Selecciona un equipo para continuar</div>
            <div style={{ fontSize:12 }}>Busca arriba y el sistema completara los datos automaticamente</div>
          </div>
        )}
      </div>
    </div>
  )
}
