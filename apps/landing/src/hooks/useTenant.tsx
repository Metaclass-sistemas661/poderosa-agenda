'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
    AdminUser,
    Salon,
    TenantScopedTable,
    BaseTenantEntity,
    InsertData,
    UpdateData,
    QueryOptions,
    DatabaseResult,
    DatabaseListResult,
    SupabaseQueryBuilder,
    SupabaseClientWrapper
} from '@/lib/database/types'
import { Database } from '@/lib/database.types'
import { mapSupabaseError } from '@/lib/errors/mapper'
import { UserFacingError } from '@/lib/errors/types'

// ============================================================================
// TENANT HOOK — ENTERPRISE-GRADE CENTRALIZED TENANT RESOLUTION
// ============================================================================
// Este hook fornece resolução de tenant centralizada para componentes client-side.
// O salon_id é SEMPRE derivado da sessão autenticada, NUNCA de URL ou input.
// Projetado para escala de 200.000+ clientes com tipagem forte.
// ============================================================================

export interface TenantUser {
    id: string
    user_id: string
    salon_id: string
    role: AdminUser['role']
    name: string
    email: string
}

export interface TenantSalon {
    id: string
    name: string
    plan: Salon['plan']
    status: Salon['status']
}

export interface TenantState {
    salonId: string | null
    user: TenantUser | null
    salon: TenantSalon | null
    isLoading: boolean
    error: Error | null
}

/**
 * Hook para obter contexto de tenant de forma segura.
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   const { salonId, user, salon, isLoading, error, refetch } = useTenant()
 *   
 *   if (isLoading) return <Loading />
 *   if (error || !salonId) return <Error />
 *   
 *   // Agora pode usar salonId de forma segura
 * }
 * ```
 */
