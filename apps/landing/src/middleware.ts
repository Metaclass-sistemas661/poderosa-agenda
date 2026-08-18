import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
import { applySecurityHeadersToResponse } from '@/lib/security/headers'

// Protected routes configuration
const PROTECTED_ROUTES = {
  '/salon': {
    requireAuth: true,
    redirectTo: '/login',
  },
  '/admin': {
    requireAuth: true,
    requireSuperadmin: true,
    redirectTo: '/login',
  },
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ========================================================================
  // RATE LIMITING — Applied BEFORE authentication
  // ========================================================================

  // Rate limit para login/auth endpoints (proteção contra brute-force)
  if (pathname === '/login' || pathname === '/cadastro') {
    if (request.method === 'POST') {
      const rateLimitResult = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.AUTH)
      if (rateLimitResult) return rateLimitResult
    }
  }

  // Rate limit para API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.API)
    if (rateLimitResult) return rateLimitResult
  }

  // Rate limit geral para rotas protegidas (100 req/min por IP)
  if (pathname.startsWith('/salon') || pathname.startsWith('/admin')) {
    const rateLimitResult = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.API)
    if (rateLimitResult) return rateLimitResult
  }

  // ========================================================================
  // AUTHENTICATION — Protected routes require session
  // ========================================================================

  // Check if this is a protected route
  const isProtectedSalon = pathname.startsWith('/salon')
  const isProtectedAdmin = pathname.startsWith('/admin')

  if (!isProtectedSalon && !isProtectedAdmin) {
    return NextResponse.next()
  }

  // Get the user session
  const { response, user, error } = await updateSession(request)

  // If no user or error, redirect to login
  if (!user || error) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For admin routes, we could add additional role checks here
  // (but the database RLS already enforces this)

  // Apply security headers to authenticated response
  applySecurityHeadersToResponse(response, {
    requestId: crypto.randomUUID()
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}