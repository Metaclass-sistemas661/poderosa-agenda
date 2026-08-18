import { log } from '@/lib/observability/logger'
import { PaymentGateway, PixChargeRequest, PixChargeResponse } from './types'

export class AsaasGateway implements PaymentGateway {
  private apiKey: string = ''
  private baseUrl = 'https://api.asaas.com/v3' // Use sandbox para testes

  initialize(accessToken: string): void {
    this.apiKey = accessToken
  }

  async createPixCharge(request: PixChargeRequest): Promise<PixChargeResponse> {
    if (!this.apiKey) throw new Error('Asaas is not initialized')

    // Asaas requer a criação de um cliente (Customer) antes de gerar cobrança
    // Em produção, isso deve ser cacheado. Simplificado para o exemplo:
    const customer = await this.getOrCreateCustomer(request)

    const dueDate = new Date()
    dueDate.setMinutes(dueDate.getMinutes() + (request.expiresInMinutes || 30))

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value: request.amount,
          dueDate: dueDate.toISOString().split('T')[0],
          description: request.description,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.description || 'Asaas API Error')
      }

      // Buscar o QR Code da cobrança criada
      const qrCodeResponse = await fetch(`${this.baseUrl}/payments/${data.id}/pixQrCode`, {
        method: 'GET',
        headers: { 'access_token': this.apiKey }
      })
      const qrCodeData = await qrCodeResponse.json()

      log.info('Asaas Pix Charge created', { chargeId: data.id })

      return {
        id: data.id,
        qrCode: qrCodeData.encodedImage, // Imagem base64
        qrCodeText: qrCodeData.payload, // Pix Copia e Cola
        expiresAt: qrCodeData.expirationDate,
        gateway: 'asaas'
      }
    } catch (error) {
      log.error('Failed to create Asaas Pix Charge', error as Error)
      throw error
    }
  }

  private async getOrCreateCustomer(request: PixChargeRequest) {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: request.customerName,
        email: request.customerEmail,
        cpfCnpj: request.customerDocument
      })
    })
    return await response.json()
  }

  async checkPaymentStatus(chargeId: string): Promise<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'> {
    const response = await fetch(`${this.baseUrl}/payments/${chargeId}`, {
      method: 'GET',
      headers: { 'access_token': this.apiKey }
    })
    const data = await response.json()
    
    if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') return 'PAID'
    if (data.status === 'OVERDUE') return 'EXPIRED'
    if (data.status === 'REFUNDED') return 'CANCELLED'
    return 'PENDING'
  }

  async handleWebhook(payload: any): Promise<{ chargeId: string; status: 'PAID' | 'EXPIRED' | 'CANCELLED' } | null> {
    if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
      return { chargeId: payload.payment.id, status: 'PAID' }
    }
    return null
  }
}
