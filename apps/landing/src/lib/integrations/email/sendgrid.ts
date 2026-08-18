import { log } from '@/lib/observability/logger'
import { EmailProvider, EmailPayload } from './types'

export class SendGridProvider implements EmailProvider {
  private apiKey: string = ''

  initialize(apiKey: string): void {
    this.apiKey = apiKey
  }

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) throw new Error('SendGrid is not initialized')

    const to = Array.isArray(payload.to) 
      ? payload.to.map(email => ({ email }))
      : [{ email: payload.to }]

    const content = []
    if (payload.text) content.push({ type: 'text/plain', value: payload.text })
    if (payload.html) content.push({ type: 'text/html', value: payload.html })

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to }],
          from: { email: payload.from },
          subject: payload.subject,
          content,
          reply_to: payload.replyTo ? { email: payload.replyTo } : undefined
        })
      })

      // SendGrid returns 202 Accepted on success without a JSON body
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.[0]?.message || 'SendGrid API Error')
      }

      const messageId = response.headers.get('x-message-id') || 'unknown'
      log.info('Email sent successfully via SendGrid', { messageId })
      
      return { success: true, messageId }
    } catch (error: any) {
      log.error('Failed to send email via SendGrid', error)
      return { success: false, error: error.message }
    }
  }
}
