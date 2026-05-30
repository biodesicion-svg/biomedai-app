'use client'
import { useState, useEffect } from 'react'

const RESULTADO_STYLE: Record<string,{bg:string;text:string;border:string;label:string;icon:string}> = {
  cumple:    {bg:'#F0FDF4',text:'#16A34A',border:'#BBF7D0',label:'Cumple',       icon:'ti-check'},
  parcial:   {bg:'#FFFBEB',text:'#D97706',border:'#FDE68A',label:'Parcial',      icon:'ti-alert-triangle'},
  no_cumple: {bg:'#FEF2F2',text:'#DC2626',border:'#FECACA',label:'No cumple',    icon:'ti-x'},
}
const IMPACTO_STYLE: Record<string,{bg:string;text:string;label:string}> = {
  critico: {bg:'#FEF2F2',text:'#DC2626',label:'Crítico'},
  alto:    {bg:'#FFFBEB',text:'#D97706',label:'Alto'},
  medio:   {bg:'#EEF2FF',text:'#3B4FE8',label:'Medio'},
}

function ScoreCircle({ score, size=120 }: {score:number;size?:number}) {
  const color = score>=80?'#16A34A':score>=60?'#D97706':'#DC2626'
  const label = score>=80?'Aprobado':score>=60?'Con observaciones':'No aprobado'
  const r=size*0.4, c=2*Math.PI*r, d=(score/100)*c
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F4F4F5" strokeWidth={size*0.09}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
          strokeDasharray={`${d} ${c-d}`} strokeLinecap="round"/>
      </svg>
      <div style={{textAlign:'center',position:'relative',zIndex:1}}>
        <div style={{fontSize:size*0.22,fontWeight:700,color,lineHeight:1}}>{score}%</div>
        <div style={{fontSize:size*0.09,color:'#A1A1AA',lineHeight:1.3}}>{label}</div>
      </div>
    </div>
  )
}

