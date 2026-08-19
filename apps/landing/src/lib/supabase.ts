import { createClient } from './supabase/client'

// Cliente Enterprise com sincronização automática de cookies (SSR)
export const supabase = createClient()

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'sua_url_aqui' && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'sua_anon_key_aqui'
  )
}