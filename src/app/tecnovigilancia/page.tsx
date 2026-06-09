'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED',CI='#0891B2'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF',CI_BG='#ECFEFF'

function fmtFecha(s:string){
  if(!s) return '—'
  return new Date(s+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

function GravedadBadge({g}:any){
  if(g==='serio') return <span style={{fontSize:10,padding:'2px 10px',borderRadius:20,background:RO_BG,color:RO,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}><i className="ti ti-alert-triangle" style={{fontSize:11}}/>SERIO</span>
  return <span style={{fontSize:10,padding:'2px 10px',borderRadius:20,background:NA_BG,color:NA,fontWeight:700}}>NO SERIO</span>
}

function EstadoBadge({e}:any){
  const map:any={pendiente:{c:NA,bg:NA_BG,l:'Pendiente'},reportado_invima:{c:VE,bg:VE_BG,l:'Reportado INVIMA'},cerrado:{c:GR,bg:'#F4F4F5',l:'Cerrado'}}
  const s=map[e]||map.pendiente
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.c,fontWeight:600}}>{s.l}</span>
}

function TipoBadge({t}:any){
  const map:any={evento_adverso:{c:RO,bg:RO_BG,l:'Evento Adverso'},incidente_adverso:{c:NA,bg:NA_BG,l:'Incidente Adverso'},falla_funcionamiento:{c:MO,bg:MO_BG,l:'Falla Funcionamiento'}}
  const s=map[t]||{c:GR,bg:'#F4F4F5',l:t}
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.c,fontWeight:600}}>{s.l}</span>
}

function AlertaNivelBadge({n}:any){
  if(n==='alto') return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:RO_BG,color:RO,fontWeight:700}}>Riesgo Alto</span>
  if(n==='medio') return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:NA_BG,color:NA,fontWeight:700}}>Riesgo Medio</span>
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:VE_BG,color:VE,fontWeight:700}}>Riesgo Bajo</span>
}

function Contador72h({horas}:any){
  const restantes = 72 - horas
  const pct = Math.min((horas/72)*100,100)
  const color = horas>72?RO:horas>48?NA:VE
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height:6,background:'#F1F5F9',borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:3,transition:'width 0.3s'}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color,minWidth:60}}>
        {horas>72?`+${horas-72}h vencido`:`${restantes}h restantes`}
      </span>
    </div>
  )
}

