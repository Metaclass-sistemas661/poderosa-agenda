import { PaymentGateway } from './types'
import { AsaasGateway } from './asaas'
import { MercadoPagoGateway } from './mercadopago'

export type GatewayProvider = 'asaas' | 'mercado_pago'

export function createPaymentGateway(provider: GatewayProvider, accessToken: string): PaymentGateway {
  let gateway: PaymentGateway

  switch (provider) {
    case 'asaas':
      gateway = new AsaasGateway()
      break
    case 'mercado_pago':
      gateway = new MercadoPagoGateway()
      break
    default:
      throw new Error(`Unsupported payment gateway: ${provider}`)
  }

  gateway.initialize(accessToken)
  return gateway
}

export * from './types'
export * from './asaas'
export * from './mercadopago'
