'use client'
import { useState, useEffect } from 'react'

const MODULOS_DISPONIBLES = [
  { id:'dashboard',     label:'Dashboard',          icon:'ti-layout-dashboard' },
  { id:'inventario',    label:'Inventario',          icon:'ti-clipboard-list' },
  { id:'mantenimiento', label:'Mantenimiento',       icon:'ti-tool' },
  { id:'ordenes',       label:'Órdenes de trabajo',  icon:'ti-clipboard-check' },
  { id:'repuestos',     label:'Repuestos',           icon:'ti-package' },
  { id:'prediccion',    label:'Predicción IA',       icon:'ti-trending-up' },
  { id:'kpis',          label:'KPIs',                icon:'ti-chart-bar' },
  { id:'presupuesto',   label:'Presupuesto',         icon:'ti-currency-dollar' },
  { id:'auditoria',     label:'Auditoría',           icon:'ti-shield-check' },
  { id:'chat',          label:'Asistente IA',        icon:'ti-message' },
]

const ESTADO_STYLE: Record<string,{bg:string;text:string;label:string}> = {
  activo:     {bg:'#F0FDF4',text:'#16A34A',label:'Activo'},
  suspendido: {bg:'#FEF2F2',text:'#DC2626',label:'Suspendido'},
  trial:      {bg:'#EEF2FF',text:'#3B4FE8',label:'Trial'},
  vencido:    {bg:'#F4F4F5',text:'#71717A',label:'Vencido'},
}

const ROL_STYLE: Record<string,{bg:string;text:string}> = {
  super_admin: {bg:'#FDF4FF',text:'#7C3AED'},
  admin:       {bg:'#EEF2FF',text:'#3B4FE8'},
  supervisor:  {bg:'#FFFBEB',text:'#D97706'},
  tecnico:     {bg:'#F0FDF4',text:'#16A34A'},
}

