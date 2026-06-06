'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'
const INST='00000000-0000-0000-0000-000000000001'

const TIPOS=[
  {v:'traslado',    l:'Traslado',     icon:'ti-transfer',    c:AZ, bg:AZ_BG},
  {v:'instalacion', l:'Instalacion',  icon:'ti-plug',        c:VE, bg:VE_BG},
  {v:'baja_temporal',l:'Baja temporal',icon:'ti-tool',       c:NA, bg:NA_BG},
  {v:'devolucion',  l:'Devolucion',   icon:'ti-arrow-back',  c:MO, bg:MO_BG},
  {v:'baja_definitiva',l:'Baja definitiva',icon:'ti-trash',  c:RO, bg:RO_BG},
]

const SERVICIOS=['UCI','Urgencias Adulto','Urgencias Pediatria','Salas De Cirugia','Hospitalizacion','Ginecologia','Neonatologia','Consulta Externa','Banco De Sangre','Central De Esterilizacion','Almacen','Bodega','Otro']

function fmtFecha(s:string){
  if(!s) return '—'
  return new Date(s).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}

function TipoBadge({tipo}:any){
  const t=TIPOS.find(x=>x.v===tipo)||TIPOS[0]
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:t.bg,color:t.c,fontWeight:500,display:'inline-flex',alignItems:'center',gap:4}}>
    <i className={'ti '+t.icon} style={{fontSize:11}}/>{t.l}
  </span>
}

