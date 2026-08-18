import { log } from '@/lib/observability/logger'
import { EmailProvider, EmailPayload } from './types'

export class ResendProvider implements EmailProvider {
  private apiKey: string = ''

  initialize(apiKey: string): void {
    this.apiKey = apiKey
  }

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) throw new Error('Resend is not initialized')

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: payload.from,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: payload.replyTo
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Resend API Error')
      }

      log.info('Email sent successfully via Resend', { messageId: data.id })
      return { success: true, messageId: data.id }
    } catch (error: any) {
      log.error('Failed to send email via Resend', error)
      return { success: false, error: error.message }
    }
  }
}
