import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTITUCION_ID = '00000000-0000-0000-0000-000000000001'
const TECNICOS = ['Biomédico 1', 'Biomédico 2', 'Biomédico 3']
const HORAS_DIA = 8
const DIAS_MES = 22

const FRECUENCIAS: Record<string, { meses: number; horas: number; tipo: string }> = {
  'Monitor De Signos Vitales':             { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Monitor Fetal':                         { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Monitor Multiparametros De Anestesia':  { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Ventilador Mecanico':                   { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Desfibrilador':                         { meses: 6,  horas: 4,  tipo: 'preventivo' },
  'Electrobisturi':                        { meses: 6,  horas: 5,  tipo: 'preventivo' },
  'Bomba De Nutricion Amika':              { meses: 6,  horas: 3,  tipo: 'preventivo' },
  'Incubadora Abierta':                    { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Incubadora Cerrada':                    { meses: 6,  horas: 6,  tipo: 'preventivo' },
  'Maquina De Anestesia':                  { meses: 6,  horas: 8,  tipo: 'preventivo' },
  'Glucometro':                            { meses: 12, horas: 1,  tipo: 'calibracion' },
  'Termohigrometro Digital':               { meses: 12, horas: 1,  tipo: 'calibracion' },
  'Termometro Digital':                    { meses: 12, horas: 1,  tipo: 'calibracion' },
  'Camilla De Transporte':                 { meses: 12, horas: 2,  tipo: 'preventivo' },
  'Camilla Fija-Divan':                    { meses: 12, horas: 2,  tipo: 'preventivo' },
  'Bascula Con Tallimetro':                { meses: 12, horas: 2,  tipo: 'calibracion' },
  'Bascula Mecanica':                      { meses: 12, horas: 2,  tipo: 'calibracion' },
  'Laringoscopio':                         { meses: 12, horas: 1,  tipo: 'preventivo' },
  'Nevera':                                { meses: 12, horas: 3,  tipo: 'preventivo' },
}

function getFrecuencia(nombre: string) {
  if (FRECUENCIAS[nombre]) return FRECUENCIAS[nombre]
  for (const [key, val] of Object.entries(FRECUENCIAS)) {
    if (nombre.toLowerCase().includes(key.toLowerCase())) return val
  }
  return { meses: 12, horas: 2, tipo: 'preventivo' }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: equipos, error } = await supabase
      .from('equipos')
      .select('id, nombre, codigo_inventario, servicio, riesgo')
      .eq('institucion_id', INSTITUCION_ID)
      .eq('activo', true)
      .eq('estado', 'operativo')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Agrupar por tipo
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
        }
      }
      tiposMap[e.nombre].cantidad++
    })

    const tipos = Object.values(tiposMap)

    // Cronograma mensual distribuido
    const cronogramaMensual: Record<number, any[]> = {}
    for (let m = 1; m <= 12; m++) cronogramaMensual[m] = []

    tipos.forEach((tipo: any) => {
      const mesesPorCiclo = tipo.frecMeses === 6 ? 6 : 12
      for (let mes = 1; mes <= 12; mes++) {
        // Para cada mes calcular cuántos equipos van
        let cantMes = 0
        if (tipo.frecMeses === 6) {
          // Distribuir entre los 6 meses del semestre
          const mesSemestre = mes <= 6 ? mes : mes - 6
          cantMes = Math.floor(tipo.cantidad / 6)
          if (mesSemestre <= (tipo.cantidad % 6)) cantMes++
        } else {
          // Distribuir entre los 12 meses
          cantMes = Math.floor(tipo.cantidad / 12)
          if (mes <= (tipo.cantidad % 12)) cantMes++
        }

        if (cantMes > 0) {
          // Distribuir entre 3 tecnicos
          const base = Math.floor(cantMes / 3)
          const resto = cantMes % 3
          const asignaciones = TECNICOS.map((tec, idx) => {
            const cant = base + (idx < resto ? 1 : 0)
            return { tecnico: tec, cantidad: cant, horas: cant * tipo.horas }
          }).filter(a => a.cantidad > 0)

          const diasNecesarios = Math.ceil((Math.ceil(cantMes / 3) * tipo.horas) / HORAS_DIA)

          cronogramaMensual[mes].push({
            nombre: tipo.nombre,
            cantidad: cantMes,
            horasTotales: cantMes * tipo.horas,
            horas: tipo.horas,
            tipo: tipo.tipo,
            riesgo: tipo.riesgo,
            frecuencia: `Cada ${tipo.frecMeses} meses`,
            asignaciones,
            diasNecesarios,
          })
        }
      }
    })

    // Resumen anual
    const resumenAnual = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const items = cronogramaMensual[mes]
      const totalEquipos = items.reduce((a: number, b: any) => a + b.cantidad, 0)
      const totalHoras = items.reduce((a: number, b: any) => a + b.horasTotales, 0)
      const capacidad = HORAS_DIA * DIAS_MES * 3
      return {
        mes,
        nombre: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][i],
        totalEquipos,
        totalHoras,
        capacidad,
        ocupacion: Math.round((totalHoras / capacidad) * 100),
        items: items.length,
      }
    })

    // Ordenes del mes actual
    const mesActual = new Date().getMonth() + 1
    const ordenesProximas = (cronogramaMensual[mesActual] || [])
      .flatMap((item: any) =>
        (item.asignaciones || []).map((asig: any) => ({
          id: `OT-${String(mesActual).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`,
          equipo: item.nombre,
          tipo: item.tipo,
          tecnico: asig.tecnico,
          cantidad: asig.cantidad,
          horas: asig.horas,
          estado: 'programado',
          prioridad: item.riesgo === 'alto' ? 'alta' : item.riesgo === 'medio' ? 'media' : 'baja',
          riesgo: item.riesgo,
        }))
      )
      .sort((a: any, b: any) => {
        const p: Record<string, number> = { alta: 0, media: 1, baja: 2 }
        return p[a.prioridad] - p[b.prioridad]
      })

    const vals = Object.values(tiposMap)
    const cada6meses  = vals.filter((t: any) => t.frecMeses === 6).reduce((a: number, b: any) => a + b.cantidad, 0)
    const cada12meses = vals.filter((t: any) => t.frecMeses === 12).reduce((a: number, b: any) => a + b.cantidad, 0)
    const totalInterv = vals.reduce((a: number, t: any) => a + (t.cantidad * (12 / t.frecMeses)), 0)
    const horasTotalesAno = vals.reduce((a: number, t: any) => a + (t.cantidad * t.horas * (12 / t.frecMeses)), 0)

    return NextResponse.json({
      tiposMap: vals.sort((a: any, b: any) => {
        const o: Record<string, number> = { alto: 0, medio: 1, bajo: 2 }
        return (o[a.riesgo] || 0) - (o[b.riesgo] || 0)
      }),
      cronogramaMensual,
      resumenAnual,
      ordenesProximas,
      tecnicos: TECNICOS,
      stats: {
        totalEquipos: equipos?.length || 0,
        cada6meses,
        cada12meses,
        totalInterv: Math.round(totalInterv),
        horasTotalesAno: Math.round(horasTotalesAno),
        capacidadMensual: HORAS_DIA * DIAS_MES * 3,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
