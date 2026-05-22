'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const RIESGO_COLORS: Record<string,{bg:string;text:string}> = {
  alto:  {bg:'#FEF2F2',text:'#DC2626'},
  medio: {bg:'#FFFBEB',text:'#D97706'},
  bajo:  {bg:'#F0FDF4',text:'#16A34A'},
}
const ESTADO_COLORS: Record<string,{bg:string;text:string}> = {
  operativo:      {bg:'#F0FDF4',text:'#16A34A'},
  mantenimiento:  {bg:'#FFFBEB',text:'#D97706'},
  fuera_servicio: {bg:'#FEF2F2',text:'#DC2626'},
  baja:           {bg:'#F8F9FB',text:'#64748B'},
}

export default function InventarioPage() {
  const router = useRouter()
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(()=>{
    const supabase = createClient()
    supabase.from('equipos').select('*').eq('institucion_id','00000000-0000-0000-0000-000000000001').eq('activo',true).order('nombre')
      .then(({data})=>{ setEquipos(data||[]); setLoading(false) })
  },[])

  const filtrados = equipos.filter(e=>{
    const s = search.toLowerCase()
    const matchSearch = !s || e.nombre?.toLowerCase().includes(s) || e.codigo_inventario?.toLowerCase().includes(s) || e.marca?.toLowerCase().includes(s) || e.servicio?.toLowerCase().includes(s)
    const matchRiesgo = filtroRiesgo==='todos' || e.riesgo===filtroRiesgo
    const matchEstado = filtroEstado==='todos' || e.estado===filtroEstado
    return matchSearch && matchRiesgo && matchEstado
  })

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E2E8F0',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>BioMed AI / Inventario</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#0F172A',margin:0}}>Inventario de equipos biomédicos</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{position:'relative'}}>
            <i className="ti ti-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:14}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar equipo, código, marca..."
              style={{paddingLeft:32,width:280,height:36}}/>
          </div>
        </div>
      </div>

      <div style={{padding:'20px 28px',display:'flex',flexDirection:'column',gap:16,flex:1}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {l:'Total equipos',  v:equipos.length,                                        c:'#3B4FE8'},
            {l:'Operativos',     v:equipos.filter(e=>e.estado==='operativo').length,       c:'#16A34A'},
            {l:'Alto riesgo',    v:equipos.filter(e=>e.riesgo==='alto').length,            c:'#DC2626'},
            {l:'Dados de baja',  v:equipos.filter(e=>e.estado==='baja').length,            c:'#64748B'},
          ].map(s=>(
            <div key={s.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'16px 20px'}}>
              <div style={{fontSize:11,color:'#94A3B8',marginBottom:6}}>{s.l}</div>
              {loading ? <div style={{height:28,width:60,background:'#F1F5F9',borderRadius:4}}/> :
                <div style={{fontSize:26,fontWeight:600,color:s.c}}>{s.v.toLocaleString('es-CO')}</div>}
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'#94A3B8'}}>Riesgo:</span>
          {['todos','alto','medio','bajo'].map(f=>(
            <button key={f} onClick={()=>setFiltroRiesgo(f)} style={{
              padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'0.5px solid',
              background:filtroRiesgo===f?'#3B4FE8':'#fff',
              color:filtroRiesgo===f?'#fff':'#64748B',
              borderColor:filtroRiesgo===f?'#3B4FE8':'#E2E8F0',
            }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
          <span style={{fontSize:12,color:'#94A3B8',marginLeft:8}}>Estado:</span>
          {[{v:'todos',l:'Todos'},{v:'operativo',l:'Operativo'},{v:'baja',l:'Baja'}].map(f=>(
            <button key={f.v} onClick={()=>setFiltroEstado(f.v)} style={{
              padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'0.5px solid',
              background:filtroEstado===f.v?'#3B4FE8':'#fff',
              color:filtroEstado===f.v?'#fff':'#64748B',
              borderColor:filtroEstado===f.v?'#3B4FE8':'#E2E8F0',
            }}>{f.l}</button>
          ))}
          <span style={{fontSize:12,color:'#94A3B8',marginLeft:'auto'}}>{filtrados.length} equipos</span>
        </div>

        {/* Tabla */}
        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',overflow:'hidden',flex:1}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#F8F9FB'}}>
                  {['Código','Nombre','Marca / Modelo','Servicio','Clase INVIMA','Riesgo','Estado'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'0.5px solid #E2E8F0',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:10}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:7}).map((_,j)=>(
                    <td key={j} style={{padding:'12px 14px',borderBottom:'0.5px solid #F1F5F9'}}>
                      <div style={{height:14,background:'#F1F5F9',borderRadius:3,width:j===1?120:j===0?80:60}}/>
                    </td>
                  ))}</tr>
                )) : filtrados.map((e,i)=>{
                  const rc = RIESGO_COLORS[e.riesgo]||RIESGO_COLORS.bajo
                  const ec = ESTADO_COLORS[e.estado]||ESTADO_COLORS.baja
                  return (
                    <tr key={e.id} onClick={()=>router.push(`/inventario/${e.id}`)}
                      style={{cursor:'pointer',borderBottom:'0.5px solid #F1F5F9',transition:'background 0.1s'}}
                      onMouseEnter={el=>el.currentTarget.style.background='#F8F9FB'}
                      onMouseLeave={el=>el.currentTarget.style.background='#fff'}>
                      <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontSize:12,color:'#64748B'}}>{e.codigo_inventario}</span></td>
                      <td style={{padding:'11px 14px'}}><div style={{fontWeight:500,color:'#0F172A',fontSize:13}}>{e.nombre}</div></td>
                      <td style={{padding:'11px 14px',color:'#64748B',fontSize:12}}>{e.marca||'—'} {e.modelo||''}</td>
                      <td style={{padding:'11px 14px',color:'#64748B',fontSize:12}}>{e.servicio||'—'}</td>
                      <td style={{padding:'11px 14px',color:'#64748B',fontSize:12}}>{e.clase_invima||'—'}</td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:rc.bg,color:rc.text}}>
                          {e.riesgo}
                        </span>
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:ec.bg,color:ec.text}}>
                          {e.estado?.replace('_',' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
