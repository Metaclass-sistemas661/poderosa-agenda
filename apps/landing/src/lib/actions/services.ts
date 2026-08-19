// ============================================================================
// SERVICE ACTIONS — ENTERPRISE-GRADE SERVER ACTIONS FOR SERVICES
// ============================================================================
// Server Actions para operações CRUD de serviços com validação e sanitização.
// P1-APP-001: Migração para Server Actions com tenant resolution server-side.
// ============================================================================

'use server'

import {
    createAction,
    success,
    failure,
    insertWithTenantAction,
    updateWithTenantAction,
    deleteWithTenantAction,
    existsInTenant
} from './index'

import { z } from 'zod'
import { buildSearchOrClause } from '@/lib/search/security'
import { mapSupabaseError } from '@/lib/errors/mapper'

// ============================================================================
// TYPES
// ============================================================================

interface Service {
    id: string
    salon_id: string
    name: string
    description?: string | null
    price: number
    duration: number // minutes
    category?: string | null
    is_active: boolean
    image_url?: string | null
    created_at: string
    updated_at: string
    [key: string]: unknown // Index signature for Record<string, unknown> compatibility
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createServiceSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    description: z.string().max(500).optional().nullable(),
    price: z.number().min(0, 'Preço deve ser positivo'),
    duration: z.number().min(5, 'Duração mínima é 5 minutos').max(480, 'Duração máxima é 8 horas'),
    category: z.string().max(50).optional().nullable(),
    is_active: z.boolean().default(true),
    image_url: z.string().url().optional().nullable()
})

const updateServiceSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    price: z.number().min(0).optional(),
    duration: z.number().min(5).max(480).optional(),
    category: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
    image_url: z.string().url().optional().nullable()
})

type CreateServiceInput = z.infer<typeof createServiceSchema>
type UpdateServiceInput = z.infer<typeof updateServiceSchema>

// ============================================================================
// CREATE SERVICE
// ============================================================================

export const createServiceAction = createAction<CreateServiceInput, Service>({
    operationName: 'CREATE_SERVICE',
    targetTable: 'services',
    allowedRoles: ['admin']
}, async (ctx, input) => {
    const validation = createServiceSchema.safeParse(input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'Dados inválidos', ctx.requestId, validation.error.flatten().fieldErrors)
    }

    // Check for duplicate name in same salon
    const { data: existing } = await ctx.supabase
        .from('services')
        .select('id')
        .eq('salon_id', ctx.tenant.salonId)
        .eq('name', validation.data.name)
        .single()

    if (existing) {
        return failure('CONFLICT', 'Já existe um serviço com este nome', ctx.requestId)
    }

    const { data: service, error } = await insertWithTenantAction<Service>(
        ctx,
        'services',
        validation.data
    )

    if (error || !service) {
        const mappedError = mapSupabaseError(error, 'CREATE_SERVICE')
        return failure(mappedError.code, mappedError.message, ctx.requestId)
    }

    return success(service, ctx.requestId)
})

// ============================================================================
// UPDATE SERVICE
// ============================================================================

export const updateServiceAction = createAction<UpdateServiceInput, Service>({
    operationName: 'UPDATE_SERVICE',
    targetTable: 'services',
    allowedRoles: ['admin']
}, async (ctx, input) => {
    const validation = updateServiceSchema.safeParse(input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'Dados inválidos', ctx.requestId, validation.error.flatten().fieldErrors)
    }

    const exists = await existsInTenant(ctx, 'services', validation.data.id)
    if (!exists) {
        return failure('NOT_FOUND', 'Serviço não encontrado', ctx.requestId)
    }

    // Check for duplicate name if updating name
    if (validation.data.name) {
        const { data: existing } = await ctx.supabase
            .from('services')
            .select('id')
            .eq('salon_id', ctx.tenant.salonId)
            .eq('name', validation.data.name)
            .neq('id', validation.data.id)
            .single()

        if (existing) {
            return failure('CONFLICT', 'Já existe outro serviço com este nome', ctx.requestId)
        }
    }

    const { id, ...updateData } = validation.data
    const { data: service, error } = await updateWithTenantAction<Service>(
        ctx,
        'services',
        id,
        updateData
    )

    if (error || !service) {
        const mappedError = mapSupabaseError(error, 'UPDATE_SERVICE')
        return failure(mappedError.code, mappedError.message, ctx.requestId)
    }

    return success(service, ctx.requestId)
})

