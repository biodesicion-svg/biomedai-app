'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const AZ='#1B2B5B',CY='#00B4D8',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'

const fmt=(n:number)=>n>=1000000?'$'+(n/1000000).toFixed(1)+'M':n>=1000?'$'+Math.round(n/1000)+'K':'$'+Math.round(n)
const fmtCOP=(n:number)=>'$'+Math.round(n).toLocaleString('es-CO')+' COP'
const fmtFecha=(s:string)=>{ if(!s) return '—'; const d=new Date(s); return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) }

const VIDA_UTIL:Record<string,number>={monitor:8,ventilador:12,desfibrilador:10,bomba:8,incubadora:12,autoclave:12,ecografo:8,rayos:12,electrobisturi:8,glucometro:4,oximetro:6,nebulizador:4,anestesia:12,dialisis:12,cama:12}
function getVU(nombre:string,vidaUtilAnos:number|null):number{
  if(vidaUtilAnos) return vidaUtilAnos
  const n=nombre.toLowerCase()
  for(const[k,v] of Object.entries(VIDA_UTIL)) if(n.includes(k)) return v
  return 8
}

function Card({children,style={}}:any){
  return <div style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:12,padding:16,...style}}>{children}</div>
}
function Sk({h=24,w='100%'}:any){
  return <div style={{height:h,width:w,background:'#F1F5F9',borderRadius:6}}/>
}
function Badge({label,color,bg}:any){
  return <span style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:20,background:bg,color,display:'inline-block'}}>{label}</span>
}
function KpiCard({label,val,unit='',sub,color=AZ}:any){
  return (
    <Card style={{padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:500,color:GR,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:500,color,lineHeight:1,marginBottom:4}}>{val}<span style={{fontSize:12,marginLeft:3,opacity:0.7}}>{unit}</span></div>
      <div style={{fontSize:10,color:'#A1A1AA'}}>{sub}</div>
    </Card>
  )
}

