// ============================================================================
// SERVER ACTIONS — ENTERPRISE-GRADE MUTATION INFRASTRUCTURE
// ============================================================================
// Este módulo fornece a infraestrutura base para todas as Server Actions.
// Inclui autorização, validação, audit logging e tratamento de erros.
// Projetado para escala de 200.000+ clientes com segurança enterprise.
// ============================================================================

'use server'

import { createClient } from '@/lib/supabase/client'
import { getTrustedTenantContext, type TenantContext } from '@/lib/auth/tenant'
import { AuthorizationError } from '@/lib/auth/authorization'
import type { AdminUser } from '@/lib/database/types'
import { mapSupabaseError } from '@/lib/errors/mapper'
import type { DomainErrorCode } from '@/lib/errors/types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Resultado padronizado de Server Action
 */
export interface ActionResult<T = void> {
    success: boolean
    data: T | null
    error: ActionError | null
    /** ID único para rastreamento */
    requestId: string
    /** Timestamp da operação */
    timestamp: string
}

/**
 * Erro estruturado de Server Action
 */
export interface ActionError {
    code: DomainErrorCode
    message: string
    details?: Record<string, unknown>
    /** Campo com erro (para validação) */
    field?: string
}

/**
 * Contexto de execução de Server Action
 */
export interface ActionContext {
    /** Contexto do tenant autenticado */
    tenant: TenantContext
    /** ID único da requisição */
    requestId: string
    /** Timestamp de início */
    startTime: number
    /** Supabase client */
    supabase: ReturnType<typeof createClient>
}

/**
 * Opções de configuração de Server Action
 */
export interface ActionOptions {
    /** Roles permitidas (vazio = qualquer role autenticado) */
    allowedRoles?: AdminUser['role'][]
    /** Requer superadmin */
    requireSuperadmin?: boolean
    /** Nome da operação para audit log */
    operationName: string
    /** Tabela afetada (para audit) */
    targetTable?: string
}

// ============================================================================
// CORE ACTION WRAPPER
// ============================================================================

/**
 * Gera ID único para rastreamento de requisição
 */
function generateRequestId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `req_${timestamp}_${random}`
}

/**
 * Cria resultado de sucesso
 */
export function success<T>(data: T, requestId: string): ActionResult<T> {
    return {
        success: true,
        data,
        error: null,
        requestId,
        timestamp: new Date().toISOString()
    }
}

/**
 * Cria resultado de erro
 */
export function failure(
    code: DomainErrorCode,
    message: string,
    requestId: string,
    details?: Record<string, unknown>
): ActionResult<never> {
    return {
        success: false,
        data: null,
        error: { code, message, details },
        requestId,
        timestamp: new Date().toISOString()
    }
}

/**
 * Wrapper enterprise para Server Actions.
 * Fornece:
 * - Autenticação automática
 * - Autorização por role
 * - Contexto de tenant confiável
 * - Audit logging
 * - Tratamento de erros padronizado
 * - Request ID tracking
 * 
 * @example
 * ```ts
 * export const createClient = createAction({
 *   operationName: 'CREATE_CLIENT',
 *   targetTable: 'clients',
 *   allowedRoles: ['admin', 'receptionist']
 * }, async (ctx, data: CreateClientData) => {
 *   // ctx.tenant contém o contexto confiável
 *   // ctx.supabase está pronto para uso
 *   // Retorne success() ou failure()
 * })
 * ```
 */
