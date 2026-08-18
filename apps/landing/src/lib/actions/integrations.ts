'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Chave master de criptografia. Em produção, DEVE vir do .env
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'dev_master_key_1234567890123456'

export async function saveIntegrationCredential(
  salonId: string,
  provider: string,
  credentialType: string,
  token: string,
  metadata: Record<string, any> = {}
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('upsert_integration_credential', {
      p_salon_id: salonId,
      p_provider: provider,
      p_credential_type: credentialType,
      p_token: token,
      p_key: ENCRYPTION_KEY,
      p_metadata: metadata
    })

    if (error) {
      console.error('Error saving credential:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/salon/configuracoes')
    return { success: true, data }
  } catch (err: any) {
    console.error('Action error saving credential:', err)
    return { success: false, error: err.message || 'Erro interno ao salvar credencial' }
  }
}

export async function saveWebhookOutbound(
  salonId: string,
  url: string,
  events: string[]
) {
  const supabase = createClient()
  
  // Gerar um webhook secret aleatório (simulando hmac secret)
  const generatedSecret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  try {
    const { data, error } = await supabase.rpc('upsert_webhook_outbound', {
      p_salon_id: salonId,
      p_url: url,
      p_events: events,
      p_secret: generatedSecret,
      p_key: ENCRYPTION_KEY
    })

    if (error) {
      console.error('Error saving webhook:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/salon/configuracoes')
    return { success: true, secret: generatedSecret, data }
  } catch (err: any) {
    console.error('Action error saving webhook:', err)
    return { success: false, error: err.message || 'Erro interno ao salvar webhook' }
  }
}
