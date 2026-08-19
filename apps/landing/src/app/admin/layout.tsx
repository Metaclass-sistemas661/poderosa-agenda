'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Clock,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Solicitações', href: '/admin/solicitacoes', icon: Clock },
  { name: 'Salões', href: '/admin/saloes', icon: Building2 },
  { name: 'Usuários', href: '/admin/usuarios', icon: Users },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

interface Notification {
  id: string
  type: 'request' | 'salon' | 'system'
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const notificationRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSalonModal, setShowSalonModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Verificar autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Buscar dados do admin — superadmin obrigatório
      const { data: adminUser, error } = await (supabase as any)
        .from('admin_users')
        .select('name, email, role')
        .eq('user_id', session.user.id)
        .single()

      // Sem registro em admin_users → sem acesso
      if (error || !adminUser) {
        router.push('/login')
        return
      }

      const typedAdmin = adminUser as { name: string; email: string; role: string }

      // Somente superadmin pode acessar /admin
      if (typedAdmin.role !== 'superadmin') {
        router.push('/salon')
        return
      }

      setUser(typedAdmin)
      setIsLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Buscar notificações (solicitações pendentes) - APENAS após autenticação
  useEffect(() => {
    // Só busca se autenticação confirmada (isLoading = false)
    if (isLoading || !user) return

    const fetchNotifications = async () => {
      try {
        // Usar RPC com SECURITY DEFINER para evitar problemas de RLS
        const { data: result, error } = await (supabase.rpc as any)('admin_list_access_requests', {
          p_status: 'pending',
          p_limit: 10,
          p_offset: 0
        })

        if (error) {
          console.error('Erro RPC:', error)
          return
        }

        if (result?.success && result?.data?.length > 0) {
          const requests = result.data as Array<{ id: string; salon_name: string; owner_name: string; created_at: string }>
          const notifs: Notification[] = requests.map(req => ({
            id: req.id,
            type: 'request',
            title: 'Nova Solicitação',
            message: `${req.owner_name} solicitou acesso para ${req.salon_name}`,
            time: formatTimeAgo(new Date(req.created_at)),
            read: false,
            link: '/admin/solicitacoes'
          }))
          setNotifications(notifs)
          setUnreadCount(notifs.length)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error)
      }
    }

    fetchNotifications()

    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isLoading, user])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  const handleNotificationClick = (notif: Notification) => {
    setShowNotifications(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request': return <UserPlus className="w-4 h-4 text-blue-400" />
      case 'salon': return <Building2 className="w-4 h-4 text-emerald-400" />
      case 'system': return <AlertCircle className="w-4 h-4 text-amber-400" />
      default: return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[#0f1419] light:bg-gray-50 flex items-center justify-center transition-colors duration-300">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-gray-400 text-sm">Verificando autenticação...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[#0f1419] light:bg-gray-50 flex transition-colors duration-300">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static top-0 left-0 z-50 h-screen dark:bg-[#1a2332] light:bg-white flex flex-col transform transition-all duration-300 lg:translate-x-0 lg:m-3 lg:rounded-2xl lg:h-[calc(100vh-24px)] border dark:border-white/5 light:border-gray-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64 w-64"
        )}>
          {/* Logo */}
          <div className={cn("flex items-center gap-3 p-4 border-b dark:border-white/5 light:border-gray-200", sidebarCollapsed && "justify-center")}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="dark:text-white light:text-gray-900 font-bold">Poderosa Agenda</span>
                <p className="text-xs dark:text-gray-500 light:text-gray-600">SuperAdmin</p>
              </div>
            )}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                      : "dark:text-gray-400 light:text-gray-700 dark:hover:bg-white/5 light:hover:bg-gray-100 dark:hover:text-white light:hover:text-gray-900",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                  {/* Badge para Solicitações */}
                  {item.name === 'Solicitações' && unreadCount > 0 && !sidebarCollapsed && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Collapse Toggle (Desktop only) */}
          <div className="hidden lg:block p-3 border-t dark:border-white/5 light:border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-colors",
                sidebarCollapsed && "justify-center"
              )}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {!sidebarCollapsed && <span className="font-medium text-sm">Recolher</span>}
            </button>
          </div>

          {/* Mobile User Section (apenas em telas menores) */}
          <div className="p-3 border-t dark:border-white/5 light:border-gray-200 lg:hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="dark:text-white light:text-gray-900 font-medium text-sm truncate">{user?.name || 'Usuário'}</p>
                <p className="dark:text-gray-500 light:text-gray-600 text-xs truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 dark:text-gray-400 light:text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sair</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden lg:py-3">
          {/* Top Header */}
          <header className="sticky top-0 z-30 dark:bg-[#1a2332] light:bg-white lg:rounded-2xl px-4 lg:px-6 py-4 mb-3 border-b dark:border-white/5 light:border-gray-200 lg:border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold dark:text-white light:text-gray-900">
                  {navigation.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.name || 'Dashboard'}
                </h1>
              </div>

              {/* Search - agora no centro */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 dark:bg-white/5 light:bg-gray-100 rounded-xl border dark:border-white/10 light:border-gray-200">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent dark:text-white light:text-gray-900 placeholder-gray-500 text-sm w-48 focus:outline-none"
                />
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-4 lg:px-0 pb-6">
            <div className="bg-[#0f1419] lg:bg-transparent lg:rounded-2xl">
              {children}
            </div>
          </main>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden lg:flex flex-col w-16 m-3 dark:bg-[#1a2332] light:bg-white rounded-2xl h-[calc(100vh-24px)] border dark:border-white/5 light:border-gray-200">
          {/* Top Actions */}
          <div className="flex-1 p-2 space-y-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all group"
              title="Adicionar"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-all relative"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    className="absolute right-full mr-2 top-0 w-80 dark:bg-[#1a2332] light:bg-white border dark:border-white/10 light:border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 light:border-gray-200">
                      <h3 className="dark:text-white light:text-gray-900 font-semibold">Notificações</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Marcar como lidas
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <div className="w-12 h-12 dark:bg-white/5 light:bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle className="w-6 h-6 dark:text-gray-500 light:text-gray-400" />
                          </div>
                          <p className="dark:text-gray-400 light:text-gray-600 text-sm text-center">Nenhuma notificação</p>
                          <p className="dark:text-gray-500 light:text-gray-500 text-xs text-center mt-1">Você está em dia!</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              "w-full flex items-start gap-3 px-4 py-3 dark:hover:bg-white/5 light:hover:bg-gray-50 transition-colors text-left",
                              !notif.read && "bg-emerald-500/5"
                            )}
                          >
                            <div className="w-8 h-8 dark:bg-white/5 light:bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="dark:text-white light:text-gray-900 text-sm font-medium truncate">{notif.title}</p>
                                {!notif.read && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="dark:text-gray-400 light:text-gray-600 text-xs truncate">{notif.message}</p>
                              <p className="dark:text-gray-500 light:text-gray-500 text-xs mt-1">{notif.time}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="border-t dark:border-white/5 light:border-gray-200 p-2">
                        <Link
                          href="/admin/solicitacoes"
                          onClick={() => setShowNotifications(false)}
                          className="block w-full text-center py-2 text-sm text-emerald-500 hover:text-emerald-600 dark:hover:bg-white/5 light:hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Ver todas as solicitações
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t dark:border-white/5 light:border-gray-200" />

          {/* Bottom Actions */}
          <div className="p-2 space-y-2">
            {/* Profile */}
            <button
              className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-white/5 light:hover:bg-gray-100 rounded-xl transition-all group relative"
              title={user?.name || 'Perfil'}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full aspect-square flex items-center justify-center dark:text-gray-400 light:text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a2332] rounded-2xl p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-white mb-4">Adicionar</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => { setShowAddModal(false); setShowSalonModal(true); }}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-full text-left"
                  >
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-white">Novo Salão</span>
                  </button>
                  <button
                    onClick={() => { setShowAddModal(false); setShowUserModal(true); }}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-full text-left"
                  >
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Novo Usuário</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Novo Salão Modal */}
        <AnimatePresence>
          {showSalonModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSalonModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a2332] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-white mb-4">Novo Salão</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome do Salão</label>
                    <input type="text" placeholder="Ex: Salão Beleza Total" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome do Proprietário</label>
                    <input type="text" placeholder="Ex: Maria Silva" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input type="email" placeholder="email@exemplo.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                    <input type="tel" placeholder="(11) 99999-9999" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Cidade</label>
                      <input type="text" placeholder="São Paulo" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Estado</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">UF</option>
                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowSalonModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                      Criar Salão
                    </button>
                  </div>
                </form>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Uma senha temporária será enviada por email
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Novo Usuário Modal */}
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
                className="bg-[#1a2332] rounded-2xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-white mb-4">Novo Usuário Admin</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome</label>
                    <input type="text" placeholder="Nome completo" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input type="email" placeholder="email@exemplo.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Permissão</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="admin">Administrador</option>
                      <option value="viewer">Apenas Visualização</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                      Criar Usuário
                    </button>
                  </div>
                </form>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Uma senha temporária será enviada por email
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}
