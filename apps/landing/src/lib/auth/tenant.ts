/**
 * Trusted Tenant Context - SERVER ONLY
 * 
 * Este módulo fornece resolução de tenant server-side de fontes confiáveis.
 * O tenant (salon_id) é SEMPRE derivado do registro admin_users do usuário
 * autenticado, NUNCA de parâmetros de URL ou input do usuário.
 * 
 * IMPORTANTE: Este módulo é exclusivamente para uso em:
 * - Server Actions
 * - Route Handlers (API Routes)
 * - Server Components
 * 
 * NÃO importe este módulo em Client Components.
 * 
 * @module auth/tenant
 * @security P1-SEC-001 - Fixed: Using server client instead of browser client
 */

import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { AuthorizationError } from './authorization'
import type { Database } from '@/lib/database.types'

// Type for the Supabase client query builder
type SupabaseClient = ReturnType<typeof createClient>

/**
 * Represents the trusted tenant context derived from authenticated session
 */
export interface TenantContext {
    /** The salon ID the user belongs to (empty for superadmin without assigned salon) */
    salonId: string
    /** The name of the salon */
    salonName: string
    /** The authenticated user's ID from auth.users */
    userId: string
    /** The user's role in the system */
    userRole: 'superadmin' | 'admin' | 'professional' | 'receptionist'
    /** The user's display name */
    userName: string
    /** The user's email address */
    userEmail: string
}

/**
 * Admin user data shape from database query
 */
interface AdminUserData {
    id: string
    user_id: string
    salon_id: string | null
    role: string
    name: string
    email: string
    salons: { id: string; name: string } | null
}

/**
 * Gets the trusted tenant context from the authenticated session.
 * This is the ONLY way to obtain salon_id - never from URL params or form data.
 * 
 * @security This function:
 * - Uses server-side Supabase client with proper cookie handling
 * - Derives tenant from authenticated user's admin_users record
 * - Never trusts client-supplied tenant information
 * 
 * @throws AuthorizationError if user is not authenticated
 * @throws AuthorizationError if user has no tenant access
 * @throws AuthorizationError if non-superadmin user has no assigned salon
 * 
 * @returns Promise<TenantContext> The trusted tenant context
 */
