'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/kpis').then(r => r.json()).then(d => { setKpis(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#fff' }}>

      <div style={{ background:'#fff', borderBottom:'0.5px solid #E4E4E7', padding:'16px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:2 }}>BioMed AI / Dashboard</div>
          <h1 style={{ fontSize:18, fontWeight:600, color:'#18181B', margin:0 }}>Vista general</h1>
        </div>
        <div style={{ fontSize:11, color:'#71717A', background:'#FAFAFA', padding:'6px 12px', borderRadius:6, border:'0.5px solid #E4E4E7' }}>
          {new Date().toLocaleDateString('es-CO', { month:'long', year:'numeric' })}
        </div>
      </div>

      <div style={{ flex:1, padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[
            { label:'Total equipos',  value:kpis?.total,      sub:'En inventario',                              color:'#3B4FE8', icon:'ti-device-heart-monitor' },
            { label:'Operativos',     value:kpis?.operativos, sub:`${kpis?.disponibilidad||0}% disponibilidad`, color:'#16A34A', icon:'ti-check' },
            { label:'Alto riesgo',    value:kpis?.altoRiesgo, sub:'Requieren atención',                         color:'#DC2626', icon:'ti-alert-triangle' },
            { label:'Mantenimientos', value:kpis?.totalMant,  sub:`${kpis?.correctivos||0} correctivos`,        color:'#D97706', icon:'ti-tool' },
          ].map(k => (
            <div key={k.label} style={{ background:'#fff', borderRadius:10, border:'0.5px solid #E4E4E7', padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <span style={{ fontSize:12, color:'#71717A' }}>{k.label}</span>
                <div style={{ width:34, height:34, borderRadius:8, background:k.color+'12', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={'ti ' + k.icon} style={{ fontSize:17, color:k.color }} />
                </div>
              </div>
              {loading
                ? <div style={{ width:60, height:30, background:'#F4F4F5', borderRadius:4 }} />
                : <div style={{ fontSize:30, fontWeight:600, color:'#18181B', marginBottom:4 }}>{k.value?.toLocaleString('es-CO')}</div>
              }
              <div style={{ fontSize:11, color:'#A1A1AA' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:10, border:'0.5px solid #E4E4E7', padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:18 }}>Mantenimientos por tipo</div>
            {loading
              ? <div style={{ height:100, background:'#F4F4F5', borderRadius:4 }} />
              : (kpis?.porTipo || []).map((t: any) => (
                <div key={t.label} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'#52525B' }}>{t.label}</span>
                    <div style={{ display:'flex', gap:10, fontSize:12 }}>
                      <span style={{ fontWeight:500, color:'#18181B' }}>{t.value}</span>
                      <span style={{ color:'#A1A1AA' }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:5, background:'#F4F4F5', borderRadius:3 }}>
                    <div style={{ height:5, borderRadius:3, width:`${t.pct}%`, background: t.label==='Preventivo' ? '#22C55E' : t.label==='Correctivo' ? '#EF4444' : '#F59E0B' }} />
                  </div>
                </div>
              ))
            }
          </div>

          <div style={{ background:'#fff', borderRadius:10, border:'0.5px solid #E4E4E7', padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#18181B', marginBottom:18 }}>Disponibilidad por servicio</div>
            {loading
              ? <div style={{ height:100, background:'#F4F4F5', borderRadius:4 }} />
              : (kpis?.porServicio || []).map((s: any) => {
                const disp = Number(s.disponibilidad)
                const color = disp >= 90 ? '#22C55E' : disp >= 70 ? '#F59E0B' : '#EF4444'
                return (
                  <div key={s.nombre} style={{ paddingBottom:12, marginBottom:12, borderBottom:'0.5px solid #F4F4F5' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500, color:'#3F3F46' }}>{s.nombre}</div>
                        <div style={{ fontSize:11, color:'#A1A1AA' }}>{s.total} equipos</div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color }}>{s.disponibilidad}%</span>
                    </div>
                    <div style={{ height:4, background:'#F4F4F5', borderRadius:2 }}>
                      <div style={{ height:4, borderRadius:2, width:`${s.disponibilidad}%`, background:color }} />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:500, color:'#A1A1AA', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Acceso rápido</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {[
              { href:'/inventario',    icon:'ti-clipboard-list',  label:'Inventario',         color:'#3B4FE8' },
              { href:'/mantenimiento', icon:'ti-tool',            label:'Mantenimiento',       color:'#7C3AED' },
              { href:'/ordenes',       icon:'ti-clipboard-check', label:'Órdenes de trabajo',  color:'#0891B2' },
              { href:'/prediccion',    icon:'ti-trending-up',     label:'Predicción',          color:'#D97706' },
              { href:'/kpis',          icon:'ti-chart-bar',       label:'KPIs',                color:'#16A34A' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:10, border:'0.5px solid #E4E4E7', padding:'14px 16px', textDecoration:'none', color:'#3F3F46', fontSize:12, fontWeight:500, transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = a.color + '08' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.background = '#fff' }}>
                <div style={{ width:34, height:34, borderRadius:8, background:a.color+'12', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={'ti ' + a.icon} style={{ fontSize:17, color:a.color }} />
                </div>
                {a.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
