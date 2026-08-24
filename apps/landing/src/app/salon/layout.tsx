'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCircle,
  DollarSign,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  Bell,
  Search,
  Plus,
  Loader2,
  CheckCircle,
  Headphones
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SalonLayoutContext } from '@/contexts/SalonLayoutContext'
import { buildSearchOrClause, SEARCH_MAX_LENGTH } from '@/lib/search/security'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { WhatsNewModal, VersionBadge } from '@/components/ui/WhatsNewModal'
import { AppearanceProvider, useAppearance } from '@/contexts/AppearanceContext'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  salon_id: string
  salons?: Salon
}

interface Salon {
  id: string
  name: string
  plan: string
  status: string
}

interface Notification {
  id: string
  type: 'appointment' | 'client' | 'system'
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

const menuItems = [
  { href: '/salon/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/salon/agendamentos', label: 'Agendamentos', icon: Calendar },
  { href: '/salon/clientes', label: 'Clientes', icon: Users },
  { href: '/salon/servicos', label: 'Serviços', icon: Scissors },
  { href: '/salon/profissionais', label: 'Equipe', icon: UserCircle },
  { href: '/salon/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/salon/estoque', label: 'Estoque', icon: Package },
  { href: '/salon/configuracoes', label: 'Configurações', icon: Settings },
]

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppearanceProvider>
        <SalonLayoutInner>{children}</SalonLayoutInner>
      </AppearanceProvider>
    </ThemeProvider>
  )
}

