'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings,
  Building2,
  Clock,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Mail,
  Phone,
  MapPin,
  User,
  Plus,
  Trash2,
  X,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Globe,
  Smartphone,
  ChevronRight,
  MessageSquare,
  CalendarCheck,
  BellRing,
  BellOff,
  Send,
  Sun,
  Moon,
  Monitor,
  Image,
  Type,
  Layout,
  Plug
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useAppearance } from '@/contexts/AppearanceContext'
import { IntegrationsSection } from './IntegrationsSection'

interface Salon {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  cnpj: string | null
}

interface SalonSettings {
  id: string
  salon_id: string
  working_hours: any
  booking_interval: number
  booking_advance_days: number
  allow_online_booking: boolean
  require_confirmation: boolean
  send_appointment_reminder: boolean
  reminder_hours_before: number
}

interface AdminUser {
  id: string
  user_id: string
  salon_id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  created_at: string
}

const weekDays = [
  { key: 'mon', label: 'Segunda', short: 'Seg' },
  { key: 'tue', label: 'Terça', short: 'Ter' },
  { key: 'wed', label: 'Quarta', short: 'Qua' },
  { key: 'thu', label: 'Quinta', short: 'Qui' },
  { key: 'fri', label: 'Sexta', short: 'Sex' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' }
]

const roles = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'manager', label: 'Gerente', description: 'Gerencia agenda e equipe' },
  { value: 'employee', label: 'Funcionário', description: 'Acesso básico' }
]

const menuItems = [
  { id: 'profile', label: 'Perfil do Salão', icon: Building2, description: 'Informações básicas' },
  { id: 'hours', label: 'Horários', icon: Clock, description: 'Funcionamento' },
  { id: 'users', label: 'Equipe', icon: Users, description: 'Usuários do sistema' },
  { id: 'notifications', label: 'Notificações', icon: Bell, description: 'Alertas e avisos' },
  { id: 'appearance', label: 'Aparência', icon: Palette, description: 'Personalização' },
  { id: 'integrations', label: 'Integrações', icon: Plug, description: 'Conectividade com Apps' },
]

