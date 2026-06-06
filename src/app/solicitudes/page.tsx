'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'
const INST='00000000-0000-0000-0000-000000000001'

const TIPOS=[
  {v:'correctivo', l:'Correctivo', icon:'ti-alert-triangle', c:RO, bg:RO_BG},
  {v:'preventivo', l:'Preventivo', icon:'ti-shield-check',   c:VE, bg:VE_BG},
  {v:'calibracion',l:'Calibracion',icon:'ti-ruler-measure',  c:MO, bg:MO_BG},
  {v:'traslado',   l:'Traslado',   icon:'ti-transfer',       c:NA, bg:NA_BG},
  {v:'instalacion',l:'Instalacion',icon:'ti-plug',           c:AZ, bg:AZ_BG},
]
const PRIORIDADES=[
  {v:'alta', l:'Alta', c:RO, bg:RO_BG},
  {v:'media',l:'Media',c:NA, bg:NA_BG},
  {v:'baja', l:'Baja', c:VE, bg:VE_BG},
]
const ESTADOS=[
  {v:'pendiente',  l:'Pendiente',   dot:'#94A3B8'},
  {v:'en_atencion',l:'En atencion', dot:NA},
  {v:'completado', l:'Completado',  dot:VE},
  {v:'cancelado',  l:'Cancelado',   dot:RO},
]

