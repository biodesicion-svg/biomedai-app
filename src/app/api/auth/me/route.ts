import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre, rol, institucion_id')
    .eq('auth_id', user.id)
    .single()

  const iid = perfil?.institucion_id || user.user_metadata?.institucion_id || '00000000-0000-0000-0000-000000000001'
  return NextResponse.json({
    id: user.id,
    email: user.email,
    nombre: perfil?.nombre || user.user_metadata?.nombre,
    rol: perfil?.rol || 'tecnico',
    institucion_id: iid
  })
}
