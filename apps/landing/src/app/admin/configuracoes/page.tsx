'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Clock,
  Loader2,
  LogOut,
  Settings,
  ChevronRight,
  Monitor
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRef } from 'react'

const menuItems = [
  { id: 'profile', label: 'Meu Perfil', icon: User, description: 'Informações básicas da conta' },
  { id: 'security', label: 'Segurança', icon: Lock, description: 'Senha e sessões' },
  { id: 'system', label: 'Sistema', icon: Monitor, description: 'Preferências do painel' }
]

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    createdAt: '',
    avatarUrl: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSavingSystem, setIsSavingSystem] = useState(false)

  const [systemSettings, setSystemSettings] = useState({
    id: '',
    maintenance_mode: false,
    require_manual_approval: false,
    enable_system_emails: true
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('name, email, role, created_at')
          .eq('user_id', session.user.id)
          .single() as { data: { name: string; email: string; role: string; created_at: string } | null }

        if (adminUser) {
          setProfile({
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            createdAt: new Date(adminUser.created_at).toLocaleDateString('pt-BR'),
            avatarUrl: session.user.user_metadata?.avatar_url || '',
          })
        }

        // Carregar config do sistema
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('*')
          .limit(1)
          .single()

        if (settingsData) {
          setSystemSettings({
            id: settingsData.id,
            maintenance_mode: settingsData.maintenance_mode,
            require_manual_approval: settingsData.require_manual_approval,
            enable_system_emails: settingsData.enable_system_emails
          })
        }
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 2MB' })
        return
      }

      setIsUploadingAvatar(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `admin_avatars/${session.user.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatarUrl: publicUrl }))
      setMessage({ type: 'success', text: 'Avatar atualizado!' })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao enviar a imagem.' })
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdateProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { error } = await (supabase
          .from('admin_users') as any)
          .update({ name: profile.name, updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Perfil atualizado!' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }

    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'Mínimo 8 caracteres exigidos para segurança.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.email) throw new Error('Sessão não encontrada')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: passwords.current,
      })

      if (signInError) {
        setMessage({ type: 'error', text: 'Senha atual incorreta.' })
        setIsSaving(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (updateError) throw updateError

      setPasswords({ current: '', new: '', confirm: '' })
      setMessage({ type: 'success', text: 'Senha alterada!' })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao alterar senha.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdateSystemSettings = async () => {
    if (!systemSettings.id) {
      setMessage({ type: 'error', text: 'Configurações de sistema não encontradas.' })
      return
    }

    setIsSavingSystem(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          maintenance_mode: systemSettings.maintenance_mode,
          require_manual_approval: systemSettings.require_manual_approval,
          enable_system_emails: systemSettings.enable_system_emails
        })
        .eq('id', systemSettings.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Configurações do sistema salvas!' })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar configurações do sistema.' })
    }

    setIsSavingSystem(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      superadmin: 'Super Admin',
      admin: 'Administrador',
      manager: 'Gerente',
      support: 'Suporte',
      viewer: 'Visualização',
    }
    return roles[role] || role
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            Configurações
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie seu perfil, segurança e preferências do painel administrativo
          </p>
        </div>
      </div>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${
              message.type === 'success' 
                ? 'bg-[#1a2332] border border-emerald-500/50 text-white' 
                : 'bg-[#1a2332] border border-red-500/50 text-white'
            }`}
          >
            {message.type === 'success' 
              ? <CheckCircle className="w-5 h-5 text-emerald-400" /> 
              : <AlertCircle className="w-5 h-5 text-red-400" />
            }
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-[#1a2332] border border-white/5 rounded-2xl p-3 sticky top-6">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                    activeTab === item.id 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    activeTab === item.id ? 'bg-emerald-500/20' : 'bg-white/5'
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      activeTab === item.id ? 'text-emerald-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${activeTab === item.id ? 'text-emerald-400' : 'text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                  </div>
                  {activeTab === item.id && (
                    <ChevronRight className="w-4 h-4 mt-2" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1a2332] border border-white/5 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white">Meu Perfil</h2>
                  <p className="text-sm text-gray-400">Informações e identidade no sistema</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                    >
                      {profile.avatarUrl ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border-2 border-transparent group-hover:border-emerald-500 transition-all">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <span className="text-white text-3xl font-bold">
                            {profile.name?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <User className="w-6 h-6 text-white" />}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">{profile.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">{getRoleLabel(profile.role)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-300">Nome Completo</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" /> Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-gray-500 text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500">O email é usado para login e não pode ser alterado.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" /> Membro Desde
                      </label>
                      <input
                        type="text"
                        value={profile.createdAt}
                        disabled
                        className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1a2332] border border-white/5 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white">Segurança e Acesso</h2>
                  <p className="text-sm text-gray-400">Proteja sua conta do SuperAdmin</p>
                </div>
                
                <div className="p-6 space-y-8">
                  {/* Troca de senha */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium text-gray-300 border-b border-white/5 pb-2">Alterar Senha</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">Senha Atual</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-11 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-400">Nova Senha</label>
                        <div className="relative">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full pl-11 pr-11 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwords.new && (
                          <div className="flex gap-1 mt-2 px-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full ${
                                  passwords.new.length >= i * 2
                                    ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                                    : 'bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-400">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder="Repita a senha"
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 text-white border border-white/10 text-sm font-medium rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Atualizar Senha
                      </button>
                    </div>
                  </div>

                  {/* Sessões Ativas */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-gray-300">Sessões Ativas</h3>
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div>
                        <p className="text-white text-sm font-medium">Encerrar Todas as Sessões</p>
                        <p className="text-red-400/80 text-xs mt-1">Isso desconectará você de todos os dispositivos ativos.</p>
                      </div>
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut({ scope: 'global' })
                          window.location.href = '/login'
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Desconectar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1a2332] border border-white/5 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white">Preferências do Sistema</h2>
                  <p className="text-sm text-gray-400">Opções globais para o painel SuperAdmin</p>
                </div>
                <div className="p-6 space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-xl">
                    <div className="pr-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Modo de Manutenção
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Bloqueia o acesso à plataforma para usuários normais. Apenas SuperAdmins poderão fazer login.</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(p => ({ ...p, maintenance_mode: !p.maintenance_mode }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#1a2332] ${systemSettings.maintenance_mode ? 'bg-emerald-500' : 'bg-gray-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${systemSettings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {/* require_manual_approval */}
                  <div className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-xl">
                    <div className="pr-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        Aprovação Manual de Salões
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Se ativo, novos salões precisarão de aprovação manual sua. Se inativo, são aprovados e provisionados assim que pagarem.</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(p => ({ ...p, require_manual_approval: !p.require_manual_approval }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#1a2332] ${systemSettings.require_manual_approval ? 'bg-emerald-500' : 'bg-gray-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${systemSettings.require_manual_approval ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {/* enable_system_emails */}
                  <div className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-xl">
                    <div className="pr-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        Envio de E-mails Transacionais
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Habilita ou desabilita (kill-switch) o envio global de todos os e-mails automáticos da plataforma.</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(p => ({ ...p, enable_system_emails: !p.enable_system_emails }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#1a2332] ${systemSettings.enable_system_emails ? 'bg-emerald-500' : 'bg-gray-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${systemSettings.enable_system_emails ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                  <button
                    onClick={handleUpdateSystemSettings}
                    disabled={isSavingSystem}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {isSavingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Configurações
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}