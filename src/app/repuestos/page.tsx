'use client'

import { useState, useEffect } from 'react'
import {
  Package, Plus, AlertTriangle, ArrowDown,
  ArrowUp, Search, X, CheckCircle, History
} from 'lucide-react'

const INST = '00000000-0000-0000-0000-000000000001'

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'crear'|'asignar'|'entrada'|'historial'|null>(null)
  const [repSeleccionado, setRepSeleccionado] = useState<any>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [alerta, setAlerta] = useState<string|null>(null)
  const [equiposBusqueda, setEquiposBusqueda] = useState<any[]>([])

  // Forms
  const [formCrear, setFormCrear] = useState({ nombre:'', referencia:'', marca:'', descripcion:'', stock_actual:0, stock_minimo:2, unidad:'unidad', costo_unitario:'', proveedor:'' })
  const [formAsignar, setFormAsignar] = useState({ equipo_id:'', equipo_nombre:'', cantidad:1, orden_trabajo:'' })
  const [formEntrada, setFormEntrada] = useState({ cantidad:1, motivo:'' })
  const [busqEquipo, setBusqEquipo] = useState('')

  async function cargarRepuestos() {
    const res = await fetch('/api/repuestos')
    const data = await res.json()
    setRepuestos(data.repuestos || [])
    setLoading(false)
  }

  async function buscarEquipos(q: string) {
    if (q.length < 2) { setEquiposBusqueda([]); return }
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ mensajes:[{rol:'user',contenido:`buscar equipo ${q}`}] })
    })
    // Buscar directamente en supabase via API
    const res2 = await fetch(`/api/equipos-search?q=${encodeURIComponent(q)}`)
    if (res2.ok) {
      const data = await res2.json()
      setEquiposBusqueda(data.equipos || [])
    }
  }

  useEffect(() => { cargarRepuestos() }, [])

  async function crearRepuesto() {
    const res = await fetch('/api/repuestos', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accion:'crear', repuesto: { ...formCrear, stock_actual: Number(formCrear.stock_actual), stock_minimo: Number(formCrear.stock_minimo), costo_unitario: formCrear.costo_unitario ? Number(formCrear.costo_unitario) : null } })
    })
    const data = await res.json()
    if (data.error) { setAlerta(data.error); return }
    setModal(null)
    setFormCrear({ nombre:'', referencia:'', marca:'', descripcion:'', stock_actual:0, stock_minimo:2, unidad:'unidad', costo_unitario:'', proveedor:'' })
    cargarRepuestos()
    setAlerta('✓ Repuesto creado correctamente')
    setTimeout(()=>setAlerta(null), 3000)
  }

  async function asignarRepuesto() {
    if (!repSeleccionado || !formAsignar.equipo_id) return
    const res = await fetch('/api/repuestos', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accion:'asignar', repuesto_id: repSeleccionado.id, equipo_id: formAsignar.equipo_id, cantidad: Number(formAsignar.cantidad), orden_trabajo: formAsignar.orden_trabajo })
    })
    const data = await res.json()
    if (data.error) { setAlerta('⚠ ' + data.error); return }
    setModal(null)
    cargarRepuestos()
    const msg = data.alerta
      ? `✓ Repuesto asignado. ⚠ Stock bajo: ${data.stock_nuevo} unidades restantes`
      : `✓ Repuesto asignado. Stock: ${data.stock_nuevo} unidades`
    setAlerta(msg)
    setTimeout(()=>setAlerta(null), 5000)
  }

  async function registrarEntrada() {
    if (!repSeleccionado) return
    const res = await fetch('/api/repuestos', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accion:'entrada', repuesto_id: repSeleccionado.id, cantidad: Number(formEntrada.cantidad), motivo: formEntrada.motivo })
    })
    const data = await res.json()
    if (data.error) { setAlerta(data.error); return }
    setModal(null)
    cargarRepuestos()
    setAlerta(`✓ Entrada registrada. Stock: ${data.stock_nuevo} unidades`)
    setTimeout(()=>setAlerta(null), 3000)
  }

  async function verHistorial(rep: any) {
    setRepSeleccionado(rep)
    const res = await fetch('/api/repuestos', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accion:'movimientos', repuesto_id: rep.id })
    })
    const data = await res.json()
    setMovimientos(data.movimientos || [])
    setModal('historial')
  }

  const filtrados = repuestos.filter(r =>
    !search || r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.referencia?.toLowerCase().includes(search.toLowerCase()) ||
    r.marca?.toLowerCase().includes(search.toLowerCase())
  )

  const bajoStock = repuestos.filter(r => r.stock_actual <= r.stock_minimo)
  const sinStock  = repuestos.filter(r => r.stock_actual === 0)

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{borderBottom:'1px solid #1e2d3d', background:'#0a1120'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{color:'#3d5166'}}>BioMed AI</span>
            <span style={{color:'#1e2d3d'}}>/</span>
            <span className="text-xs font-medium" style={{color:'#2dd4bf'}}>Repuestos</span>
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>Gestión de Repuestos</h1>
        </div>
        <button onClick={()=>setModal('crear')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{background:'#0d9488', color:'#fff'}}>
          <Plus className="w-4 h-4"/> Nuevo repuesto
        </button>
      </div>

      {/* Alerta */}
      {alerta && (
        <div className="mx-8 mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: alerta.includes('⚠')?'#f59e0b15':'#0d948815',
            border: `1px solid ${alerta.includes('⚠')?'#f59e0b40':'#0d948840'}`,
            color: alerta.includes('⚠')?'#fcd34d':'#2dd4bf'
          }}>
          {alerta.includes('✓') ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
          {alerta}
        </div>
      )}

      <div className="flex-1 px-8 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {label:'Total repuestos',  value:repuestos.length,  color:'#e2e8f0'},
            {label:'Stock bajo',       value:bajoStock.length,  color:'#fcd34d'},
            {label:'Sin stock',        value:sinStock.length,   color:'#f87171'},
            {label:'En buen estado',   value:repuestos.filter(r=>r.stock_actual>r.stock_minimo).length, color:'#4ade80'},
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
              {loading
                ? <div className="h-8 w-12 rounded animate-pulse mb-1" style={{background:'#1e2d3d'}}/>
                : <div className="text-3xl font-bold mb-1" style={{color:s.color}}>{s.value}</div>
              }
              <div className="text-xs" style={{color:'#3d5166'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alertas stock bajo */}
        {bajoStock.length > 0 && (
          <div className="rounded-xl p-4" style={{background:'#f59e0b10', border:'1px solid #f59e0b30'}}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" style={{color:'#fcd34d'}}/>
              <span className="text-xs font-bold" style={{color:'#fcd34d'}}>
                ⚠ {bajoStock.length} repuesto(s) con stock bajo o agotado
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {bajoStock.map(r => (
                <span key={r.id} className="text-xs px-2.5 py-1 rounded-lg"
                  style={{
                    background: r.stock_actual===0?'#ef444420':'#f59e0b20',
                    color: r.stock_actual===0?'#f87171':'#fcd34d',
                    border: `1px solid ${r.stock_actual===0?'#ef444430':'#f59e0b30'}`
                  }}>
                  {r.nombre} — {r.stock_actual===0?'SIN STOCK':`${r.stock_actual} uds`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#3d5166'}}/>
          <input type="text" placeholder="Buscar repuesto, referencia, marca..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{background:'#0d1626', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
          />
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
          <table className="w-full">
            <thead>
              <tr style={{background:'#0d1626', borderBottom:'1px solid #1e2d3d'}}>
                {['Repuesto','Referencia','Marca','Stock actual','Stock mín.','Costo unit.','Estado','Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{color:'#3d5166'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i} style={{borderBottom:'1px solid #1e2d3d'}}>
                    {Array.from({length:8}).map((_,j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{background:'#1e2d3d', width:j===0?'140px':'60px'}}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{color:'#3d5166'}}>
                    <Package className="w-8 h-8 mx-auto mb-3 opacity-30"/>
                    <p>No hay repuestos registrados. Crea el primero.</p>
                  </td>
                </tr>
              ) : filtrados.map((r, i) => {
                const stockOk = r.stock_actual > r.stock_minimo
                const stockBajo = r.stock_actual > 0 && r.stock_actual <= r.stock_minimo
                const sinStk = r.stock_actual === 0
                const statusColor = sinStk?'#f87171':stockBajo?'#fcd34d':'#4ade80'
                const statusLabel = sinStk?'Sin stock':stockBajo?'Stock bajo':'Ok'
                return (
                  <tr key={r.id} style={{background:i%2===0?'#080e16':'#0a1120', borderBottom:'1px solid #1e2d3d'}}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{r.nombre}</div>
                      {r.descripcion && <div className="text-xs" style={{color:'#3d5166'}}>{r.descripcion.substring(0,40)}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{color:'#4a6580'}}>{r.referencia||'—'}</td>
                    <td className="px-4 py-3 text-sm" style={{color:'#7a9bb5'}}>{r.marca||'—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold" style={{color:statusColor}}>{r.stock_actual}</span>
                      <span className="text-xs ml-1" style={{color:'#3d5166'}}>{r.unidad}</span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{color:'#3d5166'}}>{r.stock_minimo} {r.unidad}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{color:'#4ade80'}}>
                      {r.costo_unitario ? `$${Number(r.costo_unitario).toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background:`${statusColor}15`,
                          color: statusColor,
                          border:`1px solid ${statusColor}30`
                        }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={()=>{setRepSeleccionado(r);setFormAsignar({equipo_id:'',equipo_nombre:'',cantidad:1,orden_trabajo:''});setBusqEquipo('');setEquiposBusqueda([]);setModal('asignar')}}
                          className="px-2.5 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{background:'#0d948820',color:'#2dd4bf',border:'1px solid #0d948830'}}>
                          Asignar
                        </button>
                        <button onClick={()=>{setRepSeleccionado(r);setFormEntrada({cantidad:1,motivo:''});setModal('entrada')}}
                          className="px-2.5 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{background:'#16a34a20',color:'#4ade80',border:'1px solid #16a34a30'}}>
                          Entrada
                        </button>
                        <button onClick={()=>verHistorial(r)}
                          className="px-2.5 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
                          <History className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CREAR ── */}
      {modal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid #1e2d3d'}}>
              <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Nuevo repuesto</h2>
              <button onClick={()=>setModal(null)}><X className="w-5 h-5" style={{color:'#3d5166'}}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {key:'nombre', label:'Nombre *', placeholder:'Ej: Batería de desfibrilador'},
                  {key:'referencia', label:'Referencia', placeholder:'Ej: REF-001'},
                  {key:'marca', label:'Marca', placeholder:'Ej: Zoll'},
                  {key:'proveedor', label:'Proveedor', placeholder:'Ej: Meditech S.A.'},
                ].map(f => (
                  <div key={f.key}>
                    <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>{f.label}</div>
                    <input type="text" placeholder={f.placeholder}
                      value={(formCrear as any)[f.key]}
                      onChange={e=>setFormCrear(prev=>({...prev,[f.key]:e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                      style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Descripción</div>
                <input type="text" placeholder="Descripción del repuesto..."
                  value={formCrear.descripcion}
                  onChange={e=>setFormCrear(prev=>({...prev,descripcion:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {key:'stock_actual', label:'Stock inicial', type:'number'},
                  {key:'stock_minimo', label:'Stock mínimo', type:'number'},
                  {key:'costo_unitario', label:'Costo unit. COP', type:'number'},
                ].map(f => (
                  <div key={f.key}>
                    <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>{f.label}</div>
                    <input type={f.type}
                      value={(formCrear as any)[f.key]}
                      onChange={e=>setFormCrear(prev=>({...prev,[f.key]:e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                      style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={()=>setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                Cancelar
              </button>
              <button onClick={crearRepuesto} disabled={!formCrear.nombre}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{background:formCrear.nombre?'#0d9488':'#1e2d3d', color:formCrear.nombre?'#fff':'#3d5166'}}>
                Crear repuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ASIGNAR ── */}
      {modal === 'asignar' && repSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid #1e2d3d'}}>
              <div>
                <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Asignar repuesto</h2>
                <p className="text-xs mt-0.5" style={{color:'#3d5166'}}>{repSeleccionado.nombre} · Stock: {repSeleccionado.stock_actual} {repSeleccionado.unidad}</p>
              </div>
              <button onClick={()=>setModal(null)}><X className="w-5 h-5" style={{color:'#3d5166'}}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Buscar equipo */}
              <div>
                <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Equipo destino *</div>
                <input type="text" placeholder="Buscar equipo por nombre o código..."
                  value={busqEquipo}
                  onChange={async e => { setBusqEquipo(e.target.value); await buscarEquipos(e.target.value) }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                />
                {formAsignar.equipo_nombre && (
                  <div className="mt-1.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                    style={{background:'#0d948815', color:'#2dd4bf', border:'1px solid #0d948830'}}>
                    <CheckCircle className="w-3.5 h-3.5"/>
                    Seleccionado: {formAsignar.equipo_nombre}
                  </div>
                )}
                {equiposBusqueda.length > 0 && !formAsignar.equipo_id && (
                  <div className="mt-1 rounded-lg overflow-hidden" style={{border:'1px solid #1e2d3d'}}>
                    {equiposBusqueda.slice(0,5).map(eq => (
                      <button key={eq.id}
                        onClick={()=>{setFormAsignar(prev=>({...prev,equipo_id:eq.id,equipo_nombre:`${eq.nombre} (${eq.codigo_inventario})`}));setEquiposBusqueda([])}}
                        className="w-full px-3 py-2.5 text-left text-xs transition-all hover:bg-slate-700"
                        style={{background:'#111827', color:'#e2e8f0', borderBottom:'1px solid #1e2d3d'}}>
                        <div className="font-semibold">{eq.nombre}</div>
                        <div style={{color:'#3d5166'}}>{eq.codigo_inventario} · {eq.servicio}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Cantidad *</div>
                  <input type="number" min={1} max={repSeleccionado.stock_actual}
                    value={formAsignar.cantidad}
                    onChange={e=>setFormAsignar(prev=>({...prev,cantidad:Number(e.target.value)}))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Orden de trabajo</div>
                  <input type="text" placeholder="Ej: OT-05-001"
                    value={formAsignar.orden_trabajo}
                    onChange={e=>setFormAsignar(prev=>({...prev,orden_trabajo:e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                    style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                  />
                </div>
              </div>

              {/* Preview stock */}
              <div className="rounded-lg p-3" style={{background:'#111827'}}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{color:'#3d5166'}}>Stock actual</span>
                  <span className="font-bold" style={{color:'#e2e8f0'}}>{repSeleccionado.stock_actual} {repSeleccionado.unidad}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{color:'#3d5166'}}>A descontar</span>
                  <span className="font-bold" style={{color:'#f87171'}}>-{formAsignar.cantidad} {repSeleccionado.unidad}</span>
                </div>
                <div className="flex justify-between text-xs pt-2" style={{borderTop:'1px solid #1e2d3d'}}>
                  <span style={{color:'#3d5166'}}>Stock resultante</span>
                  <span className="font-bold" style={{
                    color: (repSeleccionado.stock_actual - formAsignar.cantidad) <= repSeleccionado.stock_minimo ? '#fcd34d' : '#4ade80'
                  }}>
                    {repSeleccionado.stock_actual - formAsignar.cantidad} {repSeleccionado.unidad}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={()=>setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                Cancelar
              </button>
              <button onClick={asignarRepuesto}
                disabled={!formAsignar.equipo_id || formAsignar.cantidad < 1}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: formAsignar.equipo_id?'#0d9488':'#1e2d3d',
                  color: formAsignar.equipo_id?'#fff':'#3d5166'
                }}>
                Confirmar asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ENTRADA ── */}
      {modal === 'entrada' && repSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid #1e2d3d'}}>
              <div>
                <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Entrada de stock</h2>
                <p className="text-xs mt-0.5" style={{color:'#3d5166'}}>{repSeleccionado.nombre}</p>
              </div>
              <button onClick={()=>setModal(null)}><X className="w-5 h-5" style={{color:'#3d5166'}}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Cantidad a ingresar *</div>
                <input type="number" min={1}
                  value={formEntrada.cantidad}
                  onChange={e=>setFormEntrada(prev=>({...prev,cantidad:Number(e.target.value)}))}
                  className="w-full px-3 py-3 rounded-lg text-2xl font-bold text-center focus:outline-none"
                  style={{background:'#111827', border:'1px solid #1e2d3d', color:'#4ade80'}}
                />
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{color:'#3d5166'}}>Motivo</div>
                <input type="text" placeholder="Ej: Compra a proveedor, donación..."
                  value={formEntrada.motivo}
                  onChange={e=>setFormEntrada(prev=>({...prev,motivo:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{background:'#111827', border:'1px solid #1e2d3d', color:'#e2e8f0'}}
                />
              </div>
              <div className="rounded-lg p-3" style={{background:'#111827'}}>
                <div className="flex justify-between text-xs">
                  <span style={{color:'#3d5166'}}>Stock actual</span>
                  <span className="font-bold" style={{color:'#e2e8f0'}}>{repSeleccionado.stock_actual}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{color:'#3d5166'}}>Stock resultante</span>
                  <span className="font-bold" style={{color:'#4ade80'}}>{repSeleccionado.stock_actual + formEntrada.cantidad}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={()=>setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                Cancelar
              </button>
              <button onClick={registrarEntrada}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{background:'#16a34a', color:'#fff'}}>
                <ArrowUp className="w-4 h-4 inline mr-1"/>
                Registrar entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HISTORIAL ── */}
      {modal === 'historial' && repSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{background:'#0d1626', border:'1px solid #1e2d3d'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid #1e2d3d'}}>
              <div>
                <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Historial de movimientos</h2>
                <p className="text-xs mt-0.5" style={{color:'#3d5166'}}>{repSeleccionado.nombre} · Stock actual: {repSeleccionado.stock_actual}</p>
              </div>
              <button onClick={()=>setModal(null)}><X className="w-5 h-5" style={{color:'#3d5166'}}/></button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {movimientos.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{color:'#3d5166'}}>Sin movimientos registrados</div>
              ) : (
                <div className="divide-y" style={{borderColor:'#1e2d3d'}}>
                  {movimientos.map((m, i) => {
                    const fecha = new Date(m.created_at).toLocaleDateString('es-CO', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
                    const esEntrada = m.tipo === 'entrada'
                    return (
                      <div key={i} className="px-6 py-4 flex items-start gap-4"
                        style={{background:i%2===0?'#080e16':'#0a1120'}}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{background:esEntrada?'#16a34a20':'#ef444420'}}>
                          {esEntrada
                            ? <ArrowUp className="w-4 h-4" style={{color:'#4ade80'}}/>
                            : <ArrowDown className="w-4 h-4" style={{color:'#f87171'}}/>
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold capitalize" style={{color:esEntrada?'#4ade80':'#f87171'}}>
                              {m.tipo}
                            </span>
                            <span className="text-xs" style={{color:'#3d5166'}}>{fecha}</span>
                          </div>
                          {m.equipos && (
                            <div className="text-xs mb-0.5" style={{color:'#e2e8f0'}}>
                              Equipo: {m.equipos.nombre} ({m.equipos.codigo_inventario})
                            </div>
                          )}
                          {m.motivo && <div className="text-xs" style={{color:'#7a9bb5'}}>{m.motivo}</div>}
                          {m.orden_trabajo && <div className="text-xs" style={{color:'#2dd4bf'}}>OT: {m.orden_trabajo}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{color:esEntrada?'#4ade80':'#f87171'}}>
                            {esEntrada?'+':'-'}{m.cantidad}
                          </div>
                          <div className="text-xs" style={{color:'#3d5166'}}>
                            {m.stock_anterior} → {m.stock_nuevo}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-4" style={{borderTop:'1px solid #1e2d3d'}}>
              <button onClick={()=>setModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{background:'#1e2d3d', color:'#7a9bb5', border:'1px solid #253447'}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
