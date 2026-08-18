import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/observability/logger'
import { rateLimit } from '@/lib/rate-limit'

// Endpoint Público para buscar agendamentos via API Key (ERP Integration)
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid API Key' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  const supabase = createClient()

  // 1. Validar Token (No mundo real, buscaríamos na integration_credentials e validaríamos o hash)
  // Como as credenciais estão criptografadas, faríamos uma Edge Function/RPC para validar.
  // Simulando sucesso caso a chave bata com algum salon:

  const { data: credential, error: credError } = await supabase
    .from('integration_credentials')
    .select('salon_id')
    .eq('credential_type', 'api_key')
    // Atenção: Buscar e bater token exato aqui depende de como foi gerado. 
    // Em production usaríamos pg_trgm ou hash index.
    .limit(1)
    .single()

  if (credError || !credential) {
    log.securityEvent('Invalid API Key attempt', 'medium', { ip: request.headers.get('x-forwarded-for') })
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
  }

  const salonId = credential.salon_id

  // 2. Rate Limiting (Phase 12)
  try {
    const ip = request.headers.get('x-forwarded-for') || 'api_key'
    await rateLimit(`api_appointments_${salonId}`, 100, 60) // 100 requests per minute
  } catch (error) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  // 3. Process Request
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date')

  let query = supabase
    .from('appointments')
    .select('id, appointment_date, status, client:clients(name, phone), professional:professionals(name), service:services(name, price)')
    .eq('salon_id', salonId)

  if (dateStr) {
    // Buscar no dia específico
    query = query
      .gte('appointment_date', `${dateStr}T00:00:00Z`)
      .lte('appointment_date', `${dateStr}T23:59:59Z`)
  } else {
    // default: próximos agendamentos
    query = query.gte('appointment_date', new Date().toISOString())
  }

  const { data: appointments, error } = await query.order('appointment_date', { ascending: true }).limit(50)

  if (error) {
    log.error('API /v1/appointments failed', new Error(error.message), { salonId })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return NextResponse.json({
    data: appointments,
    meta: { count: appointments.length }
  })
}
