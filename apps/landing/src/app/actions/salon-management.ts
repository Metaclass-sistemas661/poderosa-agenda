'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult {
    success: boolean
    error?: string
    data?: Record<string, unknown>
}

// Validate superadmin
async function requireSuperadmin() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('UNAUTHENTICATED')

    const { data: admin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!admin || admin.role !== 'superadmin') throw new Error('FORBIDDEN')
    return user.id
}

export async function changeSalonStatus(
    salonId: string,
    newStatus: 'active' | 'inactive' | 'suspended',
    reason?: string
): Promise<ActionResult> {
    try {
        const actorId = await requireSuperadmin()
        const supabase = createClient()

        const { data, error } = await supabase.rpc('change_salon_status', {
            p_salon_id: salonId,
            p_new_status: newStatus,
            p_reason: reason || null,
            p_actor_id: actorId
        })

        if (error) return { success: false, error: error.message }
        if (!data?.success) return { success: false, error: data?.error || 'Unknown error' }

        revalidatePath('/admin/saloes')
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message === 'FORBIDDEN' ? 'Permissão negada' : 'Erro interno' }
    }
}

export async function deleteSalon(salonId: string, reason?: string): Promise<ActionResult> {
    try {
        const actorId = await requireSuperadmin()
        const supabase = createClient()

        const { data, error } = await supabase.rpc('soft_delete_salon', {
            p_salon_id: salonId,
            p_reason: reason || 'Excluído pelo administrador',
            p_actor_id: actorId
        })

        if (error) return { success: false, error: error.message }
        if (!data?.success) return { success: false, error: data?.error || 'Unknown error' }

        revalidatePath('/admin/saloes')
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message === 'FORBIDDEN' ? 'Permissão negada' : 'Erro interno' }
    }
}

export async function restoreSalon(salonId: string): Promise<ActionResult> {
    try {
        const actorId = await requireSuperadmin()
        const supabase = createClient()

        const { data, error } = await supabase.rpc('restore_deleted_salon', {
            p_salon_id: salonId,
            p_actor_id: actorId
        })

        if (error) return { success: false, error: error.message }
        if (!data?.success) return { success: false, error: data?.error || 'Unknown error' }

        revalidatePath('/admin/saloes')
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message === 'FORBIDDEN' ? 'Permissão negada' : 'Erro interno' }
    }
}