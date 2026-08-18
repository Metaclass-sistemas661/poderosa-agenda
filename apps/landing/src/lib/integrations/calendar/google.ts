import { logger } from '@/lib/observability/logger'

export interface GoogleCalendarEvent {
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string // ISO string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
}

export class GoogleCalendarClient {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private accessToken?: string

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || ''
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  /**
   * Gera a URL para o usuário autenticar com o Google
   */
  getAuthUrl(state: string) {
    const scopes = ['https://www.googleapis.com/auth/calendar.events']
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    
    url.searchParams.append('client_id', this.clientId)
    url.searchParams.append('redirect_uri', this.redirectUri)
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('scope', scopes.join(' '))
    url.searchParams.append('access_type', 'offline')
    url.searchParams.append('prompt', 'consent')
    url.searchParams.append('state', state) // Usado para passar o salon_id

    return url.toString()
  }

  /**
   * Troca o código de autorização pelos tokens (Access e Refresh)
   */
  async exchangeCodeForTokens(code: string) {
    const url = 'https://oauth2.googleapis.com/token'
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to exchange code')
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      }
    } catch (error: any) {
      logger.error('Google OAuth Exchange Error', error)
      throw error
    }
  }

  /**
   * Cria um evento no calendário
   */
  async createEvent(event: GoogleCalendarEvent) {
    if (!this.accessToken) throw new Error('Access token is missing')

    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create calendar event')
      }

      logger.info('Google Calendar Event created', { eventId: data.id })
      return { success: true, eventId: data.id }
    } catch (error: any) {
      logger.error('Failed to create Google Calendar Event', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Atualiza um evento no calendário
   */
  async updateEvent(eventId: string, event: GoogleCalendarEvent) {
    if (!this.accessToken) throw new Error('Access token is missing')

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update calendar event')
      }

      return { success: true }
    } catch (error: any) {
      logger.error('Failed to update Google Calendar Event', error, { eventId })
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove um evento
   */
  async deleteEvent(eventId: string) {
    if (!this.accessToken) throw new Error('Access token is missing')

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete calendar event')
      }

      return { success: true }
    } catch (error: any) {
      logger.error('Failed to delete Google Calendar Event', error, { eventId })
      return { success: false, error: error.message }
    }
  }
}
