'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const DOCS = [
  { id: 'ficha',          label: 'Ficha tecnica',                 icon: 'ti-clipboard-data',   desc: 'Especificaciones tecnicas del equipo' },
  { id: 'hoja',           label: 'Hoja de vida',                  icon: 'ti-file-description', desc: 'Historial completo del equipo' },
  { id: 'cronograma',     label: 'Cronograma de mantenimiento',   icon: 'ti-calendar-stats',   desc: 'Programacion anual de intervenciones' },
  { id: 'protocolo',      label: 'Protocolo de mantenimiento',    icon: 'ti-list-check',       desc: 'Procedimiento paso a paso' },
  { id: 'preinstalacion', label: 'Requisitos de pre-instalacion', icon: 'ti-tool',             desc: 'Condiciones para instalacion' },
]

async function getIID(): Promise<string> {
  try {
    const r = await fetch('/api/auth/me')
    const d = await r.json()
    return d.institucion_id || '00000000-0000-0000-0000-000000000001'
  } catch {
    return '00000000-0000-0000-0000-000000000001'
  }
}

export default function DocumentosPage() {
  const [cliente, setCliente] = useState({ nombre: '', correo: '', whatsapp: '' })
  const [busqueda, setBusqueda] = useState('')
  const [equipos, setEquipos]   = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  const [equipoSel, setEquipoSel] = useState<any>(null)
  const [generando, setGenerando] = useState<string | null>(null)
  const [generados, setGenerados] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function buscar() {
    if (busqueda.trim().length < 2) return
    setBuscando(true)
    const IID = await getIID()
    const sb = createClient()
    const { data } = await sb.from('equipos')
      .select('id,nombre,marca,modelo,serie,codigo_inventario,servicio')
      .eq('institucion_id', IID).eq('activo', true)
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
          nombre:     equipoSel.nombre,
          marca:      equipoSel.marca || 'N/D',
          modelo:     equipoSel.modelo || 'N/D',
          referencia: equipoSel.codigo_inventario || 'N/D',
          serial:     equipoSel.serie || 'N/D',
          servicio:   equipoSel.servicio || 'N/D',
          cliente:    cliente.nombre || 'Sin especificar',
        }),
      })
      const d = await r.json()
      if (d.url) {
        setGenerados(p => ({ ...p, [tipo]: d.url }))
      } else {
        setError(d.error || 'Error al generar.')
      }
    } catch { setError('Error de conexion.') }
    setGenerando(null)
  }

  async function generarTodos() {
    for (const doc of DOCS) await generar(doc.id)
  }

  function descargar(url: string, nombre: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.click()
  }

  function enviarWhatsApp() {
    if (!cliente.whatsapp) { setError('Ingresa el numero de WhatsApp del cliente.'); return }
    if (Object.keys(generados).length === 0) { setError('Genera al menos un documento primero.'); return }

    const baseUrl = window.location.origin
    const links = DOCS
      .filter(d => generados[d.id])
      .map(d => `• ${d.label}: ${baseUrl}${generados[d.id]}`)
      .join('\n')

    const mensaje = `Hola ${cliente.nombre || 'estimado cliente'},\n\nAdjunto encontrará la documentación técnica del equipo *${equipoSel?.nombre}* generada por SYNAP.\n\n📄 *Documentos disponibles:*\n${links}\n\n_SYNAP - Gestión Biomédica Inteligente_\nadmin@synap.co | www.synap.co`

    const numero = cliente.whatsapp.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${numero.startsWith('57') ? numero : '57' + numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  function enviarCorreo() {
    if (!cliente.correo) { setError('Ingresa el correo del cliente.'); return }
    if (Object.keys(generados).length === 0) { setError('Genera al menos un documento primero.'); return }

    const baseUrl = window.location.origin
    const links = DOCS
      .filter(d => generados[d.id])
      .map(d => `${d.label}: ${baseUrl}${generados[d.id]}`)
      .join('\n')

    const asunto = `Documentacion tecnica - ${equipoSel?.nombre} | SYNAP`
    const cuerpo = `Estimado/a ${cliente.nombre || 'cliente'},\n\nAdjunto encontrara la documentacion tecnica del equipo ${equipoSel?.nombre} generada por SYNAP.\n\nDocumentos disponibles:\n${links}\n\nSYNAP - Gestion Biomedica Inteligente\nadmin@synap.co | www.synap.co`

    window.open(`mailto:${cliente.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`)
  }

  const docsGenerados = Object.keys(generados).length
  const listo = docsGenerados > 0

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#fff' }}>

      {/* Topbar */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #E4E4E7', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:2 }}>SYNAP / Activos / Documentacion</div>
          <h1 style={{ fontSize:18, fontWeight:600, color:'#18181B', margin:0 }}>Generador de documentos</h1>
        </div>
        {listo && (
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#F0FDF4', padding:'6px 12px', borderRadius:6, border:'0.5px solid #BBF7D0' }}>
            <i className="ti ti-check" style={{ fontSize:13, color:'#16A34A' }}/>
            <span style={{ fontSize:11, color:'#16A34A', fontWeight:500 }}>{docsGenerados} documento{docsGenerados > 1 ? 's' : ''} generado{docsGenerados > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div style={{ flex:1, padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start', maxWidth:1100 }}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Datos del cliente */}
          <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E4E4E7', padding:'18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-user" style={{ fontSize:16, color:'#1B2B5B' }}/>
              Datos del cliente
            </div>
            {[
              { key:'nombre',   label:'Nombre del cliente',  placeholder:'Ej: IPS San Rafael',        icon:'ti-building-hospital' },
              { key:'correo',   label:'Correo electronico',  placeholder:'Ej: contacto@ips.com',       icon:'ti-mail' },
              { key:'whatsapp', label:'WhatsApp',            placeholder:'Ej: 3001234567',             icon:'ti-brand-whatsapp' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:500, color:'#52525B', marginBottom:4 }}>{f.label}</div>
                <div style={{ position:'relative' }}>
                  <i className={'ti ' + f.icon} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#A1A1AA', fontSize:14 }}/>
                  <input
                    value={(cliente as any)[f.key]}
                    onChange={e => setCliente(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width:'100%', paddingLeft:32, height:36, fontSize:13 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Seleccionar equipo */}
          <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E4E4E7', padding:'18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-device-heart-monitor" style={{ fontSize:16, color:'#1B2B5B' }}/>
              Seleccionar equipo
            </div>
            <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:12 }}>Busca por nombre, serial o codigo.</div>

            <div style={{ position:'relative', marginBottom:10 }}>
              <i className="ti ti-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#A1A1AA', fontSize:14 }}/>
              <input value={busqueda}
                onChange={e => { setBusqueda(e.target.value); if (equipoSel) setEquipoSel(null) }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: Monitor, Ventilador..."
                style={{ width:'100%', paddingLeft:32, paddingRight:90, height:36, fontSize:13 }}/>
              <button onClick={buscar} disabled={buscando || busqueda.length < 2}
                style={{ position:'absolute', right:5, top:'50%', transform:'translateY(-50%)', padding:'4px 12px', borderRadius:5, border:'none', background: busqueda.length >= 2 ? '#1B2B5B' : '#F4F4F5', color: busqueda.length >= 2 ? '#fff' : '#A1A1AA', fontSize:11, cursor:'pointer' }}>
                {buscando ? '...' : 'Buscar'}
              </button>
            </div>

            {equipos.length > 0 && (
              <div style={{ border:'0.5px solid #E4E4E7', borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                {equipos.map((eq, i) => (
                  <div key={eq.id} onClick={() => sel(eq)}
                    style={{ padding:'8px 12px', borderBottom: i < equipos.length-1 ? '0.5px solid #F4F4F5' : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}
                    onMouseEnter={e => (e.currentTarget.style.background='#F8F9FA')}
                    onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                    <i className="ti ti-device-heart-monitor" style={{ fontSize:14, color:'#1B2B5B', flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color:'#18181B' }}>{eq.nombre}</div>
                      <div style={{ fontSize:10, color:'#A1A1AA' }}>{eq.marca} · Serie: {eq.serie || 'N/D'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {equipoSel && (
              <div style={{ padding:'10px 12px', borderRadius:8, background:'#F0FDF4', border:'0.5px solid #BBF7D0', display:'flex', alignItems:'center', gap:10 }}>
                <i className="ti ti-check" style={{ fontSize:14, color:'#16A34A' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#16A34A' }}>{equipoSel.nombre}</div>
                  <div style={{ fontSize:10, color:'#71717A' }}>{equipoSel.marca} · {equipoSel.serie || 'N/D'}</div>
                </div>
                <button onClick={() => { setEquipoSel(null); setBusqueda(''); setGenerados({}) }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#A1A1AA', fontSize:18 }}>×</button>
              </div>
            )}
          </div>

          {/* Enviar */}
          {listo && (
            <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E4E4E7', padding:'18px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <i className="ti ti-send" style={{ fontSize:16, color:'#1B2B5B' }}/>
                Enviar documentos
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={enviarWhatsApp}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:8, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  <i className="ti ti-brand-whatsapp" style={{ fontSize:18 }}/>
                  Enviar por WhatsApp
                </button>
                <button onClick={enviarCorreo}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:8, border:'0.5px solid #E4E4E7', background:'#fff', color:'#18181B', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  <i className="ti ti-mail" style={{ fontSize:16, color:'#1B2B5B' }}/>
                  Enviar por correo
                </button>
              </div>
              <div style={{ marginTop:10, padding:'8px 10px', borderRadius:6, background:'#F8F9FA', border:'0.5px solid #E4E4E7', fontSize:11, color:'#71717A' }}>
                <i className="ti ti-info-circle" style={{ fontSize:12, marginRight:4 }}/>
                WhatsApp incluye links directos a cada PDF. El correo abre tu cliente de email.
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, background:'#FEF2F2', color:'#DC2626', fontSize:12, border:'0.5px solid #FECACA', display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize:14 }}/>
              {error}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA — Documentos */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:2 }}>Documentos</div>
          <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:4 }}>
            {equipoSel ? `Equipo: ${equipoSel.nombre}` : 'Selecciona un equipo para generar los documentos'}
          </div>

          {equipoSel && (
            <button onClick={generarTodos} disabled={generando !== null}
              style={{ padding:'11px', borderRadius:10, border:'none', background:'#1B2B5B', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:4 }}>
              <i className="ti ti-files" style={{ fontSize:16 }}/>
              Generar todos los documentos
            </button>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {DOCS.map(doc => {
              const url = generados[doc.id]
              return (
                <div key={doc.id} style={{ background:'#fff', borderRadius:10, border:`0.5px solid ${url ? '#BBF7D0' : '#E4E4E7'}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:8, background: url ? '#F0FDF4' : '#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${url ? 'ti-check' : doc.icon}`} style={{ fontSize:18, color: url ? '#16A34A' : '#1B2B5B' }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'#18181B' }}>{doc.label}</div>
                    <div style={{ fontSize:10, color:'#A1A1AA' }}>{doc.desc}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {url && (
                      <button onClick={() => descargar(url, `SYNAP_${doc.id}.pdf`)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'0.5px solid #BBF7D0', background:'#F0FDF4', color:'#16A34A', fontSize:11, cursor:'pointer' }}>
                        <i className="ti ti-download" style={{ fontSize:12 }}/>
                      </button>
                    )}
                    <button onClick={() => generar(doc.id)} disabled={!equipoSel || generando === doc.id}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:6, border:'none', background: !equipoSel ? '#F4F4F5' : generando === doc.id ? '#F4F4F5' : url ? '#EEF2FF' : '#1B2B5B', color: !equipoSel ? '#A1A1AA' : generando === doc.id ? '#A1A1AA' : url ? '#1B2B5B' : '#fff', fontSize:11, fontWeight:500, cursor: equipoSel ? 'pointer' : 'default' }}>
                      {generando === doc.id
                        ? <><i className="ti ti-loader-2" style={{fontSize:12}}/> Generando</>
                        : url
                        ? <><i className="ti ti-refresh" style={{fontSize:12}}/> Regenerar</>
                        : <><i className="ti ti-file-type-pdf" style={{fontSize:12}}/> Generar PDF</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {!equipoSel && (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#A1A1AA', border:'0.5px dashed #E4E4E7', borderRadius:12 }}>
              <i className="ti ti-files" style={{ fontSize:44, display:'block', marginBottom:10, opacity:0.2 }}/>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Sin equipo seleccionado</div>
              <div style={{ fontSize:11 }}>Busca y selecciona un equipo en el panel izquierdo</div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
