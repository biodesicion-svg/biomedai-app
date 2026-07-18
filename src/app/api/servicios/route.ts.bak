import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionId } from '@/lib/get-institution'

const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

export async function GET(req: NextRequest) {
  try {
    const IID = await getInstitutionId()
    const search = req.nextUrl.searchParams.get('q') || ''
    const tipo = req.nextUrl.searchParams.get('tipo') || ''
    const equipo = req.nextUrl.searchParams.get('equipo') || ''

    let url = `${SURL}/rest/v1/servicios_tecnicos?select=*&institucion_id=eq.${IID}&order=fecha_servicio.desc`
    if (tipo) url += `&tipo_servicio=ilike.*${tipo}*`
    if (equipo) url += `&equipo=ilike.*${equipo}*`
    if (search) url += `&or=(equipo.ilike.*${search}*,serie_placa.ilike.*${search}*,numero_reporte.ilike.*${search}*)`

    const data = await fetch(url, { headers: h }).then(r => r.json())
    const tipos: any = {}
    const equipos: any = {}
    data.forEach((s: any) => {
      tipos[s.tipo_servicio] = (tipos[s.tipo_servicio] || 0) + 1
      equipos[s.equipo] = (equipos[s.equipo] || 0) + 1
    })

    return NextResponse.json({ servicios: data, kpis: { total: data.length, tipos, equipos } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
