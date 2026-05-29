'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/admin/login') return

    const session = sessionStorage.getItem('biomedai_admin')
    if (!session) {
      router.push('/admin/login')
      return
    }

    // Verificar que sea super_admin
    try {
      const data = JSON.parse(session)
      if (data.rol !== 'super_admin') {
        router.push('/admin/login')
        return
      }
      // Setear cookie para el middleware
      document.cookie = `biomedai_admin=1; path=/; max-age=86400; SameSite=Strict`
    } catch {
      router.push('/admin/login')
    }
  }, [pathname, router])

  return <>{children}</>
}
