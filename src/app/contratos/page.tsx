'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'

const TIPOS=[
  {v:'mantenimiento',l:'Mantenimiento',icon:'ti-tool',       c:AZ, bg:AZ_BG},
  {v:'calibracion',  l:'Calibracion',  icon:'ti-ruler-measure',c:MO,bg:MO_BG},
  {v:'garantia',     l:'Garantia',     icon:'ti-shield-check',c:VE, bg:VE_BG},
  {v:'soporte',      l:'Soporte TI',   icon:'ti-device-laptop',c:NA,bg:NA_BG},
  {v:'otro',         l:'Otro',         icon:'ti-file-text',   c:GR, bg:'#F4F4F5'},
]

function diasRestantes(fecha:string){
  const d=new Date(fecha)
  const hoy=new Date()
  return Math.ceil((d.getTime()-hoy.getTime())/86400000)
}

function fmtFecha(s:string){
  if(!s) return '—'
  return new Date(s+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

function fmtCOP(n:number){
  if(!n) return '—'
  return n>=1000000?'$'+(n/1000000).toFixed(1)+'M COP':'$'+Math.round(n/1000)+'K COP'
}

function EstadoBadge({estado,dias}:{estado:string,dias:number}){
  if(estado==='vencido'||dias<0) return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:RO_BG,color:RO,fontWeight:500}}>Vencido</span>
  if(dias<=30) return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:RO_BG,color:RO,fontWeight:500}}>Vence en {dias}d</span>
  if(dias<=90) return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:NA_BG,color:NA,fontWeight:500}}>Vence en {dias}d</span>
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:VE_BG,color:VE,fontWeight:500}}>Vigente</span>
}

function TipoBadge({tipo}:any){
  const t=TIPOS.find(x=>x.v===tipo)||TIPOS[4]
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:t.bg,color:t.c,fontWeight:500,display:'inline-flex',alignItems:'center',gap:4}}>
    <i className={'ti '+t.icon} style={{fontSize:11}}/>{t.l}
  </span>
}

