import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInstitutionId } from '@/lib/get-institution'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const { equipo, tipo } = await req.json()
    const IID = await getInstitutionId()
    const supabase = db()
    const nombreEq = String(equipo || '').toLowerCase()

    // 1) Traer todos los protocolos activos de la institucion
    const { data: protos, error } = await supabase
      .from('protocolos')
      .select('id, nombre, clave, patrones, clase_invima, frecuencia, duracion_horas, version')
      .eq('institucion_id', IID)
      .eq('activo', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2) Elegir el protocolo cuyo patron coincida con el nombre del equipo
    let elegido: any = null
    for (const p of protos || []) {
      const pats: string[] = p.patrones || []
      if (pats.some(pat => pat && nombreEq.includes(String(pat).toLowerCase()))) {
        elegido = p
        break
      }
    }
    // 3) Fallback al protocolo generico
    if (!elegido) elegido = (protos || []).find(p => p.clave === 'default') || null
    if (!elegido) return NextResponse.json({ preguntas: [], protocolo: null })

    // 4) Traer los pasos del protocolo elegido
    const { data: pasos } = await supabase
      .from('protocolo_pasos')
      .select('numero, categoria, pregunta, tipo, opciones, valor_esperado, unidad, critica, advertencia')
      .eq('protocolo_id', elegido.id)
      .order('numero', { ascending: true })

    const preguntas = (pasos || []).map(s => ({
      numero: s.numero,
      categoria: s.categoria || 'General',
      pregunta: s.pregunta,
      tipo: s.tipo || 'si_no',
      opciones: s.opciones || undefined,
      valor_esperado: s.valor_esperado || undefined,
      unidad: s.unidad || undefined,
      critica: !!s.critica,
      advertencia: s.advertencia || undefined,
    }))

    return NextResponse.json({
      preguntas,
      protocolo: {
        nombre: elegido.nombre,
        clave: elegido.clave,
        clase_invima: elegido.clase_invima,
        frecuencia: elegido.frecuencia,
        duracion_horas: elegido.duracion_horas,
        version: elegido.version,
        total_pasos: preguntas.length,
        criticos: preguntas.filter(p => p.critica).length,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: lista de protocolos disponibles (para la pantalla de Protocolos)
export async function GET() {
  try {
    const IID = await getInstitutionId()
    const supabase = db()
    const { data: protos, error } = await supabase
      .from('protocolos')
      .select('id, nombre, clave, clase_invima, frecuencia, duracion_horas, version')
      .eq('institucion_id', IID).eq('activo', true).order('nombre')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const ids = (protos || []).map(p => p.id)
    const conteo: Record<string, { pasos: number; criticos: number }> = {}
    if (ids.length) {
      const { data: pasos } = await supabase
        .from('protocolo_pasos').select('protocolo_id, critica').in('protocolo_id', ids)
      pasos?.forEach(s => {
        if (!conteo[s.protocolo_id]) conteo[s.protocolo_id] = { pasos: 0, criticos: 0 }
        conteo[s.protocolo_id].pasos++
        if (s.critica) conteo[s.protocolo_id].criticos++
      })
    }
    return NextResponse.json({
      protocolos: (protos || []).map(p => ({
        ...p,
        total_pasos: conteo[p.id]?.pasos || 0,
        criticos: conteo[p.id]?.criticos || 0,
      }))
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
