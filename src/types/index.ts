export type RiesgoNivel = 'alto' | 'medio' | 'bajo'
export type EstadoEquipo = 'operativo' | 'fuera_servicio' | 'mantenimiento' | 'baja'
export type ClaseInvima = 'I' | 'IIa' | 'IIb' | 'III'

export interface Equipo {
  id: string
  codigo_inventario: string
  nombre: string
  tipo: string
  marca: string
  modelo: string
  serie: string
  ubicacion: string
  servicio: string
  anio_fabricacion: number
  anio_adquisicion: number
  vida_util_anos: number
  riesgo: RiesgoNivel
  clase_invima: ClaseInvima
  estado: EstadoEquipo
  valor_adquisicion: number
  notas: string
  activo: boolean
  created_at: string
  updated_at: string
}
