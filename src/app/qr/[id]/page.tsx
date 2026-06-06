'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'

export default function QREquipoPage(){
  const params=useParams()
  const[equipo,setEquipo]=useState<any>(null)
  const[mants,setMants]=useState<any[]>([])
  const[loading,setLoading]=useState(true)

  useEffect(()=>{
    async function cargar(){
      const sb=createClient()
      const{data:eq}=await sb.from('equipos').select('*').eq('id',params.id).single()
      if(eq) setEquipo(eq)
      const{data:mn}=await sb.from('mantenimientos').select('*').eq('equipo_id',params.id).order('fecha_realizado',{ascending:false}).limit(5)
      setMants(mn||[])
      setLoading(false)
    }
    cargar()
  },[params.id])

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#fff'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:`3px solid ${AZ}`,borderTopColor:'transparent',borderRadius:'50%',margin:'0 auto 12px',animation:'spin 0.8s linear infinite'}}/>
        <div style={{fontSize:13,color:GR}}>Cargando hoja de vida...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if(!equipo) return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#fff',gap:12,padding:24}}>
      <i className="ti ti-alert-triangle" style={{fontSize:40,color:NA}}/>
      <div style={{fontSize:16,fontWeight:500,color:'#18181B'}}>Equipo no encontrado</div>
      <div style={{fontSize:13,color:GR}}>El codigo QR no corresponde a ningun equipo registrado</div>
    </div>
  )

  const rColor=equipo.riesgo==='alto'?RO:equipo.riesgo==='medio'?NA:VE
  const rBg=equipo.riesgo==='alto'?RO_BG:equipo.riesgo==='medio'?NA_BG:VE_BG
  const eColor=equipo.estado==='operativo'?VE:equipo.estado==='baja'?GR:NA
  const eBg=equipo.estado==='operativo'?VE_BG:equipo.estado==='baja'?'#F4F4F5':NA_BG
  const ultimoMant=mants[0]
  const fmtFecha=(s:string)=>{if(!s)return '—';const d=new Date(s);return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}

  return(
    <div style={{minHeight:'100vh',background:'#FAFAFA',fontFamily:'system-ui,sans-serif'}}>

      {/* Header SYNAP */}
      <div style={{background:AZ,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-activity" style={{fontSize:18,color:'#fff'}}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',lineHeight:1}}>SYNAP</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>Gestion Biomedica</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <span style={{fontSize:10,padding:'3px 8px',borderRadius:20,background:rBg,color:rColor,fontWeight:500}}>
            Riesgo {equipo.riesgo||'N/D'}
          </span>
          <span style={{fontSize:10,padding:'3px 8px',borderRadius:20,background:eBg,color:eColor,fontWeight:500}}>
            {equipo.estado?.replace('_',' ')||'N/D'}
          </span>
        </div>
      </div>

      <div style={{padding:'16px',maxWidth:480,margin:'0 auto'}}>

        {/* Nombre equipo */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px',marginBottom:12}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:4}}>{equipo.codigo_inventario}</div>
          <div style={{fontSize:20,fontWeight:600,color:'#18181B',marginBottom:4}}>{equipo.nombre}</div>
          <div style={{fontSize:13,color:GR}}>{equipo.servicio||'Sin servicio asignado'}</div>
          {equipo.clase_invima&&(
            <div style={{marginTop:8}}>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:AZ_BG,color:AZ,fontWeight:500}}>Clase {equipo.clase_invima} INVIMA</span>
            </div>
          )}
        </div>

        {/* Estado operativo */}
        <div style={{background:equipo.estado==='operativo'?VE_BG:equipo.estado==='baja'?'#F4F4F5':NA_BG,borderRadius:12,border:`0.5px solid ${eColor}40`,padding:'14px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:eColor+'20',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className={`ti ${equipo.estado==='operativo'?'ti-check':'ti-alert-triangle'}`} style={{fontSize:22,color:eColor}}/>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:eColor,textTransform:'capitalize'}}>{equipo.estado?.replace('_',' ')||'Sin estado'}</div>
            <div style={{fontSize:12,color:GR}}>{equipo.estado==='operativo'?'Equipo disponible para uso clinico':equipo.estado==='baja'?'Equipo retirado del inventario':'Equipo no disponible temporalmente'}</div>
          </div>
        </div>

        {/* Datos tecnicos */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:AZ,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-clipboard-data" style={{fontSize:14}}/> Datos tecnicos
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              ['Marca',equipo.marca||'—'],
              ['Modelo',equipo.modelo||'—'],
              ['Serie',equipo.serie||'—'],
              ['Ubicacion',equipo.ubicacion||'—'],
              ['Año fabricacion',equipo.anio_fabricacion||'—'],
              ['Riesgo',equipo.riesgo||'—'],
            ].map(([k,v])=>(
              <div key={k} style={{padding:'8px',borderRadius:8,background:'#FAFAFA',border:'0.5px solid #F4F4F5'}}>
                <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>{k}</div>
                <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ultimo mantenimiento */}
        {ultimoMant&&(
          <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px',marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:AZ,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
              <i className="ti ti-tool" style={{fontSize:14}}/> Ultimo mantenimiento
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px',borderRadius:8,background:ultimoMant.tipo==='preventivo'?VE_BG:ultimoMant.tipo==='correctivo'?RO_BG:NA_BG,border:`0.5px solid ${ultimoMant.tipo==='preventivo'?VE:ultimoMant.tipo==='correctivo'?RO:NA}30`}}>
              <i className={`ti ${ultimoMant.tipo==='preventivo'?'ti-shield-check':'ti-alert-triangle'}`} style={{fontSize:20,color:ultimoMant.tipo==='preventivo'?VE:RO,flexShrink:0}}/>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B',textTransform:'capitalize'}}>{ultimoMant.tipo}</div>
                <div style={{fontSize:11,color:GR}}>{fmtFecha(ultimoMant.fecha_realizado||ultimoMant.fecha_programada)}</div>
                {ultimoMant.descripcion&&<div style={{fontSize:11,color:GR,marginTop:2}}>{ultimoMant.descripcion.substring(0,60)}...</div>}
              </div>
              <div style={{marginLeft:'auto',textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:500,color:ultimoMant.estado==='completado'?VE:NA,textTransform:'capitalize'}}>{ultimoMant.estado}</div>
                {ultimoMant.costo_total&&+ultimoMant.costo_total>0&&<div style={{fontSize:11,color:GR}}>${Math.round(+ultimoMant.costo_total/1000)}K</div>}
              </div>
            </div>
          </div>
        )}

        {/* Historial rapido */}
        {mants.length>1&&(
          <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px',marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:AZ,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <i className="ti ti-history" style={{fontSize:14}}/> Historial ({mants.length} intervenciones)
            </div>
            {mants.slice(1,4).map((m,i)=>{
              const tc=m.tipo==='preventivo'?{c:VE,bg:VE_BG}:m.tipo==='correctivo'?{c:RO,bg:RO_BG}:{c:NA,bg:NA_BG}
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<2?'0.5px solid #F4F4F5':'none'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:tc.c,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:500,color:'#18181B',textTransform:'capitalize'}}>{m.tipo}</div>
                    <div style={{fontSize:10,color:GR}}>{fmtFecha(m.fecha_realizado||m.fecha_programada)}</div>
                  </div>
                  <span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:tc.bg,color:tc.c,textTransform:'capitalize'}}>{m.estado}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Alertas */}
        {equipo.riesgo==='alto'&&(
          <div style={{background:RO_BG,borderRadius:12,border:`0.5px solid ${RO}40`,padding:'12px 14px',marginBottom:12,display:'flex',gap:10}}>
            <i className="ti ti-alert-triangle" style={{fontSize:16,color:RO,flexShrink:0,marginTop:1}}/>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:RO,marginBottom:2}}>Equipo de alto riesgo — Clase {equipo.clase_invima}</div>
              <div style={{fontSize:11,color:'#991B1B'}}>Requiere mantenimiento preventivo semestral obligatorio segun Res. 4816/2008</div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:AZ,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-bolt" style={{fontSize:14}}/> Acciones rapidas
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <Link href={`/inventario/${equipo.id}`} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#FAFAFA',textDecoration:'none',color:'#18181B'}}>
              <div style={{width:36,height:36,borderRadius:8,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="ti ti-file-description" style={{fontSize:17,color:AZ}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>Ver hoja de vida completa</div>
                <div style={{fontSize:11,color:GR}}>Historial, KPIs, costos y documentos</div>
              </div>
              <i className="ti ti-chevron-right" style={{fontSize:14,color:'#A1A1AA'}}/>
            </Link>
            <button onClick={()=>{
              if(navigator.share){navigator.share({title:`${equipo.nombre} — SYNAP`,text:`Hoja de vida: ${equipo.nombre} | ${equipo.codigo_inventario}`,url:window.location.href})}
              else{navigator.clipboard.writeText(window.location.href);alert('Link copiado')}
            }} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#FAFAFA',cursor:'pointer',width:'100%',textAlign:'left'}}>
              <div style={{width:36,height:36,borderRadius:8,background:VE_BG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="ti ti-share" style={{fontSize:17,color:VE}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>Compartir este equipo</div>
                <div style={{fontSize:11,color:GR}}>Copiar link o compartir por WhatsApp</div>
              </div>
              <i className="ti ti-chevron-right" style={{fontSize:14,color:'#A1A1AA'}}/>
            </button>
            <button onClick={()=>{
              const msg=`Reporte de falla: *${equipo.nombre}*\nCodigo: ${equipo.codigo_inventario}\nServicio: ${equipo.servicio||'Sin servicio'}\n\nDescripcion del problema:`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')
            }} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#FAFAFA',cursor:'pointer',width:'100%',textAlign:'left'}}>
              <div style={{width:36,height:36,borderRadius:8,background:'#F0FFF4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="ti ti-brand-whatsapp" style={{fontSize:17,color:'#25D366'}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>Reportar falla por WhatsApp</div>
                <div style={{fontSize:11,color:GR}}>Envia reporte al equipo de biomedica</div>
              </div>
              <i className="ti ti-chevron-right" style={{fontSize:14,color:'#A1A1AA'}}/>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',padding:'8px',fontSize:10,color:'#A1A1AA'}}>
          SYNAP — Gestion Biomedica Inteligente · IPS Demo<br/>
          <span style={{fontSize:9}}>Escanea el codigo QR del equipo para acceder a esta pagina</span>
        </div>

      </div>
    </div>
  )
}
