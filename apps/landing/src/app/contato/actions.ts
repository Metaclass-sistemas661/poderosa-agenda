'use server'

// ============================================================================
// CONTACT FORM SERVER ACTION - ENTERPRISE-GRADE IMPLEMENTATION
// ============================================================================
// Features:
// - Rate limiting por IP
// - Honeypot detection
// - Validação robusta com Zod
// - Persistência via RPC segura
// - Envio de emails (equipe + confirmação)
// - Logging estruturado
// - Error handling completo
// ============================================================================

import { z } from 'zod'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { checkRateLimit, type RateLimitConfig } from '@/lib/rate-limit'
import ContactNotificationEmail from '@/emails/ContactNotificationEmail'
import ContactConfirmationEmail from '@/emails/ContactConfirmationEmail'

// ============================================================================
// TYPES
// ============================================================================

export type ContactFormData = {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  /** Campo honeypot - deve estar vazio */
  website?: string
}

export type ContactFormResult = {
  success: boolean
  message: string
  code?: 'SUCCESS' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'HONEYPOT_DETECTED' | 'DATABASE_ERROR' | 'EMAIL_ERROR' | 'UNKNOWN_ERROR'
  fieldErrors?: {
    name?: string
    email?: string
    phone?: string
    subject?: string
    message?: string
  }
  messageId?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEAM_EMAIL = process.env.CONTACT_FORM_EMAIL || 'contato@poderosaagenda.com.br'
const ENABLE_CONFIRMATION_EMAIL = process.env.CONTACT_FORM_SEND_CONFIRMATION !== 'false'

/** Rate limit: 5 mensagens por hora por IP */
const CONTACT_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowSizeSeconds: 3600, // 1 hora
  identifier: 'contact-form',
  errorMessage: 'Muitas mensagens enviadas. Tente novamente em 1 hora.'
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const VALID_SUBJECTS = ['suporte', 'comercial', 'financeiro', 'outro'] as const
type ValidSubject = typeof VALID_SUBJECTS[number]

const ContactFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)')
    .transform(val => val.trim()),

  email: z.string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .transform(val => val.trim().toLowerCase()),

  phone: z.string()
    .optional()
    .transform(val => val?.trim() || undefined)
    .refine(val => !val || /^[\d\s\-\(\)]+$/.test(val), {
      message: 'Telefone inválido'
    }),

  subject: z.string().refine(
    (val): val is ValidSubject => VALID_SUBJECTS.includes(val as ValidSubject),
    { message: 'Selecione um assunto válido' }
  ),

  message: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(10000, 'Mensagem muito longa (máximo 10.000 caracteres)')
    .transform(val => val.trim()),

  // Honeypot field - deve estar vazio
  website: z.string().optional()
})

// ============================================================================
// HELPER: GET CLIENT IP
// ============================================================================

async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Ordem de prioridade
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headersList.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfIP = headersList.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  return '127.0.0.1'
}

// ============================================================================
// HELPER: GET USER AGENT
// ============================================================================

async function getUserAgent(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('user-agent')
}

// ============================================================================
// HELPER: CREATE SUPABASE CLIENT (SERVICE ROLE)
// ============================================================================

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// HELPER: SEND TEAM NOTIFICATION EMAIL
// ============================================================================

