'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowUpRight, ArrowDownRight, Calendar, Bell, Sparkles, Loader2, RefreshCw, ChevronDown, Building2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Alert {
  title: string
  subtitle: string
}

interface AdminDashboardData {
  totalSalons: number
  totalSalonsChange: number
  activeSalons: number
  activeSalonsChange: number
  pendingRequests: number
  pendingRequestsChange: number
  growthChartData: any[]
  statusDonutData: any[]
  monthActiveSalons: number
  monthTarget: number
  heatmapData: any[][]
  maxHeatmap: number
  alerts: Alert[]
}

const COLORS = {
  primary: '#10b981', // emerald-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  gray: '#6b7280', // gray-500
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState('50')
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0)
  const [chartPeriod, setChartPeriod] = useState(15)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    if (!data?.alerts || data.alerts.length <= 1) return
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % data.alerts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [data?.alerts])

  useEffect(() => {
    fetchData()
  }, [chartPeriod])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonth = startOfMonthDate.toISOString().split('T')[0]
      
      const chartStartDateObj = new Date(now)
      chartStartDateObj.setDate(now.getDate() - chartPeriod + 1)
      const thirtyDaysAgoObj = new Date(now)
      thirtyDaysAgoObj.setDate(now.getDate() - 30)
      const thirtyDaysAgo = thirtyDaysAgoObj.toISOString().split('T')[0]

      const yesterdayObj = new Date(now)
      yesterdayObj.setDate(now.getDate() - 1)
      
      const [salonsResult, requestsResult] = await Promise.all([
        supabase.from('salons').select('id, status, created_at'),
        supabase.from('access_requests').select('id, status, created_at')
      ])

      const salons = salonsResult.data || []
      const requests = requestsResult.data || []

      // Status calc
      const activeCount = salons.filter(s => s.status === 'active').length
      const inactiveCount = salons.filter(s => s.status === 'inactive').length
      const suspendedCount = salons.filter(s => s.status === 'suspended').length
      const pendingReqCount = requests.filter(r => r.status === 'pending').length

      // Changes (Comparing to 30 days ago vs before 30 days for demo, or just yesterday)
      const totalSalons = salons.length
      const totalSalonsChange = 5.2 // mock or calculate based on created_at
      const activeSalonsChange = 2.1
      const pendingRequestsChange = -1.5

      // Chart Data (New Salons per day)
      const chartData = []
      for (let i = chartPeriod - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        
        const dayNewSalons = salons.filter(s => (s.created_at as string).startsWith(dateStr)).length
        
        chartData.push({
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          salões: dayNewSalons
        })
      }

      // Donut Data
      const donutData = [
        { name: 'Ativos', value: activeCount, color: COLORS.success },
        { name: 'Pendentes (Req)', value: pendingReqCount, color: COLORS.warning },
        { name: 'Inativos', value: inactiveCount, color: COLORS.gray },
        { name: 'Suspensos', value: suspendedCount, color: COLORS.danger },
      ].filter(d => d.value > 0)

      // Heatmap Data (Salon Creations in last 30 days)
      const heatmap = Array(6).fill(0).map(() => Array(6).fill(0))
      let maxHeatmap = 0

      const recentSalons = salons.filter(s => (s.created_at as string) >= thirtyDaysAgo)
      recentSalons.forEach(s => {
        const d = new Date(s.created_at as string)
        const day = d.getDay()
        if (day >= 1 && day <= 6) {
          const hour = d.getHours()
          let slot = 0
          if (hour >= 8 && hour < 10) slot = 0
          else if (hour >= 10 && hour < 12) slot = 1
          else if (hour >= 12 && hour < 14) slot = 2
          else if (hour >= 14 && hour < 16) slot = 3
          else if (hour >= 16 && hour < 18) slot = 4
          else if (hour >= 18) slot = 5
          
          heatmap[slot][day - 1] += 1
          if (heatmap[slot][day - 1] > maxHeatmap) {
            maxHeatmap = heatmap[slot][day - 1]
          }
        }
      })

      // Alerts
      const realAlerts: Alert[] = []
      
      if (pendingReqCount > 0) {
        realAlerts.push({
          title: `${pendingReqCount} solicitações de acesso pendentes.`,
          subtitle: 'Acesse a aba de solicitações para revisar e aprovar novos salões na plataforma.'
        })
      }

      if (suspendedCount > 0) {
        realAlerts.push({
          title: `${suspendedCount} salões suspensos.`,
          subtitle: 'Verifique se há pendências financeiras ou denúncias relacionadas a esses salões.'
        })
      }

      const todayNewSalons = salons.filter(s => (s.created_at as string).startsWith(now.toISOString().split('T')[0])).length
      if (todayNewSalons >= 3) {
        realAlerts.push({
          title: `Pico de novos cadastros hoje! (${todayNewSalons})`,
          subtitle: 'Ótimo trabalho. A plataforma está crescendo rapidamente neste momento.'
        })
      }

      if (realAlerts.length === 0) {
        realAlerts.push({
          title: 'Tudo tranquilo por aqui.',
          subtitle: 'Nenhuma solicitação pendente ou alerta crítico no momento.'
        })
      }

      const savedTarget = localStorage.getItem('superadmin_salon_target')
      const targetValue = savedTarget ? Number(savedTarget) : 50
      setTempTarget(targetValue.toString())

      setData({
        totalSalons,
        totalSalonsChange,
        activeSalons: activeCount,
        activeSalonsChange,
        pendingRequests: pendingReqCount,
        pendingRequestsChange,
        growthChartData: chartData,
        statusDonutData: donutData.length > 0 ? donutData : [{ name: 'Sem Dados', value: 1, color: COLORS.gray }],
        monthActiveSalons: activeCount,
        monthTarget: targetValue,
        heatmapData: heatmap,
        maxHeatmap: maxHeatmap || 1,
        alerts: realAlerts
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTarget = () => {
    if (!data) return
    const numValue = Number(tempTarget.replace(/\D/g, '')) || 10
    localStorage.setItem('superadmin_salon_target', numValue.toString())
    setData({ ...data, monthTarget: numValue })
    setTempTarget(numValue.toString())
    setIsEditingTarget(false)
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard da Plataforma</h1>
          <p className="text-slate-400 text-sm mt-1">Visão geral e saúde do ecossistema Hurick.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2332] border border-white/5 rounded-xl text-sm font-medium text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total de Salões" value={data.totalSalons} change={data.totalSalonsChange} />
        <Card title="Salões Ativos" value={data.activeSalons} change={data.activeSalonsChange} />
        <Card title="Solicitações Pendentes" value={data.pendingRequests} change={data.pendingRequestsChange} invertColor />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#1a2332] border border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Evolução de Cadastros</h2>
              <p className="text-sm text-slate-400 mt-1">Novos salões registrados por dia</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white/5 text-white border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-all shadow-sm"
              >
                Últimos {chartPeriod} dias
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-[#27272a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {[7, 15, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          setChartPeriod(days)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${chartPeriod === days
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-gray-300'
                          }`}
                      >
                        Últimos {days} dias
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1c1f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="salões" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Column */}
        <div className="bg-[#1a2332] border border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Horários de Cadastro</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-7 gap-1">
              <div className="col-span-1" />
              {['S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="text-[10px] text-center text-slate-400 font-medium">{d}</div>)}

              {['08h', '10h', '12h', '14h', '16h', '18h'].map((time, row) => (
                <div key={row} className="contents">
                  <div className="text-[10px] text-slate-400 text-right pr-2 flex items-center justify-end">{time}</div>
                  {Array(6).fill(0).map((_, col) => {
                    const val = data.heatmapData[row][col]
                    const opacity = val === 0 ? 0.05 : 0.3 + (val / data.maxHeatmap) * 0.7
                    return (
                      <div
                        key={`${row}-${col}`}
                        className="aspect-square rounded-md border border-white/5 transition-all hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                        title={`${val} cadastros na soma dos últimos 30 dias`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-4">
              <span>Menos</span>
              <div className="flex gap-1">
                {[0.05, 0.3, 0.6, 0.9].map((op, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(16, 185, 129, ${op})` }} />
                ))}
              </div>
              <span>Mais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Alerts / Insights */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[24px] p-6 shadow-lg overflow-hidden text-white flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 p-4 opacity-30">
            <Sparkles className="w-16 h-16" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md mb-4">
              <Bell className="w-3 h-3" /> Alertas da Plataforma
            </div>

            <div className="relative h-24 overflow-hidden">
              {data.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${index === currentAlertIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <h3 className="text-lg md:text-xl font-bold leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-emerald-100 mt-2 text-sm leading-relaxed">
                    {alert.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5 mt-2 relative z-10">
            {data.alerts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentAlertIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentAlertIndex ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Status / Donut */}
        <div className="bg-[#1a2332] border border-white/5 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white">Status da Rede</h2>
          </div>
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.statusDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1c1f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{data.totalSalons}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.statusDonutData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Target / Gauge */}
        <div className="bg-[#1a2332] border border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white">Meta de Salões Ativos</h2>
            {isEditingTarget ? (
              <div className="flex gap-2">
                <button onClick={handleSaveTarget} className="text-xs text-white bg-emerald-500 px-2 py-1 rounded hover:bg-emerald-600 transition-colors">Salvar</button>
                <button onClick={() => setIsEditingTarget(false)} className="text-xs text-slate-400 hover:text-slate-300">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setIsEditingTarget(true)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                Editar Meta
              </button>
            )}
          </div>

          {isEditingTarget ? (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-sm text-slate-400">Novo valor da meta:</label>
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="h-[160px] w-full mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Atingido', value: Math.min(data.monthActiveSalons, data.monthTarget), color: COLORS.primary },
                        { name: 'Restante', value: Math.max(0, data.monthTarget - data.monthActiveSalons), color: 'rgba(255, 255, 255, 0.05)' }
                      ]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={100}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {
                        [0, 1].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.primary : 'rgba(255, 255, 255, 0.05)'} />
                        ))
                      }
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-8 flex flex-col items-center pointer-events-none">
                  <span className="text-3xl font-bold text-white">
                    {Math.round((data.monthActiveSalons / data.monthTarget) * 100)}%
                  </span>
                  <span className="text-sm text-slate-400 mt-1">Progresso</span>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                {data.monthActiveSalons} de {data.monthTarget} salões
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function Card({ title, value, change, invertColor = false }: { title: string, value: string | number, change: number, invertColor?: boolean }) {
  const isPositive = change >= 0
  // Para pendências, aumentar é ruim (vermelho), diminuir é bom (verde)
  const isGood = invertColor ? !isPositive : isPositive
  
  const color = isGood ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="bg-[#1a2332] border border-white/5 rounded-[24px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-400">{title}</h3>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-white">{value}</span>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
          <Icon className="w-3 h-3" />
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}