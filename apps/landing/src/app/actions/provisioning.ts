'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redeApi, DEFAULT_PLAN_PRICE, DEFAULT_PLAN_TITLE } from '@/lib/rede'
import { render } from '@react-email/render'
import ApprovalPaymentEmail from '@/emails/ApprovalPaymentEmail'
import { resend } from '@/lib/resend'

const EMAIL_FROM = 'Poderosa Agenda <contato@poderosaagenda.com.br>';

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
// F01 (P0): Approve Request & Generate Payment Link
// ============================================================================

/**
 * Enterprise-grade Server Action for Approving a Request.
 * 
 * New Orchestration pattern (Saga):
 *   1. Authorize (server-side)
 *   2. Pre-validate request status
 *   3. Generate Mercado Pago Checkout Preference (Link)
 *   4. Update Request status to 'awaiting_payment'
 *   5. Send React Email with the payment link
 */
export async function approveAndProvisionSalon(requestId: string): Promise<ProvisionResult> {
    try {
        // 1. Authorization: Only superadmins can approve
        const actor = await requireServerSuperadmin()

        const supabase = createClient()
        const supabaseAdmin = createAdminClient()

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

        // 3. Generate Rede Checkout Link (Stub)
        const paymentLink = await redeApi.generateCheckoutLink({
            amount: DEFAULT_PLAN_PRICE,
            referenceId: requestId,
            customerEmail: request.email,
            customerName: request.owner_name,
        });

        if (!paymentLink) {
            console.error('[PROVISIONING] Failed to generate Rede link');
            return { success: false, error: 'Falha ao gerar link de pagamento na Rede.' }
        }

        // 4. Update request status
        // Using admin client because standard RLS might block this specific state transition
        const { error: updateError } = await supabaseAdmin
            .from('access_requests')
            .update({ status: 'awaiting_payment' })
            .eq('id', requestId)

        if (updateError) {
            console.error('[PROVISIONING] DB update failed:', updateError)
            return { success: false, error: 'Falha ao atualizar o status no banco de dados. Verifique a constraint de status.' }
        }

        // 5. Send Highly Stylized React Email (Hybrid: Sync + Outbox Fallback)
        // Enterprise pattern: Try to send immediately, fall back to outbox if it fails
        const emailSubject = 'Sua conta na Poderosa Agenda foi aprovada! 🎉';
        let emailSent = false;

        try {
            const emailHtml = await render(ApprovalPaymentEmail({
                salonName: request.salon_name,
                paymentLink: paymentLink,
                planPrice: DEFAULT_PLAN_PRICE.toFixed(2).replace('.', ',')
            }));

            // First, try to send directly via Resend (immediate delivery)
            try {
                const result = await resend.emails.send({
                    from: EMAIL_FROM,
                    to: request.email,
                    subject: emailSubject,
                    html: emailHtml
                });

                if (result.data?.id) {
                    emailSent = true;
                    console.log('[PROVISIONING] Email sent successfully via Resend:', result.data.id);

                    // Also insert into outbox as 'sent' for audit trail
                    await supabaseAdmin
                        .from('email_outbox')
                        .insert({
                            to_email: request.email,
                            subject: emailSubject,
                            html_body: emailHtml,
                            status: 'sent',
                            attempts: 1
                        });
                } else if (result.error) {
                    console.error('[PROVISIONING] Resend API error:', result.error);
                    throw new Error(result.error.message || 'Resend send failed');
                }
            } catch (sendError: any) {
                // Direct send failed - fallback to outbox for cron processing
                console.error('[PROVISIONING] Direct email send failed, falling back to outbox:', sendError);

                const { error: outboxError } = await supabaseAdmin
                    .from('email_outbox')
                    .insert({
                        to_email: request.email,
                        subject: emailSubject,
                        html_body: emailHtml,
                        status: 'pending',
                        attempts: 0,
                        last_error: sendError.message || 'Direct send failed'
                    });

                if (outboxError) {
                    console.error('[PROVISIONING] Failed to queue email in outbox:', outboxError);
                } else {
                    console.log('[PROVISIONING] Email queued in outbox for retry');
                }
            }
        } catch (emailErr: any) {
            console.error('[PROVISIONING] Email rendering/processing failed:', emailErr);
        }

        revalidatePath('/admin/solicitacoes')
        revalidatePath('/admin/saloes')
        revalidatePath('/admin')
        return { success: true }
    } catch (err: any) {
        console.error('[PROVISIONING] Fatal error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message === 'UNAUTHENTICATED' || message === 'NO_TENANT_ACCESS') {
            return { success: false, error: 'Acesso não autorizado.' }
        }
        if (message.includes('FORBIDDEN')) {
            return { success: false, error: 'Permissão insuficiente. Apenas superadmins podem aprovar.' }
        }
        return { success: false, error: err.message || 'Erro interno no servidor' }
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
