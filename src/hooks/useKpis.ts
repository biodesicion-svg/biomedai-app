import { useState, useEffect } from 'react'
import { KPIs } from '@/types'

export function useKpis() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/kpis')
      .then(r => r.json())
      .then(d => { setKpis(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { kpis, loading, error }
}
