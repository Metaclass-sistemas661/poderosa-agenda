import { log } from '@/lib/observability/logger'
import { PaymentGateway, PixChargeRequest, PixChargeResponse } from './types'

export class MercadoPagoGateway implements PaymentGateway {
  private accessToken: string = ''
  private baseUrl = 'https://api.mercadopago.com/v1'

  initialize(accessToken: string): void {
    this.accessToken = accessToken
  }

  async createPixCharge(request: PixChargeRequest): Promise<PixChargeResponse> {
    if (!this.accessToken) throw new Error('MercadoPago is not initialized')

    const dateOfExpiration = new Date()
    dateOfExpiration.setMinutes(dateOfExpiration.getMinutes() + (request.expiresInMinutes || 30))

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Idempotency-Key': crypto.randomUUID(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_amount: request.amount,
          description: request.description,
          payment_method_id: 'pix',
          payer: {
            email: request.customerEmail || 'cliente@email.com',
            first_name: request.customerName,
          },
          date_of_expiration: dateOfExpiration.toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'MercadoPago API Error')
      }

      log.info('MercadoPago Pix Charge created', { chargeId: data.id })

      return {
        id: String(data.id),
        qrCode: data.point_of_interaction.transaction_data.qr_code_base64,
        qrCodeText: data.point_of_interaction.transaction_data.qr_code,
        expiresAt: data.date_of_expiration,
        gateway: 'mercado_pago'
      }
    } catch (error) {
      log.error('Failed to create MercadoPago Pix Charge', error as Error)
      throw error
    }
  }

  async checkPaymentStatus(chargeId: string): Promise<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'> {
    const response = await fetch(`${this.baseUrl}/payments/${chargeId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    })
    const data = await response.json()
    
    if (data.status === 'approved') return 'PAID'
    if (data.status === 'cancelled') return 'EXPIRED'
    if (data.status === 'refunded') return 'CANCELLED'
    return 'PENDING'
  }

  async handleWebhook(payload: any): Promise<{ chargeId: string; status: 'PAID' | 'EXPIRED' | 'CANCELLED' } | null> {
    // MercadoPago webhooks receive a notification with resource URL, you usually need to fetch it
    // Assuming this handles the webhook after parsing the event
    if (payload.action === 'payment.created' || payload.action === 'payment.updated') {
      const status = await this.checkPaymentStatus(payload.data.id)
      if (status === 'PENDING') return null;
      return { chargeId: String(payload.data.id), status }
    }
    return null
  }
}
