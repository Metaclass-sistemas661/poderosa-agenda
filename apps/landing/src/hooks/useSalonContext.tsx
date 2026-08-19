'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors/mapper'

interface SalonData {
  id: string
  name: string
  email: string
  phone: string
  plan: string
  status: string
  [key: string]: any
}

interface AdminUserData {
  id: string
  user_id: string
  name: string
  email: string
  role: string
  salon_id: string | null
  [key: string]: any
}

interface SalonSettingsData {
  id: string
  salon_id: string
  working_hours: any
  booking_interval: number
  [key: string]: any
}

interface SalonContextType {
  salon: SalonData | null
  salonSettings: SalonSettingsData | null
  user: AdminUserData | null
  isLoading: boolean
  error: string | null
  refetchSalon: () => Promise<void>
  refetchSettings: () => Promise<void>
}

const SalonContext = createContext<SalonContextType | null>(null)

interface SalonProviderProps {
  children: ReactNode
}

export function SalonProvider({ children }: SalonProviderProps) {
  const [salon, setSalon] = useState<SalonData | null>(null)
  const [salonSettings, setSalonSettings] = useState<SalonSettingsData | null>(null)
  const [user, setUser] = useState<AdminUserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSalonData()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadSalonData()
      } else if (event === 'SIGNED_OUT') {
        setSalon(null)
        setSalonSettings(null)
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSalonData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsLoading(false)
        return
      }

      // Buscar dados do admin user com salão
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*, salons(*)')
        .eq('user_id', session.user.id)
        .single()

      if (adminError) throw adminError

      if (adminUser) {
        const userData = adminUser as AdminUserData & { salons?: SalonData }
        setUser(userData)
        if (userData.salons) {
          setSalon(userData.salons)
        }

        // Buscar configurações do salão
        if (userData.salon_id) {
          const { data: settings } = await supabase
            .from('salon_settings')
            .select('*')
            .eq('salon_id', userData.salon_id)
            .single()

          if (settings) {
            setSalonSettings(settings as SalonSettingsData)
          }
        }
      }
    } catch (err: unknown) {
      const mappedError = mapSupabaseError(err, 'loadSalonData')
      setError(mappedError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const refetchSalon = async () => {
    if (!user?.salon_id) return

    const { data: salonData } = await supabase
      .from('salons')
      .select('*')
      .eq('id', user.salon_id)
      .single()

    if (salonData) {
      setSalon(salonData as SalonData)
    }
  }

  const refetchSettings = async () => {
    if (!user?.salon_id) return

    const { data: settings } = await supabase
      .from('salon_settings')
      .select('*')
      .eq('salon_id', user.salon_id)
      .single()

    if (settings) {
      setSalonSettings(settings as SalonSettingsData)
    }
  }

  return (
    <SalonContext.Provider value={{
      salon,
      salonSettings,
      user,
      isLoading,
      error,
      refetchSalon,
      refetchSettings
    }}>
      {children}
    </SalonContext.Provider>
  )
}

export function useSalonContext() {
  const context = useContext(SalonContext)
  if (!context) {
    throw new Error('useSalonContext must be used within a SalonProvider')
  }
  return context
}

// Hook simples para obter apenas o salon_id do usuário atual
export function useSalonId() {
  const [salonId, setSalonId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSalonId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('salon_id')
          .eq('user_id', session.user.id)
          .single()

        const userData = adminUser as { salon_id: string | null } | null
        if (userData?.salon_id) {
          setSalonId(userData.salon_id)
        }
      }
      setIsLoading(false)
    }

    loadSalonId()
  }, [])

  return { salonId, isLoading }
}
