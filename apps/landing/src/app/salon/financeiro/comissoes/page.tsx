'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Percent,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Filter,
  Download,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSafeErrorMessage } from '@/lib/errors/toast'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'

interface Professional {
  id: string
  name: string
  commission_rate: number
}

interface Commission {
  id: string
  professional_id: string
  professional_name: string
  period_start: string
  period_end: string
  total_services: number
  total_amount: number
  commission_amount: number
  status: 'pending' | 'paid'
  paid_at: string | null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function ComissoesPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all')
  const [filterProfessional, setFilterProfessional] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const { salonId } = useSalonLayout()
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (salonId) {
      fetchProfessionals()
      fetchCommissions()
    }
  }, [salonId, selectedMonth])

  const fetchProfessionals = async () => {
    if (!salonId) return
    const { data } = await supabase
      .from('professionals')
      .select('id, name, commission_rate')
      .eq('salon_id', salonId)
      .eq('status', 'active')
    if (data) setProfessionals(data)
  }

  const fetchCommissions = async () => {
    if (!salonId) return
    setIsLoading(true)

    const [year, month] = selectedMonth.split('-')
    const periodStart = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const periodEnd = `${year}-${month}-${lastDay}`

    // Buscar transações do período por profissional
    const { data: transactions } = await supabase
      .from('transactions')
      .select('professional_id, professionals(name, commission_rate), amount, commission_amount')
      .eq('salon_id', salonId)
      .eq('type', 'income')
      .eq('status', 'completed')
      .gte('date', periodStart)
      .lte('date', periodEnd)
      .not('professional_id', 'is', null)

    if (transactions) {
      // Agrupar por profissional
      const grouped = transactions.reduce((acc, t) => {
        const profId = t.professional_id!
        if (!acc[profId]) {
          acc[profId] = {
            id: `${profId}-${selectedMonth}`,
            professional_id: profId,
            professional_name: t.professionals?.name || 'Desconhecido',
            period_start: periodStart,
            period_end: periodEnd,
            total_services: 0,
            total_amount: 0,
            commission_amount: 0,
            status: 'pending' as const,
            paid_at: null
          }
        }
        acc[profId].total_services++
        acc[profId].total_amount += t.amount
        acc[profId].commission_amount += t.commission_amount || 0
        return acc
      }, {} as Record<string, Commission>)

      setCommissions(Object.values(grouped))
    }

    setIsLoading(false)
  }

  const handleMarkAsPaid = (commission: Commission) => {
    setSelectedCommission(commission)
    setShowPayModal(true)
  }

  const confirmPayment = async () => {
    if (!selectedCommission || !salonId) return
    setIsSaving(true)

    try {
      // Criar transação de pagamento de comissão
      const { error } = await supabase
        .from('transactions')
        .insert({
          salon_id: salonId,
          type: 'expense',
          category: 'Comissões',
          description: `Comissão ${selectedCommission.professional_name} - ${selectedMonth}`,
          amount: selectedCommission.commission_amount,
          payment_method: 'dinheiro',
          professional_id: selectedCommission.professional_id,
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        })

      if (error) throw error

      // Atualizar estado local
      setCommissions(prev => prev.map(c =>
        c.id === selectedCommission.id
          ? { ...c, status: 'paid', paid_at: new Date().toISOString() }
          : c
      ))

      setMessage({ type: 'success', text: 'Comissão paga com sucesso!' })
      setShowPayModal(false)
    } catch (err: any) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: getSafeErrorMessage(err, 'registrar pagamento') })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const filteredCommissions = commissions.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.professional_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchProfessional = filterProfessional === 'all' || c.professional_id === filterProfessional

    return matchSearch && matchStatus && matchProfessional
  })

  // Calcular totais
  const summary = {
    total: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
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
          <h1 className="text-2xl font-bold text-white">Comissões</h1>
          <p className="text-gray-400 text-sm">Gestão de comissões dos profissionais</p>
        </div>

        <button onClick={fetchCommissions} disabled={isLoading} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-purple-400 text-sm font-medium mb-1">Total do Mês</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(summary.total)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <Percent className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-amber-400 text-sm font-medium mb-1">A Pagar</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(summary.pending)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-sm font-medium mb-1">Pago</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(summary.paid)}</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterProfessional}
          onChange={(e) => setFilterProfessional(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">Todos Profissionais</option>
          {professionals.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'paid'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
          >
            Pagos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Commissions List */}
      {!isLoading && filteredCommissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4"
        >
          {filteredCommissions.map((commission) => (
            <motion.div
              key={commission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a2332] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{commission.professional_name}</h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(commission.period_start)} - {formatDate(commission.period_end)}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${commission.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                      {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Serviços</p>
                      <p className="text-lg font-bold text-white">{commission.total_services}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Faturado</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(commission.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Comissão</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(commission.commission_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {commission.status === 'pending' && (
                  <button
                    onClick={() => handleMarkAsPaid(commission)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar como Pago
                  </button>
                )}

                {commission.status === 'paid' && commission.paid_at && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Pago em</p>
                    <p className="text-sm font-medium text-emerald-400">{formatDate(commission.paid_at)}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCommissions.length === 0 && (
        <div className="bg-[#1a2332] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Percent className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma comissão</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm || filterStatus !== 'all'
              ? 'Nenhuma comissão encontrada com os filtros aplicados'
              : 'Não há comissões para este período'
            }
          </p>
        </div>
      )}

      {/* Pay Modal */}
      <AnimatePresence>
        {showPayModal && selectedCommission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2332] rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white text-center mb-2">Confirmar Pagamento</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Marcar comissão de <strong className="text-white">{selectedCommission.professional_name}</strong> no valor de{' '}
                <strong className="text-emerald-400">{formatCurrency(selectedCommission.commission_amount)}</strong> como paga?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPayment}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
