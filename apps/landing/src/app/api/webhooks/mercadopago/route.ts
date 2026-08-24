/**
 * ============================================================================
 * MERCADO PAGO WEBHOOK - IPN (Instant Payment Notification)
 * ============================================================================
 * Enterprise-grade webhook handler for Mercado Pago payment notifications.
 * 
 * Features:
 * - HMAC signature validation
 * - Idempotency (prevents duplicate processing)
 * - Detailed audit logging
 * - Automatic tenant provisioning on payment confirmation
 * 
 * Mercado Pago IPN Documentation:
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import crypto from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

interface MercadoPagoWebhookPayload {
    id: number
    live_mode: boolean
    type: string
    date_created: string
    user_id: number
    api_version: string
    action: string
    data: {
        id: string
    }
}

interface PaymentDetails {
    id: number
    status: string
    status_detail: string
    external_reference: string | null
    transaction_amount: number
    currency_id: string
    payment_method_id: string
    payment_type_id: string
    date_approved: string | null
    date_created: string
    payer: {
        email: string
        first_name: string | null
        last_name: string | null
        identification: {
            type: string
            number: string
        } | null
    }
    metadata: Record<string, unknown>
}

interface ProvisioningStep {
    step: string
    status: 'started' | 'success' | 'failed' | 'skipped'
    startedAt: Date
    completedAt?: Date
    inputData?: Record<string, unknown>
    outputData?: Record<string, unknown>
    errorMessage?: string
    errorStack?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || ''
const MAX_PROVISIONING_ATTEMPTS = 3

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates the HMAC signature from Mercado Pago
 */
function validateSignature(
    xSignature: string | null,
    xRequestId: string | null,
    dataId: string,
    secret: string
): boolean {
    if (!xSignature || !secret) {
        console.warn('[MP_WEBHOOK] Missing signature or secret, skipping validation')
        return true // Skip validation if not configured (dev mode)
    }

    try {
        // Parse x-signature header
        // Format: ts=<timestamp>,v1=<signature>
        const parts = xSignature.split(',')
        const tsMatch = parts.find(p => p.startsWith('ts='))
        const v1Match = parts.find(p => p.startsWith('v1='))

        if (!tsMatch || !v1Match) {
            console.error('[MP_WEBHOOK] Invalid signature format')
            return false
        }

        const ts = tsMatch.replace('ts=', '')
        const receivedSignature = v1Match.replace('v1=', '')

        // Build manifest string
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

        // Calculate expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(manifest)
            .digest('hex')

        // Timing-safe comparison
        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedSignature),
            Buffer.from(expectedSignature)
        )

        if (!isValid) {
            console.error('[MP_WEBHOOK] Signature mismatch', {
                received: receivedSignature.substring(0, 10) + '...',
                expected: expectedSignature.substring(0, 10) + '...'
            })
        }

        return isValid
    } catch (error) {
        console.error('[MP_WEBHOOK] Signature validation error:', error)
        return false
    }
}

/**
 * Fetches payment details from Mercado Pago API
 */
async function fetchPaymentDetails(paymentId: string): Promise<PaymentDetails | null> {
    try {
        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[MP_WEBHOOK] Failed to fetch payment:', {
                status: response.status,
                body: errorText
            })
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('[MP_WEBHOOK] Error fetching payment details:', error)
        return null
    }
}

/**
 * Generates a cryptographically secure temporary password
 */
function generateTemporaryPassword(): string {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    const randomBytes = crypto.randomBytes(length)
    let password = ''

    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length]
    }

    // Ensure at least one of each type
    const ensureChars = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'abcdefghijklmnopqrstuvwxyz',
        '0123456789',
        '!@#$%'
    ]

    for (let i = 0; i < ensureChars.length; i++) {
        const charSet = ensureChars[i]
        const randomIndex = crypto.randomInt(charSet.length)
        const positionIndex = crypto.randomInt(password.length)
        password = password.substring(0, positionIndex) +
            charSet[randomIndex] +
            password.substring(positionIndex + 1)
    }

    return password
}

/**
 * Logs a provisioning step to the database
 */
