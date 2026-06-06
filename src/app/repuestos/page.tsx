import ExportarXLS from '@/components/ui/ExportarXLS'
'use client'
import { useState, useEffect } from 'react'

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'crear'|'asignar'|'entrada'|'historial'|null>(null)
  const [repSel, setRepSel] = useState<any>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [alerta, setAlerta] = useState<{msg:string;tipo:'ok'|'error'}|null>(null)
  const [equiposBusq, setEquiposBusq] = useState<any[]>([])
  const [formCrear, setFormCrear] = useState({nombre:'',referencia:'',marca:'',descripcion:'',stock_actual:0,stock_minimo:2,unidad:'unidad',costo_unitario:'',proveedor:''})
  const [formAsignar, setFormAsignar] = useState({equipo_id:'',equipo_nombre:'',cantidad:1,orden_trabajo:''})
  const [formEntrada, setFormEntrada] = useState({cantidad:1,motivo:''})
  const [busqEquipo, setBusqEquipo] = useState('')

  async function cargar() {
    const r = await fetch('/api/repuestos')
    const d = await r.json()
    setRepuestos(d.repuestos||[])
    setLoading(false)
  }

  useEffect(()=>{ cargar() },[])

  async function buscarEquipos(q:string) {
    if(q.length<2){setEquiposBusq([]);return}
    const r = await fetch(`/api/equipos-search?q=${encodeURIComponent(q)}`)
    const d = await r.json()
    setEquiposBusq(d.equipos||[])
  }

  async function crearRepuesto() {
    const r = await fetch('/api/repuestos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear',repuesto:{...formCrear,stock_actual:Number(formCrear.stock_actual),stock_minimo:Number(formCrear.stock_minimo),costo_unitario:formCrear.costo_unitario?Number(formCrear.costo_unitario):null}})})
    const d = await r.json()
    if(d.error){setAlerta({msg:d.error,tipo:'error'});return}
    setModal(null)
    cargar()
    setAlerta({msg:'Repuesto creado correctamente',tipo:'ok'})
    setTimeout(()=>setAlerta(null),3000)
  }

  async function asignar() {
    if(!repSel||!formAsignar.equipo_id) return
    const r = await fetch('/api/repuestos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'asignar',repuesto_id:repSel.id,equipo_id:formAsignar.equipo_id,cantidad:Number(formAsignar.cantidad),orden_trabajo:formAsignar.orden_trabajo})})
    const d = await r.json()
    if(d.error){setAlerta({msg:d.error,tipo:'error'});return}
    setModal(null)
    cargar()
    setAlerta({msg:`Repuesto asignado. Stock restante: ${d.stock_nuevo}${d.alerta?' ⚠ Stock bajo':''}`,tipo:d.alerta?'error':'ok'})
    setTimeout(()=>setAlerta(null),4000)
  }

  async function entrada() {
    if(!repSel) return
    const r = await fetch('/api/repuestos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'entrada',repuesto_id:repSel.id,cantidad:Number(formEntrada.cantidad),motivo:formEntrada.motivo})})
    const d = await r.json()
    if(d.error){setAlerta({msg:d.error,tipo:'error'});return}
    setModal(null)
    cargar()
    setAlerta({msg:`Entrada registrada. Stock: ${d.stock_nuevo}`,tipo:'ok'})
    setTimeout(()=>setAlerta(null),3000)
  }

  async function verHistorial(rep:any) {
    setRepSel(rep)
    const r = await fetch('/api/repuestos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'movimientos',repuesto_id:rep.id})})
    const d = await r.json()
    setMovimientos(d.movimientos||[])
    setModal('historial')
  }

  const filtrados = repuestos.filter(r=>!search||r.nombre?.toLowerCase().includes(search.toLowerCase())||r.referencia?.toLowerCase().includes(search.toLowerCase())||r.marca?.toLowerCase().includes(search.toLowerCase()))
  const bajoStock = repuestos.filter(r=>r.stock_actual<=r.stock_minimo)
  const fmtCOP = (n:number) => `$${Math.round(n).toLocaleString('es-CO')}`

  const Modal = ({children,title,onClose}:any) => (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',width:'100%',maxWidth:480,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E4E4E7',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:14,fontWeight:600,color:'#18181B'}}>{title}</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20,overflowY:'auto'}}>{children}</div>
      </div>
    </div>
  )

  const Field = ({label,children}:any) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:500,color:'#52525B',marginBottom:4}}>{label}</div>
      {children}
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Repuestos</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>Gestión de repuestos</h1>
        </div>
        <button onClick={()=>setModal('crear')} style={{display:'flex',alignItems:'center',gap:6,background:'#3B4FE8',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:500,cursor:'pointer'}}>
          <i className="ti ti-plus" style={{fontSize:15}}/> Nuevo repuesto
        </button>
      </div>

      <div style={{padding:'20px 28px',display:'flex',flexDirection:'column',gap:16,flex:1}}>

        {alerta && (
          <div style={{padding:'10px 16px',borderRadius:8,fontSize:13,background:alerta.tipo==='ok'?'#F0FDF4':'#FEF2F2',color:alerta.tipo==='ok'?'#16A34A':'#DC2626',border:`0.5px solid ${alerta.tipo==='ok'?'#BBF7D0':'#FECACA'}`}}>
            {alerta.msg}
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {l:'Total repuestos', v:repuestos.length,                                       c:'#3B4FE8'},
            {l:'Stock bajo',      v:bajoStock.length,                                        c:'#D97706'},
            {l:'Sin stock',       v:repuestos.filter(r=>r.stock_actual===0).length,          c:'#DC2626'},
            {l:'En buen estado',  v:repuestos.filter(r=>r.stock_actual>r.stock_minimo).length,c:'#16A34A'},
          ].map(s=>(
            <div key={s.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'16px 20px'}}>
              <div style={{fontSize:11,color:'#A1A1AA',marginBottom:6}}>{s.l}</div>
              {loading?<div style={{height:26,width:48,background:'#F4F4F5',borderRadius:4}}/>:
                <div style={{fontSize:24,fontWeight:600,color:s.c}}>{s.v}</div>}
            </div>
          ))}
        </div>

        {bajoStock.length>0&&(
          <div style={{padding:'12px 16px',borderRadius:8,background:'#FFFBEB',border:'0.5px solid #FDE68A'}}>
            <div style={{fontSize:12,fontWeight:500,color:'#D97706',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
              <i className="ti ti-alert-triangle" style={{fontSize:14}}/> {bajoStock.length} repuesto(s) con stock bajo o agotado
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {bajoStock.map(r=>(
                <span key={r.id} style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:r.stock_actual===0?'#FEF2F2':'#FFFBEB',color:r.stock_actual===0?'#DC2626':'#D97706',border:`0.5px solid ${r.stock_actual===0?'#FECACA':'#FDE68A'}`}}>
                  {r.nombre} — {r.stock_actual===0?'SIN STOCK':`${r.stock_actual} uds`}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{position:'relative',flex:1,maxWidth:320}}>
            <i className="ti ti-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:14}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar repuesto, referencia, marca..." style={{paddingLeft:32,width:'100%',height:36}}/>
          </div>
          <span style={{fontSize:12,color:'#A1A1AA',marginLeft:'auto'}}>{filtrados.length} repuestos</span>
        </div>

        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
          <table>
            <thead>
              <tr>
                {['Repuesto','Referencia','Marca','Stock actual','Stock mín.','Costo unit.','Estado','Acciones'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?Array.from({length:6}).map((_,i)=>(
                <tr key={i}>{Array.from({length:8}).map((_,j)=>(
                  <td key={j}><div style={{height:14,background:'#F4F4F5',borderRadius:3,width:j===0?120:j===7?80:60}}/></td>
                ))}</tr>
              )):filtrados.length===0?(
                <tr><td colSpan={8} style={{textAlign:'center',padding:'40px',color:'#A1A1AA'}}>
                  <i className="ti ti-package" style={{fontSize:32,display:'block',marginBottom:8}}/>
                  No hay repuestos. Crea el primero.
                </td></tr>
              ):filtrados.map((r,i)=>{
                const sinStk=r.stock_actual===0
                const bajo=r.stock_actual>0&&r.stock_actual<=r.stock_minimo
                const sc=sinStk?{bg:'#FEF2F2',text:'#DC2626',l:'Sin stock'}:bajo?{bg:'#FFFBEB',text:'#D97706',l:'Stock bajo'}:{bg:'#F0FDF4',text:'#16A34A',l:'Ok'}
                return (
                  <tr key={r.id}>
                    <td><div style={{fontWeight:500,color:'#18181B',fontSize:13}}>{r.nombre}</div>{r.descripcion&&<div style={{fontSize:11,color:'#A1A1AA'}}>{r.descripcion.substring(0,40)}</div>}</td>
                    <td style={{fontFamily:'monospace',fontSize:12,color:'#71717A'}}>{r.referencia||'—'}</td>
                    <td style={{fontSize:12,color:'#71717A'}}>{r.marca||'—'}</td>
                    <td><span style={{fontSize:18,fontWeight:600,color:sc.text}}>{r.stock_actual}</span><span style={{fontSize:11,color:'#A1A1AA',marginLeft:4}}>{r.unidad}</span></td>
                    <td style={{fontSize:12,color:'#A1A1AA'}}>{r.stock_minimo} {r.unidad}</td>
                    <td style={{fontSize:12,color:'#3B4FE8',fontWeight:500}}>{r.costo_unitario?fmtCOP(Number(r.costo_unitario)):'—'}</td>
                    <td><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:sc.bg,color:sc.text}}>{sc.l}</span></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {[
                          {l:'Asignar',c:'#3B4FE8',bg:'#EEF2FF',fn:()=>{setRepSel(r);setFormAsignar({equipo_id:'',equipo_nombre:'',cantidad:1,orden_trabajo:''});setBusqEquipo('');setEquiposBusq([]);setModal('asignar')}},
                          {l:'Entrada',c:'#16A34A',bg:'#F0FDF4',fn:()=>{setRepSel(r);setFormEntrada({cantidad:1,motivo:''});setModal('entrada')}},
                          {l:'Historial',c:'#71717A',bg:'#F4F4F5',fn:()=>verHistorial(r)},
                        ].map(b=>(
                          <button key={b.l} onClick={b.fn} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:500,cursor:'pointer',border:'none',background:b.bg,color:b.c}}>{b.l}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='crear'&&(
        <Modal title="Nuevo repuesto" onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[{k:'nombre',l:'Nombre *',p:'Ej: Batería de desfibrilador'},{k:'referencia',l:'Referencia',p:'Ej: REF-001'},{k:'marca',l:'Marca',p:'Ej: Zoll'},{k:'proveedor',l:'Proveedor',p:'Ej: Meditech S.A.'}].map(f=>(
              <Field key={f.k} label={f.l}>
                <input type="text" placeholder={f.p} value={(formCrear as any)[f.k]} onChange={e=>setFormCrear(p=>({...p,[f.k]:e.target.value}))} style={{width:'100%'}}/>
              </Field>
            ))}
          </div>
          <Field label="Descripción">
            <input type="text" placeholder="Descripción del repuesto..." value={formCrear.descripcion} onChange={e=>setFormCrear(p=>({...p,descripcion:e.target.value}))} style={{width:'100%'}}/>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            {[{k:'stock_actual',l:'Stock inicial',t:'number'},{k:'stock_minimo',l:'Stock mínimo',t:'number'},{k:'costo_unitario',l:'Costo COP',t:'number'}].map(f=>(
              <Field key={f.k} label={f.l}>
                <input type={f.t} value={(formCrear as any)[f.k]} onChange={e=>setFormCrear(p=>({...p,[f.k]:e.target.value}))} style={{width:'100%'}}/>
              </Field>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={crearRepuesto} disabled={!formCrear.nombre} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:formCrear.nombre?'#3B4FE8':'#F4F4F5',color:formCrear.nombre?'#fff':'#A1A1AA',cursor:'pointer',fontSize:13,fontWeight:500}}>Crear repuesto</button>
          </div>
        </Modal>
      )}

      {modal==='asignar'&&repSel&&(
        <Modal title={`Asignar — ${repSel.nombre}`} onClose={()=>setModal(null)}>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',marginBottom:16,fontSize:12,color:'#52525B'}}>
            Stock disponible: <strong style={{color:'#18181B'}}>{repSel.stock_actual} {repSel.unidad}</strong>
          </div>
          <Field label="Equipo destino *">
            <input type="text" placeholder="Buscar equipo por nombre o código..." value={busqEquipo}
              onChange={async e=>{setBusqEquipo(e.target.value);setFormAsignar(p=>({...p,equipo_id:'',equipo_nombre:''}));await buscarEquipos(e.target.value)}}
              style={{width:'100%'}}/>
            {formAsignar.equipo_nombre&&<div style={{marginTop:6,padding:'6px 10px',borderRadius:6,background:'#EEF2FF',fontSize:12,color:'#3B4FE8'}}>✓ {formAsignar.equipo_nombre}</div>}
            {equiposBusq.length>0&&!formAsignar.equipo_id&&(
              <div style={{border:'0.5px solid #E4E4E7',borderRadius:8,overflow:'hidden',marginTop:4}}>
                {equiposBusq.slice(0,5).map(eq=>(
                  <div key={eq.id} onClick={()=>{setFormAsignar(p=>({...p,equipo_id:eq.id,equipo_nombre:`${eq.nombre} (${eq.codigo_inventario})`}));setEquiposBusq([])}}
                    style={{padding:'8px 12px',cursor:'pointer',borderBottom:'0.5px solid #F4F4F5',fontSize:12,color:'#18181B'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#F8F9FA'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <div style={{fontWeight:500}}>{eq.nombre}</div>
                    <div style={{color:'#A1A1AA',fontSize:11}}>{eq.codigo_inventario} · {eq.servicio}</div>
                  </div>
                ))}
              </div>
            )}
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Cantidad *">
              <input type="number" min={1} max={repSel.stock_actual} value={formAsignar.cantidad} onChange={e=>setFormAsignar(p=>({...p,cantidad:Number(e.target.value)}))} style={{width:'100%'}}/>
            </Field>
            <Field label="Orden de trabajo">
              <input type="text" placeholder="Ej: OT-05-001" value={formAsignar.orden_trabajo} onChange={e=>setFormAsignar(p=>({...p,orden_trabajo:e.target.value}))} style={{width:'100%'}}/>
            </Field>
          </div>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',marginBottom:16,fontSize:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#71717A'}}>Stock actual</span><span style={{fontWeight:500}}>{repSel.stock_actual}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#71717A'}}>A descontar</span><span style={{color:'#DC2626',fontWeight:500}}>-{formAsignar.cantidad}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:6,borderTop:'0.5px solid #E4E4E7'}}><span style={{color:'#71717A'}}>Stock resultante</span><span style={{fontWeight:600,color:(repSel.stock_actual-formAsignar.cantidad)<=repSel.stock_minimo?'#D97706':'#16A34A'}}>{repSel.stock_actual-formAsignar.cantidad}</span></div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={asignar} disabled={!formAsignar.equipo_id} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:formAsignar.equipo_id?'#3B4FE8':'#F4F4F5',color:formAsignar.equipo_id?'#fff':'#A1A1AA',cursor:'pointer',fontSize:13,fontWeight:500}}>Confirmar asignación</button>
          </div>
        </Modal>
      )}

      {modal==='entrada'&&repSel&&(
        <Modal title={`Entrada de stock — ${repSel.nombre}`} onClose={()=>setModal(null)}>
          <Field label="Cantidad a ingresar *">
            <input type="number" min={1} value={formEntrada.cantidad} onChange={e=>setFormEntrada(p=>({...p,cantidad:Number(e.target.value)}))} style={{width:'100%',fontSize:24,fontWeight:600,textAlign:'center'}}/>
          </Field>
          <Field label="Motivo">
            <input type="text" placeholder="Ej: Compra a proveedor..." value={formEntrada.motivo} onChange={e=>setFormEntrada(p=>({...p,motivo:e.target.value}))} style={{width:'100%'}}/>
          </Field>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',marginBottom:16,fontSize:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#71717A'}}>Stock actual</span><span style={{fontWeight:500}}>{repSel.stock_actual}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:6,borderTop:'0.5px solid #E4E4E7'}}><span style={{color:'#71717A'}}>Stock resultante</span><span style={{fontWeight:600,color:'#16A34A'}}>{repSel.stock_actual+formEntrada.cantidad}</span></div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={entrada} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:'#16A34A',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:500}}>Registrar entrada</button>
          </div>
        </Modal>
      )}

      {modal==='historial'&&repSel&&(
        <Modal title={`Historial — ${repSel.nombre}`} onClose={()=>setModal(null)}>
          {movimientos.length===0?(
            <div style={{textAlign:'center',padding:'32px',color:'#A1A1AA'}}>
              <i className="ti ti-history" style={{fontSize:32,display:'block',marginBottom:8}}/>
              Sin movimientos registrados
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {movimientos.map((m,i)=>{
                const esEntrada=m.tipo==='entrada'
                const fecha=new Date(m.created_at).toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
                return (
                  <div key={i} style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',border:'0.5px solid #E4E4E7',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:esEntrada?'#F0FDF4':'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <i className={'ti ' + (esEntrada?'ti-arrow-up':'ti-arrow-down')} style={{fontSize:14,color:esEntrada?'#16A34A':'#DC2626'}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500,color:'#18181B',textTransform:'capitalize'}}>{m.tipo}</div>
                      {m.equipos&&<div style={{fontSize:11,color:'#71717A'}}>{m.equipos.nombre}</div>}
                      {m.motivo&&<div style={{fontSize:11,color:'#A1A1AA'}}>{m.motivo}</div>}
                      <div style={{fontSize:11,color:'#A1A1AA'}}>{fecha}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:14,fontWeight:600,color:esEntrada?'#16A34A':'#DC2626'}}>{esEntrada?'+':'-'}{m.cantidad}</div>
                      <div style={{fontSize:11,color:'#A1A1AA'}}>{m.stock_anterior}→{m.stock_nuevo}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <button onClick={()=>setModal(null)} style={{width:'100%',marginTop:12,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cerrar</button>
        </Modal>
      )}

    </div>
  )
}
