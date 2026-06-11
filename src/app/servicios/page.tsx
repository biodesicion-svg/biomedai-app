'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF'

function fmtFecha(s:string){
  if(!s) return '-'
  return new Date(s+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
}

function TipoBadge({t}:any){
  const map:any={
    'M.PREVENTIVO Y CALIBRACION':{c:VE,bg:VE_BG,l:'Prev + Cal'},
    'DIAGNOSTICO Y M.PREVENTIVO':{c:AZ,bg:AZ_BG,l:'Diag + Prev'},
    'MANTENIMIENTO CORRECTIVO Y CALIBRACION':{c:RO,bg:RO_BG,l:'Corr + Cal'},
    'M.PREVENTIVO':{c:MO,bg:'#F5F3FF',l:'Preventivo'},
    'DIAGNOSTICO':{c:NA,bg:NA_BG,l:'Diagnostico'},
  }
  const s=map[t]||{c:GR,bg:'#F4F4F5',l:t}
  return <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.c,fontWeight:600}}>{s.l}</span>
}

export default function ServiciosPage(){
  const[data,setData]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[search,setSearch]=useState('')
  const[filtroTipo,setFiltroTipo]=useState('')
  const[filtroEquipo,setFiltroEquipo]=useState('')
  const[sel,setSel]=useState<any>(null)
  const[tab,setTab]=useState<'lista'|'dashboard'>('lista')

  function cargar(q='',tipo='',eq=''){
    setLoading(true)
    let url='/api/servicios?x=1'
    if(q) url+=`&q=${encodeURIComponent(q)}`
    if(tipo) url+=`&tipo=${encodeURIComponent(tipo)}`
    if(eq) url+=`&equipo=${encodeURIComponent(eq)}`
    fetch(url).then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  }

  useEffect(()=>{ cargar() },[])

  const{servicios=[],kpis={}}=data||{}
  const equiposUnicos=[...new Set(servicios.map((s:any)=>s.equipo))].sort() as string[]
  const tiposUnicos=[...new Set(servicios.map((s:any)=>s.tipo_servicio))].sort() as string[]

  return(
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>
      <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 24px'}}>
        <div style={{maxWidth:1400,margin:'0 auto'}}>
          <div style={{padding:'20px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-tool" style={{fontSize:20,color:AZ}}/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:20,fontWeight:700,color:AZ}}>Reportes de Servicio</h1>
                <p style={{margin:0,fontSize:12,color:GR}}>{servicios.length} registros cargados</p>
              </div>
            </div>
            <a href="/api/servicios/pdf?tipo=consolidado" download
              style={{padding:'9px 16px',background:'#fff',border:`1px solid ${AZ}`,borderRadius:8,fontSize:12,fontWeight:600,color:AZ,textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>
              <i className="ti ti-file-type-pdf" style={{fontSize:14}}/>Consolidado PDF
            </a>
          </div>
          <div style={{display:'flex',gap:0}}>
            {[{id:'lista',l:'Registros',icon:'ti-list'},{id:'dashboard',l:'Dashboard',icon:'ti-chart-bar'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)}
                style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,
                  color:tab===t.id?AZ:GR,borderBottom:tab===t.id?`2px solid ${AZ}`:'2px solid transparent',
                  display:'flex',alignItems:'center',gap:6}}>
                <i className={`ti ${t.icon}`}/>{t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400,margin:'0 auto',padding:24}}>

        {tab==='dashboard'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
              {[
                {l:'Total servicios',v:kpis.total||0,icon:'ti-clipboard-list',c:AZ,bg:AZ_BG},
                {l:'Equipos distintos',v:equiposUnicos.length,icon:'ti-device-heart-monitor',c:MO,bg:'#F5F3FF'},
                {l:'Tipos de servicio',v:Object.keys(kpis.tipos||{}).length,icon:'ti-list-check',c:VE,bg:VE_BG},
                {l:'Con repuestos',v:servicios.filter((s:any)=>s.repuestos_utilizados&&s.repuestos_utilizados.trim()!=='').length,icon:'ti-package',c:NA,bg:NA_BG},
              ].map((k,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #E2E8F0'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <i className={`ti ${k.icon}`} style={{fontSize:17,color:k.c}}/>
                  </div>
                  <div style={{fontSize:24,fontWeight:700,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:11,color:GR,marginTop:2}}>{k.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Por tipo de servicio</div>
                {Object.entries(kpis.tipos||{}).sort((a:any,b:any)=>b[1]-a[1]).map(([tipo,cnt]:any,i)=>(
                  <div key={i} style={{padding:'10px 20px',borderBottom:'1px solid #F8FAFC',display:'flex',alignItems:'center',gap:12}}>
                    <TipoBadge t={tipo}/>
                    <div style={{flex:1,height:6,background:'#F1F5F9',borderRadius:3}}>
                      <div style={{width:`${(cnt/(kpis.total||1))*100}%`,height:'100%',background:AZ,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:AZ,minWidth:30}}>{cnt}</span>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',fontSize:13,fontWeight:700,color:AZ}}>Por tipo de equipo</div>
                {Object.entries(kpis.equipos||{}).sort((a:any,b:any)=>b[1]-a[1]).slice(0,8).map(([eq,cnt]:any,i)=>{
                  const max=Math.max(...Object.values(kpis.equipos||{1:1}) as number[])
                  return(
                    <div key={i} style={{padding:'10px 20px',borderBottom:'1px solid #F8FAFC',display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:12,color:'#334155',flex:1}}>{eq}</span>
                      <div style={{width:100,height:6,background:'#F1F5F9',borderRadius:3}}>
                        <div style={{width:`${(cnt/max)*100}%`,height:'100%',background:MO,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:MO,minWidth:30}}>{cnt}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab==='lista'&&(
          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 460px':'1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',display:'flex',gap:8,flexWrap:'wrap'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&cargar(search,filtroTipo,filtroEquipo)}
                  placeholder="Buscar por equipo, serie, numero reporte..."
                  style={{flex:1,minWidth:200,padding:'8px 12px',borderRadius:8,border:'1px solid #E2E8F0',fontSize:13}}/>
                <select value={filtroEquipo} onChange={e=>{setFiltroEquipo(e.target.value);cargar(search,filtroTipo,e.target.value)}}
                  style={{padding:'8px 12px',borderRadius:8,border:'1px solid #E2E8F0',fontSize:12,background:'#fff'}}>
                  <option value="">Todos los equipos</option>
                  {equiposUnicos.map(eq=><option key={eq} value={eq}>{eq}</option>)}
                </select>
                <select value={filtroTipo} onChange={e=>{setFiltroTipo(e.target.value);cargar(search,e.target.value,filtroEquipo)}}
                  style={{padding:'8px 12px',borderRadius:8,border:'1px solid #E2E8F0',fontSize:12,background:'#fff'}}>
                  <option value="">Todos los tipos</option>
                  {tiposUnicos.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={()=>cargar(search,filtroTipo,filtroEquipo)}
                  style={{padding:'8px 14px',background:AZ,color:'#fff',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>
                  Buscar
                </button>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFC'}}>
                    {['Reporte','Fecha','Equipo','Marca/Modelo','Serie','Ubicacion','Tipo',''].map(hdr=>(
                      <th key={hdr} style={{padding:'8px 14px',textAlign:'left',fontSize:11,color:GR,fontWeight:600}}>{hdr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading?(
                    <tr><td colSpan={8} style={{padding:24,textAlign:'center',color:GR}}>Cargando...</td></tr>
                  ):servicios.map((s:any,i:number)=>(
                    <tr key={i} onClick={()=>setSel(sel?.id===s.id?null:s)}
                      style={{borderTop:'1px solid #F1F5F9',cursor:'pointer',background:sel?.id===s.id?AZ_BG:'transparent'}}>
                      <td style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:MO}}>{s.numero_reporte}</td>
                      <td style={{padding:'9px 14px',fontSize:12}}>{fmtFecha(s.fecha_servicio)}</td>
                      <td style={{padding:'9px 14px',fontSize:12,fontWeight:600,color:'#0F172A'}}>{s.equipo}</td>
                      <td style={{padding:'9px 14px',fontSize:11,color:'#334155'}}>{s.marca} {s.modelo}</td>
                      <td style={{padding:'9px 14px',fontSize:11,color:GR}}>{s.serie_placa}</td>
                      <td style={{padding:'9px 14px',fontSize:11,color:'#334155'}}>{s.ubicacion}</td>
                      <td style={{padding:'9px 14px'}}><TipoBadge t={s.tipo_servicio}/></td>
                      <td style={{padding:'9px 14px'}}>
                        <a href={`/api/servicios/excel?id=${s.id}`} download
                          onClick={e=>e.stopPropagation()}
                          style={{fontSize:11,color:AZ,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                          <i className="ti ti-file-spreadsheet" style={{fontSize:12}}/>Excel
                        </a>
                        <a href={`/api/servicios/pdf?tipo=reporte&id=${s.id}`} download
                          onClick={e=>e.stopPropagation()}
                          style={{fontSize:11,color:RO,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                          <i className="ti ti-file-type-pdf" style={{fontSize:12}}/>PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sel&&(
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20,overflowY:'auto',maxHeight:'85vh'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:AZ}}>{sel.equipo}</div>
                    <div style={{fontSize:11,color:MO,fontWeight:600}}>{sel.numero_reporte}</div>
                    <div style={{fontSize:11,color:GR,marginTop:2}}>{fmtFecha(sel.fecha_servicio)} · {sel.tecnico}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <a href={`/api/servicios/excel?id=${sel.id}`} download
                      style={{padding:'6px 12px',background:VE,color:'#fff',borderRadius:7,fontSize:11,fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                      <i className="ti ti-file-spreadsheet"/>Excel EMMC
                    </a>
                    <a href={`/api/servicios/pdf?tipo=reporte&id=${sel.id}`} download
                      style={{padding:'6px 12px',background:RO,color:'#fff',borderRadius:7,fontSize:11,fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                      <i className="ti ti-file-type-pdf"/>PDF EMMC
                    </a>
                    <button onClick={()=>setSel(null)} style={{border:'none',background:'none',cursor:'pointer',color:GR}}>
                      <i className="ti ti-x" style={{fontSize:16}}/>
                    </button>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:14}}>
                  {[{l:'Marca',v:sel.marca},{l:'Modelo',v:sel.modelo},{l:'Serie',v:sel.serie_placa},
                    {l:'Sede',v:sel.sede},{l:'Ubicacion',v:sel.ubicacion},{l:'Cliente',v:sel.cliente}].map((f,i)=>(
                    <div key={i} style={{background:'#F8FAFC',borderRadius:6,padding:'6px 10px'}}>
                      <div style={{fontSize:10,color:GR}}>{f.l}</div>
                      <div style={{fontSize:12,fontWeight:600,color:'#0F172A'}}>{f.v||'-'}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:10}}><TipoBadge t={sel.tipo_servicio}/></div>
                {[
                  {l:'Trabajo realizado',v:sel.trabajo_realizado},
                  {l:'Acciones tomadas',v:sel.acciones_tomadas},
                  {l:'Parametros verificados',v:sel.parametros_verificados},
                  {l:'Repuestos utilizados',v:sel.repuestos_utilizados},
                  {l:'Observaciones',v:sel.observaciones},
                  {l:'Conclusiones',v:sel.conclusiones},
                ].filter(f=>f.v).map((f,i)=>(
                  <div key={i} style={{marginBottom:8,background:'#F8FAFC',borderRadius:8,padding:'8px 12px'}}>
                    <div style={{fontSize:10,color:GR,marginBottom:3,fontWeight:600}}>{f.l}</div>
                    <div style={{fontSize:12,color:'#334155',lineHeight:1.5}}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
