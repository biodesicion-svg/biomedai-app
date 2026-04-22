'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Download, User } from 'lucide-react'

const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const riesgoColor: Record<string,string> = { alto:'#ef4444', medio:'#f59e0b', bajo:'#10b981' }
const prioridadColor: Record<string,{bg:string;text:string;border:string}> = {
  alta:  {bg:'#ef444415',text:'#f87171',border:'#ef444430'},
  media: {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30'},
  baja:  {bg:'#10b98115',text:'#4ade80',border:'#10b98130'},
}
const tipoColor: Record<string,{bg:string;text:string;border:string}> = {
  preventivo:  {bg:'#16a34a15',text:'#4ade80',border:'#16a34a30'},
  calibracion: {bg:'#f59e0b15',text:'#fcd34d',border:'#f59e0b30'},
  correctivo:  {bg:'#ef444415',text:'#f87171',border:'#ef444430'},
}
const tecnicoColor = ['#2dd4bf','#818cf8','#fb923c']

const COLUMNAS = [
  { id:'pendiente',   label:'Pendientes',  dot:'#94a3b8' },
  { id:'en_proceso',  label:'En Proceso',  dot:'#fcd34d' },
  { id:'en_revision', label:'En Revisión', dot:'#a78bfa' },
  { id:'completado',  label:'Finalizadas', dot:'#4ade80' },
]

export default function OrdenesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mesSel, setMesSel] = useState(new Date().getMonth() + 1)
  const [tecnicoFiltro, setTecnicoFiltro] = useState('todos')
  const [ordenes, setOrdenes] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/mantenimientos')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setData(d)
        setOrdenes(generarOrdenes(d, new Date().getMonth() + 1))
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function generarOrdenes(d: any, mes: number) {
    const items = d?.cronogramaMensual?.[mes] || []
    let counter = 1
    return items.flatMap((item: any) =>
      (item.asignaciones || []).map((asig: any, idx: number) => ({
        id: `OT-${String(mes).padStart(2,'0')}-${String(counter++).padStart(3,'0')}`,
        equipo: item.nombre,
        tipo: item.tipo,
        tecnico: asig.tecnico,
        cantidad: asig.cantidad,
        horas: asig.horas,
        columna: 'pendiente',
        prioridad: item.riesgo==='alto'?'alta':item.riesgo==='medio'?'media':'baja',
        riesgo: item.riesgo,
        progreso: 0,
      }))
    ).sort((a:any,b:any)=>{const p:any={alta:0,media:1,baja:2};return p[a.prioridad]-p[b.prioridad]})
  }

  function cambiarMes(mes: number) {
    setMesSel(mes)
    if (data) setOrdenes(generarOrdenes(data, mes))
  }

  function moverOrden(id: string, col: string) {
    setOrdenes(prev => prev.map(o =>
      o.id===id ? {...o, columna:col, progreso:col==='completado'?100:col==='en_revision'?75:col==='en_proceso'?35:0} : o
    ))
  }

  const ordenesFiltradas = ordenes.filter(o => tecnicoFiltro==='todos' || o.tecnico===tecnicoFiltro)

  if (error) return (
    <div className="flex items-center justify-center min-h-screen" style={{background:'#080e16'}}>
      <div className="p-8 rounded-xl" style={{background:'#0d1626',border:'1px solid #ef444430'}}>
        <p className="text-sm" style={{color:'#f87171'}}>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#080e16'}}>

      {/* Sidebar meses */}
      <div className="w-48 flex-shrink-0 flex flex-col overflow-y-auto"
        style={{background:'#0a1120',borderRight:'1px solid #1e2d3d'}}>
        <div className="px-4 py-4" style={{borderBottom:'1px solid #1e2d3d'}}>
          <div className="text-xs font-bold uppercase tracking-wider" style={{color:'#3d5166'}}>Mes</div>
          <div className="text-sm font-bold mt-0.5" style={{color:'#e2e8f0'}}>2025</div>
        </div>
        <div className="px-3 py-3 flex-1">
          {MESES_LARGO.map((mes,i) => {
            const numMes = i+1
            const resumen = data?.resumenAnual?.[i]
            const esActual = numMes === new Date().getMonth()+1
            const isSelected = mesSel === numMes
            const ocupColor = resumen?.ocupacion>80?'#ef4444':resumen?.ocupacion>50?'#f59e0b':'#10b981'
            return (
              <button key={mes} onClick={()=>cambiarMes(numMes)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all"
                style={{
                  background: isSelected?'#0d948820':'transparent',
                  border: isSelected?'1px solid #0d948840':'1px solid transparent',
                }}>
                <div className="flex items-center gap-1.5">
                  {esActual && <div className="w-1.5 h-1.5 rounded-full" style={{background:'#2dd4bf'}}/>}
                  <span className="text-xs" style={{
                    color: isSelected?'#2dd4bf':'#7a9bb5',
                    fontWeight: isSelected?700:400,
                  }}>{MESES_CORTO[i]}</span>
                </div>
                {resumen && (
                  <span className="text-xs font-mono" style={{color:ocupColor}}>{resumen.ocupacion}%</span>
                )}
              </button>
            )
          })}
        </div>
        {/* Stats */}
        <div className="px-4 py-4 space-y-2" style={{borderTop:'1px solid #1e2d3d'}}>
          <div className="flex justify-between text-xs">
            <span style={{color:'#3d5166'}}>Total órdenes</span>
            <span className="font-bold" style={{color:'#e2e8f0'}}>{ordenes.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{color:'#3d5166'}}>Completadas</span>
            <span className="font-bold" style={{color:'#4ade80'}}>{ordenes.filter(o=>o.columna==='completado').length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{color:'#3d5166'}}>Pendientes</span>
            <span className="font-bold" style={{color:'#94a3b8'}}>{ordenes.filter(o=>o.columna==='pendiente').length}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{borderBottom:'1px solid #1e2d3d',background:'#0a1120'}}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs" style={{color:'#3d5166'}}>BioMed AI</span>
              <span style={{color:'#1e2d3d'}}>/</span>
              <span className="text-xs font-medium" style={{color:'#2dd4bf'}}>Órdenes de Trabajo</span>
            </div>
            <h1 className="text-lg font-bold" style={{color:'#e2e8f0'}}>
              Kanban — {MESES_LARGO[mesSel-1]} 2025
            </h1>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{background:'#1e2d3d',color:'#7a9bb5',border:'1px solid #253447'}}>
            <Download className="w-3.5 h-3.5"/> Exportar
          </button>
        </div>

        {/* Filtro técnico */}
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0"
          style={{borderBottom:'1px solid #1e2d3d'}}>
          <span className="text-xs" style={{color:'#3d5166'}}>Técnico:</span>
          <div className="flex gap-1.5">
            {['todos',...(data?.tecnicos||['Biomédico 1','Biomédico 2','Biomédico 3'])].map((tec:string,i:number)=>(
              <button key={tec} onClick={()=>setTecnicoFiltro(tec)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: tecnicoFiltro===tec?(i===0?'#1e2d3d':tecnicoColor[(i-1)%3]+'25'):'transparent',
                  color: tecnicoFiltro===tec?(i===0?'#e2e8f0':tecnicoColor[(i-1)%3]):'#3d5166',
                  border: `1px solid ${tecnicoFiltro===tec?(i===0?'#334155':tecnicoColor[(i-1)%3]+'40'):'#1e2d3d'}`,
                }}>
                {tec==='todos'?'👥 Todos':tec}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            {COLUMNAS.map(col=>{
              const count = ordenesFiltradas.filter(o=>o.columna===col.id).length
              return (
                <div key={col.id} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{background:col.dot}}/>
                  <span style={{color:'#3d5166'}}>{col.label}:</span>
                  <span className="font-bold" style={{color:'#e2e8f0'}}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full" style={{minWidth:'960px'}}>
            {COLUMNAS.map(col=>{
              const colOrdenes = ordenesFiltradas.filter(o=>o.columna===col.id)
              const sigCol = COLUMNAS[COLUMNAS.findIndex(c=>c.id===col.id)+1]
              const antCol = COLUMNAS[COLUMNAS.findIndex(c=>c.id===col.id)-1]
              return (
                <div key={col.id} className="flex flex-col rounded-xl overflow-hidden"
                  style={{width:'calc(25% - 12px)',minWidth:'220px',background:'#0d1626',border:'1px solid #1e2d3d',flexShrink:0}}>
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                    style={{borderBottom:'1px solid #1e2d3d',background:'#111827'}}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:col.dot}}/>
                      <span className="text-xs font-bold" style={{color:'#e2e8f0'}}>{col.label}</span>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{background:col.dot+'20',color:col.dot}}>
                      {colOrdenes.length}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                      Array.from({length:3}).map((_,i)=>(
                        <div key={i} className="h-32 rounded-lg animate-pulse" style={{background:'#1e2d3d'}}/>
                      ))
                    ) : colOrdenes.length===0 ? (
                      <div className="py-10 text-center">
                        <div className="text-xs" style={{color:'#253447'}}>Sin órdenes</div>
                      </div>
                    ) : colOrdenes.map((o:any)=>{
                      const pc = prioridadColor[o.prioridad]||prioridadColor.baja
                      const tc2 = tipoColor[o.tipo]||tipoColor.preventivo
                      const tIdx = (data?.tecnicos||[]).indexOf(o.tecnico)
                      const tCol = tecnicoColor[tIdx>=0?tIdx:0]
                      return (
                        <div key={o.id} className="rounded-lg p-3 transition-all"
                          style={{background:'#1a2436',border:'1px solid #253447'}}>
                          {/* Header card */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs" style={{color:'#4a6580'}}>{o.id}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded font-semibold capitalize"
                              style={{background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`}}>
                              {o.prioridad}
                            </span>
                          </div>
                          {/* Equipo */}
                          <div className="flex items-start gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                              style={{background:riesgoColor[o.riesgo]}}/>
                            <span className="text-xs font-semibold" style={{color:'#e2e8f0',lineHeight:'1.4'}}>
                              {o.equipo}
                            </span>
                          </div>
                          {/* Tipo */}
                          <span className="text-xs px-1.5 py-0.5 rounded capitalize inline-block mb-2"
                            style={{background:tc2.bg,color:tc2.text,border:`1px solid ${tc2.border}`}}>
                            {o.tipo}
                          </span>
                          {/* Técnico + cantidad */}
                          <div className="flex items-center justify-between pt-2 mb-2"
                            style={{borderTop:'1px solid #253447'}}>
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{background:tCol+'20',color:tCol}}>
                                {o.tecnico.slice(-1)}
                              </div>
                              <span className="text-xs" style={{color:'#4a6580'}}>{o.tecnico.replace('Biomédico ','B')}</span>
                            </div>
                            <span className="text-xs" style={{color:'#4a6580'}}>{o.cantidad}eq · {o.horas}h</span>
                          </div>
                          {/* Progreso */}
                          <div className="h-1 rounded-full mb-2" style={{background:'#253447'}}>
                            <div className="h-1 rounded-full transition-all"
                              style={{width:`${o.progreso}%`,background:col.dot}}/>
                          </div>
                          <div className="text-xs mb-2" style={{color:'#3d5166'}}>{o.progreso}% completado</div>
                          {/* Botones */}
                          <div className="flex gap-1">
                            {antCol && (
                              <button onClick={()=>moverOrden(o.id,antCol.id)}
                                className="flex-1 py-1.5 rounded text-xs transition-all"
                                style={{background:'#253447',color:'#4a6580',border:'1px solid #334155'}}>
                                ← Atrás
                              </button>
                            )}
                            {sigCol && (
                              <button onClick={()=>moverOrden(o.id,sigCol.id)}
                                className="flex-1 py-1.5 rounded text-xs font-semibold transition-all"
                                style={{background:col.dot+'20',color:col.dot,border:`1px solid ${col.dot}35`}}>
                                {sigCol.label} →
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
