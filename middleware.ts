import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Mapeo simple de permisos por rutas
function isAuthorized(pathname: string, role: string | undefined) {
  if (!role) return { allowed: false, reason: 'no_role' }

  // Páginas de administración
  if (pathname.startsWith('/admin')) {
    // Admin panel visible para teacher_admin y school_admin
    if (role === 'teacher_admin' || role === 'school_admin') return { allowed: true }
    return { allowed: false, reason: 'admin_only' }
  }

  // Portal Estudiante
  if (pathname.startsWith('/estudiante')) {
    return role === 'student' ? { allowed: true } : { allowed: false, reason: 'student_only' }
  }

  // APIs protegidas
  if (pathname.startsWith('/api/')) {
    // Settings: solo teacher_admin
    if (pathname.startsWith('/api/settings')) {
      return role === 'teacher_admin' ? { allowed: true } : { allowed: false, reason: 'settings_teacher_only' }
    }

    // Student APIs: solo student
    if (pathname.startsWith('/api/student')) {
      return role === 'student' ? { allowed: true } : { allowed: false, reason: 'student_api_only' }
    }

    // Analytics/Reports: teacher_admin y school_admin (student no)
    if (pathname.startsWith('/api/analytics') || pathname.startsWith('/api/reports')) {
      return (role === 'teacher_admin' || role === 'school_admin')
        ? { allowed: true }
        : { allowed: false, reason: 'analytics_admin_only' }
    }

    // Por defecto, requerir sesión para el resto de APIs
    return role ? { allowed: true } : { allowed: false, reason: 'api_requires_auth' }
  }

  // Resto público
  return { allowed: true }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas esenciales sin RBAC
  // - NextAuth API (login/session/callback)
  // - Assets internos y favicon
  // - Preflight CORS
  if (
    request.method === 'OPTIONS' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/') // permitir página de login
  ) {
    return NextResponse.next()
  }

  // Obtener token de sesión (NextAuth)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "38a9e82d4f38033786ecf90716dae010634e1cd3058bda8ec3bab7ec519bc557",
  })
  const role = (token as any)?.role as string | undefined

  const { allowed, reason } = isAuthorized(pathname, role)
  if (allowed) return NextResponse.next()

  const isApi = pathname.startsWith('/api/')

  // No autenticado
  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Redirigir al home público cuando no hay sesión
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Autenticado pero sin permisos
  if (isApi) {
    return NextResponse.json({ error: 'Acceso denegado', reason }, { status: 403 })
  }

  // Redirigir a inicio acorde a rol
  const url = request.nextUrl.clone()
  if (role === 'student') {
    url.pathname = '/estudiante'
  } else {
    url.pathname = '/admin'
  }
  url.searchParams.set('forbidden', '1')
  return NextResponse.redirect(url)
}

export const config = {
  // Ejecutar en rutas sensibles
  matcher: [
    '/admin/:path*',
    '/estudiante/:path*',
    '/api/((?!schools/branding-simple).)*',
  ],
}


