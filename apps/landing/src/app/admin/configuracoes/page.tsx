'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ConfiguracoesPage() {
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
          })
        }
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [])

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

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Mínimo 6 caracteres.' })
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Message Toast */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
            message.type === 'success' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold">Meu Perfil</h2>
          </div>

          <div className="p-4 space-y-4">
            {/* Avatar e info básica */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {profile.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{profile.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400 text-xs">{getRoleLabel(profile.role)}</span>
                </div>
              </div>
            </div>

            {/* Campos */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nome</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Desde
                </label>
                <input
                  type="text"
                  value={profile.createdAt}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </motion.div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold">Alterar Senha</h2>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Senha Atual</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicador de força */}
              {passwords.new && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        passwords.new.length >= i * 3
                          ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Confirmar Nova</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Repita a senha"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Alterar Senha
            </button>

            {/* Encerrar sessões */}
            <div className="pt-4 border-t border-white/5">
              <button
                onClick={async () => {
                  await supabase.auth.signOut({ scope: 'global' })
                  window.location.href = '/login'
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Todas as Sessões
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}