function fmtFecha(s:string){
  if(!s) return '—'
  const d=new Date(s)
  const ahora=new Date()
  const diff=Math.floor((ahora.getTime()-d.getTime())/60000)
  if(diff<60) return `Hace ${diff} min`
  if(diff<1440) return `Hace ${Math.floor(diff/60)}h`
  return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

export default function SolicitudesPage(){
  const[solicitudes,setSolicitudes]=useState<any[]>([])
  const[loading,setLoading]=useState(true)
  const[filtroEstado,setFiltroEstado]=useState('todos')
  const[filtroPrio,setFiltroPrio]=useState('todos')
  const[filtroTipo,setFiltroTipo]=useState('todos')
  const[busqueda,setBusqueda]=useState('')
  const[showCrear,setShowCrear]=useState(false)
  const[selSol,setSelSol]=useState<any>(null)
  const[equiposBusq,setEquiposBusq]=useState<any[]>([])
  const[buscandoEq,setBuscandoEq]=useState(false)
  const[nueva,setNueva]=useState({
    equipo_nombre:'',equipo_codigo:'',equipo_id:'',servicio:'',
    tipo:'correctivo',prioridad:'alta',descripcion:'',
    solicitante_nombre:'',solicitante_cargo:'',solicitante_telefono:''
  })
  const[guardando,setGuardando]=useState(false)
  const[tecnicoAsig,setTecnicoAsig]=useState('')
  const[asignando,setAsignando]=useState(false)

  useEffect(()=>{ cargar() },[])

  async function cargar(){
    const r=await fetch('/api/solicitudes')
    const d=await r.json()
    setSolicitudes(d.solicitudes||[])
    setLoading(false)
  }

  async function buscarEquipo(q:string){
    setNueva(p=>({...p,equipo_nombre:q,equipo_id:'',equipo_codigo:'',servicio:''}))
    if(q.length<2){setEquiposBusq([]);return}
    setBuscandoEq(true)
    const sb=createClient()
    const{data}=await sb.from('equipos').select('id,nombre,codigo_inventario,servicio,riesgo').eq('institucion_id',INST).eq('activo',true).or(`nombre.ilike.%${q}%,codigo_inventario.ilike.%${q}%`).limit(8)
    setEquiposBusq(data||[])
    setBuscandoEq(false)
  }

  function selEquipo(eq:any){
    setNueva(p=>({...p,equipo_nombre:eq.nombre,equipo_id:eq.id,equipo_codigo:eq.codigo_inventario||'',servicio:eq.servicio||''}))
    setEquiposBusq([])
  }

  async function crear(){
    if(!nueva.descripcion||!nueva.solicitante_nombre) return
    setGuardando(true)
    const r=await fetch('/api/solicitudes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(nueva)})
    const d=await r.json()
    if(d.solicitud){
      setSolicitudes(p=>[d.solicitud,...p])
      setShowCrear(false)
      setNueva({equipo_nombre:'',equipo_codigo:'',equipo_id:'',servicio:'',tipo:'correctivo',prioridad:'alta',descripcion:'',solicitante_nombre:'',solicitante_cargo:'',solicitante_telefono:''})
    }
    setGuardando(false)
  }

  async function cambiarEstado(id:string,estado:string){
    const r=await fetch('/api/solicitudes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,estado,fecha_atencion:estado==='en_atencion'?new Date().toISOString():undefined})})
    const d=await r.json()
    if(d.solicitud){
      setSolicitudes(p=>p.map(s=>s.id===id?d.solicitud:s))
      if(selSol?.id===id) setSelSol(d.solicitud)
    }
  }

  async function asignarTecnico(id:string){
    if(!tecnicoAsig) return
    setAsignando(true)
    const r=await fetch('/api/solicitudes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,tecnico_asignado:tecnicoAsig,estado:'en_atencion',fecha_atencion:new Date().toISOString()})})
    const d=await r.json()
    if(d.solicitud){setSolicitudes(p=>p.map(s=>s.id===id?d.solicitud:s));setSelSol(d.solicitud)}
    setAsignando(false)
  }

  const filtradas=solicitudes.filter(s=>{
    if(filtroEstado!=='todos'&&s.estado!==filtroEstado) return false
    if(filtroPrio!=='todos'&&s.prioridad!==filtroPrio) return false
    if(filtroTipo!=='todos'&&s.tipo!==filtroTipo) return false
    if(busqueda&&!s.equipo_nombre?.toLowerCase().includes(busqueda.toLowerCase())&&!s.descripcion?.toLowerCase().includes(busqueda.toLowerCase())&&!s.solicitante_nombre?.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const stats={
    total:solicitudes.length,
    pendientes:solicitudes.filter(s=>s.estado==='pendiente').length,
    enAtencion:solicitudes.filter(s=>s.estado==='en_atencion').length,
    completadas:solicitudes.filter(s=>s.estado==='completado').length,
    alta:solicitudes.filter(s=>s.prioridad==='alta'&&s.estado==='pendiente').length,
  }

  function TipoBadge({tipo}:any){
    const t=TIPOS.find(x=>x.v===tipo)||TIPOS[0]
    return <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:t.bg,color:t.c,fontWeight:500,display:'inline-flex',alignItems:'center',gap:4}}><i className={'ti '+t.icon} style={{fontSize:11}}/>{t.l}</span>
  }
  function PrioBadge({prio}:any){
    const p=PRIORIDADES.find(x=>x.v===prio)||PRIORIDADES[1]
    return <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:p.bg,color:p.c,fontWeight:500}}>{p.l}</span>
  }
  function EstadoBadge({estado}:any){
    const e=ESTADOS.find(x=>x.v===estado)||ESTADOS[0]
    return <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F4F4F5',color:'#52525B',display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:e.dot,display:'inline-block'}}/>{e.l}</span>
  }

  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#FAFAFA'}}>

      {/* Panel izquierdo */}
      <div style={{width:320,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',background:'#fff',borderRight:'0.5px solid #E4E4E7'}}>

        {/* Header */}
        <div style={{padding:'16px 14px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>SYNAP / Solicitudes</div>
          <div style={{fontSize:15,fontWeight:500,color:'#18181B',marginBottom:10}}>Solicitudes de servicio</div>
          <button onClick={()=>setShowCrear(true)} style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className="ti ti-plus" style={{fontSize:14}}/> Nueva solicitud
          </button>
        </div>

        {/* Stats */}
        <div style={{padding:'10px 14px',borderBottom:'0.5px solid #E4E4E7',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {[
            {l:'Pendientes',v:stats.pendientes,c:NA},
            {l:'En atencion',v:stats.enAtencion,c:AZ},
            {l:'Completadas',v:stats.completadas,c:VE},
            {l:'Urgentes',v:stats.alta,c:RO},
          ].map(s=>(
            <div key={s.l} style={{padding:'8px',borderRadius:8,background:'#FAFAFA',border:'0.5px solid #E4E4E7',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:500,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:'#A1A1AA',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{padding:'10px 14px',borderBottom:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',gap:6}}>
          <div style={{position:'relative'}}>
            <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar solicitudes..." style={{width:'100%',paddingLeft:28,height:32,fontSize:11}}/>
          </div>
          <div style={{display:'flex',gap:4}}>
            {['todos','pendiente','en_atencion','completado'].map(e=>(
              <button key={e} onClick={()=>setFiltroEstado(e)} style={{flex:1,padding:'4px',borderRadius:6,border:'none',cursor:'pointer',fontSize:9,background:filtroEstado===e?AZ:'#F4F4F5',color:filtroEstado===e?'#fff':'#71717A',fontWeight:filtroEstado===e?500:400}}>
                {e==='todos'?'Todos':e==='pendiente'?'Pend':e==='en_atencion'?'Atenc':'Comp'}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:4}}>
            {['todos','alta','media','baja'].map(p=>(
              <button key={p} onClick={()=>setFiltroPrio(p)} style={{flex:1,padding:'4px',borderRadius:6,border:'none',cursor:'pointer',fontSize:9,background:filtroPrio===p?(p==='alta'?RO:p==='media'?NA:p==='baja'?VE:AZ):'#F4F4F5',color:filtroPrio===p?'#fff':'#71717A',fontWeight:filtroPrio===p?500:400}}>
                {p==='todos'?'Todas':p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista solicitudes */}
        <div style={{flex:1,overflowY:'auto'}}>
          {loading?(
            Array.from({length:5}).map((_,i)=><div key={i} style={{padding:'12px 14px',borderBottom:'0.5px solid #F4F4F5'}}><div style={{height:60,background:'#F1F5F9',borderRadius:8}}/></div>)
          ):filtradas.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px',color:'#A1A1AA'}}>
              <i className="ti ti-inbox" style={{fontSize:32,display:'block',marginBottom:8,opacity:0.3}}/>
              <div style={{fontSize:12}}>Sin solicitudes</div>
            </div>
          ):filtradas.map(s=>{
            const isSel=selSol?.id===s.id
            const prio=PRIORIDADES.find(x=>x.v===s.prioridad)||PRIORIDADES[1]
            return(
              <div key={s.id} onClick={()=>setSelSol(s)} style={{padding:'12px 14px',borderBottom:'0.5px solid #F4F4F5',cursor:'pointer',background:isSel?AZ_BG:'#fff',borderLeft:`3px solid ${isSel?AZ:s.prioridad==='alta'?RO:'transparent'}`,transition:'all 0.1s'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <EstadoBadge estado={s.estado}/>
                  <PrioBadge prio={s.prioridad}/>
                </div>
                <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.equipo_nombre||'Sin equipo'}</div>
                <div style={{fontSize:11,color:GR,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{s.descripcion}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:10,color:'#A1A1AA'}}>{s.solicitante_nombre}</span>
                  <span style={{fontSize:10,color:'#A1A1AA'}}>{fmtFecha(s.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel derecho — detalle */}
      <div style={{flex:1,overflowY:'auto',background:'#FAFAFA'}}>
        {!selSol?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#A1A1AA'}}>
            <i className="ti ti-clipboard-list" style={{fontSize:48,display:'block',marginBottom:12,opacity:0.2}}/>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Selecciona una solicitud</div>
            <div style={{fontSize:12}}>Haz click en una solicitud para ver el detalle</div>
          </div>
        ):(
          <div style={{padding:'20px',maxWidth:700}}>

            {/* Header detalle */}
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px 20px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                    <TipoBadge tipo={selSol.tipo}/>
                    <PrioBadge prio={selSol.prioridad}/>
                    <EstadoBadge estado={selSol.estado}/>
                  </div>
                  <div style={{fontSize:16,fontWeight:500,color:'#18181B',marginBottom:2}}>{selSol.equipo_nombre||'Sin equipo especificado'}</div>
                  <div style={{fontSize:12,color:GR}}>{selSol.equipo_codigo&&`${selSol.equipo_codigo} · `}{selSol.servicio}</div>
                </div>
                <div style={{fontSize:11,color:'#A1A1AA',textAlign:'right',flexShrink:0}}>
                  <div>{fmtFecha(selSol.created_at)}</div>
                  <div style={{fontSize:10}}>ID: {selSol.id?.substring(0,8)}...</div>
                </div>
              </div>

              {/* Descripcion */}
              <div style={{padding:'12px',borderRadius:8,background:'#FAFAFA',border:'0.5px solid #E4E4E7',marginBottom:12}}>
                <div style={{fontSize:10,color:'#A1A1AA',marginBottom:4}}>DESCRIPCION DEL PROBLEMA</div>
                <div style={{fontSize:13,color:'#18181B',lineHeight:1.6}}>{selSol.descripcion}</div>
              </div>

              {/* Solicitante */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[
                  {l:'Solicitante',v:selSol.solicitante_nombre||'—',icon:'ti-user'},
                  {l:'Cargo',v:selSol.solicitante_cargo||'—',icon:'ti-briefcase'},
                  {l:'Telefono',v:selSol.solicitante_telefono||'—',icon:'ti-phone'},
                ].map(item=>(
                  <div key={item.l} style={{padding:'10px',borderRadius:8,background:'#FAFAFA',border:'0.5px solid #E4E4E7'}}>
                    <div style={{fontSize:10,color:'#A1A1AA',marginBottom:3,display:'flex',alignItems:'center',gap:4}}>
                      <i className={'ti '+item.icon} style={{fontSize:11}}/>{item.l}
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{item.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px 20px',marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-settings" style={{fontSize:14,color:AZ}}/> Gestion de la solicitud
              </div>

              {/* Cambiar estado */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Cambiar estado</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {ESTADOS.map(e=>(
                    <button key={e.v} onClick={()=>cambiarEstado(selSol.id,e.v)}
                      style={{padding:'7px 14px',borderRadius:8,border:`0.5px solid ${selSol.estado===e.v?e.dot:'#E4E4E7'}`,background:selSol.estado===e.v?e.dot+'20':'#fff',color:selSol.estado===e.v?e.dot:GR,fontSize:12,cursor:'pointer',fontWeight:selSol.estado===e.v?500:400,display:'flex',alignItems:'center',gap:5,transition:'all 0.15s'}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:e.dot,display:'inline-block'}}/>
                      {e.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asignar tecnico */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Asignar tecnico</div>
                {selSol.tecnico_asignado?(
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:VE_BG,border:`0.5px solid ${VE}30`}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:VE+'20',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className="ti ti-user-check" style={{fontSize:16,color:VE}}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,fontWeight:500,color:VE}}>{selSol.tecnico_asignado}</div>
                      <div style={{fontSize:10,color:GR}}>Tecnico asignado</div>
                    </div>
                    <button onClick={()=>setTecnicoAsig('')} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:11,cursor:'pointer',color:GR}}>Cambiar</button>
                  </div>
                ):(
                  <div style={{display:'flex',gap:8}}>
                    <select value={tecnicoAsig} onChange={e=>setTecnicoAsig(e.target.value)} style={{flex:1,height:36,fontSize:12,padding:'0 10px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
                      <option value="">Seleccionar tecnico...</option>
                      {['Biomedico 1','Biomedico 2','Biomedico 3'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={()=>asignarTecnico(selSol.id)} disabled={!tecnicoAsig||asignando}
                      style={{padding:'7px 16px',borderRadius:8,border:'none',background:tecnicoAsig?AZ:'#F4F4F5',color:tecnicoAsig?'#fff':'#A1A1AA',fontSize:12,fontWeight:500,cursor:tecnicoAsig?'pointer':'default'}}>
                      {asignando?'Asignando...':'Asignar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Observaciones del tecnico</div>
                <textarea defaultValue={selSol.observaciones||''} placeholder="Agregar observaciones o diagnostico inicial..." rows={3}
                  style={{width:'100%',fontSize:12,borderRadius:8,padding:'10px',border:'0.5px solid #E4E4E7',resize:'none',color:'#18181B'}}
                  onBlur={async e=>{
                    if(e.target.value!==selSol.observaciones){
                      const r=await fetch('/api/solicitudes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selSol.id,observaciones:e.target.value})})
                      const d=await r.json()
                      if(d.solicitud){setSolicitudes(p=>p.map(s=>s.id===selSol.id?d.solicitud:s));setSelSol(d.solicitud)}
                    }
                  }}/>
              </div>
            </div>

            {/* Timeline */}
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px 20px'}}>
              <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-timeline" style={{fontSize:14,color:AZ}}/> Historial de la solicitud
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {[
                  {icon:'ti-plus',color:AZ,label:'Solicitud creada',fecha:selSol.created_at,desc:`Por ${selSol.solicitante_nombre||'—'} · ${selSol.solicitante_cargo||''}`},
                  ...(selSol.fecha_atencion?[{icon:'ti-tool',color:NA,label:'Solicitud en atencion',fecha:selSol.fecha_atencion,desc:selSol.tecnico_asignado?`Asignada a ${selSol.tecnico_asignado}`:'Sin tecnico asignado'}]:[]),
                  ...(selSol.estado==='completado'?[{icon:'ti-check',color:VE,label:'Solicitud completada',fecha:selSol.updated_at,desc:'Intervencion finalizada'}]:[]),
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:'flex',gap:12,position:'relative',paddingBottom:i<arr.length-1?16:0}}>
                    {i<arr.length-1&&<div style={{position:'absolute',left:15,top:28,width:1,height:'100%',background:'#E4E4E7'}}/>}
                    <div style={{width:30,height:30,borderRadius:'50%',background:item.color+'15',border:`1.5px solid ${item.color}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,zIndex:1}}>
                      <i className={'ti '+item.icon} style={{fontSize:14,color:item.color}}/>
                    </div>
                    <div style={{flex:1,paddingTop:4}}>
                      <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:1}}>{item.label}</div>
                      <div style={{fontSize:11,color:GR,marginBottom:1}}>{item.desc}</div>
                      <div style={{fontSize:10,color:'#A1A1AA'}}>{fmtFecha(item.fecha)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear solicitud */}
      {showCrear&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setShowCrear(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:500,color:'#18181B',marginBottom:2}}>Nueva solicitud de servicio</div>
                <div style={{fontSize:11,color:GR}}>El equipo de biomedica recibira la solicitud inmediatamente</div>
              </div>
              <button onClick={()=>setShowCrear(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:22,lineHeight:1}}>×</button>
            </div>

            {/* Tipo y prioridad */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Tipo de solicitud *</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {TIPOS.map(t=>(
                    <button key={t.v} onClick={()=>setNueva(p=>({...p,tipo:t.v}))}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,border:`0.5px solid ${nueva.tipo===t.v?t.c:'#E4E4E7'}`,background:nueva.tipo===t.v?t.bg:'#fff',cursor:'pointer',fontSize:12,color:nueva.tipo===t.v?t.c:GR,fontWeight:nueva.tipo===t.v?500:400,transition:'all 0.1s'}}>
                      <i className={'ti '+t.icon} style={{fontSize:13}}/>{t.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Prioridad *</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {PRIORIDADES.map(p=>(
                    <button key={p.v} onClick={()=>setNueva(pr=>({...pr,prioridad:p.v}))}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,border:`0.5px solid ${nueva.prioridad===p.v?p.c:'#E4E4E7'}`,background:nueva.prioridad===p.v?p.bg:'#fff',cursor:'pointer',fontSize:12,color:nueva.prioridad===p.v?p.c:GR,fontWeight:nueva.prioridad===p.v?500:400,transition:'all 0.1s'}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:p.c,display:'inline-block'}}/>{p.l}
                    </button>
                  ))}
                </div>
                <div style={{marginTop:10,padding:'10px',borderRadius:8,background:nueva.prioridad==='alta'?RO_BG:nueva.prioridad==='media'?NA_BG:VE_BG,fontSize:11,color:nueva.prioridad==='alta'?RO:nueva.prioridad==='media'?NA:VE}}>
                  {nueva.prioridad==='alta'?'Atencion inmediata requerida':nueva.prioridad==='media'?'Atencion en las proximas 24 horas':'Atencion en los proximos dias'}
                </div>
              </div>
            </div>

            {/* Equipo */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Equipo afectado</div>
              <div style={{position:'relative'}}>
                <i className="ti ti-device-heart-monitor" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:14}}/>
                <input value={nueva.equipo_nombre} onChange={e=>buscarEquipo(e.target.value)}
                  placeholder="Buscar equipo por nombre o codigo..." style={{width:'100%',paddingLeft:32,height:36,fontSize:12}}/>
              </div>
              {equiposBusq.length>0&&(
                <div style={{border:'0.5px solid #E4E4E7',borderRadius:8,overflow:'hidden',marginTop:4}}>
                  {equiposBusq.map((eq,i)=>(
                    <div key={eq.id} onClick={()=>selEquipo(eq)} style={{padding:'8px 12px',borderBottom:i<equiposBusq.length-1?'0.5px solid #F4F4F5':'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:10,background:'#fff'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#F8F9FA'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#fff'}}>
                      <i className="ti ti-device-heart-monitor" style={{fontSize:14,color:AZ,flexShrink:0}}/>
                      <div>
                        <div style={{fontWeight:500,color:'#18181B'}}>{eq.nombre}</div>
                        <div style={{fontSize:10,color:GR}}>{eq.codigo_inventario} · {eq.servicio}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {nueva.equipo_id&&(
                <div style={{marginTop:6,padding:'6px 10px',borderRadius:6,background:VE_BG,fontSize:11,color:VE}}>
                  ✓ {nueva.servicio&&`Servicio: ${nueva.servicio}`}
                </div>
              )}
            </div>

            {/* Descripcion */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Descripcion del problema *</div>
              <textarea value={nueva.descripcion} onChange={e=>setNueva(p=>({...p,descripcion:e.target.value}))}
                placeholder="Describe detalladamente el problema o la solicitud de servicio..." rows={3}
                style={{width:'100%',fontSize:12,borderRadius:8,padding:'10px',border:'0.5px solid #E4E4E7',resize:'none',color:'#18181B'}}/>
            </div>

            {/* Datos solicitante */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {[
                {k:'solicitante_nombre',   l:'Nombre del solicitante *', ph:'Ej: Maria Lopez',     icon:'ti-user'},
                {k:'solicitante_cargo',    l:'Cargo',                   ph:'Ej: Jefe de Enfermeria',icon:'ti-briefcase'},
                {k:'solicitante_telefono', l:'Telefono / Extension',    ph:'Ej: 3001234567 ext 201',icon:'ti-phone'},
              ].map(f=>(
                <div key={f.k} style={{gridColumn:f.k==='solicitante_nombre'?'1/-1':'auto'}}>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:5}}>{f.l}</div>
                  <div style={{position:'relative'}}>
                    <i className={'ti '+f.icon} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
                    <input value={(nueva as any)[f.k]} onChange={e=>setNueva(p=>({...p,[f.k]:e.target.value}))}
                      placeholder={f.ph} style={{width:'100%',paddingLeft:28,height:34,fontSize:12}}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowCrear(false)} style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={crear} disabled={!nueva.descripcion||!nueva.solicitante_nombre||guardando}
                style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:!nueva.descripcion||!nueva.solicitante_nombre?'#F4F4F5':AZ,color:!nueva.descripcion||!nueva.solicitante_nombre?'#A1A1AA':'#fff',fontSize:13,fontWeight:500,cursor:!nueva.descripcion||!nueva.solicitante_nombre?'default':'pointer'}}>
                {guardando?'Enviando...':'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