export function createAction<TInput, TOutput>(
    options: ActionOptions,
    handler: (ctx: ActionContext, input: TInput) => Promise<ActionResult<TOutput>>
) {
    return async (input: TInput): Promise<ActionResult<TOutput>> => {
        const requestId = generateRequestId()
        const startTime = Date.now()

        try {
            // 1. Obter contexto de tenant confiável
            let tenant: TenantContext
            try {
                tenant = await getTrustedTenantContext()
            } catch (err) {
                if (err instanceof AuthorizationError) {
                    await logAuditEvent({
                        requestId,
                        operation: options.operationName,
                        status: 'UNAUTHORIZED',
                        errorCode: err.code,
                        duration: Date.now() - startTime
                    })
                    return failure('UNAUTHORIZED', err.message, requestId)
                }
                throw err
            }

            // 2. Verificar autorização por role
            if (options.requireSuperadmin && tenant.userRole !== 'superadmin') {
                await logAuditEvent({
                    requestId,
                    operation: options.operationName,
                    userId: tenant.userId,
                    salonId: tenant.salonId,
                    status: 'FORBIDDEN',
                    errorCode: 'REQUIRES_SUPERADMIN',
                    duration: Date.now() - startTime
                })
                return failure('FORBIDDEN', 'Superadmin access required', requestId)
            }

            if (options.allowedRoles && options.allowedRoles.length > 0) {
                if (!options.allowedRoles.includes(tenant.userRole)) {
                    await logAuditEvent({
                        requestId,
                        operation: options.operationName,
                        userId: tenant.userId,
                        salonId: tenant.salonId,
                        status: 'FORBIDDEN',
                        errorCode: 'ROLE_NOT_ALLOWED',
                        metadata: {
                            userRole: tenant.userRole,
                            allowedRoles: options.allowedRoles
                        },
                        duration: Date.now() - startTime
                    })
                    return failure(
                        'FORBIDDEN',
                        `Access denied. Required roles: ${options.allowedRoles.join(', ')}`,
                        requestId
                    )
                }
            }

            // 3. Criar contexto de execução
            const ctx: ActionContext = {
                tenant,
                requestId,
                startTime,
                supabase: createClient()
            }

            // 4. Executar handler
            const result = await handler(ctx, input)

            // 5. Log de sucesso
            await logAuditEvent({
                requestId,
                operation: options.operationName,
                userId: tenant.userId,
                salonId: tenant.salonId,
                targetTable: options.targetTable,
                status: result.success ? 'SUCCESS' : 'FAILED',
                errorCode: result.error?.code,
                duration: Date.now() - startTime
            })

            return result

        } catch (err) {
            // Usa o mapper para transformar qualquer falha técnica, time-out, ou postgrest 
            // em uma UserFacingError limpa, evitando vazamento.
            const mappedError = mapSupabaseError(err, options.operationName)

            await logAuditEvent({
                requestId,
                operation: options.operationName,
                status: 'ERROR',
                errorCode: mappedError.code,
                metadata: {
                    errorMessage: mappedError.message,
                    originalError: err instanceof Error ? err.message : 'Unknown error'
                },
                duration: Date.now() - startTime
            })

            return failure(
                mappedError.code,
                mappedError.message,
                requestId
            )
        }
    }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

interface AuditEvent {
    requestId: string
    operation: string
    userId?: string
    salonId?: string
    targetTable?: string
    targetId?: string
    status: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'ERROR'
    errorCode?: string
    metadata?: Record<string, unknown>
    duration: number
}

/**
 * Log de evento de auditoria.
 * Em produção, isso seria enviado para um sistema de logging externo.
 */
async function logAuditEvent(event: AuditEvent): Promise<void> {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: event.status === 'SUCCESS' ? 'INFO' : 'WARN',
        ...event
    }

    // Em desenvolvimento, log no console
    if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', JSON.stringify(logEntry, null, 2))
    }

    // TODO: Em produção, enviar para sistema de logging externo
    // - Datadog
    // - CloudWatch
    // - Supabase audit_logs table
    // - etc.

    // Exemplo: Salvar em tabela de audit_logs
    try {
        const supabase = createClient()
        const auditData = {
            request_id: event.requestId,
            operation: event.operation,
            user_id: event.userId,
            salon_id: event.salonId,
            target_table: event.targetTable,
            target_id: event.targetId,
            status: event.status,
            error_code: event.errorCode,
            metadata: event.metadata,
            duration_ms: event.duration,
            created_at: new Date().toISOString()
        }
        await (supabase as any).from('audit_logs').insert(auditData)
    } catch {
        // Silenciar erro se tabela não existe ainda
        // Em produção, isso deve ser um alerta
    }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida que um campo obrigatório está presente
 */
export function required<T>(
    value: T | null | undefined,
    fieldName: string
): value is T {
    if (value === null || value === undefined || value === '') {
        return false
    }
    return true
}

/**
 * Cria erro de validação
 */
export function validationError(
    message: string,
    field: string,
    requestId: string
): ActionResult<never> {
    return {
        success: false,
        data: null,
        error: {
            code: 'VALIDATION_ERROR',
            message,
            field
        },
        requestId,
        timestamp: new Date().toISOString()
    }
}

/**
 * Valida múltiplos campos e retorna o primeiro erro
 */
export function validateFields(
    validations: Array<{ condition: boolean; field: string; message: string }>,
    requestId: string
): ActionResult<never> | null {
    for (const { condition, field, message } of validations) {
        if (!condition) {
            return validationError(message, field, requestId)
        }
    }
    return null
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Executa insert com tenant e retorna resultado tipado
 */
export async function insertWithTenantAction<T extends Record<string, unknown>>(
    ctx: ActionContext,
    tableName: string,
    data: Omit<T, 'id' | 'salon_id' | 'created_at' | 'updated_at'>
): Promise<{ data: T | null; error: unknown }> {
    const dataWithTenant = {
        ...data,
        salon_id: ctx.tenant.salonId
    }

    const result = await (ctx.supabase as any)
        .from(tableName)
        .insert(dataWithTenant)
        .select()
        .single()

    return result as { data: T | null; error: unknown }
}

/**
 * Executa update com validação de tenant
 */
export async function updateWithTenantAction<T extends Record<string, unknown>>(
    ctx: ActionContext,
    tableName: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'salon_id' | 'created_at'>>
): Promise<{ data: T | null; error: unknown }> {
    const result = await (ctx.supabase as any)
        .from(tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('salon_id', ctx.tenant.salonId)
        .select()
        .single()

    return result as { data: T | null; error: unknown }
}

/**
 * Executa delete com validação de tenant
 */
export async function deleteWithTenantAction(
    ctx: ActionContext,
    tableName: string,
    id: string
): Promise<{ error: unknown }> {
    const result = await (ctx.supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('salon_id', ctx.tenant.salonId)

    return result as { error: unknown }
}

/**
 * Verifica se registro existe e pertence ao tenant
 */
export async function existsInTenant(
    ctx: ActionContext,
    tableName: string,
    id: string
): Promise<boolean> {
    const { data } = await ctx.supabase
        .from(tableName)
        .select('id')
        .eq('id', id)
        .eq('salon_id', ctx.tenant.salonId)
        .single()

    return data !== null
}