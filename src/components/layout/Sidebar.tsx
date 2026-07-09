'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label:'Inicio', icon:'ti-home', href:'/dashboard', single:true },
  {
    label:'Activos', icon:'ti-device-heart-monitor',
    children:[
      { label:'Inventario',    icon:'ti-clipboard-list',   href:'/inventario',  desc:'Equipos biomédicos' },
      { label:'Movimientos',   icon:'ti-arrows-exchange',  href:'/movimientos', desc:'Traslados y bajas' },
      { label:'Documentacion', icon:'ti-files',            href:'/documentos',  desc:'PDFs por equipo' },
      { label:'Códigos QR',    icon:'ti-qrcode',           href:'/inventario/qr',          desc:'Etiquetas por equipo' },
    ],
  },
  {
    label:'Mantenimiento', icon:'ti-tool',
    children:[
      { label:'Cronograma',         icon:'ti-calendar',        href:'/mantenimiento', desc:'Plan anual' },
      { label:'Ordenes de trabajo', icon:'ti-clipboard-check', href:'/ordenes',       desc:'Kanban' },
      { label:'Protocolos',         icon:'ti-list-check',      href:'/protocolos',    desc:'Por tipo de equipo' },
      { label:'Reportes Servicio',   icon:'ti-report',          href:'/servicios',     desc:'Historial técnico' },
    ],
  },
  {
    label:'Almacen', icon:'ti-package',
    children:[
      { label:'Repuestos', icon:'ti-package',          href:'/repuestos', desc:'Stock e inventario' },
      { label:'Contratos', icon:'ti-file-certificate', href:'/contratos', desc:'Proveedores y contratos' },
    ],
  },
  {
    label:'Calidad', icon:'ti-shield-check',
    children:[
      { label:'Metrología PAME',  icon:'ti-ruler-measure',      href:'/metrologia',      desc:'Calibración de equipos' },
      { label:'Tecnovigilancia',  icon:'ti-shield-exclamation', href:'/tecnovigilancia', desc:'Eventos adversos INVIMA' },
      { label:'Auditorías',       icon:'ti-shield-check',       href:'/auditoria',       desc:'MSPS, Supersalud' },
      { label:'Solicitudes',      icon:'ti-message-report',     href:'/solicitudes',     desc:'Servicio clínico' },
      { label:'Evaluación Reemplazo',icon:'ti-replace',             href:'/reemplazo',       desc:'EVDM · Obsolescencia' },
      { label:'Capacitaciones',       icon:'ti-certificate',         href:'/capacitaciones',  desc:'Competencias del personal' },
    ],
  },
  {
    label:'Business Intelligence', icon:'ti-chart-bar',
    children:[
      { label:'Dashboard',    icon:'ti-layout-dashboard', href:'/dashboard',  desc:'Vista ejecutiva' },
      { label:'KPIs',         icon:'ti-chart-dots',       href:'/kpis',       desc:'Indicadores clave' },
      { label:'Prediccion IA',icon:'ti-trending-up',      href:'/prediccion', desc:'Análisis predictivo' },
      { label:'Presupuesto',  icon:'ti-currency-dollar',  href:'/presupuesto',desc:'Control financiero' },
    ],
  },
  { label:'Asistente IA', icon:'ti-message', href:'/chat', single:true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [abiertos, setAbiertos] = useState<Record<string,boolean>>({ 'Activos':true })
  const [userInfo, setUserInfo] = useState<any>(null)
  const toggle = (label:string) => setAbiertos(p=>({...p,[label]:!p[label]}))
  const isActive = (href:string) => pathname.startsWith(href)

  useEffect(()=>{
    const supabase = createClient()
    supabase.auth.getUser().then(({data})=>{
      if(data?.user) setUserInfo(data.user.user_metadata)
    })
  },[])

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>
      <aside style={{position:'fixed',left:0,top:0,height:'100vh',width:248,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',zIndex:50,overflowY:'auto'}}>

        <div style={{padding:'16px',borderBottom:'0.5px solid #E4E4E7',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'#1B2B5B',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="ti ti-activity" style={{color:'#fff',fontSize:19}}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#18181B',lineHeight:1.2}}>SYNAP</div>
              <div style={{fontSize:10,color:'#A1A1AA'}}>v0.1.0</div>
            </div>
          </div>
        </div>

        <div style={{padding:'10px 14px',borderBottom:'0.5px solid #E4E4E7',flexShrink:0}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Institucion</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,borderRadius:6,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="ti ti-building-hospital" style={{fontSize:13,color:'#1B2B5B'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,color:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userInfo?.institucion_nombre||'IPS Demo'}</div>
              <div style={{fontSize:10,color:'#A1A1AA'}}>{userInfo?.nombre||'Plan Profesional'}</div>
            </div>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',flexShrink:0}}/>
          </div>
        </div>

        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          {NAV.map((item)=>{
            if(item.single && item.href){
              const active=isActive(item.href)
              return(
                <Link key={item.label} href={item.href} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',margin:'1px 8px',borderRadius:7,textDecoration:'none',background:active?'#EEF2FF':'transparent',color:active?'#1B2B5B':'#52525B'}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='#F8F9FA'}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}>
                  <i className={'ti '+item.icon} style={{fontSize:17,color:active?'#1B2B5B':'#A1A1AA',flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:active?500:400}}>{item.label}</span>
                </Link>
              )
            }
            const abierto=abiertos[item.label]||false
            const anyActive=item.children?.some(c=>pathname.startsWith(c.href)&&c.href!=='/dashboard')
            return(
              <div key={item.label}>
                <button onClick={()=>toggle(item.label)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 14px',margin:'1px 0',border:'none',background:anyActive?'#EEF2FF':'transparent',cursor:'pointer',textAlign:'left'}}
                  onMouseEnter={e=>{if(!anyActive)e.currentTarget.style.background='#F8F9FA'}}
                  onMouseLeave={e=>{if(!anyActive)e.currentTarget.style.background=anyActive?'#EEF2FF':'transparent'}}>
                  <i className={'ti '+item.icon} style={{fontSize:17,color:anyActive?'#1B2B5B':'#A1A1AA',flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:anyActive?500:400,color:anyActive?'#1B2B5B':'#52525B',flex:1}}>{item.label}</span>
                  <i className={'ti '+(abierto?'ti-chevron-down':'ti-chevron-right')} style={{fontSize:13,color:'#A1A1AA',flexShrink:0}}/>
                </button>
                {abierto&&(
                  <div style={{paddingLeft:14,paddingBottom:4}}>
                    {item.children?.map(child=>{
                      const active=pathname.startsWith(child.href)&&child.href!=='/dashboard'
                      return(
                        <Link key={child.label+child.href} href={child.href} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px 7px 14px',margin:'1px 8px 1px 0',borderRadius:7,textDecoration:'none',background:active?'#EEF2FF':'transparent',borderLeft:`2px solid ${active?'#1B2B5B':'transparent'}`}}
                          onMouseEnter={e=>{if(!active){e.currentTarget.style.background='#F8F9FA';e.currentTarget.style.borderLeftColor='#E4E4E7'}}}
                          onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.borderLeftColor='transparent'}}}>
                          <i className={'ti '+child.icon} style={{fontSize:15,color:active?'#1B2B5B':'#A1A1AA',flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:active?500:400,color:active?'#1B2B5B':'#3F3F46',lineHeight:1.3}}>{child.label}</div>
                            <div style={{fontSize:10,color:'#A1A1AA',lineHeight:1.3}}>{child.desc}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7',flexShrink:0}}>
          <Link href="/admin" style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:7,textDecoration:'none',background:'#F8F9FA',border:'0.5px solid #E4E4E7',marginBottom:8}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#1B2B5B';e.currentTarget.style.background='#EEF2FF'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#E4E4E7';e.currentTarget.style.background='#F8F9FA'}}>
            <i className="ti ti-shield-check" style={{fontSize:15,color:'#1B2B5B'}}/>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:'#18181B'}}>Super Admin</div>
              <div style={{fontSize:10,color:'#A1A1AA'}}>Panel de control</div>
            </div>
          </Link>
          <button onClick={async()=>{const s=createClient();await s.auth.signOut();window.location.href='/login'}}
            style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#FEF2F2',cursor:'pointer',marginBottom:8}}>
            <i className="ti ti-logout" style={{fontSize:15,color:'#DC2626'}}/>
            <div style={{fontSize:12,fontWeight:500,color:'#DC2626'}}>Cerrar sesión</div>
          </button>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E'}}/>
            <span style={{fontSize:11,color:'#A1A1AA'}}>Sistema operativo</span>
          </div>
        </div>

      </aside>
    </>
  )
}
