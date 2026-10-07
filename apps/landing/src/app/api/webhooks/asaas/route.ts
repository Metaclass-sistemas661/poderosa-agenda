import { NextResponse } from 'next/server'
import { randomInt, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/observability/logger'
import { render } from '@react-email/render'
import { resend, EMAIL_FROM } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAID_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'])
const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'])
const PROVISIONABLE = new Set(['pending', 'awaiting_payment', 'payment_confirmed', 'provisioning', 'failed'])

type Admin = ReturnType<typeof createAdminClient>

/** Comparação em tempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Senha temporária com CSPRNG, garantindo todas as classes de caracteres. */
function generateTemporaryPassword(length = 14): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%*']
  const all = sets.join('')
  const chars = sets.map(s => s[randomInt(s.length)])
  while (chars.length < length) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/** Confirma o pagamento direto na API do Asaas (não confia apenas no payload). */
async function verifyPaymentWithAsaas(paymentId: string) {
  let token = process.env.ASAAS_ACCESS_TOKEN || ''
  if (token && !token.startsWith('$')) token = '$' + token
  const base = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'
  const res = await fetch(`${base}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { access_token: token },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Asaas verification failed: HTTP ${res.status}`)
  return (await res.json()) as { id: string; status: string; value: number; externalReference: string | null; billingType: string }
}

async function findAuthUserIdByEmail(admin: Admin, email: string): Promise<string | null> {
  const target = email.toLowerCase()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email?.toLowerCase() === target)
    if (hit) return hit.id
    if (data.users.length < 200) return null
  }
  return null
}

async function markWebhook(admin: Admin, externalId: string, patch: Record<string, unknown>) {
  const { error } = await admin.from('payment_webhooks').update({ ...patch, updated_at: new Date().toISOString() })
    .eq('provider', 'asaas').eq('external_id', externalId)
  if (error) log.error('[WEBHOOK_ASAAS] Failed to update payment_webhooks', error as unknown as Error, { externalId })
}

async function markRequestFailure(admin: Admin, requestId: string, message: string) {
  await admin.from('access_requests').update({ provisioning_error: message, updated_at: new Date().toISOString() }).eq('id', requestId)
}

