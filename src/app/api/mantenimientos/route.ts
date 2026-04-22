import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'

const FRECUENCIAS: Record<string, { meses: number; horas: number; tipo: string }> = {
  'Monitor De Signos Vitales':        { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Monitor Fetal':                    { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Monitor Multiparametros De Anestesia': { meses: 6, horas: 6, tipo: 'preventivo' },
  'Ventilador Mecanico':              { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Desfibrilador':                    { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Electrobisturi':                   { meses: 6,  horas: 5,  tipo: 'preventivo' },
  'Bomba De Nutricion Amika':         { meses: 6,  horas: 3,  tipo: 'preventivo' },
  'Bomba De Infusion':                { meses: 6,  horas: 3,  tipo: 'preventivo' },
  'Incubadora Abierta':               { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Incubadora Cerrada':               { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Maquina De Anestesia':             { meses: 6,  horas: 8,  tipo: 'preventivo' },
  'Lampara Pielitica Auxiliar De Cirugia': { meses: 6, horas: 4, tipo: 'preventivo' },
  'Motor De Alta Revolucion':         { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Glucometro':                       { meses: 12, horas: 2,  tipo: 'calibracion' },
  'Termohigrometro Digital':          { meses: 12, horas: 1,  tipo: 'calibracion' },
  'Termometro Digital':               { meses: 12, horas: 1,  tipo: 'calibracion' },
  'Camilla De Transporte':            { meses: 12, horas: 2,  tipo: 'preventivo' },
  'Camilla Fija-Divan':               { meses: 12, horas: 2,  tipo: 'preventivo' },
  'Bascula Con Tallimetro':           { meses: 12, horas: 2,  tipo: 'calibracion' },
  'Bascula Mecanica':                 { meses: 12, horas: 2,  tipo: 'calibracion' },
  'Laringoscopio':                    { meses: 12, horas: 1,  tipo: 'preventivo' },
  'Nevera':                           { meses: 12, horas: 3,  tipo: 'preventivo' },
}

function getFrecuencia(nombre: string) {
  if (FRECUENCIAS[nombre]) return FRECUENCIAS[nombre]
  for (const [key, val] of Object.entries(FRECUENCIAS)) {
    if (nombre.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(nombre.toLowerCase())) {
      return val
    }
  }
  return { meses: 12, horas: 2, tipo: 'preventivo' }
}

function getMeses(frecMeses: number): number[] {
  if (frecMeses === 6) return [1, 7]
  if (frecMeses === 3) return [1, 4, 7, 10]
  return [1]
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: equipos, error } = await supabase
      .from('equipos')
      .select('id, nombre, codigo_inventario, servicio, riesgo, marca, modelo')
      .eq('institucion_id', INSTITUCION_ID)
      .eq('activo', true)
      .eq('estado', 'operativo')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const tiposMap: Record<string, any> = {}

    equipos?.forEach(e => {
      const freq = getFrecuencia(e.nombre)
      if (!tiposMap[e.nombre]) {
        tiposMap[e.nombre] = {
          nombre: e.nombre,
          cantidad: 0,
          frecMeses: freq.meses,
          horas: freq.horas,
          tipo: freq.tipo,
          riesgo: e.riesgo,
          meses: getMeses(freq.meses),
        }
      }
      tiposMap[e.nombre].cantidad++
    })

    const cronogramaMensual: Record<number, any[]> = {}
    for (let m = 1; m <= 12; m++) cronogramaMensual[m] = []

    Object.values(tiposMap).forEach(tipo => {
      tipo.meses.forEach((mes: number) => {
        cronogramaMensual[mes].push({
          nombre: tipo.nombre,
          cantidad: tipo.cantidad,
          horas: tipo.horas * tipo.cantidad,
          tipo: tipo.tipo,
          riesgo: tipo.riesgo,
          frecuencia: `Cada ${tipo.frecMeses} meses`,
        })
      })
    })

    const totalEquipos = equipos?.length || 0
    const vals = Object.values(tiposMap)
    const cada6meses  = vals.filter(t => t.frecMeses === 6).reduce((a: number, b: any) => a + b.cantidad, 0)
    const cada12meses = vals.filter(t => t.frecMeses === 12).reduce((a: number, b: any) => a + b.cantidad, 0)
    const totalInterv = vals.reduce((a: number, t: any) => a + (t.cantidad * (12 / t.frecMeses)), 0)
    const horasTotales = vals.reduce((a: number, t: any) => a + (t.cantidad * t.horas * (12 / t.frecMeses)), 0)

    const tiposArr = vals.sort((a: any, b: any) => {
      const orden: Record<string, number> = { alto: 0, medio: 1, bajo: 2 }
      return (orden[a.riesgo] || 0) - (orden[b.riesgo] || 0)
    })

    return NextResponse.json({
      tiposMap: tiposArr,
      cronogramaMensual,
      stats: { totalEquipos, cada6meses, cada12meses, totalInterv: Math.round(totalInterv), horasTotales: Math.round(horasTotales) }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
