'use client'
import { useState, useEffect } from 'react'

const AZ = '#1B2B5B'; const CY = '#00B4D8'; const VE = '#16A34A'
const RO = '#DC2626'; const NA = '#D97706'; const GR = '#64748B'
const VE_BG = '#F0FDF4'; const RO_BG = '#FEF2F2'; const NA_BG = '#FFFBEB'; const AZ_BG = '#EEF2FF'

function fmt(n: number) { return n.toLocaleString('es-CO') }
function fmtCOP(n: number) { return '$' + fmt(Math.round(n)) }
function color(v: number, meta: number, inv = false) {
  if (inv) return v <= meta * 0.5 ? VE : v <= meta ? NA : RO
  return v >= meta ? VE : v >= meta * 0.7 ? NA : RO
}

export default function KpisPage() {
  const [d, setD] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('disponibilidad')

  useEffect(() => {
    fetch('/api/kpis').then(r => r.json()).then(data => { setD(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const Sk = ({ h = 28, w = '100%' }: any) => <div style={{ height: h, width: w, background: '#F1F5F9', borderRadius: 6 }} />

  function Card({ label, valor, unidad = '', sub, c, meta, inv, grande }: any) {
    const col = c || (meta !== undefined ? color(Number(valor), meta, inv) : AZ)
    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: grande ? '22px' : '16px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: GR, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        {loading ? <Sk h={grande ? 44 : 32} /> :
          <div style={{ fontSize: grande ? 34 : 26, fontWeight: 700, color: col, lineHeight: 1, marginBottom: 4 }}>
            {valor}<span style={{ fontSize: grande ? 14 : 11, marginLeft: 3, opacity: 0.7 }}>{unidad}</span>
          </div>}
        {meta !== undefined && !loading && (
          <div style={{ margin: '8px 0 4px', height: 4, background: '#F1F5F9', borderRadius: 2 }}>
            <div style={{ height: 4, borderRadius: 2, background: col, width: `${Math.min(inv ? ((meta - Number(valor)) / meta) * 100 : (Number(valor) / meta) * 100, 100)}%` }} />
          </div>
        )}
        <div style={{ fontSize: 10, color: '#A1A1AA', marginTop: 4 }}>{sub}</div>
      </div>
    )
  }

  const TABS = [
    { id: 'disponibilidad', label: 'Disponibilidad', icon: 'ti-activity' },
    { id: 'mantenimiento',  label: 'Mantenimiento',  icon: 'ti-tool' },
    { id: 'costos',         label: 'Costos',          icon: 'ti-currency-dollar' },
    { id: 'vida_util',      label: 'Vida Util',       icon: 'ti-clock-hour-4' },
    { id: 'inventario',     label: 'Inventario',      icon: 'ti-package' },
    { id: 'normativa',      label: 'Normativa',       icon: 'ti-shield-check' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA' }}>

      <div style={{ background: '#fff', borderBottom: '0.5px solid #E4E4E7', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 2 }}>SYNAP / Business Intelligence / KPIs</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#18181B', margin: 0 }}>Indicadores clave de desempeño</h1>
        </div>
        <div style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-database" style={{ fontSize: 13 }} /> {d?.total || 0} equipos · {d?.totalMant || 0} mantenimientos
        </div>
      </div>

      {/* Resumen ejecutivo — siempre visible */}
      <div style={{ padding: '16px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        <Card label="Disponibilidad" valor={d?.disponibilidad} unidad="%" sub={`${d?.operativos}/${d?.total} operativos`} meta={95} grande />
        <Card label="MTBF" valor={d?.mtbf} unidad="días" sub="Entre fallas correctivas" c={AZ} grande />
        <Card label="MTTR" valor={d?.mttr} unidad="h" sub="Meta <4h criticos" meta={4} inv grande />
        <Card label="Cumplimiento PM" valor={d?.cumplimientoPM} unidad="%" sub={`${d?.pmEjecutados}/${d?.pmRequeridos} PM criticos`} meta={90} grande />
        <Card label="Vida util critica" valor={d?.vidaCriticos} unidad="" sub=">80% vida consumida" c={d?.vidaCriticos > 0 ? RO : VE} grande />
        <Card label="Mant. vencidos" valor={d?.mantVencidos} unidad="" sub="Programados sin ejecutar" c={d?.mantVencidos > 0 ? RO : VE} grande />
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 28px 0' }}>
        <div style={{ display: 'flex', gap: 4, background: '#F4F4F5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? AZ : '#71717A', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              <i className={'ti ' + t.icon} style={{ fontSize: 13 }} />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── DISPONIBILIDAD ── */}
        {tab === 'disponibilidad' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Card label="Equipos operativos" valor={d?.operativos} sub={`${d?.disponibilidad}% disponibilidad`} meta={d?.total} />
              <Card label="En mantenimiento" valor={d?.enMant} sub="Temporalmente fuera" c={NA} />
              <Card label="Fuera de servicio" valor={d?.fuera} sub="Requieren intervencion" c={d?.fuera > 0 ? RO : VE} />
              <Card label="Dados de baja" valor={d?.baja} sub="Retirados del inventario" c={GR} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Disponibilidad por servicio</div>
                {loading ? <Sk h={160} /> : (d?.porServicio || []).map((s: any) => (
                  <div key={s.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#52525B' }}>{s.label}</span>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: Number(s.disp) >= 90 ? VE : Number(s.disp) >= 75 ? NA : RO }}>{s.disp}%</span>
                        <span style={{ color: '#A1A1AA' }}>{s.operativos}/{s.total}</span>
                        {s.alto > 0 && <span style={{ color: RO, fontSize: 10 }}>⚠ {s.alto} alto riesgo</span>}
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#F4F4F5', borderRadius: 3 }}>
                      <div style={{ height: 5, borderRadius: 3, width: `${s.disp}%`, background: Number(s.disp) >= 90 ? VE : Number(s.disp) >= 75 ? NA : RO }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Clasificacion por riesgo INVIMA</div>
                {loading ? <Sk h={160} /> : (
                  <>
                    {[
                      { label: 'Clase III — Riesgo alto', val: d?.claseIII, desc: 'Equipos de soporte vital y cirugía', c: RO },
                      { label: 'Clase IIb — Riesgo alto', val: d?.claseIIb, desc: 'Monitores, desfibriladores, ventiladores', c: RO },
                      { label: 'Clase IIa — Riesgo moderado', val: d?.claseIIa, desc: 'Bombas, ecografos, electrocardiografos', c: NA },
                      { label: 'Clase I — Riesgo bajo', val: d?.claseI, desc: 'Camas, balanzas, nebulizadores', c: VE },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F4F4F5' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: item.c + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: item.c }}>{item.val || 0}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B' }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: '#A1A1AA' }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: AZ_BG, fontSize: 11, color: AZ }}>
                      <b>Total alto riesgo (IIb + III):</b> {(d?.claseIIb || 0) + (d?.claseIII || 0)} equipos requieren PM semestral
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Card label="MTBF — Tiempo entre fallas" valor={d?.mtbf} unidad="días" sub="Calculado sobre correctivos reales. Meta >30 días" c={Number(d?.mtbf) >= 30 ? VE : NA} />
              <Card label="MTTR — Tiempo de reparacion" valor={d?.mttr} unidad="horas" sub="Promedio de duracion por intervencion. Meta <4h criticos" meta={4} inv />
              <Card label="Ratio Prev / Correctivo" valor={d?.ratioPrevCorr} unidad=":1" sub="Plantas maduras apuntan a 4:1 o superior" c={Number(d?.ratioPrevCorr) >= 4 ? VE : Number(d?.ratioPrevCorr) >= 2 ? NA : RO} />
            </div>
          </>
        )}

        {/* ── MANTENIMIENTO ── */}
        {tab === 'mantenimiento' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Card label="Total mantenimientos" valor={d?.totalMant} sub="Historial completo registrado" c={AZ} />
              <Card label="Preventivos" valor={d?.preventivos} sub={`${d?.totalMant > 0 ? Math.round((d?.preventivos/d?.totalMant)*100) : 0}% del total — meta >80%`} c={VE} />
              <Card label="Correctivos" valor={d?.correctivos} sub={`${d?.totalMant > 0 ? Math.round((d?.correctivos/d?.totalMant)*100) : 0}% del total — meta <20%`} c={d?.correctivos > d?.preventivos ? RO : NA} />
              <Card label="Calibraciones" valor={d?.calibraciones} sub="Calibraciones documentadas" c={'#7C3AED'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Card label="Completados" valor={d?.mantCompletados} sub="Ordenes finalizadas" c={VE} />
              <Card label="Pendientes" valor={d?.mantPendientes} sub="Programados sin ejecutar" c={NA} />
              <Card label="Vencidos" valor={d?.mantVencidos} sub="Fecha pasada sin ejecutar — accion inmediata" c={d?.mantVencidos > 0 ? RO : VE} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Cumplimiento PM criticos — Res. 4816/2008</div>
                <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Equipos clase IIb y III deben tener minimo 2 PM por año</div>
                {loading ? <Sk h={80} /> : (
                  <>
                    <div style={{ fontSize: 42, fontWeight: 700, color: Number(d?.cumplimientoPM) >= 90 ? VE : Number(d?.cumplimientoPM) >= 70 ? NA : RO, marginBottom: 8 }}>
                      {d?.cumplimientoPM}%
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, marginBottom: 8 }}>
                      <div style={{ height: 8, borderRadius: 4, background: Number(d?.cumplimientoPM) >= 90 ? VE : Number(d?.cumplimientoPM) >= 70 ? NA : RO, width: `${d?.cumplimientoPM}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#52525B' }}>{d?.pmEjecutados} PM ejecutados de {d?.pmRequeridos} requeridos en equipos de alto riesgo</div>
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: Number(d?.cumplimientoPM) >= 90 ? VE_BG : RO_BG, fontSize: 11, color: Number(d?.cumplimientoPM) >= 90 ? VE : RO }}>
                      {Number(d?.cumplimientoPM) >= 90 ? '✓ Cumple con Res. 4816/2008' : '✗ Incumplimiento — riesgo en visita de habilitacion'}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Tasa de hallazgos por mantenimiento</div>
                <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Porcentaje de OTs con hallazgos documentados</div>
                {loading ? <Sk h={80} /> : (
                  <>
                    <div style={{ fontSize: 42, fontWeight: 700, color: AZ, marginBottom: 8 }}>{d?.tasaHallazgos}%</div>
                    <div style={{ fontSize: 12, color: '#52525B', marginBottom: 12 }}>{d?.conHallazgos} de {d?.mantCompletados} OTs completadas tienen hallazgos documentados</div>
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: AZ_BG, fontSize: 11, color: AZ }}>
                      Un alto porcentaje indica buena documentacion tecnica
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Distribucion de mantenimientos por tipo</div>
              {loading ? <Sk h={80} /> : (d?.porTipo || []).map((t: any) => (
                <div key={t.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#52525B' }}>{t.label}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#18181B' }}>{t.value}</span>
                      <span style={{ color: '#A1A1AA' }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F4F4F5', borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${t.pct}%`, background: t.label === 'Preventivo' ? VE : t.label === 'Correctivo' ? RO : '#7C3AED' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COSTOS ── */}
        {tab === 'costos' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Card label="Costo total mantenimiento" valor={d ? fmtCOP(d.costoTotal) : '$0'} sub="Suma historica de todas las OTs" c={AZ} grande />
              <Card label="Costo promedio por OT" valor={d ? fmtCOP(d.costoProm) : '$0'} sub="Por orden de trabajo completada" c={'#7C3AED'} grande />
              <Card label="Valor del parque tecnologico" valor={d ? fmtCOP(d.valorParque) : '$0'} sub="Suma valor adquisicion equipos activos" c={VE} grande />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Card label="Costo mano de obra" valor={d ? fmtCOP(d.costoMO) : '$0'} sub={`${d?.costoTotal > 0 ? Math.round((d?.costoMO/d?.costoTotal)*100) : 0}% del costo total`} c={AZ} />
              <Card label="Costo en repuestos" valor={d ? fmtCOP(d.costoRep) : '$0'} sub={`${d?.costoTotal > 0 ? Math.round((d?.costoRep/d?.costoTotal)*100) : 0}% del costo total`} c={NA} />
              <Card label="Costo correctivos" valor={d ? fmtCOP(d.costoCorr) : '$0'} sub={`${d?.pctCostoCorr}% del total — meta <30%`} c={Number(d?.pctCostoCorr) < 30 ? VE : RO} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>CMR — Costo de Mantenimiento / Valor de Reposicion</div>
                <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Indicador clave para decision de reemplazo. Si supera 10% anual: evaluar reemplazo</div>
                {loading ? <Sk h={80} /> : (
                  <>
                    <div style={{ fontSize: 42, fontWeight: 700, color: Number(d?.cmr) < 5 ? VE : Number(d?.cmr) < 10 ? NA : RO, marginBottom: 8 }}>
                      {d?.cmr}%
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                      {[
                        { rango: 'CMR <5%', desc: 'Rentable', c: VE, bg: VE_BG },
                        { rango: 'CMR 5-10%', desc: 'Monitorear', c: NA, bg: NA_BG },
                        { rango: 'CMR >10%', desc: 'Reemplazar', c: RO, bg: RO_BG },
                      ].map(item => (
                        <div key={item.rango} style={{ padding: '10px', borderRadius: 8, background: item.bg, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: item.c }}>{item.rango}</div>
                          <div style={{ fontSize: 10, color: '#52525B' }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Costo de mantenimiento por servicio</div>
                {loading ? <Sk h={160} /> : (d?.porServicio || []).slice(0, 6).map((s: any) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #F4F4F5' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#52525B' }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: '#A1A1AA' }}>{s.total} equipos</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#18181B' }}>{fmtCOP(s.costo || 0)}</div>
                      <div style={{ fontSize: 10, color: '#A1A1AA' }}>COP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── VIDA UTIL ── */}
        {tab === 'vida_util' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: VE_BG, borderRadius: 12, border: `0.5px solid ${VE}40`, padding: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: GR, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vida util saludable</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: VE, marginBottom: 4 }}>{d?.vidaSaludable || 0}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con menos del 60% de vida consumida</div>
              </div>
              <div style={{ background: NA_BG, borderRadius: 12, border: `0.5px solid ${NA}40`, padding: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: GR, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>En advertencia</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: NA, marginBottom: 4 }}>{d?.vidaAdvertencia || 0}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con 60-80% de vida consumida — planificar reemplazo</div>
              </div>
              <div style={{ background: RO_BG, borderRadius: 12, border: `0.5px solid ${RO}40`, padding: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: GR, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criticos — reemplazar</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: RO, marginBottom: 4 }}>{d?.vidaCriticos || 0}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Equipos con mas del 80% de vida consumida</div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B' }}>Top 10 equipos prioritarios para reemplazo</div>
                <div style={{ fontSize: 11, color: '#A1A1AA' }}>Basado en vida util real de Supabase + estandares OMS/IETSI</div>
              </div>
              {loading ? <div style={{ padding: 20 }}><Sk h={200} /></div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA' }}>
                      {['Equipo', 'Servicio', 'Año adq.', 'Vida util', 'Consumida', 'Costo mant.', 'CMR', 'Accion'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 600, color: GR, textAlign: 'left', borderBottom: '0.5px solid #E4E4E7', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(d?.topReemplazar || []).map((eq: any, i: number) => (
                      <tr key={eq.id} style={{ borderBottom: '0.5px solid #F4F4F5', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#18181B', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{eq.nombre}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: GR }}>{eq.servicio || 'N/D'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#52525B' }}>{eq.edad ? new Date().getFullYear() - eq.edad : 'N/D'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#52525B' }}>{eq.vidaUtil} años</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 5, background: '#F4F4F5', borderRadius: 3 }}>
                              <div style={{ height: 5, borderRadius: 3, background: eq.pctVida >= 80 ? RO : NA, width: `${eq.pctVida}%` }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: eq.pctVida >= 80 ? RO : NA }}>{eq.pctVida}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#52525B' }}>{fmtCOP(eq.costoMant || 0)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: Number(eq.cmrEq) > 10 ? RO : Number(eq.cmrEq) > 5 ? NA : VE }}>{eq.cmrEq ? eq.cmrEq + '%' : 'N/D'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: RO_BG, color: RO }}>Reemplazar</span>
                        </td>
                      </tr>
                    ))}
                    {(!d?.topReemplazar?.length) && (
                      <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: VE, fontSize: 13 }}>✓ No hay equipos en estado critico de vida util</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>Tabla de vida util estandar por tipo de equipo</div>
              <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 16 }}>Fuente: OMS, IETSI/EsSalud, ECRI Institute, practica clinica colombiana</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['Monitor multiparametro','7-10'],['Ventilador mecanico','10-15'],
                  ['Desfibrilador','10-12'],['Bomba de infusion','7-10'],
                  ['Incubadora neonatal','10-15'],['Electrobisturi','7-10'],
                  ['Ecografo','7-10'],['Rayos X','10-15'],
                  ['Autoclave','10-15'],['Glucometro','3-5'],
                  ['Oximetro de pulso','5-7'],['Nebulizador','3-5'],
                  ['Maquina de anestesia','10-15'],['Cardiotocografo','7-10'],
                  ['Cama hospitalaria','10-15'],['Aspirador quirurgico','7-10'],
                ].map(([eq, vida]) => (
                  <div key={eq} style={{ padding: '10px 12px', borderRadius: 8, background: '#F8F9FA', border: '0.5px solid #E4E4E7' }}>
                    <div style={{ fontSize: 11, color: '#52525B', marginBottom: 2 }}>{eq}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: AZ }}>{vida} años</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── INVENTARIO ── */}
        {tab === 'inventario' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Card label="Total equipos activos" valor={d?.total} sub="En inventario activo" c={AZ} grande />
              <Card label="Alto riesgo (IIb/III)" valor={d?.altoRiesgo} sub="PM semestral obligatorio" c={RO} grande />
              <Card label="Riesgo moderado (IIa)" valor={d?.medioRiesgo} sub="PM anual recomendado" c={NA} grande />
              <Card label="Riesgo bajo (I)" valor={d?.bajoRiesgo} sub="PM segun fabricante" c={VE} grande />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Equipos por tipo</div>
                {loading ? <Sk h={160} /> : (d?.porTipoEquipo || []).map((t: any) => (
                  <div key={t.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#52525B', textTransform: 'capitalize' }}>{t.label}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#18181B' }}>{t.value}</span>
                        <span style={{ color: '#A1A1AA' }}>{t.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#F4F4F5', borderRadius: 3 }}>
                      <div style={{ height: 5, borderRadius: 3, width: `${t.pct}%`, background: AZ }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Equipos por servicio</div>
                {loading ? <Sk h={160} /> : (d?.porServicio || []).map((s: any) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #F4F4F5' }}>
                    <span style={{ fontSize: 12, color: '#52525B' }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {s.alto > 0 && <span style={{ fontSize: 10, color: RO }}>⚠ {s.alto} críticos</span>}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#18181B' }}>{s.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── NORMATIVA ── */}
        {tab === 'normativa' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: Number(d?.cumplimientoPM) >= 90 ? VE_BG : RO_BG, borderRadius: 12, border: `0.5px solid ${Number(d?.cumplimientoPM) >= 90 ? VE : RO}40`, padding: 20 }}>
                <div style={{ fontSize: 11, color: GR, marginBottom: 8 }}>RES. 4816/2008 — TECNOVIGILANCIA</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: Number(d?.cumplimientoPM) >= 90 ? VE : RO }}>{d?.cumplimientoPM}%</div>
                <div style={{ fontSize: 11, color: '#71717A', marginTop: 4 }}>Cumplimiento PM equipos criticos</div>
                <div style={{ marginTop: 10, fontSize: 11, fontWeight: 500, color: Number(d?.cumplimientoPM) >= 90 ? VE : RO }}>
                  {Number(d?.cumplimientoPM) >= 90 ? '✓ CUMPLE' : '✗ INCUMPLE — Riesgo habilitacion'}
                </div>
              </div>
              <div style={{ background: Number(d?.disponibilidad) >= 85 ? VE_BG : NA_BG, borderRadius: 12, border: `0.5px solid ${Number(d?.disponibilidad) >= 85 ? VE : NA}40`, padding: 20 }}>
                <div style={{ fontSize: 11, color: GR, marginBottom: 8 }}>RES. 3100/2019 — HABILITACION</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: Number(d?.disponibilidad) >= 85 ? VE : NA }}>{d?.disponibilidad}%</div>
                <div style={{ fontSize: 11, color: '#71747A', marginTop: 4 }}>Disponibilidad del parque tecnologico</div>
                <div style={{ marginTop: 10, fontSize: 11, fontWeight: 500, color: Number(d?.disponibilidad) >= 85 ? VE : NA }}>
                  {Number(d?.disponibilidad) >= 85 ? '✓ CUMPLE' : '⚠ REVISAR — Disponibilidad baja'}
                </div>
              </div>
              <div style={{ background: d?.mantVencidos === 0 ? VE_BG : RO_BG, borderRadius: 12, border: `0.5px solid ${d?.mantVencidos === 0 ? VE : RO}40`, padding: 20 }}>
                <div style={{ fontSize: 11, color: GR, marginBottom: 8 }}>DEC. 4725/2005 — DISPOSITIVOS</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: d?.mantVencidos === 0 ? VE : RO }}>{d?.mantVencidos}</div>
                <div style={{ fontSize: 11, color: '#71747A', marginTop: 4 }}>Mantenimientos vencidos sin ejecutar</div>
                <div style={{ marginTop: 10, fontSize: 11, fontWeight: 500, color: d?.mantVencidos === 0 ? VE : RO }}>
                  {d?.mantVencidos === 0 ? '✓ AL DIA' : '✗ VENCIDOS — Accion inmediata'}
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E4E4E7', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 16 }}>Marco normativo aplicable — Colombia</div>
              {[
                { norma: 'Res. 4816/2008', titulo: 'Programa Nacional de Tecnovigilancia', desc: 'Obligacion de reportar eventos adversos al INVIMA. PM documentado para equipos IIb y III minimo semestral. Sistema SIVIISP.', tipo: 'obligatorio', estado: Number(d?.cumplimientoPM) >= 90 },
                { norma: 'Dec. 4725/2005', titulo: 'Dispositivos medicos y equipos biomedicos', desc: 'Registro sanitario INVIMA vigente para equipos clase IIa, IIb y III. Importacion y comercializacion regulada.', tipo: 'obligatorio', estado: true },
                { norma: 'Res. 3100/2019', titulo: 'Habilitacion de prestadores de salud', desc: 'Condiciones de habilitacion. Equipos deben tener mantenimiento documentado, hoja de vida y manual del fabricante disponible.', tipo: 'obligatorio', estado: Number(d?.disponibilidad) >= 85 },
                { norma: 'Res. 2003/2014', titulo: 'Procedimientos y condiciones de habilitacion', desc: 'Define estandares para dotacion de equipos biomedicos segun servicio habilitado.', tipo: 'obligatorio', estado: true },
                { norma: 'ISO 13485:2016', titulo: 'Gestion de calidad para dispositivos medicos', desc: 'Estandar internacional. Requiere control de equipos de medicion y seguimiento del ciclo de vida.', tipo: 'recomendado', estado: true },
                { norma: 'IEC 60601-1', titulo: 'Seguridad electrica equipos medicos', desc: 'Corriente de fuga maxima 100 μA. Clase de proteccion verificable en mantenimiento preventivo.', tipo: 'recomendado', estado: true },
                { norma: 'ISO 55000:2014', titulo: 'Gestion de activos fisicos', desc: 'Marco para gestion sistematica del parque tecnologico durante todo su ciclo de vida util.', tipo: 'recomendado', estado: true },
              ].map(item => (
                <div key={item.norma} style={{ display: 'flex', gap: 14, padding: '12px 14px', borderRadius: 10, background: item.tipo === 'obligatorio' ? (item.estado ? VE_BG : RO_BG) : '#F8F9FA', border: `0.5px solid ${item.tipo === 'obligatorio' ? (item.estado ? VE : RO) : '#E4E4E7'}30`, marginBottom: 8 }}>
                  <div style={{ flexShrink: 0, minWidth: 100 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: item.tipo === 'obligatorio' ? RO : VE, color: '#fff' }}>
                      {item.tipo === 'obligatorio' ? 'OBLIGATORIO' : 'RECOMENDADO'}
                    </span>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#18181B', marginTop: 6 }}>{item.norma}</div>
                    {item.tipo === 'obligatorio' && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: item.estado ? VE : RO, marginTop: 4 }}>
                        {item.estado ? '✓ CUMPLE' : '✗ REVISAR'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#18181B', marginBottom: 2 }}>{item.titulo}</div>
                    <div style={{ fontSize: 11, color: '#71717A' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
