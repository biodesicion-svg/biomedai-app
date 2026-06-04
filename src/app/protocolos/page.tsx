'use client'
import { useState } from 'react'

const AZ='#1B2B5B',VE='#16A34A',RO='#DC2626',NA='#D97706',GR='#64748B',MO='#7C3AED'
const VE_BG='#F0FDF4',RO_BG='#FEF2F2',NA_BG='#FFFBEB',AZ_BG='#EEF2FF',MO_BG='#F5F3FF'

const PROTOCOLOS = [
  {
    id:'monitor', nombre:'Monitor de signos vitales', clase:'IIb', riesgo:'alto',
    frecuencia:'Semestral', duracion:'4h', normativa:'IEC 60601, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Verificacion electrica','Verificacion funcional','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos visibles en carcasa o pantalla', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Inspeccion inicial', pregunta:'Estado fisico general del equipo', tipo:'seleccion', opciones:['Bueno','Regular','Malo'], esperado:'Bueno', critica:false, adv:null},
      {n:3, cat:'Inspeccion inicial', pregunta:'Los cables de paciente estan en buen estado (sin cortes ni dobladuras)', tipo:'si_no', esperado:'Si', critica:true, adv:'Cables dañados pueden causar lecturas incorrectas'},
      {n:4, cat:'Limpieza', pregunta:'Se realizo limpieza externa con pano humedo', tipo:'si_no', esperado:'Si', critica:false, adv:null},
      {n:5, cat:'Limpieza', pregunta:'Se limpio la pantalla con producto apropiado', tipo:'si_no', esperado:'Si', critica:false, adv:'No usar alcohol directamente sobre la pantalla'},
      {n:6, cat:'Limpieza', pregunta:'Se limpiaron los conectores con aire comprimido', tipo:'si_no', esperado:'Si', critica:false, adv:null},
      {n:7, cat:'Verificacion electrica', pregunta:'Registra el voltaje de alimentacion medido', tipo:'numerico', unidad:'V', esperado:'110-120', critica:true, adv:'Desconectar antes de abrir el equipo'},
      {n:8, cat:'Verificacion electrica', pregunta:'La corriente de fuga esta dentro del rango permitido', tipo:'si_no', esperado:'Si', critica:true, adv:'Valor maximo: 100 μA segun IEC 60601'},
      {n:9, cat:'Verificacion electrica', pregunta:'El cable de tierra esta correctamente conectado', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:10,cat:'Verificacion funcional', pregunta:'El equipo enciende correctamente sin alarmas de error', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:11,cat:'Verificacion funcional', pregunta:'La medicion de SpO2 con simulador es correcta', tipo:'numerico', unidad:'%', esperado:'98-100', critica:true, adv:'Usar simulador de paciente calibrado'},
      {n:12,cat:'Verificacion funcional', pregunta:'La medicion de frecuencia cardiaca con simulador es correcta', tipo:'numerico', unidad:'lpm', esperado:'60-100', critica:true, adv:null},
      {n:13,cat:'Verificacion funcional', pregunta:'La alarma de SpO2 bajo funciona correctamente', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:14,cat:'Verificacion funcional', pregunta:'Estado de la bateria', tipo:'seleccion', opciones:['Optimo','Requiere carga','Reemplazar'], esperado:'Optimo', critica:false, adv:null},
      {n:15,cat:'Cierre', pregunta:'Selecciona los items verificados', tipo:'checklist', opciones:['Limpieza externa','Limpieza interna','Verificacion electrica','Prueba funcional','Revision cables','Verificacion alarmas'], esperado:'Todos', critica:false, adv:null},
      {n:16,cat:'Cierre', pregunta:'El equipo queda en condiciones optimas para uso clinico', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:17,cat:'Cierre', pregunta:'Observaciones generales del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
  {
    id:'ventilador', nombre:'Ventilador mecanico', clase:'IIb', riesgo:'alto',
    frecuencia:'Semestral', duracion:'6h', normativa:'IEC 60601, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Verificacion electrica','Verificacion funcional','Pruebas seguridad','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos visibles', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Inspeccion inicial', pregunta:'El circuito de paciente esta completo y sin danos', tipo:'si_no', esperado:'Si', critica:true, adv:'Verificar mangueras, valvulas y conectores'},
      {n:3, cat:'Limpieza', pregunta:'Se realizo limpieza y desinfeccion del circuito externo', tipo:'si_no', esperado:'Si', critica:true, adv:'Usar desinfectante de nivel intermedio'},
      {n:4, cat:'Limpieza', pregunta:'Se limpio el filtro de aire de la turbina', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:5, cat:'Limpieza', pregunta:'Estado del filtro bacteriano', tipo:'seleccion', opciones:['Bueno — conservar','Regular — reemplazar pronto','Malo — reemplazar ya'], esperado:'Bueno — conservar', critica:true, adv:null},
      {n:6, cat:'Verificacion electrica', pregunta:'Registra el voltaje de alimentacion', tipo:'numerico', unidad:'V', esperado:'110-120', critica:true, adv:'Verificar con multimetro calibrado'},
      {n:7, cat:'Verificacion electrica', pregunta:'La corriente de fuga es menor a 100 μA', tipo:'si_no', esperado:'Si', critica:true, adv:'Valor critico para equipos de soporte vital'},
      {n:8, cat:'Verificacion funcional', pregunta:'El equipo enciende sin alarmas de fallo', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:9, cat:'Verificacion funcional', pregunta:'Registra el volumen tidal entregado con pulmon de prueba', tipo:'numerico', unidad:'mL', esperado:'500', critica:true, adv:'Diferencia maxima aceptable: ±10%'},
      {n:10,cat:'Verificacion funcional', pregunta:'Registra la frecuencia respiratoria medida', tipo:'numerico', unidad:'rpm', esperado:'12-20', critica:true, adv:null},
      {n:11,cat:'Verificacion funcional', pregunta:'La alarma de presion alta funciona correctamente', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:12,cat:'Verificacion funcional', pregunta:'La alarma de desconexion de paciente funciona', tipo:'si_no', esperado:'Si', critica:true, adv:'Alarma critica para seguridad del paciente'},
      {n:13,cat:'Pruebas seguridad', pregunta:'El test automatico de autodiagnostico pasa sin errores', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:14,cat:'Cierre', pregunta:'Items verificados en este mantenimiento', tipo:'checklist', opciones:['Circuito paciente','Filtros','Verificacion electrica','Prueba volumetrica','Alarmas','Autodiagnostico'], esperado:'Todos', critica:false, adv:null},
      {n:15,cat:'Cierre', pregunta:'El equipo queda apto para soporte ventilatorio', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:16,cat:'Cierre', pregunta:'Observaciones y hallazgos del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
  {
    id:'desfibrilador', nombre:'Desfibrilador', clase:'IIb', riesgo:'alto',
    frecuencia:'Semestral', duracion:'4h', normativa:'IEC 60601, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Verificacion electrica','Verificacion funcional','Pruebas seguridad','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos en carcasa o pantalla', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Inspeccion inicial', pregunta:'Las paletas/electrodos estan en buen estado', tipo:'si_no', esperado:'Si', critica:true, adv:'Paletas danadas pueden causar quemaduras o descarga inefectiva'},
      {n:3, cat:'Limpieza', pregunta:'Se realizo limpieza de paletas con pano humedo', tipo:'si_no', esperado:'Si', critica:true, adv:'No usar solventes en las paletas'},
      {n:4, cat:'Verificacion electrica', pregunta:'Registra el voltaje de alimentacion', tipo:'numerico', unidad:'V', esperado:'110-120', critica:true, adv:null},
      {n:5, cat:'Verificacion electrica', pregunta:'La bateria tiene carga suficiente (>80%)', tipo:'si_no', esperado:'Si', critica:true, adv:'Bateria baja puede impedir descarga en emergencia'},
      {n:6, cat:'Verificacion funcional', pregunta:'Registra la energia de descarga medida a 200J', tipo:'numerico', unidad:'J', esperado:'180-220', critica:true, adv:'Usar analizador de desfibriladores calibrado'},
      {n:7, cat:'Verificacion funcional', pregunta:'Registra la energia de descarga medida a 360J', tipo:'numerico', unidad:'J', esperado:'324-396', critica:true, adv:null},
      {n:8, cat:'Verificacion funcional', pregunta:'El tiempo de carga a 200J es menor a 10 segundos', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:9, cat:'Verificacion funcional', pregunta:'El ECG en pantalla es legible y sin ruido', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:10,cat:'Pruebas seguridad', pregunta:'La descarga interna (test) se completa sin errores', tipo:'si_no', esperado:'Si', critica:true, adv:'Nunca descargar sin carga resistiva'},
      {n:11,cat:'Cierre', pregunta:'Items verificados', tipo:'checklist', opciones:['Inspeccion fisica','Limpieza','Verificacion bateria','Prueba de energia','Prueba ECG','Test interno'], esperado:'Todos', critica:false, adv:null},
      {n:12,cat:'Cierre', pregunta:'El equipo queda apto para uso en emergencias', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:13,cat:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
  {
    id:'bomba', nombre:'Bomba de infusion', clase:'IIb', riesgo:'alto',
    frecuencia:'Semestral', duracion:'3h', normativa:'IEC 60601, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Verificacion electrica','Verificacion funcional','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos visibles', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Inspeccion inicial', pregunta:'El mecanismo de carga del set de infusion funciona correctamente', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:3, cat:'Limpieza', pregunta:'Se realizo limpieza externa con pano humedo', tipo:'si_no', esperado:'Si', critica:false, adv:'No permitir entrada de liquidos al equipo'},
      {n:4, cat:'Limpieza', pregunta:'Se limpio el canal de infusion', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:5, cat:'Verificacion electrica', pregunta:'Registra el voltaje de alimentacion', tipo:'numerico', unidad:'V', esperado:'110-120', critica:true, adv:null},
      {n:6, cat:'Verificacion electrica', pregunta:'Estado de la bateria', tipo:'seleccion', opciones:['Optimo','Requiere carga','Reemplazar'], esperado:'Optimo', critica:true, adv:null},
      {n:7, cat:'Verificacion funcional', pregunta:'Registra el error de caudal medido con set de prueba a 10 mL/h', tipo:'numerico', unidad:'%', esperado:'<5', critica:true, adv:'Error >5% requiere calibracion o reemplazo'},
      {n:8, cat:'Verificacion funcional', pregunta:'La alarma de oclusion funciona correctamente', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:9, cat:'Verificacion funcional', pregunta:'La alarma de bateria baja funciona', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:10,cat:'Verificacion funcional', pregunta:'La alarma de fin de infusion funciona', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:11,cat:'Cierre', pregunta:'Items verificados', tipo:'checklist', opciones:['Limpieza canal','Verificacion electrica','Prueba de caudal','Alarma oclusion','Alarma bateria','Alarma fin infusion'], esperado:'Todos', critica:false, adv:null},
      {n:12,cat:'Cierre', pregunta:'La bomba queda apta para uso clinico', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:13,cat:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
  {
    id:'incubadora', nombre:'Incubadora neonatal', clase:'IIb', riesgo:'alto',
    frecuencia:'Semestral', duracion:'6h', normativa:'IEC 60601, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Verificacion electrica','Verificacion funcional','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos en estructura o domo', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Inspeccion inicial', pregunta:'Las portillas de acceso abren y cierran correctamente', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:3, cat:'Limpieza', pregunta:'Se realizo limpieza y desinfeccion completa del domo', tipo:'si_no', esperado:'Si', critica:true, adv:'Usar desinfectante compatible con neonatos'},
      {n:4, cat:'Limpieza', pregunta:'Se limpio el filtro de aire', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:5, cat:'Verificacion electrica', pregunta:'Registra el voltaje de alimentacion', tipo:'numerico', unidad:'V', esperado:'110-120', critica:true, adv:null},
      {n:6, cat:'Verificacion electrica', pregunta:'La corriente de fuga es menor a 100 μA', tipo:'si_no', esperado:'Si', critica:true, adv:'Critico para seguridad del neonato'},
      {n:7, cat:'Verificacion funcional', pregunta:'Registra la temperatura interior a set de 36.5°C', tipo:'numerico', unidad:'°C', esperado:'36.3-36.7', critica:true, adv:'Usar termometro patron calibrado'},
      {n:8, cat:'Verificacion funcional', pregunta:'Registra la humedad relativa interior medida', tipo:'numerico', unidad:'%HR', esperado:'50-80', critica:true, adv:null},
      {n:9, cat:'Verificacion funcional', pregunta:'La alarma de temperatura alta funciona', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:10,cat:'Verificacion funcional', pregunta:'La alarma de temperatura baja funciona', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:11,cat:'Cierre', pregunta:'Items verificados', tipo:'checklist', opciones:['Limpieza domo','Filtro de aire','Verificacion electrica','Control temperatura','Control humedad','Alarmas'], esperado:'Todos', critica:false, adv:null},
      {n:12,cat:'Cierre', pregunta:'La incubadora queda apta para uso con neonatos', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:13,cat:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
  {
    id:'glucometro', nombre:'Glucometro', clase:'IIa', riesgo:'medio',
    frecuencia:'Trimestral', duracion:'1h', normativa:'ISO 15197, Res. 4816/2008',
    categorias:['Inspeccion inicial','Limpieza','Calibracion','Cierre'],
    pasos:[
      {n:1, cat:'Inspeccion inicial', pregunta:'El equipo presenta danos fisicos visibles', tipo:'si_no', esperado:'No', critica:false, adv:null},
      {n:2, cat:'Limpieza', pregunta:'Se realizo limpieza externa del equipo', tipo:'si_no', esperado:'Si', critica:false, adv:null},
      {n:3, cat:'Inspeccion inicial', pregunta:'Las baterias tienen carga suficiente', tipo:'si_no', esperado:'Si', critica:false, adv:null},
      {n:4, cat:'Calibracion', pregunta:'Registra el valor de glucosa con solucion control baja', tipo:'numerico', unidad:'mg/dL', esperado:'40-70', critica:true, adv:'Usar solucion control del mismo lote que las tiras'},
      {n:5, cat:'Calibracion', pregunta:'Registra el valor de glucosa con solucion control alta', tipo:'numerico', unidad:'mg/dL', esperado:'250-350', critica:true, adv:null},
      {n:6, cat:'Calibracion', pregunta:'Los resultados de control estan dentro del rango del inserto', tipo:'si_no', esperado:'Si', critica:true, adv:'Si esta fuera de rango, no usar el equipo'},
      {n:7, cat:'Cierre', pregunta:'El glucometro queda apto para uso clinico', tipo:'si_no', esperado:'Si', critica:true, adv:null},
      {n:8, cat:'Cierre', pregunta:'Observaciones del mantenimiento', tipo:'texto', esperado:'', critica:false, adv:null},
    ]
  },
]

function Card({children,style={}}:any){
  return <div style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:12,...style}}>{children}</div>
}

export default function ProtocolosPage(){
  const[selProt,setSelProt]=useState(PROTOCOLOS[0])
  const[catSel,setCatSel]=useState('todas')
  const[busqueda,setBusqueda]=useState('')

  const pasosFiltrados=selProt.pasos.filter(p=>{
    if(catSel!=='todas'&&p.cat!==catSel) return false
    if(busqueda&&!p.pregunta.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const criticos=selProt.pasos.filter(p=>p.critica).length
  const total=selProt.pasos.length

  function iconTipo(tipo:string){
    if(tipo==='si_no') return 'ti-toggle-right'
    if(tipo==='numerico') return 'ti-123'
    if(tipo==='seleccion') return 'ti-list'
    if(tipo==='checklist') return 'ti-checkbox'
    return 'ti-text-size'
  }

  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#fff'}}>

      {/* Sidebar protocolos */}
      <div style={{width:260,flexShrink:0,background:'#fff',borderRight:'0.5px solid #E4E4E7',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'16px 14px',borderBottom:'0.5px solid #E4E4E7'}}>
          <div style={{fontSize:10,color:'#A1A1AA',marginBottom:2}}>SYNAP / Mantenimiento / Protocolos</div>
          <div style={{fontSize:15,fontWeight:500,color:'#18181B'}}>Protocolos</div>
          <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>{PROTOCOLOS.length} protocolos disponibles</div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
          <div style={{fontSize:10,fontWeight:500,color:'#A1A1AA',padding:'4px 8px',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Por tipo de equipo</div>
          {PROTOCOLOS.map(p=>{
            const isSel=selProt.id===p.id
            const rCol=p.riesgo==='alto'?RO:p.riesgo==='medio'?NA:VE
            const rBg=p.riesgo==='alto'?RO_BG:p.riesgo==='medio'?NA_BG:VE_BG
            return(
              <button key={p.id} onClick={()=>{setSelProt(p);setCatSel('todas');setBusqueda('')}}
                style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 10px',borderRadius:8,border:`0.5px solid ${isSel?AZ+'40':'transparent'}`,cursor:'pointer',background:isSel?AZ_BG:'transparent',marginBottom:4,textAlign:'left',transition:'all 0.15s'}}>
                <div style={{width:36,height:36,borderRadius:8,background:isSel?AZ+'20':rBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className="ti ti-device-heart-monitor" style={{fontSize:17,color:isSel?AZ:rCol}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:isSel?500:400,color:isSel?AZ:'#18181B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</div>
                  <div style={{display:'flex',gap:5,marginTop:2}}>
                    <span style={{fontSize:10,color:rCol}}>{p.pasos.length} pasos</span>
                    <span style={{fontSize:10,color:'#A1A1AA'}}>·</span>
                    <span style={{fontSize:10,color:'#A1A1AA'}}>{p.frecuencia}</span>
                  </div>
                </div>
                <span style={{fontSize:9,padding:'1px 5px',borderRadius:20,background:rBg,color:rCol,fontWeight:500,flexShrink:0}}>{p.clase}</span>
              </button>
            )
          })}
        </div>

        {/* Resumen seleccionado */}
        <div style={{padding:'12px 14px',borderTop:'0.5px solid #E4E4E7',background:'#FAFAFA'}}>
          <div style={{fontSize:11,fontWeight:500,color:'#18181B',marginBottom:8}}>{selProt.nombre}</div>
          {[
            {l:'Total pasos',  v:selProt.pasos.length, c:'#18181B'},
            {l:'Criticos',     v:criticos,              c:RO},
            {l:'Duracion',     v:selProt.duracion,      c:NA},
            {l:'Frecuencia',   v:selProt.frecuencia,    c:VE},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:11,color:'#A1A1AA'}}>{s.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#FAFAFA'}}>

        {/* Topbar */}
        <div style={{background:'#fff',borderBottom:'0.5px solid #E4E4E7',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexShrink:0}}>
          <div>
            <h1 style={{fontSize:15,fontWeight:500,color:'#18181B',margin:0}}>Protocolo — {selProt.nombre}</h1>
            <div style={{fontSize:11,color:'#A1A1AA',marginTop:2}}>{selProt.normativa} · Clase {selProt.clase} · {selProt.frecuencia} · {selProt.duracion}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',fontSize:13}}/>
              <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar paso..." style={{paddingLeft:28,height:32,fontSize:11,width:180}}/>
            </div>
            <select value={catSel} onChange={e=>setCatSel(e.target.value)} style={{height:32,fontSize:11,padding:'0 8px',borderRadius:7,border:'0.5px solid #E4E4E7',background:'#fff',color:GR}}>
              <option value="todas">Todas las categorias</option>
              {selProt.categorias.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={async()=>{
              const r=await fetch('/api/documentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tipo:'protocolo',nombre:selProt.nombre,marca:'N/D',modelo:'N/D',referencia:'N/D',serial:'N/D',servicio:'N/D'})})
              const d=await r.json()
              if(d.url){const a=document.createElement('a');a.href=d.url;a.download=d.nombre;a.click()}
            }} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:'none',background:AZ,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>
              <i className="ti ti-file-type-pdf" style={{fontSize:13}}/> Exportar PDF
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,padding:'12px 20px 0',flexShrink:0}}>
          {[
            {l:'Total pasos',  v:selProt.pasos.length,                    c:AZ,  icon:'ti-list-numbers'},
            {l:'Criticos',     v:criticos,                                 c:RO,  icon:'ti-alert-triangle'},
            {l:'Si/No',        v:selProt.pasos.filter(p=>p.tipo==='si_no').length, c:VE, icon:'ti-toggle-right'},
            {l:'Numericos',    v:selProt.pasos.filter(p=>p.tipo==='numerico').length,c:NA,icon:'ti-123'},
            {l:'Duracion',     v:selProt.duracion,                         c:MO,  icon:'ti-clock'},
          ].map((k,i)=>(
            <div key={i} style={{background:'#fff',border:'0.5px solid #E4E4E7',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:k.c+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={'ti '+k.icon} style={{fontSize:16,color:k.c}}/>
              </div>
              <div>
                <div style={{fontSize:20,fontWeight:500,color:k.c,lineHeight:1,marginBottom:2}}>{k.v}</div>
                <div style={{fontSize:10,color:'#A1A1AA'}}>{k.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Lista pasos */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 20px 20px'}}>

          {/* Agrupado por categoria */}
          {selProt.categorias.filter(cat=>catSel==='todas'||cat===catSel).map(cat=>{
            const pasosCat=pasosFiltrados.filter(p=>p.cat===cat)
            if(!pasosCat.length) return null
            const catCriticos=pasosCat.filter(p=>p.critica).length
            return(
              <div key={cat} style={{marginBottom:20}}>
                {/* Header categoria */}
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{height:1,flex:1,background:'#E4E4E7'}}/>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 12px',borderRadius:20,background:'#F4F4F5',border:'0.5px solid #E4E4E7'}}>
                    <span style={{fontSize:11,fontWeight:500,color:'#18181B'}}>{cat}</span>
                    <span style={{fontSize:10,color:'#A1A1AA'}}>{pasosCat.length} pasos</span>
                    {catCriticos>0&&<span style={{fontSize:10,color:RO,fontWeight:500}}>{catCriticos} criticos</span>}
                  </div>
                  <div style={{height:1,flex:1,background:'#E4E4E7'}}/>
                </div>

                {/* Pasos */}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {pasosCat.map((paso,i)=>(
                    <Card key={paso.n} style={{padding:'14px 16px',border:`0.5px solid ${paso.critica?RO+'30':'#E4E4E7'}`}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                        {/* Numero */}
                        <div style={{width:28,height:28,borderRadius:8,background:paso.critica?RO_BG:AZ_BG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{fontSize:12,fontWeight:600,color:paso.critica?RO:AZ}}>{paso.n}</span>
                        </div>

                        {/* Contenido */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                            <span style={{fontSize:13,fontWeight:500,color:'#18181B'}}>{paso.pregunta}</span>
                            {paso.critica&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:RO_BG,color:RO,fontWeight:500,flexShrink:0}}>Critico</span>}
                          </div>

                          {/* Advertencia */}
                          {paso.adv&&(
                            <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:'6px 10px',borderRadius:6,background:NA_BG,border:`0.5px solid ${NA}30`,marginBottom:8}}>
                              <i className="ti ti-alert-triangle" style={{fontSize:12,color:NA,flexShrink:0,marginTop:1}}/>
                              <span style={{fontSize:11,color:'#92400E'}}>{paso.adv}</span>
                            </div>
                          )}

                          {/* Tipo de respuesta */}
                          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                            <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,background:'#F8F9FA',border:'0.5px solid #E4E4E7'}}>
                              <i className={'ti '+iconTipo(paso.tipo)} style={{fontSize:13,color:GR}}/>
                              <span style={{fontSize:11,color:GR,textTransform:'capitalize'}}>{paso.tipo==='si_no'?'Si / No':paso.tipo==='numerico'?'Valor numerico':paso.tipo==='seleccion'?'Seleccion':paso.tipo==='checklist'?'Checklist':'Texto'}</span>
                              {(paso as any).unidad&&<span style={{fontSize:11,color:AZ,fontWeight:500}}>en {(paso as any).unidad}</span>}
                            </div>

                            {paso.esperado&&(
                              <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,background:VE_BG,border:`0.5px solid ${VE}30`}}>
                                <i className="ti ti-check" style={{fontSize:12,color:VE}}/>
                                <span style={{fontSize:11,color:VE,fontWeight:500}}>Esperado: {paso.esperado}</span>
                              </div>
                            )}

                            {/* Opciones seleccion */}
                            {(paso as any).opciones&&(
                              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                {(paso as any).opciones.map((op:string,j:number)=>(
                                  <span key={j} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'#F4F4F5',border:'0.5px solid #E4E4E7',color:'#52525B'}}>{op}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Indicador tipo */}
                        <div style={{flexShrink:0,textAlign:'center'}}>
                          <i className={'ti '+iconTipo(paso.tipo)} style={{fontSize:20,color:paso.tipo==='si_no'?VE:paso.tipo==='numerico'?NA:paso.tipo==='checklist'?MO:GR}}/>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}

          {pasosFiltrados.length===0&&(
            <div style={{textAlign:'center',padding:'60px',color:'#A1A1AA'}}>
              <i className="ti ti-search" style={{fontSize:36,display:'block',marginBottom:10,opacity:0.3}}/>
              <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>Sin resultados</div>
              <div style={{fontSize:11}}>Ajusta los filtros o la busqueda</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
