'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'
import { ArrowUpRight, ArrowDownRight, Calendar, Bell, Sparkles, Loader2, RefreshCw, Receipt, ChevronDown } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
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

interface DashboardData {
  todayRevenue: number
  revenueChange: number
  todayAppointments: number
  appointmentsChange: number
  occupancyRate: number
  occupancyChange: number
  revenueChartData: any[]
  donutData: any[]
  monthRevenue: number
  monthTarget: number
  heatmapData: any[][]
  maxHeatmap: number
  alerts: Alert[]
}

const COLORS = {
  primary: '#f43f5e', // rose-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  gray: '#6b7280', // gray-500
}

export default function SalonDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // PERF-002: Use centralized SalonLayoutContext — zero additional queries
  const { salonId } = useSalonLayout()
  const isSalonLoading = false // salonId is always available from layout context
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState('15000')
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0)
  const [chartPeriod, setChartPeriod] = useState(15)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Carrossel automático para os alertas
  useEffect(() => {
    if (!data?.alerts || data.alerts.length <= 1) return
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % data.alerts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [data?.alerts])

  // PERF-007: Debounced realtime refetch to coalesce multiple events
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const REALTIME_DEBOUNCE_MS = 1000 // Coalesce events within 1 second

  const debouncedFetchData = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      fetchData()
    }, REALTIME_DEBOUNCE_MS)
  }, [salonId, chartPeriod])

  useEffect(() => {
    if (salonId && !isSalonLoading) {
      fetchData()

      // PERF-007: Enterprise Solution with debounced realtime updates
      // Instead of triggering fetchData immediately on each event,
      // we debounce to coalesce rapid-fire events (e.g., batch updates)
      const channel = supabase.channel('dashboard_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `salon_id=eq.${salonId}` },
          () => { debouncedFetchData() }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter: `salon_id=eq.${salonId}` },
          () => { debouncedFetchData() }
        )
        .subscribe()

      return () => {
        // Cleanup: clear debounce timer and remove channel
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        supabase.removeChannel(channel)
      }
    }
  }, [salonId, isSalonLoading, chartPeriod, debouncedFetchData])

  // PERF-002: Removed loadSalonId - now using shared useSalonId hook

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      // Utiliza a data local evitando problemas de fuso horário do toISOString() (UTC)
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const yesterdayDate = new Date(now)
      yesterdayDate.setDate(now.getDate() - 1)
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`

      const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonth = `${startOfMonthDate.getFullYear()}-${String(startOfMonthDate.getMonth() + 1).padStart(2, '0')}-${String(startOfMonthDate.getDate()).padStart(2, '0')}`

      const chartStartDateObj = new Date(now)
      chartStartDateObj.setDate(now.getDate() - chartPeriod + 1)
      const chartStartDate = `${chartStartDateObj.getFullYear()}-${String(chartStartDateObj.getMonth() + 1).padStart(2, '0')}-${String(chartStartDateObj.getDate()).padStart(2, '0')}`

      const fetchStart = chartStartDate < startOfMonth ? chartStartDate : startOfMonth
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
      const todayMonth = String(now.getMonth() + 1).padStart(2, '0')
      const todayDay = String(now.getDate()).padStart(2, '0')

      // PERF-001/PERF-005: Parallel query execution for independent data sources
      // All queries below are INDEPENDENT - they only depend on salonId and date ranges
      const [
        transactionsResult,
        appointmentsResult,
        heatmapResult,
        clientsResult,
        productsResult
      ] = await Promise.all([
        // Q1: Revenue transactions
        (supabase as any)
          .from('transactions')
          .select('amount, date')
          .eq('salon_id', salonId)
          .eq('type', 'income')
          .eq('is_confirmed', true)
          .gte('date', fetchStart),

        // Q2: Appointments for today/recent
        (supabase as any)
          .from('appointments')
          .select('id, scheduled_date, scheduled_time, status')
          .eq('salon_id', salonId)
          .gte('scheduled_date', fetchStart),

        // Q3: Heatmap appointments (last 30 days)
        (supabase as any)
          .from('appointments')
          .select('scheduled_date, scheduled_time')
          .eq('salon_id', salonId)
          .gte('scheduled_date', thirtyDaysAgo),

        // Q4: Clients with birthdays today
        (supabase as any)
          .from('clients')
          .select('id, name, birth_date')
          .eq('salon_id', salonId),

        // Q5: Low stock products
        (supabase as any)
          .from('products')
          .select('id, stock_quantity, min_stock')
          .eq('salon_id', salonId)
      ])

      // Extract data from results with error isolation
      const transactions = transactionsResult.data
      const appointments = appointmentsResult.data
      const heatmapAppts = heatmapResult.data
      const birthdayClients = clientsResult.data
      const lowStockProducts = productsResult.data

      // Process appointments
      const todayAppts = appointments?.filter((a: { scheduled_date: string }) => a.scheduled_date === today) || []
      const yesterdayAppts = appointments?.filter((a: { scheduled_date: string }) => a.scheduled_date === yesterday) || []

      // Revenue Calculation exclusively from Transactions (Single Source of Truth)
      const todayRev = transactions?.filter((t: { date: string }) => t.date === today).reduce((acc: number, t: { amount: number | string }) => acc + Number(t.amount), 0) || 0
      const yesterdayRev = transactions?.filter((t: { date: string }) => t.date === yesterday).reduce((acc: number, t: { amount: number | string }) => acc + Number(t.amount), 0) || 0
      const revChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : (todayRev > 0 ? 100 : 0)

      const monthRev = transactions?.filter((t: { date: string }) => t.date >= startOfMonth).reduce((acc: number, t: { amount: number | string }) => acc + Number(t.amount), 0) || 0

      const apptChange = yesterdayAppts.length > 0 ? ((todayAppts.length - yesterdayAppts.length) / yesterdayAppts.length) * 100 : (todayAppts.length > 0 ? 100 : 0)

      // Chart Data
      const chartData = []
      for (let i = chartPeriod - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const dayRev = transactions?.filter((t: { date: string }) => t.date === dateStr).reduce((acc: number, t: { amount: number | string }) => acc + Number(t.amount), 0) || 0

        chartData.push({
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          receita: dayRev
        })
      }

      // Donut Data (Today Status)
      const scheduled = todayAppts.filter((a: { status: string }) => a.status === 'scheduled').length
      const confirmed = todayAppts.filter((a: { status: string }) => a.status === 'confirmed').length
      const completed = todayAppts.filter((a: { status: string }) => a.status === 'completed').length
      const cancelled = todayAppts.filter((a: { status: string }) => a.status === 'cancelled').length

      const donutData = [
        { name: 'Confirmado', value: confirmed, color: COLORS.success },
        { name: 'Agendado', value: scheduled, color: COLORS.warning },
        { name: 'Concluído', value: completed, color: COLORS.primary },
        { name: 'Cancelado', value: cancelled, color: COLORS.danger },
      ].filter(d => d.value > 0)

      // Heatmap Data (already fetched in parallel)
      const heatmap = Array(6).fill(0).map(() => Array(6).fill(0))
      let maxHeatmap = 0

      heatmapAppts?.forEach((a: { scheduled_date: string; scheduled_time?: string }) => {
        // T12:00:00 para evitar que a data mude por causa de fuso horário UTC no Brasil
        const d = new Date(a.scheduled_date + 'T12:00:00')
        const day = d.getDay()
        if (day >= 1 && day <= 6) {
          const hour = parseInt(a.scheduled_time?.split(':')[0] || '12')
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

      // F02 FIX: Real Completion Rate instead of fictional occupancy (todayAppts / 20)
      // Completion Rate = completed appointments / total appointments for today
      const totalTodayAppts = todayAppts.length
      const occupancyRate = totalTodayAppts > 0
        ? Math.round((completed / totalTodayAppts) * 100)
        : 0

      // Compute real day-over-day change for completion rate
      const yesterdayCompleted = yesterdayAppts.filter((a: { status: string }) => a.status === 'completed').length
      const yesterdayTotal = yesterdayAppts.length
      const yesterdayOccupancy = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0
      const occupancyChange = yesterdayOccupancy > 0
        ? occupancyRate - yesterdayOccupancy
        : (occupancyRate > 0 ? occupancyRate : 0)

      const realAlerts: Alert[] = []

      // 1. Cancelamentos
      if (cancelled > 0) {
        realAlerts.push({
          title: `Você teve ${cancelled} cancelamentos hoje.`,
          subtitle: 'Tente enviar mensagens para clientes na lista de espera ou crie promoções de última hora.'
        })
      }

      // 2. Agendamentos Pendentes (Status scheduled aguardando confirmação)
      const pendingAppts = todayAppts.filter((a: { status: string }) => a.status === 'scheduled')
      if (pendingAppts.length > 0) {
        realAlerts.push({
          title: `${pendingAppts.length} agendamentos pendentes.`,
          subtitle: 'Alguns agendamentos para hoje ainda não foram confirmados. Envie lembretes!'
        })
      }

      // 3. Aniversariantes de hoje (already fetched in parallel)
      const birthdays = birthdayClients?.filter((c: { birth_date?: string }) => {
        if (!c.birth_date) return false
        const d = new Date(c.birth_date)
        return (d.getMonth() + 1) === Number(todayMonth) && d.getDate() === Number(todayDay)
      }) || []

      if (birthdays.length > 0) {
        realAlerts.push({
          title: `${birthdays.length} aniversariante(s) hoje!`,
          subtitle: 'Mande uma mensagem especial ou ofereça um desconto de presente.'
        })
      }

      // 4. Estoque Baixo (already fetched in parallel)
      const lowStock = lowStockProducts?.filter((p: { stock_quantity: number; min_stock: number }) => p.stock_quantity <= p.min_stock) || []
      if (lowStock.length > 0) {
        realAlerts.push({
          title: `${lowStock.length} produto(s) com estoque baixo.`,
          subtitle: 'Verifique seu estoque para não ficar sem materiais de trabalho essenciais.'
        })
      }

      // Se não houver alertas, colocar um positivo
      if (realAlerts.length === 0) {
        realAlerts.push({
          title: 'Sua agenda está organizada!',
          subtitle: 'Mantenha o bom trabalho. Tudo fluindo perfeitamente no momento.'
        })
      }

      const savedTarget = localStorage.getItem(`salon_target_${salonId}`)
      const targetValue = savedTarget ? Number(savedTarget) : 15000
      setTempTarget(targetValue.toString())

      setData({
        todayRevenue: todayRev,
        revenueChange: revChange,
        todayAppointments: todayAppts.length,
        appointmentsChange: apptChange,
        occupancyRate,
        occupancyChange,
        revenueChartData: chartData,
        donutData: donutData.length > 0 ? donutData : [{ name: 'Sem Dados', value: 1, color: COLORS.gray }],
        monthRevenue: monthRev,
        monthTarget: targetValue,
        heatmapData: heatmap,
        maxHeatmap: maxHeatmap || 1, // evitar divisão por zero
        alerts: realAlerts
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleSaveTarget = () => {
    if (!salonId || !data) return
    const numValue = Number(tempTarget.replace(/\D/g, '')) || 1000
    localStorage.setItem(`salon_target_${salonId}`, numValue.toString())
    setData({ ...data, monthTarget: numValue })
    setTempTarget(numValue.toString())
    setIsEditingTarget(false)
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-slate-50 dark:bg-[#121214] rounded-2xl">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white transition-colors lg:rounded-2xl space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Visão Geral do Salão</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Acompanhe as métricas e o desempenho em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Receita de Hoje" value={formatCurrency(data.todayRevenue)} change={data.revenueChange} />
        <Card title="Agendamentos Hoje" value={data.todayAppointments} change={data.appointmentsChange} />
        <Card title="Taxa de Conclusão" value={`${data.occupancyRate}%`} change={data.occupancyChange} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold">Evolução da Receita</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Visão geral do faturamento</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
              >
                Últimos {chartPeriod} dias
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {[7, 15, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          setChartPeriod(days)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${chartPeriod === days
                          ? 'text-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'text-slate-700 dark:text-gray-300'
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
              <AreaChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1c1f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                  formatter={(value: any) => formatCurrency(value as number)}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="receita" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status / Heatmap Column */}
        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Horários de Pico</h2>
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
                    // Se o valor for 0, opacidade super baixa. Senão, calcula baseado no máximo (no mínimo 0.3)
                    const opacity = val === 0 ? 0.05 : 0.3 + (val / data.maxHeatmap) * 0.7
                    return (
                      <div
                        key={`${row}-${col}`}
                        className="aspect-square rounded-md border border-black/5 dark:border-white/5 transition-all hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: `rgba(244, 63, 94, ${opacity})` }}
                        title={`${val} agendamentos na soma dos últimos 30 dias`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 border-t border-slate-100 dark:border-white/5 pt-4">
              <span>Menos</span>
              <div className="flex gap-1">
                {[0.05, 0.3, 0.6, 0.9].map((op, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(244, 63, 94, ${op})` }} />
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
        <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-[24px] p-6 shadow-lg overflow-hidden text-white flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-30">
            <Sparkles className="w-16 h-16" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md mb-4">
              <Bell className="w-3 h-3" /> Alertas
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
                  <p className="text-primary-100 mt-2 text-sm leading-relaxed">
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

        {/* Audience / Donut */}
        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Status Diário</h2>
          </div>
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.donutData.map((entry, index) => (
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
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.todayAppointments}</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.donutData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 dark:text-gray-300">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Score / Gauge */}
        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Meta do Mês</h2>
            {isEditingTarget ? (
              <div className="flex gap-2">
                <button onClick={handleSaveTarget} className="text-xs text-white bg-primary-500 px-2 py-1 rounded hover:bg-primary-600 transition-colors">Salvar</button>
                <button onClick={() => setIsEditingTarget(false)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-gray-300">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setIsEditingTarget(true)} className="text-xs text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1">
                Editar
              </button>
            )}
          </div>

          {isEditingTarget ? (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-sm text-slate-500 dark:text-gray-400">Novo valor da meta (R$):</label>
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
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
                        { name: 'Atingido', value: Math.min(data.monthRevenue, data.monthTarget), color: COLORS.primary },
                        { name: 'Restante', value: Math.max(0, data.monthTarget - data.monthRevenue), color: 'rgba(107, 114, 128, 0.2)' }
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
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.primary : 'rgba(107, 114, 128, 0.2)'} />
                        ))
                      }
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-8 flex flex-col items-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {Math.round((data.monthRevenue / data.monthTarget) * 100)}%
                  </span>
                  <span className="text-sm text-slate-500 dark:text-gray-400 mt-1">Progresso</span>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500 dark:text-gray-400 mt-2">
                {formatCurrency(data.monthRevenue)} de {formatCurrency(data.monthTarget)}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function Card({ title, value, change }: { title: string, value: string | number, change: number }) {
  const isPositive = change >= 0
  const color = isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400">{title}</h3>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-gray-500 rotate-45" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
          <Icon className="w-3 h-3" />
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}