'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const INST = '00000000-0000-0000-0000-000000000001'

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height: 4, background: '#F4F4F5', borderRadius: 2, marginTop: 6 }}>
      <div style={{ height: 4, borderRadius: 2, width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  )
}

function Semaforo({ value, meta, invert = false }: { value: number; meta: number; invert?: boolean }) {
  const ok = invert ? value <= meta : value >= meta
  const warn = invert ? value <= meta * 1.3 : value >= meta * 0.7
  const color = ok ? '#16A34A' : warn ? '#D97706' : '#DC2626'
  const label = ok ? 'Óptimo' : warn ? 'Alerta' : 'Crítico'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [alertas, setAlertas] = useState<any[]>([])
  const [equiposCriticos, setEquiposCriticos] = useState<any[]>([])
  const [repuestosBajos, setRepuestosBajos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    async function cargar() {
      // KPIs
      const kRes = await fetch('/api/kpis').then(r => r.json()).catch(() => null)
      if (kRes) setKpis(kRes)

      // Equipos críticos
      const supabase = createClient()
      const { data: eqs } = await supabase
        .from('equipos')
        .select('id, nombre, riesgo, estado, servicio, anio_adquisicion, vida_util_anos')
        .eq('institucion_id', INST)
        .eq('activo', true)
        .eq('riesgo', 'alto')
        .eq('estado', 'operativo')
        .limit(6)
      setEquiposCriticos(eqs || [])

      // Repuestos con stock bajo
      const rRes = await fetch('/api/repuestos').then(r => r.json()).catch(() => ({ repuestos: [] }))
      const bajos = (rRes.repuestos || []).filter((r: any) => r.stock_actual <= r.stock_minimo).slice(0, 5)
      setRepuestosBajos(bajos)

      // Generar alertas
      const al: any[] = []
      if (bajos.length > 0) al.push({ tipo: 'stock', msg: `${bajos.length} repuesto(s) con stock bajo o agotado`, href: '/repuestos', c: '#DC2626', bg: '#FEF2F2', icon: 'ti-package' })
      if (eqs && eqs.length > 0) {
        const anioActual = new Date().getFullYear()
        const vencidos = eqs.filter((e: any) => e.vida_util_anos && e.anio_adquisicion && (anioActual - e.anio_adquisicion) >= e.vida_util_anos)
        if (vencidos.length > 0) al.push({ tipo: 'vida', msg: `${vencidos.length} equipo(s) con vida útil vencida`, href: '/inventario', c: '#D97706', bg: '#FFFBEB', icon: 'ti-clock-exclamation' })
      }
      if (kRes && Number(kRes.disponibilidad) < 70) al.push({ tipo: 'disp', msg: `Disponibilidad crítica: ${kRes.disponibilidad}% (meta ≥ 70%)`, href: '/kpis', c: '#DC2626', bg: '#FEF2F2', icon: 'ti-alert-triangle' })
      if (kRes && kRes.preventivos === 0) al.push({ tipo: 'prev', msg: 'Sin mantenimientos preventivos registrados', href: '/mantenimiento', c: '#D97706', bg: '#FFFBEB', icon: 'ti-tool' })
      setAlertas(al)
      setLoading(false)
    }
    cargar()
  }, [])

  const Sk = ({ w = '100%', h = 20 }: any) => (
    <div style={{ width: w, height: h, background: '#F4F4F5', borderRadius: 4 }} />
  )

  const fmtCOP = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #E4E4E7', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: '#18181B', margin: 0 }}>Dashboard ejecutivo</h1>
          <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2, textTransform: 'capitalize' }}>{fecha}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { href: '/mantenimiento', icon: 'ti-tool', label: 'Mantenimiento' },
            { href: '/ordenes', icon: 'ti-clipboard-check', label: 'Órdenes' },
            { href: '/prediccion', icon: 'ti-trending-up', label: 'Predicción' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '0.5px solid #E4E4E7', background: '#fff', color: '#52525B', textDecoration: 'none', fontSize: 12, fontWeight: 500, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B4FE8'; e.currentTarget.style.color = '#3B4FE8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.color = '#52525B' }}>
              <i className={'ti ' + a.icon} style={{ fontSize: 14 }} />{a.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Alertas activas */}
        {!loading && alertas.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {alertas.map((a, i) => (
              <Link key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: a.bg, border: `0.5px solid ${a.c}30`, textDecoration: 'none', flex: '1 1 200px' }}>
                <i className={'ti ' + a.icon} style={{ fontSize: 14, color: a.c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: a.c, fontWeight: 500 }}>{a.msg}</span>
                <i className="ti ti-chevron-right" style={{ fontSize: 12, color: a.c, marginLeft: 'auto', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        )}

        {/* Fila 1: KPIs principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Total equipos', value: kpis?.total, sub: 'En inventario activo', color: '#3B4FE8', icon: 'ti-device-heart-monitor', meta: null },
            { label: 'Disponibilidad', value: kpis?.disponibilidad ? `${kpis.disponibilidad}%` : null, sub: `${kpis?.operativos || 0} operativos de ${kpis?.total || 0}`, color: Number(kpis?.disponibilidad) >= 90 ? '#16A34A' : Number(kpis?.disponibilidad) >= 70 ? '#D97706' : '#DC2626', icon: 'ti-check', semaforo: { value: Number(kpis?.disponibilidad), meta: 90 } },
            { label: 'Alto riesgo', value: kpis?.altoRiesgo, sub: `${kpis?.medioRiesgo || 0} medio · ${kpis?.bajoRiesgo || 0} bajo`, color: '#DC2626', icon: 'ti-alert-triangle', meta: null },
            { label: 'Dados de baja', value: kpis?.bajas, sub: 'Equipos retirados de servicio', color: '#71717A', icon: 'ti-archive', meta: null },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: '#71717A', fontWeight: 500 }}>{k.label}</span>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: k.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={'ti ' + k.icon} style={{ fontSize: 15, color: k.color }} />
                </div>
              </div>
              {loading ? <Sk h={28} w={60} /> : <div style={{ fontSize: 28, fontWeight: 700, color: '#18181B', marginBottom: 2 }}>{k.value?.toLocaleString?.('es-CO') ?? k.value}</div>}
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 4 }}>{k.sub}</div>
              {k.semaforo && !loading && <Semaforo value={k.semaforo.value} meta={k.semaforo.meta} />}
            </div>
          ))}
        </div>

        {/* Fila 2: KPIs técnicos con semáforos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            {
              label: 'MTBF', value: kpis?.mtbf, unit: 'días', sub: 'Tiempo medio entre fallas',
              color: '#3B4FE8', meta: 180, semaforo: { value: Number(kpis?.mtbf), meta: 180 },
              desc: '≥ 180 días = óptimo'
            },
            {
              label: 'MTTR', value: kpis?.mttr === '0' ? 'N/D' : kpis?.mttr, unit: kpis?.mttr === '0' ? '' : 'hrs', sub: 'Tiempo medio de reparación',
              color: '#7C3AED', meta: 24, semaforo: kpis?.mttr !== '0' ? { value: Number(kpis?.mttr), meta: 24, invert: true } : null,
              desc: '≤ 24 hrs = óptimo'
            },
            {
              label: 'Ratio Prev/Corr', value: kpis?.ratio, unit: '', sub: 'Preventivos vs correctivos',
              color: Number(kpis?.ratio) >= 0.8 ? '#16A34A' : '#DC2626',
              semaforo: { value: Number(kpis?.ratio) * 100, meta: 80 },
              desc: '≥ 0.80 = óptimo'
            },
            {
              label: 'Total mantenimientos', value: kpis?.totalMant, unit: '', sub: `${kpis?.preventivos || 0} prev · ${kpis?.correctivos || 0} corr`,
              color: '#D97706', meta: null, semaforo: null, desc: 'Historial completo'
            },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#71717A', fontWeight: 500, marginBottom: 10 }}>{k.label}</div>
              {loading ? <Sk h={24} w={80} /> : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</span>
                  {k.unit && <span style={{ fontSize: 12, color: k.color, opacity: 0.7 }}>{k.unit}</span>}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 6 }}>{k.sub}</div>
              {k.semaforo && !loading && <Semaforo value={k.semaforo.value} meta={k.semaforo.meta} invert={(k.semaforo as any).invert} />}
              <div style={{ fontSize: 10, color: '#D4D4D8', marginTop: 4 }}>{k.desc}</div>
            </div>
          ))}
        </div>

        {/* Fila 3: 3 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          {/* Distribución mantenimientos */}
          <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Distribución de mantenimientos</div>
            <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 14 }}>Por tipo · histórico completo</div>
            {loading ? <Sk h={100} /> : (kpis?.porTipo || []).map((t: any) => {
              const c = t.label === 'Preventivo' ? '#22C55E' : t.label === 'Correctivo' ? '#EF4444' : '#F59E0B'
              return (
                <div key={t.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      <span style={{ fontSize: 12, color: '#52525B' }}>{t.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#18181B' }}>{t.value.toLocaleString('es-CO')}</span>
                      <span style={{ color: '#A1A1AA' }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F4F4F5', borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${t.pct}%`, background: c }} />
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: Number(kpis?.ratio) >= 0.8 ? '#F0FDF4' : '#FEF2F2', border: `0.5px solid ${Number(kpis?.ratio) >= 0.8 ? '#BBF7D0' : '#FECACA'}` }}>
              <div style={{ fontSize: 11, color: Number(kpis?.ratio) >= 0.8 ? '#16A34A' : '#DC2626', fontWeight: 500 }}>
                {Number(kpis?.ratio) >= 0.8 ? '✓ Ratio preventivo/correctivo óptimo' : '⚠ Ratio correctivo supera al preventivo'}
              </div>
            </div>
          </div>

          {/* Equipos críticos */}
          <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', overflow: 'hidden' }}>
            <div style={{ padding: '18px 18px 12px', borderBottom: '0.5px solid #F4F4F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B' }}>Equipos de alto riesgo</div>
                <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>Operativos que requieren atención</div>
              </div>
              <Link href="/prediccion" style={{ fontSize: 11, color: '#3B4FE8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                Ver análisis <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
              </Link>
            </div>
            <div>
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 18px', borderBottom: '0.5px solid #F8F9FA', display: 'flex', gap: 10 }}>
                  <Sk w={24} h={24} /><div style={{ flex: 1 }}><Sk h={12} /></div>
                </div>
              )) : equiposCriticos.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: '#A1A1AA' }}>
                  <i className="ti ti-check" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#22C55E' }} />No hay equipos críticos operativos
                </div>
              ) : equiposCriticos.map((e, i) => {
                const anioActual = new Date().getFullYear()
                const edad = e.anio_adquisicion ? anioActual - e.anio_adquisicion : null
                const pctVida = e.vida_util_anos && edad ? Math.min(Math.round((edad / e.vida_util_anos) * 100), 100) : null
                return (
                  <Link key={i} href={`/inventario/${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '0.5px solid #F8F9FA', textDecoration: 'none', transition: 'background 0.1s' }}
                    onMouseEnter={el => el.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={el => el.currentTarget.style.background = '#fff'}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</div>
                      <div style={{ fontSize: 10, color: '#A1A1AA' }}>{e.servicio}</div>
                    </div>
                    {pctVida !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: pctVida >= 80 ? '#DC2626' : '#D97706' }}>{pctVida}%</div>
                        <div style={{ fontSize: 9, color: '#A1A1AA' }}>vida útil</div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Panel derecho: disponibilidad + repuestos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Disponibilidad por servicio */}
            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '18px', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Disponibilidad por servicio</div>
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 12 }}>Top servicios</div>
              {loading ? <Sk h={80} /> : (kpis?.porServicio || []).slice(0, 4).map((s: any) => {
                const disp = Number(s.disponibilidad)
                const c = disp >= 90 ? '#22C55E' : disp >= 70 ? '#F59E0B' : '#EF4444'
                return (
                  <div key={s.nombre} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#3F3F46', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.nombre}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: c, flexShrink: 0 }}>{s.disponibilidad}%</span>
                    </div>
                    <div style={{ height: 4, background: '#F4F4F5', borderRadius: 2 }}>
                      <div style={{ height: 4, borderRadius: 2, width: `${s.disponibilidad}%`, background: c }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Repuestos con stock bajo */}
            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B' }}>Repuestos críticos</div>
                <Link href="/repuestos" style={{ fontSize: 11, color: '#3B4FE8', textDecoration: 'none' }}>Ver todos</Link>
              </div>
              {loading ? <Sk h={60} /> : repuestosBajos.length === 0 ? (
                <div style={{ fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-check" style={{ fontSize: 14 }} />Todos los repuestos en stock óptimo
                </div>
              ) : repuestosBajos.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #F8F9FA' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: r.stock_actual === 0 ? '#DC2626' : '#D97706', flexShrink: 0, marginLeft: 8 }}>
                    {r.stock_actual === 0 ? 'Sin stock' : `${r.stock_actual} uds`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 4: Accesos rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {[
            { href: '/inventario',    icon: 'ti-clipboard-list',  label: 'Inventario',         desc: `${kpis?.total || '—'} equipos`,        color: '#3B4FE8' },
            { href: '/mantenimiento', icon: 'ti-tool',            label: 'Mantenimiento',       desc: 'Cronograma 2025',                       color: '#7C3AED' },
            { href: '/ordenes',       icon: 'ti-clipboard-check', label: 'Órdenes de trabajo',  desc: 'Kanban mensual',                        color: '#0891B2' },
            { href: '/kpis',          icon: 'ti-chart-bar',       label: 'KPIs',                desc: `Disponibilidad ${kpis?.disponibilidad || '—'}%`, color: '#16A34A' },
            { href: '/auditoria',     icon: 'ti-shield-check',    label: 'Auditoría',           desc: 'Simulación MSPS',                       color: '#D97706' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', borderRadius: 10, border: '0.5px solid #E4E4E7', padding: '14px 16px', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = a.color + '06' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.background = '#fff' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={'ti ' + a.icon} style={{ fontSize: 16, color: a.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B' }}>{a.label}</div>
                <div style={{ fontSize: 10, color: '#A1A1AA', marginTop: 1 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
