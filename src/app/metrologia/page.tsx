'use client'
import { useState, useEffect } from 'react'

const AZ='#1B2B5B', VE='#16A34A', RO='#DC2626', NA='#D97706', GR='#64748B', MO='#7C3AED'
const VE_BG='#F0FDF4', RO_BG='#FEF2F2', NA_BG='#FFFBEB', AZ_BG='#EEF2FF', MO_BG='#F5F3FF'

const MAGNITUD_ICON: any = {
  masa: 'ti-weight', temperatura: 'ti-thermometer', presion: 'ti-gauge',
  glucosa: 'ti-droplet', humedad: 'ti-droplet-half', volumen: 'ti-flask',
  longitud: 'ti-ruler', otro: 'ti-circle'
}
const MAGNITUD_COLOR: any = {
  masa: AZ, temperatura: RO, presion: MO, glucosa: NA, humedad: VE, volumen: GR, longitud: AZ, otro: GR
}
const MAGNITUD_BG: any = {
  masa: AZ_BG, temperatura: RO_BG, presion: MO_BG, glucosa: NA_BG, humedad: VE_BG, volumen: '#F4F4F5', longitud: AZ_BG, otro: '#F4F4F5'
}

function fmtFecha(s: string) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EstadoBadge({ estado, dias }: any) {
  if (estado === 'vencido') return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: RO_BG, color: RO, fontWeight: 600 }}>Vencido</span>
  if (estado === 'proximo') return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: NA_BG, color: NA, fontWeight: 600 }}>Vence en {dias}d</span>
  if (estado === 'vigente') return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: VE_BG, color: VE, fontWeight: 600 }}>Vigente</span>
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#F4F4F5', color: GR, fontWeight: 600 }}>Sin calibrar</span>
}

function ResultadoBadge({ r }: any) {
  if (r === 'conforme') return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: VE_BG, color: VE, fontWeight: 600 }}>Conforme</span>
  if (r === 'no_conforme') return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: RO_BG, color: RO, fontWeight: 600 }}>No conforme</span>
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: NA_BG, color: NA, fontWeight: 600 }}>Conforme c/obs</span>
}

function MagnitudBadge({ m }: any) {
  const icon = MAGNITUD_ICON[m] || 'ti-circle'
  const color = MAGNITUD_COLOR[m] || GR
  const bg = MAGNITUD_BG[m] || '#F4F4F5'
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: bg, color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <i className={`ti ${icon}`} style={{ fontSize: 11 }} />{m}
  </span>
}

function GaugePct({ pct, label, color }: any) {
  const r = 36, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="#F1F5F9" strokeWidth={8} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x={45} y={49} textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>{pct}%</text>
      </svg>
      <span style={{ fontSize: 11, color: GR, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function CurvaChart({ puntos, tolerancia, unidad }: any) {
  if (!puntos || puntos.length === 0) return <div style={{ color: GR, fontSize: 12, textAlign: 'center', padding: 16 }}>Sin puntos de calibración</div>
  const errores = puntos.map((p: any) => p.error)
  const maxErr = Math.max(...errores.map(Math.abs), tolerancia || 1) * 1.3
  const W = 300, H = 120, PAD = 30
  const scaleX = (i: number) => PAD + (i / (puntos.length - 1 || 1)) * (W - PAD * 2)
  const scaleY = (v: number) => H / 2 - (v / maxErr) * (H / 2 - 10)
  const pts = puntos.map((p: any, i: number) => `${scaleX(i)},${scaleY(p.error)}`).join(' ')
  const tolY = scaleY(tolerancia || 0)
  const tolNY = scaleY(-(tolerancia || 0))
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <line x1={PAD} y1={tolY} x2={W - PAD} y2={tolY} stroke={RO} strokeDasharray="4,3" strokeWidth={1} opacity={0.6} />
      <line x1={PAD} y1={tolNY} x2={W - PAD} y2={tolNY} stroke={RO} strokeDasharray="4,3" strokeWidth={1} opacity={0.6} />
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#E2E8F0" strokeWidth={1} />
      <polyline points={pts} fill="none" stroke={AZ} strokeWidth={2} strokeLinejoin="round" />
      {puntos.map((p: any, i: number) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(p.error)} r={4}
          fill={p.dentro_tolerancia ? VE : RO} stroke="#fff" strokeWidth={1.5} />
      ))}
      <text x={PAD - 4} y={tolY + 4} fontSize={8} fill={RO} textAnchor="end">+tol</text>
      <text x={PAD - 4} y={tolNY + 4} fontSize={8} fill={RO} textAnchor="end">-tol</text>
      <text x={W / 2} y={H - 2} fontSize={9} fill={GR} textAnchor="middle">Puntos de calibración ({unidad})</text>
    </svg>
  )
}

