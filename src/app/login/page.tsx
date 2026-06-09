'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const AZ = '#1B2B5B', GR = '#64748B', RO = '#DC2626'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
    } else {
      router.push(next)
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: AZ, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <i className="ti ti-activity" style={{ color: '#fff', fontSize: 28 }}/>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: AZ }}>SYNAP</div>
          <div style={{ fontSize: 13, color: GR, marginTop: 4 }}>Sistema de gestión biomédica</div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: AZ, marginBottom: 6 }}>Iniciar sesión</div>
          <div style={{ fontSize: 13, color: GR, marginBottom: 24 }}>Accede a tu institución en SYNAP</div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: RO, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 15 }}/>{error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-mail" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: GR, fontSize: 16 }}/>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="admin@ips.com"
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}/>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: GR, fontSize: 16 }}/>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}/>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#94A3B8' : AZ, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }}/>Verificando...</> : <><i className="ti ti-login" style={{ fontSize: 16 }}/>Ingresar</>}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: GR }}>
          SYNAP v0.1.0 · Sistema de gestión biomédica para IPS colombianas
        </div>
      </div>
    </div>
  )
}
