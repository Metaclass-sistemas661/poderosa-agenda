'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Types
// ============================================================================

interface ProvisionResult {
    success: boolean
    error?: string
}

interface SuperadminContext {
    userId: string
    email: string
}

// ============================================================================
// Internal: Server-side Superadmin Authorization
// ============================================================================

/**
 * Validates that the current user is a superadmin using the SERVER client.
 * 
 * IMPORTANT: This replaces requireSuperadmin() from authorization.ts which 
 * uses the browser client (createBrowserClient). Server Actions MUST use 
 * the server client (cookie-based SSR) for authentication.
 * 
 * The Security Owner's requireSuperadmin() is designed for client components.
 * This function serves the same purpose for Server Actions exclusively.
 */
async function requireServerSuperadmin(): Promise<SuperadminContext> {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('UNAUTHENTICATED')
    }

    const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, role, email')
        .eq('user_id', user.id)
        .single()

    if (adminError || !adminUser) {
        throw new Error('NO_TENANT_ACCESS')
    }

    if (adminUser.role !== 'superadmin') {
        throw new Error('FORBIDDEN: superadmin role required')
    }

    return {
        userId: adminUser.user_id,
        email: adminUser.email
    }
}

// ============================================================================
// F01 (P0): Approve & Provision Salon
// ============================================================================

/**
 * Enterprise-grade Server Action for Provisioning a Tenant.
 * 
 * Orchestration pattern (Saga):
 *   1. Authorize (server-side)
 *   2. Pre-validate request status
 *   3. Create Auth Identity (Supabase Auth Admin API)
 *   4. Execute DB Transaction (RPC provision_tenant)
 *   5. On DB failure → Compensate by deleting Auth Identity
 * 
 * Idempotency: Guaranteed by the RPC's FOR UPDATE lock + status guard.
 * Concurrency: DB row lock prevents double-provisioning.
 * Recovery: Auth user is deleted if DB transaction fails.
 */
export async function approveAndProvisionSalon(requestId: string): Promise<ProvisionResult> {
    // Track auth user ID for compensation in case of failure
    let createdAuthUserId: string | null = null

    try {
        // 1. Authorization: Only superadmins can approve
        const actor = await requireServerSuperadmin()

        const supabaseAdmin = createAdminClient()
        const supabase = createClient()

        // 2. Pre-check: Ensure request exists and is pending
        const { data: request, error: reqError } = await supabase
            .from('access_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (reqError || !request) {
            return { success: false, error: 'Solicitação não encontrada.' }
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Esta solicitação já foi processada.' }
        }

        // 3. Provision Auth Identity via Admin Client
        //    Using inviteUserByEmail: creates the user AND sends an invitation email
        //    so they can set their own password. No default passwords.
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            request.email,
            {
                data: {
                    name: request.owner_name,
                    salon_name: request.salon_name
                }
            }
        )

        if (inviteError || !inviteData?.user) {
            console.error('[PROVISIONING] Auth invite failed:', inviteError)
            return { success: false, error: 'Falha ao criar conta de autenticação. Verifique se o email já está cadastrado.' }
        }

        createdAuthUserId = inviteData.user.id

        // 4. Execute the DB Transaction (RPC)
        //    This atomically creates: salon, admin_user, updates request status, writes audit log
        const { data: rpcResult, error: rpcError } = await supabase.rpc('provision_tenant', {
            p_request_id: requestId,
            p_auth_user_id: createdAuthUserId,
            p_actor_id: actor.userId
        })

        // 5. Compensation: If DB fails, rollback the Auth identity
        if (rpcError) {
            console.error('[PROVISIONING] RPC failed:', rpcError.message)

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
            if (deleteError) {
                console.error('[PROVISIONING] CRITICAL: Compensation failed. Orphaned auth user:', createdAuthUserId)
            } else {
                console.log('[PROVISIONING] Compensation successful. Auth user deleted:', createdAuthUserId)
            }

            // Differentiate between idempotency guard and real errors
            if (rpcError.message?.includes('already processed')) {
                return { success: false, error: 'Esta solicitação já foi processada anteriormente.' }
            }

            return { success: false, error: `Erro RPC: ${rpcError.message || JSON.stringify(rpcError)}` }
        }

        revalidatePath('/admin/solicitacoes')
        revalidatePath('/admin/saloes')
        revalidatePath('/admin')
        return { success: true }

    } catch (error) {
        // If we created an auth user before the error, compensate
        if (createdAuthUserId) {
            try {
                const supabaseAdmin = createAdminClient()
                await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
                console.log('[PROVISIONING] Exception compensation: Auth user deleted:', createdAuthUserId)
            } catch (compError) {
                console.error('[PROVISIONING] CRITICAL: Exception compensation failed:', compError)
            }
        }

        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'UNAUTHENTICATED' || message === 'NO_TENANT_ACCESS') {
            return { success: false, error: 'Acesso não autorizado.' }
        }
        if (message.includes('FORBIDDEN')) {
            return { success: false, error: 'Permissão insuficiente. Apenas superadmins podem aprovar.' }
        }

        console.error('[PROVISIONING] Unexpected error:', error)
        return { success: false, error: `Erro Interno: ${message}` }
    }
}