function SalonLayoutInner({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const notificationRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    clients: Array<{ id: string; name: string; phone?: string | null; email?: string | null }>
    services: Array<{ id: string; name: string; price: number; category?: string | null }>
    professionals: Array<{ id: string; name: string; specialty?: string[] | null }>
    appointments: Array<{ id: string; client_name: string | null; service_name: string | null; scheduled_date: string; scheduled_time: string }>
  }>({ clients: [], services: [], professionals: [], appointments: [] })
  const [isSearching, setIsSearching] = useState(false)

  const { appearance } = useAppearance()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user?.salon_id) return

    // Fetch initial notifications (recent appointments)
    const fetchNotifications = async () => {
      try {
        const now = new Date()
        const today = now.toISOString().split('T')[0]

        // Get today's upcoming appointments
        const { data: todayAppts } = await (supabase as any)
          .from('appointments')
          .select('id, scheduled_time, scheduled_date, client_name, service_name, status, created_at')
          .eq('salon_id', user.salon_id)
          .eq('scheduled_date', today)
          .in('status', ['scheduled', 'confirmed'])
          .order('scheduled_time', { ascending: true })
          .limit(10)

        // Get recently created appointments (last 24h)
        const yesterday = new Date(now.getTime() - 86400000).toISOString()
        const { data: recentAppts } = await (supabase as any)
          .from('appointments')
          .select('id, scheduled_time, scheduled_date, client_name, service_name, status, created_at')
          .eq('salon_id', user.salon_id)
          .gte('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(5)

        const notifs: Notification[] = []

        // Today's upcoming appointments
        if (todayAppts && todayAppts.length > 0) {
          todayAppts.forEach((apt: any) => {
            notifs.push({
              id: `today-${apt.id}`,
              type: 'appointment',
              title: apt.status === 'confirmed' ? 'Confirmado' : 'Agendado para hoje',
              message: `${apt.client_name || 'Cliente'} - ${apt.service_name || 'Serviço'} às ${apt.scheduled_time?.slice(0, 5)}`,
              time: apt.scheduled_time?.slice(0, 5) || '',
              read: false,
              link: '/salon/agendamentos'
            })
          })
        }

        // New appointments created recently (that aren't for today)
        if (recentAppts) {
          recentAppts.forEach((apt: any) => {
            if (apt.scheduled_date !== today) {
              const createdDate = new Date(apt.created_at)
              const minutesAgo = Math.floor((now.getTime() - createdDate.getTime()) / 60000)
              const timeLabel = minutesAgo < 60
                ? `${minutesAgo}min atrás`
                : `${Math.floor(minutesAgo / 60)}h atrás`

              notifs.push({
                id: `new-${apt.id}`,
                type: 'appointment',
                title: 'Novo agendamento',
                message: `${apt.client_name || 'Cliente'} - ${apt.service_name || 'Serviço'} em ${new Date(apt.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
                time: timeLabel,
                read: minutesAgo > 30,
                link: '/salon/agendamentos'
              })
            }
          })
        }

        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read).length)
      } catch (error) {
        console.error('Erro ao buscar notificações:', error)
      }
    }

    fetchNotifications()

    // Supabase Realtime: listen for new/updated appointments
    const channel = supabase
      .channel(`salon-appointments-${user.salon_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${user.salon_id}`
        },
        (payload: any) => {
          const apt = payload.new
          const newNotif: Notification = {
            id: `realtime-${apt.id}`,
            type: 'appointment',
            title: '🔔 Novo agendamento!',
            message: `${apt.client_name || 'Cliente'} - ${apt.service_name || 'Serviço'} em ${apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}`,
            time: 'Agora',
            read: false,
            link: '/salon/agendamentos'
          }
          setNotifications(prev => [newNotif, ...prev].slice(0, 15))
          setUnreadCount(prev => prev + 1)

          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.3
            audio.play().catch(() => { })
          } catch { }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${user.salon_id}`
        },
        (payload: any) => {
          const apt = payload.new
          const oldApt = payload.old

          // Only notify on status changes
          if (apt.status !== oldApt?.status) {
            const statusLabels: Record<string, string> = {
              confirmed: '✅ Agendamento confirmado',
              cancelled: '❌ Agendamento cancelado',
              completed: '✔️ Atendimento concluído',
              no_show: '⚠️ Cliente não compareceu'
            }

            const title = statusLabels[apt.status] || 'Agendamento atualizado'

            const updateNotif: Notification = {
              id: `update-${apt.id}-${Date.now()}`,
              type: 'appointment',
              title,
              message: `${apt.client_name || 'Cliente'} - ${apt.service_name || 'Serviço'}`,
              time: 'Agora',
              read: false,
              link: '/salon/agendamentos'
            }
            setNotifications(prev => [updateNotif, ...prev].slice(0, 15))
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    // Realtime Kill-Switch: Listen for salon status changes
    const salonChannel = supabase
      .channel(`salon-status-${user.salon_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'salons',
          filter: `id=eq.${user.salon_id}`
        },
        (payload: any) => {
          const newStatus = payload.new.status
          if (newStatus === 'inactive' || newStatus === 'suspended') {
            const reason = newStatus === 'inactive' ? 'SALON_INACTIVE' : 'SALON_SUSPENDED'
            router.push(`/salon/bloqueado?reason=${reason}&salon=${encodeURIComponent(payload.new.name)}`)
          }
        }
      )
      .subscribe()

    // Refresh notifications every 5 minutes as backup
    const interval = setInterval(fetchNotifications, 300000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
      supabase.removeChannel(salonChannel)
    }
  }, [user?.salon_id, router])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: adminUser, error } = await (supabase as any)
        .from('admin_users')
        .select('*, salons(*)')
        .eq('user_id', session.user.id)
        .single()

      if (error || !adminUser) {
        router.push('/login')
        return
      }

      if (adminUser.role === 'superadmin') {
        router.push('/admin')
        return
      }

      if (!adminUser.salon_id) {
        router.push('/login')
        return
      }

      // Enterprise: Check salon status (active, inactive, suspended, deleted)
      const salonData = adminUser.salons as Salon
      if (salonData) {
        if (salonData.status === 'inactive' || salonData.status === 'suspended') {
          // Redirect to blocked page with reason
          const reason = salonData.status === 'inactive' ? 'SALON_INACTIVE' : 'SALON_SUSPENDED'
          router.push(`/salon/bloqueado?reason=${reason}&salon=${encodeURIComponent(salonData.name)}`)
          return
        }
      }

      setUser(adminUser as AdminUser)
      setSalon(salonData)
      setIsLoading(false)
    } catch (err) {
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNotificationClick = (notif: Notification) => {
    setShowNotifications(false)
    if (notif.link) router.push(notif.link)
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-primary-400" />
      case 'client': return <Users className="w-4 h-4 text-blue-400" />
      default: return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const getPageTitle = () => {
    const item = menuItems.find(n => pathname === n.href || (n.href !== '/salon/dashboard' && pathname?.startsWith(n.href)))
    return item?.label || 'Dashboard'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirecionar para a página de busca ou filtrar na página atual
      const query = searchQuery.toLowerCase().trim()

      // Buscar em diferentes seções baseado nas palavras-chave
      if (query.includes('cliente') || query.includes('client')) {
        router.push(`/salon/clientes?search=${encodeURIComponent(searchQuery)}`)
      } else if (query.includes('agend') || query.includes('horário') || query.includes('marcad')) {
        router.push(`/salon/agendamentos?search=${encodeURIComponent(searchQuery)}`)
      } else if (query.includes('serviço') || query.includes('servic') || query.includes('corte') || query.includes('tratamento')) {
        router.push(`/salon/servicos?search=${encodeURIComponent(searchQuery)}`)
      } else if (query.includes('profissional') || query.includes('equipe') || query.includes('funcionário')) {
        router.push(`/salon/profissionais?search=${encodeURIComponent(searchQuery)}`)
      } else if (query.includes('financ') || query.includes('caixa') || query.includes('pagamento')) {
        router.push(`/salon/financeiro?search=${encodeURIComponent(searchQuery)}`)
      } else if (query.includes('produto') || query.includes('estoque')) {
        router.push(`/salon/estoque?search=${encodeURIComponent(searchQuery)}`)
      } else {
        // Busca padrão - vai para clientes
        router.push(`/salon/clientes?search=${encodeURIComponent(searchQuery)}`)
      }
      setSearchQuery('')
    }
  }

  const searchSuggestions = [
    { label: 'Clientes', placeholder: 'ex: Maria Silva', path: '/salon/clientes' },
    { label: 'Agendamentos', placeholder: 'ex: agendamento hoje', path: '/salon/agendamentos' },
    { label: 'Serviços', placeholder: 'ex: corte feminino', path: '/salon/servicos' },
  ]

  // Busca global em tempo real
  // P1-SEARCH-001: Usando sanitização da biblioteca de segurança
  useEffect(() => {
    if (!searchQuery.trim() || !user?.salon_id) {
      setSearchResults({ clients: [], services: [], professionals: [], appointments: [] })
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)

      // P1-SEARCH-001: Sanitize search term using security library
      const clientsOrClause = buildSearchOrClause({
        term: searchQuery,
        columns: ['name', 'phone', 'email']
      })

      const servicesOrClause = buildSearchOrClause({
        term: searchQuery,
        columns: ['name', 'category']
      })

      const professionalsOrClause = buildSearchOrClause({
        term: searchQuery,
        columns: ['name', 'specialty']
      })

      const appointmentsOrClause = buildSearchOrClause({
        term: searchQuery,
        columns: ['client_name', 'service_name']
      })

      // Skip if search term is invalid (returns null from sanitization)
      // All clauses use the same input, so if one is null, all are null
      if (!clientsOrClause || !servicesOrClause || !professionalsOrClause || !appointmentsOrClause) {
        setSearchResults({ clients: [], services: [], professionals: [], appointments: [] })
        setIsSearching(false)
        return
      }

      try {
        // Type-safe: all clauses are now guaranteed to be string (not null)
        // Buscar clientes - using sanitized query
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, phone, email')
          .eq('salon_id', user.salon_id)
          .or(clientsOrClause)
          .limit(5)

        // Buscar serviços - using sanitized query
        const { data: services } = await supabase
          .from('services')
          .select('id, name, price, category')
          .eq('salon_id', user.salon_id)
          .eq('is_active', true)
          .or(servicesOrClause)
          .limit(5)

        // Buscar profissionais - using sanitized query
        const { data: professionals } = await supabase
          .from('professionals')
          .select('id, name, specialty')
          .eq('salon_id', user.salon_id)
          .eq('status', 'active')
          .or(professionalsOrClause)
          .limit(5)

        // Buscar agendamentos (últimos 30 dias e próximos 30 dias)
        const today = new Date()
        const past30 = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0]
        const future30 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]

        // Using sanitized query for appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id, client_name, service_name, scheduled_date, scheduled_time')
          .eq('salon_id', user.salon_id)
          .gte('scheduled_date', past30)
          .lte('scheduled_date', future30)
          .or(appointmentsOrClause)
          .order('scheduled_date', { ascending: true })
          .limit(5)

        setSearchResults({
          clients: clients || [],
          services: services || [],
          professionals: professionals || [],
          appointments: appointments || []
        })
      } catch (error) {
        console.error('Erro na busca:', error)
      }

      setIsSearching(false)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, user?.salon_id])

  const totalResults = searchResults.clients.length + searchResults.services.length + searchResults.professionals.length + searchResults.appointments.length

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[#0f1419] light:bg-gray-50 flex items-center justify-center transition-colors duration-300">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="text-gray-400 text-sm">Verificando autenticação...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] flex">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={appearance.animations_enabled ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={appearance.animations_enabled ? { opacity: 0 } : undefined}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "lg:m-3 lg:rounded-2xl lg:h-[calc(100vh-24px)] lg:translate-x-0",
          appearance.sidebar_compact ? "bg-transparent border-none" : "bg-white dark:bg-[#1c1c1f] border-r lg:border dark:border-white/5 border-gray-200 shadow-sm",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64 w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className={cn("flex items-center gap-3 p-4 border-b dark:border-white/5 border-gray-200", sidebarCollapsed && "justify-center", appearance.sidebar_compact && "border-b-0")}>
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            {appearance.logo_url ? (
              <img src={appearance.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="dark:text-white light:text-gray-900 font-bold truncate block">{salon?.name || 'Meu Salão'}</span>
              <p className="text-xs dark:text-gray-500 light:text-gray-600 truncate">{user?.email}</p>
            </div>
          )}

          <button onClick={() => setSidebarOpen(false)} className="lg:hidden dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 ml-auto flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/salon/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive ? "bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white shadow-md shadow-[var(--color-primary-500)]/20" : "dark:text-gray-400 light:text-gray-600 dark:hover:bg-white/5 light:hover:bg-gray-100 dark:hover:text-white light:hover:text-gray-900",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t dark:border-white/5 light:border-gray-200 lg:hidden">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-500)] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="dark:text-white light:text-gray-900 font-medium text-sm truncate">{user?.name || 'Usuário'}</p>
              <p className="dark:text-gray-500 light:text-gray-600 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <a
            href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o Poderosa Agenda."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 dark:text-gray-400 light:text-gray-600 dark:hover:text-[var(--color-primary-400)] light:hover:text-[var(--color-primary-600)] dark:hover:bg-[var(--color-primary-500)]/10 light:hover:bg-[var(--color-primary-50)] rounded-xl transition-colors"
          >
            <Headphones className="w-5 h-5" />
            <span className="font-medium text-sm">Suporte</span>
          </a>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 dark:text-gray-400 light:text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden lg:block p-3 border-t dark:border-white/5 light:border-gray-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 dark:text-gray-400 light:text-gray-600 dark:hover:text-[var(--color-primary-400)] light:hover:text-[var(--color-primary-600)] dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-colors",
              sidebarCollapsed && "justify-center"
            )}
            title={sidebarCollapsed ? "Expandir" : "Recolher"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!sidebarCollapsed && <span className="font-medium text-sm">Recolher</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden lg:py-3">
        <header className="sticky top-0 z-30 bg-white dark:bg-[#1c1c1f] border-b dark:border-white/5 border-gray-200 lg:rounded-2xl px-4 lg:px-6 py-3 mb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold dark:text-white text-gray-900">{getPageTitle()}</h1>
                <p className="text-xs dark:text-gray-500 text-gray-500 hidden sm:block">{salon?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto relative">
              <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200",
                searchFocused
                  ? "dark:bg-white/10 bg-white dark:border-[var(--color-primary-500)]/50 border-[var(--color-primary-500)] shadow-lg shadow-[var(--color-primary-500)]/10"
                  : "dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 hover:border-gray-300"
              )}>
                <Search className={cn(
                  "w-4 h-4 transition-colors",
                  searchFocused ? "text-[var(--color-primary-500)]" : "text-gray-500"
                )} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Buscar clientes, serviços, agendamentos..."
                  className="bg-transparent dark:text-white text-gray-900 placeholder-gray-500 text-sm flex-1 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium dark:text-gray-500 text-gray-400 dark:bg-white/5 bg-gray-100 rounded border dark:border-white/10 border-gray-200">
                  ⌘K
                </kbd>
              </div>

              {/* Resultados da busca global */}
              <AnimatePresence>
                {searchFocused && (
                  <motion.div
                    initial={appearance.animations_enabled ? { opacity: 0, y: 10 } : undefined}
                    animate={{ opacity: 1, y: 0 }}
                    exit={appearance.animations_enabled ? { opacity: 0, y: 10 } : undefined}
                    className="absolute top-full left-0 right-0 mt-2 dark:bg-[#1c1c1f] bg-white border dark:border-white/10 border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                  >
                    {!searchQuery ? (
                      // Sugestões quando não há busca
                      <div className="p-3">
                        <p className="text-xs dark:text-gray-500 light:text-gray-500 font-medium mb-2 px-1">BUSCA RÁPIDA</p>
                        <div className="space-y-1">
                          {searchSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.path}
                              type="button"
                              onClick={() => router.push(suggestion.path)}
                              className="w-full flex items-center gap-3 px-3 py-2 dark:text-gray-300 light:text-gray-700 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors text-left"
                            >
                              <Search className="w-4 h-4 text-gray-500" />
                              <div>
                                <span className="text-sm font-medium">{suggestion.label}</span>
                                <span className="text-xs dark:text-gray-500 light:text-gray-500 ml-2">{suggestion.placeholder}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="px-1 py-2 border-t dark:border-white/5 light:border-gray-100 mt-2">
                          <p className="text-[10px] dark:text-gray-600 light:text-gray-400 text-center">
                            Digite para buscar clientes, serviços, agendamentos...
                          </p>
                        </div>
                      </div>
                    ) : isSearching ? (
                      // Loading
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                        <span className="ml-2 text-sm dark:text-gray-400 light:text-gray-600">Buscando...</span>
                      </div>
                    ) : totalResults === 0 ? (
                      // Nenhum resultado
                      <div className="p-6 text-center">
                        <Search className="w-8 h-8 dark:text-gray-600 light:text-gray-400 mx-auto mb-2" />
                        <p className="dark:text-gray-400 light:text-gray-600 text-sm">Nenhum resultado para "{searchQuery}"</p>
                        <p className="dark:text-gray-500 light:text-gray-500 text-xs mt-1">Tente buscar por nome, telefone ou serviço</p>
                      </div>
                    ) : (
                      // Resultados
                      <div className="divide-y dark:divide-white/5 light:divide-gray-100">
                        {/* Clientes */}
                        {searchResults.clients.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs dark:text-gray-500 light:text-gray-500 font-medium mb-2 px-1 flex items-center gap-2">
                              <Users className="w-3 h-3" /> CLIENTES ({searchResults.clients.length})
                            </p>
                            <div className="space-y-1">
                              {searchResults.clients.map((client) => (
                                <button
                                  key={client.id}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('')
                                    setSearchFocused(false)
                                    router.push(`/salon/clientes?search=${encodeURIComponent(client.name)}`)
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{client.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{client.name}</p>
                                    <p className="dark:text-gray-500 light:text-gray-500 text-xs truncate">
                                      {client.phone ? formatPhone(client.phone) : client.email || 'Sem contato'}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Serviços */}
                        {searchResults.services.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs dark:text-gray-500 light:text-gray-500 font-medium mb-2 px-1 flex items-center gap-2">
                              <Scissors className="w-3 h-3" /> SERVIÇOS ({searchResults.services.length})
                            </p>
                            <div className="space-y-1">
                              {searchResults.services.map((service) => (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('')
                                    setSearchFocused(false)
                                    router.push(`/salon/servicos?search=${encodeURIComponent(service.name)}`)
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Scissors className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{service.name}</p>
                                    <p className="dark:text-gray-500 light:text-gray-500 text-xs">
                                      {service.category} • <span className="text-primary-400">{formatCurrency(service.price)}</span>
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Profissionais */}
                        {searchResults.professionals.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs dark:text-gray-500 light:text-gray-500 font-medium mb-2 px-1 flex items-center gap-2">
                              <UserCircle className="w-3 h-3" /> PROFISSIONAIS ({searchResults.professionals.length})
                            </p>
                            <div className="space-y-1">
                              {searchResults.professionals.map((pro) => (
                                <button
                                  key={pro.id}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('')
                                    setSearchFocused(false)
                                    router.push(`/salon/profissionais?search=${encodeURIComponent(pro.name)}`)
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{pro.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{pro.name}</p>
                                    <p className="dark:text-gray-500 light:text-gray-500 text-xs truncate">{pro.specialty?.join(', ') || 'Profissional'}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Agendamentos */}
                        {searchResults.appointments.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs dark:text-gray-500 light:text-gray-500 font-medium mb-2 px-1 flex items-center gap-2">
                              <Calendar className="w-3 h-3" /> AGENDAMENTOS ({searchResults.appointments.length})
                            </p>
                            <div className="space-y-1">
                              {searchResults.appointments.map((apt) => (
                                <button
                                  key={apt.id}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('')
                                    setSearchFocused(false)
                                    router.push(`/salon/agendamentos?search=${encodeURIComponent(apt.client_name || '')}`)
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{apt.client_name || 'Cliente'}</p>
                                    <p className="dark:text-gray-500 light:text-gray-500 text-xs truncate">
                                      {apt.service_name} • {new Date(apt.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {apt.scheduled_time?.slice(0, 5)}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ver mais resultados */}
                        <div className="p-2">
                          <button
                            type="submit"
                            className="w-full py-2 text-sm text-primary-500 hover:text-primary-400 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            Ver todos os resultados para "{searchQuery}"
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </header>

        <main data-lenis-prevent className="flex-1 overflow-y-auto px-4 lg:px-0 pb-6">
          <div className="bg-[var(--bg-primary)] lg:bg-transparent lg:rounded-2xl">
            {user && salon ? (
              <SalonLayoutContext.Provider value={{
                salonId: user.salon_id,
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  salon_id: user.salon_id,
                },
                salon: {
                  id: salon.id,
                  name: salon.name,
                  plan: salon.plan,
                  status: salon.status,
                },
              }}>
                {children}
              </SalonLayoutContext.Provider>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      <aside className="hidden lg:flex flex-col w-16 m-3 dark:bg-[#1c1c1f] light:bg-white rounded-2xl h-[calc(100vh-24px)] border dark:border-white/5 light:border-gray-200">
        <div className="flex-1 p-2 space-y-2">
          <ThemeToggle />

          <Link href="/salon/agendamentos?new=true" className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all group" title="Novo Agendamento">
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          <div className="relative" ref={notificationRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-all relative" title="Notificações">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute right-full mr-2 top-0 w-80 dark:bg-[#1c1c1f] light:bg-white border dark:border-white/10 light:border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 light:border-gray-200">
                    <h3 className="dark:text-white light:text-gray-900 font-semibold">Agendamentos de Hoje</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-primary-400 hover:text-primary-300">Marcar como lidas</button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="w-12 h-12 dark:bg-white/5 light:bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6 dark:text-gray-500 light:text-gray-400" />
                        </div>
                        <p className="dark:text-gray-400 light:text-gray-600 text-sm text-center">Nenhum agendamento</p>
                        <p className="dark:text-gray-500 light:text-gray-500 text-xs text-center mt-1">Sem compromissos para hoje</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn("w-full flex items-start gap-3 px-4 py-3 dark:hover:bg-white/5 light:hover:bg-gray-50 transition-colors text-left", !notif.read && "bg-primary-500/5")}
                        >
                          <div className="w-8 h-8 dark:bg-white/5 light:bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{notif.title}</p>
                              {!notif.read && <span className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0" />}
                            </div>
                            <p className="dark:text-gray-400 light:text-gray-600 text-xs truncate">{notif.message}</p>
                            <p className="dark:text-gray-500 light:text-gray-500 text-xs mt-1">{notif.time}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t dark:border-white/5 light:border-gray-200 p-2">
                      <Link href="/salon/agendamentos" onClick={() => setShowNotifications(false)} className="block w-full text-center py-2 text-sm text-primary-500 hover:text-primary-600 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors">
                        Ver todos os agendamentos
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mx-3 border-t dark:border-white/5 light:border-gray-200" />

        <div className="p-2 space-y-2">
          <Link href="/salon/configuracoes" className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-all group relative" title={user?.name || 'Perfil'}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </Link>

          <a
            href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o Poderosa Agenda."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 dark:hover:text-primary-400 light:hover:text-primary-600 dark:hover:bg-primary-500/10 light:hover:bg-primary-50 rounded-xl transition-all"
            title="Suporte"
          >
            <Headphones className="w-5 h-5" />
          </a>

          <button onClick={handleLogout} className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Sair">
            <LogOut className="w-5 h-5" />
          </button>

          {/* Version Badge */}
          <div className="mt-2">
            <VersionBadge onClick={() => setShowWhatsNew(true)} />
          </div>
        </div>
      </aside>

      {/* What's New Modal */}
      <WhatsNewModal />
      {showWhatsNew && (
        <WhatsNewModal forceOpen onClose={() => setShowWhatsNew(false)} />
      )}
    </div>
  )
}
