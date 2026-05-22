'use client'
import { useState, useEffect } from 'react'

const fmt = (n:number) => n>=1_000_000_000?`$${(n/1_000_000_000).toFixed(1)}B`:n>=1_000_000?`$${(n/1_000_000).toFixed(1)}M`:n>=1_000?`$${(n/1_000).toFixed(0)}K`:`$${n.toFixed(0)}`
const fmtCOP = (n:number) => `$${Math.round(n).toLocaleString('es-CO')} COP`

export default function PresupuestoPage() {
  const [datos, setDatos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ fetch('/api/presupuesto').then(r=>r.json()).then(d=>{setDatos(d);setLoading(false)}).catch(()=>setLoading(false)) },[])
  const Sk=({w='80px',h=24}:any)=><div style={{height:h,width:w,background:'#F1F5F9',borderRadius:4}}/>

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{background:'#fff',borderBottom:'0.5px solid #E2E8F0',padding:'16px 28px'}}>
        <div style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>BioMed AI / Presupuesto</div>
        <h1 style={{fontSize:18,fontWeight:600,color:'#0F172A',margin:0}}>Control presupuestal biomédico</h1>
      </div>
      <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[
            {l:'Valor del parque',    v:datos?fmt(datos.valorParque):'—',       c:'#3B4FE8', sub:'Costo total adquisición'},
            {l:'Costo preventivo',    v:datos?fmt(datos.costoPreventivo):'—',   c:'#16A34A', sub:'Mantenimientos preventivos'},
            {l:'Costo correctivo',    v:datos?fmt(datos.costoCorrectivo):'—',   c:'#DC2626', sub:'Mantenimientos correctivos'},
            {l:'Proyección 2026',     v:datos?fmt(datos.proyeccion):'—',        c:'#D97706', sub:'+8% inflación médica'},
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
              <div style={{fontSize:12,color:'#64748B',marginBottom:8}}>{k.l}</div>
              {loading?<Sk/>:<div style={{fontSize:26,fontWeight:600,color:k.c,marginBottom:4}}>{k.v}</div>}
              <div style={{fontSize:11,color:'#94A3B8'}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#0F172A',marginBottom:16}}>Análisis presupuestal</div>
            {loading?<Sk h={120}/>:<div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {l:'Ratio Prev/Corr', v:datos?.costoCorrectivo>0?datos?.ratioActual:'N/D', c:Number(datos?.ratioActual)>=0.8?'#16A34A':'#DC2626'},
                {l:'Equipos activos', v:datos?.totalEquipos, c:'#0F172A'},
                {l:'Dados de baja',   v:datos?.bajas,        c:'#DC2626'},
              ].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'#F8F9FB',borderRadius:8}}>
                  <span style={{fontSize:12,color:'#64748B'}}>{r.l}</span>
                  <span style={{fontSize:14,fontWeight:600,color:r.c}}>{r.v}</span>
                </div>
              ))}
              {datos?.costoCorrectivo>datos?.costoPreventivo&&(
                <div style={{padding:'10px 14px',background:'#FEF2F2',borderRadius:8,border:'0.5px solid #FECACA'}}>
                  <div style={{fontSize:11,color:'#DC2626',display:'flex',gap:6,alignItems:'flex-start'}}>
                    <i className="ti ti-alert-triangle" style={{fontSize:14,flexShrink:0}}/>
                    Costo correctivo supera al preventivo. Aumentar frecuencia preventiva.
                  </div>
                </div>
              )}
            </div>}
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',overflow:'hidden'}}>
            <div style={{padding:'20px',borderBottom:'0.5px solid #F1F5F9'}}>
              <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>Top equipos por valor de adquisición</div>
            </div>
            <div>
              {loading?<div style={{padding:20}}><Sk h={160}/></div>:(datos?.topValor||[]).map((e:any,i:number)=>{
                const pct=datos.valorParque>0?((Number(e.valor_adquisicion)/datos.valorParque)*100).toFixed(1):0
                return (
                  <div key={i} style={{padding:'12px 20px',borderBottom:'0.5px solid #F8F9FB'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:'#334155'}}>{e.nombre}</div>
                        <div style={{fontSize:11,color:'#94A3B8'}}>{e.riesgo} · {e.estado}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#3B4FE8'}}>{fmt(Number(e.valor_adquisicion))}</div>
                        <div style={{fontSize:11,color:'#94A3B8'}}>{pct}% del parque</div>
                      </div>
                    </div>
                    <div style={{height:3,background:'#F1F5F9',borderRadius:2}}>
                      <div style={{height:3,borderRadius:2,width:`${Math.min(Number(pct)*5,100)}%`,background:'#3B4FE8',opacity:0.6}}/>
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
