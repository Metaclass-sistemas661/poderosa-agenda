import { PaymentGateway } from './types'
import { AsaasGateway } from './asaas'

export type GatewayProvider = 'asaas'

export function createPaymentGateway(provider: GatewayProvider, accessToken: string): PaymentGateway {
  let gateway: PaymentGateway

  switch (provider) {
    case 'asaas':
      gateway = new AsaasGateway()
      break
    default:
      throw new Error(`Unsupported payment gateway: ${provider}`)
  }

  gateway.initialize(accessToken)
  return gateway
}

export * from './types'
export * from './asaas'
