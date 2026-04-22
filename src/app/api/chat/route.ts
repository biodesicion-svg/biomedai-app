import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `Eres BioMed AI, un ingeniero biomédico senior especializado en gestión hospitalaria en Colombia.

Tienes acceso al inventario real de equipos biomédicos de la institución. Tu rol es ayudar a:
- Analizar el estado del parque de equipos
- Recomendar mantenimientos preventivos y correctivos
- Interpretar KPIs como MTBF, MTTR y disponibilidad
- Analizar presupuestos y proyectar costos
- Identificar equipos críticos y recomendar reemplazos
- Aplicar normativa colombiana (Resolución 4816 de 2008, INVIMA)

Responde siempre en español. Sé técnico pero claro. Usa datos concretos cuando los tengas.
Cuando hagas listas usa bullet points con •. Usa **negrita** para resaltar puntos importantes.
Máximo 300 palabras por respuesta. Sé directo y práctico.`

export async function POST(req: NextRequest) {
  try {
    const { mensajes, contexto } = await req.json()

    const systemConContexto = contexto
      ? `${SYSTEM_PROMPT}\n\nCONTEXTO DEL INVENTARIO ACTUAL:\n${contexto}`
      : SYSTEM_PROMPT

    const mensajesAnthropic = mensajes.map((m: any) => ({
      role: m.rol === 'user' ? 'user' : 'assistant',
      content: m.contenido,
    })).filter((m: any) => m.role === 'user' || m.role === 'assistant')

    // Remover el primer mensaje del assistant (bienvenida)
    const mensajesFiltrados = mensajesAnthropic.filter((_: any, i: number) => {
      if (i === 0 && mensajesAnthropic[0].role === 'assistant') return false
      return true
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemConContexto,
      messages: mensajesFiltrados,
    })

    const respuesta = response.content[0].type === 'text'
      ? response.content[0].text
      : 'No pude generar una respuesta.'

    return NextResponse.json({ respuesta })
  } catch (error: any) {
    console.error('Error API chat:', error)
    return NextResponse.json(
      { respuesta: `Error: ${error.message}` },
      { status: 500 }
    )
  }
}