export default function MovimientosPage(){
  const[movimientos,setMovimientos]=useState<any[]>([])
  const[loading,setLoading]=useState(true)
  const[showCrear,setShowCrear]=useState(false)
  const[filtroTipo,setFiltroTipo]=useState('todos')
  const[busqueda,setBusqueda]=useState('')
  const[equiposBusq,setEquiposBusq]=useState<any[]>([])
  const[guardando,setGuardando]=useState(false)
  const[nuevo,setNuevo]=useState({
    equipo_id:'',equipo_nombre:'',equipo_codigo:'',
    servicio_origen:'',ubicacion_origen:'',
    servicio_destino:'',ubicacion_destino:'',
    tipo:'traslado',motivo:'',descripcion:'',
    responsable_nombre:'',responsable_cargo:'',
  })

  useEffect(()=>{ cargar() },[])

  async function cargar(){
    const r=await fetch('/api/movimientos')
    const d=await r.json()
    setMovimientos(d.movimientos||[])
    setLoading(false)
  }

  async function buscarEquipo(q:string){
    setNuevo(p=>({...p,equipo_nombre:q,equipo_id:'',equipo_codigo:'',servicio_origen:''}))
    if(q.length<2){setEquiposBusq([]);return}
    const sb=createClient()
    const{data}=await sb.from('equipos').select('id,nombre,codigo_inventario,servicio,ubicacion').eq('institucion_id',INST).eq('activo',true).or(`nombre.ilike.%${q}%,codigo_inventario.ilike.%${q}%`).limit(8)
    setEquiposBusq(data||[])
  }

  function selEquipo(eq:any){
    setNuevo(p=>({...p,equipo_id:eq.id,equipo_nombre:eq.nombre,equipo_codigo:eq.codigo_inventario||'',servicio_origen:eq.servicio||'',ubicacion_origen:eq.ubicacion||''}))
    setEquiposBusq([])
  }

  async function crear(){
    if(!nuevo.equipo_nombre||!nuevo.servicio_destino||!nuevo.responsable_nombre) return
    setGuardando(true)
    const r=await fetch('/api/movimientos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...nuevo,fecha_movimiento:new Date().toISOString()})})
    const d=await r.json()
    if(d.movimiento){
      setMovimientos(p=>[d.movimiento,...p])
      setShowCrear(false)
      setNuevo({equipo_id:'',equipo_nombre:'',equipo_codigo:'',servicio_origen:'',ubicacion_origen:'',servicio_destino:'',ubicacion_destino:'',tipo:'traslado',motivo:'',descripcion:'',responsable_nombre:'',responsable_cargo:''})
    }
    setGuardando(false)
  }

  const filtrados=movimientos.filter(m=>{
    if(filtroTipo!=='todos'&&m.tipo!==filtroTipo) return false
    if(busqueda&&!m.equipo_nombre?.toLowerCase().includes(busqueda.toLowerCase())&&!m.servicio_destino?.toLowerCase().includes(busqueda.toLowerCase())&&!m.responsable_nombre?.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  // Stats
  const stats={
    total:movimientos.length,
    traslados:movimientos.filter(m=>m.tipo==='traslado').length,
    instalaciones:movimientos.filter(m=>m.tipo==='instalacion').length,
    bajas:movimientos.filter(m=>m.tipo==='baja_temporal'||m.tipo==='baja_definitiva').length,
    hoy:movimientos.filter(m=>{const d=new Date(m.fecha_movimiento);const h=new Date();return d.toDateString()===h.toDateString()}).length,
  }

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#FAFAFA'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Movimientos</div>
          <h1 style={{fontSize:18,fontWeight:500,color:'#18181B',margin:0}}>Movimientos de equipos</h1>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar equipo o servicio..." style={{paddingLeft:28,height:34,fontSize:12,width:220}}/>
          </div>
          <button onClick={()=>setShowCrear(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>
            <i className="ti ti-plus" style={{fontSize:14}}/> Registrar movimiento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{padding:'16px 28px 0',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
        {[
          {l:'Total movimientos',v:stats.total,    c:AZ,  icon:'ti-transfer'},
          {l:'Traslados',        v:stats.traslados, c:AZ,  icon:'ti-arrows-exchange'},
          {l:'Instalaciones',    v:stats.instalaciones,c:VE,icon:'ti-plug'},
          {l:'Bajas',            v:stats.bajas,     c:RO,  icon:'ti-archive'},
          {l:'Hoy',              v:stats.hoy,       c:NA,  icon:'ti-calendar-today'},
        ].map((k,i)=>(
          <div key={i} style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:8,background:k.c+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className={'ti '+k.icon} style={{fontSize:17,color:k.c}}/>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:500,color:k.c,lineHeight:1,marginBottom:2}}>{k.v}</div>
              <div style={{fontSize:10,color:'#A1A1AA'}}>{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros tipo */}
      <div style={{padding:'12px 28px 0',display:'flex',gap:6}}>
        {[{v:'todos',l:'Todos'},...TIPOS].map(t=>(
          <button key={t.v} onClick={()=>setFiltroTipo(t.v)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,border:`0.5px solid ${filtroTipo===t.v?(t as any).c||AZ:'#E4E4E7'}`,background:filtroTipo===t.v?(t as any).bg||AZ_BG:'#fff',color:filtroTipo===t.v?(t as any).c||AZ:GR,fontSize:11,fontWeight:filtroTipo===t.v?500:400,cursor:'pointer'}}>
            {(t as any).icon&&<i className={'ti '+(t as any).icon} style={{fontSize:12}}/>}{t.l}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{padding:'12px 28px 28px'}}>
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#F8F9FA'}}>
                {['Fecha','Equipo','Tipo','Origen','Destino','Motivo','Responsable',''].map(h=>(
                  <th key={h} style={{padding:'10px 14px',fontSize:10,fontWeight:500,color:GR,textAlign:'left',borderBottom:'0.5px solid #E4E4E7',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?(
                Array.from({length:5}).map((_,i)=>(
                  <tr key={i}><td colSpan={8} style={{padding:'12px 14px'}}><div style={{height:20,background:'#F1F5F9',borderRadius:4}}/></td></tr>
                ))
              ):filtrados.length===0?(
                <tr><td colSpan={8} style={{padding:'48px',textAlign:'center',color:'#A1A1AA'}}>
                  <i className="ti ti-transfer" style={{fontSize:36,display:'block',marginBottom:10,opacity:0.2}}/>
                  <div style={{fontSize:13}}>Sin movimientos registrados</div>
                </td></tr>
              ):filtrados.map((m,i)=>(
                <tr key={m.id} style={{borderBottom:'0.5px solid #F4F4F5',background:i%2===0?'#fff':'#FAFAFA',transition:'background 0.1s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#F0F4FF'}}
                  onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'10px 14px',fontSize:11,color:GR,whiteSpace:'nowrap'}}>{fmtFecha(m.fecha_movimiento)}</td>
                  <td style={{padding:'10px 14px',maxWidth:180}}>
                    <div style={{fontSize:12,fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.equipo_nombre||'—'}</div>
                    {m.equipo_codigo&&<div style={{fontSize:10,color:'#A1A1AA',fontFamily:'monospace'}}>{m.equipo_codigo}</div>}
                  </td>
                  <td style={{padding:'10px 14px'}}><TipoBadge tipo={m.tipo}/></td>
                  <td style={{padding:'10px 14px',fontSize:12,color:GR}}>
                    <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{m.servicio_origen||'—'}</div>
                    {m.ubicacion_origen&&<div style={{fontSize:10,color:'#A1A1AA'}}>{m.ubicacion_origen}</div>}
                  </td>
                  <td style={{padding:'10px 14px',fontSize:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <i className="ti ti-arrow-right" style={{fontSize:12,color:AZ,flexShrink:0}}/>
                      <div>
                        <div style={{fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{m.servicio_destino}</div>
                        {m.ubicacion_destino&&<div style={{fontSize:10,color:'#A1A1AA'}}>{m.ubicacion_destino}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11,color:GR,maxWidth:160}}>
                    <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.motivo||'—'}</div>
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11}}>
                    <div style={{fontWeight:500,color:'#18181B'}}>{m.responsable_nombre||'—'}</div>
                    {m.responsable_cargo&&<div style={{fontSize:10,color:'#A1A1AA'}}>{m.responsable_cargo}</div>}
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:VE_BG,color:VE,fontWeight:500}}>Completado</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear */}
      {showCrear&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setShowCrear(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:500,color:'#18181B',marginBottom:2}}>Registrar movimiento de equipo</div>
                <div style={{fontSize:11,color:GR}}>El historial del equipo se actualizara automaticamente</div>
              </div>
              <button onClick={()=>setShowCrear(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:22}}>×</button>
            </div>

            {/* Tipo */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Tipo de movimiento *</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {TIPOS.map(t=>(
                  <button key={t.v} onClick={()=>setNuevo(p=>({...p,tipo:t.v}))}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',borderRadius:8,border:`0.5px solid ${nuevo.tipo===t.v?t.c:'#E4E4E7'}`,background:nuevo.tipo===t.v?t.bg:'#fff',cursor:'pointer',fontSize:11,color:nuevo.tipo===t.v?t.c:GR,fontWeight:nuevo.tipo===t.v?500:400,transition:'all 0.1s'}}>
                    <i className={'ti '+t.icon} style={{fontSize:13}}/>{t.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipo */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Equipo *</div>
              <div style={{position:'relative'}}>
                <i className="ti ti-device-heart-monitor" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
                <input value={nuevo.equipo_nombre} onChange={e=>buscarEquipo(e.target.value)} placeholder="Buscar equipo..." style={{width:'100%',paddingLeft:28,height:36,fontSize:12}}/>
              </div>
              {equiposBusq.length>0&&(
                <div style={{border:'0.5px solid #E4E4E7',borderRadius:8,overflow:'hidden',marginTop:4}}>
                  {equiposBusq.map((eq,i)=>(
                    <div key={eq.id} onClick={()=>selEquipo(eq)} style={{padding:'8px 12px',borderBottom:i<equiposBusq.length-1?'0.5px solid #F4F4F5':'none',cursor:'pointer',fontSize:12,background:'#fff'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#F8F9FA'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#fff'}}>
                      <div style={{fontWeight:500,color:'#18181B'}}>{eq.nombre}</div>
                      <div style={{fontSize:10,color:GR}}>{eq.codigo_inventario} · Actualmente en: {eq.servicio||'—'}</div>
                    </div>
                  ))}
                </div>
              )}
              {nuevo.equipo_id&&nuevo.servicio_origen&&(
                <div style={{marginTop:6,padding:'6px 10px',borderRadius:6,background:AZ_BG,fontSize:11,color:AZ}}>
                  <i className="ti ti-map-pin" style={{fontSize:11}}/> Ubicacion actual: <b>{nuevo.servicio_origen}</b> {nuevo.ubicacion_origen&&`· ${nuevo.ubicacion_origen}`}
                </div>
              )}
            </div>

            {/* Origen y destino */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Servicio origen</div>
                <input value={nuevo.servicio_origen} onChange={e=>setNuevo(p=>({...p,servicio_origen:e.target.value}))} placeholder="Servicio de origen" style={{width:'100%',height:34,fontSize:12}}/>
                <input value={nuevo.ubicacion_origen} onChange={e=>setNuevo(p=>({...p,ubicacion_origen:e.target.value}))} placeholder="Ubicacion especifica (cama, consultorio...)" style={{width:'100%',height:34,fontSize:12,marginTop:6}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Servicio destino *</div>
                <select value={nuevo.servicio_destino} onChange={e=>setNuevo(p=>({...p,servicio_destino:e.target.value}))} style={{width:'100%',height:34,fontSize:12,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
                  <option value="">Seleccionar servicio...</option>
                  {SERVICIOS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input value={nuevo.ubicacion_destino} onChange={e=>setNuevo(p=>({...p,ubicacion_destino:e.target.value}))} placeholder="Ubicacion especifica (cama, consultorio...)" style={{width:'100%',height:34,fontSize:12,marginTop:6}}/>
              </div>
            </div>

            {/* Motivo y descripcion */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Motivo del movimiento</div>
              <input value={nuevo.motivo} onChange={e=>setNuevo(p=>({...p,motivo:e.target.value}))} placeholder="Ej: Necesidad clinica urgente, mantenimiento, reasignacion..." style={{width:'100%',height:34,fontSize:12}}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Descripcion adicional</div>
              <textarea value={nuevo.descripcion} onChange={e=>setNuevo(p=>({...p,descripcion:e.target.value}))} placeholder="Observaciones adicionales del movimiento..." rows={2} style={{width:'100%',fontSize:12,borderRadius:8,padding:'8px 10px',border:'0.5px solid #E4E4E7',resize:'none'}}/>
            </div>

            {/* Responsable */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Responsable *</div>
                <input value={nuevo.responsable_nombre} onChange={e=>setNuevo(p=>({...p,responsable_nombre:e.target.value}))} placeholder="Nombre del responsable" style={{width:'100%',height:34,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:6}}>Cargo</div>
                <input value={nuevo.responsable_cargo} onChange={e=>setNuevo(p=>({...p,responsable_cargo:e.target.value}))} placeholder="Cargo del responsable" style={{width:'100%',height:34,fontSize:12}}/>
              </div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowCrear(false)} style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={crear} disabled={!nuevo.equipo_nombre||!nuevo.servicio_destino||!nuevo.responsable_nombre||guardando}
                style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:!nuevo.equipo_nombre||!nuevo.servicio_destino||!nuevo.responsable_nombre?'#F4F4F5':AZ,color:!nuevo.equipo_nombre||!nuevo.servicio_destino||!nuevo.responsable_nombre?'#A1A1AA':'#fff',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                {guardando?'Registrando...':'Registrar movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
