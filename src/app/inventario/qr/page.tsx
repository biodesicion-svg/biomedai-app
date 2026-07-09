'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const AZ='#1B2B5B',VE='#16A34A',GR='#64748B'

async function getIID(): Promise<string> {
  try {
    const r = await fetch('/api/auth/me')
    const d = await r.json()
    return d.institucion_id || '00000000-0000-0000-0000-000000000001'
  } catch {
    return '00000000-0000-0000-0000-000000000001'
  }
}

export default function QRGeneratorPage(){
  const[equipos,setEquipos]=useState<any[]>([])
  const[loading,setLoading]=useState(true)
  const[busqueda,setBusqueda]=useState('')
  const[qrs,setQrs]=useState<Record<string,string>>({})
  const[generando,setGenerando]=useState<string|null>(null)
  const[seleccionados,setSeleccionados]=useState<Set<string>>(new Set())
  const[vista,setVista]=useState<'lista'|'etiquetas'>('lista')

  useEffect(()=>{
    async function load(){
    const IID = await getIID()
    const sb=createClient()
    sb.from('equipos').select('id,nombre,codigo_inventario,servicio,riesgo,clase_invima,estado,marca,serie').eq('institucion_id',IID).eq('activo',true).eq('estado','operativo').order('nombre').then(({data})=>{
      setEquipos(data||[])
      setLoading(false)
    })
    }
    load()
  },[])

  async function generarQR(eq:any){
    setGenerando(eq.id)
    try{
      const r=await fetch(`/api/qr?id=${eq.id}&nombre=${encodeURIComponent(eq.nombre)}&codigo=${encodeURIComponent(eq.codigo_inventario||'')}`)
      const d=await r.json()
      if(d.qr) setQrs(p=>({...p,[eq.id]:d.qr}))
    }catch(e){console.error(e)}
    setGenerando(null)
  }

  async function generarTodos(){
    const selArr=equiposFiltrados.filter(e=>seleccionados.has(e.id)||seleccionados.size===0).slice(0,20)
    for(const eq of selArr) await generarQR(eq)
  }

  function toggleSel(id:string){
    setSeleccionados(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  }

  function imprimirEtiquetas(){
    window.print()
  }

  const equiposFiltrados=equipos.filter(e=>
    !busqueda||
    e.nombre?.toLowerCase().includes(busqueda.toLowerCase())||
    e.codigo_inventario?.toLowerCase().includes(busqueda.toLowerCase())||
    e.servicio?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const conQR=equiposFiltrados.filter(e=>qrs[e.id])

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#FAFAFA'}}>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .etiqueta-qr { page-break-inside: avoid; }
          body { background: white; }
        }
      `}</style>

      {/* Topbar */}
      <div className="no-print" style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP / Inventario / Codigos QR</div>
          <h1 style={{fontSize:18,fontWeight:500,color:'#18181B',margin:0}}>Generador de codigos QR</h1>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{display:'flex',gap:4,background:'#F4F4F5',borderRadius:8,padding:4}}>
            {[{id:'lista',icon:'ti-list',label:'Lista'},{id:'etiquetas',icon:'ti-layout-grid',label:'Etiquetas'}].map(v=>(
              <button key={v.id} onClick={()=>setVista(v.id as any)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,background:vista===v.id?'#fff':' transparent',color:vista===v.id?AZ:GR,fontWeight:vista===v.id?500:400}}>
                <i className={'ti '+v.icon} style={{fontSize:13}}/>{v.label}
              </button>
            ))}
          </div>
          {conQR.length>0&&(
            <button onClick={imprimirEtiquetas} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>
              <i className="ti ti-printer" style={{fontSize:14}}/> Imprimir {conQR.length} etiquetas
            </button>
          )}
        </div>
      </div>

      <div className="no-print" style={{padding:'16px 28px',display:'grid',gridTemplateColumns:'300px 1fr',gap:20,alignItems:'start'}}>

        {/* Panel izquierdo */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px'}}>
            <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <i className="ti ti-qrcode" style={{fontSize:14,color:AZ}}/> Generar QRs
            </div>
            <div style={{position:'relative',marginBottom:10}}>
              <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
              <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar equipo..." style={{width:'100%',paddingLeft:28,height:34,fontSize:12}}/>
            </div>
            <div style={{fontSize:11,color:GR,marginBottom:10}}>{seleccionados.size>0?`${seleccionados.size} seleccionados`:`${equiposFiltrados.length} equipos`}</div>
            <button onClick={generarTodos} style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',marginBottom:8}}>
              <i className="ti ti-qrcode" style={{fontSize:13}}/> {seleccionados.size>0?`Generar ${seleccionados.size} QRs`:`Generar todos (max 20)`}
            </button>
            {seleccionados.size>0&&(
              <button onClick={()=>setSeleccionados(new Set())} style={{width:'100%',padding:'7px',borderRadius:8,border:'0.5px solid #E4E4E7',background:'#fff',fontSize:11,cursor:'pointer',color:GR}}>
                Limpiar seleccion
              </button>
            )}
          </div>

          <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'16px'}}>
            <div style={{fontSize:12,fontWeight:500,color:'#18181B',marginBottom:8}}>Como usar los QR</div>
            {[
              {n:'1',t:'Genera los QRs',d:'Selecciona los equipos y genera sus codigos QR'},
              {n:'2',t:'Imprime las etiquetas',d:'Usa papel adhesivo A4 o etiquetas especiales'},
              {n:'3',t:'Pega en el equipo',d:'En la parte trasera o visible del equipo fisico'},
              {n:'4',t:'Escanea para acceder',d:'Cualquier camara movil abre la hoja de vida'},
            ].map(s=>(
              <div key={s.n} style={{display:'flex',gap:10,marginBottom:10}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:AZ,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,fontWeight:600,color:'#fff'}}>{s.n}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>{s.t}</div>
                  <div style={{fontSize:11,color:GR}}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de equipos */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
          <div style={{maxHeight:'70vh',overflowY:'auto'}}>
            {loading?(
              Array.from({length:8}).map((_,i)=>(
                <div key={i} style={{padding:'12px 16px',borderBottom:'0.5px solid #F4F4F5',display:'flex',gap:12}}>
                  <div style={{width:20,height:20,borderRadius:4,background:'#F1F5F9'}}/>
                  <div style={{flex:1,height:20,background:'#F1F5F9',borderRadius:4}}/>
                </div>
              ))
            ):equiposFiltrados.slice(0,50).map((eq,i)=>{
              const tieneQR=!!qrs[eq.id]
              const esSel=seleccionados.has(eq.id)
              return(
                <div key={eq.id} style={{padding:'10px 16px',borderBottom:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',gap:12,background:esSel?'#EEF2FF':'#fff',transition:'background 0.1s'}}>
                  <input type="checkbox" checked={esSel} onChange={()=>toggleSel(eq.id)} style={{width:16,height:16,accentColor:AZ,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{eq.nombre}</div>
                    <div style={{fontSize:10,color:GR}}>{eq.codigo_inventario} · {eq.servicio||'Sin servicio'}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {tieneQR&&<img src={qrs[eq.id]} style={{width:36,height:36,borderRadius:4}}/>}
                    <button onClick={()=>generarQR(eq)} disabled={generando===eq.id}
                      style={{padding:'5px 10px',borderRadius:6,border:'none',background:tieneQR?'#F0FDF4':AZ,color:tieneQR?VE:'#fff',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                      {generando===eq.id?<><i className="ti ti-loader-2" style={{fontSize:12}}/> ...</>:tieneQR?<><i className="ti ti-refresh" style={{fontSize:12}}/> Regen</>:<><i className="ti ti-qrcode" style={{fontSize:12}}/> QR</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ETIQUETAS IMPRIMIBLES */}
      <div style={{padding:'16px 28px'}}>
        {conQR.length>0&&(
          <div>
            <div className="no-print" style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
              <i className="ti ti-layout-grid" style={{fontSize:15,color:AZ}}/> Vista previa de etiquetas ({conQR.length})
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {equiposFiltrados.filter(e=>qrs[e.id]).map(eq=>(
                <div key={eq.id} className="etiqueta-qr" style={{background:'#fff',border:'1.5px solid #1B2B5B',borderRadius:10,padding:'14px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  {/* Logo SYNAP mini */}
                  <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
                    <div style={{width:14,height:14,borderRadius:3,background:AZ,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className="ti ti-activity" style={{fontSize:9,color:'#fff'}}/>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,color:AZ,letterSpacing:'0.05em'}}>SYNAP</span>
                  </div>
                  <img src={qrs[eq.id]} style={{width:120,height:120}}/>
                  <div style={{fontSize:10,fontWeight:700,color:'#18181B',textAlign:'center',lineHeight:1.3,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{eq.nombre}</div>
                  <div style={{fontSize:8,color:GR,fontFamily:'monospace'}}>{eq.codigo_inventario}</div>
                  <div style={{fontSize:8,color:GR}}>{eq.servicio?.substring(0,20)||'—'}</div>
                  <div style={{marginTop:2,padding:'2px 6px',borderRadius:20,background:eq.riesgo==='alto'?'#FEF2F2':eq.riesgo==='medio'?'#FFFBEB':'#F0FDF4',border:`0.5px solid ${eq.riesgo==='alto'?'#DC2626':eq.riesgo==='medio'?'#D97706':'#16A34A'}40`}}>
                    <span style={{fontSize:7,fontWeight:600,color:eq.riesgo==='alto'?'#DC2626':eq.riesgo==='medio'?'#D97706':'#16A34A',textTransform:'uppercase'}}>Clase {eq.clase_invima||'N/D'} · {eq.riesgo||'N/D'}</span>
                  </div>
                  <div style={{fontSize:7,color:'#A1A1AA',marginTop:2}}>Escanear para ver hoja de vida</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
