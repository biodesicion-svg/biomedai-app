import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo proteger /admin (no /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // El token se verifica en el cliente con sessionStorage
    // El middleware solo redirige si no hay cookie de sesión
    const adminSession = request.cookies.get('biomedai_admin')
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