export default function TecnovigilanciaPage(){
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState<'dashboard'|'eventos'|'alertas'|'trimestral'>('dashboard')
  const[sel,setSel]=useState<any>(null)
  const[showForm,setShowForm]=useState(false)
  const[form,setForm]=useState<any>({
    dispositivo_nombre:'',registro_sanitario:'',marca:'',modelo:'',serie:'',lote:'',
    fabricante:'',importador:'',fecha_ocurrencia:'',fecha_conocimiento:new Date().toISOString().split('T')[0],
    tipo_reporte:'falla_funcionamiento',descripcion:'',consecuencia:'',
    gravedad:'no_serio',causa_probable:'',causa_identificada:false,
    dispositivo_disponible:true,reportante_nombre:'',reportante_profesion:'',
    nivel_complejidad:'alta'
  })
  const[saving,setSaving]=useState(false)

  useEffect(()=>{
    fetch('/api/tecnovigilancia').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  },[])

  async function guardarEvento(){
    setSaving(true)
    await fetch('/api/tecnovigilancia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const d=await fetch('/api/tecnovigilancia').then(r=>r.json())
    setData(d);setShowForm(false);setSaving(false)
  }

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <i className="ti ti-shield-exclamation" style={{fontSize:40,color:AZ,display:'block',marginBottom:12}}/>
        <div style={{color:GR,fontSize:14}}>Cargando Tecnovigilancia...</div>
      </div>
    </div>
  )

  const{eventos=[],alertas=[],kpis={},porTrimestre={}}=data||{}
  const tabs=[
    {id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},
    {id:'eventos',label:'Eventos',icon:'ti-clipboard-list'},
    {id:'alertas',label:'Alertas INVIMA',icon:'ti-bell-exclamation'},
    {id:'trimestral',label:'Consolidado Trimestral',icon:'ti-calendar-stats'},
  ]

  return(
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 24px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{padding:'20px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:RO_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-shield-exclamation" style={{fontSize:20,color:RO}}/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:20,fontWeight:700,color:AZ}}>Tecnovigilancia</h1>
                <p style={{margin:0,fontSize:12,color:GR}}>Res. 4816/2008 — Programa Institucional de Tecnovigilancia</p>
              </div>
            </div>
            {kpis.vencidos72h>0&&(
              <div style={{background:RO_BG,border:`1px solid ${RO}`,borderRadius:8,padding:'8px 16px',display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-alarm" style={{color:RO,fontSize:16}}/>
                <span style={{fontSize:12,fontWeight:700,color:RO}}>{kpis.vencidos72h} evento(s) serio(s) superaron las 72h sin reporte a INVIMA</span>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <a href="/api/tecnovigilancia/reportes?tipo=reteim" download style={{background:'#fff',color:AZ,border:`1px solid ${AZ}`,borderRadius:8,padding:'10px 14px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,textDecoration:'none'}}><i className="ti ti-file-spreadsheet"/>Descargar RETEIM</a>
              <a href="/api/tecnovigilancia/reportes?tipo=foreia" download style={{background:'#fff',color:RO,border:`1px solid ${RO}`,borderRadius:8,padding:'10px 14px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,textDecoration:'none'}}><i className="ti ti-file-type-pdf"/>Descargar FOREIA</a>
              <button onClick={()=>setShowForm(true)} style={{background:AZ,color:'#fff',border:'none',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><i className="ti ti-plus"/>Registrar Evento</button>
            </div>
          </div>
          <div style={{display:'flex',gap:0}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)}
                style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:tab===t.id?AZ:GR,borderBottom:tab===t.id?`2px solid ${AZ}`:'2px solid transparent',display:'flex',alignItems:'center',gap:6}}>
                <i className={`ti ${t.icon}`}/>{t.label}
                {t.id==='alertas'&&kpis.alertasActivas>0&&<span style={{background:RO,color:'#fff',borderRadius:10,fontSize:10,padding:'0 6px',fontWeight:700}}>{kpis.alertasActivas}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:24}}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16,marginBottom:24}}>
              {[
                {label:'Total eventos',val:kpis.total,icon:'ti-clipboard-list',color:AZ,bg:AZ_BG},
                {label:'Serios',val:kpis.serios,icon:'ti-alert-triangle',color:RO,bg:RO_BG},
                {label:'No serios',val:kpis.noSerios,icon:'ti-info-circle',color:NA,bg:NA_BG},
                {label:'Pendientes reporte',val:kpis.pendientes,icon:'ti-clock',color:MO,bg:MO_BG},
                {label:'>72h sin reporte',val:kpis.vencidos72h,icon:'ti-alarm',color:RO,bg:RO_BG},
                {label:'Alertas activas',val:kpis.alertasActivas,icon:'ti-bell',color:CI,bg:CI_BG},
              ].map((k,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #E2E8F0'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <i className={`ti ${k.icon}`} style={{fontSize:17,color:k.color}}/>
                  </div>
                  <div style={{fontSize:22,fontWeight:700,color:k.color}}>{k.val}</div>
                  <div style={{fontSize:11,color:GR,marginTop:2}}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Eventos serios pendientes — prioridad máxima */}
            {eventos.filter((e:any)=>e.gravedad==='serio'&&e.estado==='pendiente').length>0&&(
              <div style={{background:'#fff',borderRadius:12,border:`1px solid ${RO}`,marginBottom:16,overflow:'hidden'}}>
                <div style={{padding:'12px 20px',background:RO_BG,borderBottom:`1px solid ${RO}`,display:'flex',alignItems:'center',gap:8}}>
                  <i className="ti ti-alarm" style={{color:RO,fontSize:16}}/>
                  <span style={{fontSize:13,fontWeight:700,color:RO}}>Eventos serios pendientes de reporte — Obligatorio en 72h (Res. 4816 Art. 15)</span>
                </div>
                {eventos.filter((e:any)=>e.gravedad==='serio'&&e.estado==='pendiente').map((e:any,i:number)=>(
                  <div key={i} style={{padding:'16px 20px',borderTop:i>0?'1px solid #FEE2E2':'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{e.dispositivo_nombre}</span>
                        <span style={{fontSize:11,color:GR,marginLeft:8}}>{fmtFecha(e.fecha_ocurrencia)}</span>
                        <div style={{marginTop:4}}><TipoBadge t={e.tipo_reporte}/></div>
                      </div>
                      <div style={{textAlign:'right',fontSize:11,color:GR}}>Reportante: {e.reportante_nombre}</div>
                    </div>
                    <Contador72h horas={e.horas_desde_conocimiento||0}/>
                  </div>
                ))}
              </div>
            )}

            {/* Tabla resumen todos los eventos */}
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Todos los eventos registrados</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFC'}}>
                    {['Fecha','Dispositivo','Tipo','Gravedad','Reportante','Estado'].map(h=>(
                      <th key={h} style={{padding:'8px 16px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e:any,i:number)=>(
                    <tr key={i} onClick={()=>setSel(sel?.id===e.id?null:e)}
                      style={{borderTop:'1px solid #F1F5F9',cursor:'pointer',background:sel?.id===e.id?AZ_BG:'transparent'}}>
                      <td style={{padding:'10px 16px',fontSize:12}}>{fmtFecha(e.fecha_ocurrencia)}</td>
                      <td style={{padding:'10px 16px'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{e.dispositivo_nombre}</div>
                        <div style={{fontSize:11,color:GR}}>{e.marca} {e.modelo}</div>
                      </td>
                      <td style={{padding:'10px 16px'}}><TipoBadge t={e.tipo_reporte}/></td>
                      <td style={{padding:'10px 16px'}}><GravedadBadge g={e.gravedad}/></td>
                      <td style={{padding:'10px 16px',fontSize:12}}>{e.reportante_nombre}</td>
                      <td style={{padding:'10px 16px'}}><EstadoBadge e={e.estado}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVENTOS TAB — detalle completo */}
        {tab==='eventos'&&(
          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 420px':'1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Registro de eventos ({eventos.length})</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFC'}}>
                    {['Fecha ocurrencia','Dispositivo','Tipo','Gravedad','Estado','Reportante'].map(h=>(
                      <th key={h} style={{padding:'8px 16px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e:any,i:number)=>(
                    <tr key={i} onClick={()=>setSel(sel?.id===e.id?null:e)}
                      style={{borderTop:'1px solid #F1F5F9',cursor:'pointer',background:sel?.id===e.id?AZ_BG:'transparent'}}>
                      <td style={{padding:'10px 16px',fontSize:12}}>{fmtFecha(e.fecha_ocurrencia)}</td>
                      <td style={{padding:'10px 16px'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{e.dispositivo_nombre}</div>
                        <div style={{fontSize:11,color:GR}}>{e.marca} · {e.modelo} · S/N {e.serie}</div>
                      </td>
                      <td style={{padding:'10px 16px'}}><TipoBadge t={e.tipo_reporte}/></td>
                      <td style={{padding:'10px 16px'}}><GravedadBadge g={e.gravedad}/></td>
                      <td style={{padding:'10px 16px'}}><EstadoBadge e={e.estado}/></td>
                      <td style={{padding:'10px 16px',fontSize:12}}>{e.reportante_nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Panel detalle FOREIA */}
            {sel&&(
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20,overflowY:'auto',maxHeight:'80vh'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:AZ}}>{sel.dispositivo_nombre}</div>
                    <div style={{fontSize:11,color:GR,marginTop:2}}>Datos del formulario FOREIA</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{border:'none',background:'none',cursor:'pointer',color:GR}}>
                    <i className="ti ti-x" style={{fontSize:16}}/>
                  </button>
                </div>

                {sel.gravedad==='serio'&&sel.estado==='pendiente'&&(
                  <div style={{background:RO_BG,border:`1px solid ${RO}`,borderRadius:8,padding:'10px 14px',marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:RO,marginBottom:6}}>⚠ Reporte obligatorio INVIMA — 72h</div>
                    <Contador72h horas={sel.horas_desde_conocimiento||0}/>
                    <div style={{fontSize:11,color:RO,marginTop:6}}>Enviar vía farmacoweb.invima.gov.co → Módulo FOREIA</div>
                  </div>
                )}

                {[
                  {titulo:'A. Lugar de ocurrencia',campos:[{l:'Nivel complejidad',v:sel.nivel_complejidad}]},
                  {titulo:'B. Dispositivo médico',campos:[
                    {l:'Registro sanitario',v:sel.registro_sanitario},
                    {l:'Marca / Modelo',v:`${sel.marca} ${sel.modelo}`},
                    {l:'Serie',v:sel.serie},{l:'Lote',v:sel.lote},
                    {l:'Fabricante',v:sel.fabricante},{l:'Importador',v:sel.importador},
                  ]},
                  {titulo:'C. Descripción del evento',campos:[
                    {l:'Fecha ocurrencia',v:fmtFecha(sel.fecha_ocurrencia)},
                    {l:'Fecha conocimiento',v:fmtFecha(sel.fecha_conocimiento)},
                    {l:'Tipo',v:sel.tipo_reporte?.replace(/_/g,' ')},
                    {l:'Descripción',v:sel.descripcion},
                    {l:'Consecuencia',v:sel.consecuencia},
                  ]},
                  {titulo:'D. Gravedad',campos:[
                    {l:'Clasificación',v:sel.gravedad?.toUpperCase()},
                    {l:'Causa muerte',v:sel.causa_muerte?'Sí':'No'},
                    {l:'Deterioro grave',v:sel.deterioro_grave?'Sí':'No'},
                    {l:'Intervención médica',v:sel.intervencion_medica?'Sí':'No'},
                  ]},
                  {titulo:'E. Análisis de causa',campos:[
                    {l:'Causa probable',v:sel.causa_probable||'Sin identificar'},
                    {l:'Causa identificada',v:sel.causa_identificada?'Sí':'En investigación'},
                    {l:'Dispositivo disponible',v:sel.dispositivo_disponible?'Sí':'No'},
                  ]},
                  {titulo:'F. Reportante',campos:[
                    {l:'Nombre',v:sel.reportante_nombre},
                    {l:'Profesión',v:sel.reportante_profesion},
                  ]},
                ].map((sec,i)=>(
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:AZ,marginBottom:6,padding:'4px 0',borderBottom:'1px solid #F1F5F9'}}>{sec.titulo}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {sec.campos.map((c,j)=>(
                        <div key={j} style={{gridColumn:c.l==='Descripción'||c.l==='Consecuencia'||c.l==='Causa probable'?'1/-1':'auto',background:'#F8FAFC',borderRadius:6,padding:'6px 10px'}}>
                          <div style={{fontSize:10,color:GR,marginBottom:2}}>{c.l}</div>
                          <div style={{fontSize:12,fontWeight:500,color:'#0F172A'}}>{c.v||'—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {sel.numero_foreia&&(
                  <div style={{background:VE_BG,borderRadius:8,padding:'10px 14px',marginTop:8}}>
                    <div style={{fontSize:11,color:GR}}>Código FOREIA asignado por INVIMA</div>
                    <div style={{fontSize:14,fontWeight:700,color:VE}}>{sel.numero_foreia}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ALERTAS INVIMA */}
        {tab==='alertas'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {alertas.map((a:any,i:number)=>(
              <div key={i} style={{background:'#fff',borderRadius:12,border:`1px solid ${a.nivel_riesgo==='alto'?RO:a.nivel_riesgo==='medio'?'#FCD34D':'#E2E8F0'}`,padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:a.nivel_riesgo==='alto'?RO_BG:NA_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className={`ti ${a.tipo==='recall'?'ti-arrow-back-up':'ti-bell-exclamation'}`} style={{fontSize:18,color:a.nivel_riesgo==='alto'?RO:NA}}/>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{a.titulo}</div>
                      <div style={{fontSize:11,color:GR,marginTop:2}}>{a.dispositivo} · {a.fabricante}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                    <AlertaNivelBadge n={a.nivel_riesgo}/>
                    <span style={{fontSize:11,color:GR}}>{fmtFecha(a.fecha_alerta)}</span>
                  </div>
                </div>
                <p style={{margin:'0 0 10px',fontSize:13,color:'#334155',lineHeight:1.5}}>{a.descripcion}</p>
                {a.aplica_institucion&&(
                  <div style={{background:RO_BG,borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:600,color:RO,display:'inline-flex',alignItems:'center',gap:6}}>
                    <i className="ti ti-alert-circle" style={{fontSize:13}}/>Afecta equipos de esta institución — revisar inventario
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CONSOLIDADO TRIMESTRAL */}
        {tab==='trimestral'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:AZ_BG,borderRadius:12,padding:16,border:`1px solid #C7D2FE`,fontSize:13,color:AZ}}>
              <strong>Obligación RETEIM:</strong> Los eventos no serios deben consolidarse trimestralmente y reportarse al INVIMA los primeros 5 días hábiles del mes siguiente al trimestre. Si no hubo eventos, realizar "Reporte en Cero".
            </div>
            {Object.keys(porTrimestre).sort().reverse().map((trim:string)=>{
              const evs=porTrimestre[trim]
              return(
                <div key={trim} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                  <div style={{padding:'12px 20px',background:'#F8FAFC',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <i className="ti ti-calendar-stats" style={{color:AZ,fontSize:16}}/>
                      <span style={{fontSize:13,fontWeight:700,color:AZ}}>Trimestre {trim}</span>
                      <span style={{fontSize:11,color:GR}}>{evs.length} evento(s) no serio(s)</span>
                    </div>
                    <span style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:NA_BG,color:NA,fontWeight:600}}>Formato RETEIM-002</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        {['Fecha','Dispositivo','Tipo','Causa','Reportante'].map(h=>(
                          <th key={h} style={{padding:'8px 16px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evs.map((e:any,i:number)=>(
                        <tr key={i} style={{borderTop:'1px solid #F1F5F9'}}>
                          <td style={{padding:'10px 16px',fontSize:12}}>{fmtFecha(e.fecha_ocurrencia)}</td>
                          <td style={{padding:'10px 16px',fontSize:13,fontWeight:600,color:'#0F172A'}}>{e.dispositivo_nombre}</td>
                          <td style={{padding:'10px 16px'}}><TipoBadge t={e.tipo_reporte}/></td>
                          <td style={{padding:'10px 16px',fontSize:12,color:'#334155'}}>{e.causa_probable||'Sin identificar'}</td>
                          <td style={{padding:'10px 16px',fontSize:12}}>{e.reportante_nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR EVENTO */}
      {showForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto',padding:28}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:AZ}}>Registrar Evento / Incidente Adverso</div>
                <div style={{fontSize:12,color:GR}}>Formulario FOREIA — Res. 4816/2008</div>
              </div>
              <button onClick={()=>setShowForm(false)} style={{border:'none',background:'none',cursor:'pointer',color:GR}}>
                <i className="ti ti-x" style={{fontSize:18}}/>
              </button>
            </div>

            {[
              {titulo:'B. Dispositivo médico',campos:[
                {l:'Nombre dispositivo *',k:'dispositivo_nombre',type:'text'},
                {l:'Registro sanitario INVIMA',k:'registro_sanitario',type:'text'},
                {l:'Marca',k:'marca',type:'text'},{l:'Modelo',k:'modelo',type:'text'},
                {l:'Serie',k:'serie',type:'text'},{l:'Lote',k:'lote',type:'text'},
                {l:'Fabricante',k:'fabricante',type:'text'},{l:'Importador',k:'importador',type:'text'},
              ]},
              {titulo:'C. Descripción',campos:[
                {l:'Fecha de ocurrencia *',k:'fecha_ocurrencia',type:'date'},
                {l:'Fecha de conocimiento *',k:'fecha_conocimiento',type:'date'},
                {l:'Tipo de reporte',k:'tipo_reporte',type:'select',opts:['falla_funcionamiento','evento_adverso','incidente_adverso']},
                {l:'Descripción detallada *',k:'descripcion',type:'textarea'},
                {l:'Consecuencia para el paciente',k:'consecuencia',type:'textarea'},
              ]},
              {titulo:'D. Gravedad',campos:[
                {l:'Clasificación',k:'gravedad',type:'select',opts:['no_serio','serio']},
                {l:'Causa probable',k:'causa_probable',type:'textarea'},
              ]},
              {titulo:'F. Reportante',campos:[
                {l:'Nombre reportante *',k:'reportante_nombre',type:'text'},
                {l:'Profesión',k:'reportante_profesion',type:'text'},
              ]},
            ].map((sec,si)=>(
              <div key={si} style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:AZ,marginBottom:10,paddingBottom:4,borderBottom:'1px solid #F1F5F9'}}>{sec.titulo}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {sec.campos.map((c:any,ci:number)=>(
                    <div key={ci} style={{gridColumn:c.type==='textarea'?'1/-1':'auto'}}>
                      <label style={{fontSize:11,color:GR,display:'block',marginBottom:4}}>{c.l}</label>
                      {c.type==='select'?(
                        <select value={form[c.k]} onChange={e=>setForm({...form,[c.k]:e.target.value})}
                          style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #E2E8F0',fontSize:13,background:'#fff'}}>
                          {c.opts.map((o:string)=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                        </select>
                      ):c.type==='textarea'?(
                        <textarea value={form[c.k]} onChange={e=>setForm({...form,[c.k]:e.target.value})}
                          rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #E2E8F0',fontSize:13,resize:'vertical',boxSizing:'border-box'}}/>
                      ):(
                        <input type={c.type} value={form[c.k]} onChange={e=>setForm({...form,[c.k]:e.target.value})}
                          style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #E2E8F0',fontSize:13,boxSizing:'border-box'}}/>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {form.gravedad==='serio'&&(
              <div style={{background:RO_BG,border:`1px solid ${RO}`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:RO,fontWeight:600}}>
                ⚠ Evento SERIO: debe reportarse al INVIMA vía farmacoweb.invima.gov.co dentro de las 72 horas.
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowForm(false)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #E2E8F0',background:'#fff',fontSize:13,cursor:'pointer',color:GR}}>Cancelar</button>
              <button onClick={guardarEvento} disabled={saving||!form.dispositivo_nombre||!form.fecha_ocurrencia||!form.reportante_nombre}
                style={{padding:'10px 20px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity:saving?0.7:1}}>
                {saving?'Guardando...':'Guardar evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
