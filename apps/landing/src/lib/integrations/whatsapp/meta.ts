import { logger } from '@/lib/observability/logger'

export interface WhatsAppMessagePayload {
  to: string
  templateName: string
  languageCode?: string
  components?: Array<{
    type: 'body' | 'header' | 'button'
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time'
      text?: string
    }>
  }>
}

export class MetaWhatsAppClient {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl = 'https://graph.facebook.com/v19.0'

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
  }

  /**
   * Envia uma mensagem baseada em template (necessário para iniciar conversas fora da janela de 24h)
   */
  async sendTemplateMessage(payload: WhatsAppMessagePayload) {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`
    
    // Formatar número (Meta exige formato internacional sem o '+', ex: 5511999999999)
    const formattedPhone = payload.to.replace(/\D/g, '')

    const body = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: payload.templateName,
        language: {
          code: payload.languageCode || 'pt_BR'
        },
        components: payload.components || []
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`)
      }

      logger.info('WhatsApp message sent successfully', {
        to: formattedPhone,
        template: payload.templateName,
        message_id: data.messages?.[0]?.id
      })

      return { success: true, data }
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message', error, {
        to: formattedPhone,
        template: payload.templateName
      })
      return { success: false, error: error.message }
    }
  }

  /**
   * Envia uma mensagem de texto livre (só pode ser usada dentro da janela de atendimento de 24h)
   */
  async sendTextMessage(to: string, text: string) {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`
    const formattedPhone = to.replace(/\D/g, '')

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`)
      }

      return { success: true, data }
    } catch (error: any) {
      logger.error('Failed to send WhatsApp text message', error, { to: formattedPhone })
      return { success: false, error: error.message }
    }
  }
}
