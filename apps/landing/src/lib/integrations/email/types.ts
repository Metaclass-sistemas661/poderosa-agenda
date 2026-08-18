export interface EmailPayload {
  to: string | string[]
  from: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

export interface EmailProvider {
  initialize(apiKey: string): void
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>
}
