'use client'
import { useState, useEffect } from 'react'

const COLORES = {
  azul: '#1B2B5B', cyan: '#00B4D8', verde: '#16A34A', rojo: '#DC2626',
  naranja: '#D97706', morado: '#7C3AED', gris: '#64748B',
  verde_bg: '#F0FDF4', rojo_bg: '#FEF2F2', naranja_bg: '#FFFBEB',
  azul_bg: '#EEF2FF',
}

const VIDA_UTIL: Record<string, number> = {
  'monitor': 8, 'ventilador': 12, 'desfibrilador': 10, 'bomba': 8,
  'incubadora': 12, 'autoclave': 12, 'ecografo': 8, 'rayos': 12,
  'electrob': 8, 'glucom': 4, 'oxim': 6, 'nebul': 4,
  'anestesia': 12, 'dialisis': 12, 'cardiot': 8, 'cama': 12,
  'balanza': 6, 'lampara': 12, 'aspirador': 8, 'default': 8,
}

function getVidaUtil(nombre: string): number {
  const n = nombre.toLowerCase()
  for (const [k, v] of Object.entries(VIDA_UTIL)) {
    if (n.includes(k)) return v
  }
  return VIDA_UTIL.default
}

function calcPctVidaUtil(nombre: string, anioAdq: number): number {
  const vidaUtil = getVidaUtil(nombre)
  const edad = new Date().getFullYear() - anioAdq
  return Math.min(Math.round((edad / vidaUtil) * 100), 100)
}

function semaforo(valor: number, meta: number, inverso = false) {
  if (inverso) return valor <= meta * 0.5 ? COLORES.verde : valor <= meta ? COLORES.naranja : COLORES.rojo
  return valor >= meta * 1.1 ? COLORES.verde : valor >= meta ? COLORES.naranja : COLORES.rojo
}

