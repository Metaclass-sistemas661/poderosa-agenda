'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  totalSalons: number
  activeSalons: number
  inactiveSalons: number
  suspendedSalons: number
  pendingRequests: number
  totalAdmins: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSalons: 0,
    activeSalons: 0,
    inactiveSalons: 0,
    suspendedSalons: 0,
    pendingRequests: 0,
    totalAdmins: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentSalons, setRecentSalons] = useState<any[]>([])
  const [recentRequests, setRecentRequests] = useState<any[]>([])

  const fetchStats = async () => {
    setIsLoading(true)

    try {
      // Buscar salões
      const { data: salons } = await supabase.from('salons').select('id, status')
      
      // Buscar solicitações pendentes
      const { data: requests } = await supabase
        .from('access_requests')
        .select('id, status')
        .eq('status', 'pending')

      // Buscar admins
      const { data: admins } = await supabase.from('admin_users').select('id')

      // Buscar salões recentes
      const { data: recent } = await supabase
        .from('salons')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      // Buscar solicitações recentes
      const { data: recentReqs } = await supabase
        .from('access_requests')
        .select('id, salon_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      // Type assertions for Supabase data
      type SalonData = { id: string; status: string }
      type RecentSalonData = { id: string; name: string; status: string; created_at: string }
      type RecentRequestData = { id: string; salon_name: string; status: string; created_at: string }
      
      const typedSalons = (salons || []) as SalonData[]

      setStats({
        totalSalons: typedSalons.length,
        activeSalons: typedSalons.filter(s => s.status === 'active').length,
        inactiveSalons: typedSalons.filter(s => s.status === 'inactive').length,
        suspendedSalons: typedSalons.filter(s => s.status === 'suspended').length,
        pendingRequests: requests?.length || 0,
        totalAdmins: admins?.length || 0,
      })

      setRecentSalons((recent || []) as RecentSalonData[])
      setRecentRequests((recentReqs || []) as RecentRequestData[])
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  const statusConfig = {
    active: { label: 'Ativo', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    inactive: { label: 'Inativo', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    suspended: { label: 'Suspenso', color: 'text-red-400', bg: 'bg-red-500/20' },
    pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    rejected: { label: 'Rejeitado', color: 'text-red-400', bg: 'bg-red-500/20' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Visão geral do sistema</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Salões Ativos</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.activeSalons}
              </p>
              <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                de {stats.totalSalons} total
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Solicitações Pendentes</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.pendingRequests}
              </p>
              <Link href="/admin/solicitacoes" className="text-amber-400 text-sm mt-2 flex items-center gap-1 hover:underline">
                <Clock className="w-4 h-4" />
                Aguardando aprovação
              </Link>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Usuários Admin</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalAdmins}
              </p>
              <Link href="/admin/usuarios" className="text-blue-400 text-sm mt-2 flex items-center gap-1 hover:underline">
                <Users className="w-4 h-4" />
                Gerenciar usuários
              </Link>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Inadimplentes</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.suspendedSalons}
              </p>
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Salões suspensos
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 text-sm font-medium">Ativos</span>
            <span className="text-2xl font-bold text-emerald-400">{stats.activeSalons}</span>
          </div>
        </div>
        <div className="bg-gray-500/10 rounded-xl p-4 border border-gray-500/20">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">Inativos</span>
            <span className="text-2xl font-bold text-gray-400">{stats.inactiveSalons}</span>
          </div>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center justify-between">
            <span className="text-red-400 text-sm font-medium">Suspensos</span>
            <span className="text-2xl font-bold text-red-400">{stats.suspendedSalons}</span>
          </div>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-sm font-medium">Pendentes</span>
            <span className="text-2xl font-bold text-amber-400">{stats.pendingRequests}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Salons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Salões Recentes</h2>
              <p className="text-sm text-gray-400">Últimos cadastros</p>
            </div>
            <Link href="/admin/saloes" className="text-emerald-400 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : recentSalons.length > 0 ? (
            <div className="space-y-3">
              {recentSalons.map((salon) => (
                <div key={salon.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{salon.name}</p>
                      <p className="text-gray-500 text-xs">{formatDate(salon.created_at)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusConfig[salon.status as keyof typeof statusConfig]?.bg} ${statusConfig[salon.status as keyof typeof statusConfig]?.color}`}>
                    {statusConfig[salon.status as keyof typeof statusConfig]?.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">Nenhum salão cadastrado</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-[#1a2332] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Solicitações Recentes</h2>
              <p className="text-sm text-gray-400">Últimas solicitações de acesso</p>
            </div>
            <Link href="/admin/solicitacoes" className="text-emerald-400 text-sm hover:underline">
              Ver todas
            </Link>
          </div>
          
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{req.salon_name}</p>
                      <p className="text-gray-500 text-xs">{formatDate(req.created_at)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusConfig[req.status as keyof typeof statusConfig]?.bg} ${statusConfig[req.status as keyof typeof statusConfig]?.color}`}>
                    {statusConfig[req.status as keyof typeof statusConfig]?.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">Nenhuma solicitação</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ações Rápidas</h3>
              <p className="text-gray-400 text-sm">Gerencie o sistema rapidamente</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/saloes"
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              Ver Salões
            </Link>
            <Link
              href="/admin/solicitacoes"
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
            >
              Aprovar Solicitações
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}