export default function AuditoriaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'resumen'|'detalle'|'plan'>('resumen')
  const [catSel, setCatSel] = useState<string|null>(null)
  const [expandidos, setExpandidos] = useState<Record<number,boolean>>({})

  useEffect(()=>{
    fetch('/api/auditoria-inteligente')
      .then(r=>r.json())
      .then(d=>{setData(d);setLoading(false)})
      .catch(()=>setLoading(false))
  },[])

  const fecha = data?.fecha ? new Date(data.fecha).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'
  const criteriosFiltrados = catSel ? data?.criterios?.filter((c:any)=>c.categoria===catSel) : data?.criterios

  const Sk = ({h=16,w='100%'}:any) => <div style={{height:h,width:w,background:'#F4F4F5',borderRadius:4}}/>

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#fff'}}>
      <style>{`@media print{.no-print{display:none!important}body{background:#fff}}`}</style>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}} className="no-print">
        <div>
          <div style={{fontSize:11,color:'#A1A1AA',marginBottom:2}}>BioMed AI / Calidad / Auditoría</div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#18181B',margin:0}}>Auditoría inteligente del sistema</h1>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {!loading&&<div style={{fontSize:11,color:'#A1A1AA'}}>Analizado: {fecha}</div>}
          <button onClick={()=>{setLoading(true);fetch('/api/auditoria-inteligente').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})}}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:'#52525B',cursor:'pointer',fontSize:12,fontWeight:500}}>
            <i className="ti ti-refresh" style={{fontSize:14}}/> Reanalizar
          </button>
          <button onClick={()=>window.print()}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:'none',background:'#3B4FE8',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:500}}>
            <i className="ti ti-download" style={{fontSize:14}}/> Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'0.5px solid #E4E4E7',background:'#fff',paddingLeft:28}} className="no-print">
        {[{id:'resumen',l:'Resumen ejecutivo'},{id:'detalle',l:'Análisis detallado'},{id:'plan',l:'Plan de mejora'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===t.id?'#3B4FE8':'transparent'}`,background:'transparent',color:tab===t.id?'#3B4FE8':'#71717A',fontSize:13,fontWeight:tab===t.id?500:400,cursor:'pointer'}}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:'24px 28px',overflowY:'auto'}}>

        {/* ── RESUMEN EJECUTIVO ── */}
        {tab==='resumen'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:1000}}>

            {/* Score global */}
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',padding:'24px',display:'flex',gap:24,alignItems:'center'}}>
              {loading?<div style={{width:120,height:120,borderRadius:'50%',background:'#F4F4F5'}}/>:<ScoreCircle score={data?.scoreGlobal||0} size={120}/>}
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:600,color:'#18181B',marginBottom:4}}>Resultado de auditoría del sistema</div>
                <div style={{fontSize:13,color:'#71717A',marginBottom:14}}>Análisis automático basado en {data?.totalCriterios||0} criterios de la normativa colombiana</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                  {loading?Array.from({length:4}).map((_,i)=><Sk key={i} h={52}/>):[
                    {l:'Criterios evaluados',v:data?.totalCriterios,c:'#18181B'},
                    {l:'Cumple',v:data?.cumple,c:'#16A34A'},
                    {l:'Parcial',v:data?.parcial,c:'#D97706'},
                    {l:'No cumple',v:data?.noCumple,c:'#DC2626'},
                  ].map(s=>(
                    <div key={s.l} style={{padding:'10px 14px',borderRadius:8,background:'#F8F9FA',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Datos analizados */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {loading?Array.from({length:4}).map((_,i)=><Sk key={i} h={72}/>):[
                {l:'Equipos analizados',v:data?.resumen?.equipos?.toLocaleString('es-CO'),c:'#3B4FE8',icon:'ti-device-heart-monitor'},
                {l:'Mantenimientos',v:data?.resumen?.mantenimientos?.toLocaleString('es-CO'),c:'#7C3AED',icon:'ti-tool'},
                {l:'Repuestos',v:data?.resumen?.repuestos,c:'#D97706',icon:'ti-package'},
                {l:'Cumplimiento preventivo',v:`${data?.resumen?.pctCumplimiento}%`,c:data?.resumen?.pctCumplimiento>=80?'#16A34A':'#DC2626',icon:'ti-check'},
              ].map(s=>(
                <div key={s.l} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:11,color:'#71717A'}}>{s.l}</span>
                    <i className={'ti '+s.icon} style={{fontSize:16,color:s.c}}/>
                  </div>
                  <div style={{fontSize:22,fontWeight:600,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Por categoría */}
            <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'0.5px solid #F4F4F5'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#18181B'}}>Cumplimiento por categoría</div>
                <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>Haz clic en una categoría para ver el detalle</div>
              </div>
              {loading?<div style={{padding:20}}><Sk h={120}/></div>:(data?.categorias||[]).map((cat:any,i:number)=>{
                const rs=RESULTADO_STYLE[cat.estado]||RESULTADO_STYLE.no_cumple
                return (
                  <div key={i} onClick={()=>{setCatSel(cat.categoria===catSel?null:cat.categoria);setTab('detalle')}}
                    style={{padding:'14px 20px',borderBottom:'0.5px solid #F8F9FA',cursor:'pointer',transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:8,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <i className={'ti '+rs.icon} style={{fontSize:16,color:rs.text}}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{cat.categoria}</span>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            <span style={{fontSize:11,color:'#A1A1AA'}}>{cat.criterios} criterios</span>
                            <span style={{fontSize:11,fontWeight:600,color:cat.score>=80?'#16A34A':cat.score>=60?'#D97706':'#DC2626'}}>{cat.score}%</span>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                          </div>
                        </div>
                        <div style={{height:6,background:'#F4F4F5',borderRadius:3}}>
                          <div style={{height:6,borderRadius:3,width:`${cat.score}%`,background:cat.score>=80?'#22C55E':cat.score>=60?'#F59E0B':'#EF4444',transition:'width 1s'}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* ── ANÁLISIS DETALLADO ── */}
        {tab==='detalle'&&(
          <div style={{maxWidth:1000}}>
            {/* Filtro categorías */}
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <button onClick={()=>setCatSel(null)} style={{padding:'5px 12px',borderRadius:20,border:`0.5px solid ${!catSel?'#3B4FE8':'#E4E4E7'}`,background:!catSel?'#EEF2FF':'#fff',color:!catSel?'#3B4FE8':'#71717A',fontSize:11,cursor:'pointer',fontWeight:!catSel?500:400}}>
                Todas
              </button>
              {(data?.categorias||[]).map((cat:any)=>(
                <button key={cat.categoria} onClick={()=>setCatSel(cat.categoria===catSel?null:cat.categoria)}
                  style={{padding:'5px 12px',borderRadius:20,border:`0.5px solid ${catSel===cat.categoria?'#3B4FE8':'#E4E4E7'}`,background:catSel===cat.categoria?'#EEF2FF':'#fff',color:catSel===cat.categoria?'#3B4FE8':'#71717A',fontSize:11,cursor:'pointer',fontWeight:catSel===cat.categoria?500:400}}>
                  {cat.categoria}
                </button>
              ))}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {loading?Array.from({length:5}).map((_,i)=><Sk key={i} h={80}/>):(criteriosFiltrados||[]).map((c:any,i:number)=>{
                const rs=RESULTADO_STYLE[c.resultado]||RESULTADO_STYLE.no_cumple
                const imp=IMPACTO_STYLE[c.impacto]||IMPACTO_STYLE.medio
                const exp=expandidos[i]
                return (
                  <div key={i} style={{background:'#fff',borderRadius:10,border:`0.5px solid ${c.resultado==='no_cumple'?'#FECACA':c.resultado==='parcial'?'#FDE68A':'#E4E4E7'}`,overflow:'hidden'}}>
                    <div onClick={()=>setExpandidos(p=>({...p,[i]:!p[i]}))}
                      style={{padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}}>
                      <div style={{width:34,height:34,borderRadius:8,background:rs.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        <i className={'ti '+rs.icon} style={{fontSize:17,color:rs.text}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{c.criterio}</span>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:imp.bg,color:imp.text,fontWeight:500}}>{imp.label}</span>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F8F9FA',color:'#71717A'}}>{c.normativa}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{flex:1,height:5,background:'#F4F4F5',borderRadius:3,maxWidth:200}}>
                            <div style={{height:5,borderRadius:3,width:`${c.puntaje}%`,background:rs.text}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:600,color:rs.text}}>{c.puntaje}%</span>
                          <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                        </div>
                      </div>
                      <i className={'ti '+(exp?'ti-chevron-up':'ti-chevron-down')} style={{fontSize:14,color:'#A1A1AA',flexShrink:0}}/>
                    </div>

                    {exp&&(
                      <div style={{borderTop:'0.5px solid #F4F4F5',padding:'14px 18px',background:'#FAFAFA',display:'flex',flexDirection:'column',gap:10}}>
                        <div style={{padding:'10px 14px',borderRadius:8,background:rs.bg,border:`0.5px solid ${rs.border}`}}>
                          <div style={{fontSize:11,fontWeight:500,color:rs.text,marginBottom:4}}>📋 Hallazgo</div>
                          <div style={{fontSize:12,color:'#52525B',lineHeight:1.6}}>{c.hallazgo}</div>
                        </div>
                        {c.mejora&&(
                          <div style={{padding:'10px 14px',borderRadius:8,background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                            <div style={{fontSize:11,fontWeight:500,color:'#3B4FE8',marginBottom:4}}>💡 Acción de mejora recomendada</div>
                            <div style={{fontSize:12,color:'#3F3F46',lineHeight:1.6}}>{c.mejora}</div>
                          </div>
                        )}
                        {c.datos&&(
                          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            {Object.entries(c.datos).map(([k,v]:any)=>(
                              <div key={k} style={{padding:'6px 12px',borderRadius:6,background:'#fff',border:'0.5px solid #E4E4E7',fontSize:11}}>
                                <span style={{color:'#A1A1AA',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}: </span>
                                <span style={{fontWeight:500,color:'#18181B'}}>{typeof v==='number'?v.toLocaleString('es-CO'):v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{fontSize:11,color:'#A1A1AA',display:'flex',alignItems:'center',gap:4}}>
                          <i className="ti ti-file-certificate" style={{fontSize:12}}/> Categoría: {c.categoria}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PLAN DE MEJORA ── */}
        {tab==='plan'&&(
          <div style={{maxWidth:900}}>
            <div style={{padding:'14px 18px',borderRadius:10,background:'#EEF2FF',border:'0.5px solid #C7D2FE',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
              <i className="ti ti-info-circle" style={{fontSize:16,color:'#3B4FE8',flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:13,color:'#3B4FE8'}}>
                Plan de mejora generado automáticamente basado en los hallazgos de la auditoría. 
                <strong> {data?.noCumple} no conformidades</strong> y <strong>{data?.parcial} ítems parciales</strong> requieren acción.
              </div>
            </div>

            {loading?<Sk h={200}/>:(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  ...(data?.criterios||[]).filter((c:any)=>c.resultado==='no_cumple'),
                  ...(data?.criterios||[]).filter((c:any)=>c.resultado==='parcial'),
                ].filter((c:any)=>c.mejora).map((c:any,i:number)=>{
                  const rs=RESULTADO_STYLE[c.resultado]
                  const imp=IMPACTO_STYLE[c.impacto]||IMPACTO_STYLE.medio
                  const plazo=c.impacto==='critico'?'Inmediato (≤ 7 días)':c.impacto==='alto'?'Corto plazo (≤ 30 días)':'Mediano plazo (≤ 90 días)'
                  const plazoColor=c.impacto==='critico'?'#DC2626':c.impacto==='alto'?'#D97706':'#3B4FE8'
                  return (
                    <div key={i} style={{background:'#fff',borderRadius:10,border:'0.5px solid #E4E4E7',overflow:'hidden'}}>
                      <div style={{padding:'14px 18px',borderBottom:'0.5px solid #F4F4F5',display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#3B4FE8',flexShrink:0}}>{i+1}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:500,color:'#18181B',marginBottom:3}}>{c.criterio}</div>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:rs.bg,color:rs.text,border:`0.5px solid ${rs.border}`,fontWeight:500}}>{rs.label}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:imp.bg,color:imp.text,fontWeight:500}}>{imp.label}</span>
                            <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#F8F9FA',color:'#71717A'}}>{c.normativa}</span>
                          </div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:10,color:'#A1A1AA'}}>Plazo</div>
                          <div style={{fontSize:11,fontWeight:600,color:plazoColor}}>{plazo}</div>
                        </div>
                      </div>
                      <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:8}}>
                        <div style={{padding:'8px 12px',borderRadius:7,background:'#FEF2F2',border:'0.5px solid #FECACA'}}>
                          <div style={{fontSize:11,fontWeight:500,color:'#DC2626',marginBottom:3}}>Hallazgo</div>
                          <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.hallazgo}</div>
                        </div>
                        <div style={{padding:'8px 12px',borderRadius:7,background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                          <div style={{fontSize:11,fontWeight:500,color:'#16A34A',marginBottom:3}}>Acción de mejora</div>
                          <div style={{fontSize:12,color:'#52525B',lineHeight:1.5}}>{c.mejora}</div>
                        </div>
                        <div style={{display:'flex',gap:12,fontSize:11,color:'#A1A1AA'}}>
                          <span><i className="ti ti-folder" style={{fontSize:12,marginRight:3}}/>{c.categoria}</span>
                          <span><i className="ti ti-chart-bar" style={{fontSize:12,marginRight:3}}/>Puntaje actual: {c.puntaje}% → Meta: {c.meta}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {data?.noCumple===0&&data?.parcial===0&&(
                  <div style={{textAlign:'center',padding:'48px',background:'#F0FDF4',borderRadius:12,border:'0.5px solid #BBF7D0'}}>
                    <i className="ti ti-award" style={{fontSize:40,color:'#16A34A',display:'block',marginBottom:10}}/>
                    <div style={{fontSize:18,fontWeight:700,color:'#16A34A',marginBottom:6}}>¡Sin no conformidades!</div>
                    <div style={{fontSize:13,color:'#71717A'}}>El sistema cumple con todos los criterios evaluados.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
