import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { equipo, marca, modelo, tipo, servicio } = await req.json()

    const prompt = `Eres un ingeniero biomédico senior experto en mantenimiento de equipos médicos en Colombia.

Genera un formulario de verificación de mantenimiento ${tipo} para:
- Equipo: ${equipo}
- Marca: ${marca || 'No especificada'}
- Modelo: ${modelo || 'No especificado'}
- Servicio hospitalario: ${servicio || 'No especificado'}

Crea entre 12 y 18 preguntas que el técnico debe responder MIENTRAS ejecuta el mantenimiento.
Las preguntas deben ser concretas, técnicas y en orden lógico de ejecución.

Responde ÚNICAMENTE con JSON válido sin texto adicional:
{
  "preguntas": [
    {
      "numero": 1,
      "categoria": "Inspección inicial",
      "pregunta": "¿El equipo presenta daños físicos visibles en la carcasa o pantalla?",
      "tipo": "si_no",
      "valor_esperado": "No",
      "critica": false,
      "advertencia": null
    },
    {
      "numero": 2,
      "categoria": "Inspección inicial", 
      "pregunta": "¿El estado físico general del equipo es?",
      "tipo": "seleccion",
      "opciones": ["Bueno", "Regular", "Malo"],
      "valor_esperado": "Bueno",
      "critica": false,
      "advertencia": null
    },
    {
      "numero": 3,
      "categoria": "Verificación eléctrica",
      "pregunta": "Registra el voltaje de alimentación medido",
      "tipo": "valor_numerico",
      "unidad": "V",
      "valor_esperado": "110-120",
      "critica": true,
      "advertencia": "Desconectar antes de medir componentes internos"
    }
  ]
}

Tipos disponibles: "si_no", "valor_numerico", "texto", "seleccion", "checklist"
Para "seleccion" y "checklist" incluye campo "opciones": []
Para "valor_numerico" incluye "unidad" y "valor_esperado"
Categorías sugeridas: Inspección inicial, Limpieza, Verificación eléctrica, Verificación funcional, Calibración, Pruebas de seguridad, Cierre`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json({ preguntas: data.preguntas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
