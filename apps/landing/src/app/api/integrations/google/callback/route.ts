import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarClient } from '@/lib/integrations/calendar/google'
import { log } from '@/lib/observability/logger'

// Esta função usa o client do pgcrypto via rpc (que precisaremos expor ou usar uma Edge Function segura)
// Para o Next.js, idealmente você usaria uma rota autenticada.

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // Esperamos que seja o salon_id + token
  const error = url.searchParams.get('error')

  if (error) {
    log.error('Google OAuth Error', undefined, { error })
    return NextResponse.redirect(new URL('/salon/configuracoes/integracoes?error=google_oauth_failed', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/salon/configuracoes/integracoes?error=missing_params', request.url))
  }

  // Parse state (Pode ser um JSON base64 ou só o salon_id se for seguro)
  // Por segurança, você deveria validar se o usuário autenticado bate com o state.
  const salonId = state 

  try {
    const googleClient = new GoogleCalendarClient()
    const tokens = await googleClient.exchangeCodeForTokens(code)

    if (!tokens.refreshToken) {
      // Se já conectou antes, a Google não envia refresh token novamente a menos que revogue o acesso.
      // Neste caso, se precisar do refresh token, adicione prompt=consent&access_type=offline
      throw new Error('No refresh token provided by Google. Please disconnect and reconnect.')
    }

    const supabase = createClient()
    
    // Obter encryption key do .env
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is missing')
    }

    // Como chamar a função encrypt_secret do Postgres?
    // Podemos usar .rpc
    const { data: encryptedToken, error: rpcError } = await supabase
      .rpc('encrypt_secret', { 
        p_secret: tokens.refreshToken,
        p_key: encryptionKey 
      })

    if (rpcError) throw rpcError

    // Salva ou atualiza a credencial
    const { error: upsertError } = await supabase
      .from('integration_credentials')
      .upsert({
        salon_id: salonId,
        provider: 'google_calendar',
        credential_type: 'refresh_token',
        encrypted_token: encryptedToken,
      }, { onConflict: 'salon_id, provider, credential_type' })

    if (upsertError) throw upsertError

    // Marca a integração como ativa na tabela principal
    await supabase
      .from('salon_integrations')
      .update({ calendar_enabled: true })
      .eq('salon_id', salonId)

    log.info('Google Calendar connected successfully', { salon_id: salonId })
    
    return NextResponse.redirect(new URL('/salon/configuracoes/integracoes?success=google_connected', request.url))

  } catch (err: any) {
    log.error('Failed to complete Google OAuth', err, { salon_id: salonId })
    return NextResponse.redirect(new URL('/salon/configuracoes/integracoes?error=google_connection_failed', request.url))
  }
}
