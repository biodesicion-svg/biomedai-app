import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function q(path: string) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: h })
  return r.json()
}

export async function GET() {
  const IID = await getInstitutionId()
  try {
    const [eventos, alertas, equipos] = await Promise.all([
      q(`tecnovigilancia_eventos?select=*&institucion_id=eq.${IID}&order=fecha_ocurrencia.desc`),
      q(`tecnovigilancia_alertas?select=*&institucion_id=eq.${IID}&order=fecha_alerta.desc`),
      q(`equipos?select=id,nombre,tipo,ubicacion,serie&institucion_id=eq.${IID}`),
    ])

    const enriched = eventos.map((e: any) => {
      const equipo = equipos.find((eq: any) => eq.id === e.equipo_id) || null
      const horas72 = e.gravedad === 'serio' && e.estado === 'pendiente'
        ? Math.round((new Date().getTime() - new Date(e.fecha_conocimiento).getTime()) / 3600000)
        : null
      return { ...e, equipo, horas_desde_conocimiento: horas72 }
    })

    const norm = (v: any) => String(v || '').toLowerCase().replace(/_/g, ' ').trim()
    const serios = enriched.filter((e: any) => norm(e.gravedad) === 'serio')
    const noSerios = enriched.filter((e: any) => norm(e.gravedad) === 'no serio')
    const pendientes = enriched.filter((e: any) => {
      const s = norm(e.estado)
      return s === 'pendiente' || s === 'en investigacion' || s === 'en investigación'
    })
    const vencidos72h = serios.filter((e: any) => {
      const s = norm(e.estado)
      return (s === 'pendiente' || s.startsWith('en investigac')) && (e.horas_desde_conocimiento || 0) > 72
    })

    // Agrupar no serios por trimestre
    const porTrimestre: any = {}
    noSerios.forEach((e: any) => {
      const t = e.trimestre_consolidado || 'Sin trimestre'
      if (!porTrimestre[t]) porTrimestre[t] = []
      porTrimestre[t].push(e)
    })

    // ---- Graficos e indicadores ----
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const esSerio = (g: any) => String(g || '').toLowerCase().includes('serio') && !String(g || '').toLowerCase().includes('no serio') && !String(g || '').toLowerCase().includes('no_serio')

    // Por mes (ultimos 12)
    const mesMap: Record<string, any> = {}
    enriched.forEach((e: any) => {
      const ym = String(e.fecha_ocurrencia || '').slice(0, 7)
      if (!ym) return
      if (!mesMap[ym]) mesMap[ym] = { total: 0, serios: 0, noSerios: 0 }
      mesMap[ym].total++
      if (esSerio(e.gravedad)) mesMap[ym].serios++
      else mesMap[ym].noSerios++
    })
    const porMes = Object.entries(mesMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
      .map(([ym, v]: any) => ({
        periodo: MESES[parseInt(ym.slice(5, 7), 10) - 1] + ' ' + ym.slice(2, 4),
        total: v.total, serios: v.serios, noSerios: v.noSerios,
      }))

    // Agrupadores genericos
    const agrupar = (campo: string, limite = 10) => {
      const m: Record<string, any> = {}
      enriched.forEach((e: any) => {
        const k = e[campo] || 'Sin dato'
        if (!m[k]) m[k] = { nombre: k, total: 0, serios: 0 }
        m[k].total++
        if (esSerio(e.gravedad)) m[k].serios++
      })
      return Object.values(m).sort((a: any, b: any) => b.total - a.total).slice(0, limite)
    }

    const porFabricante = agrupar('fabricante')
    const porServicio = agrupar('servicio')
    const porTipo = agrupar('tipo_reporte')
    const porRiesgo = agrupar('nivel_riesgo')
    const porEstado = agrupar('estado')

    // Indicadores
    const cerrados = enriched.filter((e: any) => String(e.estado || '').toLowerCase().includes('cerrado'))
    let sumaDias = 0, nCierres = 0
    cerrados.forEach((e: any) => {
      if (e.fecha_ocurrencia && e.fecha_cierre) {
        const d = (new Date(e.fecha_cierre).getTime() - new Date(e.fecha_ocurrencia).getTime()) / 86400000
        if (d >= 0) { sumaDias += d; nCierres++ }
      }
    })
    const reportadosInvima = enriched.filter((e: any) => e.numero_foreia).length
    const abiertos = enriched.length - cerrados.length

    // Tendencia: ultimos 3 meses vs 3 anteriores
    const ult6 = porMes.slice(-6)
    const rec = ult6.slice(-3).reduce((a: number, m: any) => a + m.total, 0)
    const ant = ult6.slice(0, 3).reduce((a: number, m: any) => a + m.total, 0)
    const tendencia = ant > 0 ? Math.round(((rec - ant) / ant) * 100) : (rec > 0 ? 100 : 0)

    return NextResponse.json({
      eventos: enriched,
      alertas,
      kpis: {
        total: enriched.length,
        serios: serios.length,
        noSerios: noSerios.length,
        pendientes: pendientes.length,
        vencidos72h: vencidos72h.length,
        alertasActivas: alertas.filter((a: any) => !a.revisada).length,
        cerrados: cerrados.length,
        abiertos,
        reportadosInvima,
        tiempoPromedioCierre: nCierres ? Math.round(sumaDias / nCierres) : 0,
        tendencia,
      },
      porTrimestre,
      graficos: { porMes, porFabricante, porServicio, porTipo, porRiesgo, porEstado },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const IID = await getInstitutionId()
  try {
    const body = await req.json()
    const r = await fetch(`${URL}/rest/v1/tecnovigilancia_eventos`, {
      method: 'POST',
      headers: { ...h, 'Prefer': 'return=representation' },
      body: JSON.stringify({ ...body, institucion_id: IID })
    })
    const data = await r.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
