import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function GET(req: Request) {
  const IID = await getInstitutionId()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre, codigo_inventario, servicio, marca')
    .eq('institucion_id', IID)
    .eq('activo', true)
    .or(`nombre.ilike.%${q}%,codigo_inventario.ilike.%${q}%,marca.ilike.%${q}%`)
    .limit(8)
  return NextResponse.json({ equipos: data || [] })
}
