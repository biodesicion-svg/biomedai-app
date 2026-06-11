'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'

function fmtFecha(s:string){
  if(!s) return '—'
  return new Date(s+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

function EstadoBadge({e}:any){
  const map:any={vigente:{c:VE,bg:VE_BG,l:'Vigente'},vencida:{c:RO,bg:RO_BG,l:'Vencida'},proxima:{c:NA,bg:NA_BG,l:'Por vencer'},pendiente:{c:GR,bg:'#F4F4F5',l:'Pendiente'}}
  const s=map[e]||map.pendiente
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.c,fontWeight:600}}>{s.l}</span>
}

function PctBar({pct}:any){
  const color=pct===100?VE:pct>=60?NA:RO
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:10,color:GR}}>Cumplimiento</span>
        <span style={{fontSize:10,fontWeight:700,color}}>{pct}%</span>
      </div>
      <div style={{height:5,background:'#F1F5F9',borderRadius:3}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:3}}/>
      </div>
    </div>
  )
}

export default function CapacitacionesPage(){
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState<'dashboard'|'personal'|'temas'|'registros'>('dashboard')
  const[sel,setSel]=useState<any>(null)
  const[filtroServ,setFiltroServ]=useState('todos')

  useEffect(()=>{
    fetch('/api/capacitaciones').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  },[])

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <i className="ti ti-certificate" style={{fontSize:40,color:AZ,display:'block',marginBottom:12}}/>
        <div style={{color:GR,fontSize:14}}>Cargando capacitaciones...</div>
      </div>
    </div>
  )

  const{personal=[],temas=[],registros=[],kpis={},porServicio={},temasSinCobertura=[]}=data||{}
  const servicios=['todos',...Array.from(new Set(personal.map((p:any)=>p.servicio)))]
  const personalFiltrado=filtroServ==='todos'?personal:personal.filter((p:any)=>p.servicio===filtroServ)
  const tabs=[
    {id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},
    {id:'personal',label:'Personal',icon:'ti-users'},
    {id:'temas',label:'Temas',icon:'ti-book'},
    {id:'registros',label:'Registros',icon:'ti-clipboard-list'},
  ]

  return(
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{padding:'20px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:MO_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-certificate" style={{fontSize:20,color:MO}}/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:20,fontWeight:700,color:AZ}}>Capacitaciones</h1>
                <p style={{margin:0,fontSize:12,color:GR}}>Gestión de competencias del personal en equipos biomédicos</p>
              </div>
            </div>
            {kpis.conVencidas>0&&(
              <div style={{background:RO_BG,border:`1px solid ${RO}`,borderRadius:8,padding:'8px 16px',display:'flex',alignItems:'center',gap:8}}>
                <i className="ti ti-alert-triangle" style={{color:RO,fontSize:16}}/>
                <span style={{fontSize:12,fontWeight:700,color:RO}}>{kpis.conVencidas} persona(s) con capacitaciones vencidas</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:0}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id as any);setSel(null)}}
                style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:tab===t.id?AZ:GR,borderBottom:tab===t.id?`2px solid ${AZ}`:'2px solid transparent',display:'flex',alignItems:'center',gap:6}}>
                <i className={`ti ${t.icon}`}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:24}}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(
          <div>
            {/* KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
              {[
                {label:'Total personal',val:kpis.totalPersonal,icon:'ti-users',color:AZ,bg:AZ_BG},
                {label:'100% capacitados',val:kpis.totalCapacitados,icon:'ti-circle-check',color:VE,bg:VE_BG},
                {label:'Cap. vencidas',val:kpis.conVencidas,icon:'ti-alert-triangle',color:RO,bg:RO_BG},
                {label:'Por vencer 30d',val:kpis.conProximas,icon:'ti-clock-exclamation',color:NA,bg:NA_BG},
                {label:'Sin capacitar',val:kpis.sinCapacitar,icon:'ti-user-x',color:MO,bg:MO_BG},
              ].map((k,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #E2E8F0'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <i className={`ti ${k.icon}`} style={{fontSize:17,color:k.color}}/>
                  </div>
                  <div style={{fontSize:24,fontWeight:700,color:k.color}}>{k.val}</div>
                  <div style={{fontSize:11,color:GR,marginTop:2}}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              {/* Por servicio */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Cumplimiento por servicio</div>
                <div style={{padding:'8px 0'}}>
                  {Object.entries(porServicio).map(([serv,s]:any,i)=>{
                    const pct=Math.round((s.capacitados/s.total)*100)
                    return(
                      <div key={i} style={{padding:'10px 20px',borderBottom:'1px solid #F8FAFC'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:600,color:'#0F172A'}}>{serv}</span>
                          <span style={{fontSize:12,color:GR}}>{s.capacitados}/{s.total}</span>
                        </div>
                        <div style={{height:6,background:'#F1F5F9',borderRadius:3}}>
                          <div style={{width:`${pct}%`,height:'100%',background:pct===100?VE:pct>=60?NA:RO,borderRadius:3}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Temas sin cobertura + personal urgente */}
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {temasSinCobertura.length>0&&(
                  <div style={{background:'#fff',borderRadius:12,border:`1px solid ${RO}`,overflow:'hidden'}}>
                    <div style={{padding:'12px 20px',background:RO_BG,borderBottom:`1px solid #FECACA`,fontSize:13,fontWeight:700,color:RO,display:'flex',alignItems:'center',gap:8}}>
                      <i className="ti ti-alert-circle"/>Equipos sin personal capacitado
                    </div>
                    {temasSinCobertura.map((t:any,i:number)=>(
                      <div key={i} style={{padding:'10px 20px',borderBottom:'1px solid #F8FAFC',fontSize:12,color:'#334155'}}>
                        <div style={{fontWeight:600}}>{t.nombre}</div>
                        <div style={{fontSize:11,color:GR}}>{t.tipo_equipo} · {t.servicio||'Todos los servicios'}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                  <div style={{padding:'12px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Personal con capacitaciones vencidas</div>
                  {personal.filter((p:any)=>p.capacitaciones.some((c:any)=>c.estado==='vencida')).length===0?(
                    <div style={{padding:16,fontSize:12,color:GR,textAlign:'center'}}>Sin vencimientos</div>
                  ):personal.filter((p:any)=>p.capacitaciones.some((c:any)=>c.estado==='vencida')).map((p:any,i:number)=>(
                    <div key={i} style={{padding:'10px 20px',borderBottom:'1px solid #F8FAFC',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:'#0F172A'}}>{p.nombre}</div>
                        <div style={{fontSize:11,color:GR}}>{p.cargo} · {p.servicio}</div>
                      </div>
                      <span style={{fontSize:11,color:RO,fontWeight:600}}>
                        {p.capacitaciones.filter((c:any)=>c.estado==='vencida').length} vencida(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL */}
        {tab==='personal'&&(
          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 420px':'1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,fontWeight:700,color:AZ}}>Personal ({personalFiltrado.length})</span>
                <select value={filtroServ} onChange={e=>setFiltroServ(e.target.value)}
                  style={{padding:'6px 10px',borderRadius:6,border:'1px solid #E2E8F0',fontSize:12,background:'#fff'}}>
                  {(servicios as string[]).map((s:string)=><option key={s} value={s}>{s==='todos'?'Todos los servicios':s}</option>)}
                </select>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFC'}}>
                    {['Nombre','Cargo','Servicio','Cumplimiento','Vigentes','Vencidas','Estado'].map(h=>(
                      <th key={h} style={{padding:'8px 16px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {personalFiltrado.map((p:any,i:number)=>{
                    const vencidas=p.capacitaciones.filter((c:any)=>c.estado==='vencida').length
                    const proximas=p.capacitaciones.filter((c:any)=>c.estado==='proxima').length
                    return(
                      <tr key={i} onClick={()=>setSel(sel?.id===p.id?null:p)}
                        style={{borderTop:'1px solid #F1F5F9',cursor:'pointer',background:sel?.id===p.id?AZ_BG:'transparent'}}>
                        <td style={{padding:'10px 16px',fontSize:13,fontWeight:600,color:'#0F172A'}}>{p.nombre}</td>
                        <td style={{padding:'10px 16px',fontSize:12,color:'#334155'}}>{p.cargo}</td>
                        <td style={{padding:'10px 16px',fontSize:12,color:'#334155'}}>{p.servicio}</td>
                        <td style={{padding:'10px 16px',minWidth:120}}><PctBar pct={p.pctCumplimiento}/></td>
                        <td style={{padding:'10px 16px',fontSize:13,fontWeight:700,color:VE}}>{p.totalVigentes}</td>
                        <td style={{padding:'10px 16px',fontSize:13,fontWeight:700,color:vencidas>0?RO:GR}}>{vencidas}</td>
                        <td style={{padding:'10px 16px'}}>
                          {vencidas>0?<EstadoBadge e="vencida"/>:proximas>0?<EstadoBadge e="proxima"/>:p.pctCumplimiento===100?<EstadoBadge e="vigente"/>:<EstadoBadge e="pendiente"/>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Panel detalle persona */}
            {sel&&(
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20,overflowY:'auto',maxHeight:'80vh'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:AZ}}>{sel.nombre}</div>
                    <div style={{fontSize:12,color:GR}}>{sel.cargo} · {sel.servicio}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{border:'none',background:'none',cursor:'pointer',color:GR}}>
                    <i className="ti ti-x" style={{fontSize:16}}/>
                  </button>
                </div>

                <div style={{marginBottom:16}}><PctBar pct={sel.pctCumplimiento}/></div>

                <div style={{fontSize:12,fontWeight:700,color:AZ,marginBottom:10}}>Capacitaciones obligatorias</div>
                {sel.capacitaciones.map((c:any,i:number)=>(
                  <div key={i} style={{background:'#F8FAFC',borderRadius:8,padding:'10px 14px',marginBottom:8,border:`1px solid ${c.estado==='vencida'?'#FECACA':c.estado==='proxima'?'#FDE68A':'#E2E8F0'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#0F172A'}}>{c.tema.nombre}</div>
                      <EstadoBadge e={c.estado}/>
                    </div>
                    <div style={{fontSize:11,color:GR}}>{c.tema.tipo_equipo}</div>
                    {c.ultimaAsistencia?(
                      <div style={{fontSize:11,color:GR,marginTop:4}}>
                        Vence: {fmtFecha(c.ultimaAsistencia.fecha_vencimiento)}
                        {c.diasRestantes!==null&&c.diasRestantes>0&&<span style={{color:c.diasRestantes<=30?NA:VE}}> ({c.diasRestantes}d restantes)</span>}
                        {c.diasRestantes!==null&&c.diasRestantes<0&&<span style={{color:RO}}> (vencida hace {Math.abs(c.diasRestantes)}d)</span>}
                      </div>
                    ):(
                      <div style={{fontSize:11,color:RO,marginTop:4,fontWeight:600}}>Sin capacitación registrada</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMAS */}
        {tab==='temas'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {temas.map((t:any,i:number)=>{
              const regs=registros.filter((r:any)=>r.tema_id===t.id)
              const totalAsistentes=regs.reduce((s:number,r:any)=>s+(r.asistentes?.length||0),0)
              return(
                <div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:8,background:MO_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className="ti ti-book" style={{fontSize:18,color:MO}}/>
                    </div>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:t.obligatorio?RO_BG:'#F4F4F5',color:t.obligatorio?RO:GR,fontWeight:600}}>{t.obligatorio?'Obligatorio':'Optativo'}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:AZ,marginBottom:4}}>{t.nombre}</div>
                  <div style={{fontSize:11,color:GR,marginBottom:12}}>{t.tipo_equipo} · {t.servicio||'Todos los servicios'}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[
                      {l:'Sesiones',v:regs.length},
                      {l:'Asistentes',v:totalAsistentes},
                      {l:'Vigencia',v:`${t.vigencia_meses} meses`},
                    ].map((f,j)=>(
                      <div key={j} style={{background:'#F8FAFC',borderRadius:6,padding:'6px 10px'}}>
                        <div style={{fontSize:10,color:GR}}>{f.l}</div>
                        <div style={{fontSize:13,fontWeight:700,color:AZ}}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* REGISTROS */}
        {tab==='registros'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {registros.map((r:any,i:number)=>(
              <div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                <div style={{padding:'12px 20px',background:'#F8FAFC',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:34,height:34,borderRadius:8,background:MO_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className="ti ti-certificate" style={{fontSize:16,color:MO}}/>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:AZ}}>{r.tema?.nombre}</div>
                      <div style={{fontSize:11,color:GR}}>{fmtFecha(r.fecha)} · {r.capacitador} · {r.lugar} · {r.duracion_horas}h</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:AZ_BG,color:AZ,fontWeight:600}}>{r.asistentes?.length||0} asistentes</span>
                    <button onClick={()=>navigator.clipboard.writeText(window.location.origin+'/capacitaciones/formulario/'+r.token_publico)}
                      style={{padding:'4px 10px',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:GR}}>
                      <i className="ti ti-link" style={{fontSize:12}}/>Copiar link
                    </button>
                    <a href={'/api/capacitaciones/reportes?registro_id='+r.id} download
                      style={{padding:'4px 10px',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:GR,textDecoration:'none'}}>
                      <i className="ti ti-file-type-pdf" style={{fontSize:12}}/>Acta PDF
                    </a>
                  </div>
                </div>
                {r.asistentes?.length>0&&(
                  <div style={{padding:'8px 20px',display:'flex',flexWrap:'wrap',gap:8}}>
                    {r.asistentes.map((a:any,j:number)=>(
                      <div key={j} style={{background:'#F8FAFC',borderRadius:6,padding:'4px 10px',fontSize:11,display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:a.aprobado?VE:RO}}/>
                        <span style={{color:'#334155'}}>{a.persona?.nombre||'—'}</span>
                        <span style={{color:GR}}>· {a.persona?.servicio}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
