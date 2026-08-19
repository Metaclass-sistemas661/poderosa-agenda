'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'

interface Transaction {
  id: string
  salon_id: string
  appointment_id: string | null
  type: 'income' | 'expense'
  category: string | null
  description: string | null
  amount: number
  payment_method: string | null
  professional_id: string | null
  commission_amount: number | null
  date: string
  status: 'pending' | 'completed' | 'cancelled'
  attachment_url: string | null
  created_at: string
  updated_at: string
  professionals: { name: string } | null
}

const categoryOptions = {
  income: ['Serviços', 'Produtos', 'Outros'],
  expense: ['Comissões', 'Aluguel', 'Salários', 'Produtos', 'Contas', 'Marketing', 'Outros']
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'outros', label: 'Outros', icon: Wallet },
]

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export default function CaixaPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const { salonId } = useSalonLayout()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [createForm, setCreateForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    payment_method: 'dinheiro',
    date: new Date().toISOString().split('T')[0],
    status: 'completed' as Transaction['status']
  })

  const [editForm, setEditForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    payment_method: 'dinheiro',
    date: new Date().toISOString().split('T')[0],
    status: 'completed' as Transaction['status']
  })

  useEffect(() => {
    if (salonId) fetchTransactions()
  }, [salonId, filterDate])

  const fetchTransactions = async () => {
    if (!salonId) return
    setIsLoading(true)

    const { data, error } = await supabase
      .from('transactions')
      .select('*, professionals(name)')
      .eq('salon_id', salonId)
      .eq('date', filterDate)
      .order('created_at', { ascending: false })

    if (data) setTransactions(data)
    if (error) console.error('Erro:', error)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!salonId || !createForm.category || !createForm.amount) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          salon_id: salonId,
          type: createForm.type,
          category: createForm.category,
          description: createForm.description || null,
          amount: parseFloat(createForm.amount),
          payment_method: createForm.payment_method,
          date: createForm.date,
          status: createForm.status
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setTransactions(prev => [{ ...data, professionals: null }, ...prev])
        setMessage({ type: 'success', text: 'Lançamento criado!' })
        setShowCreateDrawer(false)
        resetCreateForm()
      }
    } catch (err: any) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: err.message || 'Erro ao criar lançamento' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setEditForm({
      type: transaction.type,
      category: transaction.category || '',
      description: transaction.description || '',
      amount: transaction.amount.toString(),
      payment_method: transaction.payment_method || 'dinheiro',
      date: transaction.date,
      status: transaction.status
    })
    setShowEditDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return
    setIsSaving(true)

    const { error } = await supabase
      .from('transactions')
      .update({
        type: editForm.type,
        category: editForm.category,
        description: editForm.description || null,
        amount: parseFloat(editForm.amount),
        payment_method: editForm.payment_method,
        date: editForm.date,
        status: editForm.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTransaction.id)

    if (!error) {
      fetchTransactions()
      setMessage({ type: 'success', text: 'Lançamento atualizado!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedTransaction) return
    setIsSaving(true)

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', selectedTransaction.id)

    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id))
      setMessage({ type: 'success', text: 'Lançamento excluído!' })
      setShowDeleteModal(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao excluir.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const resetCreateForm = () => {
    setCreateForm({
      type: 'income',
      category: '',
      description: '',
      amount: '',
      payment_method: 'dinheiro',
      date: filterDate,
      status: 'completed'
    })
  }

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = searchTerm === '' ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchType = filterType === 'all' || t.type === filterType

    return matchSearch && matchType
  })

  const income = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expense

  const paymentBreakdown = paymentMethods.map(method => ({
    ...method,
    total: transactions
      .filter(t => t.payment_method === method.value && t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  }))

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
          <h1 className="text-2xl font-bold text-white">Caixa</h1>
          <p className="text-gray-400 text-sm">Fluxo de caixa diário</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchTransactions} disabled={isLoading} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreateDrawer(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Lançamento</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-sm font-medium mb-1">Entradas</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(income)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-2xl p-6 border border-red-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            </div>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium mb-1">Saídas</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(expense)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${balance >= 0
            ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/20'
            : 'from-amber-500/10 to-orange-500/10 border-amber-500/20'
            } rounded-2xl p-6 border`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-blue-500/20' : 'bg-amber-500/20'
              }`}>
              <DollarSign className={`w-5 h-5 ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
            </div>
          </div>
          <p className={`text-sm font-medium mb-1 ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
            Saldo do Dia
          </p>
          <p className="text-3xl font-bold text-white">{formatCurrency(balance)}</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterType === 'all'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterType === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterType === 'expense'
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Saídas
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
          />
        </div>
      </div>

      {/* Breakdown por Método */}
      <div className="bg-[#1a2332] rounded-2xl p-5 border border-white/5">
        <h3 className="text-white font-semibold mb-4">Entradas por Método de Pagamento</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {paymentBreakdown.map((method) => {
            const Icon = method.icon
            return (
              <div key={method.value} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-400">{method.label}</p>
                </div>
                <p className="text-white font-bold">{formatCurrency(method.total)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Transactions List */}
      {!isLoading && filteredTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="overflow-auto max-h-[calc(100vh-600px)]">
            <table className="w-full">
              <thead className="bg-white/5 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">Descrição</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase hidden lg:table-cell">Método</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Valor</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      {transaction.type === 'income' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ArrowUpRight className="w-3 h-3" />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          <ArrowDownRight className="w-3 h-3" />
                          Saída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{transaction.category}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-gray-400 text-sm">{transaction.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-gray-400 text-sm capitalize">{transaction.payment_method?.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
      {!isLoading && filteredTransactions.length === 0 && (
        <div className="bg-[#1a2332] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum lançamento</h3>
          <p className="text-gray-400 text-sm mb-6">Registre entradas e saídas do caixa</p>
          <button onClick={() => setShowCreateDrawer(true)} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl">
            Criar Lançamento
          </button>
        </div>
      )}

      {/* Create Drawer */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowCreateDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col rounded-3xl border border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Novo Lançamento</h2>
                    <p className="text-xs text-gray-500">Registrar movimento</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateDrawer(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, type: 'income', category: '' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${createForm.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, type: 'expense', category: '' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${createForm.type === 'expense'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Saída
                    </button>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {categoryOptions[createForm.type].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full pl-12 pr-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, payment_method: method.value })}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${createForm.payment_method === method.value
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                            : 'bg-[#1a2332] text-gray-400 border border-white/10 hover:border-white/20'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          {method.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Detalhes do lançamento..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !createForm.category || !createForm.amount}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Criar Lançamento
                </button>
                <button onClick={() => setShowCreateDrawer(false)} className="w-full px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedTransaction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowEditDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col rounded-3xl border border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Editar Lançamento</h2>
                    <p className="text-xs text-gray-500">{selectedTransaction.category}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditDrawer(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <div className="space-y-2">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, status: key as Transaction['status'] })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${editForm.status === key
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-[#1a2332] border-white/10 hover:border-white/20'
                          }`}
                      >
                        <p className="text-white font-medium flex-1 text-left text-sm">{config.label}</p>
                        {editForm.status === key && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 space-y-3">
                <button onClick={handleSaveEdit} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar
                </button>
                <button onClick={() => setShowEditDrawer(false)} className="w-full px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedTransaction && (
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white text-center mb-2">Excluir Lançamento?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Tem certeza que deseja excluir este lançamento de <strong className="text-white">{formatCurrency(selectedTransaction.amount)}</strong>?
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
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