export default function MetrologiaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'plan' | 'calibraciones' | 'dashboard'>('dashboard')
  const [sel, setSel] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrologia').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <i className="ti ti-ruler-measure" style={{ fontSize: 40, color: AZ, display: 'block', marginBottom: 12 }} />
        <div style={{ color: GR, fontSize: 14 }}>Cargando módulo PAME...</div>
      </div>
    </div>
  )

  const { equipos = [], kpis = {} } = data || {}
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { id: 'plan', label: 'Plan PAME', icon: 'ti-list-check' },
    { id: 'calibraciones', label: 'Calibraciones', icon: 'ti-certificate' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ padding: '20px 0 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: AZ_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-ruler-measure" style={{ fontSize: 20, color: AZ }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: AZ }}>Metrología PAME</h1>
              <p style={{ margin: 0, fontSize: 12, color: GR }}>Plan de Aseguramiento Metrológico de Equipos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.id ? AZ : GR, borderBottom: tab === t.id ? `2px solid ${AZ}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ${t.icon}`} />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total equipos', val: kpis.total, icon: 'ti-ruler-measure', color: AZ, bg: AZ_BG },
                { label: 'Vigentes', val: kpis.vigentes, icon: 'ti-circle-check', color: VE, bg: VE_BG },
                { label: 'Próximos 30d', val: kpis.proximos, icon: 'ti-clock-exclamation', color: NA, bg: NA_BG },
                { label: 'Vencidos', val: kpis.vencidos, icon: 'ti-circle-x', color: RO, bg: RO_BG },
                { label: 'Sin calibrar', val: kpis.sinCal, icon: 'ti-help-circle', color: GR, bg: '#F4F4F5' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <i className={`ti ${k.icon}`} style={{ fontSize: 18, color: k.color }} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: GR, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Gauge cumplimiento + tabla resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: AZ }}>Cumplimiento PAME</div>
                <GaugePct pct={kpis.cumplimiento} label="Equipos vigentes" color={kpis.cumplimiento >= 80 ? VE : kpis.cumplimiento >= 50 ? NA : RO} />
                <div style={{ fontSize: 11, color: GR, textAlign: 'center' }}>ISO/IEC 17025 · Res. 2003/2014</div>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: AZ }}>
                  Estado por equipo metrológico
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Equipo', 'Magnitud', 'Última cal.', 'Próxima cal.', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: GR, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {equipos.map((e: any, i: number) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{e.equipo_nombre}</div>
                          <div style={{ fontSize: 11, color: GR }}>{e.equipo_ubicacion}</div>
                        </td>
                        <td style={{ padding: '10px 16px' }}><MagnitudBadge m={e.magnitud} /></td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>{e.ultima_calibracion ? fmtFecha(e.ultima_calibracion.fecha_calibracion) : '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>{e.ultima_calibracion ? fmtFecha(e.ultima_calibracion.fecha_proxima) : '—'}</td>
                        <td style={{ padding: '10px 16px' }}><EstadoBadge estado={e.estado} dias={e.dias_restantes} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PLAN PAME TAB */}
        {tab === 'plan' && (
          <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 380px' : '1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: AZ }}>Equipos en el PAME ({equipos.length})</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Equipo', 'Magnitud', 'Rango', 'Tolerancia', 'Frecuencia', 'Laboratorio', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: GR, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipos.map((e: any, i: number) => (
                    <tr key={i} onClick={() => setSel(sel?.id === e.id ? null : e)}
                      style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer', background: sel?.id === e.id ? AZ_BG : 'transparent' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{e.equipo_nombre}</div>
                        <div style={{ fontSize: 11, color: GR }}>{e.equipo_tipo}</div>
                      </td>
                      <td style={{ padding: '10px 16px' }}><MagnitudBadge m={e.magnitud} /></td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>{e.rango_min}–{e.rango_max} {e.unidad_medicion}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>±{e.tolerancia} {e.unidad_medicion}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>Cada {e.frecuencia_meses} meses</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#334155' }}>
                        <div>{e.laboratorio_nombre || '—'}</div>
                        {e.acreditacion_onac && <div style={{ fontSize: 10, color: MO }}>ONAC {e.acreditacion_onac}</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}><EstadoBadge estado={e.estado} dias={e.dias_restantes} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Panel detalle con curva */}
            {sel && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: AZ }}>{sel.equipo_nombre}</div>
                    <div style={{ fontSize: 11, color: GR }}>{sel.equipo_tipo} · {sel.equipo_ubicacion}</div>
                  </div>
                  <button onClick={() => setSel(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: GR }}>
                    <i className="ti ti-x" style={{ fontSize: 16 }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Magnitud', val: sel.magnitud },
                    { label: 'Unidad', val: sel.unidad_medicion },
                    { label: 'Rango', val: `${sel.rango_min}–${sel.rango_max}` },
                    { label: 'Tolerancia', val: `±${sel.tolerancia} ${sel.unidad_medicion}` },
                    { label: 'Frecuencia', val: `${sel.frecuencia_meses} meses` },
                    { label: 'Acreditación', val: sel.acreditacion_onac || '—' },
                  ].map((f, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: GR, marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{f.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: AZ, marginBottom: 8 }}>
                  Curva de error — última calibración
                </div>
                <CurvaChart puntos={sel.puntos_ultima} tolerancia={sel.tolerancia} unidad={sel.unidad_medicion} />
              </div>
            )}
          </div>
        )}

        {/* CALIBRACIONES TAB */}
        {tab === 'calibraciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {equipos.map((e: any) => (
              <div key={e.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MagnitudBadge m={e.magnitud} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: AZ }}>{e.equipo_nombre}</span>
                  <span style={{ fontSize: 11, color: GR }}>· {e.equipo_ubicacion}</span>
                  <div style={{ marginLeft: 'auto' }}><EstadoBadge estado={e.estado} dias={e.dias_restantes} /></div>
                </div>
                {e.historial.length === 0 ? (
                  <div style={{ padding: '16px 20px', fontSize: 12, color: GR }}>Sin calibraciones registradas</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Fecha', 'Técnico', 'OS / Certificado', 'Error', 'Incertidumbre', 'Resultado', 'Próxima'].map(h => (
                          <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: GR, fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {e.historial.map((c: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{fmtFecha(c.fecha_calibracion)}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{c.tecnico_calibrador || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 11, color: MO }}>{c.numero_certificado || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{c.error_encontrado != null ? `${c.error_encontrado} ${e.unidad_medicion}` : '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{c.incertidumbre != null ? `±${c.incertidumbre} (k=${c.factor_cobertura})` : '—'}</td>
                          <td style={{ padding: '10px 16px' }}><ResultadoBadge r={c.resultado} /></td>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{fmtFecha(c.fecha_proxima)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
