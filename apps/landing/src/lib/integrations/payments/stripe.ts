import { log } from '@/lib/observability/logger'
import { PaymentGateway, PixChargeRequest, PixChargeResponse } from './types'

export class StripeGateway implements PaymentGateway {
  private secretKey: string = ''
  private baseUrl = 'https://api.stripe.com/v1'

  initialize(accessToken: string): void {
    this.secretKey = accessToken
  }

  async createPixCharge(request: PixChargeRequest): Promise<PixChargeResponse> {
    if (!this.secretKey) throw new Error('Stripe is not initialized')

    try {
      // Cria um PaymentIntent para Pix no Stripe
      // Nota: Stripe requer valores em centavos
      const amountInCents = Math.round(request.amount * 100)

      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: amountInCents.toString(),
          currency: 'brl',
          'payment_method_types[]': 'pix',
          description: request.description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Stripe API Error')
      }

      // No Stripe, para obter o payload Pix precisamos confirmar o intent
      const confirmResponse = await fetch(`${this.baseUrl}/payment_intents/${data.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      })
      const confirmData = await confirmResponse.json()

      log.info('Stripe Pix Charge created', { chargeId: confirmData.id })

      const pixData = confirmData.next_action?.pix_display_details

      return {
        id: confirmData.id,
        qrCode: pixData?.hosted_instructions_url || '', // Stripe envia uma URL hospedada por padrão em sua API base
        qrCodeText: pixData?.data_string || '', // Copia e Cola
        expiresAt: new Date(pixData?.expires_at * 1000).toISOString(),
        gateway: 'stripe'
      }
    } catch (error) {
      log.error('Failed to create Stripe Pix Charge', error as Error)
      throw error
    }
  }

  async checkPaymentStatus(chargeId: string): Promise<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'> {
    const response = await fetch(`${this.baseUrl}/payment_intents/${chargeId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.secretKey}` }
    })
    const data = await response.json()
    
    if (data.status === 'succeeded') return 'PAID'
    if (data.status === 'canceled') return 'CANCELLED'
    return 'PENDING'
  }

  async handleWebhook(payload: any): Promise<{ chargeId: string; status: 'PAID' | 'EXPIRED' | 'CANCELLED' } | null> {
    if (payload.type === 'payment_intent.succeeded') {
      return { chargeId: payload.data.object.id, status: 'PAID' }
    }
    if (payload.type === 'payment_intent.payment_failed' || payload.type === 'payment_intent.canceled') {
      return { chargeId: payload.data.object.id, status: 'CANCELLED' }
    }
    return null
  }
}
