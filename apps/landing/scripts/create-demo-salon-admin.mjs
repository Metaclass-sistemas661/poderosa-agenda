// Cria um salão DEMO + admin (dono) para testes, usando o mesmo fluxo do webhook Asaas.
// Uso: node scripts/create-demo-salon-admin.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const EMAIL = 'demo.salao@poderosaagenda.test'
const PASSWORD = 'Demo@12345'

const { data: request, error: reqErr } = await supabase.from('access_requests').insert({
  salon_name: 'Salão Demo',
  owner_name: 'Admin Demo',
  email: EMAIL,
  phone: '11999999999',
  city: 'São Paulo',
  state: 'SP',
  professionals: '1-3',
  message: '[DEMO] Conta de testes',
  status: 'awaiting_payment',
}).select('id').single()
if (reqErr) throw reqErr

const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
  email: EMAIL, password: PASSWORD, email_confirm: true,
  user_metadata: { name: 'Admin Demo', role: 'admin' },
})
if (authErr) throw authErr

const { data: result, error: provErr } = await supabase.rpc('provision_tenant', {
  p_request_id: request.id, p_auth_user_id: auth.user.id, p_actor_id: auth.user.id,
})
if (provErr) { await supabase.auth.admin.deleteUser(auth.user.id); throw provErr }

console.log('OK', result)
console.log(`Login: ${EMAIL} / ${PASSWORD}`)
