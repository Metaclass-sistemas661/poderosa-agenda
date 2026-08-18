import { createClient } from '@/lib/supabase/client'
import { AuthorizationError } from './authorization'
import type { Database } from '@/lib/database.types'
import type { SupabaseClientWrapper } from '@/lib/database/types'

/**
 * Trusted Tenant Context
 * 
 * Este módulo fornece resolução de tenant server-side de fontes confiáveis.
 * O tenant (salon_id) é SEMPRE derivado do registro admin_users do usuário
 * autenticado, NUNCA de parâmetros de URL ou input do usuário.
 */

export interface TenantContext {
    salonId: string
    salonName: string
    userId: string
    userRole: 'superadmin' | 'admin' | 'professional' | 'receptionist'
    userName: string
    userEmail: string
}

/**
 * Obtém o contexto de tenant confiável da sessão autenticada.
 * Esta é a ÚNICA forma de obter salon_id - nunca de URL params ou form data.
 * 
 * @throws AuthorizationError se o usuário não está autenticado ou não tem tenant
 */
export async function getTrustedTenantContext(): Promise<TenantContext> {
    const supabase = createClient()

    // Obtém usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new AuthorizationError('User not authenticated', 'UNAUTHENTICATED')
    }

    // Obtém registro admin_user com informações do salon
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

    // Type assertion para dados do admin_user
    const adminUser = data as {
        id: string
        user_id: string
        salon_id: string | null
        role: string
        name: string
        email: string
        salons: { id: string; name: string } | null
    }

    // Superadmins podem não ter salon_id
    if (!adminUser.salon_id && adminUser.role !== 'superadmin') {
        throw new AuthorizationError('User has no assigned salon', 'NO_SALON')
    }

    return {
        salonId: adminUser.salon_id || '',
        salonName: adminUser.salons?.name || '',
        userId: adminUser.user_id,
        userRole: adminUser.role as TenantContext['userRole'],
        userName: adminUser.name,
        userEmail: adminUser.email
    }
}

/**
 * Obtém apenas o salon_id confiável (atalho)
 * 
 * @throws AuthorizationError se não tem acesso ao tenant
 */
export async function getTrustedSalonId(): Promise<string> {
    const context = await getTrustedTenantContext()
    if (!context.salonId) {
        throw new AuthorizationError('No salon_id available', 'NO_SALON')
    }
    return context.salonId
}

/**
 * Valida que um salon_id fornecido corresponde ao tenant confiável do usuário.
 * Usado para prevenir spoofing de tenant em parâmetros de URL.
 * 
 * @param requestedSalonId - O salon_id de URL ou form data
 * @returns true se corresponde, throws se não
 */
export async function validateTenantAccess(requestedSalonId: string): Promise<boolean> {
    const context = await getTrustedTenantContext()

    // Superadmins podem acessar qualquer salon
    if (context.userRole === 'superadmin') {
        return true
    }

    // Usuários regulares devem corresponder ao salon atribuído
    if (context.salonId !== requestedSalonId) {
        throw new AuthorizationError(
            'Access denied: salon_id does not match user tenant',
            'TENANT_MISMATCH'
        )
    }

    return true
}

/**
 * Cria um query builder com escopo de tenant.
 * Adiciona automaticamente o filtro salon_id.
 */
export async function createTenantQuery<TableName extends keyof Database['public']['Tables']>(tableName: TableName) {
    const supabase = createClient()
    const salonId = await getTrustedSalonId()

    const typedClient = supabase as {} as SupabaseClientWrapper
    const query = typedClient
        .from(tableName as string)
        .select('*')
        .eq('salon_id', salonId)

    return { query, salonId }
}

// ============================================================================
// TENANT-SCOPED DATA ACCESS LAYER
// ============================================================================
// Estas funções fornecem acesso a dados com escopo de tenant automaticamente
// aplicado. Todas as operações são validadas contra o tenant confiável do
// usuário autenticado, prevenindo vazamento de dados cross-tenant.
// ============================================================================

/**
 * Base interface para entidades com escopo de tenant
 */
export interface TenantScopedEntity {
    id: string
    salon_id: string
    created_at?: string
    updated_at?: string
}

/**
 * Resultado de operação de dados
 */
export interface DataOperationResult<T> {
    data: T | null
    error: Error | null
    success: boolean
}

/**
 * Insert com injeção automática de salon_id.
 * 
 * Segurança:
 * - salon_id é derivado da sessão autenticada (NUNCA de input)
 * - RLS fornece validação adicional no banco de dados
 * - Previne inserção de dados em outros tenants
 * 
 * @param tableName - Nome da tabela no Supabase
 * @param data - Dados a serem inseridos (sem salon_id)
 * @returns Resultado da operação com dados inseridos ou erro
 */
