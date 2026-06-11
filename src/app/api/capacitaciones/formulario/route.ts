import { NextRequest, NextResponse } from 'next/server'
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function q(path: string) {
  const r = await fetch(`${SURL}/rest/v1/${path}`, { headers: h })
  return r.json()
}

// GET: cargar datos del formulario por token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const registros = await q(`capacitaciones_registros?token_publico=eq.${token}&select=*`)
  if (!registros?.length) return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })
  
  const registro = registros[0]
  if (registro.estado === 'cerrado') return NextResponse.json({ error: 'Este formulario ya fue cerrado' }, { status: 400 })

  const [tema, asistentes, preguntas] = await Promise.all([
    q(`capacitaciones_temas?id=eq.${registro.tema_id}&select=*`).then((d:any) => d[0]),
    q(`capacitaciones_asistentes?registro_id=eq.${registro.id}&select=*`).then(async (asis: any[]) => {
      const personal = await q(`capacitaciones_personal?institucion_id=eq.${registro.institucion_id}&select=*`)
      return asis.map((a: any) => ({ ...a, persona: personal.find((p: any) => p.id === a.personal_id) }))
    }),
    q(`capacitaciones_preguntas?tema_id=eq.${registro.tema_id}&order=orden&select=*`),
  ])

  return NextResponse.json({ registro, tema, asistentes, preguntas })
}

// POST: guardar firma + respuestas de un asistente
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { asistente_id, firma_svg, respuestas, personal_id, registro_id } = body

  // Si es un asistente existente
  if (asistente_id) {
    // Guardar firma
    await fetch(`${SURL}/rest/v1/capacitaciones_asistentes?id=eq.${asistente_id}`, {
      method: 'PATCH',
      headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ firma_svg, fecha_firma: new Date().toISOString(), evaluacion_completada: true })
    })

    // Guardar respuestas
    if (respuestas?.length) {
      const preguntas = await q(`capacitaciones_preguntas?tema_id=eq.${body.tema_id}&select=*`)
      const rows = respuestas.map((r: any) => {
        const preg = preguntas.find((p: any) => p.id === r.pregunta_id)
        return {
          asistente_id,
          pregunta_id: r.pregunta_id,
          respuesta_dada: r.respuesta_dada,
          correcta: preg?.respuesta_correcta === r.respuesta_dada
        }
      })
      await fetch(`${SURL}/rest/v1/capacitaciones_respuestas`, {
        method: 'POST',
        headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify(rows)
      })

      // Calcular nota
      const correctas = rows.filter((r: any) => r.correcta).length
      const nota = Math.round((correctas / rows.length) * 100)
      const aprobado = nota >= 70
      await fetch(`${SURL}/rest/v1/capacitaciones_asistentes?id=eq.${asistente_id}`, {
        method: 'PATCH',
        headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ nota, aprobado })
      })
    }
    return NextResponse.json({ ok: true })
  }

  // Si es una persona nueva no registrada
  if (personal_id && registro_id) {
    const vencimiento = new Date()
    vencimiento.setMonth(vencimiento.getMonth() + 12)
    const res = await fetch(`${SURL}/rest/v1/capacitaciones_asistentes`, {
      method: 'POST',
      headers: { ...h, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        registro_id, personal_id, aprobado: false,
        fecha_vencimiento: vencimiento.toISOString().split('T')[0],
        firma_svg, fecha_firma: new Date().toISOString(), evaluacion_completada: false
      })
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, asistente_id: data[0]?.id })
  }

  return NextResponse.json({ error: 'Datos insuficientes' }, { status: 400 })
}
