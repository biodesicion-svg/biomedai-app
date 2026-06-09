import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const IID = await getInstitutionId()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: contratos }, { data: proveedores }] = await Promise.all([
    sb.from('contratos').select('*').eq('institucion_id', IID).order('fecha_fin', { ascending: true }),
    sb.from('proveedores').select('*').eq('institucion_id', IID).eq('activo', true).order('nombre'),
  ])
  return NextResponse.json({ contratos: contratos||[], proveedores: proveedores||[] })
}

export async function POST(req: Request) {
  const IID = await getInstitutionId()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { tabla, data } = await req.json()
  const { data: result, error } = await sb.from(tabla).insert({ ...data, institucion_id: IID }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ result })
}

export async function PATCH(req: Request) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { tabla, id, data } = await req.json()
  const { data: result, error } = await sb.from(tabla).update(data).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ result })
}
