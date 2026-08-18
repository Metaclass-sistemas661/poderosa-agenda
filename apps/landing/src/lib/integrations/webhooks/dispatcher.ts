import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/observability/logger'

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
}

export class WebhookDispatcher {
  /**
   * Dispara um webhook para todas as URLs ativas do salão que escutam este evento
   */
  static async dispatch(salonId: string, eventName: string, data: any) {
    const supabase = createClient()

    // 1. Buscar webhooks configurados para o salão e para o evento
    const { data: webhooks, error } = await supabase
      .from('webhooks_outbound')
      .select('id, url, encrypted_secret, events')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .contains('events', [eventName])

    if (error) {
      log.error('Failed to fetch webhooks for dispatch', new Error(error.message), { salonId, eventName })
      return
    }

    if (!webhooks || webhooks.length === 0) return

    const payload: WebhookPayload = {
      event: eventName,
      data,
      timestamp: new Date().toISOString()
    }

    const payloadString = JSON.stringify(payload)

    // 2. Disparar para cada webhook (Em produção, o ideal é jogar para uma fila/worker)
    const promises = webhooks.map(async (webhook) => {
      let status = 'failed'
      let httpStatus = null
      let errorMessage = null

      try {
        // Descriptografar o secret (assumindo que a chave esteja no .env e a função decrypt_secret esteja no banco)
        const encryptionKey = process.env.ENCRYPTION_KEY!
        const { data: decryptedSecret, error: decryptError } = await supabase
          .rpc('decrypt_secret', { p_encrypted: webhook.encrypted_secret, p_key: encryptionKey })

        if (decryptError) throw new Error('Failed to decrypt webhook secret')

        // Gerar assinatura HMAC (Poderosa-Signature)
        const signature = crypto
          .createHmac('sha256', decryptedSecret)
          .update(payloadString)
          .digest('hex')

        // Disparar
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Poderosa-Signature': `sha256=${signature}`
          },
          body: payloadString,
          // timeout de 5 segundos
          signal: AbortSignal.timeout(5000)
        })

        httpStatus = response.status

        if (response.ok) {
          status = 'success'
        } else {
          errorMessage = await response.text()
          throw new Error(`Webhook responded with status ${response.status}`)
        }
      } catch (err: any) {
        log.error('Webhook delivery failed', err, { webhookId: webhook.id, url: webhook.url })
        errorMessage = err.message
      } finally {
        // 3. Registrar o log de entrega (mesmo em falha para retentativa futura)
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_id: webhook.id,
            salon_id: salonId,
            event_type: eventName,
            payload: payload,
            status,
            http_status: httpStatus,
            error_message: errorMessage,
            next_retry_at: status === 'failed' ? new Date(Date.now() + 5 * 60000).toISOString() : null // tentar novamente em 5 min
          })
      }
    })

    await Promise.allSettled(promises)
  }
}
