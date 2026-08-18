// ============================================================================
// CLIENT ACTIONS — ENTERPRISE-GRADE SERVER ACTIONS FOR CLIENTS
// ============================================================================
// Server Actions para operações CRUD de clientes com validação e audit logging.
// ============================================================================

'use server'

import {
    createAction,
    success,
    failure,
    insertWithTenantAction,
    updateWithTenantAction,
    deleteWithTenantAction,
    existsInTenant,
    type ActionResult
} from './index'

import {
    createClientSchema,
    updateClientSchema,
    deleteSchema,
    validateInput,
    type CreateClientInput,
    type UpdateClientInput,
    type DeleteInput
} from '@/lib/validation/schemas'

import type { Client } from '@/lib/database/types'

// ============================================================================
// CREATE CLIENT
// ============================================================================

export const createClientAction = createAction<CreateClientInput, Client>({
    operationName: 'CREATE_CLIENT',
    targetTable: 'clients',
    allowedRoles: ['admin', 'receptionist', 'professional']
}, async (ctx, input) => {
    // 1. Validar input
    const validation = validateInput(createClientSchema, input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'Dados inválidos', ctx.requestId, validation.errors)
    }

    // 2. Verificar duplicatas (email ou phone)
    if (validation.data.email) {
        const { data: existingByEmail } = await ctx.supabase
            .from('clients')
            .select('id')
            .eq('salon_id', ctx.tenant.salonId)
            .eq('email', validation.data.email)
            .single()

        if (existingByEmail) {
            return failure('CONFLICT', 'Já existe um cliente com este email', ctx.requestId, { field: 'email' })
        }
    }

    if (validation.data.phone) {
        const { data: existingByPhone } = await ctx.supabase
            .from('clients')
            .select('id')
            .eq('salon_id', ctx.tenant.salonId)
            .eq('phone', validation.data.phone)
            .single()

        if (existingByPhone) {
            return failure('CONFLICT', 'Já existe um cliente com este telefone', ctx.requestId, { field: 'phone' })
        }
    }

    // 3. Inserir cliente
    const { data: client, error } = await insertWithTenantAction<Client>(
        ctx,
        'clients',
        {
            ...validation.data,
            total_visits: 0,
            last_visit: null
        }
    )

    if (error || !client) {
        console.error('[CREATE_CLIENT] Database error:', error)
        return failure('DATABASE_ERROR', 'Erro ao criar cliente', ctx.requestId)
    }

    return success(client, ctx.requestId)
})

// ============================================================================
// UPDATE CLIENT
// ============================================================================

export const updateClientAction = createAction<UpdateClientInput, Client>({
    operationName: 'UPDATE_CLIENT',
    targetTable: 'clients',
    allowedRoles: ['admin', 'receptionist', 'professional']
}, async (ctx, input) => {
    // 1. Validar input
    const validation = validateInput(updateClientSchema, input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'Dados inválidos', ctx.requestId, validation.errors)
    }

    // 2. Verificar se cliente existe no tenant
    const exists = await existsInTenant(ctx, 'clients', validation.data.id)
    if (!exists) {
        return failure('NOT_FOUND', 'Cliente não encontrado', ctx.requestId)
    }

    // 3. Verificar duplicatas (se alterando email/phone)
    if (validation.data.email) {
        const { data: existingByEmail } = await ctx.supabase
            .from('clients')
            .select('id')
            .eq('salon_id', ctx.tenant.salonId)
            .eq('email', validation.data.email)
            .neq('id', validation.data.id)
            .single()

        if (existingByEmail) {
            return failure('CONFLICT', 'Já existe outro cliente com este email', ctx.requestId, { field: 'email' })
        }
    }

    if (validation.data.phone) {
        const { data: existingByPhone } = await ctx.supabase
            .from('clients')
            .select('id')
            .eq('salon_id', ctx.tenant.salonId)
            .eq('phone', validation.data.phone)
            .neq('id', validation.data.id)
            .single()

        if (existingByPhone) {
            return failure('CONFLICT', 'Já existe outro cliente com este telefone', ctx.requestId, { field: 'phone' })
        }
    }

    // 4. Atualizar cliente
    const { id, ...updateData } = validation.data
    const { data: client, error } = await updateWithTenantAction<Client>(
        ctx,
        'clients',
        id,
        updateData
    )

    if (error || !client) {
        console.error('[UPDATE_CLIENT] Database error:', error)
        return failure('DATABASE_ERROR', 'Erro ao atualizar cliente', ctx.requestId)
    }

    return success(client, ctx.requestId)
})