export async function POST(req: Request) {
  // ── 1. Autenticação ───────────────────────────────────────────────────────
  const expected = process.env.ASAAS_WEBHOOK_TOKEN || ''
  const received = req.headers.get('asaas-access-token') || ''
  if (!expected) {
    log.error('[WEBHOOK_ASAAS] ASAAS_WEBHOOK_TOKEN not configured on server', undefined, {})
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (!received || !safeEqual(received, expected)) {
    log.warn('[WEBHOOK_ASAAS] Unauthorized', { reason: received ? 'token_mismatch' : 'token_missing', ip: req.headers.get('x-forwarded-for') })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { event, payment } = payload ?? {}
  log.info('[WEBHOOK_ASAAS] Received', { event, eventId: payload?.id, paymentId: payment?.id })

  if (!PAID_EVENTS.has(event) || !payment?.id) {
    return NextResponse.json({ received: true, status: 'ignored_event' })
  }

  const admin = createAdminClient()
  const externalId: string = payment.id

  // ── 2. Idempotência + registro de auditoria ──────────────────────────────
  const { data: existing } = await admin.from('payment_webhooks').select('status')
    .eq('provider', 'asaas').eq('external_id', externalId).maybeSingle()
  if (existing?.status === 'processed') {
    return NextResponse.json({ received: true, status: 'already_processed' })
  }

  const requestId: string | null = payment.externalReference || null
  const { error: upsertErr } = await admin.from('payment_webhooks').upsert({
    external_id: externalId,
    provider: 'asaas',
    status: 'processing',
    event_type: event,
    raw_payload: payload,
    access_request_id: requestId,
    signature_valid: true,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: req.headers.get('user-agent'),
  }, { onConflict: 'provider,external_id' })
  if (upsertErr) {
    log.error('[WEBHOOK_ASAAS] Failed to persist webhook', upsertErr as unknown as Error, { externalId })
    return NextResponse.json({ error: 'Persistence failed' }, { status: 500 })
  }

  if (!requestId) {
    // Pagamento não originado do onboarding (ex.: outros links da conta). Não é erro.
    await markWebhook(admin, externalId, { status: 'processed', processing_error: 'no_external_reference', processed_at: new Date().toISOString() })
    return NextResponse.json({ received: true, status: 'not_onboarding_payment' })
  }

  // ── 3. Verificação do pagamento na fonte (Asaas) ─────────────────────────
  let verified
  try {
    verified = await verifyPaymentWithAsaas(externalId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await markWebhook(admin, externalId, { status: 'failed', processing_error: msg })
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 502 })
  }
  if (!PAID_STATUSES.has(verified.status) || verified.externalReference !== requestId) {
    const msg = `Payment not valid at source (status=${verified.status}, ref=${verified.externalReference})`
    await markWebhook(admin, externalId, { status: 'failed', processing_error: msg })
    log.warn('[WEBHOOK_ASAAS] ' + msg, { externalId, requestId })
    return NextResponse.json({ received: true, status: 'payment_not_valid' })
  }

  // ── 4. Solicitação ───────────────────────────────────────────────────────
  const { data: request, error: reqError } = await admin.from('access_requests').select('*').eq('id', requestId).maybeSingle()
  if (reqError || !request) {
    await markWebhook(admin, externalId, { status: 'failed', processing_error: 'access_request_not_found' })
    return NextResponse.json({ received: true, status: 'request_not_found' })
  }
  if (request.status === 'approved' && request.provisioned_salon_id) {
    await markWebhook(admin, externalId, { status: 'processed', processing_error: 'already_provisioned', processed_at: new Date().toISOString() })
    return NextResponse.json({ received: true, status: 'already_provisioned' })
  }
  if (!PROVISIONABLE.has(request.status)) {
    await markWebhook(admin, externalId, { status: 'failed', processing_error: `invalid_state:${request.status}` })
    return NextResponse.json({ received: true, status: 'invalid_state' })
  }

  // ── 5. Usuário Auth (idempotente) ────────────────────────────────────────
  const tempPassword = generateTemporaryPassword()
  let userId: string
  let createdNow = false
  {
    const { data, error } = await admin.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: request.owner_name, role: 'admin' },
    })
    if (data?.user) {
      userId = data.user.id
      createdNow = true
    } else {
      // Usuário já existe (retentativa anterior) -> reaproveita e redefine a senha
      const existingId = await findAuthUserIdByEmail(admin, request.email).catch(() => null)
      if (!existingId) {
        const msg = `auth_create_failed: ${error?.message}`
        await markWebhook(admin, externalId, { status: 'failed', processing_error: msg })
        await markRequestFailure(admin, requestId, msg)
        return NextResponse.json({ error: 'Auth provisioning failed' }, { status: 500 })
      }
      userId = existingId
      const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password: tempPassword, email_confirm: true })
      if (pwErr) {
        const msg = `auth_password_reset_failed: ${pwErr.message}`
        await markWebhook(admin, externalId, { status: 'failed', processing_error: msg })
        await markRequestFailure(admin, requestId, msg)
        return NextResponse.json({ error: 'Auth provisioning failed' }, { status: 500 })
      }
    }
  }

  // ── 6. Provisionamento atômico (salão + admin + status) ──────────────────
  const { data: rpcData, error: rpcError } = await admin.rpc('provision_tenant' as any, {
    p_request_id: requestId,
    p_auth_user_id: userId,
    p_actor_id: userId,
    p_payment: { id: verified.id, billingType: verified.billingType, value: verified.value, event },
  } as any)

  if (rpcError) {
    log.error('[WEBHOOK_ASAAS] provision_tenant failed', rpcError as unknown as Error, { requestId })
    if (createdNow) {
      const { error: delErr } = await admin.auth.admin.deleteUser(userId)
      if (delErr) log.error('[WEBHOOK_ASAAS] Rollback failed (orphan auth user)', delErr as unknown as Error, { userId })
    }
    const msg = `provision_failed: ${rpcError.message}`
    await markWebhook(admin, externalId, { status: 'failed', processing_error: msg })
    await markRequestFailure(admin, requestId, msg)
    return NextResponse.json({ error: 'Provisioning failed' }, { status: 500 })
  }
  const result = rpcData as unknown as { salon_id?: string; already_provisioned?: boolean }

  // ── 7. E-mail com senha temporária (com fallback para outbox) ────────────
  if (!result?.already_provisioned) {
    const subject = 'Bem-vindo(a) à Poderosa Agenda - Seu acesso foi liberado! 🎉'
    let html = ''
    try {
      html = await render(WelcomeEmail({
        salonName: request.salon_name,
        ownerName: request.owner_name,
        loginUrl: `${NEXT_PUBLIC_SITE_URL}/auth/login`,
        temporaryPassword: tempPassword,
      }))
      const sent = await resend.emails.send({ from: EMAIL_FROM, to: request.email, subject, html })
      if (sent.error) throw new Error(sent.error.message)
      log.info('[WEBHOOK_ASAAS] Welcome email sent', { emailId: sent.data?.id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('[WEBHOOK_ASAAS] Welcome email failed, queued in outbox', err instanceof Error ? err : undefined, { msg })
      if (html) {
        await admin.from('email_outbox').insert({ to_email: request.email, subject, html_body: html, status: 'pending', attempts: 0, last_error: msg })
      }
      await markRequestFailure(admin, requestId, `welcome_email_failed: ${msg}`)
    }
  }

  await markWebhook(admin, externalId, { status: 'processed', processing_error: null, processed_at: new Date().toISOString() })
  log.info('[WEBHOOK_ASAAS] Provisioning completed', { requestId, salonId: result?.salon_id })
  return NextResponse.json({ success: true, salonId: result?.salon_id })
}