export default function ContratosPage(){
  const[data,setData]=useState<any>({contratos:[],proveedores:[]})
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState<'contratos'|'proveedores'>('contratos')
  const[selCont,setSelCont]=useState<any>(null)
  const[selProv,setSelProv]=useState<any>(null)
  const[showCrearCont,setShowCrearCont]=useState(false)
  const[showCrearProv,setShowCrearProv]=useState(false)
  const[guardando,setGuardando]=useState(false)
  const[filtrTipo,setFiltrTipo]=useState('todos')
  const[filtrEstado,setFiltrEstado]=useState('todos')
  const[nuevoCont,setNuevoCont]=useState({proveedor_nombre:'',tipo:'mantenimiento',numero:'',descripcion:'',valor:'',fecha_inicio:'',fecha_fin:'',cobertura:'',equipos_cubiertos:'',contacto_nombre:'',contacto_telefono:'',notas:''})
  const[nuevoProv,setNuevoProv]=useState({nombre:'',nit:'',contacto_nombre:'',contacto_telefono:'',contacto_email:'',ciudad:'Bogota',especialidad:'',notas:''})

  useEffect(()=>{ cargar() },[])

  async function cargar(){
    const r=await fetch('/api/contratos')
    const d=await r.json()
    setData(d)
    setLoading(false)
  }

  async function crearContrato(){
    if(!nuevoCont.proveedor_nombre||!nuevoCont.fecha_inicio||!nuevoCont.fecha_fin) return
    setGuardando(true)
    const r=await fetch('/api/contratos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tabla:'contratos',data:{...nuevoCont,valor:nuevoCont.valor?+nuevoCont.valor:null,equipos_cubiertos:nuevoCont.equipos_cubiertos?+nuevoCont.equipos_cubiertos:0}})})
    const d=await r.json()
    if(d.result){ setData((p:any)=>({...p,contratos:[d.result,...p.contratos]})); setShowCrearCont(false); setNuevoCont({proveedor_nombre:'',tipo:'mantenimiento',numero:'',descripcion:'',valor:'',fecha_inicio:'',fecha_fin:'',cobertura:'',equipos_cubiertos:'',contacto_nombre:'',contacto_telefono:'',notas:''}) }
    setGuardando(false)
  }

  async function crearProveedor(){
    if(!nuevoProv.nombre) return
    setGuardando(true)
    const r=await fetch('/api/contratos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tabla:'proveedores',data:nuevoProv})})
    const d=await r.json()
    if(d.result){ setData((p:any)=>({...p,proveedores:[...p.proveedores,d.result]})); setShowCrearProv(false); setNuevoProv({nombre:'',nit:'',contacto_nombre:'',contacto_telefono:'',contacto_email:'',ciudad:'Bogota',especialidad:'',notas:''}) }
    setGuardando(false)
  }

  const contratos=data.contratos
  const proveedores=data.proveedores

  const contFiltrados=contratos.filter((c:any)=>{
    const dias=diasRestantes(c.fecha_fin)
    if(filtrTipo!=='todos'&&c.tipo!==filtrTipo) return false
    if(filtrEstado==='activo'&&(c.estado==='vencido'||dias<0)) return false
    if(filtrEstado==='vencido'&&c.estado!=='vencido'&&dias>=0) return false
    if(filtrEstado==='proximo'&&dias>90) return false
    return true
  })

  const stats={
    total:contratos.length,
    activos:contratos.filter((c:any)=>c.estado==='activo'&&diasRestantes(c.fecha_fin)>=0).length,
    vencidos:contratos.filter((c:any)=>c.estado==='vencido'||diasRestantes(c.fecha_fin)<0).length,
    proximos:contratos.filter((c:any)=>{const d=diasRestantes(c.fecha_fin);return d>=0&&d<=90}).length,
    valorTotal:contratos.reduce((s:number,c:any)=>s+(c.valor||0),0),
  }

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#FAFAFA'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Contratos y Proveedores</div>
          <h1 style={{fontSize:18,fontWeight:500,color:'#18181B',margin:0}}>Contratos y proveedores</h1>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setShowCrearProv(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:12,color:GR,cursor:'pointer'}}>
            <i className="ti ti-building" style={{fontSize:13}}/> Nuevo proveedor
          </button>
          <button onClick={()=>setShowCrearCont(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>
            <i className="ti ti-plus" style={{fontSize:14}}/> Nuevo contrato
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{padding:'16px 28px 0',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
        {[
          {l:'Total contratos',v:stats.total,          c:AZ,  icon:'ti-file-text'},
          {l:'Contratos activos',v:stats.activos,      c:VE,  icon:'ti-check'},
          {l:'Vencidos',         v:stats.vencidos,     c:RO,  icon:'ti-alert-triangle'},
          {l:'Vencen en 90 dias',v:stats.proximos,     c:NA,  icon:'ti-clock'},
          {l:'Valor total anual',v:fmtCOP(stats.valorTotal),c:MO,icon:'ti-currency-dollar'},
        ].map((k,i)=>(
          <div key={i} style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:8,background:k.c+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className={'ti '+k.icon} style={{fontSize:17,color:k.c}}/>
            </div>
            <div>
              <div style={{fontSize:k.l==='Valor total anual'?14:22,fontWeight:500,color:k.c,lineHeight:1,marginBottom:2}}>{k.v}</div>
              <div style={{fontSize:10,color:'#A1A1AA'}}>{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas vencimiento */}
      {stats.proximos>0&&(
        <div style={{margin:'12px 28px 0',padding:'10px 14px',borderRadius:10,background:NA_BG,border:`0.5px solid ${NA}40`,display:'flex',alignItems:'center',gap:10}}>
          <i className="ti ti-bell" style={{fontSize:16,color:NA,flexShrink:0}}/>
          <div style={{fontSize:12,color:'#92400E'}}>
            <b>{stats.proximos} contratos</b> vencen en los proximos 90 dias. Revisa y renueva antes del vencimiento para evitar discontinuidad en el servicio.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{padding:'12px 28px 0',display:'flex',gap:4,background:'transparent'}}>
        <div style={{display:'flex',gap:4,background:'#F4F4F5',borderRadius:10,padding:4}}>
          {[
            {id:'contratos',   label:`Contratos (${contratos.length})`,  icon:'ti-file-text'},
            {id:'proveedores', label:`Proveedores (${proveedores.length})`,icon:'ti-building'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?500:400,background:tab===t.id?'#fff':'transparent',color:tab===t.id?AZ:GR,boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none'}}>
              <i className={'ti '+t.icon} style={{fontSize:13}}/>{t.label}
            </button>
          ))}
        </div>
        {tab==='contratos'&&(
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            <select value={filtrTipo} onChange={e=>setFiltrTipo(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todos">Todos los tipos</option>
              {TIPOS.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
            <select value={filtrEstado} onChange={e=>setFiltrEstado(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="proximo">Proximos a vencer</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>
        )}
      </div>

      <div style={{padding:'12px 28px 28px',display:'grid',gridTemplateColumns:selCont||selProv?'1fr 360px':'1fr',gap:16}}>

        {/* CONTRATOS */}
        {tab==='contratos'&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {loading?(
              Array.from({length:3}).map((_,i)=><div key={i} style={{height:120,background:'#F8F9FA',borderRadius:12,border:'0.5px solid #E4E4E7'}}/>)
            ):contFiltrados.length===0?(
              <div style={{textAlign:'center',padding:'60px',color:'#A1A1AA',background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7'}}>
                <i className="ti ti-file-off" style={{fontSize:36,display:'block',marginBottom:10,opacity:0.2}}/>
                <div style={{fontSize:13}}>Sin contratos</div>
              </div>
            ):contFiltrados.map((c:any)=>{
              const dias=diasRestantes(c.fecha_fin)
              const isSel=selCont?.id===c.id
              const borderColor=dias<0||c.estado==='vencido'?RO:dias<=30?RO:dias<=90?NA:isSel?AZ:'#E4E4E7'
              return(
                <div key={c.id} onClick={()=>setSelCont(isSel?null:c)} style={{background:'#fff',borderRadius:12,border:`0.5px solid ${borderColor}`,padding:'16px 20px',cursor:'pointer',transition:'all 0.15s',boxShadow:isSel?'0 0 0 2px '+AZ+'40':'none'}}
                  onMouseEnter={e=>{if(!isSel)e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}}
                  onMouseLeave={e=>{if(!isSel)e.currentTarget.style.boxShadow='none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                        <TipoBadge tipo={c.tipo}/>
                        <EstadoBadge estado={c.estado} dias={dias}/>
                        {c.numero&&<span style={{fontSize:10,color:'#A1A1AA',fontFamily:'monospace'}}>{c.numero}</span>}
                      </div>
                      <div style={{fontSize:15,fontWeight:500,color:'#18181B',marginBottom:3}}>{c.proveedor_nombre}</div>
                      <div style={{fontSize:12,color:GR,marginBottom:8}}>{c.descripcion}</div>
                      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:GR}}>
                          <i className="ti ti-calendar" style={{fontSize:12}}/>{fmtFecha(c.fecha_inicio)} → {fmtFecha(c.fecha_fin)}
                        </div>
                        {c.equipos_cubiertos>0&&<div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:GR}}>
                          <i className="ti ti-device-heart-monitor" style={{fontSize:12}}/>{c.equipos_cubiertos} equipos cubiertos
                        </div>}
                        {c.valor&&<div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:MO,fontWeight:500}}>
                          <i className="ti ti-currency-dollar" style={{fontSize:12}}/>{fmtCOP(c.valor)}
                        </div>}
                      </div>
                    </div>
                    {/* Indicador dias */}
                    <div style={{textAlign:'center',flexShrink:0,padding:'10px 14px',borderRadius:10,background:dias<0?RO_BG:dias<=30?RO_BG:dias<=90?NA_BG:VE_BG,border:`0.5px solid ${dias<0?RO:dias<=30?RO:dias<=90?NA:VE}30`}}>
                      <div style={{fontSize:22,fontWeight:600,color:dias<0?RO:dias<=30?RO:dias<=90?NA:VE,lineHeight:1}}>{dias<0?Math.abs(dias):dias}</div>
                      <div style={{fontSize:9,color:dias<0?RO:dias<=30?RO:dias<=90?NA:VE,marginTop:2}}>{dias<0?'dias venc.':'dias rest.'}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PROVEEDORES */}
        {tab==='proveedores'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {loading?(
              Array.from({length:4}).map((_,i)=><div key={i} style={{height:160,background:'#F8F9FA',borderRadius:12,border:'0.5px solid #E4E4E7'}}/>)
            ):proveedores.map((p:any)=>{
              const contsProv=contratos.filter((c:any)=>c.proveedor_nombre===p.nombre)
              const isSel=selProv?.id===p.id
              return(
                <div key={p.id} onClick={()=>setSelProv(isSel?null:p)} style={{background:'#fff',borderRadius:12,border:`0.5px solid ${isSel?AZ:'#E4E4E7'}`,padding:'16px',cursor:'pointer',transition:'all 0.15s',boxShadow:isSel?'0 0 0 2px '+AZ+'40':'none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <i className="ti ti-building" style={{fontSize:22,color:AZ}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,color:'#18181B',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</div>
                      <div style={{fontSize:11,color:GR}}>NIT: {p.nit||'—'}</div>
                      {p.ciudad&&<div style={{fontSize:11,color:'#A1A1AA'}}>{p.ciudad}</div>}
                    </div>
                  </div>
                  {p.especialidad&&(
                    <div style={{padding:'6px 10px',borderRadius:6,background:'#FAFAFA',border:'0.5px solid #E4E4E7',fontSize:11,color:GR,marginBottom:10}}>{p.especialidad}</div>
                  )}
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {p.contacto_nombre&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:GR}}>
                      <i className="ti ti-user" style={{fontSize:12,color:'#A1A1AA'}}/>{p.contacto_nombre}
                    </div>}
                    {p.contacto_telefono&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:GR}}>
                      <i className="ti ti-phone" style={{fontSize:12,color:'#A1A1AA'}}/>{p.contacto_telefono}
                    </div>}
                    {p.contacto_email&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:AZ}}>
                      <i className="ti ti-mail" style={{fontSize:12}}/>{p.contacto_email}
                    </div>}
                  </div>
                  {contsProv.length>0&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:11,color:GR}}>{contsProv.length} contrato{contsProv.length>1?'s':''}</span>
                      <span style={{fontSize:11,fontWeight:500,color:MO}}>{fmtCOP(contsProv.reduce((s:number,c:any)=>s+(c.valor||0),0))}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Panel detalle contrato */}
        {selCont&&tab==='contratos'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px',position:'sticky',top:20}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>Detalle del contrato</div>
                <button onClick={()=>setSelCont(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:18}}>×</button>
              </div>
              <TipoBadge tipo={selCont.tipo}/>
              <div style={{fontSize:15,fontWeight:500,color:'#18181B',margin:'8px 0 2px'}}>{selCont.proveedor_nombre}</div>
              <div style={{fontSize:12,color:GR,marginBottom:14}}>{selCont.numero}</div>
              {[
                {l:'Descripcion',v:selCont.descripcion},
                {l:'Periodo',v:`${fmtFecha(selCont.fecha_inicio)} → ${fmtFecha(selCont.fecha_fin)}`},
                {l:'Valor contrato',v:fmtCOP(selCont.valor)},
                {l:'Equipos cubiertos',v:selCont.equipos_cubiertos?`${selCont.equipos_cubiertos} equipos`:'—'},
                {l:'Contacto',v:selCont.contacto_nombre||'—'},
                {l:'Telefono',v:selCont.contacto_telefono||'—'},
              ].map(item=>(
                <div key={item.l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid #F4F4F5',fontSize:12}}>
                  <span style={{color:'#A1A1AA'}}>{item.l}</span>
                  <span style={{fontWeight:500,color:'#18181B',textAlign:'right',maxWidth:'60%'}}>{item.v||'—'}</span>
                </div>
              ))}
              {selCont.cobertura&&(
                <div style={{marginTop:12,padding:'10px',borderRadius:8,background:AZ_BG,border:`0.5px solid ${AZ}30`}}>
                  <div style={{fontSize:10,color:AZ,fontWeight:500,marginBottom:4}}>COBERTURA</div>
                  <div style={{fontSize:11,color:'#1e40af',lineHeight:1.5}}>{selCont.cobertura}</div>
                </div>
              )}
              <div style={{marginTop:14,display:'flex',gap:8}}>
                <button onClick={()=>{
                  const msg=`Estimado/a equipo,\n\nLes recordamos que el contrato *${selCont.numero}* con ${selCont.proveedor_nombre} vence el ${fmtFecha(selCont.fecha_fin)} (${diasRestantes(selCont.fecha_fin)} dias restantes).\n\nPor favor gestionar la renovacion a la brevedad.\n\nSYNAP — Gestion Biomedica`
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')
                }} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px',borderRadius:8,border:'none',background:'#25D366',color:'#fff',fontSize:11,cursor:'pointer'}}>
                  <i className="ti ti-brand-whatsapp" style={{fontSize:13}}/> Alertar vencimiento
                </button>
                <button onClick={async()=>{
                  const nuevoEstado=selCont.estado==='activo'?'vencido':'activo'
                  const r=await fetch('/api/contratos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({tabla:'contratos',id:selCont.id,data:{estado:nuevoEstado}})})
                  const d=await r.json()
                  if(d.result){setData((p:any)=>({...p,contratos:p.contratos.map((c:any)=>c.id===selCont.id?d.result:c)}));setSelCont(d.result)}
                }} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:GR,fontSize:11,cursor:'pointer'}}>
                  <i className="ti ti-refresh" style={{fontSize:13}}/> {selCont.estado==='activo'?'Marcar vencido':'Reactivar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel detalle proveedor */}
        {selProv&&tab==='proveedores'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'18px',position:'sticky',top:20}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>Detalle del proveedor</div>
                <button onClick={()=>setSelProv(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:18}}>×</button>
              </div>
              <div style={{width:52,height:52,borderRadius:12,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
                <i className="ti ti-building" style={{fontSize:26,color:AZ}}/>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:'#18181B',marginBottom:2}}>{selProv.nombre}</div>
              <div style={{fontSize:12,color:GR,marginBottom:14}}>NIT: {selProv.nit||'—'} · {selProv.ciudad}</div>
              {selProv.especialidad&&<div style={{padding:'8px 10px',borderRadius:8,background:'#FAFAFA',fontSize:12,color:GR,marginBottom:12}}>{selProv.especialidad}</div>}
              {[
                {l:'Contacto',v:selProv.contacto_nombre,icon:'ti-user'},
                {l:'Telefono',v:selProv.contacto_telefono,icon:'ti-phone'},
                {l:'Email',v:selProv.contacto_email,icon:'ti-mail'},
              ].map(item=>(
                <div key={item.l} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'0.5px solid #F4F4F5',fontSize:12}}>
                  <i className={'ti '+item.icon} style={{fontSize:13,color:'#A1A1AA',flexShrink:0}}/>
                  <span style={{color:'#A1A1AA',minWidth:60}}>{item.l}</span>
                  <span style={{fontWeight:500,color:'#18181B'}}>{item.v||'—'}</span>
                </div>
              ))}
              {/* Contratos del proveedor */}
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Contratos vigentes</div>
                {contratos.filter((c:any)=>c.proveedor_nombre===selProv.nombre).map((c:any)=>(
                  <div key={c.id} style={{padding:'8px 10px',borderRadius:8,background:'#FAFAFA',border:'0.5px solid #E4E4E7',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:'#18181B'}}>{c.numero||'Sin numero'}</div>
                      <div style={{fontSize:10,color:'#A1A1AA'}}>{fmtFecha(c.fecha_fin)}</div>
                    </div>
                    <EstadoBadge estado={c.estado} dias={diasRestantes(c.fecha_fin)}/>
                  </div>
                ))}
                {contratos.filter((c:any)=>c.proveedor_nombre===selProv.nombre).length===0&&(
                  <div style={{fontSize:11,color:'#A1A1AA',textAlign:'center',padding:'12px'}}>Sin contratos registrados</div>
                )}
              </div>
              <div style={{marginTop:14,display:'flex',gap:8}}>
                {selProv.contacto_telefono&&<button onClick={()=>window.open(`https://wa.me/57${selProv.contacto_telefono.replace(/\D/g,'')}?text=${encodeURIComponent('Hola '+selProv.contacto_nombre+', le contactamos desde SYNAP - IPS Demo.')}`,'_blank')} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px',borderRadius:8,border:'none',background:'#25D366',color:'#fff',fontSize:11,cursor:'pointer'}}>
                  <i className="ti ti-brand-whatsapp" style={{fontSize:13}}/> WhatsApp
                </button>}
                {selProv.contacto_email&&<button onClick={()=>window.open(`mailto:${selProv.contacto_email}`)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',color:GR,fontSize:11,cursor:'pointer'}}>
                  <i className="ti ti-mail" style={{fontSize:13}}/> Email
                </button>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal nuevo contrato */}
      {showCrearCont&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setShowCrearCont(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:500,color:'#18181B'}}>Nuevo contrato</div>
              <button onClick={()=>setShowCrearCont(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:22}}>×</button>
            </div>
            {/* Tipo */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:8}}>Tipo *</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {TIPOS.map(t=>(
                  <button key={t.v} onClick={()=>setNuevoCont(p=>({...p,tipo:t.v}))} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,border:`0.5px solid ${nuevoCont.tipo===t.v?t.c:'#E4E4E7'}`,background:nuevoCont.tipo===t.v?t.bg:'#fff',cursor:'pointer',fontSize:11,color:nuevoCont.tipo===t.v?t.c:GR,fontWeight:nuevoCont.tipo===t.v?500:400}}>
                    <i className={'ti '+t.icon} style={{fontSize:12}}/>{t.l}
                  </button>
                ))}
              </div>
            </div>
            {/* Campos */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              {[
                {k:'proveedor_nombre',l:'Proveedor *',ph:'Nombre del proveedor',full:true},
                {k:'numero',l:'Numero de contrato',ph:'Ej: CONT-2025-001'},
                {k:'valor',l:'Valor COP',ph:'Ej: 85000000'},
                {k:'fecha_inicio',l:'Fecha inicio *',ph:'',type:'date'},
                {k:'fecha_fin',l:'Fecha fin *',ph:'',type:'date'},
                {k:'equipos_cubiertos',l:'Equipos cubiertos',ph:'Cantidad de equipos'},
                {k:'contacto_nombre',l:'Contacto',ph:'Nombre del contacto'},
                {k:'contacto_telefono',l:'Telefono contacto',ph:'Celular o extension'},
              ].map(f=>(
                <div key={f.k} style={{gridColumn:(f as any).full?'1/-1':'auto'}}>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:5}}>{f.l}</div>
                  <input type={(f as any).type||'text'} value={(nuevoCont as any)[f.k]} onChange={e=>setNuevoCont(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:'100%',height:34,fontSize:12}}/>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:5}}>Descripcion</div>
              <textarea value={nuevoCont.descripcion} onChange={e=>setNuevoCont(p=>({...p,descripcion:e.target.value}))} placeholder="Descripcion del contrato..." rows={2} style={{width:'100%',fontSize:12,borderRadius:8,padding:'8px 10px',border:'0.5px solid #E4E4E7',resize:'none'}}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:5}}>Cobertura y condiciones</div>
              <textarea value={nuevoCont.cobertura} onChange={e=>setNuevoCont(p=>({...p,cobertura:e.target.value}))} placeholder="Que incluye el contrato, SLA, condiciones especiales..." rows={2} style={{width:'100%',fontSize:12,borderRadius:8,padding:'8px 10px',border:'0.5px solid #E4E4E7',resize:'none'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowCrearCont(false)} style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={crearContrato} disabled={!nuevoCont.proveedor_nombre||!nuevoCont.fecha_inicio||!nuevoCont.fecha_fin||guardando} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:!nuevoCont.proveedor_nombre||!nuevoCont.fecha_inicio||!nuevoCont.fecha_fin?'#F4F4F5':AZ,color:!nuevoCont.proveedor_nombre||!nuevoCont.fecha_inicio||!nuevoCont.fecha_fin?'#A1A1AA':'#fff',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                {guardando?'Guardando...':'Crear contrato'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo proveedor */}
      {showCrearProv&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setShowCrearProv(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:500,color:'#18181B'}}>Nuevo proveedor</div>
              <button onClick={()=>setShowCrearProv(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#A1A1AA',fontSize:22}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {[
                {k:'nombre',l:'Nombre empresa *',ph:'Razon social',full:true},
                {k:'nit',l:'NIT',ph:'900123456-1'},
                {k:'ciudad',l:'Ciudad',ph:'Bogota'},
                {k:'contacto_nombre',l:'Contacto principal',ph:'Nombre completo',full:true},
                {k:'contacto_telefono',l:'Telefono',ph:'3001234567'},
                {k:'contacto_email',l:'Email',ph:'contacto@empresa.com'},
                {k:'especialidad',l:'Especialidad',ph:'Tipos de equipos que atiende',full:true},
                {k:'notas',l:'Notas',ph:'Observaciones adicionales',full:true},
              ].map(f=>(
                <div key={f.k} style={{gridColumn:(f as any).full?'1/-1':'auto'}}>
                  <div style={{fontSize:11,fontWeight:500,color:GR,marginBottom:5}}>{f.l}</div>
                  <input value={(nuevoProv as any)[f.k]} onChange={e=>setNuevoProv(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:'100%',height:34,fontSize:12}}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowCrearProv(false)} style={{flex:1,padding:'11px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={crearProveedor} disabled={!nuevoProv.nombre||guardando} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:!nuevoProv.nombre?'#F4F4F5':AZ,color:!nuevoProv.nombre?'#A1A1AA':'#fff',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                {guardando?'Guardando...':'Crear proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
