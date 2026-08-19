import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Creates a Supabase client with the Service Role key.
 * 
 * IMPORTANT: This client bypasses RLS entirely and has admin privileges
 * over Auth and all database tables. It MUST NEVER be used for regular
 * data access or exposed to the client.
 * 
 * Use ONLY for provisioning tasks (like auth.admin.createUser) and
 * high-privilege backend workflows orchestrated by Server Actions.
 */
export function createAdminClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