async function logProvisioningStep(
    supabase: ReturnType<typeof createAdminClient>,
    requestId: string,
    step: ProvisioningStep
): Promise<void> {
    try {
        await supabase.from('provisioning_logs').insert({
            access_request_id: requestId,
            step: step.step,
            status: step.status,
            input_data: step.inputData || null,
            output_data: step.outputData || null,
            error_message: step.errorMessage || null,
            error_stack: step.errorStack || null,
            started_at: step.startedAt.toISOString(),
            completed_at: step.completedAt?.toISOString() || null,
            duration_ms: step.completedAt
                ? step.completedAt.getTime() - step.startedAt.getTime()
                : null
        })
    } catch (error) {
        console.error('[MP_WEBHOOK] Failed to log provisioning step:', error)
    }
}

// ============================================================================
// MAIN PROVISIONING FUNCTION
// ============================================================================

/**
 * Complete tenant provisioning after payment confirmation
 * 
 * Steps:
 * 1. Validate payment & access request
 * 2. Create Auth user with temporary password
 * 3. Create Salon record
 * 4. Create Admin User record (owner role)
 * 5. Send Welcome Email with credentials
 * 6. Update access request status
 */
async function completeProvisioning(
    supabase: ReturnType<typeof createAdminClient>,
    requestId: string,
    payment: PaymentDetails
): Promise<{ success: boolean; error?: string; userId?: string; salonId?: string }> {

    const steps: ProvisioningStep[] = []
    let currentStep: ProvisioningStep | null = null

    const startStep = (name: string, input?: Record<string, unknown>): ProvisioningStep => {
        currentStep = {
            step: name,
            status: 'started',
            startedAt: new Date(),
            inputData: input
        }
        return currentStep
    }

    const completeStep = (output?: Record<string, unknown>) => {
        if (currentStep) {
            currentStep.status = 'success'
            currentStep.completedAt = new Date()
            currentStep.outputData = output
            steps.push({ ...currentStep })
            logProvisioningStep(supabase, requestId, currentStep)
        }
    }

    const failStep = (error: Error | string) => {
        if (currentStep) {
            currentStep.status = 'failed'
            currentStep.completedAt = new Date()
            currentStep.errorMessage = typeof error === 'string' ? error : error.message
            currentStep.errorStack = error instanceof Error ? error.stack : undefined
            steps.push({ ...currentStep })
            logProvisioningStep(supabase, requestId, currentStep)
        }
    }

    try {
        // ========================================
        // STEP 1: Validate & Lock Access Request
        // ========================================
        startStep('validate_request', { requestId })

        // Fetch and lock the access request
        const { data: request, error: fetchError } = await supabase
            .from('access_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchError || !request) {
            failStep(`Access request not found: ${fetchError?.message}`)
            return { success: false, error: 'Access request not found' }
        }

        // Check if already provisioned
        if (request.status === 'approved' && request.provisioned_salon_id) {
            completeStep({ skipped: true, reason: 'Already provisioned' })
            return {
                success: true,
                userId: request.provisioned_user_id,
                salonId: request.provisioned_salon_id
            }
        }

        // Check max attempts
        if (request.provisioning_attempts >= MAX_PROVISIONING_ATTEMPTS) {
            failStep(`Max provisioning attempts (${MAX_PROVISIONING_ATTEMPTS}) exceeded`)
            return { success: false, error: 'Max provisioning attempts exceeded' }
        }

        // Update to provisioning status
        await supabase
            .from('access_requests')
            .update({
                status: 'provisioning',
                provisioning_attempts: (request.provisioning_attempts || 0) + 1
            })
            .eq('id', requestId)

        completeStep({ email: request.email, salonName: request.salon_name })

        // ========================================
        // STEP 2: Create Auth User
        // ========================================
        startStep('create_auth_user', { email: request.email })

        const temporaryPassword = generateTemporaryPassword()

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: request.email,
            password: temporaryPassword,
            email_confirm: true, // Auto-confirm since they paid
            user_metadata: {
                name: request.owner_name,
                salon_name: request.salon_name,
                provisioned_from_request: requestId,
                must_change_password: true
            }
        })

        if (authError || !authUser.user) {
            // Check if user already exists
            if (authError?.message?.includes('already been registered')) {
                // Fetch existing user
                const { data: existingUsers } = await supabase.auth.admin.listUsers()
                const existingUser = existingUsers?.users?.find(u => u.email === request.email)

                if (existingUser) {
                    completeStep({
                        userId: existingUser.id,
                        existing: true,
                        note: 'User already existed, proceeding with existing account'
                    })
                    // Continue with existing user
                    // We'll need to handle this case in the next steps
                } else {
                    failStep(authError)
                    return { success: false, error: `Failed to create auth user: ${authError.message}` }
                }
            } else {
                failStep(authError || new Error('Unknown auth error'))
                return { success: false, error: `Failed to create auth user: ${authError?.message}` }
            }
        } else {
            completeStep({ userId: authUser.user.id })
        }

        const userId = authUser?.user?.id ||
            (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.email === request.email)?.id

        if (!userId) {
            return { success: false, error: 'Could not determine user ID' }
        }

        // ========================================
        // STEP 3: Create Salon Record
        // ========================================
        startStep('create_salon', {
            name: request.salon_name,
            city: request.city,
            state: request.state
        })

        const { data: salon, error: salonError } = await supabase
            .from('salons')
            .insert({
                name: request.salon_name,
                phone: request.phone,
                city: request.city,
                state: request.state,
                address_zip: request.address_zip,
                address_street: request.address_street,
                address_number: request.address_number,
                address_neighborhood: request.address_neighborhood,
                plan: 'starter',
                status: 'active',
                owner_id: userId
            })
            .select('id')
            .single()

        if (salonError || !salon) {
            failStep(salonError || new Error('Failed to create salon'))

            // Rollback: Delete auth user
            await supabase.auth.admin.deleteUser(userId)

            return { success: false, error: `Failed to create salon: ${salonError?.message}` }
        }

        completeStep({ salonId: salon.id })

        // ========================================
        // STEP 4: Create Admin User Record
        // ========================================
        startStep('create_admin_user', {
            userId,
            salonId: salon.id,
            role: 'owner'
        })

        const { error: adminError } = await supabase
            .from('admin_users')
            .insert({
                user_id: userId,
                salon_id: salon.id,
                name: request.owner_name,
                email: request.email,
                role: 'owner',
                must_change_password: true,
                provisioned_at: new Date().toISOString(),
                provisioned_by_request_id: requestId
            })

        if (adminError) {
            failStep(adminError)

            // Rollback: Delete salon and auth user
            await supabase.from('salons').delete().eq('id', salon.id)
            await supabase.auth.admin.deleteUser(userId)

            return { success: false, error: `Failed to create admin user: ${adminError.message}` }
        }

        completeStep({ success: true })

        // ========================================
        // STEP 5: Send Welcome Email
        // ========================================
        startStep('send_welcome_email', {
            email: request.email,
            salonName: request.salon_name
        })

        try {
            // Import dynamically to avoid circular dependencies
            const { render } = await import('@react-email/render')
            const WelcomeEmail = (await import('@/emails/WelcomeEmail')).default
            const { resend, EMAIL_FROM } = await import('@/lib/resend')

            const emailHtml = await render(WelcomeEmail({
                salonName: request.salon_name,
                ownerName: request.owner_name,
                temporaryPassword: temporaryPassword,
                loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://poderosaagenda.com.br'}/login`
            }))

            const result = await resend.emails.send({
                from: EMAIL_FROM,
                to: request.email,
                subject: '🎉 Bem-vindo à Poderosa Agenda! Suas credenciais de acesso',
                html: emailHtml
            })

            if (result.data?.id) {
                completeStep({ emailId: result.data.id })
            } else {
                // Non-blocking: Queue for retry via outbox
                await supabase.from('email_outbox').insert({
                    to_email: request.email,
                    subject: '🎉 Bem-vindo à Poderosa Agenda! Suas credenciais de acesso',
                    html_body: emailHtml,
                    status: 'pending',
                    attempts: 0
                })
                completeStep({ queued: true, note: 'Email queued for retry' })
            }
        } catch (emailError: unknown) {
            // Non-blocking error - user is created, email can be retried
            const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error'
            console.error('[MP_WEBHOOK] Email send failed (non-blocking):', emailError)
            currentStep!.status = 'failed'
            currentStep!.completedAt = new Date()
            currentStep!.errorMessage = errorMessage
            steps.push({ ...currentStep! })
            logProvisioningStep(supabase, requestId, currentStep!)
        }

        // ========================================
        // STEP 6: Update Access Request Status
        // ========================================
        startStep('finalize_request', { requestId })

        const { error: finalizeError } = await supabase
            .from('access_requests')
            .update({
                status: 'approved',
                provisioned_salon_id: salon.id,
                provisioned_user_id: userId,
                provisioning_error: null
            })
            .eq('id', requestId)

        if (finalizeError) {
            failStep(finalizeError)
            // Don't rollback here - the user/salon are created successfully
            console.error('[MP_WEBHOOK] Failed to finalize access request:', finalizeError)
        } else {
            completeStep({
                finalStatus: 'approved',
                salonId: salon.id,
                userId
            })
        }

        console.log('[MP_WEBHOOK] Provisioning completed successfully', {
            requestId,
            userId,
            salonId: salon.id,
            steps: steps.map(s => ({ step: s.step, status: s.status }))
        })

        return {
            success: true,
            userId,
            salonId: salon.id
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined

        console.error('[MP_WEBHOOK] Provisioning failed with unexpected error:', error)

        if (currentStep && currentStep.status === 'started') {
            failStep(error instanceof Error ? error : new Error(errorMessage))
        }

        // Update access request with error
        await supabase
            .from('access_requests')
            .update({
                status: 'failed',
                provisioning_error: errorMessage
            })
            .eq('id', requestId)

        return {
            success: false,
            error: errorMessage
        }
    }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now()
    const supabase = createAdminClient()

    // Get headers
    const headersList = headers()
    const xSignature = headersList.get('x-signature')
    const xRequestId = headersList.get('x-request-id')
    const contentType = headersList.get('content-type')
    const userAgent = headersList.get('user-agent')
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    console.log('[MP_WEBHOOK] Received webhook', {
        xRequestId,
        hasSignature: !!xSignature,
        contentType,
        ip: ipAddress
    })

    try {
        // Parse body
        const body = await request.json() as MercadoPagoWebhookPayload

        console.log('[MP_WEBHOOK] Payload received', {
            id: body.id,
            type: body.type,
            action: body.action,
            dataId: body.data?.id
        })

        // ========================================
        // 1. VALIDATE SIGNATURE
        // ========================================
        const signatureValid = validateSignature(
            xSignature,
            xRequestId,
            body.data?.id?.toString() || body.id?.toString(),
            MERCADOPAGO_WEBHOOK_SECRET
        )

        if (!signatureValid && MERCADOPAGO_WEBHOOK_SECRET) {
            console.error('[MP_WEBHOOK] Invalid signature - rejecting webhook')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        // ========================================
        // 2. CHECK IDEMPOTENCY
        // ========================================
        const externalId = body.data?.id?.toString() || body.id?.toString()

        const { data: existingWebhook, error: idempotencyError } = await supabase
            .from('payment_webhooks')
            .select('id, status, processed_at')
            .eq('provider', 'mercado_pago')
            .eq('external_id', externalId)
            .single()

        if (existingWebhook && existingWebhook.status === 'processed') {
            console.log('[MP_WEBHOOK] Duplicate webhook, already processed', {
                externalId,
                processedAt: existingWebhook.processed_at
            })
            return NextResponse.json({
                status: 'duplicate',
                message: 'Webhook already processed'
            })
        }

        // ========================================
        // 3. STORE WEBHOOK FOR AUDIT
        // ========================================
        const { data: webhookRecord, error: insertError } = await supabase
            .from('payment_webhooks')
            .upsert({
                external_id: externalId,
                provider: 'mercado_pago',
                status: 'processing',
                event_type: body.type,
                raw_payload: body,
                ip_address: ipAddress,
                user_agent: userAgent,
                signature_valid: signatureValid,
                processing_attempts: (existingWebhook?.status === 'failed' ? 1 : 0) + 1
            }, {
                onConflict: 'provider,external_id',
                ignoreDuplicates: false
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[MP_WEBHOOK] Failed to store webhook:', insertError)
        }

        // ========================================
        // 4. PROCESS BASED ON EVENT TYPE
        // ========================================

        // Only process payment notifications
        if (body.type !== 'payment') {
            console.log('[MP_WEBHOOK] Ignoring non-payment event:', body.type)

            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', webhookRecord?.id)

            return NextResponse.json({
                status: 'ignored',
                message: `Event type ${body.type} not handled`
            })
        }

        // ========================================
        // 5. FETCH PAYMENT DETAILS FROM MP API
        // ========================================
        const paymentId = body.data.id
        const payment = await fetchPaymentDetails(paymentId)

        if (!payment) {
            console.error('[MP_WEBHOOK] Could not fetch payment details')

            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'failed',
                    processing_error: 'Could not fetch payment details from Mercado Pago'
                })
                .eq('id', webhookRecord?.id)

            return NextResponse.json(
                { error: 'Could not fetch payment details' },
                { status: 500 }
            )
        }

        console.log('[MP_WEBHOOK] Payment details fetched', {
            paymentId: payment.id,
            status: payment.status,
            statusDetail: payment.status_detail,
            externalReference: payment.external_reference,
            amount: payment.transaction_amount
        })

        // ========================================
        // 6. ONLY PROCESS APPROVED PAYMENTS
        // ========================================
        if (payment.status !== 'approved') {
            console.log('[MP_WEBHOOK] Payment not approved, storing status only', {
                status: payment.status,
                detail: payment.status_detail
            })

            // If we have an external_reference (access_request_id), update it
            if (payment.external_reference) {
                await supabase
                    .from('access_requests')
                    .update({
                        payment_id: payment.id.toString(),
                        payment_status: payment.status,
                        payment_raw_data: payment
                    })
                    .eq('id', payment.external_reference)
            }

            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'processed',
                    processed_at: new Date().toISOString(),
                    access_request_id: payment.external_reference || null
                })
                .eq('id', webhookRecord?.id)

            return NextResponse.json({
                status: 'stored',
                message: `Payment status ${payment.status} recorded`
            })
        }

        // ========================================
        // 7. GET ACCESS REQUEST ID
        // ========================================
        const accessRequestId = payment.external_reference

        if (!accessRequestId) {
            console.error('[MP_WEBHOOK] No external_reference in payment - cannot link to access request')

            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'failed',
                    processing_error: 'No external_reference in payment'
                })
                .eq('id', webhookRecord?.id)

            return NextResponse.json(
                { error: 'No access request reference in payment' },
                { status: 400 }
            )
        }

        // ========================================
        // 8. UPDATE ACCESS REQUEST WITH PAYMENT INFO
        // ========================================
        await supabase
            .from('access_requests')
            .update({
                payment_id: payment.id.toString(),
                payment_status: payment.status,
                payment_method: payment.payment_type_id,
                payment_amount: payment.transaction_amount,
                paid_at: payment.date_approved || new Date().toISOString(),
                payment_raw_data: payment,
                status: 'payment_confirmed'
            })
            .eq('id', accessRequestId)

        // Update webhook with access_request link
        await supabase
            .from('payment_webhooks')
            .update({ access_request_id: accessRequestId })
            .eq('id', webhookRecord?.id)

        // ========================================
        // 9. EXECUTE PROVISIONING
        // ========================================
        console.log('[MP_WEBHOOK] Starting provisioning for access request:', accessRequestId)

        const provisioningResult = await completeProvisioning(
            supabase,
            accessRequestId,
            payment
        )

        // ========================================
        // 10. FINALIZE WEBHOOK STATUS
        // ========================================
        const duration = Date.now() - startTime

        if (provisioningResult.success) {
            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', webhookRecord?.id)

            console.log('[MP_WEBHOOK] Webhook processed successfully', {
                duration: `${duration}ms`,
                accessRequestId,
                userId: provisioningResult.userId,
                salonId: provisioningResult.salonId
            })

            return NextResponse.json({
                status: 'success',
                message: 'Payment processed and tenant provisioned',
                salonId: provisioningResult.salonId
            })
        } else {
            await supabase
                .from('payment_webhooks')
                .update({
                    status: 'failed',
                    processing_error: provisioningResult.error
                })
                .eq('id', webhookRecord?.id)

            console.error('[MP_WEBHOOK] Provisioning failed', {
                duration: `${duration}ms`,
                accessRequestId,
                error: provisioningResult.error
            })

            // Return 200 to prevent MP from retrying - we'll handle retries internally
            return NextResponse.json({
                status: 'failed',
                error: provisioningResult.error
            })
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined

        console.error('[MP_WEBHOOK] Unhandled error:', {
            error: errorMessage,
            stack: errorStack
        })

        return NextResponse.json(
            { error: 'Internal server error', details: errorMessage },
            { status: 500 }
        )
    }
}

// ============================================================================
// GET HANDLER - Health Check
// ============================================================================

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'mercadopago-webhook',
        timestamp: new Date().toISOString()
    })
}