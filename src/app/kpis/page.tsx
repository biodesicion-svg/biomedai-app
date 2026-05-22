'use client'
import { useState, useEffect } from 'react'

export default function KpisPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/kpis').then(r=>r.json()).then(d=>{setKpis(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const Sk = ({w='80px',h=24}:any) => <div style={{height:h,width:w,background:'#F1F5F9',borderRadius:4}}/>

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E2E8F0',padding:'16px 28px'}}>
        <div style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>BioMed AI / KPIs</div>
        <h1 style={{fontSize:18,fontWeight:600,color:'#0F172A',margin:0}}>Indicadores clave de desempeño</h1>
      </div>
      <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {[
            {l:'MTBF',            v:kpis?.mtbf,            unit:'días',  sub:'Tiempo medio entre fallas',  c:'#3B4FE8'},
            {l:'MTTR',            v:kpis?.mttr==='0'?'N/D':kpis?.mttr, unit:'hrs', sub:'Tiempo medio de reparación', c:'#7C3AED'},
            {l:'Disponibilidad',  v:kpis?.disponibilidad,  unit:'%',     sub:'Equipos operativos / total', c:Number(kpis?.disponibilidad)>=90?'#16A34A':'#DC2626'},
            {l:'Ratio Prev/Corr', v:kpis?.ratio,           unit:'',      sub:'Meta recomendada ≥ 0.80',   c:Number(kpis?.ratio)>=0.8?'#16A34A':'#DC2626'},
            {l:'Alto riesgo',     v:kpis?.altoRiesgo,      unit:'',      sub:`de ${kpis?.total} equipos`, c:'#DC2626'},
            {l:'Total mantenimientos', v:kpis?.totalMant,  unit:'',      sub:'Registros en historial',    c:'#D97706'},
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
              <div style={{fontSize:12,color:'#64748B',marginBottom:8}}>{k.l}</div>
              {loading ? <Sk/> : <div style={{fontSize:30,fontWeight:600,color:k.c,marginBottom:4}}>{k.v}<span style={{fontSize:14,marginLeft:4,color:k.c,opacity:0.7}}>{k.unit}</span></div>}
              <div style={{fontSize:11,color:'#94A3B8'}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#0F172A',marginBottom:16}}>Distribución por tipo</div>
            {loading ? <Sk h={100}/> : (kpis?.porTipo||[]).map((t:any)=>(
              <div key={t.label} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:12,color:'#475569'}}>{t.label}</span>
                  <div style={{display:'flex',gap:10,fontSize:12}}>
                    <span style={{fontWeight:500,color:'#0F172A'}}>{t.value}</span>
                    <span style={{color:'#94A3B8'}}>{t.pct}%</span>
                  </div>
                </div>
                <div style={{height:6,background:'#F1F5F9',borderRadius:3}}>
                  <div style={{height:6,borderRadius:3,width:`${t.pct}%`,background:t.label==='Preventivo'?'#22C55E':t.label==='Correctivo'?'#EF4444':'#F59E0B'}}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',overflow:'hidden'}}>
            <div style={{padding:'20px',borderBottom:'0.5px solid #F1F5F9'}}>
              <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>Disponibilidad por servicio</div>
            </div>
            <div>
              {loading ? <div style={{padding:20}}><Sk h={120}/></div> : (kpis?.porServicio||[]).map((s:any)=>{
                const disp=Number(s.disponibilidad)
                const color=disp>=90?'#22C55E':disp>=70?'#F59E0B':'#EF4444'
                return (
                  <div key={s.nombre} style={{padding:'12px 20px',borderBottom:'0.5px solid #F8F9FB'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:'#334155'}}>{s.nombre}</div>
                        <div style={{fontSize:11,color:'#94A3B8'}}>{s.total} equipos · {s.alto} alto riesgo</div>
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color}}>{s.disponibilidad}%</span>
                    </div>
                    <div style={{height:3,background:'#F1F5F9',borderRadius:2}}>
                      <div style={{height:3,borderRadius:2,width:`${s.disponibilidad}%`,background:color}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
