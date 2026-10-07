// Diagnóstico do fluxo de pagamento Asaas -> provisionamento.
// Uso: node scripts/diagnose-asaas.mjs [email]
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const email = process.argv[2] || 'queila_hair@hotmail.com'
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
let token = env.ASAAS_ACCESS_TOKEN || ''
if (token && !token.startsWith('$')) token = '$' + token
const base = env.ASAAS_API_URL || 'https://api.asaas.com/v3'
const asaas = async (p) => { const r = await fetch(base + p, { headers: { access_token: token } }); return { status: r.status, body: await r.json().catch(() => null) } }

console.log('ENV present:', { url: !!env.NEXT_PUBLIC_SUPABASE_URL, srk: !!env.SUPABASE_SERVICE_ROLE_KEY, asaasToken: !!env.ASAAS_ACCESS_TOKEN, webhookToken: !!env.ASAAS_WEBHOOK_TOKEN, base })

const { data: reqs, error } = await sb.from('access_requests').select('*').ilike('email', email)
console.log('\n== access_requests ==', error?.message || '')
console.log(JSON.stringify(reqs, null, 2))

const { data: hooks, error: hErr } = await sb.from('payment_webhooks').select('external_id,provider,status,event_type,processing_error,access_request_id,created_at').order('created_at', { ascending: false }).limit(10)
console.log('\n== payment_webhooks (últimos 10) ==', hErr?.message || '')
console.log(JSON.stringify(hooks, null, 2))

console.log('\n== Asaas /webhooks (config) ==')
const wh = await asaas('/webhooks')
console.log(wh.status, JSON.stringify(wh.body?.data?.map(w => ({ id: w.id, url: w.url, enabled: w.enabled, interrupted: w.interrupted, events: w.events, authTokenSet: !!w.authToken, apiVersion: w.apiVersion })) ?? wh.body, null, 2))

console.log('\n== Asaas pagamentos recentes ==')
const pays = await asaas('/payments?limit=10')
console.log(pays.status, JSON.stringify(pays.body?.data?.map(p => ({ id: p.id, status: p.status, value: p.value, billingType: p.billingType, externalReference: p.externalReference, paymentLink: p.paymentLink, customer: p.customer, dateCreated: p.dateCreated })) ?? pays.body, null, 2))

console.log('\n== Asaas paymentLinks recentes ==')
const links = await asaas('/paymentLinks?limit=10')
console.log(links.status, JSON.stringify(links.body?.data?.map(l => ({ id: l.id, name: l.name, externalReference: l.externalReference, url: l.url, active: l.active })) ?? links.body, null, 2))