export default function ConfiguracoesPage() {
  const { theme: currentTheme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [salonId, setSalonId] = useState<string | null>(null)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [settings, setSettings] = useState<SalonSettings | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cnpj: ''
  })

  const [hoursForm, setHoursForm] = useState<Record<string, { open: string; close: string; is_open: boolean }>>({
    mon: { open: '09:00', close: '18:00', is_open: true },
    tue: { open: '09:00', close: '18:00', is_open: true },
    wed: { open: '09:00', close: '18:00', is_open: true },
    thu: { open: '09:00', close: '18:00', is_open: true },
    fri: { open: '09:00', close: '18:00', is_open: true },
    sat: { open: '09:00', close: '13:00', is_open: true },
    sun: { open: '', close: '', is_open: false }
  })

  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'employee' as AdminUser['role']
  })

  // Notifications State
  const [notificationsForm, setNotificationsForm] = useState({
    email_appointments: true,
    email_cancellations: true,
    email_reminders: true,
    email_weekly_report: true,
    push_new_appointments: true,
    push_cancellations: true,
    send_appointment_reminder: true,
    reminder_hours_before: 24,
    allow_online_booking: true,
    require_confirmation: false,
    reminder_hours: 24,
    weekly_report_day: 'monday'
  })

  const logoInputRef = useRef<HTMLInputElement>(null)

  const { appearance, setAppearance } = useAppearance()

  const [appearanceForm, setAppearanceForm] = useState({
    theme: currentTheme as 'light' | 'dark' | 'system',
    accent_color: appearance.theme_color,
    sidebar_compact: appearance.sidebar_compact,
    show_avatars: true,
    animations_enabled: appearance.animations_enabled,
    font_size: 'normal' as 'small' | 'normal' | 'large',
    logo_url: appearance.logo_url
  })

  // Sincronizar form local quando os dados globais carregarem
  useEffect(() => {
    setAppearanceForm(prev => ({
      ...prev,
      accent_color: appearance.theme_color,
      sidebar_compact: appearance.sidebar_compact,
      animations_enabled: appearance.animations_enabled,
      logo_url: appearance.logo_url
    }))
  }, [appearance])

  // Removido o hook de localStorage para usar Supabase via AppearanceContext

  useEffect(() => {
    loadSalonId()
  }, [])

  useEffect(() => {
    if (salonId) {
      fetchSalon()
      fetchSettings()
      fetchAdminUsers()
    }
  }, [salonId])

  const loadSalonId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: adminUser, error } = await (supabase as any)
          .from('admin_users')
          .select('salon_id')
          .eq('user_id', session.user.id)
          .single()
        if (error) {
          console.error('Erro ao buscar salon_id:', error)
          return
        }
        if (adminUser?.salon_id) {
          setSalonId(adminUser.salon_id)
        } else {
          console.warn('Nenhum salon_id encontrado para o usuário')
          setIsLoading(false)
        }
      } else {
        console.warn('Nenhuma sessão ativa')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Erro ao carregar salonId:', err)
      setIsLoading(false)
    }
  }

  const fetchSalon = async () => {
    if (!salonId) return
    setIsLoading(true)

    try {
      const { data, error } = await (supabase as any)
        .from('salons')
        .select('*')
        .eq('id', salonId)
        .single()

      if (error) {
        console.error('Erro ao buscar salão:', error)
      } else if (data) {
        setSalon(data)
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          cnpj: data.cnpj || ''
        })
      }
    } catch (err) {
      console.error('Erro ao buscar salão:', err)
    }
    setIsLoading(false)
  }

  const fetchSettings = async () => {
    if (!salonId) return
    try {
      const { data, error } = await (supabase as any)
        .from('salon_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single()

      if (error) {
        console.error('Erro ao buscar configurações:', error)
        // Se não existir settings ainda, não é erro crítico
        return
      }

      if (data) {
        setSettings(data)
        if (data.working_hours) {
          setHoursForm(data.working_hours)
        }
        // Carregar configurações de notificação do banco
        setNotificationsForm(prev => ({
          ...prev,
          send_appointment_reminder: data.send_appointment_reminder ?? prev.send_appointment_reminder,
          reminder_hours_before: data.reminder_hours_before ?? prev.reminder_hours_before,
          allow_online_booking: data.allow_online_booking ?? prev.allow_online_booking,
          require_confirmation: data.require_confirmation ?? prev.require_confirmation,
          // Mapear também para as variáveis da UI
          email_reminders: data.send_appointment_reminder ?? prev.email_reminders,
          reminder_hours: data.reminder_hours_before ?? prev.reminder_hours,
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err)
    }
  }

  const fetchAdminUsers = async () => {
    if (!salonId) return
    const { data } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })

    if (data) setAdminUsers(data)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSaveProfile = async () => {
    if (!salonId || !profileForm.name) {
      showMessage('error', 'Nome é obrigatório')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await (supabase as any)
        .from('salons')
        .update({
          name: profileForm.name,
          email: profileForm.email || null,
          phone: profileForm.phone || null,
          address: profileForm.address || null,
          cnpj: profileForm.cnpj || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', salonId)

      if (!error) {
        showMessage('success', 'Perfil atualizado com sucesso!')
        fetchSalon()
      } else {
        console.error('Erro ao atualizar perfil:', error)
        showMessage('error', 'Erro ao atualizar perfil: ' + error.message)
      }
    } catch (err: any) {
      console.error('Erro inesperado ao salvar perfil:', err)
      showMessage('error', 'Erro inesperado ao salvar perfil')
    }
    setIsSaving(false)
  }

  const handleSaveHours = async () => {
    if (!salonId) return
    setIsSaving(true)

    try {
      if (settings?.id) {
        // Update existing settings
        const { error } = await (supabase as any)
          .from('salon_settings')
          .update({ working_hours: hoursForm })
          .eq('id', settings.id)

        if (error) {
          console.error('Erro ao salvar horários:', error)
          showMessage('error', 'Erro ao salvar horários: ' + error.message)
        } else {
          showMessage('success', 'Horários salvos com sucesso!')
          fetchSettings()
        }
      } else {
        // Create new settings record
        const { error } = await (supabase as any)
          .from('salon_settings')
          .insert({
            salon_id: salonId,
            working_hours: hoursForm,
          })

        if (error) {
          console.error('Erro ao criar configurações:', error)
          showMessage('error', 'Erro ao salvar horários: ' + error.message)
        } else {
          showMessage('success', 'Horários salvos com sucesso!')
          fetchSettings()
        }
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err)
      showMessage('error', 'Erro inesperado ao salvar horários')
    }
    setIsSaving(false)
  }

  const handleCreateUser = async () => {
    if (!salonId || !userForm.name || !userForm.email) {
      showMessage('error', 'Preencha todos os campos')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .insert({
          salon_id: salonId,
          user_id: `temp_${Date.now()}`,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setAdminUsers(prev => [data, ...prev])
        showMessage('success', 'Usuário adicionado!')
        setShowUserModal(false)
        setUserForm({ name: '', email: '', role: 'employee' })
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Erro ao criar usuário')
    }
    setIsSaving(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Remover este usuário?')) return

    const { error } = await (supabase as any).from('admin_users').delete().eq('id', userId)
    if (!error) {
      setAdminUsers(prev => prev.filter(u => u.id !== userId))
      showMessage('success', 'Usuário removido')
    } else {
      showMessage('error', 'Erro ao remover')
    }
  }

  const handleSaveNotifications = async () => {
    if (!salonId) return
    setIsSaving(true)

    const notifData = {
      send_appointment_reminder: notificationsForm.send_appointment_reminder || notificationsForm.email_reminders,
      reminder_hours_before: notificationsForm.reminder_hours_before || notificationsForm.reminder_hours,
      allow_online_booking: notificationsForm.allow_online_booking,
      require_confirmation: notificationsForm.require_confirmation,
    }

    try {
      if (settings?.id) {
        const { error } = await (supabase as any)
          .from('salon_settings')
          .update(notifData)
          .eq('id', settings.id)

        if (error) {
          console.error('Erro ao salvar notificações:', error)
          showMessage('error', 'Erro ao salvar configurações: ' + error.message)
        } else {
          showMessage('success', 'Configurações de notificação salvas!')
          fetchSettings()
        }
      } else {
        const { error } = await (supabase as any)
          .from('salon_settings')
          .insert({
            salon_id: salonId,
            ...notifData,
          })

        if (error) {
          console.error('Erro ao criar configurações:', error)
          showMessage('error', 'Erro ao salvar configurações: ' + error.message)
        } else {
          showMessage('success', 'Configurações de notificação salvas!')
          fetchSettings()
        }
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err)
      showMessage('error', 'Erro inesperado ao salvar notificações')
    }
    setIsSaving(false)
  }

  const handleSaveAppearance = async () => {
    setIsSaving(true)
    
    // Aplicar tema
    if (appearanceForm.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    } else {
      setTheme(appearanceForm.theme as 'light' | 'dark')
    }

    try {
      // Salvar globalmente
      setAppearance({
        theme_color: appearanceForm.accent_color,
        sidebar_compact: appearanceForm.sidebar_compact,
        animations_enabled: appearanceForm.animations_enabled,
        logo_url: appearanceForm.logo_url
      })

      // Salvar no Supabase
      if (salonId) {
        const { error } = await (supabase as any)
          .from('salon_settings')
          .update({
            theme_color: appearanceForm.accent_color,
            sidebar_compact: appearanceForm.sidebar_compact,
            animations_enabled: appearanceForm.animations_enabled,
            logo_url: appearanceForm.logo_url
          })
          .eq('salon_id', salonId)

        if (error) throw error
      }
      
      showMessage('success', 'Preferências de aparência salvas!')
    } catch (err: any) {
      console.error('Erro ao salvar aparência:', err)
      showMessage('error', 'Erro ao salvar configurações de aparência')
    }
    
    setIsSaving(false)
  }

  // Aplicar tema imediatamente ao clicar nos botões de tema
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setAppearanceForm({ ...appearanceForm, theme })
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    } else {
      setTheme(theme)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage('error', 'A imagem deve ter no máximo 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAppearanceForm(prev => ({ ...prev, logo_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary-400)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white",
              message.type === 'success' ? 'bg-[var(--color-primary-500)]' : 'bg-red-500'
            )}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 p-4 sticky top-4 shadow-sm">
            <div className="p-2 mb-4">
              <h2 className="text-slate-900 dark:text-white font-bold text-xl">Configurações</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm">Gerencie seu sistema</p>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                      isActive
                        ? "bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-semibold"
                        : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-[var(--color-primary-500)]" : "")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.label}</p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil do Salão</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Informações básicas do estabelecimento.</p>
              </div>

              <div className="p-8 space-y-8">
                {/* Basic Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between pb-8 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0 max-w-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Informações Principais</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Nome e registro da sua empresa.</p>
                  </div>
                  <div className="w-full md:w-[60%] space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Nome do Salão *</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                        placeholder="Nome do estabelecimento"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={profileForm.cnpj}
                        onChange={(e) => setProfileForm({ ...profileForm, cnpj: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between pb-8 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0 max-w-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Contato</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Dados de comunicação com clientes.</p>
                  </div>
                  <div className="w-full md:w-[60%] space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                          placeholder="contato@salao.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between pb-4 border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0 max-w-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Localização</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Endereço do estabelecimento.</p>
                  </div>
                  <div className="w-full md:w-[60%]">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Endereço completo</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-gray-500" />
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          rows={3}
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all shadow-sm"
                          placeholder="Rua, número, bairro, cidade - UF"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !profileForm.name}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar informações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Hours Section */}
          {activeSection === 'hours' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Horários de Funcionamento</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Configure os dias e horários de atendimento do salão.</p>
              </div>

              <div className="p-8">
                <div className="space-y-4">
                  {weekDays.map((day) => {
                    const dayData = hoursForm[day.key]
                    return (
                      <div
                        key={day.key}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border transition-all",
                          !dayData?.is_open
                            ? "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5"
                            : "bg-white dark:bg-[#1a2332] border-emerald-500/30 dark:border-emerald-500/20 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-4 w-full sm:w-48 flex-shrink-0">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dayData?.is_open ?? false}
                              onChange={(e) => setHoursForm({
                                ...hoursForm,
                                [day.key]: { ...dayData, is_open: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>

                          <span className={cn(
                            "font-medium",
                            !dayData?.is_open ? "text-slate-500 dark:text-gray-500" : "text-slate-900 dark:text-white"
                          )}>
                            {day.label}
                          </span>
                        </div>

                        {dayData?.is_open ? (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="time"
                              value={dayData?.open || '09:00'}
                              onChange={(e) => setHoursForm({
                                ...hoursForm,
                                [day.key]: { ...dayData, open: e.target.value }
                              })}
                              className="px-4 py-2.5 bg-slate-50 dark:bg-[#0f1419] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors shadow-sm w-full sm:w-auto"
                            />
                            <span className="text-slate-400 dark:text-gray-500 text-sm font-medium">até</span>
                            <input
                              type="time"
                              value={dayData?.close || '18:00'}
                              onChange={(e) => setHoursForm({
                                ...hoursForm,
                                [day.key]: { ...dayData, close: e.target.value }
                              })}
                              className="px-4 py-2.5 bg-slate-50 dark:bg-[#0f1419] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors shadow-sm w-full sm:w-auto"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-lg text-slate-500 dark:text-gray-500 text-sm text-center sm:text-left">
                            Fechado
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={handleSaveHours}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar horários"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipe</h1>
                  <p className="text-slate-500 dark:text-gray-400 mt-1">{adminUsers.length} usuário{adminUsers.length !== 1 ? 's' : ''} com acesso ao sistema.</p>
                </div>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar usuário
                </button>
              </div>

              <div className="p-8">
                {adminUsers.length > 0 ? (
                  <div className="space-y-3">
                    {adminUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none"
                      >
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 flex-shrink-0">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-900 dark:text-white font-semibold truncate">{user.name}</h3>
                          <p className="text-slate-500 dark:text-gray-400 text-sm truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                          <span className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border",
                            user.role === 'admin' ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30" :
                            user.role === 'manager' ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                            "bg-slate-100 dark:bg-gray-500/10 text-slate-700 dark:text-gray-400 border-slate-200 dark:border-gray-500/30"
                          )}>
                            {roles.find(r => r.value === user.role)?.label}
                          </span>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Nenhum usuário</h3>
                    <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Adicione membros da equipe para acessarem o sistema</p>
                    <button
                      onClick={() => setShowUserModal(true)}
                      className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-sm rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all inline-block"
                    >
                      Adicionar usuário
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificações</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Configure alertas, lembretes e comunicações por e-mail e push.</p>
              </div>

              <div className="p-8 space-y-10">
                {/* Email Notifications */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold">Notificações por E-mail</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">Receba alertas importantes na sua caixa de entrada.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:ml-13">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <CalendarCheck className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Novos agendamentos</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Quando um cliente agenda um serviço.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.email_appointments}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, email_appointments: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <BellOff className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Cancelamentos</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Quando um agendamento é cancelado.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.email_cancellations}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, email_cancellations: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <BellRing className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Lembretes diários</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Resumo com os agendamentos do dia.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.email_reminders}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, email_reminders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <Send className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Relatório semanal</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Resumo de desempenho de caixa e equipe.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.email_weekly_report}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, email_weekly_report: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold">Notificações Push</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">Alertas em tempo real direto no navegador.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:ml-13">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <CalendarCheck className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Novos agendamentos</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Aviso instantâneo em tela quando receber marcações.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.push_new_appointments}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, push_new_appointments: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <BellOff className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Cancelamentos</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Aviso quando um cliente cancelar ou reagendar.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsForm.push_cancellations}
                          onChange={(e) => setNotificationsForm({ ...notificationsForm, push_cancellations: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold">Notificações por WhatsApp/SMS</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">Envie lembretes e confirmações para seus clientes.</p>
                    </div>
                    <span className="ml-auto px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-500/30">EM BREVE</span>
                  </div>
                  
                  <div className="space-y-4 md:ml-13 opacity-50 pointer-events-none">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <BellRing className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Lembrete de agendamento</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Disparar WhatsApp antes do horário marcado.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" disabled className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-slate-100 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">Confirmação de agendamento</p>
                          <p className="text-slate-500 dark:text-gray-400 text-sm">Mensagem no momento que a reserva é feita.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" disabled className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Settings Details */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-gray-500/10 rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold">Preferências de Disparo</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">Ajuste os intervalos para os lembretes automáticos.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:ml-13">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Antecedência dos lembretes</label>
                      <select
                        value={notificationsForm.reminder_hours}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, reminder_hours: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] cursor-pointer shadow-sm"
                      >
                        <option value={1}>1 hora antes</option>
                        <option value={2}>2 horas antes</option>
                        <option value={6}>6 horas antes</option>
                        <option value={12}>12 horas antes</option>
                        <option value={24}>24 horas antes</option>
                        <option value={48}>48 horas antes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Dia do relatório semanal</label>
                      <select
                        value={notificationsForm.weekly_report_day}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, weekly_report_day: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] cursor-pointer shadow-sm"
                      >
                        <option value="monday">Segunda-feira</option>
                        <option value="tuesday">Terça-feira</option>
                        <option value="wednesday">Quarta-feira</option>
                        <option value="thursday">Quinta-feira</option>
                        <option value="friday">Sexta-feira</option>
                        <option value="saturday">Sábado</option>
                        <option value="sunday">Domingo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="px-8 py-3 bg-[var(--color-primary-500)] text-white font-bold rounded-xl hover:shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Configurações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aparência</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Personalize a interface do seu sistema.</p>
              </div>

              <div className="p-8 space-y-8">
                {/* Logo */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Logo do Salão</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Substitua a logo padrão do sistema pela sua marca (Máx 2MB).</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden">
                      {appearanceForm.logo_url ? (
                        <img src={appearanceForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Substituir logo
                    </button>
                    {appearanceForm.logo_url && (
                      <button 
                        onClick={() => setAppearanceForm(prev => ({ ...prev, logo_url: null }))}
                        className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* Brand Color */}
                <div className="flex flex-col md:flex-row md:items-start justify-between pb-8 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0 max-w-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Cor da marca</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Selecione ou personalize a cor de destaque da sua marca.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      {[
                        { id: 'emerald', color: 'bg-emerald-500' },
                        { id: 'blue', color: 'bg-blue-600' },
                        { id: 'purple', color: 'bg-purple-500' },
                        { id: 'rose', color: 'bg-rose-500' },
                        { id: 'amber', color: 'bg-amber-500' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setAppearanceForm({ ...appearanceForm, accent_color: item.id as any })}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1f]",
                            item.color,
                            appearanceForm.accent_color === item.id ? "ring-2 ring-blue-600 dark:ring-blue-500" : ""
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 dark:text-gray-400">Cor customizada:</span>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                        <span className="text-sm text-slate-900 dark:text-white font-medium">#10B981</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1c1c1f] shadow-sm ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1f]" />
                    </div>
                  </div>
                </div>

                {/* Interface Theme */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between pb-8 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-6 xl:mb-0 max-w-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Tema da interface</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Selecione ou personalize o tema da interface do sistema.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleThemeChange('system')}
                      className="flex flex-col gap-3 group"
                    >
                      <div className={cn(
                        "w-56 h-36 rounded-xl border-2 transition-all overflow-hidden relative shadow-sm",
                        appearanceForm.theme === 'system' ? "border-blue-600 dark:border-blue-500" : "border-slate-200 dark:border-white/10"
                      )}>
                        <div className="absolute inset-0 flex">
                          <div className="w-1/2 bg-slate-100 h-full border-r border-slate-200/50 p-2">
                             <div className="w-1/3 bg-white h-full border border-slate-200 rounded"></div>
                          </div>
                          <div className="w-1/2 bg-[#1c1c1f] h-full border-l border-white/5 p-2">
                             <div className="w-1/3 bg-[#0f1419] h-full border border-white/10 rounded"></div>
                          </div>
                        </div>
                        {appearanceForm.theme === 'system' && (
                          <div className="absolute bottom-2 left-2 w-5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white text-left">Padrão do Sistema</span>
                    </button>

                    <button
                      onClick={() => handleThemeChange('light')}
                      className="flex flex-col gap-3 group"
                    >
                      <div className={cn(
                        "w-56 h-36 rounded-xl border-2 transition-all overflow-hidden relative shadow-sm bg-slate-100 p-2",
                        appearanceForm.theme === 'light' ? "border-blue-600 dark:border-blue-500" : "border-slate-200 dark:border-white/10"
                      )}>
                        <div className="absolute inset-y-2 left-2 w-1/3 bg-white border border-slate-200 rounded"></div>
                        {appearanceForm.theme === 'light' && (
                          <div className="absolute bottom-2 left-2 w-5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white text-left">Claro</span>
                    </button>

                    <button
                      onClick={() => handleThemeChange('dark')}
                      className="flex flex-col gap-3 group"
                    >
                      <div className={cn(
                        "w-56 h-36 rounded-xl border-2 transition-all overflow-hidden relative shadow-sm bg-[#1c1c1f] p-2",
                        appearanceForm.theme === 'dark' ? "border-blue-600 dark:border-blue-500" : "border-slate-200 dark:border-white/10"
                      )}>
                        <div className="absolute inset-y-2 left-2 w-1/3 bg-[#0f1419] border border-white/10 rounded"></div>
                        {appearanceForm.theme === 'dark' && (
                          <div className="absolute bottom-2 left-2 w-5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white text-left">Escuro</span>
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Sidebar transparente</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Torne o menu lateral no desktop transparente.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceForm.sidebar_compact}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, sidebar_compact: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="mb-4 md:mb-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recursos da Sidebar</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">O que é exibido no menu lateral (desktop).</p>
                  </div>
                  <select
                    className="w-full md:w-64 px-4 py-2.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="recent">Mudanças recentes</option>
                    <option value="all">Todos os atalhos</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Animações da interface</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Ativar transições e efeitos de motion.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceForm.animations_enabled}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, animations_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                  </label>
                </div>

              </div>

              <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={handleSaveAppearance}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar preferências"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Integrations Section */}
          {activeSection === 'integrations' && (
            <IntegrationsSection salonId={salonId || ''} />
          )}
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2332] rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Novo Usuário</h2>
                    <p className="text-xs text-gray-500">Adicionar membro à equipe</p>
                  </div>
                </div>
                <button onClick={() => setShowUserModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome completo *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Perfil de acesso *</label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setUserForm({ ...userForm, role: role.value as AdminUser['role'] })}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          userForm.role === role.value
                            ? "bg-emerald-500/10 border-emerald-500/50"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          userForm.role === role.value ? "border-emerald-500" : "border-gray-500"
                        )}>
                          {userForm.role === role.value && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{role.label}</p>
                          <p className="text-gray-500 text-xs">{role.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isSaving || !userForm.name || !userForm.email}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}