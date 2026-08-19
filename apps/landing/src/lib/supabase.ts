import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Enterprise com sincronização automática de cookies (SSR)
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseUrl !== 'sua_url_aqui' && 
    supabaseAnonKey && 
    supabaseAnonKey !== 'sua_anon_key_aqui'
  )
}