export default function AdminPage() {
  const [tab, setTab] = useState<'instituciones'|'usuarios'|'planes'>('instituciones')
  const [instituciones, setInstituciones] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'inst'|'user'|'modulos'|'codigo'|null>(null)
  const [instSel, setInstSel] = useState<any>(null)
  const [alerta, setAlerta] = useState<{msg:string;tipo:'ok'|'error'}|null>(null)
  const [codigoGen, setCodigoGen] = useState('')

  const [formInst, setFormInst] = useState({nombre:'',nit:'',ciudad:'',tipo:'IPS',plan_id:'',fecha_vencimiento:'',modulos_activos:['dashboard','inventario','mantenimiento','ordenes','kpis']})
  const [formUser, setFormUser] = useState({nombre:'',email:'',rol:'tecnico',institucion_id:''})
  const [modulosSel, setModulosSel] = useState<string[]>([])
  const [estadoSel, setEstadoSel] = useState('activo')
  const [fechaVenc, setFechaVenc] = useState('')

  async function cargar() {
    setLoading(true)
    const [instRes, userRes, planRes, statRes] = await Promise.all([
      fetch('/api/admin?accion=instituciones').then(r=>r.json()),
      fetch('/api/admin?accion=usuarios').then(r=>r.json()),
      fetch('/api/admin?accion=planes').then(r=>r.json()),
      fetch('/api/admin?accion=stats').then(r=>r.json()),
    ])
    setInstituciones(instRes.instituciones||[])
    setUsuarios(userRes.usuarios||[])
    setPlanes(planRes.planes||[])
    setStats(statRes)
    setLoading(false)
  }

  useEffect(()=>{ cargar() },[])

  function mostrarAlerta(msg:string, tipo:'ok'|'error'='ok') {
    setAlerta({msg,tipo})
    setTimeout(()=>setAlerta(null),4000)
  }

  async function crearInstitucion() {
    const r = await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_institucion',...formInst,modulos_activos:JSON.stringify(formInst.modulos_activos)})})
    const d = await r.json()
    if(d.error){mostrarAlerta(d.error,'error');return}
    setCodigoGen(d.codigo)
    setModal('codigo')
    cargar()
    mostrarAlerta('Institución creada. Código generado.')
  }

  async function crearUsuario() {
    const r = await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_usuario',...formUser})})
    const d = await r.json()
    if(d.error){mostrarAlerta(d.error,'error');return}
    setModal(null)
    cargar()
    mostrarAlerta('Usuario creado correctamente.')
  }

  async function toggleInst(id:string) {
    const r = await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'toggle_institucion',id})})
    const d = await r.json()
    cargar()
    mostrarAlerta(`Institución ${d.plan_estado==='activo'?'activada':'suspendida'}`)
  }

  async function toggleUser(id:string) {
    await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'toggle_usuario',id})})
    cargar()
  }

  async function actualizarModulos() {
    await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'actualizar_modulos',id:instSel.id,modulos:modulosSel,estado:estadoSel,fecha_vencimiento:fechaVenc})})
    setModal(null)
    cargar()
    mostrarAlerta('Configuración actualizada')
  }

  async function regenerarCodigo(id:string) {
    const r = await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'regenerar_codigo',id})})
    const d = await r.json()
    setCodigoGen(d.codigo)
    setModal('codigo')
    cargar()
  }

  const Modal = ({title,onClose,children}:any) => (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',width:'100%',maxWidth:520,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E4E4E7',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:600,color:'#18181B'}}>{title}</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:22,lineHeight:1}}>×</button>
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

  const Sk = ({h=16,w='100%'}:any) => <div style={{height:h,width:w,background:'#F4F4F5',borderRadius:3}}/>

  return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,background:'#7C3AED',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-shield-check" style={{color:'#fff',fontSize:16}}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#18181B'}}>SYNAP — Panel Super Admin</div>
            <div style={{fontSize:10,color:'#A1A1AA'}}>Control de empresas, usuarios y licencias</div>
          </div>
        </div>
        <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:6,border:'0.5px solid #E4E4E7',color:'#52525B',textDecoration:'none',fontSize:12}}>
          <i className="ti ti-arrow-left" style={{fontSize:13}}/> Volver al sistema
        </a>
      </div>

      <div style={{padding:'24px 28px',maxWidth:1200,margin:'0 auto'}}>

        {/* Alerta */}
        {alerta&&(
          <div style={{padding:'10px 16px',borderRadius:8,marginBottom:16,fontSize:13,background:alerta.tipo==='ok'?'#F0FDF4':'#FEF2F2',color:alerta.tipo==='ok'?'#16A34A':'#DC2626',border:`0.5px solid ${alerta.tipo==='ok'?'#BBF7D0':'#FECACA'}`}}>
            {alerta.msg}
          </div>
        )}

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
          {loading?Array.from({length:5}).map((_,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'16px'}}><Sk h={24}/></div>
          )):[
            {l:'Instituciones',v:stats?.total_instituciones,c:'#7C3AED',icon:'ti-building-hospital'},
            {l:'Activas',       v:stats?.activas,            c:'#16A34A',icon:'ti-check'},
            {l:'Suspendidas',   v:stats?.suspendidas,        c:'#DC2626',icon:'ti-ban'},
            {l:'Trial',         v:stats?.trial,              c:'#3B4FE8',icon:'ti-clock'},
            {l:'Usuarios',      v:stats?.total_usuarios,     c:'#D97706',icon:'ti-users'},
          ].map(s=>(
            <div key={s.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:11,color:'#71717A'}}>{s.l}</span>
                <i className={'ti '+s.icon} style={{fontSize:16,color:s.c}}/>
              </div>
              <div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:1,borderBottom:'0.5px solid #E4E4E7',marginBottom:20}}>
          {[{id:'instituciones',l:'Instituciones',icon:'ti-building-hospital'},{id:'usuarios',l:'Usuarios',icon:'ti-users'},{id:'planes',l:'Planes',icon:'ti-credit-card'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',border:'none',borderBottom:`2px solid ${tab===t.id?'#7C3AED':'transparent'}`,background:'transparent',color:tab===t.id?'#7C3AED':'#71717A',fontSize:13,fontWeight:tab===t.id?500:400,cursor:'pointer'}}>
              <i className={'ti '+t.icon} style={{fontSize:14}}/>{t.l}
            </button>
          ))}
          <button onClick={()=>{ setFormInst({nombre:'',nit:'',ciudad:'',tipo:'IPS',plan_id:'',fecha_vencimiento:'',modulos_activos:['dashboard','inventario','mantenimiento','ordenes','kpis']}); setModal('inst') }} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,border:'none',background:'#7C3AED',color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer'}}>
            <i className="ti ti-plus" style={{fontSize:14}}/>
            {tab==='instituciones'?'Nueva institución':tab==='usuarios'?'Nuevo usuario':'Nuevo plan'}
          </button>
        </div>

        {/* INSTITUCIONES */}
        {tab==='instituciones'&&(
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#FAFAFA'}}>
                  {['Institución','NIT','Ciudad','Plan','Estado','Código','Módulos','Vencimiento','Acciones'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,color:'#71717A',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'0.5px solid #E4E4E7',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading?Array.from({length:4}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:9}).map((_,j)=>(
                    <td key={j} style={{padding:'12px 14px',borderBottom:'0.5px solid #F4F4F5'}}><Sk/></td>
                  ))}</tr>
                )):instituciones.map((inst,i)=>{
                  const es=ESTADO_STYLE[inst.plan_estado]||ESTADO_STYLE.vencido
                  const modulos=Array.isArray(inst.modulos_activos)?inst.modulos_activos:JSON.parse(inst.modulos_activos||'[]')
                  const venc=inst.fecha_vencimiento?new Date(inst.fecha_vencimiento).toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'numeric'}):'—'
                  return (
                    <tr key={inst.id} style={{borderBottom:'0.5px solid #F4F4F5'}}>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{fontWeight:500,color:'#18181B',fontSize:13}}>{inst.nombre}</div>
                        <div style={{fontSize:11,color:'#A1A1AA'}}>{inst.tipo}</div>
                      </td>
                      <td style={{padding:'12px 14px',fontFamily:'monospace',fontSize:12,color:'#71717A'}}>{inst.nit||'—'}</td>
                      <td style={{padding:'12px 14px',fontSize:12,color:'#71717A'}}>{inst.ciudad||'—'}</td>
                      <td style={{padding:'12px 14px',fontSize:12,color:'#52525B'}}>{inst.planes?.nombre||'—'}</td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:es.bg,color:es.text}}>{es.label}</span>
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontFamily:'monospace',fontSize:11,color:'#71717A',background:'#F8F9FA',padding:'2px 6px',borderRadius:4}}>{inst.codigo_activacion||'—'}</span>
                          <button onClick={()=>{ navigator.clipboard.writeText(inst.codigo_activacion||''); mostrarAlerta('Código copiado') }} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',padding:2}}>
                            <i className="ti ti-copy" style={{fontSize:13}}/>
                          </button>
                        </div>
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                          {modulos.slice(0,3).map((m:string)=>(
                            <span key={m} style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'#EEF2FF',color:'#3B4FE8',fontWeight:500}}>{m}</span>
                          ))}
                          {modulos.length>3&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'#F4F4F5',color:'#71717A'}}>+{modulos.length-3}</span>}
                        </div>
                      </td>
                      <td style={{padding:'12px 14px',fontSize:11,color:new Date(inst.fecha_vencimiento)<new Date()?'#DC2626':'#52525B'}}>{venc}</td>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>{ setInstSel(inst); setModulosSel(Array.isArray(inst.modulos_activos)?inst.modulos_activos:JSON.parse(inst.modulos_activos||'[]')); setEstadoSel(inst.plan_estado); setFechaVenc(inst.fecha_vencimiento?.split('T')[0]||''); setModal('modulos') }} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:11}}>
                            Configurar
                          </button>
                          <button onClick={()=>toggleInst(inst.id)} style={{padding:'4px 8px',borderRadius:6,border:'none',background:inst.plan_estado==='activo'?'#FEF2F2':'#F0FDF4',color:inst.plan_estado==='activo'?'#DC2626':'#16A34A',cursor:'pointer',fontSize:11,fontWeight:500}}>
                            {inst.plan_estado==='activo'?'Suspender':'Activar'}
                          </button>
                          <button onClick={()=>regenerarCodigo(inst.id)} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #E4E4E7',background:'#fff',color:'#71717A',cursor:'pointer',fontSize:11}}>
                            <i className="ti ti-refresh" style={{fontSize:12}}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* USUARIOS */}
        {tab==='usuarios'&&(
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#FAFAFA'}}>
                  {['Nombre','Email','Rol','Institución','Estado','Último acceso','Acciones'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,color:'#71717A',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'0.5px solid #E4E4E7'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading?Array.from({length:5}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:7}).map((_,j)=>(<td key={j} style={{padding:'12px 14px',borderBottom:'0.5px solid #F4F4F5'}}><Sk/></td>))}</tr>
                )):usuarios.map((u,i)=>{
                  const rs=ROL_STYLE[u.rol]||{bg:'#F4F4F5',text:'#71717A'}
                  const inst=instituciones.find(x=>x.id===u.institucion_id)
                  return (
                    <tr key={u.id} style={{borderBottom:'0.5px solid #F4F4F5'}}>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'#3B4FE8',flexShrink:0}}>
                            {u.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                          <div style={{fontWeight:500,color:'#18181B',fontSize:13}}>{u.nombre}</div>
                        </div>
                      </td>
                      <td style={{padding:'12px 14px',fontSize:12,color:'#71717A'}}>{u.email}</td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:rs.bg,color:rs.text,textTransform:'capitalize'}}>{u.rol.replace('_',' ')}</span>
                      </td>
                      <td style={{padding:'12px 14px',fontSize:12,color:'#52525B'}}>{inst?.nombre||'—'}</td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:u.activo?'#F0FDF4':'#FEF2F2',color:u.activo?'#16A34A':'#DC2626'}}>
                          {u.activo?'Activo':'Inactivo'}
                        </span>
                      </td>
                      <td style={{padding:'12px 14px',fontSize:11,color:'#A1A1AA'}}>{u.ultimo_acceso?new Date(u.ultimo_acceso).toLocaleDateString('es-CO'):'Nunca'}</td>
                      <td style={{padding:'12px 14px'}}>
                        <button onClick={()=>toggleUser(u.id)} style={{padding:'4px 10px',borderRadius:6,border:'none',background:u.activo?'#FEF2F2':'#F0FDF4',color:u.activo?'#DC2626':'#16A34A',cursor:'pointer',fontSize:11,fontWeight:500}}>
                          {u.activo?'Desactivar':'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PLANES */}
        {tab==='planes'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {loading?Array.from({length:3}).map((_,i)=><div key={i} style={{height:300,background:'#F8F9FA',borderRadius:12,border:'0.5px solid #E4E4E7'}}/>):
            planes.map((p,i)=>{
              const colores=['#3B4FE8','#7C3AED','#D97706']
              const c=colores[i%3]
              const modulos=Array.isArray(p.modulos)?p.modulos:JSON.parse(p.modulos||'[]')
              return (
                <div key={p.id} style={{background:'#fff',borderRadius:12,border:`0.5px solid ${c}30`,overflow:'hidden'}}>
                  <div style={{padding:'20px',borderBottom:'0.5px solid #F4F4F5',background:c+'08'}}>
                    <div style={{fontSize:16,fontWeight:700,color:c,marginBottom:4}}>{p.nombre}</div>
                    <div style={{fontSize:12,color:'#71717A',marginBottom:12}}>{p.descripcion}</div>
                    <div style={{fontSize:24,fontWeight:700,color:'#18181B'}}>
                      ${(p.precio_mensual/1000).toFixed(0)}K<span style={{fontSize:12,color:'#A1A1AA',fontWeight:400}}>/mes COP</span>
                    </div>
                    <div style={{fontSize:11,color:'#A1A1AA'}}>${(p.precio_anual/1000000).toFixed(1)}M/año</div>
                  </div>
                  <div style={{padding:'16px 20px'}}>
                    <div style={{display:'flex',gap:12,marginBottom:14,fontSize:12}}>
                      <div style={{textAlign:'center',flex:1,padding:'8px',background:'#F8F9FA',borderRadius:6}}>
                        <div style={{fontWeight:600,color:c}}>{p.max_equipos===9999?'Ilimitado':p.max_equipos}</div>
                        <div style={{color:'#A1A1AA',fontSize:10}}>Equipos</div>
                      </div>
                      <div style={{textAlign:'center',flex:1,padding:'8px',background:'#F8F9FA',borderRadius:6}}>
                        <div style={{fontWeight:600,color:c}}>{p.max_usuarios}</div>
                        <div style={{color:'#A1A1AA',fontSize:10}}>Usuarios</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,fontWeight:500,color:'#52525B',marginBottom:8}}>Módulos incluidos:</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {modulos.map((m:string)=>(
                        <span key={m} style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:c+'12',color:c,fontWeight:500}}>{m}</span>
                      ))}
                    </div>
                    <div style={{marginTop:12,fontSize:11,color:'#A1A1AA',display:'flex',alignItems:'center',gap:4}}>
                      <i className="ti ti-check" style={{fontSize:12,color:'#16A34A'}}/> {instituciones.filter(x=>x.plan_id===p.id).length} instituciones activas
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL CREAR INSTITUCIÓN */}
      {modal==='inst'&&(
        <Modal title="Nueva institución" onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Nombre de la IPS *"><input type="text" placeholder="Ej: Clínica San Rafael" value={formInst.nombre} onChange={e=>setFormInst(p=>({...p,nombre:e.target.value}))} style={{width:'100%'}}/></Field>
            <Field label="NIT"><input type="text" placeholder="Ej: 900.123.456-7" value={formInst.nit} onChange={e=>setFormInst(p=>({...p,nit:e.target.value}))} style={{width:'100%'}}/></Field>
            <Field label="Ciudad"><input type="text" placeholder="Ej: Bogotá" value={formInst.ciudad} onChange={e=>setFormInst(p=>({...p,ciudad:e.target.value}))} style={{width:'100%'}}/></Field>
            <Field label="Tipo">
              <select value={formInst.tipo} onChange={e=>setFormInst(p=>({...p,tipo:e.target.value}))} style={{width:'100%'}}>
                {['IPS','Clínica','Hospital','Centro médico','Red hospitalaria'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Plan">
              <select value={formInst.plan_id} onChange={e=>setFormInst(p=>({...p,plan_id:e.target.value}))} style={{width:'100%'}}>
                <option value="">Seleccionar plan</option>
                {planes.map(p=><option key={p.id} value={p.id}>{p.nombre} — ${(p.precio_mensual/1000).toFixed(0)}K/mes</option>)}
              </select>
            </Field>
            <Field label="Vencimiento">
              <input type="date" value={formInst.fecha_vencimiento} onChange={e=>setFormInst(p=>({...p,fecha_vencimiento:e.target.value}))} style={{width:'100%'}}/>
            </Field>
          </div>
          <Field label="Módulos a activar">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
              {MODULOS_DISPONIBLES.map(m=>{
                const sel=formInst.modulos_activos.includes(m.id)
                return (
                  <button key={m.id} onClick={()=>setFormInst(p=>({...p,modulos_activos:sel?p.modulos_activos.filter(x=>x!==m.id):[...p.modulos_activos,m.id]}))}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,border:`0.5px solid ${sel?'#7C3AED':'#E4E4E7'}`,background:sel?'#FDF4FF':'#fff',cursor:'pointer',textAlign:'left'}}>
                    <i className={'ti '+m.icon} style={{fontSize:14,color:sel?'#7C3AED':'#A1A1AA',flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:sel?500:400,color:sel?'#7C3AED':'#52525B'}}>{m.label}</span>
                    {sel&&<i className="ti ti-check" style={{fontSize:12,color:'#7C3AED',marginLeft:'auto'}}/>}
                  </button>
                )
              })}
            </div>
          </Field>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'9px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={crearInstitucion} disabled={!formInst.nombre} style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:formInst.nombre?'#7C3AED':'#F4F4F5',color:formInst.nombre?'#fff':'#A1A1AA',cursor:'pointer',fontSize:13,fontWeight:500}}>Crear institución</button>
          </div>
        </Modal>
      )}

      {/* MODAL CONFIGURAR MÓDULOS */}
      {modal==='modulos'&&instSel&&(
        <Modal title={`Configurar — ${instSel.nombre}`} onClose={()=>setModal(null)}>
          <Field label="Estado">
            <div style={{display:'flex',gap:8}}>
              {['activo','suspendido','trial','vencido'].map(e=>(
                <button key={e} onClick={()=>setEstadoSel(e)} style={{flex:1,padding:'7px',borderRadius:6,border:`0.5px solid ${estadoSel===e?'#7C3AED':'#E4E4E7'}`,background:estadoSel===e?'#FDF4FF':'#fff',color:estadoSel===e?'#7C3AED':'#71717A',cursor:'pointer',fontSize:11,fontWeight:estadoSel===e?500:400,textTransform:'capitalize'}}>
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fecha de vencimiento">
            <input type="date" value={fechaVenc} onChange={e=>setFechaVenc(e.target.value)} style={{width:'100%'}}/>
          </Field>
          <Field label="Módulos activos">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
              {MODULOS_DISPONIBLES.map(m=>{
                const sel=modulosSel.includes(m.id)
                return (
                  <button key={m.id} onClick={()=>setModulosSel(p=>sel?p.filter(x=>x!==m.id):[...p,m.id])}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,border:`0.5px solid ${sel?'#7C3AED':'#E4E4E7'}`,background:sel?'#FDF4FF':'#fff',cursor:'pointer',textAlign:'left'}}>
                    <i className={'ti '+m.icon} style={{fontSize:14,color:sel?'#7C3AED':'#A1A1AA',flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:sel?500:400,color:sel?'#7C3AED':'#52525B'}}>{m.label}</span>
                    {sel&&<i className="ti ti-check" style={{fontSize:12,color:'#7C3AED',marginLeft:'auto'}}/>}
                  </button>
                )
              })}
            </div>
          </Field>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'9px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={actualizarModulos} style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:'#7C3AED',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:500}}>Guardar cambios</button>
          </div>
        </Modal>
      )}

      {/* MODAL CÓDIGO */}
      {modal==='codigo'&&(
        <Modal title="Código de activación" onClose={()=>setModal(null)}>
          <div style={{textAlign:'center',padding:'8px 0 20px'}}>
            <div style={{width:56,height:56,borderRadius:12,background:'#F0FDF4',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <i className="ti ti-key" style={{fontSize:28,color:'#16A34A'}}/>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:'#18181B',marginBottom:4}}>Código generado</div>
            <div style={{fontSize:12,color:'#71717A',marginBottom:20}}>Comparte este código con el administrador de la institución</div>
            <div style={{padding:'16px',borderRadius:10,background:'#F8F9FA',border:'0.5px solid #E4E4E7',marginBottom:16}}>
              <div style={{fontFamily:'monospace',fontSize:22,fontWeight:700,color:'#18181B',letterSpacing:'0.1em'}}>{codigoGen}</div>
            </div>
            <button onClick={()=>{ navigator.clipboard.writeText(codigoGen); mostrarAlerta('Código copiado') }} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13,margin:'0 auto'}}>
              <i className="ti ti-copy" style={{fontSize:14}}/> Copiar código
            </button>
          </div>
          <div style={{padding:'12px 14px',borderRadius:8,background:'#FFFBEB',border:'0.5px solid #FDE68A',fontSize:12,color:'#D97706'}}>
            ⚠ El administrador debe ingresar este código al activar su cuenta. Una vez usado, puede regenerarse desde el panel.
          </div>
          <button onClick={()=>setModal(null)} style={{width:'100%',marginTop:14,padding:'9px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cerrar</button>
        </Modal>
      )}

      {/* MODAL CREAR USUARIO */}
      {modal==='user'&&(
        <Modal title="Nuevo usuario" onClose={()=>setModal(null)}>
          <Field label="Nombre completo *"><input type="text" placeholder="Ej: Juan García" value={formUser.nombre} onChange={e=>setFormUser(p=>({...p,nombre:e.target.value}))} style={{width:'100%'}}/></Field>
          <Field label="Email *"><input type="email" placeholder="usuario@ips.com" value={formUser.email} onChange={e=>setFormUser(p=>({...p,email:e.target.value}))} style={{width:'100%'}}/></Field>
          <Field label="Rol">
            <select value={formUser.rol} onChange={e=>setFormUser(p=>({...p,rol:e.target.value}))} style={{width:'100%'}}>
              {[{v:'admin',l:'Admin IPS'},{v:'supervisor',l:'Supervisor'},{v:'tecnico',l:'Técnico'}].map(r=><option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </Field>
          <Field label="Institución *">
            <select value={formUser.institucion_id} onChange={e=>setFormUser(p=>({...p,institucion_id:e.target.value}))} style={{width:'100%'}}>
              <option value="">Seleccionar institución</option>
              {instituciones.map(i=><option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </Field>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'9px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={crearUsuario} disabled={!formUser.nombre||!formUser.email||!formUser.institucion_id} style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:formUser.nombre&&formUser.email&&formUser.institucion_id?'#7C3AED':'#F4F4F5',color:formUser.nombre&&formUser.email&&formUser.institucion_id?'#fff':'#A1A1AA',cursor:'pointer',fontSize:13,fontWeight:500}}>Crear usuario</button>
          </div>
        </Modal>
      )}

    </div>
  )
}
