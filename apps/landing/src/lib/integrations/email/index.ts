import { EmailProvider } from './types'
import { ResendProvider } from './resend'
import { SendGridProvider } from './sendgrid'

export type EmailProviderType = 'resend' | 'sendgrid'

export function createEmailProvider(providerType: EmailProviderType, apiKey: string): EmailProvider {
  let provider: EmailProvider

  switch (providerType) {
    case 'resend':
      provider = new ResendProvider()
      break
    case 'sendgrid':
      provider = new SendGridProvider()
      break
    default:
      throw new Error(`Unsupported email provider: ${providerType}`)
  }

  provider.initialize(apiKey)
  return provider
}

export * from './types'
export * from './resend'
export * from './sendgrid'
