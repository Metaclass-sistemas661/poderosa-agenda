export interface PixChargeRequest {
  amount: number
  description: string
  customerName: string
  customerEmail?: string
  customerDocument?: string // CPF/CNPJ
  expiresInMinutes?: number
}

export interface PixChargeResponse {
  id: string
  qrCode: string
  qrCodeText: string // "Copia e Cola"
  expiresAt: string
  gateway: 'asaas' | 'mercado_pago' | 'stripe'
}

export interface PaymentGateway {
  /**
   * Inicializa o gateway com as credenciais do salão
   */
  initialize(accessToken: string): void

  /**
   * Gera uma cobrança via Pix Dinâmico
   */
  createPixCharge(request: PixChargeRequest): Promise<PixChargeResponse>

  /**
   * Verifica o status de um pagamento
   */
  checkPaymentStatus(chargeId: string): Promise<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'>
  
  /**
   * Processa Webhooks do Gateway
   */
  handleWebhook(payload: any, signature?: string): Promise<{
    chargeId: string
    status: 'PAID' | 'EXPIRED' | 'CANCELLED'
  } | null>
}