export async function getTrustedTenantContext(): Promise<TenantContext> {
    const supabase = createClient()

    // Get authenticated user from server-side session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new AuthorizationError('User not authenticated', 'UNAUTHENTICATED')
    }

    // Get admin_users record with salon information
    const { data, error: adminError } = await supabase
        .from('admin_users')
        .select(`
            id,
            user_id,
            salon_id,
            role,
            name,
            email,
            salons:salon_id (
                id,
                name
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (adminError || !data) {
        throw new AuthorizationError('User has no tenant access', 'NO_TENANT')
    }

    // Safely extract admin user data
    const adminUser: AdminUserData = {
        id: data.id,
        user_id: data.user_id,
        salon_id: data.salon_id,
        role: data.role,
        name: data.name,
        email: data.email,
        salons: data.salons && typeof data.salons === 'object' && !Array.isArray(data.salons)
            ? data.salons as { id: string; name: string }
            : null
    }

    // Superadmins may not have salon_id
    if (!adminUser.salon_id && adminUser.role !== 'superadmin') {
        throw new AuthorizationError('User has no assigned salon', 'NO_SALON')
    }

    // Validate role is one of the expected values
    const validRoles = ['superadmin', 'admin', 'professional', 'receptionist'] as const
    const userRole = validRoles.includes(adminUser.role as typeof validRoles[number])
        ? (adminUser.role as TenantContext['userRole'])
        : 'receptionist' // Default to least privileged role if invalid

    return {
        salonId: adminUser.salon_id || '',
        salonName: adminUser.salons?.name || '',
        userId: adminUser.user_id,
        userRole,
        userName: adminUser.name,
        userEmail: adminUser.email
    }
}

/**
 * Gets only the trusted salon_id (shortcut).
 * 
 * @throws AuthorizationError if user doesn't have tenant access
 * @returns Promise<string> The trusted salon_id
 */
export async function getTrustedSalonId(): Promise<string> {
    const context = await getTrustedTenantContext()
    if (!context.salonId) {
        throw new AuthorizationError('No salon_id available', 'NO_SALON')
    }
    return context.salonId
}

/**
 * Validates that a provided salon_id matches the user's trusted tenant.
 * Used to prevent tenant spoofing in URL parameters.
 * 
 * @security This function:
 * - Validates client-supplied salon_id against trusted context
 * - Superadmins bypass validation (can access any salon)
 * - Throws on mismatch to prevent cross-tenant access
 * 
 * @param requestedSalonId - The salon_id from URL or form data
 * @returns Promise<boolean> true if valid
 * @throws AuthorizationError if tenant mismatch
 */
export async function validateTenantAccess(requestedSalonId: string): Promise<boolean> {
    const context = await getTrustedTenantContext()

    // Superadmins can access any salon
    if (context.userRole === 'superadmin') {
        return true
    }

    // Regular users must match their assigned salon
    if (context.salonId !== requestedSalonId) {
        throw new AuthorizationError(
            'Access denied: salon_id does not match user tenant',
            'TENANT_MISMATCH'
        )
    }

    return true
}

/**
 * Creates a Supabase client with automatic tenant scoping.
 * 
 * @returns Promise with supabase client and the user's salonId
 */
export async function createTenantScopedClient(): Promise<{
    supabase: SupabaseClient
    salonId: string
}> {
    const supabase = createClient()
    const salonId = await getTrustedSalonId()
    return { supabase, salonId }
}

// ============================================================================
// TENANT-SCOPED DATA ACCESS LAYER
// ============================================================================
// These functions provide data access with automatic tenant scoping.
// All operations are validated against the authenticated user's trusted tenant,
// preventing cross-tenant data leakage.
// ============================================================================

/**
 * Base interface for tenant-scoped entities
 */
export interface TenantScopedEntity {
    id: string
    salon_id: string
    created_at?: string
    updated_at?: string
}

/**
 * Result of a data operation
 */
export interface DataOperationResult<T> {
    data: T | null
    error: Error | null
    success: boolean
}

/**
 * Insert with automatic salon_id injection.
 * 
 * @security
 * - salon_id is derived from authenticated session (NEVER from input)
 * - RLS provides additional validation at database level
 * - Prevents insertion into other tenants
 * 
 * @param tableName - Table name in Supabase
 * @param data - Data to insert (without salon_id)
 * @returns Operation result with inserted data or error
 */
export async function insertWithTenant<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    data: Omit<Database['public']['Tables'][TableName]['Insert'], 'salon_id'>
): Promise<DataOperationResult<T>> {
    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const supabase = createClient()

    // Inject trusted salon_id - NEVER accept from external input
    const insertData = {
        ...data,
        salon_id: salonId
    } as Database['public']['Tables'][TableName]['Insert']

    const { data: resultData, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single()

    return {
        data: resultData as T | null,
        error,
        success: !error && resultData !== null
    }
}

/**
 * Update with tenant validation.
 * 
 * @security
 * - salon_id in WHERE clause ensures operation only on correct tenant
 * - RLS provides additional validation at database level
 * - Prevents updating records in other tenants even with valid ID
 * 
 * @param tableName - Table name in Supabase
 * @param id - Record ID to update
 * @param data - Data for update (without salon_id or id)
 * @returns Operation result with updated data or error
 */
export async function updateWithTenant<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    id: string,
    data: Omit<Database['public']['Tables'][TableName]['Update'], 'salon_id' | 'id'>
): Promise<DataOperationResult<T>> {
    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const supabase = createClient()

    const updateData = {
        ...data,
        updated_at: new Date().toISOString()
    } as Database['public']['Tables'][TableName]['Update']

    // salon_id in WHERE prevents cross-tenant updates
    const { data: resultData, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .eq('salon_id', salonId)
        .select()
        .single()

    return {
        data: resultData as T | null,
        error,
        success: !error && resultData !== null
    }
}

/**
 * Delete with tenant validation.
 * 
 * @security
 * - salon_id in WHERE clause ensures deletion only on correct tenant
 * - RLS provides additional validation at database level
 * - Prevents deleting records in other tenants even with valid ID
 * 
 * @param tableName - Table name in Supabase
 * @param id - Record ID to delete
 * @returns Operation result
 */
export async function deleteWithTenant<TableName extends keyof Database['public']['Tables']>(
    tableName: TableName,
    id: string
): Promise<{ error: Error | null; success: boolean }> {
    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const supabase = createClient()

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('salon_id', salonId)

    return {
        error,
        success: !error
    }
}

/**
 * Select with automatic tenant scoping.
 * 
 * @security
 * - salon_id automatically applied to filter
 * - RLS provides additional validation at database level
 * 
 * @param tableName - Table name in Supabase
 * @param options - Query options (select, order, limit, filters)
 * @returns Operation result with data or error
 */
export async function selectWithTenant<T extends TenantScopedEntity>(
    tableName: keyof Database['public']['Tables'],
    options?: {
        select?: string
        orderBy?: { column: string; ascending?: boolean }
        limit?: number
        filters?: Array<{
            column: string
            operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
            value: string | number | boolean | null
        }>
    }
): Promise<DataOperationResult<T[]>> {
    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const supabase = createClient()

    let query = supabase
        .from(tableName)
        .select(options?.select || '*')
        .eq('salon_id', salonId)

    // Apply additional filters
    if (options?.filters) {
        for (const filter of options.filters) {
            switch (filter.operator) {
                case 'eq':
                    query = query.eq(filter.column, filter.value)
                    break
                case 'neq':
                    query = query.neq(filter.column, filter.value)
                    break
                case 'gt':
                    query = query.gt(filter.column, filter.value)
                    break
                case 'gte':
                    query = query.gte(filter.column, filter.value)
                    break
                case 'lt':
                    query = query.lt(filter.column, filter.value)
                    break
                case 'lte':
                    query = query.lte(filter.column, filter.value)
                    break
                case 'like':
                    query = query.like(filter.column, String(filter.value))
                    break
                case 'ilike':
                    query = query.ilike(filter.column, String(filter.value))
                    break
            }
        }
    }

    // Apply ordering
    if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    // Apply limit
    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data, error } = await query

    return {
        data: data as T[] | null,
        error,
        success: !error && data !== null
    }
}

/**
 * Select a single record by ID with tenant validation.
 * 
 * @param tableName - Table name in Supabase
 * @param id - Record ID
 * @param select - Fields to select (default: '*')
 * @returns Operation result
 */
export async function selectOneWithTenant<T extends TenantScopedEntity>(
    tableName: keyof Database['public']['Tables'],
    id: string,
    select?: string
): Promise<DataOperationResult<T>> {
    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const supabase = createClient()

    const { data, error } = await supabase
        .from(tableName)
        .select(select || '*')
        .eq('id', id)
        .eq('salon_id', salonId)
        .single()

    return {
        data: data as T | null,
        error,
        success: !error && data !== null
    }
}