export default function EquipoDetallePage(){
  const params=useParams()
  const[equipo,setEquipo]=useState<any>(null)
  const[mants,setMants]=useState<any[]>([])
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState('info')

  useEffect(()=>{
    async function cargar(){
      const sb=createClient()
      const{data:eq}=await sb.from('equipos').select('*').eq('id',params.id).single()
      if(eq) setEquipo(eq)
      const{data:mn}=await sb.from('mantenimientos').select('*').eq('equipo_id',params.id).order('fecha_realizado',{ascending:false})
      setMants(mn||[])
      setLoading(false)
    }
    cargar()
  },[params.id])

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#fff'}}>
      <i className="ti ti-loader-2" style={{fontSize:32,color:AZ,animation:'spin 1s linear infinite'}}/>
    </div>
  )
  if(!equipo) return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#fff',gap:12}}>
      <i className="ti ti-alert-triangle" style={{fontSize:40,color:NA}}/>
      <div style={{fontSize:14,color:GR}}>Equipo no encontrado</div>
      <Link href="/inventario" style={{fontSize:12,color:AZ,textDecoration:'none'}}>← Volver al inventario</Link>
    </div>
  )

  const anioHoy=new Date().getFullYear()
  const vu=getVU(equipo.nombre||'',equipo.vida_util_anos)
  const anioAdq=equipo.anio_adquisicion||null
  const edad=anioAdq?anioHoy-anioAdq:null
  const pctVida=edad?Math.min(Math.round((edad/vu)*100),100):null

  const preventivos=mants.filter(m=>m.tipo==='preventivo')
  const correctivos=mants.filter(m=>m.tipo==='correctivo')
  const calibraciones=mants.filter(m=>m.tipo==='calibracion')
  const costoTotal=mants.reduce((s,m)=>s + +(m.costo_total||0),0)
  const costoPrev=preventivos.reduce((s,m)=>s + +(m.costo_total||0),0)
  const costoCorr=correctivos.reduce((s,m)=>s + +(m.costo_total||0),0)
  const durs=mants.filter(m=>m.duracion_horas&&+m.duracion_horas>0).map(m=>+m.duracion_horas)
  const mttr=durs.length>0?(durs.reduce((a,b)=>a+b,0)/durs.length).toFixed(1):'N/D'
  const ratioPC=correctivos.length>0?(preventivos.length/correctivos.length).toFixed(1):'N/D'
  const conHallazgos=mants.filter(m=>m.hallazgos&&m.hallazgos.trim()!=='').length

  const rColor=equipo.riesgo==='alto'?RO:equipo.riesgo==='medio'?NA:VE
  const rBg=equipo.riesgo==='alto'?RO_BG:equipo.riesgo==='medio'?NA_BG:VE_BG
  const eColor=equipo.estado==='operativo'?VE:equipo.estado==='baja'?GR:equipo.estado==='en_mantenimiento'?NA:RO
  const eBg=equipo.estado==='operativo'?VE_BG:equipo.estado==='baja'?'#F4F4F5':equipo.estado==='en_mantenimiento'?NA_BG:RO_BG

  const TABS=[
    {id:'info',      label:'Informacion',  icon:'ti-clipboard-list'},
    {id:'historial', label:'Historial',    icon:'ti-history'},
    {id:'kpis',      label:'KPIs',         icon:'ti-chart-bar'},
    {id:'costos',    label:'Costos',       icon:'ti-currency-dollar'},
    {id:'documentos',label:'Documentos',   icon:'ti-files'},
  ]

  function QRBoton({equipoId,nombre,codigo}:{equipoId:string,nombre:string,codigo:string}){
    const[qr,setQr]=useState('')
    const[show,setShow]=useState(false)
    async function gen(){
      if(qr){setShow(true);return}
      const r=await fetch(`/api/qr?id=${equipoId}&nombre=${encodeURIComponent(nombre)}&codigo=${encodeURIComponent(codigo||'')}`)
      const d=await r.json()
      if(d.qr){setQr(d.qr);setShow(true)}
    }
    return(
      <>
        <button onClick={gen} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#F8F9FA',fontSize:12,color:AZ,cursor:'pointer'}}>
          <i className="ti ti-qrcode" style={{fontSize:13}}/> Ver QR
        </button>
        {show&&qr&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={()=>setShow(false)}>
            <div style={{background:'#fff',borderRadius:16,padding:24,textAlign:'center',maxWidth:280}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:14,fontWeight:500,color:'#18181B',marginBottom:4}}>{nombre}</div>
              <div style={{fontSize:11,color:GR,marginBottom:12}}>{codigo}</div>
              <img src={qr} style={{width:200,height:200,borderRadius:8,border:'1px solid #E4E4E7'}}/>
              <div style={{fontSize:11,color:GR,marginTop:10,marginBottom:14}}>Escanea para abrir la hoja de vida</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShow(false)} style={{flex:1,padding:'8px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:12,cursor:'pointer',color:GR}}>Cerrar</button>
                <button onClick={()=>{const a=document.createElement('a');a.href=qr;a.download=`QR_${codigo}.png`;a.click()}} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,cursor:'pointer'}}>Descargar</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#FAFAFA'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',gap:14}}>
        <Link href="/inventario" style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#F8F9FA',textDecoration:'none',fontSize:12,color:GR,flexShrink:0}}>
          <i className="ti ti-arrow-left" style={{fontSize:13}}/> Inventario
        </Link>
        <QRBoton equipoId={equipo.id} nombre={equipo.nombre} codigo={equipo.codigo_inventario}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>{equipo.codigo_inventario} · {equipo.servicio||'Sin servicio'}</div>
          <h1 style={{fontSize:17,fontWeight:500,color:'#18181B',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{equipo.nombre}</h1>
        </div>
        <div style={{display:'flex',gap:8,flexShrink:0}}>
          <Badge label={`Riesgo ${equipo.riesgo||'N/D'}`} color={rColor} bg={rBg}/>
          <Badge label={equipo.estado?.replace('_',' ')||'N/D'} color={eColor} bg={eBg}/>
          {equipo.clase_invima&&<Badge label={`Clase ${equipo.clase_invima}`} color={AZ} bg={AZ_BG}/>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'0 28px',display:'flex',gap:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'10px 14px',border:'none',borderBottom:tab===t.id?`2px solid ${AZ}`:'2px solid transparent',background:'transparent',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?500:400,color:tab===t.id?AZ:GR,transition:'all 0.15s'}}>
            <i className={'ti '+t.icon} style={{fontSize:13}}/>{t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:'20px 28px',display:'flex',flexDirection:'column',gap:14,maxWidth:1100}}>

        {/* ── INFO ── */}
        {tab==='info'&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:12,fontWeight:500,color:AZ,marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
                  <i className="ti ti-clipboard-data" style={{fontSize:15}}/> Datos del equipo
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {[
                    ['Nombre',equipo.nombre],
                    ['Tipo',equipo.tipo],
                    ['Marca',equipo.marca||'—'],
                    ['Modelo',equipo.modelo||'—'],
                    ['Serie',equipo.serie||'—'],
                    ['Codigo inventario',equipo.codigo_inventario||'—'],
                    ['Clase INVIMA',equipo.clase_invima||'—'],
                    ['Clasificacion riesgo',equipo.riesgo||'—'],
                    ['Servicio',equipo.servicio||'—'],
                    ['Ubicacion',equipo.ubicacion||'—'],
                    ['Estado',equipo.estado?.replace('_',' ')||'—'],
                    ['Notas',equipo.notas||'—'],
                  ].map(([k,v])=>(
                    <div key={k} style={{padding:'8px 0',borderBottom:'0.5px solid #F4F4F5'}}>
                      <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <Card>
                  <div style={{fontSize:12,fontWeight:500,color:AZ,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-calendar" style={{fontSize:15}}/> Adquisicion
                  </div>
                  {[
                    ['Año adquisicion',equipo.anio_adquisicion||'—'],
                    ['Año fabricacion',equipo.anio_fabricacion||'—'],
                    ['Vida util estimada',equipo.vida_util_anos?equipo.vida_util_anos+' años':vu+' años (std OMS)'],
                    ['Garantia',equipo.garantia||'—'],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid #F4F4F5',fontSize:12}}>
                      <span style={{color:'#A1A1AA'}}>{k}</span>
                      <span style={{fontWeight:500,color:'#18181B'}}>{v}</span>
                    </div>
                  ))}
                  {equipo.valor_adquisicion&&(
                    <div style={{marginTop:10,padding:'10px',borderRadius:8,background:AZ_BG}}>
                      <div style={{fontSize:10,color:GR,marginBottom:2}}>Valor de adquisicion</div>
                      <div style={{fontSize:18,fontWeight:500,color:AZ}}>{fmtCOP(equipo.valor_adquisicion)}</div>
                    </div>
                  )}
                </Card>
                <Card>
                  <div style={{fontSize:12,fontWeight:500,color:AZ,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-clock-hour-4" style={{fontSize:15}}/> Vida util
                  </div>
                  {pctVida!==null?(
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                        <span style={{color:GR}}>{edad} años en uso de {vu}</span>
                        <span style={{fontWeight:600,color:pctVida>=80?RO:pctVida>=60?NA:VE}}>{pctVida}%</span>
                      </div>
                      <div style={{height:8,background:'#F1F5F9',borderRadius:4,overflow:'hidden',marginBottom:8}}>
                        <div style={{height:8,borderRadius:4,background:pctVida>=80?RO:pctVida>=60?NA:VE,width:`${pctVida}%`}}/>
                      </div>
                      <Badge label={pctVida>=80?'Critico — reemplazar':pctVida>=60?'En advertencia':'Vida util saludable'} color={pctVida>=80?RO:pctVida>=60?NA:VE} bg={pctVida>=80?RO_BG:pctVida>=60?NA_BG:VE_BG}/>
                    </>
                  ):(
                    <div style={{padding:'10px',borderRadius:8,background:NA_BG,fontSize:11,color:NA}}>
                      Ingresa el año de adquisicion para ver el porcentaje de vida util consumida
                    </div>
                  )}
                </Card>
                <Card>
                  <div style={{fontSize:12,fontWeight:500,color:AZ,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-tool" style={{fontSize:15}}/> Resumen mantenimiento
                  </div>
                  {[
                    ['Total intervenciones',mants.length],
                    ['Preventivos',preventivos.length],
                    ['Correctivos',correctivos.length],
                    ['Calibraciones',calibraciones.length],
                    ['Costo total',mants.length>0?fmt(costoTotal):'Sin datos'],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid #F4F4F5',fontSize:12}}>
                      <span style={{color:'#A1A1AA'}}>{k}</span>
                      <span style={{fontWeight:500,color:'#18181B'}}>{v}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </>
        )}

        {/* ── HISTORIAL ── */}
        {tab==='historial'&&(
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{mants.length} intervenciones registradas</div>
              <div style={{display:'flex',gap:8}}>
                {[
                  {label:'Todos',val:'todos'},
                  {label:'Preventivos',val:'preventivo'},
                  {label:'Correctivos',val:'correctivo'},
                  {label:'Calibraciones',val:'calibracion'},
                ].map(f=>(
                  <button key={f.val} style={{padding:'5px 12px',borderRadius:20,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:11,cursor:'pointer',color:GR}}>{f.label}</button>
                ))}
              </div>
            </div>
            {mants.length===0?(
              <Card style={{textAlign:'center',padding:'48px'}}>
                <i className="ti ti-history" style={{fontSize:40,color:'#E4E4E7',display:'block',marginBottom:10}}/>
                <div style={{fontSize:13,color:GR,marginBottom:4}}>Sin historial de mantenimiento</div>
                <div style={{fontSize:11,color:'#A1A1AA'}}>Las intervenciones registradas apareceran aqui</div>
              </Card>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {mants.map((m,i)=>{
                  const tc=m.tipo==='preventivo'?{c:VE,bg:VE_BG}:m.tipo==='correctivo'?{c:RO,bg:RO_BG}:{c:'#7C3AED',bg:'#EDE9FE'}
                  return(
                    <Card key={m.id||i} style={{padding:'14px 18px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                        <div style={{width:40,height:40,borderRadius:10,background:tc.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className={`ti ${m.tipo==='preventivo'?'ti-shield-check':m.tipo==='correctivo'?'ti-alert-triangle':'ti-ruler-measure'}`} style={{fontSize:18,color:tc.c}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                            <Badge label={m.tipo} color={tc.c} bg={tc.bg}/>
                            <Badge label={m.estado||'completado'} color={m.estado==='completado'?VE:NA} bg={m.estado==='completado'?VE_BG:NA_BG}/>
                            <span style={{fontSize:11,color:'#A1A1AA'}}>
                              {m.fecha_realizado?fmtFecha(m.fecha_realizado):m.fecha_programada?'Prog. '+fmtFecha(m.fecha_programada):'Sin fecha'}
                            </span>
                            {m.duracion_horas&&<span style={{fontSize:11,color:'#A1A1AA'}}><i className="ti ti-clock" style={{fontSize:11}}/> {m.duracion_horas}h</span>}
                          </div>
                          {m.descripcion&&<div style={{fontSize:12,color:'#52525B',marginBottom:4}}>{m.descripcion}</div>}
                          {m.hallazgos&&(
                            <div style={{padding:'6px 10px',borderRadius:6,background:NA_BG,border:`0.5px solid ${NA}30`,fontSize:11,color:'#92400E',marginBottom:4}}>
                              <b>Hallazgo:</b> {m.hallazgos}
                            </div>
                          )}
                          {m.repuesto_usado&&(
                            <div style={{padding:'6px 10px',borderRadius:6,background:AZ_BG,border:`0.5px solid ${AZ}30`,fontSize:11,color:AZ}}>
                              <i className="ti ti-package" style={{fontSize:11}}/> <b>Repuesto:</b> {m.repuesto_usado}
                            </div>
                          )}
                        </div>
                        {m.costo_total&&+m.costo_total>0&&(
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:14,fontWeight:500,color:'#18181B'}}>{fmt(+m.costo_total)}</div>
                            <div style={{fontSize:10,color:'#A1A1AA'}}>COP</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── KPIs ── */}
        {tab==='kpis'&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <KpiCard label="Total intervenciones" val={mants.length} sub="Historial completo" color={AZ}/>
              <KpiCard label="Ratio Prev/Corr" val={ratioPC} unit=":1" sub="Meta minimo 4:1" color={ratioPC==='N/D'?GR:+ratioPC>=4?VE:+ratioPC>=2?NA:RO}/>
              <KpiCard label="MTTR promedio" val={mttr} unit="h" sub="Tiempo medio de reparacion" color={mttr==='N/D'?GR:+mttr<=4?VE:NA}/>
              <KpiCard label="Tasa de hallazgos" val={mants.length>0?Math.round((conHallazgos/mants.length)*100):0} unit="%" sub={`${conHallazgos} de ${mants.length} OTs documentadas`} color={AZ}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              <KpiCard label="Preventivos" val={preventivos.length} sub={`${mants.length>0?Math.round((preventivos.length/mants.length)*100):0}% del total`} color={VE}/>
              <KpiCard label="Correctivos" val={correctivos.length} sub={`${mants.length>0?Math.round((correctivos.length/mants.length)*100):0}% del total`} color={correctivos.length>preventivos.length?RO:NA}/>
              <KpiCard label="Calibraciones" val={calibraciones.length} sub={`${mants.length>0?Math.round((calibraciones.length/mants.length)*100):0}% del total`} color='#7C3AED'/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Card>
                <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                  <i className="ti ti-chart-bar" style={{fontSize:15,color:AZ}}/> Distribucion por tipo
                </div>
                {[
                  {label:'Preventivo',val:preventivos.length,color:VE,bg:VE_BG},
                  {label:'Correctivo',val:correctivos.length,color:RO,bg:RO_BG},
                  {label:'Calibracion',val:calibraciones.length,color:'#7C3AED',bg:'#EDE9FE'},
                ].map(item=>(
                  <div key={item.label} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                      <span style={{color:GR}}>{item.label}</span>
                      <span style={{fontWeight:500,color:'#18181B'}}>{item.val} ({mants.length>0?Math.round((item.val/mants.length)*100):0}%)</span>
                    </div>
                    <div style={{height:7,background:'#F4F4F5',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:7,borderRadius:4,background:item.color,width:`${mants.length>0?Math.round((item.val/mants.length)*100):0}%`}}/>
                    </div>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                  <i className="ti ti-stethoscope" style={{fontSize:15,color:AZ}}/> Diagnostico del equipo
                </div>
                {[
                  {
                    check: mants.length>=2,
                    ok: preventivos.length>=correctivos.length,
                    label: 'Balance PM vs correctivos',
                    desc: preventivos.length>=correctivos.length?'El programa preventivo supera los correctivos':'Los correctivos superan a los preventivos',
                  },
                  {
                    check: true,
                    ok: correctivos.length===0,
                    label: 'Historial correctivos',
                    desc: correctivos.length===0?'Sin intervenciones correctivas registradas':`${correctivos.length} intervenciones correctivas`,
                  },
                  {
                    check: equipo.valor_adquisicion!=null,
                    ok: equipo.valor_adquisicion!=null,
                    label: 'Valor adquisicion registrado',
                    desc: equipo.valor_adquisicion?fmtCOP(equipo.valor_adquisicion):'Registra el valor para calcular CMR',
                  },
                  {
                    check: true,
                    ok: pctVida===null||pctVida<60,
                    label: 'Estado de vida util',
                    desc: pctVida===null?'Ingresa año de adquisicion':pctVida>=80?'Vida util critica — evaluar reemplazo':pctVida>=60?'En advertencia — planificar reemplazo':'Vida util saludable',
                  },
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 10px',borderRadius:8,background:item.ok?VE_BG:RO_BG,marginBottom:8,border:`0.5px solid ${item.ok?VE:RO}30`}}>
                    <i className={`ti ${item.ok?'ti-check':'ti-alert-triangle'}`} style={{fontSize:14,color:item.ok?VE:RO,flexShrink:0,marginTop:1}}/>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:'#18181B',marginBottom:1}}>{item.label}</div>
                      <div style={{fontSize:11,color:GR}}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </>
        )}

        {/* ── COSTOS ── */}
        {tab==='costos'&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <KpiCard label="Costo total historico" val={mants.length>0?fmt(costoTotal):'Sin datos'} sub="Suma de todas las intervenciones" color={AZ}/>
              <KpiCard label="Costo preventivos" val={preventivos.length>0?fmt(costoPrev):'Sin datos'} sub={`${costoTotal>0?Math.round((costoPrev/costoTotal)*100):0}% del total`} color={VE}/>
              <KpiCard label="Costo correctivos" val={correctivos.length>0?fmt(costoCorr):'Sin datos'} sub={`${costoTotal>0?Math.round((costoCorr/costoTotal)*100):0}% del total — meta <30%`} color={costoTotal>0&&costoCorr/costoTotal>0.3?RO:NA}/>
              <KpiCard label="CMR" val={equipo.valor_adquisicion&&costoTotal>0?((costoTotal/equipo.valor_adquisicion)*100).toFixed(1)+'%':'N/D'} sub="Costo mant / valor adquisicion" color={equipo.valor_adquisicion&&costoTotal>0?((costoTotal/equipo.valor_adquisicion)*100)<5?VE:((costoTotal/equipo.valor_adquisicion)*100)<10?NA:RO:GR}/>
            </div>
            <Card>
              <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-receipt" style={{fontSize:15,color:AZ}}/> Detalle de costos por intervencion
              </div>
              <div style={{fontSize:11,color:'#A1A1AA',marginBottom:14}}>Ordenado por fecha — mas reciente primero</div>
              {mants.filter(m=>m.costo_total&&+m.costo_total>0).length===0?(
                <div style={{textAlign:'center',padding:'32px',color:'#A1A1AA'}}>
                  <i className="ti ti-currency-dollar" style={{fontSize:32,display:'block',marginBottom:8,opacity:0.3}}/>
                  <div style={{fontSize:12}}>Sin costos registrados en las OTs</div>
                </div>
              ):(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F8F9FA'}}>
                      {['Fecha','Tipo','Descripcion','Costo MO','Costo Repuestos','Total'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',fontSize:10,fontWeight:500,color:GR,textAlign:'left',borderBottom:'0.5px solid #E4E4E7'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mants.filter(m=>m.costo_total&&+m.costo_total>0).map((m,i)=>{
                      const tc=m.tipo==='preventivo'?{c:VE,bg:VE_BG}:m.tipo==='correctivo'?{c:RO,bg:RO_BG}:{c:'#7C3AED',bg:'#EDE9FE'}
                      return(
                        <tr key={m.id||i} style={{borderBottom:'0.5px solid #F4F4F5',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'9px 12px',fontSize:11,color:GR,whiteSpace:'nowrap'}}>{fmtFecha(m.fecha_realizado||m.fecha_programada)}</td>
                          <td style={{padding:'9px 12px'}}><Badge label={m.tipo} color={tc.c} bg={tc.bg}/></td>
                          <td style={{padding:'9px 12px',fontSize:11,color:'#52525B',maxWidth:200}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.descripcion||'—'}</div>
                          </td>
                          <td style={{padding:'9px 12px',fontSize:11,color:GR}}>{m.costo_mano_obra?fmt(+m.costo_mano_obra):'—'}</td>
                          <td style={{padding:'9px 12px',fontSize:11,color:GR}}>{m.costo_repuestos?fmt(+m.costo_repuestos):'—'}</td>
                          <td style={{padding:'9px 12px',fontSize:12,fontWeight:500,color:'#18181B'}}>{fmt(+m.costo_total)}</td>
                        </tr>
                      )
                    })}
                    <tr style={{background:AZ_BG}}>
                      <td colSpan={5} style={{padding:'9px 12px',fontSize:12,fontWeight:500,color:AZ}}>Total acumulado</td>
                      <td style={{padding:'9px 12px',fontSize:13,fontWeight:600,color:AZ}}>{fmt(costoTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </Card>
            {equipo.valor_adquisicion&&costoTotal>0&&(
              <Card style={{background:costoTotal/equipo.valor_adquisicion<0.05?VE_BG:costoTotal/equipo.valor_adquisicion<0.1?NA_BG:RO_BG,border:`0.5px solid ${costoTotal/equipo.valor_adquisicion<0.05?VE:costoTotal/equipo.valor_adquisicion<0.1?NA:RO}40`}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <i className={`ti ${costoTotal/equipo.valor_adquisicion<0.1?'ti-check':'ti-alert-triangle'}`} style={{fontSize:20,color:costoTotal/equipo.valor_adquisicion<0.05?VE:costoTotal/equipo.valor_adquisicion<0.1?NA:RO}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:2}}>
                      CMR: {((costoTotal/equipo.valor_adquisicion)*100).toFixed(1)}% — {costoTotal/equipo.valor_adquisicion<0.05?'Equipo rentable':costoTotal/equipo.valor_adquisicion<0.1?'Monitorear costos':'Evaluar reemplazo'}
                    </div>
                    <div style={{fontSize:11,color:GR}}>
                      Costo acumulado {fmtCOP(costoTotal)} sobre valor de adquisicion {fmtCOP(equipo.valor_adquisicion)}. {costoTotal/equipo.valor_adquisicion>=0.1?'Un CMR mayor al 10% indica que puede ser mas economico reemplazar el equipo.':'El costo de mantenimiento esta dentro del rango aceptable.'}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab==='documentos'&&(
          <>
            <Card>
              <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-files" style={{fontSize:15,color:AZ}}/> Generar documentos del equipo
              </div>
              <div style={{fontSize:11,color:'#A1A1AA',marginBottom:16}}>Genera los documentos oficiales de este equipo con un clic. Los PDFs incluyen todos los datos registrados.</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  {tipo:'ficha',      label:'Ficha tecnica',                 icon:'ti-clipboard-data',   desc:'Especificaciones tecnicas'},
                  {tipo:'hoja',       label:'Hoja de vida',                  icon:'ti-file-description', desc:'Historial completo'},
                  {tipo:'cronograma', label:'Cronograma de mantenimiento',   icon:'ti-calendar-stats',   desc:'Programacion anual'},
                  {tipo:'protocolo',  label:'Protocolo de mantenimiento',    icon:'ti-list-check',        desc:'Procedimiento paso a paso'},
                  {tipo:'preinstalacion',label:'Requisitos pre-instalacion', icon:'ti-tool',              desc:'Condiciones de instalacion'},
                ].map(doc=>(
                  <button key={doc.tipo} onClick={async()=>{
                    const r=await fetch('/api/documentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tipo:doc.tipo,nombre:equipo.nombre,marca:equipo.marca||'N/D',modelo:equipo.modelo||'N/D',referencia:equipo.codigo_inventario||'N/D',serial:equipo.serie||'N/D',servicio:equipo.servicio||'N/D'})})
                    const d=await r.json()
                    if(d.url){const a=document.createElement('a');a.href=d.url;a.download=d.nombre;a.click()}
                  }}
                  style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8,padding:'14px',borderRadius:10,border:'0.5px solid #E4E4E7',background:'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=AZ;e.currentTarget.style.background=AZ_BG}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E4E4E7';e.currentTarget.style.background='#fff'}}>
                    <div style={{width:36,height:36,borderRadius:8,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className={'ti '+doc.icon} style={{fontSize:18,color:AZ}}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:2}}>{doc.label}</div>
                      <div style={{fontSize:10,color:'#A1A1AA'}}>{doc.desc}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:AZ,marginTop:'auto'}}>
                      <i className="ti ti-file-type-pdf" style={{fontSize:12}}/> Generar PDF
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-upload" style={{fontSize:15,color:AZ}}/> Documentos cargados
              </div>
              <div style={{textAlign:'center',padding:'32px',color:'#A1A1AA',border:'1.5px dashed #E4E4E7',borderRadius:10}}>
                <i className="ti ti-cloud-upload" style={{fontSize:36,display:'block',marginBottom:8,opacity:0.3}}/>
                <div style={{fontSize:12,marginBottom:4}}>Arrastra archivos aqui o haz clic para cargar</div>
                <div style={{fontSize:11}}>Manual del fabricante, registro INVIMA, declaracion de importacion</div>
              </div>
            </Card>
          </>
        )}

      </div>
    </div>
  )
}
