'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const tipoColor: Record<string,{bg:string;text:string}> = {
  preventivo:  {bg:'#F0FDF4',text:'#16A34A'},
  calibracion: {bg:'#FFFBEB',text:'#D97706'},
  correctivo:  {bg:'#FEF2F2',text:'#DC2626'},
}
const prioColor: Record<string,{bg:string;text:string}> = {
  alta:  {bg:'#FEF2F2',text:'#DC2626'},
  media: {bg:'#FFFBEB',text:'#D97706'},
  baja:  {bg:'#F0FDF4',text:'#16A34A'},
}
const tecColor = ['#3B4FE8','#7C3AED','#D97706']

const COLS = [
  {id:'pendiente',   label:'Pendientes',   dot:'#94A3B8'},
  {id:'en_proceso',  label:'En proceso',   dot:'#F59E0B'},
  {id:'en_revision', label:'En revisión',  dot:'#7C3AED'},
  {id:'completado',  label:'Finalizadas',  dot:'#22C55E'},
]

export default function OrdenesPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mesSel, setMesSel] = useState(new Date().getMonth()+1)
  const [tecFiltro, setTecFiltro] = useState('todos')
  const [ordenes, setOrdenes] = useState<any[]>([])

  useEffect(()=>{
    fetch('/api/mantenimientos').then(r=>r.json()).then(d=>{ setData(d); setOrdenes(genOrdenes(d,new Date().getMonth()+1)); setLoading(false) }).catch(()=>setLoading(false))
  },[])

  function genOrdenes(d:any, mes:number) {
    const items=d?.cronogramaMensual?.[mes]||[]
    let c=1
    return items.flatMap((item:any)=>(item.asignaciones||[]).map((asig:any)=>({
      id:`OT-${String(mes).padStart(2,'0')}-${String(c++).padStart(3,'0')}`,
      equipo:item.nombre, tipo:item.tipo, tecnico:asig.tecnico,
      cantidad:asig.cantidad, horas:asig.horas, columna:'pendiente',
      prioridad:item.riesgo==='alto'?'alta':item.riesgo==='medio'?'media':'baja',
      riesgo:item.riesgo, progreso:0,
    }))).sort((a:any,b:any)=>({alta:0,media:1,baja:2}[a.prioridad]-{alta:0,media:1,baja:2}[b.prioridad]))
  }

  function cambiarMes(mes:number) {
    setMesSel(mes)
    if(data) setOrdenes(genOrdenes(data,mes))
  }

  function abrirOrden(o: any) {
    sessionStorage.setItem(`orden-${o.id}`, JSON.stringify(o))
    router.push(`/ordenes/${o.id}`)
  }

  function mover(id:string, col:string) {
    setOrdenes(p=>p.map(o=>o.id===id?{...o,columna:col,progreso:col==='completado'?100:col==='en_revision'?75:col==='en_proceso'?35:0}:o))
  }

  const filtradas=ordenes.filter(o=>tecFiltro==='todos'||o.tecnico===tecFiltro)

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#fff'}}>

      {/* Sidebar */}
      <div style={{width:200,flexShrink:0,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>SYNAP</div>
          <div style={{fontSize:14,fontWeight:600,color:'#18181B'}}>Órdenes de trabajo</div>
        </div>
        <div style={{padding:'10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',padding:'4px 8px',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Mes</div>
          {MESES_LARGO.map((mes,i)=>{
            const numMes=i+1
            const r=data?.resumenAnual?.[i]
            const isSel=mesSel===numMes
            const esActual=numMes===new Date().getMonth()+1
            const ocColor=r?.ocupacion>80?'#DC2626':r?.ocupacion>50?'#D97706':'#16A34A'
            return (
              <button key={mes} onClick={()=>cambiarMes(numMes)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:6,border:'none',cursor:'pointer',background:isSel?'#EEF2FF':'transparent',marginBottom:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {esActual&&<div style={{width:5,height:5,borderRadius:'50%',background:'#3B4FE8',flexShrink:0}}/>}
                  <span style={{fontSize:12,fontWeight:isSel?500:400,color:isSel?'#3B4FE8':'#52525B'}}>{mes.substring(0,3)}</span>
                </div>
                {r&&<span style={{fontSize:10,fontWeight:500,color:ocColor}}>{r.ocupacion}%</span>}
              </button>
            )
          })}
        </div>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7'}}>
          {[{l:'Total',v:ordenes.length,c:'#18181B'},{l:'Completadas',v:ordenes.filter(o=>o.columna==='completado').length,c:'#22C55E'},{l:'Pendientes',v:ordenes.filter(o=>o.columna==='pendiente').length,c:'#94A3B8'}].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <h1 style={{fontSize:16,fontWeight:600,color:'#18181B',margin:0}}>Kanban — {MESES_LARGO[mesSel-1]} 2025</h1>
            <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>{ordenes.length} órdenes · {ordenes.filter(o=>o.columna==='completado').length} completadas</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {['todos',...(data?.tecnicos||['Biomédico 1','Biomédico 2','Biomédico 3'])].map((tec:string,i:number)=>(
              <button key={tec} onClick={()=>setTecFiltro(tec)} style={{padding:'5px 12px',borderRadius:20,border:`0.5px solid ${tecFiltro===tec?(i===0?'#18181B':tecColor[(i-1)%3]):'#E4E4E7'}`,background:tecFiltro===tec?(i===0?'#18181B':tecColor[(i-1)%3]+'15'):'#fff',color:tecFiltro===tec?(i===0?'#fff':tecColor[(i-1)%3]):'#71717A',fontSize:11,fontWeight:500,cursor:'pointer'}}>
                {tec==='todos'?'Todos':tec}
              </button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowX:'auto',padding:'16px 24px'}}>
          <div style={{display:'flex',gap:14,height:'100%',minWidth:900}}>
            {COLS.map(col=>{
              const colOrd=filtradas.filter(o=>o.columna===col.id)
              const sigCol=COLS[COLS.findIndex(c=>c.id===col.id)+1]
              const antCol=COLS[COLS.findIndex(c=>c.id===col.id)-1]
              return (
                <div key={col.id} style={{width:'calc(25% - 10px)',minWidth:220,flexShrink:0,display:'flex',flexDirection:'column',background:'#F8F9FA',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'0.5px solid #E4E4E7',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:col.dot}}/>
                      <span style={{fontSize:12,fontWeight:600,color:'#18181B'}}>{col.label}</span>
                    </div>
                    <div style={{width:20,height:20,borderRadius:'50%',background:col.dot+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:col.dot}}>{colOrd.length}</div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:'10px 10px'}}>
                    {loading?Array.from({length:2}).map((_,i)=>(
                      <div key={i} style={{height:120,background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',marginBottom:8}}/>
                    )):colOrd.length===0?(
                      <div style={{padding:'24px',textAlign:'center',fontSize:11,color:'#D4D4D8'}}>Sin órdenes</div>
                    ):colOrd.map((o:any)=>{
                      const pc=prioColor[o.prioridad]||prioColor.baja
                      const tc2=tipoColor[o.tipo]||tipoColor.preventivo
                      const tIdx=(data?.tecnicos||[]).indexOf(o.tecnico)
                      const tCol=tecColor[tIdx>=0?tIdx:0]
                      return (
                        <div key={o.id} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'12px',marginBottom:8,cursor:'pointer',transition:'all 0.15s'}}
                          onClick={(e)=>{ if((e.target as HTMLElement).tagName!=='BUTTON') abrirOrden(o) }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor='#3B4FE8'}
                          onMouseLeave={e=>e.currentTarget.style.borderColor='#E4E4E7'}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                            <span style={{fontSize:10,fontFamily:'monospace',color:'#A1A1AA'}}>{o.id}</span>
                            <span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:pc.bg,color:pc.text,fontWeight:500}}>{o.prioridad}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'flex-start',gap:6,marginBottom:8}}>
                            <div style={{width:5,height:5,borderRadius:'50%',background:o.riesgo==='alto'?'#DC2626':o.riesgo==='medio'?'#D97706':'#16A34A',marginTop:5,flexShrink:0}}/>
                            <span style={{fontSize:12,fontWeight:500,color:'#18181B',lineHeight:1.4}}>{o.equipo}</span>
                          </div>
                          <span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:tc2.bg,color:tc2.text,display:'inline-block',marginBottom:8,textTransform:'capitalize'}}>{o.tipo}</span>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'0.5px solid #F4F4F5',marginBottom:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:20,height:20,borderRadius:'50%',background:tCol+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:tCol}}>{o.tecnico.slice(-1)}</div>
                              <span style={{fontSize:10,color:'#71717A'}}>{o.tecnico.replace('Biomédico ','B')}</span>
                            </div>
                            <span style={{fontSize:10,color:'#A1A1AA'}}>{o.cantidad}eq · {o.horas}h</span>
                          </div>
                          <div style={{height:3,background:'#F4F4F5',borderRadius:2,marginBottom:8}}>
                            <div style={{height:3,borderRadius:2,width:`${o.progreso}%`,background:col.dot}}/>
                          </div>
                          <div style={{display:'flex',gap:4}}>
                            {antCol&&<button onClick={()=>mover(o.id,antCol.id)} style={{flex:1,padding:'4px',borderRadius:5,border:'0.5px solid #E4E4E7',background:'#fff',color:'#71717A',fontSize:10,cursor:'pointer'}}>← Atrás</button>}
                            {sigCol&&<button onClick={()=>mover(o.id,sigCol.id)} style={{flex:1,padding:'4px',borderRadius:5,border:'none',background:col.dot+'15',color:col.dot,fontSize:10,fontWeight:500,cursor:'pointer'}}>{sigCol.label} →</button>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
