import { getInstitutionId } from '@/lib/get-institution'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function GET() {
  const IID = await getInstitutionId()
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const [{ data: equipos }, { data: mants }, { data: repuestos }] = await Promise.all([
      sb.from('equipos').select('id,nombre,tipo,servicio,riesgo,clase_invima,estado,anio_adquisicion,vida_util_anos,valor_adquisicion').eq('institucion_id', IID).eq('activo', true),
      sb.from('mantenimientos').select('id,equipo_id,tipo,estado,fecha_programada,fecha_realizado,duracion_horas,costo_total,costo_mano_obra,costo_repuestos,hallazgos').eq('institucion_id', IID),
      sb.from('repuestos').select('id,nombre,stock_actual,stock_minimo,costo_unitario,proveedor').eq('institucion_id', IID).eq('activo', true),
    ])

    const eq  = equipos  || []
    const mn  = mants    || []
    const rep = repuestos|| []
    const hoy = new Date()
    const anioHoy = hoy.getFullYear()

    // ── DISPONIBILIDAD ────────────────────────────────────────────
    const total       = eq.length
    const operativos  = eq.filter(e => e.estado === 'operativo').length
    const enMant      = eq.filter(e => e.estado === 'en_mantenimiento').length
    const fuera       = eq.filter(e => e.estado === 'fuera_servicio').length
    const baja        = eq.filter(e => e.estado === 'baja').length
    const disponibilidad = total > 0 ? +((operativos/total)*100).toFixed(1) : 0

    // ── RIESGO ────────────────────────────────────────────────────
    const altoRiesgo  = eq.filter(e => e.riesgo === 'alto').length
    const medioRiesgo = eq.filter(e => e.riesgo === 'medio').length
    const bajoRiesgo  = eq.filter(e => e.riesgo === 'bajo').length
    const claseIII    = eq.filter(e => e.clase_invima === 'III').length
    const claseIIb    = eq.filter(e => e.clase_invima === 'IIb').length
    const claseIIa    = eq.filter(e => e.clase_invima === 'IIa').length
    const claseI      = eq.filter(e => e.clase_invima === 'I').length

    // ── MANTENIMIENTO ─────────────────────────────────────────────
    const preventivos   = mn.filter(m => m.tipo === 'preventivo').length
    const correctivos   = mn.filter(m => m.tipo === 'correctivo').length
    const calibraciones = mn.filter(m => m.tipo === 'calibracion').length
    const totalMant     = mn.length
    const completados   = mn.filter(m => m.estado === 'completado').length
    const pendientes    = mn.filter(m => m.estado === 'programado' || m.estado === 'pendiente').length
    const vencidos      = mn.filter(m => {
      if (m.estado !== 'programado') return false
      const fp = m.fecha_programada ? new Date(m.fecha_programada) : null
      return fp && fp < hoy
    }).length

    // ── MTTR / MTBF ───────────────────────────────────────────────
    const durs = mn.filter(m => m.duracion_horas && +m.duracion_horas > 0).map(m => +m.duracion_horas)
    const mttr = durs.length > 0 ? +(durs.reduce((a,b)=>a+b,0)/durs.length).toFixed(1) : 0

    const corr = mn.filter(m => m.tipo === 'correctivo' && m.fecha_realizado).sort((a,b) => new Date(a.fecha_realizado).getTime()-new Date(b.fecha_realizado).getTime())
    let mtbf = 365
    if (corr.length >= 2) {
      const ints = []
      for (let i=1;i<corr.length;i++) ints.push((new Date(corr[i].fecha_realizado).getTime()-new Date(corr[i-1].fecha_realizado).getTime())/86400000)
      mtbf = Math.round(ints.reduce((a,b)=>a+b,0)/ints.length)
    }

    // ── COSTOS GENERALES ──────────────────────────────────────────
    const costoTotal  = mn.reduce((s,m)=>s+ +(m.costo_total||0), 0)
    const costoMO     = mn.reduce((s,m)=>s+ +(m.costo_mano_obra||0), 0)
    const costoRep    = mn.reduce((s,m)=>s+ +(m.costo_repuestos||0), 0)
    const costoPrev   = mn.filter(m=>m.tipo==='preventivo').reduce((s,m)=>s+ +(m.costo_total||0), 0)
    const costoCorr   = mn.filter(m=>m.tipo==='correctivo').reduce((s,m)=>s+ +(m.costo_total||0), 0)
    const costoCal    = mn.filter(m=>m.tipo==='calibracion').reduce((s,m)=>s+ +(m.costo_total||0), 0)
    const costoProm   = completados > 0 ? Math.round(costoTotal/completados) : 0
    const valorParque = eq.reduce((s,e)=>s+ +(e.valor_adquisicion||0), 0)
    const cmr         = valorParque > 0 ? +((costoTotal/valorParque)*100).toFixed(1) : 0
    const pctCostoPrev = costoTotal > 0 ? +((costoPrev/costoTotal)*100).toFixed(1) : 0
    const pctCostoCorr = costoTotal > 0 ? +((costoCorr/costoTotal)*100).toFixed(1) : 0
    const pctCostoCal  = costoTotal > 0 ? +((costoCal/costoTotal)*100).toFixed(1) : 0
    const pctCostoMO   = costoTotal > 0 ? Math.round((costoMO/costoTotal)*100) : 0
    const pctCostoRep  = costoTotal > 0 ? Math.round((costoRep/costoTotal)*100) : 0

    // ── COSTO POR SERVICIO ────────────────────────────────────────
    const svcCosto: Record<string,number> = {}
    mn.forEach(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      const s = eqD?.servicio || 'Sin servicio'
      if (!svcCosto[s]) svcCosto[s] = 0
      svcCosto[s] += +(m.costo_total||0)
    })
    const costoPorServicio = Object.entries(svcCosto)
      .map(([label, costo]) => ({ label, costo: Math.round(costo) }))
      .sort((a,b) => b.costo-a.costo)
      .slice(0, 8)

    // ── COSTO POR MES (ultimos 8) ─────────────────────────────────
    const byMes: Record<string,{t:number,p:number,c:number}> = {}
    mn.forEach(m => {
      if (!m.fecha_realizado) return
      const d = new Date(m.fecha_realizado)
      const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
      if (!byMes[k]) byMes[k] = {t:0,p:0,c:0}
      byMes[k].t += +(m.costo_total||0)
      if (m.tipo==='preventivo') byMes[k].p += +(m.costo_total||0)
      if (m.tipo==='correctivo') byMes[k].c += +(m.costo_total||0)
    })
    const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const costoPorMes = Object.entries(byMes)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k,v]) => {
        const [y,m2] = k.split('-')
        return { mes: MESES_ES[+m2-1]+' '+y.slice(2), prev: Math.round(v.p), corr: Math.round(v.c), total: Math.round(v.t) }
      })

    // ── COSTO POR TIPO EQUIPO ─────────────────────────────────────
    const tipoCosto: Record<string,number> = {}
    mn.forEach(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      const t = eqD?.tipo || 'Sin tipo'
      if (!tipoCosto[t]) tipoCosto[t] = 0
      tipoCosto[t] += +(m.costo_total||0)
    })
    const costoPorTipoEquipo = Object.entries(tipoCosto)
      .map(([label, costo]) => ({ label, costo: Math.round(costo) }))
      .sort((a,b) => b.costo-a.costo)
      .slice(0, 6)

    // ── EQUIPO MAS COSTOSO ────────────────────────────────────────
    const eqCosto: Record<string,{nombre:string,servicio:string,costo:number}> = {}
    mn.forEach(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      if (!eqD) return
      if (!eqCosto[m.equipo_id]) eqCosto[m.equipo_id] = {nombre:eqD.nombre,servicio:eqD.servicio||'',costo:0}
      eqCosto[m.equipo_id].costo += +(m.costo_total||0)
    })
    const topEquiposCosto = Object.values(eqCosto)
      .sort((a,b) => b.costo-a.costo)
      .slice(0, 8)
      .map(e => ({...e, costo: Math.round(e.costo)}))

    // ── REPUESTOS ─────────────────────────────────────────────────
    const valorInventarioRep = rep.reduce((s,r2)=>s+((r2.costo_unitario||0)*(r2.stock_actual||0)), 0)
    const repBajoMinimo      = rep.filter(r2 => r2.stock_actual <= r2.stock_minimo).length
    const topRepuestos = rep
      .map(r2=>({nombre:r2.nombre,stock:r2.stock_actual,minimo:r2.stock_minimo,costo:r2.costo_unitario||0,valor:Math.round((r2.costo_unitario||0)*(r2.stock_actual||0)),proveedor:r2.proveedor}))
      .sort((a,b)=>b.valor-a.valor)

    // ── CUMPLIMIENTO PM ───────────────────────────────────────────
    const eqCriticos   = eq.filter(e => e.riesgo === 'alto')
    const pmRequeridos = eqCriticos.length * 2
    const pmEjecutados = mn.filter(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      return m.tipo === 'preventivo' && m.estado === 'completado' && eqD?.riesgo === 'alto'
    }).length
    const cumplimientoPM = pmRequeridos > 0 ? Math.min(Math.round((pmEjecutados/pmRequeridos)*100),100) : 100
    const ratioPrevCorr  = correctivos > 0 ? +(preventivos/correctivos).toFixed(1) : null

    // ── POR SERVICIO (disponibilidad) ─────────────────────────────
    const svcMap: Record<string,any> = {}
    eq.forEach(e => {
      const s = e.servicio || 'Sin servicio'
      if (!svcMap[s]) svcMap[s] = {total:0,operativos:0,alto:0}
      svcMap[s].total++
      if (e.estado==='operativo') svcMap[s].operativos++
      if (e.riesgo==='alto') svcMap[s].alto++
    })
    const porServicio = Object.entries(svcMap).map(([label,d]:any)=>({
      label, total:d.total, operativos:d.operativos, alto:d.alto,
      disp: +((d.operativos/d.total)*100).toFixed(0),
    })).sort((a,b)=>b.total-a.total)

    // ── POR MES MANTENIMIENTOS ────────────────────────────────────
    const porMes = Array.from({length:8},(_,i)=>{
      const d2 = new Date(); d2.setMonth(d2.getMonth()-7+i)
      const anio = d2.getFullYear(), mes = d2.getMonth()+1
      const prev2 = mn.filter(x=>{ const f=x.fecha_realizado?new Date(x.fecha_realizado):null; return f&&f.getFullYear()===anio&&f.getMonth()+1===mes&&x.tipo==='preventivo' }).length
      const corr2 = mn.filter(x=>{ const f=x.fecha_realizado?new Date(x.fecha_realizado):null; return f&&f.getFullYear()===anio&&f.getMonth()+1===mes&&x.tipo==='correctivo' }).length
      return { mes: MESES_ES[mes-1]+' '+String(anio).slice(2), prev: prev2, corr: corr2 }
    })

    // ── VIDA UTIL ─────────────────────────────────────────────────
    const VIDA: Record<string,number> = { monitor:8,ventilador:12,desfibrilador:10,bomba:8,incubadora:12,autoclave:12,ecografo:8,rayos:12,electrobisturi:8,glucometro:4,oximetro:6,nebulizador:4,anestesia:12,dialisis:12,cardiotocografo:8,cama:12 }
    function getVU(e:any): number {
      if (e.vida_util_anos) return +e.vida_util_anos
      const n=(e.nombre||'').toLowerCase()
      for (const [k,v] of Object.entries(VIDA)) if (n.includes(k)) return v
      return 8
    }
    const equiposVida = eq.map(e=>{
      const anio = e.anio_adquisicion || anioHoy-3
      const edad = anioHoy - +anio
      const vu = getVU(e)
      const pct = Math.min(Math.round((edad/vu)*100),100)
      const cEq = mn.filter(m=>m.equipo_id===e.id).reduce((s,m)=>s+ +(m.costo_total||0),0)
      const val = +(e.valor_adquisicion||0)
      return {id:e.id,nombre:e.nombre,servicio:e.servicio,pctVida:pct,edad,vidaUtil:vu,costoMant:Math.round(cEq),cmrEq:val>0?+((cEq/val)*100).toFixed(1):null}
    })
    const vidaSaludable   = equiposVida.filter(e=>e.pctVida<60).length
    const vidaAdvertencia = equiposVida.filter(e=>e.pctVida>=60&&e.pctVida<80).length
    const vidaCriticos    = equiposVida.filter(e=>e.pctVida>=80).length
    const topReemplazar   = equiposVida.filter(e=>e.pctVida>=80).sort((a,b)=>b.pctVida-a.pctVida).slice(0,6)

    const conHallazgos  = mn.filter(m=>m.hallazgos&&m.hallazgos.trim()!=='').length
    const tasaHallazgos = completados>0?+((conHallazgos/completados)*100).toFixed(1):0

    // Mantenimientos por servicio (prev vs corr)
    const svcMantMap: Record<string,{prev:number,corr:number}> = {}
    mn.forEach(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      const s = eqD?.servicio || 'Sin servicio'
      if (!svcMantMap[s]) svcMantMap[s] = {prev:0,corr:0}
      if (m.tipo==='preventivo') svcMantMap[s].prev++
      if (m.tipo==='correctivo') svcMantMap[s].corr++
    })
    const mantPorServicio = Object.entries(svcMantMap)
      .map(([label,v]) => ({label, prev:v.prev, corr:v.corr, total:v.prev+v.corr}))
      .sort((a,b) => b.total-a.total).slice(0,8)

    // Top tipos equipo con mas correctivos
    const tipoCorr: Record<string,number> = {}
    mn.filter(m=>m.tipo==='correctivo').forEach(m => {
      const eqD = eq.find(e => e.id === m.equipo_id)
      const t = eqD?.tipo || 'Sin tipo'
      if (!tipoCorr[t]) tipoCorr[t] = 0
      tipoCorr[t]++
    })
    const topCorrectivos = Object.entries(tipoCorr)
      .map(([tipo,corr]) => ({tipo,corr}))
      .sort((a,b) => b.corr-a.corr).slice(0,8)

    return NextResponse.json({
      total,operativos,enMant,fuera,baja,disponibilidad,
      altoRiesgo,medioRiesgo,bajoRiesgo,claseI,claseIIa,claseIIb,claseIII,
      totalMant,preventivos,correctivos,calibraciones,completados,pendientes,vencidos,
      mtbf,mttr,cumplimientoPM,pmRequeridos,pmEjecutados,ratioPrevCorr,
      conHallazgos,tasaHallazgos,mantPorServicio,topCorrectivos,
      // Costos
      costoTotal,costoMO,costoRep,costoPrev,costoCorr,costoCal,costoProm,
      valorParque,cmr,pctCostoPrev,pctCostoCorr,pctCostoCal,pctCostoMO,pctCostoRep,
      costoPorServicio,costoPorMes,costoPorTipoEquipo,topEquiposCosto,
      // Repuestos
      valorInventarioRep:Math.round(valorInventarioRep),repBajoMinimo,topRepuestos,
      // Vida util
      vidaSaludable,vidaAdvertencia,vidaCriticos,topReemplazar,
      // Graficos
      porServicio,porMes,
      porTipo:[
        {label:'Preventivo', value:preventivos, pct:totalMant>0?Math.round((preventivos/totalMant)*100):0},
        {label:'Correctivo', value:correctivos, pct:totalMant>0?Math.round((correctivos/totalMant)*100):0},
        {label:'Calibracion',value:calibraciones,pct:totalMant>0?Math.round((calibraciones/totalMant)*100):0},
      ],
    })
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500})
  }
}
