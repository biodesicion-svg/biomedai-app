import { NextResponse } from 'next/server'
import { getInstitutionId } from '@/lib/get-institution'

const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function q(path: string, iid: string) {
  const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  const r = await fetch(`${SURL}/rest/v1/${path}&institucion_id=eq.${iid}`, { headers: h })
  return r.json()
}

export async function GET() {
  try {
    const IID = await getInstitutionId()
    const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

    const [personal, temas, registros, asistentes] = await Promise.all([
      fetch(`${SURL}/rest/v1/capacitaciones_personal?select=*&institucion_id=eq.${IID}&activo=eq.true&order=servicio,nombre`, { headers: h }).then(r => r.json()),
      fetch(`${SURL}/rest/v1/capacitaciones_temas?select=*&institucion_id=eq.${IID}&activo=eq.true&order=nombre`, { headers: h }).then(r => r.json()),
      fetch(`${SURL}/rest/v1/capacitaciones_registros?select=*&institucion_id=eq.${IID}&order=fecha.desc`, { headers: h }).then(r => r.json()),
      fetch(`${SURL}/rest/v1/capacitaciones_asistentes?select=*`, { headers: h }).then(r => r.json()),
    ])

    const hoy = new Date()

    // Enriquecer registros
    const registrosEnrich = registros.map((r: any) => {
      const tema = temas.find((t: any) => t.id === r.tema_id)
      const asis = asistentes.filter((a: any) => a.registro_id === r.id).map((a: any) => ({
        ...a,
        persona: personal.find((p: any) => p.id === a.personal_id)
      }))
      return { ...r, tema, asistentes: asis }
    })

    // Por cada persona y tema obligatorio — calcular estado
    const estadoPersonal = personal.map((p: any) => {
      const temasObligatorios = temas.filter((t: any) =>
        t.obligatorio && (!t.servicio || t.servicio === p.servicio)
      )
      const capacitaciones = temasObligatorios.map((t: any) => {
        // Buscar última asistencia aprobada
        const regsTema = registros.filter((r: any) => r.tema_id === t.id)
        const asisPersona = asistentes
          .filter((a: any) => a.personal_id === p.id && regsTema.some((r: any) => r.id === a.registro_id) && a.aprobado)
          .sort((a: any, b: any) => new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime())
        
        const ultima = asisPersona[0] || null
        let estado = 'pendiente'
        let diasRestantes: number | null = null
        if (ultima) {
          const venc = new Date(ultima.fecha_vencimiento)
          diasRestantes = Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
          estado = diasRestantes < 0 ? 'vencida' : diasRestantes <= 30 ? 'proxima' : 'vigente'
        }
        return { tema: t, estado, diasRestantes, ultimaAsistencia: ultima }
      })

      const vigentes = capacitaciones.filter((c: any) => c.estado === 'vigente').length
      const total = capacitaciones.length
      const pct = total > 0 ? Math.round((vigentes / total) * 100) : 0

      return { ...p, capacitaciones, pctCumplimiento: pct, totalObligatorias: total, totalVigentes: vigentes }
    })

    // KPIs
    const totalPersonal = personal.length
    const totalCapacitados = estadoPersonal.filter((p: any) => p.pctCumplimiento === 100).length
    const conVencidas = estadoPersonal.filter((p: any) => p.capacitaciones.some((c: any) => c.estado === 'vencida')).length
    const conProximas = estadoPersonal.filter((p: any) => p.capacitaciones.some((c: any) => c.estado === 'proxima')).length
    const sinCapacitar = estadoPersonal.filter((p: any) => p.pctCumplimiento === 0).length

    // Por servicio
    const servicios: any = {}
    estadoPersonal.forEach((p: any) => {
      if (!servicios[p.servicio]) servicios[p.servicio] = { total: 0, capacitados: 0 }
      servicios[p.servicio].total++
      if (p.pctCumplimiento === 100) servicios[p.servicio].capacitados++
    })

    // Temas sin personal capacitado
    const temasSinCobertura = temas.filter((t: any) => {
      const tieneAsistentes = asistentes.some((a: any) =>
        registros.some((r: any) => r.tema_id === t.id && r.id === a.registro_id) && a.aprobado
      )
      return !tieneAsistentes
    })

    return NextResponse.json({
      personal: estadoPersonal,
      temas,
      registros: registrosEnrich,
      kpis: { totalPersonal, totalCapacitados, conVencidas, conProximas, sinCapacitar },
      porServicio: servicios,
      temasSinCobertura,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