export default function KpisPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [equipos, setEquipos] = useState<any[]>([])
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'disponibilidad'|'mantenimiento'|'financiero'|'vida_util'|'seguridad'>('disponibilidad')

  useEffect(() => {
    Promise.all([
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/equipos-search?q=&limit=1000').then(r => r.json()),
      fetch('/api/mantenimientos?tipo=historial').then(r => r.json()),
    ]).then(([k, eq, mant]) => {
      setKpis(k)
      setEquipos(eq?.equipos || [])
      setMantenimientos(mant?.mantenimientos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── CALCULOS DESDE DATOS REALES ────────────────────────────────────
  const total = kpis?.total || 0
  const operativos = kpis?.operativos || 0
  const preventivos = (kpis?.porTipo || []).find((t: any) => t.label === 'Preventivo')?.value || 0
  const correctivos = (kpis?.porTipo || []).find((t: any) => t.label === 'Correctivo')?.value || 0
  const totalMant = kpis?.totalMant || 0

  const disponibilidad = total > 0 ? ((operativos / total) * 100).toFixed(1) : '0'
  const mtbf = kpis?.mtbf || 0
  const mttr = kpis?.mttr || 0
  const ratioPrevCorr = correctivos > 0 ? (preventivos / correctivos).toFixed(2) : 'N/D'
  const cumplimientoMP = totalMant > 0 ? Math.min(Math.round((preventivos / totalMant) * 100), 100) : 0
  const altoRiesgo = kpis?.altoRiesgo || 0
  const tasaFallos = total > 0 ? ((correctivos / total) * 100).toFixed(1) : '0'

  // Vida util
  const hoy = new Date().getFullYear()
  const equiposVidaUtil = equipos.map(eq => {
    const anio = eq.anio_adquisicion || eq.fecha_adquisicion
      ? new Date(eq.fecha_adquisicion || `${eq.anio_adquisicion}-01-01`).getFullYear()
      : hoy - 3
    const pct = calcPctVidaUtil(eq.nombre || '', anio)
    return { ...eq, pctVida: pct, anio }
  })
  const criticos = equiposVidaUtil.filter(e => e.pctVida >= 80).length
  const advertencia = equiposVidaUtil.filter(e => e.pctVida >= 60 && e.pctVida < 80).length
  const saludables = equiposVidaUtil.filter(e => e.pctVida < 60).length

  const Sk = ({ w = '100%', h = 28 }: any) => (
    <div style={{ height: h, width: w, background: '#F1F5F9', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
  )

  const Kpi = ({ label, valor, unidad, sub, color, meta, inverso, grande }: any) => {
    const c = color || (meta !== undefined ? semaforo(Number(valor), meta, inverso) : COLORES.azul)
    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: grande ? '24px' : '18px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: COLORES.gris, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {loading
          ? <Sk h={grande ? 48 : 32} />
          : <div style={{ fontSize: grande ? 36 : 28, fontWeight: 700, color: c, marginBottom: 4, lineHeight: 1 }}>
              {valor}<span style={{ fontSize: grande ? 16 : 13, marginLeft: 4, opacity: 0.7 }}>{unidad}</span>
            </div>
        }
        {meta !== undefined && !loading && (
          <div style={{ marginTop: 8, height: 4, background: '#F1F5F9', borderRadius: 2 }}>
            <div style={{ height: 4, borderRadius: 2, width: `${Math.min((Number(valor) / meta) * 100, 100)}%`, background: c }} />
          </div>
        )}
        <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  const tabs = [
    { id: 'disponibilidad', label: 'Disponibilidad', icon: 'ti-activity' },
    { id: 'mantenimiento',  label: 'Mantenimiento',  icon: 'ti-tool' },
    { id: 'financiero',     label: 'Financiero',     icon: 'ti-currency-dollar' },
    { id: 'vida_util',      label: 'Vida Util',      icon: 'ti-clock-hour-4' },
    { id: 'seguridad',      label: 'Seguridad',      icon: 'ti-shield-check' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #E4E4E7', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 2 }}>SYNAP / Business Intelligence / KPIs</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#18181B', margin: 0 }}>Indicadores clave de desempeño</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#A1A1AA' }}>
          <i className="ti ti-refresh" style={{ fontSize: 13 }} />
          Datos en tiempo real desde Supabase
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div style={{ padding: '20px 28px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          <Kpi label="Disponibilidad" valor={disponibilidad} unidad="%" sub="Meta: ≥95% equipos críticos" meta={95} grande />
          <Kpi label="MTBF" valor={mtbf} unidad="días" sub="Tiempo medio entre fallas" color={COLORES.azul} grande />
          <Kpi label="MTTR" valor={mttr} unidad="hrs" sub="Meta: <4h equipos críticos" meta={4} inverso grande />
          <Kpi label="Cumplimiento PM" valor={cumplimientoMP} unidad="%" sub="Meta: ≥90% Res. 4816/2008" meta={90} grande />
          <Kpi label="Equipos en alerta" valor={criticos} unidad="" sub="Vida util >80% consumida" color={criticos > 0 ? COLORES.rojo : COLORES.verde} grande />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: '#F4F4F5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#1B2B5B' : '#71717A', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              <i className={'ti ' + t.icon} style={{ fontSize: 13 }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── TAB DISPONIBILIDAD ── */}
        {tab === 'disponibilidad' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Kpi label="Disponibilidad global" valor={disponibilidad} unidad="%" sub={`${operativos} operativos de ${total} equipos`} meta={95} />
              <Kpi label="Equipos fuera de servicio" valor={total - operativos} unidad="" sub={`${(((total - operativos) / Math.max(total, 1)) * 100).toFixed(1)}% del parque tecnologico`} meta={3} inverso />
              <Kpi label="Tasa de fallas" valor={tasaFallos} unidad="%" sub="Equipos con al menos 1 correctivo" meta={10} inverso />
              <Kpi label="MTBF" valor={mtbf} unidad="días" sub="Cuanto mayor, mas confiable el parque" color={COLORES.azul} />
              <Kpi label="MTTR" valor={mttr} unidad="horas" sub="Meta <4h criticos, <24h apoyo" meta={4} inverso />
              <Kpi label="Ratio Prev/Corr" valor={ratioPrevCorr} unidad="" sub="Meta ≥4:1 (plantas maduras)" color={Number(ratioPrevCorr) >= 4 ? COLORES.verde : Number(ratioPrevCorr) >= 2 ? COLORES.naranja : COLORES.rojo} />
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Disponibilidad por servicio</div>
              {loading ? <Sk h={120} /> : (kpis?.porServicio || []).slice(0, 8).map((s: any) => (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#52525B' }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: Number(s.disp) >= 90 ? COLORES.verde : COLORES.naranja }}>{s.disp}%</span>
                      <span style={{ color: '#A1A1AA' }}>{s.operativos}/{s.total} operativos</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F4F4F5', borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${s.disp}%`, background: Number(s.disp) >= 95 ? COLORES.verde : Number(s.disp) >= 80 ? COLORES.naranja : COLORES.rojo }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TAB MANTENIMIENTO ── */}
        {tab === 'mantenimiento' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Kpi label="Cumplimiento PM" valor={cumplimientoMP} unidad="%" sub="Meta ≥90% Res. 4816/2008" meta={90} />
              <Kpi label="Total mantenimientos" valor={totalMant} unidad="" sub="Registros en historial" color={COLORES.azul} />
              <Kpi label="Mantenimientos preventivos" valor={preventivos} unidad="" sub={`${totalMant > 0 ? Math.round((preventivos / totalMant) * 100) : 0}% del total`} color={COLORES.verde} />
              <Kpi label="Mantenimientos correctivos" valor={correctivos} unidad="" sub={`${totalMant > 0 ? Math.round((correctivos / totalMant) * 100) : 0}% del total — meta <20%`} meta={Math.round(totalMant * 0.2)} inverso />
              <Kpi label="Ratio Prev/Corr" valor={ratioPrevCorr} unidad=":1" sub="Meta ≥4:1 segun ACCE" color={Number(ratioPrevCorr) >= 4 ? COLORES.verde : COLORES.naranja} />
              <Kpi label="Equipos alto riesgo" valor={altoRiesgo} unidad="" sub="Requieren atencion prioritaria" meta={0} inverso />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Distribucion por tipo de mantenimiento</div>
                {loading ? <Sk h={100} /> : (kpis?.porTipo || []).map((t: any) => (
                  <div key={t.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#52525B' }}>{t.label}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#18181B' }}>{t.value}</span>
                        <span style={{ color: '#A1A1AA' }}>{t.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#F4F4F5', borderRadius: 3 }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${t.pct}%`, background: t.label === 'Preventivo' ? COLORES.verde : t.label === 'Correctivo' ? COLORES.rojo : COLORES.naranja }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Interpretacion de indicadores</div>
                {[
                  { label: 'MTBF alto (>30 días)', desc: 'Parque confiable, baja frecuencia de fallas', ok: true },
                  { label: 'MTTR bajo (<4 horas)', desc: 'Respuesta tecnica rapida y eficiente', ok: true },
                  { label: 'PM >80% del total', desc: 'Gestion proactiva, reduce correctivos', ok: true },
                  { label: 'Correctivos >20%', desc: 'Señal de falta de mantenimiento preventivo', ok: false },
                  { label: 'Ratio Prev/Corr <2:1', desc: 'Riesgo de fallas en cadena y sobrecostos', ok: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: item.ok ? COLORES.verde_bg : COLORES.rojo_bg }}>
                    <i className={`ti ${item.ok ? 'ti-check' : 'ti-alert-triangle'}`} style={{ fontSize: 14, color: item.ok ? COLORES.verde : COLORES.rojo, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: '#71717A' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB FINANCIERO ── */}
        {tab === 'financiero' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Kpi label="Costo total mantenimiento" valor={kpis?.costoTotal ? `$${Number(kpis.costoTotal).toLocaleString('es-CO')}` : '$0'} unidad="COP" sub="Suma historica de intervenciones" color={COLORES.azul} />
              <Kpi label="Costo promedio por OT" valor={kpis?.costoProm ? `$${Number(kpis.costoProm).toLocaleString('es-CO')}` : '$0'} unidad="" sub="Por orden de trabajo ejecutada" color={COLORES.morado} />
              <Kpi label="Costo correctivo vs total" valor={kpis?.pctCostoCorr || '0'} unidad="%" sub="Meta <30% del presupuesto total" meta={70} inverso />
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Criterio de reemplazo por CMR</div>
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Costo de Mantenimiento sobre Valor de Reposicion — si supera 10% anual, evaluar reemplazo</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { rango: 'CMR <5%', desc: 'Equipo rentable, continuar PM', color: COLORES.verde, bg: COLORES.verde_bg },
                  { rango: 'CMR 5-10%', desc: 'Monitorear costos de cerca', color: COLORES.naranja, bg: COLORES.naranja_bg },
                  { rango: 'CMR >10%', desc: 'Evaluar reemplazo inmediato', color: COLORES.rojo, bg: COLORES.rojo_bg },
                ].map(item => (
                  <div key={item.rango} style={{ padding: '14px', borderRadius: 10, background: item.bg, border: `0.5px solid ${item.color}30` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.rango}</div>
                    <div style={{ fontSize: 11, color: '#52525B' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Costo por servicio</div>
              {loading ? <Sk h={100} /> : (kpis?.porServicio || []).slice(0, 6).map((s: any) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #F4F4F5' }}>
                  <span style={{ fontSize: 12, color: '#52525B' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#18181B' }}>${(s.costo || 0).toLocaleString('es-CO')} COP</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TAB VIDA UTIL ── */}
        {tab === 'vida_util' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: COLORES.verde_bg, borderRadius: 12, border: `0.5px solid ${COLORES.verde}40`, padding: '20px' }}>
                <div style={{ fontSize: 11, color: COLORES.gris, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vida util saludable</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: COLORES.verde, marginBottom: 4 }}>{saludables}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con &lt;60% de vida consumida</div>
              </div>
              <div style={{ background: COLORES.naranja_bg, borderRadius: 12, border: `0.5px solid ${COLORES.naranja}40`, padding: '20px' }}>
                <div style={{ fontSize: 11, color: COLORES.gris, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En advertencia</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: COLORES.naranja, marginBottom: 4 }}>{advertencia}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con 60-80% de vida consumida</div>
              </div>
              <div style={{ background: COLORES.rojo_bg, borderRadius: 12, border: `0.5px solid ${COLORES.rojo}40`, padding: '20px' }}>
                <div style={{ fontSize: 11, color: COLORES.gris, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticos — reemplazar</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: COLORES.rojo, marginBottom: 4 }}>{criticos}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con &gt;80% de vida consumida</div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B' }}>Vida util por equipo</div>
                <div style={{ fontSize: 11, color: '#A1A1AA' }}>Basado en estandares OMS / IETSI / EsSalud</div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA' }}>
                      {['Equipo', 'Servicio', 'Año adq.', 'Vida util std', 'Consumida', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#71717A', textAlign: 'left', borderBottom: '0.5px solid #E4E4E7' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array(5).fill(0).map((_, i) => (
                          <tr key={i}><td colSpan={6} style={{ padding: '12px 16px' }}><Sk /></td></tr>
                        ))
                      : equiposVidaUtil.sort((a, b) => b.pctVida - a.pctVida).slice(0, 50).map((eq, i) => {
                          const color = eq.pctVida >= 80 ? COLORES.rojo : eq.pctVida >= 60 ? COLORES.naranja : COLORES.verde
                          const bg = eq.pctVida >= 80 ? COLORES.rojo_bg : eq.pctVida >= 60 ? COLORES.naranja_bg : COLORES.verde_bg
                          const label = eq.pctVida >= 80 ? 'Critico' : eq.pctVida >= 60 ? 'Advertencia' : 'OK'
                          return (
                            <tr key={eq.id} style={{ borderBottom: '0.5px solid #F4F4F5', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#18181B', maxWidth: 200 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.nombre}</div>
                                <div style={{ fontSize: 10, color: '#A1A1AA' }}>{eq.serie || 'N/D'}</div>
                              </td>
                              <td style={{ padding: '10px 16px', fontSize: 11, color: '#71717A' }}>{eq.servicio || 'N/D'}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#52525B' }}>{eq.anio}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#52525B' }}>{getVidaUtil(eq.nombre || '')} años</td>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, background: '#F4F4F5', borderRadius: 3, minWidth: 60 }}>
                                    <div style={{ height: 6, borderRadius: 3, width: `${eq.pctVida}%`, background: color }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 32 }}>{eq.pctVida}%</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: bg, color }}>{label}</span>
                              </td>
                            </tr>
                          )
                        })
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Vida util estandar por tipo de equipo (OMS / IETSI)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['Monitor multiparametro', '7-10 años'], ['Ventilador mecanico', '10-15 años'],
                  ['Desfibrilador', '10-12 años'], ['Bomba de infusion', '7-10 años'],
                  ['Incubadora neonatal', '10-15 años'], ['Electrobisturi', '7-10 años'],
                  ['Ecografo', '7-10 años'], ['Rayos X', '10-15 años'],
                  ['Autoclave', '10-15 años'], ['Glucometro', '3-5 años'],
                  ['Oximetro de pulso', '5-7 años'], ['Nebulizador', '3-5 años'],
                  ['Maquina de anestesia', '10-15 años'], ['Cardiotocografo', '7-10 años'],
                  ['Cama hospitalaria', '10-15 años'], ['Balanza clinica', '5-7 años'],
                ].map(([equipo, vida]) => (
                  <div key={equipo} style={{ padding: '10px 12px', borderRadius: 8, background: '#F8F9FA', border: '0.5px solid #E4E4E7' }}>
                    <div style={{ fontSize: 11, color: '#52525B', marginBottom: 2 }}>{equipo}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORES.azul }}>{vida}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB SEGURIDAD ── */}
        {tab === 'seguridad' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Kpi label="Equipos alto riesgo (IIb/III)" valor={altoRiesgo} unidad="" sub="Requieren mantenimiento semestral" color={altoRiesgo > 0 ? COLORES.rojo : COLORES.verde} />
              <Kpi label="Equipos vida util critica" valor={criticos} unidad="" sub="Mas del 80% de vida consumida" color={criticos > 0 ? COLORES.rojo : COLORES.verde} />
              <Kpi label="Disponibilidad global" valor={disponibilidad} unidad="%" sub="Meta MSPS: ≥95% equipos criticos" meta={95} />
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Marco normativo aplicable — Colombia</div>
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Obligaciones de cumplimiento para IPS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { norma: 'Res. 4816/2008', titulo: 'Tecnovigilancia INVIMA', desc: 'Reporte obligatorio de eventos adversos con equipos biomedicos. Sistema SIVIISP.', tipo: 'obligatorio' },
                  { norma: 'Dec. 4725/2005', titulo: 'Dispositivos medicos', desc: 'Registro sanitario INVIMA obligatorio para todo equipo de riesgo IIa, IIb y III.', tipo: 'obligatorio' },
                  { norma: 'Res. 3100/2019', titulo: 'Habilitacion', desc: 'Condiciones de habilitacion para prestadores. Equipos deben tener mantenimiento documentado.', tipo: 'obligatorio' },
                  { norma: 'ISO 13485', titulo: 'Gestion de calidad dispositivos', desc: 'Estandar internacional para gestion de calidad en equipos medicos.', tipo: 'recomendado' },
                  { norma: 'IEC 60601', titulo: 'Seguridad electrica', desc: 'Norma de seguridad para equipos electricos de uso medico. Corriente de fuga max. 100 μA.', tipo: 'recomendado' },
                  { norma: 'ISO 55000', titulo: 'Gestion de activos', desc: 'Marco para la gestion sistematica de activos fisicos durante su ciclo de vida.', tipo: 'recomendado' },
                ].map(item => (
                  <div key={item.norma} style={{ display: 'flex', gap: 14, padding: '12px 14px', borderRadius: 10, background: item.tipo === 'obligatorio' ? '#FEF2F2' : '#F0FDF4', border: `0.5px solid ${item.tipo === 'obligatorio' ? '#FECACA' : '#BBF7D0'}` }}>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: item.tipo === 'obligatorio' ? COLORES.rojo : COLORES.verde, color: '#fff' }}>
                        {item.tipo === 'obligatorio' ? 'OBLIGATORIO' : 'RECOMENDADO'}
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#18181B', marginTop: 6 }}>{item.norma}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B', marginBottom: 2 }}>{item.titulo}</div>
                      <div style={{ fontSize: 11, color: '#71717A' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
