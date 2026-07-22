import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionId } from '@/lib/get-institution'
import { createClient } from '@supabase/supabase-js'

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Evalua un criterio segun porcentaje: >=90 cumple, 60-89 parcial, <60 no cumple
function evaluar(pct: number) {
  if (pct >= 90) return 'cumple'
  if (pct >= 60) return 'parcial'
  return 'no_cumple'
}
function riesgoDe(resultado: string, critico: boolean) {
  if (resultado === 'cumple') return null
  if (resultado === 'no_cumple') return critico ? 'alto' : 'medio'
  return critico ? 'medio' : 'bajo'
}

export async function POST(req: NextRequest) {
  try {
    const IID = await getInstitutionId()
    const supabase = sb()
    const body = await req.json().catch(() => ({}))
    const tipo = body.tipo || 'equipos_biomedicos'
    const auditor = body.auditor || 'Sistema SYNAP'

    // ---------- Recoleccion de datos reales ----------
    const paginar = async (tabla: string, select: string, filtros: any = {}) => {
      const out: any[] = []
      for (let from = 0; ; from += 1000) {
        let q = supabase.from(tabla).select(select).range(from, from + 999)
        Object.entries(filtros).forEach(([k, v]) => { q = q.eq(k, v as any) })
        const { data } = await q
        if (!data || data.length === 0) break
        out.push(...data)
        if (data.length < 1000) break
      }
      return out
    }

    const equipos = await paginar('equipos', 'id, nombre, codigo_inventario, marca, modelo, serie, clase_invima, riesgo, servicio, estado, anio_adquisicion, activo', { institucion_id: IID, activo: true })
    const mants = await paginar('mantenimientos', 'id, equipo_id, tipo, estado, fecha_programada, fecha_realizado, ejecucion_respuestas, firma_tecnico', { institucion_id: IID })
    const pame = await paginar('pame_equipos', 'id, equipo_id, magnitud, tolerancia, frecuencia_meses', { institucion_id: IID })
    const cals = await paginar('pame_calibraciones', 'id, pame_equipo_id, fecha_calibracion, fecha_proxima, numero_certificado', {})
    const eventos = await paginar('tecnovigilancia_eventos', 'id, gravedad, estado, fecha_ocurrencia, fecha_conocimiento, numero_foreia', { institucion_id: IID })
    const { data: protocolos } = await supabase.from('protocolos').select('id, clave').eq('institucion_id', IID).eq('activo', true)
    const { data: tecnicos } = await supabase.from('usuarios').select('id, rol').eq('institucion_id', IID).eq('activo', true)
    const movs = await paginar('movimientos', 'id, equipo_id, tipo', { institucion_id: IID })

    const hoy = new Date().toISOString().slice(0, 10)
    const totalEq = equipos.length

    // ---------- Criterios Res. 4816/2008 ----------
    const equiposConCodigo = equipos.filter(e => e.codigo_inventario && String(e.codigo_inventario).trim() !== '').length
    const equiposConClase = equipos.filter(e => e.clase_invima).length
    const equiposConMarca = equipos.filter(e => e.marca && e.modelo).length
    const equiposConMant = new Set(mants.map(m => m.equipo_id)).size
    const mantCompletados = mants.filter(m => m.estado === 'completado').length
    const mantVencidos = mants.filter(m => m.estado !== 'completado' && m.fecha_programada && m.fecha_programada < hoy).length
    const equiposEnPame = pame.length
    const pameIds = new Set(pame.map(p => p.id))
    const calsVigentes = cals.filter(c => c.fecha_proxima && c.fecha_proxima >= hoy && pameIds.has(c.pame_equipo_id)).length
    const calsConCert = cals.filter(c => c.numero_certificado).length
    const pameConTolerancia = pame.filter(p => p.tolerancia != null).length
    const evSerios = eventos.filter(e => String(e.gravedad || '').toLowerCase() === 'serio')
    const evSeriosReportados = evSerios.filter(e => e.numero_foreia).length
    const mantConEvidencia = mants.filter(m => m.ejecucion_respuestas || m.firma_tecnico).length
    const nTecnicos = (tecnicos || []).filter(t => t.rol === 'tecnico').length
    const nProtocolos = (protocolos || []).length
    const equiposConMovim = new Set(movs.map(m => m.equipo_id)).size

    const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0

    const criterios = [
      { n:1, cat:'Inventario', art:'Art. 4 Res. 4816/2008', crit:'La institucion cuenta con inventario actualizado de equipos biomedicos',
        val:pct(equiposConCodigo,totalEq), enc:`${equiposConCodigo} de ${totalEq} equipos con codigo de inventario`, esp:'100% identificados', critico:true },
      { n:2, cat:'Inventario', art:'Decreto 4725/2005', crit:'Los equipos estan clasificados segun clase de riesgo INVIMA',
        val:pct(equiposConClase,totalEq), enc:`${equiposConClase} de ${totalEq} clasificados`, esp:'100% clasificados', critico:true },
      { n:3, cat:'Inventario', art:'Art. 4 Res. 4816/2008', crit:'Los equipos registran marca, modelo y datos del fabricante',
        val:pct(equiposConMarca,totalEq), enc:`${equiposConMarca} de ${totalEq} con marca y modelo`, esp:'100% documentados', critico:false },
      { n:4, cat:'Mantenimiento', art:'Art. 5 Res. 4816/2008', crit:'Existe plan de mantenimiento preventivo para los equipos',
        val:pct(equiposConMant,totalEq), enc:`${equiposConMant} de ${totalEq} equipos con mantenimiento programado`, esp:'100% con plan', critico:true },
      { n:5, cat:'Mantenimiento', art:'Art. 5 Res. 4816/2008', crit:'Se ejecutan los mantenimientos programados en las fechas previstas',
        val:pct(mantCompletados,mants.length), enc:`${mantCompletados} de ${mants.length} mantenimientos ejecutados`, esp:'>=90% de cumplimiento', critico:true },
      { n:6, cat:'Mantenimiento', art:'Art. 5 Res. 4816/2008', crit:'No existen mantenimientos vencidos sin ejecutar',
        val: mants.length ? Math.max(0, 100 - pct(mantVencidos, mants.length)) : 100,
        enc:`${mantVencidos} mantenimientos con fecha vencida`, esp:'0 vencidos', critico:true },
      { n:7, cat:'Mantenimiento', art:'Art. 5 Res. 4816/2008', crit:'Los mantenimientos ejecutados cuentan con evidencia y firma del tecnico',
        val:pct(mantConEvidencia,mantCompletados||1), enc:`${mantConEvidencia} de ${mantCompletados} con registro de ejecucion`, esp:'100% con evidencia', critico:true },
      { n:8, cat:'Mantenimiento', art:'Art. 5 Res. 4816/2008', crit:'Existen protocolos de mantenimiento documentados por tipo de equipo',
        val: nProtocolos >= 10 ? 100 : nProtocolos * 10, enc:`${nProtocolos} protocolos documentados`, esp:'>=10 protocolos', critico:false },
      { n:9, cat:'Metrologia', art:'Res. 2003/2014 - Art. 6 Res. 4816', crit:'Los equipos de medicion estan incluidos en el programa de metrologia (PAME)',
        val: totalEq ? Math.min(100, pct(equiposEnPame, Math.max(Math.round(totalEq*0.25),1))) : 0,
        enc:`${equiposEnPame} equipos en el PAME`, esp:'Todos los equipos de medicion', critico:true },
      { n:10, cat:'Metrologia', art:'Res. 2003/2014', crit:'Las calibraciones se encuentran vigentes',
        val:pct(calsVigentes,equiposEnPame||1), enc:`${calsVigentes} de ${equiposEnPame} con calibracion vigente`, esp:'>=90% vigentes', critico:true },
      { n:11, cat:'Metrologia', art:'ISO/IEC 17025', crit:'Las calibraciones cuentan con certificado y trazabilidad',
        val:pct(calsConCert,cals.length||1), enc:`${calsConCert} de ${cals.length} calibraciones con certificado`, esp:'100% con certificado', critico:false },
      { n:12, cat:'Metrologia', art:'Res. 2003/2014', crit:'Los equipos del PAME tienen tolerancias definidas',
        val:pct(pameConTolerancia,equiposEnPame||1), enc:`${pameConTolerancia} de ${equiposEnPame} con tolerancia definida`, esp:'100% con tolerancia', critico:false },
      { n:13, cat:'Tecnovigilancia', art:'Art. 15 Res. 4816/2008', crit:'La institucion cuenta con programa de tecnovigilancia activo',
        val: eventos.length > 0 ? 100 : 0, enc:`${eventos.length} eventos registrados`, esp:'Programa activo con registro', critico:true },
      { n:14, cat:'Tecnovigilancia', art:'Art. 15 Res. 4816/2008', crit:'Los eventos serios se reportan al INVIMA dentro de las 72 horas',
        val: evSerios.length ? pct(evSeriosReportados, evSerios.length) : 100,
        enc:`${evSeriosReportados} de ${evSerios.length} eventos serios reportados`, esp:'100% reportados', critico:true },
      { n:15, cat:'Talento humano', art:'Art. 7 Res. 4816/2008', crit:'Existe personal tecnico asignado al mantenimiento de equipos',
        val: nTecnicos >= 2 ? 100 : nTecnicos * 50, enc:`${nTecnicos} tecnicos activos registrados`, esp:'>=2 tecnicos', critico:true },
      { n:16, cat:'Trazabilidad', art:'Art. 4 Res. 4816/2008', crit:'Se registran los movimientos y traslados de equipos',
        val: movs.length > 0 ? Math.min(100, pct(equiposConMovim, Math.max(Math.round(totalEq*0.05),1))) : 0,
        enc:`${movs.length} movimientos registrados sobre ${equiposConMovim} equipos`, esp:'Registro de trazabilidad activo', critico:false },
    ]

    // ---------- Planes de mejora por fases con datos reales ----------
    const eqIIb = equipos.filter(e => e.clase_invima === 'IIb' || e.clase_invima === 'III').length
    const mantPend = mants.length - mantCompletados
    const calVencidas = equiposEnPame - calsVigentes
    const evSinReportar = evSerios.length - evSeriosReportados

    const PLANES: Record<number, any> = {
      1: { accion:'Completar la identificacion del inventario',
           como:`FASE 1 (0-30 dias): Identificar los ${totalEq-equiposConCodigo} equipos sin codigo y asignarles consecutivo. FASE 2 (30-60 dias): Rotular fisicamente con etiqueta QR. VERIFICACION: 100% de equipos con codigo unico y etiqueta legible.`,
           responsable:'Ingeniero Biomedico', plazo:'60 dias',
           riesgo_incumplimiento:'Imposibilidad de trazar el equipo ante un evento adverso' },
      2: { accion:'Clasificar los equipos segun clase de riesgo INVIMA',
           como:`FASE 1 (0-30 dias): Clasificar los ${totalEq-equiposConClase} equipos pendientes segun Decreto 4725. FASE 2 (30-45 dias): Validacion por el ingeniero biomedico responsable. VERIFICACION: 100% clasificados y ratificados.`,
           responsable:'Ingeniero Biomedico', plazo:'45 dias',
           riesgo_incumplimiento:'Hallazgo mayor en habilitacion; frecuencias de mantenimiento mal definidas' },
      3: { accion:'Completar datos de fabricante en el inventario',
           como:`FASE 1 (0-45 dias): Completar marca y modelo de ${totalEq-equiposConMarca} equipos consultando placa o manual. FASE 2 (45-90 dias): Registrar fabricante e importador. VERIFICACION: ficha tecnica completa por equipo.`,
           responsable:'Auxiliar de Inventario', plazo:'90 dias',
           riesgo_incumplimiento:'Dificultad para gestionar repuestos y reportes de tecnovigilancia' },
      4: { accion:'Ampliar el plan de mantenimiento a todo el parque',
           como:`FASE 1 (0-30 dias): Identificar los ${totalEq-equiposConMant} equipos sin plan y definir frecuencia por clase de riesgo. FASE 2 (30-60 dias): Cargar el cronograma anual. VERIFICACION: 100% de equipos activos con mantenimiento programado.`,
           responsable:'Coordinador de Mantenimiento', plazo:'60 dias',
           riesgo_incumplimiento:'Incumplimiento Art. 5 Res. 4816; equipos operando sin control preventivo' },
      5: { accion:'Recuperar el cumplimiento del plan de mantenimiento',
           como:`FASE 1 (0-30 dias): Priorizar por clase de riesgo los ${mantPend} mantenimientos pendientes; iniciar por los ${eqIIb} equipos IIb/III. FASE 2 (30-90 dias): Ejecutar el 100% de los pendientes de soporte vital. FASE 3 (90-180 dias): Ejecutar el resto y evaluar si la capacidad de ${nTecnicos} tecnicos es suficiente. VERIFICACION: cumplimiento >=90% en auditoria de seguimiento a 180 dias.`,
           responsable:'Coordinador de Mantenimiento', plazo:'180 dias',
           riesgo_incumplimiento:'Falla de equipos en uso clinico; hallazgo mayor en visita de habilitacion' },
      6: { accion:'Eliminar el rezago de mantenimientos vencidos',
           como:`FASE 1 (0-15 dias): Clasificar los ${mantVencidos} vencidos por clase de riesgo y servicio. FASE 2 (15-60 dias): Intervenir el 100% de los vencidos en equipos de soporte vital (UCI, Salas de CX). FASE 3 (60-150 dias): Cerrar el rezago restante o reprogramar con justificacion tecnica documentada. VERIFICACION: 0 vencidos en equipos clase IIb/III.`,
           responsable:'Coordinador de Mantenimiento', plazo:'150 dias',
           riesgo_incumplimiento:'Riesgo directo para el paciente; sancion en visita de verificacion' },
      7: { accion:'Documentar la evidencia de ejecucion de cada mantenimiento',
           como:`FASE 1 (0-30 dias): Capacitar a los ${nTecnicos} tecnicos en el registro digital de ejecucion y firma. FASE 2 (30-60 dias): Exigir acta firmada como requisito de cierre de la orden. VERIFICACION: 100% de mantenimientos cerrados con checklist y firma.`,
           responsable:'Ingeniero Biomedico', plazo:'60 dias',
           riesgo_incumplimiento:'Mantenimientos no demostrables ante auditoria; equivale a no haberlos hecho' },
      8: { accion:'Ampliar la documentacion de protocolos',
           como:`FASE 1 (0-60 dias): Elaborar protocolos para los tipos de equipo IIb sin cobertura. FASE 2 (60-90 dias): Validar con el fabricante y aprobar en el sistema de gestion. VERIFICACION: protocolo vigente para todo equipo de alto riesgo.`,
           responsable:'Ingeniero Biomedico', plazo:'90 dias',
           riesgo_incumplimiento:'Mantenimientos sin criterio tecnico uniforme' },
      9: { accion:'Ampliar la cobertura del programa de metrologia',
           como:`FASE 1 (0-45 dias): Identificar todo equipo con funcion de medicion no incluido en el PAME. FASE 2 (45-90 dias): Definir magnitud, rango y tolerancia por equipo. VERIFICACION: 100% de equipos de medicion en el PAME.`,
           responsable:'Ingeniero Biomedico', plazo:'90 dias',
           riesgo_incumplimiento:'Mediciones sin trazabilidad metrologica; decisiones clinicas sobre datos no confiables' },
      10:{ accion:'Regularizar las calibraciones vencidas',
           como:`FASE 1 (0-30 dias): Priorizar las ${calVencidas} calibraciones vencidas por criticidad clinica (inicia por temperatura en conservacion de medicamentos y hemocomponentes). FASE 2 (30-90 dias): Contratar laboratorio acreditado ONAC y ejecutar. FASE 3 (90-120 dias): Cargar certificados y programar el siguiente ciclo. VERIFICACION: >=90% de calibraciones vigentes.`,
           responsable:'Ingeniero Biomedico', plazo:'120 dias',
           riesgo_incumplimiento:'Equipos de medicion sin validez metrologica en uso clinico' },
      11:{ accion:'Completar la trazabilidad de certificados',
           como:`FASE 1 (0-30 dias): Solicitar al laboratorio los certificados faltantes. FASE 2 (30-60 dias): Digitalizar y vincular cada certificado a su equipo. VERIFICACION: 100% de calibraciones con certificado trazable.`,
           responsable:'Auxiliar de Calidad', plazo:'60 dias',
           riesgo_incumplimiento:'Calibraciones no demostrables ante auditoria' },
      12:{ accion:'Definir tolerancias metrologicas faltantes',
           como:`FASE 1 (0-30 dias): Definir tolerancia y rango por magnitud segun norma aplicable. FASE 2 (30-45 dias): Validacion tecnica y carga al sistema. VERIFICACION: deteccion automatica de fuera de tolerancia operativa.`,
           responsable:'Ingeniero Biomedico', plazo:'45 dias',
           riesgo_incumplimiento:'Imposibilidad de determinar si un equipo esta fuera de especificacion' },
      13:{ accion:'Activar el programa institucional de tecnovigilancia',
           como:`FASE 1 (0-30 dias): Designar el referente de tecnovigilancia y difundir el procedimiento de reporte. FASE 2 (30-60 dias): Capacitar al personal asistencial. FASE 3 (60-90 dias): Primer consolidado trimestral RETEIM. VERIFICACION: programa activo con reportes periodicos.`,
           responsable:'Referente de Tecnovigilancia', plazo:'90 dias',
           riesgo_incumplimiento:'Incumplimiento Art. 15 Res. 4816; eventos adversos no detectados' },
      14:{ accion:'Asegurar el reporte oportuno de eventos serios',
           como:`FASE 1 (0-15 dias): Reportar al INVIMA los ${evSinReportar} eventos serios pendientes. FASE 2 (15-45 dias): Implementar alerta automatica a las 48h para no superar el plazo de 72h. VERIFICACION: 100% de eventos serios reportados dentro del plazo legal.`,
           responsable:'Referente de Tecnovigilancia', plazo:'45 dias',
           riesgo_incumplimiento:'Sancion por incumplimiento del reporte obligatorio a INVIMA' },
      15:{ accion:'Fortalecer el equipo tecnico responsable',
           como:`FASE 1 (0-30 dias): Evaluar la carga real: ${mants.length} mantenimientos anuales frente a ${nTecnicos} tecnicos. FASE 2 (30-90 dias): Vincular personal o contratar servicio tercerizado segun el deficit calculado. VERIFICACION: capacidad instalada suficiente para cumplir el plan anual.`,
           responsable:'Direccion Administrativa', plazo:'90 dias',
           riesgo_incumplimiento:'Plan de mantenimiento inejecutable por falta de capacidad' },
      16:{ accion:'Implementar el registro sistematico de movimientos',
           como:`FASE 1 (0-30 dias): Definir el procedimiento de traslado, prestamo y baja de equipos. FASE 2 (30-60 dias): Capacitar a los servicios y exigir registro en cada movimiento. VERIFICACION: todo traslado con registro y responsable identificado.`,
           responsable:'Ingeniero Biomedico', plazo:'60 dias',
           riesgo_incumplimiento:'Perdida de trazabilidad de la ubicacion real de los equipos' },
    }

    // ---------- Evaluar y armar hallazgos ----------
    const items = criterios.map(c => {
      const resultado = evaluar(c.val)
      return { ...c, resultado, riesgo: riesgoDe(resultado, c.critico), mejora: PLANES[c.n] || null }
    })

    const cumplidos = items.filter(i => i.resultado === 'cumple').length
    const parciales = items.filter(i => i.resultado === 'parcial').length
    const noCumplidos = items.filter(i => i.resultado === 'no_cumple').length
    const porcentaje = Math.round((cumplidos + parciales * 0.5) / items.length * 100)
    const nivelRiesgo = noCumplidos >= 4 ? 'alto' : noCumplidos >= 1 ? 'medio' : 'bajo'

    const hallazgos = items.filter(i => i.resultado !== 'cumple').map((i, idx) => ({
      numero: idx + 1,
      tipo: i.resultado === 'no_cumple' ? (i.critico ? 'no_conformidad_mayor' : 'no_conformidad_menor') : 'observacion',
      descripcion: `${i.crit}. Hallazgo: ${i.enc}. Criterio esperado: ${i.esp}.`,
      articulo_incumplido: i.art,
      nivel_riesgo: i.riesgo,
      metodo_mejora: i.resultado === 'no_cumple' ? 'Accion correctiva' : 'Correccion',
      plan_accion: i.mejora ? `${i.mejora.accion}. ${i.mejora.como}` : `Alcanzar el criterio: ${i.esp}`,
      responsable_sugerido: i.mejora?.responsable || null,
      plazo_sugerido: i.mejora?.plazo || null,
      categoria: i.cat,
      criterio_numero: i.n,
    }))

    // ---------- Guardar en base de datos ----------
    const { data: aud, error: errAud } = await supabase.from('auditorias').insert({
      institucion_id: IID, tipo, norma: 'Resolucion 4816 de 2008',
      auditor_nombre: auditor, auditor_cargo: 'Auditoria automatizada',
      alcance: 'Gestion de equipos biomedicos, metrologia y tecnovigilancia',
      origen: 'interna', estado: 'en_proceso',
      total_criterios: items.length, cumplidos, parciales, no_cumplidos: noCumplidos,
      porcentaje_cumplimiento: porcentaje, nivel_riesgo: nivelRiesgo,
    }).select().single()
    if (errAud) return NextResponse.json({ error: errAud.message }, { status: 500 })

    const itemsIns = items.map(i => ({
      auditoria_id: aud.id, numero: i.n, categoria: i.cat, articulo: i.art,
      criterio: i.crit, resultado: i.resultado, evidencia: i.enc,
      valor_encontrado: String(i.val) + '%', valor_esperado: i.esp, automatico: true,
    }))
    const { data: itemsGuardados } = await supabase.from('auditoria_items').insert(itemsIns).select()

    const mapItem: Record<number, string> = {}
    ;(itemsGuardados || []).forEach((it: any) => { mapItem[it.numero] = it.id })

    const hallIns = hallazgos.map(h => ({
      auditoria_id: aud.id, item_id: mapItem[h.criterio_numero] || null,
      numero: h.numero, tipo: h.tipo, descripcion: h.descripcion,
      articulo_incumplido: h.articulo_incumplido, nivel_riesgo: h.nivel_riesgo,
      metodo_mejora: h.metodo_mejora, plan_accion: h.plan_accion, estado: 'abierto',
    }))
    if (hallIns.length) await supabase.from('auditoria_hallazgos').insert(hallIns)

    return NextResponse.json({
      auditoria: aud,
      resumen: { total: items.length, cumplidos, parciales, noCumplidos, porcentaje, nivelRiesgo },
      items, hallazgos,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: listar auditorias con sus hallazgos
export async function GET(req: NextRequest) {
  try {
    const IID = await getInstitutionId()
    const supabase = sb()
    const id = req.nextUrl.searchParams.get('id')

    if (id) {
      const { data: aud } = await supabase.from('auditorias').select('*').eq('id', id).eq('institucion_id', IID).single()
      if (!aud) return NextResponse.json({ error: 'Auditoria no encontrada' }, { status: 404 })
      const { data: items } = await supabase.from('auditoria_items').select('*').eq('auditoria_id', id).order('numero')
      const { data: hallazgos } = await supabase.from('auditoria_hallazgos').select('*').eq('auditoria_id', id).order('numero')
      return NextResponse.json({ auditoria: aud, items: items || [], hallazgos: hallazgos || [] })
    }

    const { data: auds } = await supabase.from('auditorias').select('*')
      .eq('institucion_id', IID).order('fecha_auditoria', { ascending: false }).limit(50)
    return NextResponse.json({ auditorias: auds || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH: actualizar un hallazgo (plan de accion, responsable, fechas, estado)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = sb()
    const body = await req.json()
    const { id, ...campos } = body
    if (!id) return NextResponse.json({ error: 'Falta id del hallazgo' }, { status: 400 })
    const permitidos = ['causa_raiz','metodo_mejora','plan_accion','responsable','fecha_compromiso',
                        'fecha_cierre','estado','evaluacion','verificacion_eficacia','nivel_riesgo']
    const patch: any = {}
    permitidos.forEach(k => { if (campos[k] !== undefined) patch[k] = campos[k] })
    const { error } = await supabase.from('auditoria_hallazgos').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
