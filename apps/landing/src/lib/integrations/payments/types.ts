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

export interface CheckoutPreferenceRequest {
  title: string
  amount: number
  referenceId: string
  customerEmail: string
  customerName: string
  isAnnual?: boolean // Define se permite parcelamento (se true)
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
   * Gera um link de Checkout (Preference)
   */
  createCheckoutPreference?(request: CheckoutPreferenceRequest): Promise<string>

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
