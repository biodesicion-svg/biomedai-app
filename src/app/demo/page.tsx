'use client'
import Link from 'next/link'

const DEMOS = [
  {
    titulo: 'Demo IPS Mediana Complejidad',
    descripcion: 'Hospital con 1,438 equipos biomédicos reales. Incluye todos los módulos activos.',
    codigo: 'BIOMED-DEMO-2025',
    modulos: ['Dashboard','Inventario','Mantenimiento','Órdenes','KPIs','Repuestos','Predicción','Auditoría','Asistente'],
    equipos: 1438,
    tecnicos: 3,
    color: '#3B4FE8',
    href: '/dashboard',
  },
  {
    titulo: 'Demo Clínica Pequeña — Plan Básico',
    descripcion: 'Clínica con módulos básicos: inventario, mantenimiento y KPIs.',
    codigo: 'BIOMED-BASIC-2025',
    modulos: ['Dashboard','Inventario','Mantenimiento','Órdenes','KPIs'],
    equipos: 80,
    tecnicos: 1,
    color: '#16A34A',
    href: '/dashboard',
  },
  {
    titulo: 'Demo Red Hospitalaria — Enterprise',
    descripcion: 'Red con múltiples sedes, predicción IA y presupuesto avanzado.',
    codigo: 'BIOMED-ENT-2025',
    modulos: ['Dashboard','Inventario','Mantenimiento','Órdenes','KPIs','Repuestos','Predicción','Presupuesto','Auditoría','Asistente IA'],
    equipos: 5000,
    tecnicos: 15,
    color: '#7C3AED',
    href: '/dashboard',
  },
]

export default function DemoPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #E4E4E7', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'#3B4FE8', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-activity" style={{ color:'#fff', fontSize:17 }}/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#18181B' }}>SYNAP</div>
            <div style={{ fontSize:10, color:'#A1A1AA' }}>Demos del sistema</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/admin" style={{ padding:'7px 14px', borderRadius:7, border:'0.5px solid #E4E4E7', color:'#52525B', textDecoration:'none', fontSize:13 }}>Panel Admin</Link>
          <Link href="/dashboard" style={{ padding:'7px 14px', borderRadius:7, border:'none', background:'#3B4FE8', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:500 }}>Ir al sistema</Link>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:'#EEF2FF', color:'#3B4FE8', fontSize:12, fontWeight:500, marginBottom:16 }}>
            <i className="ti ti-sparkles" style={{ fontSize:13 }}/> Demos interactivos
          </div>
          <h1 style={{ fontSize:32, fontWeight:700, color:'#18181B', margin:'0 0 12px' }}>
            Explora SYNAP sin crear cuenta
          </h1>
          <p style={{ fontSize:15, color:'#71717A', maxWidth:520, margin:'0 auto' }}>
            Prueba el sistema con datos reales de instituciones de salud colombianas. Sin configuración, sin tarjeta de crédito.
          </p>
        </div>

        {/* Cards demo */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:48 }}>
          {DEMOS.map((d, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${d.color}30`, overflow:'hidden', display:'flex' }}>
              <div style={{ width:6, background:d.color, flexShrink:0 }}/>
              <div style={{ flex:1, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, fontWeight:600, color:'#18181B', marginBottom:4 }}>{d.titulo}</div>
                    <div style={{ fontSize:13, color:'#71717A', marginBottom:12 }}>{d.descripcion}</div>
                    <div style={{ display:'flex', gap:16, fontSize:12, color:'#A1A1AA', marginBottom:12 }}>
                      <span><i className="ti ti-device-heart-monitor" style={{ fontSize:13, marginRight:4 }}/>{d.equipos.toLocaleString('es-CO')} equipos</span>
                      <span><i className="ti ti-users" style={{ fontSize:13, marginRight:4 }}/>{d.tecnicos} técnicos</span>
                      <span><i className="ti ti-apps" style={{ fontSize:13, marginRight:4 }}/>{d.modulos.length} módulos</span>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {d.modulos.map(m => (
                        <span key={m} style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:d.color+'12', color:d.color, fontWeight:500 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'#A1A1AA', marginBottom:6 }}>Código de acceso</div>
                    <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#18181B', background:'#F8F9FA', padding:'6px 12px', borderRadius:6, marginBottom:12, border:'0.5px solid #E4E4E7' }}>
                      {d.codigo}
                    </div>
                    <Link href={d.href} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', background:d.color, color:'#fff', textDecoration:'none', fontSize:13, fontWeight:500 }}>
                      Explorar demo <i className="ti ti-arrow-right" style={{ fontSize:13 }}/>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ background:'#F8F9FA', borderRadius:12, padding:'32px', marginBottom:32 }}>
          <div style={{ fontSize:16, fontWeight:600, color:'#18181B', marginBottom:20, textAlign:'center' }}>¿Qué incluye cada demo?</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { icon:'ti-database', titulo:'Datos reales', desc:'1,438 equipos biomédicos de un hospital colombiano real' },
              { icon:'ti-brain', titulo:'IA incluida', desc:'Predicción de fallas, protocolos de mantenimiento y asistente' },
              { icon:'ti-shield-check', titulo:'Normativa colombiana', desc:'Res. 4816/2008, Res. 3100/2019, INVIMA, Supersalud' },
              { icon:'ti-chart-bar', titulo:'KPIs en tiempo real', desc:'MTBF, MTTR, disponibilidad y ratio preventivo/correctivo' },
              { icon:'ti-users', titulo:'Multi-rol', desc:'Super admin, admin IPS, supervisor y técnico biomédico' },
              { icon:'ti-file-description', titulo:'Reportes PDF', desc:'Órdenes de trabajo, auditorías y diagnósticos exportables' },
            ].map(f => (
              <div key={f.titulo} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:34, height:34, borderRadius:8, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={'ti '+f.icon} style={{ fontSize:16, color:'#3B4FE8' }}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#18181B', marginBottom:2 }}>{f.titulo}</div>
                  <div style={{ fontSize:11, color:'#71717A', lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', padding:'32px', borderRadius:12, background:'#3B4FE8', color:'#fff' }}>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>¿Listo para tu institución?</div>
          <div style={{ fontSize:13, opacity:0.8, marginBottom:20 }}>Contacta al equipo de SYNAP para activar tu licencia</div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <Link href="/admin" style={{ padding:'10px 20px', borderRadius:8, background:'#fff', color:'#3B4FE8', textDecoration:'none', fontSize:13, fontWeight:600 }}>
              Panel de administración
            </Link>
            <a href="mailto:admin@synap.co" style={{ padding:'10px 20px', borderRadius:8, background:'rgba(255,255,255,0.15)', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:500, border:'0.5px solid rgba(255,255,255,0.3)' }}>
              Contactar ventas
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
