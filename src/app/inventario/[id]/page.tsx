'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock, Activity, DollarSign, Calendar, TrendingUp, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const riesgoColor: Record<string,{text:string;bg:string;border:string}> = {
  alto:  {text:'#f87171',bg:'#ef444415',border:'#ef444430'},
  medio: {text:'#fcd34d',bg:'#f59e0b15',border:'#f59e0b30'},
  bajo:  {text:'#4ade80',bg:'#10b98115',border:'#10b98130'},
}
const estadoColor: Record<string,string> = {
  operativo:'#4ade80',mantenimiento:'#fcd34d',fuera_servicio:'#f87171',baja:'#64748b'
}
const tipoColor: Record<string,{bg:string;text:string;dot:string}> = {
  preventivo:  {bg:'#16a34a20',text:'#4ade80',dot:'#4ade80'},
  correctivo:  {bg:'#ef444420',text:'#f87171',dot:'#f87171'},
  calibracion: {bg:'#f59e0b20',text:'#fcd34d',dot:'#fcd34d'},
}

const fmt = (n: number) => {
  if (n>=1_000_000) return `$${(n/1_000_000).toFixed(1)}M`
  if (n>=1_000) return `$${Math.round(n/1_000)}K`
  return `$${Math.round(n)}`
}
const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')} COP`

// Generar historial simulado si no hay datos
function generarHistorialSimulado(equipo: any): any[] {
  const anioInicio = equipo.anio_adquisicion || 2018
  const anioActual = new Date().getFullYear()
  const historial: any[] = []
  const tiposEquipo: Record<string,{freqMeses:number;costoCorr:[number,number];costoPrev:[number,number]}> = {
    'monitor':      {freqMeses:6,  costoCorr:[800000,2500000],  costoPrev:[200000,600000]},
    'ventilador':   {freqMeses:6,  costoCorr:[1500000,4000000], costoPrev:[400000,900000]},
    'desfibrilador':{freqMeses:6,  costoCorr:[1200000,3500000], costoPrev:[300000,800000]},
    'bomba':        {freqMeses:6,  costoCorr:[500000,1800000],  costoPrev:[150000,450000]},
    'incubadora':   {freqMeses:6,  costoCorr:[1800000,5000000], costoPrev:[500000,1200000]},
    'glucometro':   {freqMeses:12, costoCorr:[80000,250000],    costoPrev:[50000,150000]},
    'camilla':      {freqMeses:12, costoCorr:[150000,500000],   costoPrev:[80000,200000]},
    'default':      {freqMeses:12, costoCorr:[200000,800000],   costoPrev:[100000,350000]},
  }
  const nombre = equipo.nombre?.toLowerCase() || ''
  const cfg = Object.entries(tiposEquipo).find(([k])=>nombre.includes(k))?.[1] || tiposEquipo.default
  const rand = (min: number, max: number) => Math.round(min + Math.random()*(max-min))

  let id = 1
  for (let anio = anioInicio; anio <= anioActual; anio++) {
    // Preventivos cada 6 o 12 meses
    const mesesPrev = cfg.freqMeses === 6 ? [1,7] : [1]
    mesesPrev.forEach(mes => {
      if (anio === anioActual && mes > new Date().getMonth()+1) return
      const fecha = new Date(anio, mes-1, rand(1,28))
      historial.push({
        id: `sim-${id++}`,
        tipo: 'preventivo',
        estado: 'completado',
        fecha_programada: fecha.toISOString().split('T')[0],
        fecha_realizado: new Date(fecha.getTime()+rand(1,5)*86400000).toISOString().split('T')[0],
        costo_total: rand(cfg.costoPrev[0], cfg.costoPrev[1]),
        duracion_horas: rand(2,8),
        descripcion: `Mantenimiento preventivo semestral — Revisión general, limpieza, verificación eléctrica y funcional`,
        hallazgos: null,
        simulado: true,
      })
    })
    // Correctivos aleatorios (más si el equipo es viejo o de alto riesgo)
    const probCorr = equipo.riesgo==='alto' ? 0.7 : equipo.riesgo==='medio' ? 0.4 : 0.2
    const numCorr = Math.random() < probCorr ? rand(1,3) : 0
    for (let c=0; c<numCorr; c++) {
      const mes = rand(1,12)
      if (anio === anioActual && mes > new Date().getMonth()+1) continue
      historial.push({
        id: `sim-corr-${id++}`,
        tipo: 'correctivo',
        estado: 'completado',
        fecha_programada: new Date(anio, mes-1, rand(1,28)).toISOString().split('T')[0],
        costo_total: rand(cfg.costoCorr[0], cfg.costoCorr[1]),
        duracion_horas: rand(3,16),
        descripcion: `Mantenimiento correctivo — Falla reportada por usuario. Diagnóstico, reparación y prueba funcional`,
        hallazgos: `Se encontró ${['falla en sensor','daño en cable de paciente','falla en display','problema en batería','error en tarjeta electrónica'][rand(0,4)]}`,
        simulado: true,
      })
    }
  }
  return historial.sort((a,b)=>new Date(b.fecha_programada).getTime()-new Date(a.fecha_programada).getTime())
}

