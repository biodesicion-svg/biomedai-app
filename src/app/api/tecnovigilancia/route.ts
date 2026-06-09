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

    const serios = enriched.filter((e: any) => e.gravedad === 'serio')
    const noSerios = enriched.filter((e: any) => e.gravedad === 'no_serio')
    const pendientes = enriched.filter((e: any) => e.estado === 'pendiente')
    const vencidos72h = serios.filter((e: any) => e.estado === 'pendiente' && (e.horas_desde_conocimiento || 0) > 72)

    // Agrupar no serios por trimestre
    const porTrimestre: any = {}
    noSerios.forEach((e: any) => {
      const t = e.trimestre_consolidado || 'Sin trimestre'
      if (!porTrimestre[t]) porTrimestre[t] = []
      porTrimestre[t].push(e)
    })

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
      },
      porTrimestre,
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
