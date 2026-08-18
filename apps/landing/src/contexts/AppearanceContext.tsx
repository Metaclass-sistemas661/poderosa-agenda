'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AppearanceSettings {
  theme_color: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber'
  sidebar_compact: boolean
  animations_enabled: boolean
  logo_url: string | null
}

interface AppearanceContextType {
  appearance: AppearanceSettings
  setAppearance: (settings: Partial<AppearanceSettings>) => void
  isLoading: boolean
}

const defaultSettings: AppearanceSettings = {
  theme_color: 'emerald',
  sidebar_compact: false,
  animations_enabled: true,
  logo_url: null,
}

const AppearanceContext = createContext<AppearanceContextType>({
  appearance: defaultSettings,
  setAppearance: () => {},
  isLoading: true,
})

const colorPalettes = {
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    500: '#a855f7',
    600: '#9333ea',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    500: '#f43f5e',
    600: '#e11d48',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  }
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  // Injetar variáveis CSS sempre que a cor mudar
  useEffect(() => {
    const palette = colorPalettes[appearance.theme_color] || colorPalettes.emerald
    const root = document.documentElement
    
    // Configura as variáveis CSS para a cor primária
    root.style.setProperty('--color-primary-50', palette[50])
    root.style.setProperty('--color-primary-100', palette[100])
    root.style.setProperty('--color-primary-500', palette[500])
    root.style.setProperty('--color-primary-600', palette[600])
    
  }, [appearance.theme_color])

  const loadSettings = async () => {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return

      // Obter salon_id
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('salon_id')
        .eq('user_id', session.session.user.id)
        .single()

      if (!adminUser || !adminUser.salon_id) return

      // Buscar configurações de aparência
      const { data: settings } = await supabase
        .from('salon_settings')
        .select('theme_color, sidebar_compact, animations_enabled, logo_url')
        .eq('salon_id', adminUser.salon_id)
        .single()

      if (settings) {
        const isValidColor = (color: string): color is 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' => 
          ['emerald', 'blue', 'purple', 'rose', 'amber'].includes(color);

        setAppearanceState({
          theme_color: isValidColor(settings.theme_color) ? settings.theme_color : 'emerald',
          sidebar_compact: settings.sidebar_compact ?? false,
          animations_enabled: settings.animations_enabled ?? true,
          logo_url: settings.logo_url || null,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de aparência:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setAppearance = (newSettings: Partial<AppearanceSettings>) => {
    setAppearanceState(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  return useContext(AppearanceContext)
}
