'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, BarChart, Bar } from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
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
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  Receipt,
  ChevronDown,
  Users,
  MoreVertical,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSafeErrorMessage } from '@/lib/errors/toast'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'

interface Transaction {
  id: string
  salon_id: string
  appointment_id: string | null
  type: 'income' | 'expense'
  category: string | null
  amount: number
  description: string | null
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

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  // Receitas
  servicos: { label: 'Serviços', icon: Receipt, color: 'text-emerald-400' },
  produtos: { label: 'Produtos', icon: DollarSign, color: 'text-blue-400' },
  outros_receita: { label: 'Outros', icon: Wallet, color: 'text-purple-400' },
  // Despesas
  salarios: { label: 'Salários', icon: Banknote, color: 'text-red-400' },
  comissoes: { label: 'Comissões', icon: DollarSign, color: 'text-orange-400' },
  aluguel: { label: 'Aluguel', icon: PiggyBank, color: 'text-red-400' },
  fornecedores: { label: 'Fornecedores', icon: Receipt, color: 'text-red-400' },
  marketing: { label: 'Marketing', icon: TrendingUp, color: 'text-red-400' },
  manutencao: { label: 'Manutenção', icon: Receipt, color: 'text-red-400' },
  outros_despesa: { label: 'Outros', icon: Wallet, color: 'text-red-400' },
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
const CustomFinanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0
    const balance = income - expense
    return (
      <div className="bg-[#1c1c1f] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
        <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-300">Receitas</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">Despesas</span>
            </div>
            <span className="text-sm font-bold text-red-400">{formatCurrency(expense)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-400">Saldo do Dia</span>
            <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterPeriod, setFilterPeriod] = useState('month')
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
    amount: '',
    description: '',
    payment_method: 'pix',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [editForm, setEditForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    payment_method: '',
    date: '',
    notes: '',
    is_confirmed: true
  })

  useEffect(() => {
    if (salonId) {
      fetchTransactions()
    }
  }, [salonId, filterPeriod])

  // FIX: getDateRange usava now.setDate() que MUTA o objeto Date original.
  // Criando novas instâncias de Date para cada case para evitar side effects.
  const getDateRange = () => {
    let startDate: string

    switch (filterPeriod) {
      case 'today':
        startDate = new Date().toISOString().split('T')[0]
        break
      case 'week': {
        const weekDate = new Date()
        weekDate.setDate(weekDate.getDate() - 7)
        startDate = weekDate.toISOString().split('T')[0]
        break
      }
      case 'month': {
        const now = new Date()
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        break
      }
      case 'year': {
        const now = new Date()
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        break
      }
      default: {
        const now = new Date()
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      }
    }

    return startDate
  }

