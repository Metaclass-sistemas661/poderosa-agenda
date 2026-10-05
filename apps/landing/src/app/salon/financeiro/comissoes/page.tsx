'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ChevronDown,
  BarChart3,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Receipt,
  PieChart as PieChartIcon,
  CreditCard,
  Banknote
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'
import { FinanceiroTabs } from '../FinanceiroTabs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts'

interface Professional {
  id: string
  name: string
  commission_rate: number
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string | null
  amount: number
  description: string | null
  date: string
  professional_id: string | null
  commission_amount: number | null
  status: string
  payment_method: string | null
  professionals: { name: string, commission_rate: number } | null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ComissoesEquipePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0])
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0])
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { salonId } = useSalonLayout()

  useEffect(() => {
    if (salonId) {
      fetchProfessionals()
    }
  }, [salonId])

  useEffect(() => {
    if (salonId) {
      fetchData()
    }
  }, [salonId, selectedProfId, filterPeriod, customStartDate, customEndDate])

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('professionals')
      .select('id, name, commission_rate')
      .eq('salon_id', salonId)
      .eq('status', 'active')
    if (data) setProfessionals(data)
  }

  const fetchData = async () => {
    setIsLoading(true)
    let startDate: string
    let endDate: string

    const now = new Date()
    switch (filterPeriod) {
      case 'today':
        startDate = now.toISOString().split('T')[0]
        endDate = startDate
        break
      case 'week': {
        const weekDate = new Date()
        weekDate.setDate(weekDate.getDate() - 7)
        startDate = weekDate.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      }
      case 'custom':
      default:
        startDate = customStartDate
        endDate = customEndDate
        break
    }

    let query = supabase
      .from('transactions')
      .select('id, type, category, amount, description, date, professional_id, commission_amount, status, payment_method, professionals(name, commission_rate)')
      .eq('salon_id', salonId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (selectedProfId !== 'all') {
      query = query.eq('professional_id', selectedProfId)
    } else {
      query = query.not('professional_id', 'is', null)
    }

    const { data } = await query
    if (data) {
      setTransactions(data as Transaction[])
    }
    setIsLoading(false)
  }

  const handlePayCommission = async (profId: string, amount: number) => {
    if (!salonId) return
    setIsLoading(true)
    const { error } = await supabase
      .from('transactions')
      .insert({
        salon_id: salonId,
        type: 'expense',
        category: 'comissoes',
        description: `Pagamento de Comissão`,
        amount: amount,
        payment_method: 'dinheiro',
        professional_id: profId,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })

    if (!error) {
      setMessage({ type: 'success', text: 'Pagamento de comissão registrado com sucesso!' })
      fetchData()
    } else {
      setMessage({ type: 'error', text: 'Erro ao registrar pagamento.' })
    }
    setIsLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Cálculos consolidados
  const { totalServices, totalRevenue, totalCommission, alreadyPaid } = useMemo(() => {
    let _totalServices = 0
    let _totalRevenue = 0
    let _totalCommission = 0
    let _alreadyPaid = 0

    transactions.forEach(t => {
      if (t.type === 'income' && t.status === 'completed') {
        _totalServices += 1
        _totalRevenue += t.amount
        _totalCommission += t.commission_amount || 0
      }
      if (t.type === 'expense' && t.category?.toLowerCase() === 'comissoes' && t.status === 'completed') {
        _alreadyPaid += t.amount
      }
    })

    return { totalServices: _totalServices, totalRevenue: _totalRevenue, totalCommission: _totalCommission, alreadyPaid: _alreadyPaid }
  }, [transactions])

  const pendingCommission = Math.max(0, totalCommission - alreadyPaid)

  // Gráfico de Serviços mais realizados
  const servicesChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    transactions.forEach(t => {
      if (t.type === 'income' && t.status === 'completed' && t.description) {
        // Assume description has the service name or we use category
        const key = t.description.split('-')[0].trim() || t.category || 'Serviço'
        counts[key] = (counts[key] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5
  }, [transactions])

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

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

      {/* Header and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Comissões e Equipe</h1>
          <FinanceiroTabs />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button onClick={fetchData} disabled={isLoading} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Finora Dash Top Section */}
      <div className="bg-[#1c1c1f] rounded-[2rem] p-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          
          <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Profissional</label>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="w-full bg-[#0f1419] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="all">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 relative">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Período</label>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {filterPeriod === 'today' ? 'Hoje' : filterPeriod === 'week' ? 'Últimos 7 Dias' : filterPeriod === 'month' ? 'Este Mês' : 'Personalizado'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                  >
                    {[
                      { value: 'today', label: 'Hoje' },
                      { value: 'week', label: '7 Dias' },
                      { value: 'month', label: 'Este Mês' },
                      { value: 'custom', label: 'Personalizado' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterPeriod(option.value as any)
                          setIsFilterDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 rounded-xl ${filterPeriod === option.value
                          ? 'text-primary-500 bg-primary-500/10'
                          : 'text-gray-300'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {filterPeriod === 'custom' && (
              <div className="flex-1 flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Início</label>
                  <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full bg-[#0f1419] border border-white/10 rounded-xl px-3 py-3 text-white text-sm" />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Fim</label>
                  <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full bg-[#0f1419] border border-white/10 rounded-xl px-3 py-3 text-white text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1f] rounded-[1.5rem] p-6 border border-white/5">
          <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-primary-400" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">Serviços Realizados</p>
          <p className="text-3xl font-bold text-white">{totalServices}</p>
        </div>
        <div className="bg-[#1c1c1f] rounded-[1.5rem] p-6 border border-white/5">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">Receita Gerada</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#1c1c1f] rounded-[1.5rem] p-6 border border-white/5">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">Comissões (Total)</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[1.5rem] p-6 shadow-xl shadow-primary-900/20">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <p className="text-primary-100 text-sm font-medium mb-1">Pendente a Pagar</p>
          <p className="text-3xl font-bold text-white mb-4">{formatCurrency(pendingCommission)}</p>
          {selectedProfId !== 'all' && pendingCommission > 0 && (
            <button
              onClick={() => handlePayCommission(selectedProfId, pendingCommission)}
              className="w-full py-2 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors text-sm"
            >
              Liquidar Pagamento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1c1c1f] rounded-[2rem] p-6 border border-white/5 min-h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Top Serviços Realizados</h3>
              <p className="text-sm text-gray-400">Distribuição por quantidade</p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            {servicesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={120} />
                  <Tooltip
                    cursor={{ fill: '#27272a', opacity: 0.5 }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]}>
                    {servicesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-3">
                <Receipt className="w-8 h-8 opacity-20" />
                <p>Nenhum serviço registrado neste período</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1c1c1f] rounded-[2rem] p-6 border border-white/5 min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Últimas Atividades</h3>
              <p className="text-sm text-gray-400">Registro de comissões</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {transactions.filter(t => t.type === 'income' && t.commission_amount! > 0).slice(0, 10).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-[#0f1419] border border-white/5">
                <div>
                  <p className="text-white font-medium text-sm">{t.description || t.category || 'Serviço'}</p>
                  <p className="text-gray-500 text-xs">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm">+{formatCurrency(t.commission_amount || 0)}</p>
                  <p className="text-gray-500 text-xs">de {formatCurrency(t.amount)}</p>
                </div>
              </div>
            ))}
            {transactions.filter(t => t.type === 'income' && t.commission_amount! > 0).length === 0 && (
              <div className="text-center text-gray-500 py-8">Sem atividades recentes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
