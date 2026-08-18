/**
 * Centralized Salon Utilities
 * 
 * Consolidates duplicate loadSalonId() functions across the codebase.
 * Provides type-safe, consistent access to salon context.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export interface SalonContext {
    userId: string
    salonId: string
    role: string
    email: string
}

/**
 * Get salon_id for the current authenticated user
 * 
 * @throws Redirects to /login if user is not authenticated or has no salon
 * @returns salon_id string
 * 
 * @example
 * ```typescript
 * const salonId = await getSalonId()
 * const clients = await getClients(salonId)
 * ```
 */
export const getSalonId = cache(async (): Promise<string> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('salon_id')
        .eq('user_id', user.id)
        .single()

    if (error || !adminUser?.salon_id) {
        redirect('/login')
    }

    return adminUser.salon_id
})

/**
 * Get full salon context including user info
 * 
 * @throws Redirects to /login if user is not authenticated or has no salon
 * @returns SalonContext object with userId, salonId, role, email
 * 
 * @example
 * ```typescript
 * const context = await getSalonContext()
 * if (context.role === 'admin') {
 *   // Admin-only logic
 * }
 * ```
 */
export const getSalonContext = cache(async (): Promise<SalonContext> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('salon_id, role, email')
        .eq('user_id', user.id)
        .single()

    if (error || !adminUser?.salon_id) {
        redirect('/login')
    }

    return {
        userId: user.id,
        salonId: adminUser.salon_id,
        role: adminUser.role,
        email: adminUser.email,
    }
})

/**
 * Verify if user has access to a specific salon
 * 
 * @param salonId - Salon ID to check access for
 * @returns true if user has access, false otherwise
 * 
 * @example
 * ```typescript
 * const hasAccess = await verifySalonAccess(salonId)
 * if (!hasAccess) {
 *   throw new UnauthorizedError()
 * }
 * ```
 */
export async function verifySalonAccess(salonId: string): Promise<boolean> {
    try {
        const userSalonId = await getSalonId()
        return userSalonId === salonId
    } catch {
        return false
    }
}

/**
 * Get salon details
 * 
 * @param salonId - Optional salon ID (defaults to current user's salon)
 * @returns Salon data or null
 */
export async function getSalonDetails(salonId?: string) {
    const supabase = createClient()
    const targetSalonId = salonId || await getSalonId()

    const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('id', targetSalonId)
        .single()

    if (error) return null
    return data
}