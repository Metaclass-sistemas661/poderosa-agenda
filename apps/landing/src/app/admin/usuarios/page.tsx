'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Shield,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronDown,
  User,
  Building2,
  Phone,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSafeErrorMessage } from '@/lib/errors/toast'
import type { Json } from '@/lib/database.types'

interface AdminUser {
  id: string
  user_id: string | null
  name: string
  email: string
  cpf: string | null
  phone: string | null
  role: 'superadmin' | 'admin' | 'manager' | 'support' | 'viewer'
  permissions: Json
  salon_id: string | null
  salon?: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

interface Salon {
  id: string
  name: string
  status: string
}

const roleConfig = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', gradient: 'from-purple-500 to-indigo-600' },
  admin: { label: 'Administrador', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', gradient: 'from-emerald-500 to-teal-600' },
  manager: { label: 'Gerente', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-500 to-cyan-600' },
  support: { label: 'Suporte', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', gradient: 'from-amber-500 to-orange-600' },
  viewer: { label: 'Visualização', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', gradient: 'from-gray-500 to-gray-600' },
}

// Funções de validação e formatação
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '')
  if (numbers.length !== 11) return false
  if (/^(\d)\1+$/.test(numbers)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i)
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(numbers[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i)
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === parseInt(numbers[10])
}

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [salons, setSalons] = useState<Salon[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'viewer' as AdminUser['role'],
    salon_id: ''
  })
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'admin' as AdminUser['role'],
    salon_id: ''
  })

  const fetchUsers = async () => {
    setIsLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setCurrentUserId(session.user.id)
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        salon:salons(id, name)
      `)
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
    if (error) console.error('Erro:', error)
    setIsLoading(false)
  }

  const fetchSalons = async () => {
    const { data } = await supabase
      .from('salons')
      .select('id, name, status')
      .eq('status', 'active')
      .order('name')

    if (data) setSalons(data)
  }

  useEffect(() => {
    fetchUsers()
    fetchSalons()
  }, [])

  // Validar formulário de criação
  const validateCreateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    if (!createForm.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (createForm.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!createForm.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(createForm.email)) {
      newErrors.email = 'Email inválido'
    }

    if (createForm.cpf && !validateCPF(createForm.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    // Verificar se email já existe
    if (createForm.email) {
      const { data: existingEmail } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', createForm.email)
        .single()

      if (existingEmail) {
        newErrors.email = 'Email já cadastrado'
      }
    }

    // Verificar se CPF já existe
    if (createForm.cpf) {
      const cpfNumbers = createForm.cpf.replace(/\D/g, '')
      const { data: existingCpf } = await supabase
        .from('admin_users')
        .select('id')
        .eq('cpf', cpfNumbers)
        .single()

      if (existingCpf) {
        newErrors.cpf = 'CPF já cadastrado'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Editar usuário
  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      cpf: user.cpf ? formatCPF(user.cpf) : '',
      phone: user.phone ? formatPhone(user.phone) : '',
      role: user.role,
      salon_id: user.salon_id || ''
    })
    setErrors({})
    setShowEditDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return
    setIsSaving(true)
    const { error } = await (supabase.from('admin_users') as any)
      .update({
        name: editForm.name,
        role: editForm.role,
        cpf: editForm.cpf ? editForm.cpf.replace(/\D/g, '') : null,
        phone: editForm.phone ? editForm.phone.replace(/\D/g, '') : null,
        salon_id: editForm.salon_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedUser.id)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
        ...u,
        name: editForm.name,
        role: editForm.role,
        cpf: editForm.cpf ? editForm.cpf.replace(/\D/g, '') : null,
        phone: editForm.phone ? editForm.phone.replace(/\D/g, '') : null,
        salon_id: editForm.salon_id || null
      } : u))
      setMessage({ type: 'success', text: 'Usuário atualizado!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Deletar usuário
  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    setIsSaving(true)

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', selectedUser.id)

    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
      setMessage({ type: 'success', text: 'Usuário excluído!' })
      setShowDeleteModal(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao excluir.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Criar usuário
  const handleCreate = async () => {
    const isValid = await validateCreateForm()
    if (!isValid) return

    setIsSaving(true)

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: Math.random().toString(36).slice(-12) + 'Aa1!',
        email_confirm: true,
      })

      if (authError) {
        // Fallback: criar apenas na tabela admin_users sem auth
        const { data, error } = await (supabase.from('admin_users') as any)
          .insert({
            name: createForm.name,
            email: createForm.email,
            cpf: createForm.cpf ? createForm.cpf.replace(/\D/g, '') : null,
            phone: createForm.phone ? createForm.phone.replace(/\D/g, '') : null,
            role: createForm.role,
            salon_id: createForm.salon_id || null,
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            setErrors({ email: 'Email ou CPF já cadastrado' })
          } else {
            setMessage({ type: 'error', text: getSafeErrorMessage(error, 'criar usuário') })
          }
        } else if (data) {
          setUsers(prev => [data, ...prev])
          setMessage({ type: 'success', text: 'Usuário criado! (Envie as credenciais manualmente)' })
          setShowCreateDrawer(false)
          setCreateForm({ name: '', email: '', cpf: '', phone: '', role: 'admin', salon_id: '' })
          setErrors({})
        }
      } else if (authData.user) {
        // Usuário criado no Auth, agora criar na tabela
        const { data, error } = await (supabase.from('admin_users') as any)
          .insert({
            user_id: authData.user.id,
            name: createForm.name,
            email: createForm.email,
            cpf: createForm.cpf ? createForm.cpf.replace(/\D/g, '') : null,
            phone: createForm.phone ? createForm.phone.replace(/\D/g, '') : null,
            role: createForm.role,
            salon_id: createForm.salon_id || null,
          })
          .select()
          .single()

        if (!error && data) {
          setUsers(prev => [data, ...prev])
          setMessage({ type: 'success', text: 'Usuário criado! Email de acesso enviado.' })
          setShowCreateDrawer(false)
          setCreateForm({ name: '', email: '', cpf: '', phone: '', role: 'admin', salon_id: '' })
          setErrors({})
        }
      }
    } catch (err) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: 'Erro de conexão.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 5000)
  }

  const filteredUsers = users.filter(u =>
    searchTerm === '' ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              } text-white`}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários Admin</h1>
          <p className="text-gray-400 text-sm">Gerencie os administradores do sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 lg:w-64"
            />
          </div>
          <button
            onClick={() => { setShowCreateDrawer(true); setErrors({}); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(roleConfig).map(([role, config]) => {
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="bg-[#1a2332] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-2xl font-bold text-white">{count}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Users Table */}
      {!isLoading && filteredUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 flex flex-col max-h-[calc(100vh-380px)]"
        >
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nível</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Desde</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.user_id === currentUserId
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${roleConfig[user.role].gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium flex items-center gap-2">
                              {user.name}
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Você</span>
                              )}
                            </p>
                            <p className="text-gray-500 text-sm md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${roleConfig[user.role].color}`}>
                          <Shield className="w-3 h-3" />
                          {roleConfig[user.role].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredUsers.length === 0 && (
        <div className="bg-[#1a2332] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-400 text-sm">Tente alterar o termo de busca.</p>
        </div>
      )}

      {/* Create Drawer */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowCreateDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col rounded-3xl border border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Novo Usuário Admin</h2>
                    <p className="text-xs text-gray-500">Adicionar administrador ao sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateDrawer(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className={`w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? 'border-red-500' : 'border-white/10'
                        }`}
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className={`w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? 'border-red-500' : 'border-white/10'
                        }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* CPF e Telefone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={createForm.cpf}
                        onChange={(e) => setCreateForm({ ...createForm, cpf: formatCPF(e.target.value) })}
                        placeholder="000.000.000-00"
                        className={`w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.cpf ? 'border-red-500' : 'border-white/10'
                          }`}
                      />
                    </div>
                    {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: formatPhone(e.target.value) })}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Nível de Acesso */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Acesso</label>
                  <div className="space-y-2">
                    {Object.entries(roleConfig).filter(([key]) => key !== 'superadmin').map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, role: key as AdminUser['role'] })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${createForm.role === key
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-[#1a2332] border-white/10 hover:border-white/20'
                          }`}
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}>
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium text-sm">{config.label}</p>
                        </div>
                        {createForm.role === key && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select de Salão */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vincular a Salão <span className="text-gray-500">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={createForm.salon_id}
                      onChange={(e) => setCreateForm({ ...createForm, salon_id: e.target.value })}
                      className="w-full pl-12 pr-10 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="" className="bg-[#1a2332]">Nenhum salão (acesso global)</option>
                      {salons.map((salon) => (
                        <option key={salon.id} value={salon.id} className="bg-[#1a2332]">
                          {salon.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl p-4 border border-amber-500/20">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-200 font-medium">Credenciais de acesso</p>
                      <p className="text-xs text-amber-200/70 mt-1">Uma senha temporária será gerada e enviada automaticamente para o email informado.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Criar Usuário
                </button>
                <button
                  onClick={() => setShowCreateDrawer(false)}
                  className="w-full px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowEditDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${roleConfig[selectedUser.role].gradient} rounded-xl flex items-center justify-center`}>
                    <span className="text-white font-bold">{selectedUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Editar Usuário</h2>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={editForm.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={editForm.cpf}
                        onChange={(e) => setEditForm({ ...editForm, cpf: formatCPF(e.target.value) })}
                        placeholder="000.000.000-00"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Acesso</label>
                  {selectedUser.user_id === currentUserId ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-sm text-amber-200">Você não pode alterar seu próprio nível de acesso.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, role: key as AdminUser['role'] })}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${editForm.role === key
                            ? 'bg-emerald-500/10 border-emerald-500/50'
                            : 'bg-[#1a2332] border-white/10 hover:border-white/20'
                            }`}
                        >
                          <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}>
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-white font-medium text-sm flex-1 text-left">{config.label}</p>
                          {editForm.role === key && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select de Salão no Editar */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vincular a Salão</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={editForm.salon_id}
                      onChange={(e) => setEditForm({ ...editForm, salon_id: e.target.value })}
                      className="w-full pl-12 pr-10 py-3.5 bg-[#1a2332] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="" className="bg-[#1a2332]">Nenhum salão (acesso global)</option>
                      {salons.map((salon) => (
                        <option key={salon.id} value={salon.id} className="bg-[#1a2332]">
                          {salon.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em {formatDate(selectedUser.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="w-full px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2332] rounded-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white text-center mb-2">Excluir Usuário?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Tem certeza que deseja excluir <strong className="text-white">{selectedUser.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}