  const fetchTransactions = async () => {
    if (!salonId) return
    setIsLoading(true)

    const startDate = getDateRange()

    const { data, error } = await supabase
      .from('transactions')
      .select('*, professionals(name)')
      .eq('salon_id', salonId)
      .gte('date', startDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
    }
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
          amount: parseFloat(createForm.amount.replace(',', '.')),
          description: createForm.description || null,
          payment_method: createForm.payment_method || null,
          date: createForm.date,
          status: 'completed'
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setTransactions(prev => [{ ...data, professionals: null } as Transaction, ...prev])
        setMessage({ type: 'success', text: 'Transação criada!' })
        setShowCreateDrawer(false)
        resetCreateForm()
      }
    } catch (err: any) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: getSafeErrorMessage(err, 'criar transação') })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setEditForm({
      type: transaction.type,
      category: transaction.category || '',
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      payment_method: transaction.payment_method || '',
      date: transaction.date,
      notes: '',
      is_confirmed: true
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
        amount: parseFloat(editForm.amount.replace(',', '.')),
        description: editForm.description || null,
        payment_method: editForm.payment_method || null,
        date: editForm.date,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTransaction.id)

    if (!error) {
      fetchTransactions()
      setMessage({ type: 'success', text: 'Transação atualizada!' })
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
      setMessage({ type: 'success', text: 'Transação excluída!' })
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
      amount: '',
      description: '',
      payment_method: 'pix',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const filteredTransactions = transactions.filter(t => {
    const term = searchTerm.toLowerCase()
    const matchSearch = searchTerm === '' ||
      t.description?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term) ||
      t.payment_method?.toLowerCase().includes(term) ||
      t.professionals?.name?.toLowerCase().includes(term)

    const matchType = filterType === 'all' || t.type === filterType

    return matchSearch && matchType
  })

  const stats = {
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    balance: filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) -
      filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    count: filteredTransactions.length
  }

  // Enterprise KPIs
  const netProfit = stats.totalIncome - stats.totalExpense
  const profitMargin = stats.totalIncome > 0 ? (netProfit / stats.totalIncome) * 100 : 0
  const incomeCount = filteredTransactions.filter(t => t.type === 'income').length
  const averageTicket = incomeCount > 0 ? stats.totalIncome / incomeCount : 0

  const incomeCategories = ['servicos', 'produtos', 'outros_receita']
  const expenseCategories = ['salarios', 'comissoes', 'aluguel', 'fornecedores', 'marketing', 'manutencao', 'outros_despesa']

  // --- Finora Data Aggregations ---
  // 1. Cashflow Chart Data (Income vs Expense per day)
  // 1. Cashflow Chart Data (Income vs Expense per day)
  const cashflowData = []
  const now = new Date()
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const isoDate = d.toISOString().split('T')[0]

    const dayIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.date.startsWith(isoDate))
      .reduce((acc, t) => acc + t.amount, 0)

    const dayExpense = filteredTransactions
      .filter(t => t.type === 'expense' && t.date.startsWith(isoDate))
      .reduce((acc, t) => acc + t.amount, 0)

    cashflowData.push({
      name: dateStr,
      income: dayIncome,
      expense: dayExpense
    })
  }

  // 2. Statistic Donut Chart (Expenses by Category)
  const expenseDataMap: Record<string, number> = {}
  filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
    const catKey = t.category || 'outros_despesa'
    const label = categoryConfig[catKey]?.label || 'Outros'
    expenseDataMap[label] = (expenseDataMap[label] || 0) + t.amount
  })
  const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#64748b']
  const statisticData = Object.entries(expenseDataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  // 3. Income by Payment Method
  const incomeMethodMap: Record<string, number> = {}
  filteredTransactions.filter(t => t.type === 'income').forEach(t => {
    const method = t.payment_method || 'Outros'
    incomeMethodMap[method] = (incomeMethodMap[method] || 0) + t.amount
  })
  const incomeMethodData = Object.entries(incomeMethodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

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

      {/* Finora Dashboard Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Current Balance Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden shadow-xl shadow-emerald-500/20 flex flex-col justify-between min-h-[220px]">
          {/* Abstract circles for depth */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-emerald-50 text-sm font-medium">Saldo Atual</span>
              <button onClick={() => setShowCreateDrawer(true)} className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all text-white">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">{formatCurrency(stats.balance)}</h2>
          </div>

          <div className="flex gap-3 mt-6 relative z-10">
            <button onClick={() => { setCreateForm(prev => ({ ...prev, type: 'income' })); setShowCreateDrawer(true); }} className="flex-1 bg-white/20 backdrop-blur-md text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/30 transition-colors shadow-sm border border-white/20">
              <ArrowDownRight className="w-4 h-4" />
              <span>Receita</span>
            </button>
            <button onClick={() => { setCreateForm(prev => ({ ...prev, type: 'expense' })); setShowCreateDrawer(true); }} className="flex-1 bg-black/10 backdrop-blur-md text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-black/20 transition-colors shadow-sm border border-white/10">
              <ArrowUpRight className="w-4 h-4" />
              <span>Despesa</span>
            </button>
          </div>
        </div>

        {/* AI Enhancements & Finance Score */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1c1c1f] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Resumo Executivo</h3>
            <div className="relative">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50 dark:bg-[#141417] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm"
              >
                {filterPeriod === 'today' ? 'Hoje' : filterPeriod === 'week' ? '7 Dias' : filterPeriod === 'month' ? 'Este Mês' : 'Este Ano'}
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {[
                      { value: 'today', label: 'Hoje' },
                      { value: 'week', label: '7 Dias' },
                      { value: 'month', label: 'Este Mês' },
                      { value: 'year', label: 'Este Ano' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterPeriod(option.value)
                          setIsFilterDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${filterPeriod === option.value
                          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'text-slate-700 dark:text-gray-300'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Grid de KPIs Empresariais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-1">
            <div className="bg-slate-50 dark:bg-[#141417] rounded-2xl p-4 flex flex-col justify-center border border-emerald-500/10">
              <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-2">
                <ArrowDownRight className="w-4 h-4 text-emerald-500" /> Receitas
              </div>
              <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#141417] rounded-2xl p-4 flex flex-col justify-center border border-red-500/10">
              <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-2">
                <ArrowUpRight className="w-4 h-4 text-red-500" /> Despesas
              </div>
              <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalExpense)}</p>
            </div>
            <div className={`bg-slate-50 dark:bg-[#141417] rounded-2xl p-4 flex flex-col justify-center border ${netProfit >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-2">
                <Activity className="w-4 h-4 text-primary-500" /> Lucro Líquido
              </div>
              <p className={`text-lg lg:text-xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#141417] rounded-2xl p-4 flex flex-col justify-center border border-primary-500/10">
              <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-2">
                <PieChartIcon className="w-4 h-4 text-blue-500" /> Margem de Lucro
              </div>
              <p className={`text-lg lg:text-xl font-bold ${profitMargin >= 20 ? 'text-emerald-500' : profitMargin > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Progress Bar de Receitas vs Despesas */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-emerald-500 font-bold">{Math.round((stats.totalIncome / (stats.totalIncome + stats.totalExpense || 1)) * 100)}% Receitas</span>
              <span className="text-slate-500 text-xs flex items-center gap-1"><Receipt className="w-3 h-3" /> Ticket Médio: <strong className="text-white">{formatCurrency(averageTicket)}</strong></span>
              <span className="text-red-500 font-bold">{Math.round((stats.totalExpense / (stats.totalIncome + stats.totalExpense || 1)) * 100)}% Despesas</span>
            </div>
            <div className="flex h-3 gap-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.totalIncome / (stats.totalIncome + stats.totalExpense || 1)) * 100}%` }}></div>
              <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(stats.totalExpense / (stats.totalIncome + stats.totalExpense || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Finora Dashboard Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Cashflow Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1c1c1f] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Fluxo de Caixa</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-500 dark:text-gray-400">Receitas</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-500 dark:text-gray-400">Despesas</span></div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <RechartsTooltip content={<CustomFinanceTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="income" name="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Despesa" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income by Payment Method */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1c1c1f] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Métodos de Pagamento</h3>
            <span className="text-slate-500 dark:text-gray-500 text-sm">Receitas</span>
          </div>

          {incomeMethodData.length > 0 ? (
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeMethodData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={90} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#1c1c1f', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Receita']}
                    labelStyle={{ textTransform: 'capitalize' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Nenhuma receita registrada no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Finora Dashboard Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Transactions */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1c1c1f] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Transações Recentes</h3>
            <button className="text-emerald-500 hover:text-emerald-400 text-sm font-bold transition-colors">Ver Todas</button>
          </div>

          {/* Internal Filters for Table */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-2">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-white'}`}>Todas</button>
              <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-transparent text-gray-500 hover:text-white'}`}>Receitas</button>
              <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-red-500/10 text-red-400' : 'bg-transparent text-gray-500 hover:text-white'}`}>Despesas</button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#141417] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* List */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className="overflow-auto flex-1 pr-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-[#1c1c1f] z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 border-b border-slate-200 dark:border-white/5">Nome da Transação</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-white/5 hidden md:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-white/5 hidden lg:table-cell">Data</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-white/5 text-right">Valor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-white/5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((trans) => {
                    const catKey = trans.category || 'outros_despesa'
                    const catConfig = categoryConfig[catKey] || { label: trans.category || 'Outros', icon: Receipt, color: 'text-gray-400' }
                    return (
                      <tr key={trans.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleEdit(trans)}>
                        <td className="px-4 py-4">
                          <p className="text-white font-bold text-sm">{trans.description || (trans.category ? categoryConfig[trans.category]?.label : 'Outros')}</p>
                          <p className="text-gray-500 text-xs mt-0.5 capitalize">{trans.payment_method || 'Outros'}</p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-400">{trans.category ? categoryConfig[trans.category]?.label || trans.category : 'Outros'}</td>
                        <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-400">{formatDateTime(trans.created_at)}</td>
                        <td className={`px-4 py-4 text-right font-bold ${trans.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trans.type === 'income' ? '+' : '-'}{formatCurrency(trans.amount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${trans.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {trans.type === 'income' ? 'Concluído' : 'Pago'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistic */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1c1c1f] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Estatísticas</h3>
            <span className="text-slate-500 dark:text-gray-500 text-sm">Despesas</span>
          </div>

          <div className="flex-1 w-full flex items-center justify-center min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statisticData.length > 0 ? statisticData : [{ name: 'Vazio', value: 1 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {statisticData.length > 0 ? statisticData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  )) : <Cell fill="#1e293b" />}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-500 dark:text-gray-500 text-xs font-semibold mb-0.5">Despesas</span>
              <span className="text-slate-900 dark:text-white font-black text-xl">{formatCurrency(stats.totalExpense)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {statisticData.slice(0, 4).map((item, index) => {
              const percent = stats.totalExpense > 0 ? ((item.value / stats.totalExpense) * 100).toFixed(0) : 0
              return (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></span>
                    <span className="text-slate-700 dark:text-gray-300 text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">{formatCurrency(item.value)}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400">
                      {percent}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Empty State */}
      {!isLoading && filteredTransactions.length === 0 && (
        <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-slate-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma transação</h3>
          <p className="text-gray-400 text-sm mb-6">Registre sua primeira transação</p>
          <button onClick={() => setShowCreateDrawer(true)} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl">
            Nova Transação
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
                    <h2 className="text-lg font-bold text-white">Nova Transação</h2>
                    <p className="text-xs text-gray-500">Registrar movimentação</p>
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, type: 'income', category: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${createForm.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, type: 'expense', category: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${createForm.type === 'expense'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Despesa
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
                    {(createForm.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                      <option key={cat} value={cat}>{categoryConfig[cat]?.label || cat}</option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Corte de cabelo"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                  <select
                    value={createForm.payment_method}
                    onChange={(e) => setCreateForm({ ...createForm, payment_method: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
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

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Informações adicionais..."
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
                  Criar Transação
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
                    <h2 className="text-lg font-bold text-white">Editar Transação</h2>
                    <p className="text-xs text-gray-500">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditDrawer(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, type: 'income', category: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${editForm.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, type: 'expense', category: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${editForm.type === 'expense'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-[#1a2332] text-gray-400 border border-white/10'
                        }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Despesa
                    </button>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {(editForm.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                      <option key={cat} value={cat}>{categoryConfig[cat]?.label || cat}</option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Corte de cabelo"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                  <select
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a2332] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
              <h2 className="text-lg font-bold text-white text-center mb-2">Excluir Transação?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Tem certeza que deseja excluir esta transação de <strong className={selectedTransaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(selectedTransaction.amount)}</strong>?
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