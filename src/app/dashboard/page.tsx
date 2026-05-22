'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n)

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/kpis').then(r=>r.json()).then(d=>{setKpis(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const Skeleton = ({w='100%',h=20}: any) => (
    <div style={{width:w,height:h,background:'#F1F5F9',borderRadius:4,animation:'pulse 1.5s infinite'}}/>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E2E8F0',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>BioMed AI / Dashboard</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#0F172A',margin:0}}>Vista general</h1>
        </div>
        <div style={{fontSize:11,color:'#64748B',background:'#F8F9FB',padding:'6px 12px',borderRadius:6,border:'0.5px solid #E2E8F0'}}>
          {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}
        </div>
      </div>

      <div style={{flex:1,padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

        {/* KPI Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[
            {label:'Total equipos',      value:kpis?.total,         sub:'En inventario',               color:'#3B4FE8', icon:'ti-device-heart-monitor'},
            {label:'Operativos',         value:kpis?.operativos,    sub:`${kpis?.disponibilidad}% disponibilidad`, color:'#16A34A', icon:'ti-check'},
            {label:'Alto riesgo',        value:kpis?.altoRiesgo,    sub:'Requieren atención',           color:'#DC2626', icon:'ti-alert-triangle'},
            {label:'Total mantenimientos',value:kpis?.totalMant,    sub:`${kpis?.correctivos} correctivos`, color:'#D97706', icon:'ti-tool'},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'18px 20px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontSize:12,color:'#64748B'}}>{k.label}</span>
                <div style={{width:32,height:32,borderRadius:8,background:k.color+'15',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className={`ti ${k.icon}`} style={{fontSize:16,color:k.color}}/>
                </div>
              </div>
              {loading
                ? <Skeleton w={60} h={28}/>
                : <div style={{fontSize:28,fontWeight:600,color:'#0F172A',marginBottom:4}}>{k.value?.toLocaleString('es-CO')}</div>
              }
              <div style={{fontSize:11,color:'#94A3B8'}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

          {/* Por tipo */}
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#0F172A',marginBottom:16}}>Mantenimientos por tipo</div>
            {loading ? <Skeleton h={120}/> : (kpis?.porTipo||[]).map((t:any)=>(
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

          {/* Por servicio */}
          <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',padding:'20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#0F172A',marginBottom:16}}>Disponibilidad por servicio</div>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {loading ? <Skeleton h={120}/> : (kpis?.porServicio||[]).map((s:any)=>{
                const disp = Number(s.disponibilidad)
                const color = disp>=90?'#22C55E':disp>=70?'#F59E0B':'#EF4444'
                return (
                  <div key={s.nombre} style={{padding:'8px 0',borderBottom:'0.5px solid #F1F5F9'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:'#334155'}}>{s.nombre}</div>
                        <div style={{fontSize:11,color:'#94A3B8'}}>{s.total} equipos</div>
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

        {/* Quick actions */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            {href:'/inventario',    icon:'ti-clipboard-list',  label:'Ver inventario',      color:'#3B4FE8'},
            {href:'/mantenimiento', icon:'ti-tool',            label:'Cronograma',          color:'#7C3AED'},
            {href:'/ordenes',       icon:'ti-clipboard-check', label:'Órdenes de trabajo',  color:'#0891B2'},
            {href:'/prediccion',    icon:'ti-trending-up',     label:'Predicción',          color:'#D97706'},
            {href:'/kpis',          icon:'ti-chart-bar',       label:'Ver KPIs',            color:'#16A34A'},
          ].map(a=>(
            <Link key={a.href} href={a.href} style={{
              display:'flex',alignItems:'center',gap:10,
              background:'#fff',borderRadius:10,border:'0.5px solid #E2E8F0',
              padding:'14px 16px',textDecoration:'none',
              transition:'all 0.15s',color:'#334155',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.background=a.color+'08'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#E2E8F0';e.currentTarget.style.background='#fff'}}>
              <div style={{width:32,height:32,borderRadius:8,background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={`ti ${a.icon}`} style={{fontSize:16,color:a.color}}/>
              </div>
              <span style={{fontSize:12,fontWeight:500}}>{a.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
