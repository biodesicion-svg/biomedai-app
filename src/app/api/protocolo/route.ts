import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { equipo, marca, modelo, tipo, servicio } = await req.json()

    const prompt = `Eres un ingeniero biomédico senior experto en mantenimiento de equipos médicos en Colombia.

Genera un protocolo COMPLETO de mantenimiento ${tipo} para el siguiente equipo:
- Equipo: ${equipo}
- Marca: ${marca || 'No especificada'}
- Modelo: ${modelo || 'No especificado'}
- Servicio: ${servicio || 'No especificado'}
- Tipo de mantenimiento: ${tipo}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{
  "titulo": "Protocolo de mantenimiento ${tipo} - ${equipo}",
  "duracion_estimada": "X horas",
  "herramientas": ["herramienta1", "herramienta2"],
  "epps": ["EPP1", "EPP2"],
  "advertencias": ["advertencia1", "advertencia2"],
  "pasos": [
    {
      "numero": 1,
      "titulo": "Título del paso",
      "descripcion": "Descripción detallada de qué hacer",
      "duracion": "X minutos",
      "herramientas": ["herramienta"],
      "valores_esperados": "Valores o criterios esperados si aplica",
      "criterio_aceptacion": "Cómo saber si el paso fue exitoso",
      "advertencia": "Advertencia específica si aplica o null"
    }
  ],
  "criterios_finales": ["criterio1", "criterio2"],
  "normativa": "Referencia normativa colombiana aplicable"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Limpiar y parsear JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const protocolo = JSON.parse(cleaned)

    return NextResponse.json({ protocolo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