// ============================================================================
// DELETE CLIENT
// ============================================================================

export const deleteClientAction = createAction<DeleteInput, { deleted: boolean }>({
    operationName: 'DELETE_CLIENT',
    targetTable: 'clients',
    allowedRoles: ['admin']
}, async (ctx, input) => {
    // 1. Validar input
    const validation = validateInput(deleteSchema, input)
    if (!validation.success) {
        return failure('VALIDATION_ERROR', 'ID inválido', ctx.requestId, validation.errors)
    }

    // 2. Verificar se cliente existe no tenant
    const exists = await existsInTenant(ctx, 'clients', validation.data.id)
    if (!exists) {
        return failure('NOT_FOUND', 'Cliente não encontrado', ctx.requestId)
    }

    // 3. Verificar se há agendamentos futuros
    const { data: futureAppointments } = await ctx.supabase
        .from('appointments')
        .select('id')
        .eq('salon_id', ctx.tenant.salonId)
        .eq('client_id', validation.data.id)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .limit(1)

    if (futureAppointments && futureAppointments.length > 0) {
        return failure('CONFLICT', 'Cliente possui agendamentos futuros. Cancele os agendamentos antes de excluir.', ctx.requestId)
    }

    // 4. Deletar cliente
    const { error } = await deleteWithTenantAction(ctx, 'clients', validation.data.id)

    if (error) {
        console.error('[DELETE_CLIENT] Database error:', error)
        return failure('DATABASE_ERROR', 'Erro ao excluir cliente', ctx.requestId)
    }

    return success({ deleted: true }, ctx.requestId)
})

// ============================================================================
// GET CLIENT BY ID
// ============================================================================

export const getClientByIdAction = createAction<{ id: string }, Client>({
    operationName: 'GET_CLIENT',
    targetTable: 'clients'
}, async (ctx, input) => {
    const { data: client, error } = await ctx.supabase
        .from('clients')
        .select('*')
        .eq('id', input.id)
        .eq('salon_id', ctx.tenant.salonId)
        .single()

    if (error || !client) {
        return failure('NOT_FOUND', 'Cliente não encontrado', ctx.requestId)
    }

    return success(client as Client, ctx.requestId)
})

// ============================================================================
// LIST CLIENTS
// ============================================================================

interface ListClientsInput {
    search?: string
    orderBy?: 'name' | 'created_at' | 'last_visit' | 'total_visits'
    ascending?: boolean
    limit?: number
    offset?: number
}

export const listClientsAction = createAction<ListClientsInput, { clients: Client[]; total: number }>({
    operationName: 'LIST_CLIENTS',
    targetTable: 'clients'
}, async (ctx, input) => {
    let query = ctx.supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('salon_id', ctx.tenant.salonId)

    // Busca por nome, email ou telefone
    if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,email.ilike.%${input.search}%,phone.ilike.%${input.search}%`)
    }

    // Ordenação
    const orderColumn = input.orderBy || 'name'
    query = query.order(orderColumn, { ascending: input.ascending ?? true })

    // Paginação
    const limit = Math.min(input.limit || 50, 100)
    const offset = input.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data: clients, error, count } = await query

    if (error) {
        console.error('[LIST_CLIENTS] Database error:', error)
        return failure('DATABASE_ERROR', 'Erro ao listar clientes', ctx.requestId)
    }

    return success(
        { clients: (clients || []) as Client[], total: count || 0 },
        ctx.requestId
    )
})