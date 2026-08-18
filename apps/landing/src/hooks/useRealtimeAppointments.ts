'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Appointment {
  id: string
  salon_id: string
  client_id: string | null
  professional_id: string | null
  service_id: string | null
  scheduled_date: string
  scheduled_time: string
  end_time: string | null
  duration: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  client_name: string | null
  client_phone: string | null
  service_name: string | null
  service_price: number | null
  total_price: number | null
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
  notes: string | null
  created_at: string
  updated_at: string
  professionals?: { name: string; id: string }
  clients?: { name: string; phone: string }
  services?: { name: string; price: number; duration: number }
}

interface UseRealtimeAppointmentsOptions {
  salonId: string
  date?: string
  professionalId?: string
  enabled?: boolean
}

export function useRealtimeAppointments({
  salonId,
  date,
  professionalId,
  enabled = true
}: UseRealtimeAppointmentsOptions) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (!salonId || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('appointments')
        .select('*, professionals(name, id), clients(name, phone), services(name, price, duration)')
        .eq('salon_id', salonId)
        .order('scheduled_time')

      if (date) {
        query = query.eq('scheduled_date', date)
      }

      if (professionalId) {
        query = query.eq('professional_id', professionalId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setAppointments((data as Appointment[]) || [])
    } catch (err: any) {
      console.error('Error fetching appointments:', err)
      setError(err.message || 'Erro ao carregar agendamentos')
    } finally {
      setIsLoading(false)
    }
  }, [salonId, date, professionalId, enabled])

  useEffect(() => {
    if (!salonId || !enabled) return

    // Buscar agendamentos iniciais
    fetchAppointments()

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel(`appointments-${salonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salonId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment
            // Verificar se corresponde aos filtros
            if (date && newAppointment.scheduled_date !== date) return
            if (professionalId && newAppointment.professional_id !== professionalId) return
            
            setAppointments(prev => [...prev, newAppointment].sort((a, b) => 
              a.scheduled_time.localeCompare(b.scheduled_time)
            ))
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev =>
              prev.map(apt => apt.id === payload.new.id ? { ...apt, ...payload.new } as Appointment : apt)
            )
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(apt => apt.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [salonId, date, professionalId, enabled, fetchAppointments])

  const addAppointment = async (appointment: Partial<Appointment>) => {
    const insertData = { ...appointment, salon_id: salonId } as any
    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select('*, professionals(name, id), clients(name, phone), services(name, price, duration)')
      .single()

    if (error) throw error
    return data as Appointment
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() } as Record<string, any>
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData as any)
      .eq('id', id)
      .select('*, professionals(name, id), clients(name, phone), services(name, price, duration)')
      .single()

    if (error) throw error
    return data as Appointment
  }

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const updateStatus = async (id: string, status: Appointment['status']) => {
    return updateAppointment(id, { status })
  }

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus
  }
}

// Hook para contagem de agendamentos por status
export function useAppointmentStats(salonId: string, date: string) {
  const { appointments, isLoading } = useRealtimeAppointments({ salonId, date })

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    in_progress: appointments.filter(a => a.status === 'in_progress').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    no_show: appointments.filter(a => a.status === 'no_show').length,
  }

  return { stats, isLoading }
}