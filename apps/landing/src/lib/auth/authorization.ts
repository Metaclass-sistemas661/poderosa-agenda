import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

// Types
export type UserRole = 'superadmin' | 'admin' | 'professional' | 'receptionist'

export interface AuthUser {
    id: string
    email: string
}

export interface AdminUser {
    id: string
    user_id: string
    salon_id: string | null
    role: UserRole
    name: string
    email: string
}

export interface AuthContext {
    user: AuthUser
    adminUser: AdminUser
}

// Error types
export class AuthorizationError extends Error {
    constructor(message: string, public code: string) {
        super(message)
        this.name = 'AuthorizationError'
    }
}

/**
 * Get current authenticated user (client-side)
 * Throws if not authenticated
 */
export async function requireUser(): Promise<AuthUser> {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new AuthorizationError('User not authenticated', 'UNAUTHENTICATED')
    }

    return {
        id: user.id,
        email: user.email || ''
    }
}

/**
 * Get current user's tenant (salon) context
 * Throws if user is not part of any tenant
 */
export async function requireTenant(): Promise<AuthContext> {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new AuthorizationError('User not authenticated', 'UNAUTHENTICATED')
    }

    const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, salon_id, role, name, email')
        .eq('user_id', user.id)
        .single()

    if (adminError || !adminUser) {
        throw new AuthorizationError('User has no tenant access', 'NO_TENANT')
    }

    return {
        user: { id: user.id, email: user.email || '' },
        adminUser: adminUser as AdminUser
    }
}

/**
 * Require specific role(s)
 * Throws if user doesn't have one of the allowed roles
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthContext> {
    const context = await requireTenant()

    if (!allowedRoles.includes(context.adminUser.role)) {
        throw new AuthorizationError(
            `Role '${context.adminUser.role}' not authorized. Required: ${allowedRoles.join(', ')}`,
            'FORBIDDEN'
        )
    }

    return context
}

/**
 * Require superadmin role
 * Shorthand for requireRole('superadmin')
 */
export async function requireSuperadmin(): Promise<AuthContext> {
    return requireRole('superadmin')
}

/**
 * Require admin or higher role
 */
export async function requireAdmin(): Promise<AuthContext> {
    return requireRole('superadmin', 'admin')
}

/**
 * Check if user has specific role (without throwing)
 */
export async function hasRole(...roles: UserRole[]): Promise<boolean> {
    try {
        await requireRole(...roles)
        return true
    } catch {
        return false
    }
}

/**
 * Check if user is superadmin (without throwing)
 */
export async function isSuperadmin(): Promise<boolean> {
    return hasRole('superadmin')
}

/**
 * Get current salon_id from authenticated user
 * Returns null for superadmins (who may access all salons)
 */
export async function getCurrentSalonId(): Promise<string | null> {
    const context = await requireTenant()
    return context.adminUser.salon_id
}

/**
 * Require that user belongs to a specific salon
 */
export async function requireSalon(salonId: string): Promise<AuthContext> {
    const context = await requireTenant()

    // Superadmins can access any salon
    if (context.adminUser.role === 'superadmin') {
        return context
    }

    // Regular users must belong to the salon
    if (context.adminUser.salon_id !== salonId) {
        throw new AuthorizationError('Access to this salon denied', 'FORBIDDEN')
    }

    return context
}