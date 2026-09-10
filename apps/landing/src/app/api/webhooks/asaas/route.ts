import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/observability/logger'
import { render } from '@react-email/render'
import { resend, EMAIL_FROM } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

// Constantes de ambiente
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || ''
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Utilitário para gerar senhas temporárias seguras
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(req: Request) {
  try {
    // 1. Validação de Segurança (Authentication Token do Webhook Asaas)
    const asaasToken = req.headers.get('asaas-access-token')
    if (!ASAAS_WEBHOOK_TOKEN || asaasToken !== ASAAS_WEBHOOK_TOKEN) {
      log.warn('[WEBHOOK_ASAAS] Unauthorized attempt or missing ASAAS_WEBHOOK_TOKEN', { 
        ip: req.headers.get('x-forwarded-for') 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lê e converte o corpo da requisição (Payload do Asaas)
    const payload = await req.json()
    const { event, payment } = payload

    log.info('[WEBHOOK_ASAAS] Received payload', { event, paymentId: payment?.id })

    // Se não for um pagamento confirmado, ignora de forma segura
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ received: true, status: 'ignored_event' })
    }

    const supabaseAdmin = createAdminClient()
    const externalId = payment.id
    const requestId = payment.externalReference

    if (!requestId) {
      log.error('[WEBHOOK_ASAAS] Missing externalReference (requestId) in payment', { paymentId: payment.id })
      return NextResponse.json({ error: 'Missing externalReference' }, { status: 400 })
    }

    // 2. Idempotência: Checa se já processou esse Webhook
    const { data: existingWebhook } = await supabaseAdmin
      .from('payment_webhooks')
      .select('id, status')
      .eq('external_id', externalId)
      .eq('provider', 'asaas')
      .single()

    if (existingWebhook && existingWebhook.status === 'processed') {
      log.info('[WEBHOOK_ASAAS] Webhook already processed', { externalId })
      return NextResponse.json({ received: true, status: 'already_processed' })
    }

    // Salva ou atualiza o webhook como 'processing'
    await supabaseAdmin.from('payment_webhooks').upsert({
      external_id: externalId,
      provider: 'asaas',
      status: 'processing',
      event_type: event,
      raw_payload: payload,
      access_request_id: requestId,
      signature_valid: true
    }, { onConflict: 'provider, external_id' })

    // 3. Localiza a Solicitação (Access Request)
    const { data: request, error: reqError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      log.error('[WEBHOOK_ASAAS] Access request not found', { requestId })
      await supabaseAdmin.from('payment_webhooks').update({ status: 'failed', processing_error: 'Request not found' }).eq('external_id', externalId).eq('provider', 'asaas')
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Se já não estiver aguardando pagamento ou pendente, ignora para evitar duplicação de tenant
    if (request.status !== 'awaiting_payment' && request.status !== 'pending') {
      log.info('[WEBHOOK_ASAAS] Request not in awaiting_payment state', { requestId, currentStatus: request.status })
      await supabaseAdmin.from('payment_webhooks').update({ status: 'ignored' }).eq('external_id', externalId).eq('provider', 'asaas')
      return NextResponse.json({ received: true, status: 'ignored_state' })
    }

    // 4. Criação do Usuário Auth
    const tempPassword = generateTemporaryPassword()
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: request.owner_name,
        role: 'superadmin' // Set as standard tenant owner role initially
      }
    })

    if (authError || !authUser.user) {
      log.error('[WEBHOOK_ASAAS] Failed to create auth user', { authError })
      await supabaseAdmin.from('payment_webhooks').update({ status: 'failed', processing_error: authError?.message }).eq('external_id', externalId).eq('provider', 'asaas')
      return NextResponse.json({ error: 'Auth provisioning failed' }, { status: 500 })
    }

    const userId = authUser.user.id

    // 5. Provisionamento do Tenant (Chama a RPC de forma atômica e transacional)
    const { data: provisionResult, error: provisionError } = await supabaseAdmin.rpc('provision_tenant', {
      p_request_id: requestId,
      p_auth_user_id: userId,
      p_actor_id: userId // O sistema/próprio usuário sendo o ator da criação
    })

    if (provisionError) {
      log.error('[WEBHOOK_ASAAS] Failed to call provision_tenant RPC', { provisionError, requestId })
      await supabaseAdmin.from('payment_webhooks').update({ status: 'failed', processing_error: provisionError.message }).eq('external_id', externalId).eq('provider', 'asaas')
      return NextResponse.json({ error: 'Database provisioning failed' }, { status: 500 })
    }

    // Atualiza os dados de admin_users do novo admin criado pelo RPC para forçar mudança de senha e rastrear provisionamento
    if (provisionResult && provisionResult.admin_user_id) {
      await supabaseAdmin.from('admin_users').update({
        must_change_password: true,
        provisioned_at: new Date().toISOString(),
        provisioned_by_request_id: requestId
      }).eq('id', provisionResult.admin_user_id)
    }

    // Atualiza tracking no access_requests
    await supabaseAdmin.from('access_requests').update({
      payment_id: payment.id,
      payment_status: 'approved',
      payment_method: payment.billingType,
      payment_amount: payment.value,
      paid_at: new Date().toISOString(),
      provisioned_salon_id: provisionResult?.salon_id,
      provisioned_user_id: userId
    }).eq('id', requestId)

    // 6. Envio do E-mail de Boas Vindas com Senha Temporária
    try {
      const emailHtml = await render(WelcomeEmail({
        salonName: request.salon_name,
        ownerName: request.owner_name,
        loginUrl: `${NEXT_PUBLIC_SITE_URL}/auth/login`,
        temporaryPassword: tempPassword
      }))

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: request.email,
        subject: `Bem-vindo(a) à Poderosa Agenda - Seu acesso foi liberado! 🎉`,
        html: emailHtml
      })

      if (result.error) {
        log.error('[WEBHOOK_ASAAS] Failed to send welcome email', { error: result.error })
      } else {
        log.info('[WEBHOOK_ASAAS] Welcome email sent successfully', { emailId: result.data?.id })
      }
    } catch (emailErr) {
      log.error('[WEBHOOK_ASAAS] Exception while sending welcome email', { emailErr })
    }

    // Marca webhook como processado
    await supabaseAdmin.from('payment_webhooks').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('external_id', externalId).eq('provider', 'asaas')

    log.info('[WEBHOOK_ASAAS] Provisioning completed successfully', { requestId, salonId: provisionResult?.salon_id })

    // 7. Retorna 200 OK para o Asaas entender que processamos com sucesso
    return NextResponse.json({ success: true, salonId: provisionResult?.salon_id })

  } catch (error: any) {
    log.error('[WEBHOOK_ASAAS] Fatal error processing webhook', { error: error.message })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
