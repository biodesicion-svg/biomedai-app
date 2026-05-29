// ─── IDS ─────────────────────────────────────────────────────────
export const INSTITUCION_ID_DEMO = '00000000-0000-0000-0000-000000000001'

// ─── MÓDULOS DEL SISTEMA ─────────────────────────────────────────
export const MODULOS = [
  { id:'dashboard',     label:'Dashboard',          icon:'ti-layout-dashboard',  href:'/dashboard' },
  { id:'inventario',    label:'Inventario',          icon:'ti-clipboard-list',    href:'/inventario' },
  { id:'mantenimiento', label:'Mantenimiento',       icon:'ti-tool',              href:'/mantenimiento' },
  { id:'ordenes',       label:'Órdenes de trabajo',  icon:'ti-clipboard-check',   href:'/ordenes' },
  { id:'repuestos',     label:'Repuestos',           icon:'ti-package',           href:'/repuestos' },
  { id:'prediccion',    label:'Predicción',          icon:'ti-trending-up',       href:'/prediccion' },
  { id:'kpis',          label:'KPIs',                icon:'ti-chart-bar',         href:'/kpis' },
  { id:'presupuesto',   label:'Presupuesto',         icon:'ti-currency-dollar',   href:'/presupuesto' },
  { id:'auditoria',     label:'Auditoría',           icon:'ti-shield-check',      href:'/auditoria' },
  { id:'chat',          label:'Asistente IA',        icon:'ti-message',           href:'/chat' },
] as const

// ─── COLORES ─────────────────────────────────────────────────────
export const RIESGO_COLORS = {
  alto:  { bg:'#FEF2F2', text:'#DC2626', border:'#FECACA' },
  medio: { bg:'#FFFBEB', text:'#D97706', border:'#FDE68A' },
  bajo:  { bg:'#F0FDF4', text:'#16A34A', border:'#BBF7D0' },
} as const

export const ESTADO_COLORS = {
  operativo:      { bg:'#F0FDF4', text:'#16A34A' },
  mantenimiento:  { bg:'#FFFBEB', text:'#D97706' },
  fuera_servicio: { bg:'#FEF2F2', text:'#DC2626' },
  baja:           { bg:'#F4F4F5', text:'#71717A' },
} as const

export const TIPO_MANT_COLORS = {
  preventivo:  { bg:'#F0FDF4', text:'#16A34A' },
  correctivo:  { bg:'#FEF2F2', text:'#DC2626' },
  calibracion: { bg:'#FFFBEB', text:'#D97706' },
} as const

export const PLAN_ESTADO_COLORS = {
  activo:     { bg:'#F0FDF4', text:'#16A34A', label:'Activo' },
  suspendido: { bg:'#FEF2F2', text:'#DC2626', label:'Suspendido' },
  trial:      { bg:'#EEF2FF', text:'#3B4FE8', label:'Trial' },
  vencido:    { bg:'#F4F4F5', text:'#71717A', label:'Vencido' },
} as const

export const ALERTA_COLORS = {
  critico: { bg:'#FEF2F2', text:'#DC2626', border:'#FECACA', label:'Crítico' },
  alto:    { bg:'#FFFBEB', text:'#D97706', border:'#FDE68A', label:'Alto' },
  medio:   { bg:'#EEF2FF', text:'#3B4FE8', border:'#C7D2FE', label:'Medio' },
  bajo:    { bg:'#F0FDF4', text:'#16A34A', border:'#BBF7D0', label:'Bajo' },
} as const

// ─── FRECUENCIAS DE MANTENIMIENTO ────────────────────────────────
export const FRECUENCIAS_MANTENIMIENTO: Record<string, { meses:number; horas:number; tipo:string }> = {
  'Monitor De Signos Vitales':   { meses:6,  horas:4, tipo:'preventivo' },
  'Monitor Fetal':               { meses:6,  horas:4, tipo:'preventivo' },
  'Ventilador Mecanico':         { meses:6,  horas:6, tipo:'preventivo' },
  'Desfibrilador':               { meses:6,  horas:4, tipo:'preventivo' },
  'Electrobisturi':              { meses:6,  horas:5, tipo:'preventivo' },
  'Bomba De Nutricion Amika':    { meses:6,  horas:3, tipo:'preventivo' },
  'Incubadora Abierta':          { meses:6,  horas:6, tipo:'preventivo' },
  'Incubadora Cerrada':          { meses:6,  horas:6, tipo:'preventivo' },
  'Maquina De Anestesia':        { meses:6,  horas:8, tipo:'preventivo' },
  'Glucometro':                  { meses:12, horas:1, tipo:'calibracion' },
  'Termohigrometro Digital':     { meses:12, horas:1, tipo:'calibracion' },
  'Camilla De Transporte':       { meses:12, horas:2, tipo:'preventivo' },
  'Camilla Fija-Divan':          { meses:12, horas:2, tipo:'preventivo' },
  'Bascula Con Tallimetro':      { meses:12, horas:2, tipo:'calibracion' },
  'Nevera':                      { meses:12, horas:3, tipo:'preventivo' },
}

export const FRECUENCIA_DEFAULT = { meses:12, horas:2, tipo:'preventivo' }

// ─── MESES ───────────────────────────────────────────────────────
export const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const
export const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] as const

// ─── TÉCNICOS ─────────────────────────────────────────────────────
export const TECNICOS_DEFAULT = ['Biomédico 1', 'Biomédico 2', 'Biomédico 3'] as const
export const HORAS_DIA = 8
export const DIAS_MES  = 22

// ─── FORMATOS ────────────────────────────────────────────────────
export const fmtCOP   = (n: number) => `$${Math.round(n).toLocaleString('es-CO')} COP`
export const fmtMiles = (n: number) => n >= 1_000_000_000 ? `$${(n/1_000_000_000).toFixed(1)}B`
  : n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M`
  : n >= 1_000     ? `$${Math.round(n/1_000)}K`
  : `$${Math.round(n)}`