async function sendTeamNotificationEmail(
  messageId: string,
  data: ContactFormData,
  ipAddress: string,
  userAgent: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey || resendApiKey === 're_placeholder') {
      console.warn('[Contact] Resend API key not configured - skipping team email')
      return { success: false, error: 'API_KEY_NOT_CONFIGURED' }
    }

    const emailHtml = await render(
      ContactNotificationEmail({
        messageId,
        senderName: data.name,
        senderEmail: data.email,
        senderPhone: data.phone || null,
        subject: data.subject,
        message: data.message,
        receivedAt: new Date(),
        ipAddress,
        userAgent,
        source: 'landing_page'
      })
    )

    const subjectLabels: Record<string, string> = {
      suporte: '🔧 Suporte',
      comercial: '💼 Comercial',
      financeiro: '💰 Financeiro',
      outro: '📝 Outro'
    }

    const { data: emailData, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: TEAM_EMAIL,
      subject: `[Contato] ${subjectLabels[data.subject] || data.subject} - ${data.name}`,
      html: emailHtml,
      replyTo: data.email
    })

    if (error) {
      console.error('[Contact] Failed to send team email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Contact] Team notification email sent:', emailData?.id)
    return { success: true, emailId: emailData?.id }
  } catch (error) {
    console.error('[Contact] Unexpected error sending team email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// HELPER: SEND CONFIRMATION EMAIL TO USER
// ============================================================================

async function sendConfirmationEmail(
  data: ContactFormData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!ENABLE_CONFIRMATION_EMAIL) {
    return { success: false, error: 'CONFIRMATION_DISABLED' }
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey || resendApiKey === 're_placeholder') {
      console.warn('[Contact] Resend API key not configured - skipping confirmation email')
      return { success: false, error: 'API_KEY_NOT_CONFIGURED' }
    }

    const emailHtml = await render(
      ContactConfirmationEmail({
        name: data.name,
        subject: data.subject,
      })
    )

    const { data: emailData, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject: 'Recebemos sua mensagem - Poderosa Agenda',
      html: emailHtml
    })

    if (error) {
      console.error('[Contact] Failed to send confirmation email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Contact] Confirmation email sent:', emailData?.id)
    return { success: true, emailId: emailData?.id }
  } catch (error) {
    console.error('[Contact] Unexpected error sending confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// MAIN ACTION: SUBMIT CONTACT FORM
// ============================================================================

export async function submitContactForm(data: ContactFormData): Promise<ContactFormResult> {
  const startTime = Date.now()
  const clientIP = await getClientIP()
  const userAgent = await getUserAgent()

  console.log('[Contact] Processing submission from IP:', clientIP)

  // =========================================================================
  // 1. HONEYPOT CHECK
  // =========================================================================
  if (data.website && data.website.trim() !== '') {
    console.warn('[Contact] Honeypot triggered - bot detected', { ip: clientIP })

    // Retorna sucesso falso para não alertar o bot
    return {
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      code: 'HONEYPOT_DETECTED'
    }
  }

  // =========================================================================
  // 2. RATE LIMITING
  // =========================================================================
  const rateLimitResult = checkRateLimit(CONTACT_RATE_LIMIT, { ip: clientIP })

  if (!rateLimitResult.success) {
    console.warn('[Contact] Rate limit exceeded', {
      ip: clientIP,
      remaining: rateLimitResult.remaining,
      retryAfter: rateLimitResult.retryAfter
    })

    return {
      success: false,
      message: CONTACT_RATE_LIMIT.errorMessage || 'Muitas mensagens enviadas. Tente novamente mais tarde.',
      code: 'RATE_LIMIT'
    }
  }

  // =========================================================================
  // 3. VALIDATION
  // =========================================================================
  const validation = ContactFormSchema.safeParse(data)

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {}

    const issues = validation.error.issues || []
    issues.forEach((issue: z.ZodIssue) => {
      const field = String(issue.path[0])
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    })

    console.log('[Contact] Validation failed:', fieldErrors)

    return {
      success: false,
      message: 'Por favor, corrija os erros no formulário.',
      code: 'VALIDATION_ERROR',
      fieldErrors
    }
  }

  const validatedData = validation.data

  // =========================================================================
  // 4. DATABASE PERSISTENCE
  // =========================================================================
  const supabase = createServiceClient()
  let messageId: string | undefined

  if (supabase) {
    try {
      // Tentar usar RPC primeiro (mais seguro)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_contact_message', {
        p_name: validatedData.name,
        p_email: validatedData.email,
        p_subject: validatedData.subject,
        p_message: validatedData.message,
        p_phone: validatedData.phone || null,
        p_honeypot_field: null,
        p_ip_address: clientIP,
        p_user_agent: userAgent?.substring(0, 500) || null,
        p_source: 'landing_page',
        p_metadata: {}
      })

      if (rpcError) {
        console.error('[Contact] RPC error:', rpcError)

        // Fallback: insert direto na tabela
        const { data: insertData, error: insertError } = await supabase
          .from('contact_messages')
          .insert({
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone || null,
            subject: validatedData.subject,
            message: validatedData.message,
            ip_address: clientIP,
            user_agent: userAgent?.substring(0, 500) || null,
            source: 'landing_page'
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('[Contact] Insert error:', insertError)
          // Continue anyway - email is more important than DB
        } else {
          messageId = insertData?.id
        }
      } else {
        // RPC success
        const result = rpcResult as { success: boolean; message_id?: string; error?: string }

        if (!result.success) {
          console.error('[Contact] RPC returned error:', result.error)

          if (result.error === 'RATE_LIMIT_EXCEEDED') {
            return {
              success: false,
              message: 'Muitas mensagens enviadas. Tente novamente em 1 hora.',
              code: 'RATE_LIMIT'
            }
          }
        } else {
          messageId = result.message_id
        }
      }

      console.log('[Contact] Message saved to database:', messageId)
    } catch (dbError) {
      console.error('[Contact] Database error:', dbError)
      // Continue - we'll still try to send emails
    }
  } else {
    console.warn('[Contact] Supabase not configured - skipping database persistence')
  }

  // Generate a temporary ID if we don't have one from the database
  if (!messageId) {
    messageId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  // =========================================================================
  // 5. SEND EMAILS
  // =========================================================================

  // Send team notification (critical)
  const teamEmailResult = await sendTeamNotificationEmail(
    messageId,
    validatedData,
    clientIP,
    userAgent
  )

  // Send user confirmation (non-critical)
  const confirmationResult = await sendConfirmationEmail(validatedData)

  // Update database with email status
  if (supabase && messageId && !messageId.startsWith('temp-')) {
    try {
      if (teamEmailResult.success && teamEmailResult.emailId) {
        await supabase.rpc('mark_contact_email_sent', {
          p_message_id: messageId,
          p_email_type: 'team',
          p_email_message_id: teamEmailResult.emailId
        })
      }

      if (confirmationResult.success && confirmationResult.emailId) {
        await supabase.rpc('mark_contact_email_sent', {
          p_message_id: messageId,
          p_email_type: 'confirmation',
          p_email_message_id: confirmationResult.emailId
        })
      }
    } catch (updateError) {
      console.warn('[Contact] Failed to update email status:', updateError)
    }
  }

  // =========================================================================
  // 6. LOG AND RETURN
  // =========================================================================
  const duration = Date.now() - startTime

  console.log('[Contact] Submission completed', {
    messageId,
    duration: `${duration}ms`,
    teamEmailSent: teamEmailResult.success,
    confirmationSent: confirmationResult.success,
    ip: clientIP
  })

  return {
    success: true,
    message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
    code: 'SUCCESS',
    messageId
  }
}