// ============================================================================
// DELETE SERVICE
// ============================================================================

export const deleteServiceAction = createAction<{ id: string }, { deleted: boolean }>({
    operationName: 'DELETE_SERVICE',
    targetTable: 'services',
    allowedRoles: ['admin']
}, async (ctx, input) => {
    const idSchema = z.object({ id: z.string().uuid() })
    const validation = idSchema.safeParse(input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'ID inválido', ctx.requestId)
    }

    const exists = await existsInTenant(ctx, 'services', validation.data.id)
    if (!exists) {
        return failure('NOT_FOUND', 'Serviço não encontrado', ctx.requestId)
    }

    // Check for future appointments using this service
    const { data: futureAppointments } = await ctx.supabase
        .from('appointments')
        .select('id')
        .eq('salon_id', ctx.tenant.salonId)
        .eq('service_id', validation.data.id)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .limit(1)

    if (futureAppointments && futureAppointments.length > 0) {
        return failure('CONFLICT', 'Serviço possui agendamentos futuros. Considere desativar em vez de excluir.', ctx.requestId)
    }

    const { error } = await deleteWithTenantAction(ctx, 'services', validation.data.id)

    if (error) {
        const mappedError = mapSupabaseError(error, 'DELETE_SERVICE')
        return failure(mappedError.code, mappedError.message, ctx.requestId)
    }

    return success({ deleted: true }, ctx.requestId)
})

// ============================================================================
// LIST SERVICES
// ============================================================================

interface ListServicesInput {
    search?: string
    category?: string
    isActive?: boolean
    orderBy?: 'name' | 'price' | 'duration' | 'created_at'
    ascending?: boolean
    limit?: number
    offset?: number
}

export const listServicesAction = createAction<ListServicesInput, { services: Service[]; total: number }>({
    operationName: 'LIST_SERVICES',
    targetTable: 'services'
}, async (ctx, input) => {
    let query = ctx.supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('salon_id', ctx.tenant.salonId)

    // P1-SEARCH-001: Sanitized search
    if (input.search && input.search.trim()) {
        const orClause = buildSearchOrClause({
            term: input.search,
            columns: ['name', 'description', 'category']
        })

        if (orClause) {
            query = query.or(orClause)
        }
    }

    // Category filter
    if (input.category) {
        query = query.eq('category', input.category)
    }

    // Active filter
    if (typeof input.isActive === 'boolean') {
        query = query.eq('is_active', input.isActive)
    }

    // Ordering - whitelist
    const allowedOrderColumns = ['name', 'price', 'duration', 'created_at'] as const
    const orderColumn = allowedOrderColumns.includes(input.orderBy as typeof allowedOrderColumns[number])
        ? input.orderBy!
        : 'name'
    query = query.order(orderColumn, { ascending: input.ascending ?? true })

    // Pagination
    const limit = Math.min(Math.max(input.limit || 50, 1), 100)
    const offset = Math.max(input.offset || 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data: services, error, count } = await query

    if (error) {
        const mappedError = mapSupabaseError(error, 'LIST_SERVICES')
        return failure(mappedError.code, mappedError.message, ctx.requestId)
    }

    return success(
        { services: (services || []) as Service[], total: count || 0 },
        ctx.requestId
    )
})

// ============================================================================
// GET SERVICE BY ID
// ============================================================================

export const getServiceByIdAction = createAction<{ id: string }, Service>({
    operationName: 'GET_SERVICE',
    targetTable: 'services'
}, async (ctx, input) => {
    const { data: service, error } = await ctx.supabase
        .from('services')
        .select('*')
        .eq('id', input.id)
        .eq('salon_id', ctx.tenant.salonId)
        .single()

    if (error || !service) {
        return failure('NOT_FOUND', 'Serviço não encontrado', ctx.requestId)
    }

    return success(service as Service, ctx.requestId)
})