import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = IID

export async function GET() {
  const IID = await getInstitutionId()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: equipos } = await supabase
    .from('equipos')
    .select('valor_adquisicion, estado, riesgo, nombre')
    .eq('institucion_id', IIDITUCION_ID)
    .eq('activo', true)

  const { data: mantenimientos } = await supabase
    .from('mantenimientos')
    .select('tipo, costo_total')
    .eq('institucion_id', IIDITUCION_ID)

  if (!equipos || !mantenimientos) {
    return NextResponse.json({ error: 'No data' }, { status: 500 })
  }

  const valorParque = equipos
    .filter(e => e.valor_adquisicion)
    .reduce((a, b) => a + Number(b.valor_adquisicion), 0)

  const costoPreventivo = mantenimientos
    .filter(m => m.tipo === 'preventivo' && m.costo_total)
    .reduce((a, b) => a + Number(b.costo_total), 0)

  const costoCorrectivo = mantenimientos
    .filter(m => m.tipo === 'correctivo' && m.costo_total)
    .reduce((a, b) => a + Number(b.costo_total), 0)

  const topValor = equipos
    .filter(e => e.valor_adquisicion)
    .sort((a, b) => Number(b.valor_adquisicion) - Number(a.valor_adquisicion))
    .slice(0, 8)

  return NextResponse.json({
    valorParque,
    costoPreventivo,
    costoCorrectivo,
    costoTotal: costoPreventivo + costoCorrectivo,
    proyeccion: (costoPreventivo + costoCorrectivo) * 1.08,
    ratioActual: costoCorrectivo > 0 ? (costoPreventivo / costoCorrectivo).toFixed(2) : '0',
    totalEquipos: equipos.length,
    bajas: equipos.filter(e => e.estado === 'baja').length,
    topValor
  })
}