function BarChartCOP({ data, labels, color='#0d9488', height=120 }: any) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{height}}>
      {data.map((v: number, i: number) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t transition-all relative group"
            style={{height:`${(v/max)*100}%`,background:color,opacity:0.8,minHeight:v>0?'4px':'0'}}>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{background:'#1e2d3d',color:'#e2e8f0'}}>
              {fmt(v)}
            </div>
          </div>
          <div style={{fontSize:'9px',color:'#3d5166'}}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data, labels, color='#2dd4bf', height=100 }: any) {
  const max = Math.max(...data, 1)
  const w=400, h=height, padX=10, padY=10
  const getPath = () => data.map((v: number, i: number) => {
    const x = padX+(i/(data.length-1))*(w-padX*2)
    const y = padY+((max-v)/max)*(h-padY*2)
    return `${i===0?'M':'L'} ${x} ${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height}}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${getPath()} L ${padX+(data.length-1)/(data.length-1)*(w-padX*2)} ${h-padY} L ${padX} ${h-padY} Z`} fill="url(#lineGrad)"/>
      <path d={getPath()} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v: number,i: number)=>{
        const x=padX+(i/(data.length-1))*(w-padX*2)
        const y=padY+((max-v)/max)*(h-padY*2)
        return <circle key={i} cx={x} cy={y} r={3} fill={color} stroke="#080e16" strokeWidth={1.5}/>
      })}
    </svg>
  )
}

