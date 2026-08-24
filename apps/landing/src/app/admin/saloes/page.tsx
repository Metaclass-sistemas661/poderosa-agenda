'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  Users,
  Star,
  Power,
  FileText,
  ChevronDown,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createSalonManual } from '@/app/actions/provisioning'
import { changeSalonStatus, deleteSalon, updateSalonDetails } from '@/app/actions/salon-management'

interface Salon {
  id: string
  name: string
  owner_name: string
  email: string
  phone: string
  city: string
  state: string
  plan: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
  professionals_count: string
  cnpj: string | null
  owner_cpf: string | null
  address: string | null
  zip_code: string | null
  address_number: string | null
  neighborhood: string | null
  created_at: string
  updated_at: string
}

// Formatação e validação
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 14)
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '')
  if (numbers.length !== 11 || /^(\d)\1+$/.test(numbers)) return false
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

const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '')
  if (numbers.length !== 14 || /^(\d)\1+$/.test(numbers)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(numbers[i]) * weights1[i]
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(numbers[12])) return false
  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(numbers[i]) * weights2[i]
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return digit === parseInt(numbers[13])
}

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const stateOptionsWithNames = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
]

const planConfig = {
  basic: { label: 'Básico', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', gradient: 'from-gray-500 to-gray-600' },
  pro: { label: 'Pro', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-500 to-cyan-600' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', gradient: 'from-purple-500 to-indigo-600' },
}

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
  inactive: { label: 'Inativo', color: 'bg-gray-500/20 text-gray-400', dot: 'bg-gray-400' },
  suspended: { label: 'Suspenso', color: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
  defaulter: { label: 'Inadimplente', color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
}

const teamSizeOptions = [
  { value: '1', label: '1 profissional' },
  { value: '2-3', label: '2 a 3 profissionais' },
  { value: '4-5', label: '4 a 5 profissionais' },
  { value: '6-10', label: '6 a 10 profissionais' },
  { value: '10+', label: 'Mais de 10 profissionais' },
]

export default function SaloesPage() {
  const [salons, setSalons] = useState<Salon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showViewDrawer, setShowViewDrawer] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [editForm, setEditForm] = useState<Partial<Salon>>({})

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEditForm(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar CEP', e);
    }
  };
  

  const fetchSalons = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setSalons(data as unknown as Salon[])
    if (error) console.error('Erro:', error)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSalons()
  }, [])

  // Visualizar
  const handleView = (salon: Salon) => {
    setSelectedSalon(salon)
    setShowViewDrawer(true)
  }

  // Editar
  const handleEdit = (salon: Salon) => {
    setSelectedSalon(salon)
    setEditForm({
      name: salon.name,
      owner_name: salon.owner_name,
      phone: salon.phone,
      city: salon.city,
      state: salon.state,
      plan: salon.plan,
      status: salon.status,
      professionals_count: salon.professionals_count
    })
    setShowEditDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedSalon) return
    setIsSaving(true)
    const { error } = await (supabase.from('salons') as any)
      .update({
        ...editForm,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedSalon.id)

    if (!error) {
      setSalons(prev => prev.map(s => s.id === selectedSalon.id ? { ...s, ...editForm } as Salon : s))
      setMessage({ type: 'success', text: 'Salão atualizado!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Deletar
  const handleDelete = (salon: Salon) => {
    setSelectedSalon(salon)
    setShowDeleteModal(true)
  }

  // Soft delete - usando Server Action (superadmin only via RPC)
  const confirmDelete = async () => {
    if (!selectedSalon) return
    setIsSaving(true)

    const result = await deleteSalon(selectedSalon.id, 'Excluído pelo administrador')

    if (result.success) {
      setSalons(prev => prev.filter(s => s.id !== selectedSalon.id))
      setMessage({ type: 'success', text: 'Salão excluído (soft delete)!' })
      setShowDeleteModal(false)
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao excluir.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Criar — Canonical Provisioning Pipeline (F04)
  const handleCreate = async (createForm: any) => {
    setIsSaving(true)

    try {
      const result = await createSalonManual({
        salon_name: createForm.name,
        owner_name: createForm.owner_name,
        email: createForm.email,
        phone: createForm.phone ? createForm.phone.replace(/\D/g, '') : '',
        city: createForm.city,
        state: createForm.state,
        professionals: createForm.professionals_count,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Salão criado e provisionado com sucesso!' })
        setShowCreateDrawer(false)
        
        await fetchSalons() // Reload from DB to get the real record
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao criar salão.' })
      }
    } catch (err) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: 'Erro de conexão.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Toggle status - usando Server Action (superadmin only via RPC)
  const toggleStatus = async (salon: Salon) => {
    const newStatus = salon.status === 'active' ? 'inactive' : 'active'
    const result = await changeSalonStatus(salon.id, newStatus)

    if (result.success) {
      setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, status: newStatus } : s))
      setMessage({ type: 'success', text: `Salão ${newStatus === 'active' ? 'ativado' : 'desativado'}!` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao alterar status' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  // Suspender salão (superadmin only)
  const handleSuspend = async (salon: Salon) => {
    const result = await changeSalonStatus(salon.id, 'suspended', 'Suspenso pelo administrador')
    if (result.success) {
      setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, status: 'suspended' } : s))
      setMessage({ type: 'success', text: 'Salão suspenso!' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao suspender' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const filteredSalons = salons.filter(s => {
    const matchSearch = searchTerm === '' ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = filterStatus === 'all' || s.status === filterStatus

    return matchSearch && matchStatus
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  const stats = {
    total: salons.length,
    active: salons.filter(s => s.status === 'active').length,
    inactive: salons.filter(s => s.status === 'inactive').length,
    suspended: salons.filter(s => s.status === 'suspended').length,
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
          <h1 className="text-2xl font-bold text-white">Salões</h1>
          <p className="text-gray-400 text-sm">Gerencie os salões cadastrados no sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSalons}
            disabled={isLoading}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar salão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 lg:w-64"
            />
          </div>
          
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Ativos', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Inativos', value: stats.inactive, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          { label: 'Suspensos', value: stats.suspended, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-white/5`}>
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'inactive', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
          >
            {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig]?.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Salons Table */}
      {!isLoading && filteredSalons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 flex flex-col max-h-[calc(100vh-380px)]"
        >
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Salão</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Localização</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Plano</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{salon.name}</p>
                          <p className="text-gray-500 text-sm">{salon.owner_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        {salon.city}, {salon.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[salon.status]?.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[salon.status]?.dot}`} />
                        {statusConfig[salon.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${planConfig[salon.plan]?.color}`}>
                        {planConfig[salon.plan]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(salon)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(salon)}
                          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(salon)}
                          className={`p-2 rounded-lg transition-all ${salon.status === 'active'
                            ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
                            : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          title={salon.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(salon)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSalons.length === 0 && (
        <div className="bg-[#1a2332] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {searchTerm || filterStatus !== 'all' ? 'Nenhum salão encontrado' : 'Nenhum salão cadastrado'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Tente alterar os filtros.'
              : 'Aprove solicitações ou crie manualmente.'}
          </p>
          
        </div>
      )}

      
      {/* View Drawer */}
      <AnimatePresence>
        {showViewDrawer && selectedSalon && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowViewDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col"
              data-lenis-prevent
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">{selectedSalon.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${statusConfig[selectedSalon.status].dot}`} />
                      <span className={`text-xs font-medium ${statusConfig[selectedSalon.status].color.replace('bg-','').split(' ')[1]}`}>
                        {statusConfig[selectedSalon.status].label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewDrawer(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                
                {/* Section: Identificação */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Identificação</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Proprietário</p>
                      <p className="text-sm text-gray-200 font-medium">{selectedSalon.owner_name}</p>
                    </div>
                    {selectedSalon.owner_cpf && (
                      <div>
                        <p className="text-xs text-gray-500">CPF do Responsável</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.owner_cpf}</p>
                      </div>
                    )}
                    {selectedSalon.cnpj && (
                      <div>
                        <p className="text-xs text-gray-500">CNPJ da Empresa</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.cnpj}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Contato */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Contato</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Email (Acesso)</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Endereço (Detalhamento Completo) */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Localização</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Endereço</p>
                        <p className="text-sm text-gray-200 font-medium">
                          {selectedSalon.address ? `${selectedSalon.address}${selectedSalon.address_number ? ', ' + selectedSalon.address_number : ''}` : 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bairro</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.neighborhood || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CEP</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.zip_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cidade</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estado</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.state}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Assinatura e Dados */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                    <Star className="w-4 h-4 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-500">Plano</p>
                    <p className="text-sm text-gray-200 font-medium">{planConfig[selectedSalon.plan].label}</p>
                  </div>
                  <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                    <Users className="w-4 h-4 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-500">Tamanho</p>
                    <p className="text-sm text-gray-200 font-medium">{selectedSalon.professionals_count} prof.</p>
                  </div>
                  <div className="col-span-2 bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Data de Cadastro</p>
                      <p className="text-sm text-gray-200 font-medium">{formatDate(selectedSalon.created_at)}</p>
                    </div>
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-[#0f1419]">
                <button
                  onClick={() => {
                    setShowViewDrawer(false)
                    handleEdit(selectedSalon)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/10 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  <Edit3 className="w-5 h-5" />
                  Editar Salão
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedSalon && (
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
              <h2 className="text-lg font-bold text-white text-center mb-2">Excluir Salão?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Tem certeza que deseja excluir <strong className="text-white">{selectedSalon.name}</strong>? Esta ação não pode ser desfeita.
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