export function useTenant() {
    const [state, setState] = useState<TenantState>({
        salonId: null,
        user: null,
        salon: null,
        isLoading: true,
        error: null
    })

    const loadTenant = useCallback(async () => {
        const supabase = createClient()

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            // Obtém sessão autenticada
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                throw new Error(`Session error: ${sessionError.message}`)
            }

            if (!session) {
                throw new Error('No active session')
            }

            // Obtém admin_user com dados do salon
            const { data: adminUser, error: adminError } = await supabase
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
                        name,
                        plan,
                        status
                    )
                `)
                .eq('user_id', session.user.id)
                .single()

            if (adminError) {
                throw new Error(`Admin user error: ${adminError.message}`)
            }

            if (!adminUser) {
                throw new Error('User not found in admin_users')
            }

            // Type assertion segura
            const typedUser = adminUser as {
                id: string
                user_id: string
                salon_id: string | null
                role: string
                name: string
                email: string
                salons: { id: string; name: string; plan: string; status: string } | null
            }

            // Superadmins podem não ter salon_id
            if (!typedUser.salon_id && typedUser.role !== 'superadmin') {
                throw new Error('User has no assigned salon')
            }

            setState({
                salonId: typedUser.salon_id,
                user: {
                    id: typedUser.id,
                    user_id: typedUser.user_id,
                    salon_id: typedUser.salon_id || '',
                    role: typedUser.role as TenantUser['role'],
                    name: typedUser.name,
                    email: typedUser.email
                },
                salon: typedUser.salons ? {
                    id: typedUser.salons.id,
                    name: typedUser.salons.name,
                    plan: typedUser.salons.plan as TenantSalon['plan'],
                    status: typedUser.salons.status as TenantSalon['status']
                } : null,
                isLoading: false,
                error: null
            })
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err : new Error('Unknown error')
            }))
        }
    }, [])

    useEffect(() => {
        loadTenant()
    }, [loadTenant])

    return {
        ...state,
        refetch: loadTenant
    }
}

/**
 * Hook simplificado que retorna apenas o salonId.
 * Útil quando não precisa de todos os dados do tenant.
 */
export function useSalonId() {
    const { salonId, isLoading, error } = useTenant()
    return { salonId, isLoading, error }
}

/**
 * Hook que retorna o client Supabase já configurado.
 * Útil para queries que precisam do client.
 */
export function useSupabase() {
    const supabase = createClient()
    return supabase
}

// ============================================================================
// TENANT-SCOPED QUERY HOOKS
// ============================================================================

/**
 * Hook para fazer queries com escopo de tenant automático.
 * 
 * @example
 * ```tsx
 * function ClientsList() {
 *   const { data: clients, isLoading, refetch } = useTenantQuery<Client>('clients')
 * }
 * ```
 */
export function useTenantQuery<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    options?: {
        select?: string
        orderBy?: { column: string; ascending?: boolean }
        filters?: Array<{ column: string; operator: string; value: unknown }>
        enabled?: boolean
    }
) {
    const { salonId, isLoading: tenantLoading } = useTenant()
    const [data, setData] = useState<T[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<UserFacingError | null>(null)

    const fetchData = useCallback(async () => {
        if (!salonId) return

        const supabase = createClient()
        setIsLoading(true)

        try {
            const typedClient = supabase as {} as SupabaseClientWrapper
            let query = typedClient
                .from(tableName as string)
                .select(options?.select || '*')
                .eq('salon_id', salonId)

            // Aplicar filtros adicionais
            if (options?.filters) {
                for (const filter of options.filters) {
                    query = (query as unknown as { [key: string]: (col: string, val: unknown) => typeof query })[filter.operator](filter.column, filter.value)
                }
            }

            // Aplicar ordenação
            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true
                })
            }

            const result = await query
            const { data, error: queryError } = result as { data: T[]; error: Error | null }

            if (queryError) throw queryError

            setData(data)
            setError(null)
        } catch (err) {
            setError(mapSupabaseError(err, 'useTenantQuery'))
            setData(null)
        } finally {
            setIsLoading(false)
        }
    }, [salonId, tableName, options?.select, options?.orderBy?.column, options?.orderBy?.ascending])

    useEffect(() => {
        if (options?.enabled === false) return
        if (!tenantLoading && salonId) {
            fetchData()
        }
    }, [salonId, tenantLoading, fetchData, options?.enabled])

    return {
        data,
        isLoading: tenantLoading || isLoading,
        error,
        refetch: fetchData
    }
}

/**
 * Hook para mutações com escopo de tenant automático.
 * 
 * @example
 * ```tsx
 * function CreateClient() {
 *   const { mutate: createClient, isLoading } = useTenantMutation<Client>('clients', 'insert')
 *   
 *   const handleCreate = () => {
 *     createClient({ name: 'João', phone: '...' })
 *   }
 * }
 * ```
 */
export function useTenantMutation<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    operation: 'insert' | 'update' | 'delete'
) {
    const { salonId } = useTenant()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<UserFacingError | null>(null)

    const mutate = useCallback(async (
        data: Partial<T> | string,
        id?: string
    ): Promise<{ data: T | null; error: UserFacingError | null }> => {
        if (!salonId) {
            return { data: null, error: mapSupabaseError(new Error('No salon_id available')) }
        }

        const supabase = createClient()
        setIsLoading(true)
        setError(null)

        try {
            let result: { data: unknown; error: unknown }

            switch (operation) {
                case 'insert':
                    // Auto-inject salon_id - NUNCA aceita de input
                    const insertData = {
                        ...(data as object),
                        salon_id: salonId
                    } as Database['public']['Tables'][TableName]['Insert']
                    
                    const typedClientInsert = supabase as {} as SupabaseClientWrapper
                    result = await typedClientInsert
                        .from(tableName as string)
                        .insert(insertData)
                        .select()
                        .single()
                    break

                case 'update':
                    if (!id) throw new Error('ID required for update')
                    const updateData = {
                        ...(data as object),
                        updated_at: new Date().toISOString()
                    } as Database['public']['Tables'][TableName]['Update']

                    const typedClientUpdate = supabase as {} as SupabaseClientWrapper
                    result = await typedClientUpdate
                        .from(tableName as string)
                        .update(updateData)
                        .eq('id', id)
                        .eq('salon_id', salonId)
                        .select()
                        .single()
                    break

                case 'delete':
                    if (typeof data !== 'string') throw new Error('ID required for delete')
                    const typedClientDelete = supabase as {} as SupabaseClientWrapper
                    result = await typedClientDelete
                        .from(tableName as string)
                        .delete()
                        .eq('id', data)
                        .eq('salon_id', salonId)
                    break

                default:
                    throw new Error(`Unknown operation: ${operation}`)
            }

            if (result.error) throw result.error

            return { data: result.data as T, error: null }
        } catch (err) {
            const mappedError = mapSupabaseError(err, `useTenantMutation ${operation}`)
            setError(mappedError)
            return { data: null, error: mappedError }
        } finally {
            setIsLoading(false)
        }
    }, [salonId, tableName, operation])

    return {
        mutate,
        isLoading,
        error
    }
}