export async function insertWithTenant<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    data: Omit<Database['public']['Tables'][TableName]['Insert'], 'salon_id'>
): Promise<DataOperationResult<T>> {
    const supabase = createClient()

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

    // Injeta salon_id confiável - NUNCA aceita de input externo
    const insertData = {
        ...data,
        salon_id: salonId
    } as Database['public']['Tables'][TableName]['Insert']

    const typedClientInsert = supabase as {} as SupabaseClientWrapper
    const result = await typedClientInsert
        .from(tableName as string)
        .insert(insertData)
        .select()
        .single()
        
    const { data: resultData, error } = result as { data: T | null; error: Error | null }

    return {
        data: resultData as T,
        error,
        success: !error && result !== null
    }
}

/**
 * Update com validação de tenant.
 * 
 * Segurança:
 * - salon_id na cláusula WHERE garante operação apenas no tenant correto
 * - RLS fornece validação adicional no banco de dados
 * - Impede atualização de registros de outros tenants mesmo com ID válido
 * 
 * @param tableName - Nome da tabela no Supabase
 * @param id - ID do registro a ser atualizado
 * @param data - Dados para atualização (sem salon_id ou id)
 * @returns Resultado da operação com dados atualizados ou erro
 */
export async function updateWithTenant<
    TableName extends keyof Database['public']['Tables'],
    T = Database['public']['Tables'][TableName]['Row']
>(
    tableName: TableName,
    id: string,
    data: Omit<Database['public']['Tables'][TableName]['Update'], 'salon_id' | 'id'>
): Promise<DataOperationResult<T>> {
    const supabase = createClient()

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

    const updateData = {
        ...data,
        updated_at: new Date().toISOString()
    } as Database['public']['Tables'][TableName]['Update']

    const typedClientUpdate = supabase as {} as SupabaseClientWrapper
    // salon_id na cláusula WHERE previne cross-tenant updates
    const result = await typedClientUpdate
        .from(tableName as string)
        .update(updateData)
        .eq('id', id)
        .eq('salon_id', salonId)
        .select()
        .single()
        
    const { data: resultData, error } = result as { data: T | null; error: Error | null }

    return {
        data: resultData as T,
        error,
        success: !error && result !== null
    }
}

/**
 * Delete com validação de tenant.
 * 
 * Segurança:
 * - salon_id na cláusula WHERE garante deleção apenas no tenant correto
 * - RLS fornece validação adicional no banco de dados
 * - Impede deleção de registros de outros tenants mesmo com ID válido
 * 
 * @param tableName - Nome da tabela no Supabase
 * @param id - ID do registro a ser deletado
 * @returns Resultado da operação
 */
export async function deleteWithTenant<TableName extends keyof Database['public']['Tables']>(
    tableName: TableName,
    id: string
): Promise<{ error: Error | null; success: boolean }> {
    const supabase = createClient()

    let salonId: string
    try {
        salonId = await getTrustedSalonId()
    } catch (err) {
        return {
            error: err instanceof Error ? err : new Error('Failed to get tenant context'),
            success: false
        }
    }

    const typedClientDelete = supabase as {} as SupabaseClientWrapper
    const result = await typedClientDelete
        .from(tableName as string)
        .delete()
        .eq('id', id)
        .eq('salon_id', salonId)
        
    const { error } = result as { error: Error | null }

    return {
        error,
        success: !error
    }
}

/**
 * Select com escopo de tenant automático.
 * 
 * Segurança:
 * - salon_id automaticamente aplicado ao filtro
 * - RLS fornece validação adicional no banco de dados
 * 
 * @param tableName - Nome da tabela no Supabase
 * @param options - Opções de query (select, order, limit)
 * @returns Resultado da operação com dados ou erro
 */
export async function selectWithTenant<T extends TenantScopedEntity>(
    tableName: string,
    options?: {
        select?: string
        orderBy?: { column: string; ascending?: boolean }
        limit?: number
        filters?: Array<{ column: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'; value: unknown }>
    }
): Promise<DataOperationResult<T[]>> {
    const supabase = createClient()

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

    const typedClientSelect = supabase as {} as SupabaseClientWrapper
    let query = typedClientSelect
        .from(tableName as string)
        .select(options?.select || '*')
        .eq('salon_id', salonId)

    // Aplicar filtros adicionais
    if (options?.filters) {
        for (const filter of options.filters) {
            query = query[filter.operator](filter.column, filter.value)
        }
    }

    // Aplicar ordenação
    if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    // Aplicar limite
    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const result = await query
    const { data, error } = result as { data: T[] | null; error: Error | null }

    return {
        data,
        error,
        success: !error && result !== null
    }
}

/**
 * Seleciona um único registro por ID com validação de tenant.
 * 
 * @param tableName - Nome da tabela no Supabase
 * @param id - ID do registro
 * @param select - Campos a selecionar (padrão: '*')
 * @returns Resultado da operação
 */
export async function selectOneWithTenant<T extends TenantScopedEntity>(
    tableName: string,
    id: string,
    select?: string
): Promise<DataOperationResult<T>> {
    const supabase = createClient()

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

    const typedClientOne = supabase as {} as SupabaseClientWrapper
    const result = await typedClientOne
        .from(tableName as string)
        .select(select || '*')
        .eq('id', id)
        .eq('salon_id', salonId)
        .single()
        
    const { data, error } = result as { data: T | null; error: Error | null }

    return {
        data,
        error,
        success: !error && result !== null
    }
}
