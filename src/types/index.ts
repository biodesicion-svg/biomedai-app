// ─── INSTITUCIONES ───────────────────────────────────────────────
export interface Institucion {
  id: string
  nombre: string
  nit?: string
  ciudad?: string
  tipo?: string
  codigo_activacion?: string
  plan_estado: 'activo' | 'suspendido' | 'trial' | 'vencido'
  fecha_vencimiento?: string
  modulos_activos: string[]
  activo: boolean
  created_at: string
}

// ─── USUARIOS ────────────────────────────────────────────────────
export type Rol = 'super_admin' | 'admin' | 'supervisor' | 'tecnico'

export interface Usuario {
  id: string
  institucion_id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  ultimo_acceso?: string
  created_at: string
}

// ─── EQUIPOS ─────────────────────────────────────────────────────
export type RiesgoEquipo = 'alto' | 'medio' | 'bajo'
export type EstadoEquipo = 'operativo' | 'mantenimiento' | 'fuera_servicio' | 'baja'

export interface Equipo {
  id: string
  institucion_id: string
  nombre: string
  codigo_inventario: string
  marca?: string
  modelo?: string
  serie?: string
  servicio?: string
  ubicacion?: string
  riesgo: RiesgoEquipo
  estado: EstadoEquipo
  clase_invima?: string
  anio_fabricacion?: number
  anio_adquisicion?: number
  vida_util_anos?: number
  valor_adquisicion?: number
  activo: boolean
}

// ─── MANTENIMIENTOS ───────────────────────────────────────────────
export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'calibracion'
export type EstadoMantenimiento = 'programado' | 'en_progreso' | 'completado' | 'cancelado'

export interface Mantenimiento {
  id: string
  equipo_id: string
  institucion_id: string
  tipo: TipoMantenimiento
  estado: EstadoMantenimiento
  fecha_programada?: string
  fecha_realizado?: string
  duracion_horas?: number
  costo_total?: number
  descripcion?: string
  hallazgos?: string
}

// ─── REPUESTOS ────────────────────────────────────────────────────
export interface Repuesto {
  id: string
  institucion_id: string
  nombre: string
  referencia?: string
  marca?: string
  descripcion?: string
  stock_actual: number
  stock_minimo: number
  unidad: string
  costo_unitario?: number
  proveedor?: string
  activo: boolean
}

// ─── KPIs ────────────────────────────────────────────────────────
export interface KPIs {
  total: number
  operativos: number
  bajas: number
  altoRiesgo: number
  medioRiesgo: number
  bajoRiesgo: number
  disponibilidad: string
  mtbf: number
  mttr: string
  preventivos: number
  correctivos: number
  calibraciones: number
  ratio: string
  totalMant: number
  porServicio: ServicioKPI[]
  porTipo: TipoKPI[]
}

export interface ServicioKPI {
  nombre: string
  total: number
  operativos: number
  alto: number
  disponibilidad: string
}

export interface TipoKPI {
  label: string
  value: number
  color: string
  pct: number
}

// ─── PLANES ──────────────────────────────────────────────────────
export interface Plan {
  id: string
  nombre: string
  descripcion?: string
  precio_mensual: number
  precio_anual: number
  max_equipos: number
  max_usuarios: number
  modulos: string[]
  activo: boolean
}

// ─── PREDICCIÓN ──────────────────────────────────────────────────
export type NivelAlerta = 'critico' | 'alto' | 'medio' | 'bajo'

export interface EquipoRiesgo {
  id: string
  nombre: string
  servicio?: string
  riesgo: RiesgoEquipo
  marca?: string
  score: number
  probFalla: number
  diasParaFalla: number
  fechaFalla: string
  alerta: NivelAlerta
  edadAnios: number
  pctVida: number
  correctivos: number
  total_mant: number
  vidaUtil?: number
}