export default function EquipoDetallePage() {
  const params = useParams()
  const [equipo, setEquipo] = useState<any>(null)
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info'|'historial'|'kpis'|'prediccion'|'costos'>('info')

  useEffect(()=>{
    async function cargar() {
      const supabase = createClient()
      const { data: eq } = await supabase.from('equipos').select('*').eq('id', params.id).single()
      if (eq) setEquipo(eq)
      const { data: mants } = await supabase
        .from('mantenimientos').select('*').eq('equipo_id', params.id)
        .order('fecha_programada',{ascending:false})
      setMantenimientos(mants || [])
      setLoading(false)
    }
    cargar()
  },[params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <Activity className="w-8 h-8 animate-pulse" style={{color:'#2dd4bf'}}/>
    </div>
  )
  if (!equipo) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <AlertTriangle className="w-10 h-10 mb-4" style={{color:'#f59e0b'}}/>
      <p className="text-sm" style={{color:'#7a9bb5'}}>Equipo no encontrado</p>
      <Link href="/inventario" className="mt-4 text-xs" style={{color:'#2dd4bf'}}>← Volver</Link>
    </div>
  )

  // Usar historial real o simulado
  const historialCompleto = mantenimientos.length > 0 ? mantenimientos : generarHistorialSimulado(equipo)
  const esSimulado = mantenimientos.length === 0

  const rc = riesgoColor[equipo.riesgo] || riesgoColor.bajo
  const anioActual = new Date().getFullYear()
  const vidaUtil = equipo.anio_adquisicion ? anioActual - equipo.anio_adquisicion : null
  const vidaRestante = equipo.vida_util_anos && vidaUtil ? equipo.vida_util_anos - vidaUtil : null
  const pctVida = equipo.vida_util_anos && vidaUtil ? Math.min((vidaUtil/equipo.vida_util_anos)*100,100) : 0

  const preventivos  = historialCompleto.filter(m=>m.tipo==='preventivo').length
  const correctivos  = historialCompleto.filter(m=>m.tipo==='correctivo').length
  const calibraciones = historialCompleto.filter(m=>m.tipo==='calibracion').length

  // ── DATOS PARA GRÁFICAS ──
  const anioInicio = equipo.anio_adquisicion || anioActual - 5
  const anios = Array.from({length:anioActual-anioInicio+1},(_,i)=>anioInicio+i)

  // Costos por año
  const costosPorAnio = anios.map(a =>
    historialCompleto
      .filter(m=>m.fecha_programada && new Date(m.fecha_programada).getFullYear()===a)
      .reduce((s:number,m:any)=>s+Number(m.costo_total||0),0)
  )
  const costoTotal = costosPorAnio.reduce((a,b)=>a+b,0)
  const costoPromAnual = anios.length>0 ? costoTotal/anios.length : 0

  // Correctivos por año
  const corrPorAnio = anios.map(a =>
    historialCompleto.filter(m=>m.tipo==='correctivo'&&m.fecha_programada&&new Date(m.fecha_programada).getFullYear()===a).length
  )
  // Preventivos por año
  const prevPorAnio = anios.map(a =>
    historialCompleto.filter(m=>m.tipo==='preventivo'&&m.fecha_programada&&new Date(m.fecha_programada).getFullYear()===a).length
  )

  // Proyección costos próximos 3 años
  const ult3 = costosPorAnio.slice(-3)
  const promUlt3 = ult3.length>0 ? ult3.reduce((a,b)=>a+b,0)/ult3.length : 0
  const proyAnios = [anioActual+1, anioActual+2, anioActual+3]
  const proyecciones = [
    Math.round(promUlt3*1.10),
    Math.round(promUlt3*1.18),
    Math.round(promUlt3*1.28),
  ]

  // Score de riesgo
  const score = Math.min(Math.round(
    (pctVida*0.35) +
    (correctivos>0?(correctivos/Math.max(historialCompleto.length,1))*100*0.35:0) +
    (equipo.riesgo==='alto'?30:equipo.riesgo==='medio'?15:5)
  ),100)
  const alertaNivel = score>=70?'critico':score>=45?'alto':score>=25?'medio':'bajo'
  const alertaColors: Record<string,string> = {critico:'#f87171',alto:'#fcd34d',medio:'#818cf8',bajo:'#4ade80'}
  const alertaLabel: Record<string,string> = {critico:'Crítico',alto:'Alto',medio:'Medio',bajo:'Bajo'}

  // MTTR
  const duraciones = historialCompleto.filter(m=>m.duracion_horas).map(m=>Number(m.duracion_horas))
  const mttr = duraciones.length>0 ? (duraciones.reduce((a,b)=>a+b,0)/duraciones.length).toFixed(1) : '—'

  return (
    <div className="flex flex-col min-h-screen" style={{background:'#080e16'}}>

      {/* Topbar */}
      <div className="px-8 py-5 flex items-center gap-4"
        style={{borderBottom:'1px solid #1e2d3d',background:'#0a1120'}}>
        <Link href="/inventario"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
          <ArrowLeft className="w-3.5 h-3.5"/> Inventario
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono" style={{color:'#4a6580'}}>{equipo.codigo_inventario}</span>
            {esSimulado && (
              <span className="text-xs px-2 py-0.5 rounded" style={{background:'#818cf820',color:'#818cf8',border:'1px solid #818cf830'}}>
                Historial simulado
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>{equipo.nombre}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{background:rc.bg,color:rc.text,border:`1px solid ${rc.border}`}}>
            <div className="w-1.5 h-1.5 rounded-full" style={{background:rc.text}}/>
            Riesgo {equipo.riesgo}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{background:'#1e2d3d',color:estadoColor[equipo.estado]||'#7a9bb5'}}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:estadoColor[equipo.estado]||'#7a9bb5'}}/>
            {equipo.estado?.replace('_',' ')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-3"
        style={{borderBottom:'1px solid #1e2d3d',background:'#0a1120'}}>
        {[
          {id:'info',      label:'📋 Información'},
          {id:'historial', label:'📅 Historial'},
          {id:'costos',    label:'💰 Costos'},
          {id:'prediccion',label:'🔮 Predicción'},
          {id:'kpis',      label:'📊 KPIs'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:tab===t.id?'#0d948820':'transparent',
              color:tab===t.id?'#2dd4bf':'#3d5166',
              border:tab===t.id?'1px solid #0d948840':'1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-8 py-6 overflow-y-auto">

        {/* ── INFO ── */}
        {tab==='info' && (
          <div className="grid grid-cols-3 gap-5 max-w-5xl">
            <div className="col-span-2 space-y-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'#3d5166'}}>Datos del equipo</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Nombre',equipo.nombre],['Tipo',equipo.tipo],
                    ['Marca',equipo.marca||'—'],['Modelo',equipo.modelo||'—'],
                    ['Serie',equipo.serie||'—'],['Código',equipo.codigo_inventario],
                    ['Clase INVIMA',equipo.clase_invima||'—'],['Servicio',equipo.servicio||'—'],
                    ['Ubicación',equipo.ubicacion||'—'],['Estado',equipo.estado?.replace('_',' ')||'—'],
                  ].map(([k,v])=>(
                    <div key={k}>
                      <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{k}</div>
                      <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'#3d5166'}}>Adquisición</div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ['Fecha de compra', equipo.anio_adquisicion ? `${equipo.anio_adquisicion}` : '—'],
                    ['Año fabricación', equipo.anio_fabricacion||'—'],
                    ['Vida útil estimada', equipo.vida_util_anos?`${equipo.vida_util_anos} años`:'—'],
                  ].map(([k,v])=>(
                    <div key={k}>
                      <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>{k}</div>
                      <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{v}</div>
                    </div>
                  ))}
                </div>
                {equipo.valor_adquisicion && (
                  <div className="mt-4 pt-4" style={{borderTop:'1px solid #1e2d3d'}}>
                    <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>Valor de adquisición</div>
                    <div className="text-xl font-bold" style={{color:'#2dd4bf'}}>{fmtCOP(equipo.valor_adquisicion)}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {equipo.vida_util_anos && (
                <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#3d5166'}}>Vida útil</div>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{color:'#7a9bb5'}}>{vidaUtil} años en uso</span>
                    <span style={{color:pctVida>80?'#f87171':'#fcd34d'}}>{Math.round(pctVida)}%</span>
                  </div>
                  <div className="h-3 rounded-full mb-3" style={{background:'#1e2d3d'}}>
                    <div className="h-3 rounded-full" style={{width:`${pctVida}%`,background:pctVida>80?'#ef4444':pctVida>50?'#f59e0b':'#10b981'}}/>
                  </div>
                  <div className="text-sm font-bold" style={{color:vidaRestante&&vidaRestante<2?'#f87171':'#4ade80'}}>
                    {vidaRestante!==null?vidaRestante>0?`${vidaRestante} años restantes`:'Vida útil vencida':'—'}
                  </div>
                </div>
              )}
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#3d5166'}}>Resumen intervenciones</div>
                {[
                  {l:'Total',v:historialCompleto.length,c:'#e2e8f0'},
                  {l:'Preventivos',v:preventivos,c:'#4ade80'},
                  {l:'Correctivos',v:correctivos,c:'#f87171'},
                  {l:'Calibraciones',v:calibraciones,c:'#fcd34d'},
                ].map(s=>(
                  <div key={s.l} className="flex justify-between items-center py-2" style={{borderBottom:'1px dashed #1e2d3d'}}>
                    <span className="text-xs" style={{color:'#3d5166'}}>{s.l}</span>
                    <span className="text-sm font-bold" style={{color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab==='historial' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{color:'#e2e8f0'}}>Línea de tiempo de intervenciones</h2>
                <p className="text-xs mt-0.5" style={{color:'#3d5166'}}>
                  {historialCompleto.length} intervenciones · {anioInicio} — {anioActual}
                  {esSimulado && <span style={{color:'#818cf8'}}> · Historial generado por IA</span>}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5"
                style={{background:'linear-gradient(to bottom,#0d9488,#1e2d3d)'}}/>
              <div className="space-y-0">
                {historialCompleto.map((m,i)=>{
                  const tc = tipoColor[m.tipo]||tipoColor.preventivo
                  const fecha = m.fecha_programada
                    ? new Date(m.fecha_programada).toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'numeric'})
                    : '—'
                  return (
                    <div key={m.id||i} className="relative flex gap-5 pb-5">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{background:m.estado==='completado'?'#0d9488':'#1e2d3d',border:`2px solid ${m.estado==='completado'?'#0d9488':'#253447'}`}}>
                          {m.estado==='completado'
                            ? <CheckCircle className="w-4 h-4 text-white"/>
                            : <Clock className="w-4 h-4" style={{color:'#fcd34d'}}/>}
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl p-4" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded capitalize"
                              style={{background:tc.bg,color:tc.text}}>{m.tipo}</span>
                            <span className="text-xs" style={{color:'#3d5166'}}>{fecha}</span>
                            {m.simulado && <span className="text-xs px-1.5 py-0.5 rounded" style={{background:'#818cf815',color:'#818cf8'}}>Simulado</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            {m.duracion_horas && <span style={{color:'#3d5166'}}><Clock className="w-3 h-3 inline mr-0.5"/>{m.duracion_horas}h</span>}
                            {m.costo_total && Number(m.costo_total)>0 && (
                              <span className="font-bold" style={{color:'#2dd4bf'}}>{fmtCOP(Number(m.costo_total))}</span>
                            )}
                          </div>
                        </div>
                        {m.descripcion && <p className="text-xs leading-relaxed mb-2" style={{color:'#7a9bb5'}}>{String(m.descripcion).replace(/&#x0D;/g,'').replace(/\n/g,' ').substring(0,150)}</p>}
                        {m.hallazgos && <div className="text-xs px-2 py-1.5 rounded" style={{background:'#f59e0b10',color:'#fcd34d',border:'1px solid #f59e0b20'}}>⚠ {m.hallazgos}</div>}
                      </div>
                    </div>
                  )
                })}
                {equipo.anio_adquisicion && (
                  <div className="relative flex gap-5">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{background:'#0d948820',border:'2px solid #0d9488'}}>
                        <Calendar className="w-4 h-4" style={{color:'#2dd4bf'}}/>
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl p-4" style={{background:'#0d1626',border:'1px solid #0d948830'}}>
                      <div className="text-xs font-bold mb-1" style={{color:'#2dd4bf'}}>Adquisición del equipo</div>
                      <p className="text-xs" style={{color:'#3d5166'}}>
                        {equipo.nombre} — {equipo.marca} {equipo.modelo}
                        {equipo.valor_adquisicion && ` · ${fmtCOP(Number(equipo.valor_adquisicion))}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── COSTOS ── */}
        {tab==='costos' && (
          <div className="max-w-4xl space-y-5">
            {/* KPIs costo */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {l:'Costo total histórico', v:fmtCOP(costoTotal), c:'#2dd4bf'},
                {l:'Promedio anual', v:fmtCOP(costoPromAnual), c:'#818cf8'},
                {l:'Costo preventivos', v:fmtCOP(historialCompleto.filter(m=>m.tipo==='preventivo').reduce((a:number,m:any)=>a+Number(m.costo_total||0),0)), c:'#4ade80'},
                {l:'Costo correctivos', v:fmtCOP(historialCompleto.filter(m=>m.tipo==='correctivo').reduce((a:number,m:any)=>a+Number(m.costo_total||0),0)), c:'#f87171'},
              ].map(k=>(
                <div key={k.l} className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                  <div className="text-base font-bold mb-1" style={{color:k.c}}>{k.v}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Gráfica costos por año */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Costos de Mantenimiento por Año — COP</div>
              <div className="text-xs mb-4" style={{color:'#3d5166'}}>
                Histórico {anioInicio}–{anioActual} · Total acumulado: {fmtCOP(costoTotal)}
              </div>
              <BarChartCOP data={costosPorAnio} labels={anios.map(String)} color="#2dd4bf" height={150}/>
            </div>

            {/* Proyección costos */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Proyección de Costos 2026–2028 — COP</div>
              <div className="text-xs mb-4" style={{color:'#3d5166'}}>
                Estimación basada en tendencia histórica · Incluye +10/18/28% por inflación y envejecimiento
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {proyAnios.map((a,i)=>(
                  <div key={a} className="rounded-xl p-4 text-center" style={{background:'#111827',border:'1px solid #1e2d3d'}}>
                    <div className="text-xs mb-1" style={{color:'#3d5166'}}>{a}</div>
                    <div className="text-lg font-bold" style={{color:'#818cf8'}}>{fmt(proyecciones[i])}</div>
                    <div className="text-xs mt-0.5" style={{color:'#3d5166'}}>{fmtCOP(proyecciones[i])}</div>
                    <div className="text-xs mt-1" style={{color:i===0?'#fcd34d':i===1?'#fb923c':'#f87171'}}>
                      +{[10,18,28][i]}% vs actual
                    </div>
                  </div>
                ))}
              </div>
              <BarChartCOP
                data={[...costosPorAnio.slice(-3), ...proyecciones]}
                labels={[...anios.slice(-3).map(String), ...proyAnios.map(String)]}
                color="#818cf8" height={120}/>
              <div className="mt-3 flex items-center gap-2 text-xs" style={{color:'#3d5166'}}>
                <div className="w-3 h-3 rounded-sm" style={{background:'#818cf8'}}/>
                <span>Barras pálidas = proyección · Barras sólidas = histórico</span>
              </div>
            </div>

            {/* Desglose por tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-4" style={{color:'#e2e8f0'}}>Correctivos por Año</div>
                <BarChartCOP data={corrPorAnio} labels={anios.map(String)} color="#f87171" height={110}/>
              </div>
              <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                <div className="text-sm font-bold mb-4" style={{color:'#e2e8f0'}}>Preventivos por Año</div>
                <BarChartCOP data={prevPorAnio} labels={anios.map(String)} color="#4ade80" height={110}/>
              </div>
            </div>
          </div>
        )}

        {/* ── PREDICCIÓN ── */}
        {tab==='prediccion' && (
          <div className="max-w-4xl space-y-5">
            {/* Score */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:`1px solid ${alertaColors[alertaNivel]}30`}}>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0"
                  style={{background:`${alertaColors[alertaNivel]}15`,border:`2px solid ${alertaColors[alertaNivel]}`,color:alertaColors[alertaNivel]}}>
                  {score}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-black mb-1" style={{color:alertaColors[alertaNivel]}}>
                    Riesgo {alertaLabel[alertaNivel]}
                  </div>
                  <div className="text-xs mb-3" style={{color:'#3d5166'}}>Score de riesgo de falla · 0 = mínimo · 100 = crítico</div>
                  <div className="space-y-1.5">
                    {[
                      {l:'Vida útil consumida',v:Math.round(pctVida*0.35),max:35,c:pctVida>=80?'#f87171':'#4ade80'},
                      {l:'Ratio correctivos',v:Math.round(correctivos/Math.max(historialCompleto.length,1)*100*0.35),max:35,c:correctivos>3?'#f87171':'#4ade80'},
                      {l:'Clase de riesgo INVIMA',v:equipo.riesgo==='alto'?30:equipo.riesgo==='medio'?15:5,max:30,c:equipo.riesgo==='alto'?'#f87171':'#fcd34d'},
                    ].map(f=>(
                      <div key={f.l} className="flex items-center gap-3">
                        <div className="text-xs w-44" style={{color:'#3d5166'}}>{f.l}</div>
                        <div className="flex-1 h-2 rounded-full" style={{background:'#1e2d3d'}}>
                          <div className="h-2 rounded-full" style={{width:`${(f.v/f.max)*100}%`,background:f.c}}/>
                        </div>
                        <div className="text-xs font-mono w-8 text-right" style={{color:f.c}}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs mb-1" style={{color:'#3d5166'}}>Prob. falla 90 días</div>
                  <div className="text-3xl font-black" style={{color:alertaColors[alertaNivel]}}>{Math.min(Math.round(score*0.85),95)}%</div>
                  <div className="text-xs mt-1" style={{color:'#3d5166'}}>
                    Falla est.: {new Date(Date.now()+Math.max(30,Math.round((100-score)*2.5))*86400000).toLocaleDateString('es-CO',{month:'short',day:'numeric',year:'numeric'})}
                  </div>
                </div>
              </div>
            </div>

            {/* Vida útil visual */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="text-sm font-bold mb-3" style={{color:'#e2e8f0'}}>Vida útil consumida vs restante</div>
              <div className="flex justify-between text-xs mb-2">
                <span style={{color:'#3d5166'}}>{vidaUtil} años en servicio</span>
                <span style={{color:pctVida>=80?'#f87171':'#4ade80'}}>{Math.round(pctVida)}% consumido</span>
              </div>
              <div className="h-6 rounded-xl overflow-hidden" style={{background:'#1e2d3d'}}>
                <div className="h-6 rounded-xl flex items-center px-3 transition-all"
                  style={{
                    width:`${pctVida}%`,
                    background:pctVida>=80?'linear-gradient(90deg,#f59e0b,#ef4444)':pctVida>=60?'linear-gradient(90deg,#fcd34d,#f59e0b)':'linear-gradient(90deg,#10b981,#4ade80)',
                    minWidth:'40px'
                  }}>
                  <span className="text-white text-xs font-bold">{vidaUtil}a usados</span>
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span style={{color:'#3d5166'}}>Adquisición: {equipo.anio_adquisicion||'—'}</span>
                <span style={{color:vidaRestante!==null&&vidaRestante<=2?'#f87171':'#3d5166'}}>
                  {vidaRestante!==null?vidaRestante>0?`Quedan ${vidaRestante} años`:'⚠ Vida útil vencida':'—'}
                </span>
                <span style={{color:'#3d5166'}}>Fin: {equipo.anio_adquisicion&&equipo.vida_util_anos?equipo.anio_adquisicion+equipo.vida_util_anos:'—'}</span>
              </div>
            </div>

            {/* Tendencia correctivos + proyección */}
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="text-sm font-bold mb-1" style={{color:'#e2e8f0'}}>Tendencia de Fallas — Histórico vs Proyección</div>
              <div className="text-xs mb-4" style={{color:'#3d5166'}}>
                Correctivos por año · Proyección 2026–2028 sin plan preventivo
              </div>
              <BarChartCOP
                data={[...corrPorAnio, ...proyAnios.map((_,i)=>Math.round((corrPorAnio.slice(-1)[0]||0)*([1.2,1.4,1.6][i])))] }
                labels={[...anios.map(String),...proyAnios.map(String)]}
                color="#f87171" height={130}/>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {proyAnios.map((a,i)=>(
                  <div key={a} className="rounded-lg p-3 text-center" style={{background:'#111827'}}>
                    <div className="text-xs mb-0.5" style={{color:'#3d5166'}}>Correctivos est. {a}</div>
                    <div className="text-lg font-bold" style={{color:'#f87171'}}>
                      {Math.round((corrPorAnio.slice(-1)[0]||0)*([1.2,1.4,1.6][i]))}
                    </div>
                    <div className="text-xs" style={{color:'#3d5166'}}>fallas estimadas</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendación */}
            <div className="rounded-xl p-5" style={{
              background:`${alertaColors[alertaNivel]}10`,
              border:`1px solid ${alertaColors[alertaNivel]}30`
            }}>
              <div className="text-sm font-bold mb-2" style={{color:alertaColors[alertaNivel]}}>
                💡 Recomendación técnica
              </div>
              <p className="text-sm leading-relaxed" style={{color:'#7a9bb5'}}>
                {alertaNivel==='critico'
                  ? `Este equipo presenta riesgo crítico de falla. Se recomienda intervención técnica inmediata, revisión completa de componentes y evaluación para reemplazo. Costo estimado de no intervenir: ${fmtCOP(proyecciones[0])}/año en correctivos.`
                  : alertaNivel==='alto'
                  ? `El equipo muestra indicadores de deterioro acelerado. Programar mantenimiento preventivo completo en los próximos 30 días y asegurar disponibilidad de repuestos críticos.`
                  : alertaNivel==='medio'
                  ? `Mantener el plan de mantenimiento preventivo actual. Monitorear mensualmente los indicadores de funcionamiento y documentar cualquier anomalía.`
                  : `El equipo se encuentra en buen estado predictivo. Continuar con el cronograma de mantenimiento preventivo establecido para mantener este nivel de desempeño.`
                }
              </p>
              {equipo.vida_util_anos && vidaRestante!==null && vidaRestante<=3 && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{background:'#ef444415',color:'#fca5a5',border:'1px solid #ef444430'}}>
                  ⚠ Considerar presupuesto para reemplazo: el equipo vence su vida útil en {vidaRestante<=0?'este año':`${vidaRestante} año(s)`}.
                  Valor estimado de reemplazo: {equipo.valor_adquisicion?fmtCOP(Number(equipo.valor_adquisicion)*1.4):'consultar con proveedor'}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── KPIS ── */}
        {tab==='kpis' && (
          <div className="max-w-3xl">
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                {l:'Disponibilidad',v:equipo.estado==='operativo'?'Operativo':'No disponible',c:equipo.estado==='operativo'?'#4ade80':'#f87171',sub:'Estado actual'},
                {l:'Total intervenciones',v:historialCompleto.length,c:'#2dd4bf',sub:'Historial completo'},
                {l:'Ratio Prev/Corr',v:correctivos>0?(preventivos/correctivos).toFixed(1):'N/D',c:correctivos>0&&(preventivos/correctivos)>=0.8?'#4ade80':'#f59e0b',sub:'Meta ≥ 0.80'},
                {l:'MTTR promedio',v:`${mttr}h`,c:'#818cf8',sub:'Tiempo medio reparación'},
                {l:'Años en servicio',v:vidaUtil!==null?`${vidaUtil} años`:'—',c:'#fb923c',sub:`De ${equipo.vida_util_anos||'?'} años útiles`},
                {l:'Costo total COP',v:fmt(costoTotal),c:'#fcd34d',sub:fmtCOP(costoTotal)},
              ].map(k=>(
                <div key={k.l} className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
                  <div className="text-2xl font-bold mb-1" style={{color:k.c}}>{k.v}</div>
                  <div className="text-xs font-bold mb-0.5" style={{color:'#7a9bb5'}}>{k.l}</div>
                  <div className="text-xs" style={{color:'#3d5166'}}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{background:'#0d1626',border:'1px solid #1e2d3d'}}>
              <div className="text-sm font-bold mb-4" style={{color:'#e2e8f0'}}>Evolución de costos — COP</div>
              <LineChart data={costosPorAnio} labels={anios.map(String)} color="#2dd4bf" height={120}/>
              <div className="flex justify-between text-xs mt-2" style={{color:'#3d5166'}}>
                {anios.map(a=><span key={a}>{a}</span>)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
