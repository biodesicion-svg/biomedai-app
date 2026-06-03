'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAIL    = 'admin@synap.co'
const SUPER_ADMIN_PASSWORD = 'SYNAP2025$'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
        // Guardar sesión en sessionStorage
        sessionStorage.setItem('biomedai_admin', JSON.stringify({
          email,
          rol: 'super_admin',
          nombre: 'Super Admin',
          timestamp: Date.now(),
        }))
        router.push('/admin')
      } else {
        setError('Credenciales incorrectas. Acceso restringido.')
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css"/>

      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#7C3AED', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <i className="ti ti-shield-lock" style={{ color: '#fff', fontSize: 24 }}/>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#18181B', marginBottom: 4 }}>Panel de administración</div>
          <div style={{ fontSize: 13, color: '#A1A1AA' }}>Acceso restringido — Solo Super Admin</div>
        </div>

        {/* Form */}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#52525B', marginBottom: 6 }}>Correo electrónico</div>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-mail" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', fontSize: 15 }}/>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@synap.co"
                required
                style={{ width: '100%', paddingLeft: 36, height: 40, borderRadius: 8, border: '0.5px solid #E4E4E7', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E4E4E7'}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#52525B', marginBottom: 6 }}>Contraseña</div>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', fontSize: 15 }}/>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', paddingLeft: 36, height: 40, borderRadius: 8, border: '0.5px solid #E4E4E7', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E4E4E7'}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '0.5px solid #FECACA', color: '#DC2626', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 14, flexShrink: 0 }}/>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 40, borderRadius: 8, border: 'none',
              background: loading ? '#E4E4E7' : '#7C3AED',
              color: loading ? '#A1A1AA' : '#fff',
              fontSize: 13, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}>
            {loading ? (
              <><i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}/> Verificando...</>
            ) : (
              <><i className="ti ti-shield-check" style={{ fontSize: 15 }}/> Ingresar al panel</>
            )}
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E4E4E7' }}/>
          <span style={{ fontSize: 11, color: '#A1A1AA' }}>o</span>
          <div style={{ flex: 1, height: 1, background: '#E4E4E7' }}/>
        </div>

        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: '0.5px solid #E4E4E7', color: '#52525B', textDecoration: 'none', fontSize: 13, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#3B4FE8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E4E4E7'}>
          <i className="ti ti-layout-dashboard" style={{ fontSize: 14 }}/> Ir al sistema principal
        </a>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#D4D4D8' }}>
          SYNAP · Acceso restringido · Solo personal autorizado
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
