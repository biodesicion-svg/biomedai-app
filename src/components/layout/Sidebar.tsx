'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  BarChart3,
  DollarSign,
  MessageSquare,
  Activity,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, desc: 'Vista general' },
  { href: '/inventario',    label: 'Inventario',    icon: ClipboardList,   desc: 'Equipos biomédicos' },
  { href: '/mantenimiento', label: 'Mantenimiento', icon: Wrench,          desc: 'Órdenes y cronograma' },
  { href: '/kpis',          label: 'KPIs',          icon: BarChart3,       desc: 'Indicadores clave' },
  { href: '/presupuesto',   label: 'Presupuesto',   icon: DollarSign,      desc: 'Control financiero' },
  { href: '/chat',          label: 'Asistente IA',  icon: MessageSquare,   desc: 'Copiloto biomédico' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: '#0f1623', borderRight: '1px solid #1e2d3d' }}>

      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-tight">BioMed AI</div>
          </div>
        </div>
        <div className="mt-3 px-2 py-1.5 rounded text-xs font-medium"
          style={{ background: '#0d9488' + '15', color: '#2dd4bf', border: '1px solid #0d948820' }}>
          IPS Mediana Complejidad
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#3d5166' }}>
            Módulos
          </span>
        </div>
        {navItems.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all relative"
              style={{
                background: active ? '#0d948812' : 'transparent',
                border: active ? '1px solid #0d948830' : '1px solid transparent',
              }}>
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: '#0d9488' }} />
              )}
              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: active ? '#0d948820' : '#1e2d3d',
                }}>
                <Icon className="w-4 h-4"
                  style={{ color: active ? '#2dd4bf' : '#4a6580' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-none mb-0.5"
                  style={{ color: active ? '#e2e8f0' : '#7a9bb5' }}>
                  {label}
                </div>
                <div className="text-xs truncate"
                  style={{ color: active ? '#4a9090' : '#3d5166' }}>
                  {desc}
                </div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: '#2dd4bf' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #1e2d3d' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-xs" style={{ color: '#3d5166' }}>Sistema operativo</span>
          </div>
          <span className="text-xs font-mono" style={{ color: '#3d5166' }}>v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
