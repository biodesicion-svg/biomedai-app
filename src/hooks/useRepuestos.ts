import { useState, useEffect, useCallback } from 'react'
import { Repuesto } from '@/types'

export function useRepuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const r = await fetch('/api/repuestos')
    const d = await r.json()
    setRepuestos(d.repuestos || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { repuestos, loading, recargar: cargar }
}
