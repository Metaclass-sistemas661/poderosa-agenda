'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Check,
  X,
  Eye,
  Search,
  Clock,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { approveAndProvisionSalon, rejectSalonRequest } from '@/app/actions/provisioning'
import { toast } from 'sonner'

interface AccessRequest {
  id: string
  salon_name: string
  owner_name: string
  email: string
  phone: string
  city: string
  state: string
  professionals: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected' | 'awaiting_payment'
  created_at: string
}

export default function SolicitacoesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'awaiting_payment'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Carregar solicitações
  const fetchRequests = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRequests(data)
    }
    if (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Aprovar solicitação
  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await approveAndProvisionSalon(id)
      if (result.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'awaiting_payment' } : r))
        setSelectedRequest(null)
        toast.success('Solicitação aprovada e aguardando pagamento.')
      } else {
        toast.error('Erro na aprovação', {
          description: result.error || 'Tente novamente em instantes.',
        })
      }
    } catch {
      toast.error('Ocorreu um erro ao processar a aprovação.', {
        description: 'Por favor, tente novamente.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Rejeitar solicitação
  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await rejectSalonRequest(id)
      if (result.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
        setSelectedRequest(null)
        toast.success('Solicitação rejeitada.')
      } else {
        // Safe PT-BR message - never expose raw server errors
        toast.error('Não foi possível rejeitar a solicitação.', {
          description: 'Tente novamente em instantes.',
        })
      }
    } catch {
      toast.error('Ocorreu um erro ao processar a rejeição.', {
        description: 'Por favor, tente novamente.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Filtrar
  const filteredRequests = requests.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || r.status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Contadores
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length
  const awaitingPaymentCount = requests.filter(r => r.status === 'awaiting_payment').length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
    awaiting_payment: { label: 'Aguard. Pagamento', color: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
    approved: { label: 'Aprovada', color: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
    rejected: { label: 'Rejeitada', color: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitações de Acesso</h1>
          <p className="text-gray-400">{pendingCount} solicitações pendentes</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={fetchRequests}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.button
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-[#1a2332] rounded-2xl border p-6 text-left transition-all ${filterStatus === 'pending' ? 'border-amber-500/50' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-white font-bold">Pendentes</h3>
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
          <p className="text-gray-400 text-sm">Aguardando análise</p>
        </motion.button>

        <motion.button
          onClick={() => setFilterStatus(filterStatus === 'approved' ? 'all' : 'approved')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-[#1a2332] rounded-2xl border p-6 text-left transition-all ${filterStatus === 'approved' ? 'border-emerald-500/50' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold">Aprovadas</h3>
          </div>
          <p className="text-3xl font-bold text-white">{approvedCount}</p>
          <p className="text-gray-400 text-sm">Total aprovadas</p>
        </motion.button>

        <motion.button
          onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-[#1a2332] rounded-2xl border p-6 text-left transition-all ${filterStatus === 'rejected' ? 'border-red-500/50' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white font-bold">Rejeitadas</h3>
          </div>
          <p className="text-3xl font-bold text-white">{rejectedCount}</p>
          <p className="text-gray-400 text-sm">Total rejeitadas</p>
        </motion.button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-gray-400 ml-3">Carregando solicitações...</span>
        </div>
      )}

      {/* Lista de Solicitações */}
      {!isLoading && filteredRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Salão</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Contato</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Local</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Data</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium text-sm">{request.salon_name}</p>
                        <p className="text-gray-400 text-xs">{request.owner_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div>
                        <p className="text-gray-300 text-sm">{request.email}</p>
                        <p className="text-gray-500 text-xs">{request.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-gray-300 text-sm">{request.city}/{request.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[request.status].color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[request.status].dot}`} />
                        {statusConfig[request.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-gray-400 text-xs">{formatDate(request.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={actionLoading === request.id}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Aprovar"
                            >
                              {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={actionLoading === request.id}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Rejeitar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
      {!isLoading && filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2332] rounded-2xl border border-white/5 p-12"
        >
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação pendente'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente alterar os filtros ou o termo de busca.'
                : 'Quando alguém solicitar acesso pelo formulário de cadastro, as solicitações aparecerão aqui para você aprovar.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="bg-white/5 rounded-xl p-4 text-left">
                <p className="text-gray-300 text-sm mb-2 font-medium">Como funciona:</p>
                <ol className="text-gray-400 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    <span>Cliente preenche o formulário em /cadastro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    <span>Solicitação aparece aqui para análise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    <span>Você aprova com 1 clique e o sistema cria a conta automaticamente</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2332] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col"
              data-lenis-prevent
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-white">Detalhes da Solicitação</h2>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-gray-400">Salão</p>
                    <p className="text-white font-medium">{selectedRequest.salon_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Proprietário</p>
                    <p className="text-white font-medium">{selectedRequest.owner_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-white font-medium">{selectedRequest.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <p className="text-white font-medium">{selectedRequest.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-400">Localização</p>
                    <p className="text-white font-medium">{selectedRequest.city}/{selectedRequest.state}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Users className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs text-gray-400">Profissionais</p>
                    <p className="text-white font-medium">{selectedRequest.professionals}</p>
                  </div>
                </div>

                {selectedRequest.message && (
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Mensagem</p>
                      <p className="text-white">{selectedRequest.message}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Data da solicitação</p>
                    <p className="text-white font-medium">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedRequest.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedRequest.status].dot}`} />
                      {statusConfig[selectedRequest.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aprovar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}