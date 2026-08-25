/**
 * Next.js Middleware - Security & Authentication
 * 
 * This middleware handles:
 * - Rate limiting for auth and API endpoints
 * - Authentication verification for protected routes
 * - Authorization (role-based access control) for admin routes
 * - Security headers application
 * 
 * @security P1-AUTH-001 - Fixed: Added explicit superadmin check for /admin/* routes
 */

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
    unauthorizedRedirect: '/salon/dashboard', // Non-superadmin users go here
  },
} as const

/**
 * Admin user role from database
 */
interface AdminUserRole {
  role: string
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ========================================================================
  // RATE LIMITING — Applied BEFORE authentication
  // ========================================================================

  // Rate limit for login/auth endpoints (brute-force protection)
  if (pathname === '/login' || pathname === '/cadastro') {
    if (request.method === 'POST') {
      const rateLimitResult = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.AUTH)
      if (rateLimitResult) return rateLimitResult
    }
  }

  // Rate limit for API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.API)
    if (rateLimitResult) return rateLimitResult
  }

  // Rate limit for protected routes (100 req/min per IP)
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

  // Get the user session and Supabase client
  const { response, user, error, supabase } = await updateSession(request)

  // If no user or error, redirect to login
  if (!user || error) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ========================================================================
  // AUTHORIZATION — Admin routes require superadmin role
  // P1-AUTH-001: This check is REQUIRED - RLS protects DATA, not ROUTES
  // ========================================================================

  if (isProtectedAdmin) {
    // Query admin_users to verify role
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // If query failed or no admin_users record, deny access
    if (adminError || !adminUser) {
      // User is authenticated but has no admin_users record
      // Redirect to login with error
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'no_access')
      return NextResponse.redirect(loginUrl)
    }

    // Type-safe role check
    const userRole = (adminUser as AdminUserRole).role

    // SECURITY: Only superadmin can access /admin/* routes
    if (userRole !== 'superadmin') {
      // User is authenticated but not superadmin
      // Redirect to salon dashboard (not login, since they're authenticated)
      const dashboardUrl = new URL(PROTECTED_ROUTES['/admin'].unauthorizedRedirect, request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // ========================================================================
  // SALON ROUTES — Verify user has valid tenant (salon assignment)
  // ========================================================================

  if (isProtectedSalon) {
    // Query admin_users to verify user has a salon assignment
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, salon_id')
      .eq('user_id', user.id)
      .single()

    // se query falhou, redireciona para login
    if (adminError || !adminUser) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'no_access')
      return NextResponse.redirect(loginUrl)
    }

    const typedAdminUser = adminUser as { role: string; salon_id: string | null }

    // ========================================================================
    // MAINTENANCE MODE CHECK (only for non-superadmins)
    // ========================================================================
    if (typedAdminUser.role !== 'superadmin') {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('maintenance_mode')
        .limit(1)
        .single()

      if (settings?.maintenance_mode) {
        return NextResponse.redirect(new URL('/manutencao', request.url))
      }
    }

    // Regular users must have a salon_id assigned
    if (typedAdminUser.role !== 'superadmin' && !typedAdminUser.salon_id) {
      // User has no salon assigned - redirect to login with error
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'no_salon')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ========================================================================
  // RESPONSE — Apply security headers
  // ========================================================================

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