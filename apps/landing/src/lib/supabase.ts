import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente com persistência de sessão via localStorage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'poderosa-agenda-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseUrl !== 'sua_url_aqui' && 
    supabaseAnonKey && 
    supabaseAnonKey !== 'sua_anon_key_aqui'
  )
}