// ============================================================================
// F01: Reject Salon Request
// ============================================================================

/**
 * Server Action for rejecting an access request.
 * 
 * Flow: Validate → Update status → Audit log → Done
 * No Auth identity or tenant is created for rejected requests.
 */
export async function rejectSalonRequest(requestId: string): Promise<ProvisionResult> {
    try {
        const actor = await requireServerSuperadmin()
        const supabase = createClient()

        // Verify current status (double-check before mutation)
        const { data: request, error: fetchError } = await supabase
            .from('access_requests')
            .select('status')
            .eq('id', requestId)
            .single()

        if (fetchError || !request) {
            return { success: false, error: 'Solicitação não encontrada.' }
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Esta solicitação não está pendente.' }
        }

        // Atomic update with status guard (prevents race conditions)
        const { error: updateError } = await supabase
            .from('access_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', requestId)
            .eq('status', 'pending')

        if (updateError) {
            console.error('[REJECTION] Update failed:', updateError)
            return { success: false, error: 'Erro ao atualizar o banco de dados.' }
        }

        // Audit Log (best-effort, doesn't block the response)
        const { error: auditError } = await supabase.from('audit_logs').insert({
            operation: 'REQUEST_REJECTED',
            user_id: actor.userId,
            target_table: 'access_requests',
            target_id: requestId,
            status: 'SUCCESS',
            created_at: new Date().toISOString()
        })
        if (auditError) {
            console.error('[REJECTION] Audit log failed (non-blocking):', auditError)
        }

        revalidatePath('/admin/solicitacoes')
        revalidatePath('/admin')
        return { success: true }

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'UNAUTHENTICATED' || message.includes('FORBIDDEN') || message === 'NO_TENANT_ACCESS') {
            return { success: false, error: 'Acesso não autorizado.' }
        }
        console.error('[PROVISIONING] Unexpected error rejecting request:', error)
        return { success: false, error: `Erro Interno: ${message}` }
    }
}

// ============================================================================
// F04 (P1): Manual Tenant Creation (Canonical Pipeline)
// ============================================================================

/**
 * Enterprise-grade Server Action for Manual Tenant Creation.
 * 
 * Reuses the canonical provisioning pipeline by creating an access_request
 * record first, then calling approveAndProvisionSalon.
 * 
 * This ensures a single code path for all tenant provisioning:
 *   - Organic (Landing → Approve) 
 *   - Manual (Super Admin → Create)
 */
export async function createSalonManual(salonData: {
    salon_name: string
    owner_name: string
    email: string
    phone: string
    city: string
    state: string
    professionals: string
}): Promise<ProvisionResult> {
    try {
        await requireServerSuperadmin()
        const supabase = createClient()

        // 1. Create access_request to maintain canonical lifecycle audit trail
        const { data: request, error: reqError } = await supabase
            .from('access_requests')
            .insert({
                salon_name: salonData.salon_name,
                owner_name: salonData.owner_name,
                email: salonData.email,
                phone: salonData.phone,
                city: salonData.city,
                state: salonData.state,
                professionals: salonData.professionals,
                message: '[MANUAL] Criado diretamente pelo Super Admin',
                status: 'pending'
            })
            .select('id')
            .single()

        if (reqError || !request) {
            console.error('[MANUAL_CREATION] Failed to create access request:', reqError)
            return { success: false, error: 'Erro ao criar registro base para o salão.' }
        }

        // 2. Delegate to canonical provisioning pipeline
        return await approveAndProvisionSalon(request.id)

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'UNAUTHENTICATED' || message.includes('FORBIDDEN') || message === 'NO_TENANT_ACCESS') {
            return { success: false, error: 'Acesso não autorizado.' }
        }
        console.error('[MANUAL_CREATION] Unexpected error:', error)
        return { success: false, error: 'Ocorreu um erro interno.' }
    }
}
