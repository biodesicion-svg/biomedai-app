'use client'
import { useState } from 'react'

const OPCIONES = [
  { tipo: 'inventario',     label: 'Inventario de equipos',  icon: 'ti-package' },
  { tipo: 'mantenimientos', label: 'Historial mantenimientos',icon: 'ti-tool' },
  { tipo: 'repuestos',      label: 'Repuestos y almacen',    icon: 'ti-box' },
  { tipo: 'solicitudes',    label: 'Solicitudes de servicio', icon: 'ti-headset' },
  { tipo: 'movimientos',    label: 'Movimientos de equipos', icon: 'ti-transfer' },
  { tipo: 'completo',       label: 'Exportacion completa',   icon: 'ti-database-export' },
]

export default function ExportarXLS({ tipoDefault }: { tipoDefault?: string }) {
  const [open, setOpen] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  async function descargar(tipo: string) {
    setDescargando(tipo)
    setOpen(false)
    try {
      const r = await fetch(`/api/exportar?tipo=${tipo}`)
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SYNAP_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    setDescargando(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => tipoDefault ? descargar(tipoDefault) : setOpen(p => !p)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '0.5px solid #E4E4E7', background: '#fff', fontSize: 12, color: '#16A34A', cursor: 'pointer', fontWeight: 500 }}>
        {descargando
          ? <><i className="ti ti-loader-2" style={{ fontSize: 13 }} /> Exportando...</>
          : <><i className="ti ti-file-spreadsheet" style={{ fontSize: 13 }} /> Exportar XLS</>
        }
        {!tipoDefault && <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />}
      </button>

      {open && !tipoDefault && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '0.5px solid #E4E4E7', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 240, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 500, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #E4E4E7' }}>
              Seleccionar datos a exportar
            </div>
            {OPCIONES.map(op => (
              <button key={op.tipo} onClick={() => descargar(op.tipo)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#18181B', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8F9FA' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                <i className={'ti ' + op.icon} style={{ fontSize: 15, color: '#16A34A', flexShrink: 0 }} />
                {op.label}
                {op.tipo === 'completo' && <span style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 6px', borderRadius: 20, background: '#EEF2FF', color: '#1B2B5B' }}>5 hojas</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
