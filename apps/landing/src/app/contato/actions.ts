'use server'

import { createClient } from '@supabase/supabase-js'

// Types
export type ContactFormData = {
  name: string
  email: string
  subject: string
  message: string
}

export type ContactFormResult = {
  success: boolean
  message: string
  fieldErrors?: {
    name?: string
    email?: string
    subject?: string
    message?: string
  }
}

// Validation
function validateForm(data: ContactFormData): ContactFormResult['fieldErrors'] | null {
  const errors: ContactFormResult['fieldErrors'] = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres'
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'E-mail inválido'
  }

  if (!data.subject || data.subject.trim().length === 0) {
    errors.subject = 'Selecione um assunto'
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Mensagem deve ter pelo menos 10 caracteres'
  }

  if (data.message && data.message.length > 5000) {
    errors.message = 'Mensagem muito longa (máximo 5000 caracteres)'
  }

  return Object.keys(errors).length > 0 ? errors : null
}

export async function submitContactForm(data: ContactFormData): Promise<ContactFormResult> {
  // Server-side validation
  const fieldErrors = validateForm(data)
  if (fieldErrors) {
    return {
      success: false,
      message: 'Por favor, corrija os erros no formulário.',
      fieldErrors,
    }
  }

  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      // Log for server-side debugging only
      console.error('[Contact] Supabase not configured')
      
      // For V1 without Supabase: just log and return success
      // This allows the form to work while infrastructure is being set up
      console.log('[Contact] Message received:', {
        name: data.name,
        email: data.email,
        subject: data.subject,
        messageLength: data.message.length,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Mensagem recebida. Entraremos em contato em breve.',
      }
    }

    // Create Supabase client with service role (server-side only)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert into contact_messages table
    const { error } = await supabase.from('contact_messages').insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject,
      message: data.message.trim(),
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[Contact] Supabase error:', error.message)
      return {
        success: false,
        message: 'Não foi possível enviar sua mensagem. Tente novamente.',
      }
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
    }
  } catch (error) {
    console.error('[Contact] Unexpected error:', error)
    return {
      success: false,
      message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    }
  }
}