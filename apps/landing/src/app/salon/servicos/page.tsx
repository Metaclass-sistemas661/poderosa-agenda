'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scissors, Plus, Search, Loader2, RefreshCw, Trash2, Edit3, X,
  CheckCircle, AlertCircle, Save, Clock, DollarSign, Power, Tag,
  TrendingUp, TrendingDown, Eye, Filter, MoreHorizontal, ArrowRight, Star, Sparkles, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

interface Professional {
  id: string
  name: string
  photo_url: string | null
}

interface Service {
  id: string
  salon_id: string
  name: string
  description: string | null
  category: string | null
  price: number
  duration: number
  commission_rate: number | null
  is_active: boolean
  display_order: number
  photo_url: string | null
  created_at: string
}

const defaultCategoryOptions = [
  'Cabelo', 'Unha', 'Estética', 'Barba', 'Maquiagem', 'Depilação'
]

const durationOptions = [
  { value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' }, { value: 90, label: '1h30' }, { value: 120, label: '2 horas' }, { value: 180, label: '3 horas' },
]

export default function ServicosDashboardPage() {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search') || ''
  
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const [chartFilter, setChartFilter] = useState('30d')
  const { salonId } = useSalonLayout()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // Drawers & Modals
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '', description: '', category: 'Cabelo', customCategory: '', price: '', duration: 60, commission_rate: '', is_active: true
  })
  const [editForm, setEditForm] = useState({ ...createForm })

  const categoryOptions = Array.from(new Set([
    ...defaultCategoryOptions,
    ...services.map(s => s.category).filter((c): c is string => !!c)
  ])).sort()

  useEffect(() => { if (salonId) fetchData() }, [salonId])
  useEffect(() => { setSearchTerm(urlSearch) }, [urlSearch])

  const fetchData = async () => {
    if (!salonId) return
    setIsLoading(true)

    // PERF-FIX: Limitar appointments aos últimos 90 dias para analytics
    // Evita carregar todo o histórico do salão, que pode ter milhares de registros
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const startDate = ninetyDaysAgo.toISOString().split('T')[0]
    
    const [servRes, apptRes, profRes] = await Promise.all([
      (supabase as any).from('services').select('*').eq('salon_id', salonId).order('name'),
      (supabase as any).from('appointments').select('*').eq('salon_id', salonId).gte('scheduled_date', startDate).limit(2000),
      (supabase as any).from('professionals').select('id, name, photo_url').eq('salon_id', salonId)
    ])

    if (servRes.data) setServices(servRes.data)
    if (apptRes.data) setAppointments(apptRes.data)
    if (profRes.data) setProfessionals(profRes.data)
    
    setIsLoading(false)
  }

  // --- Actions ---
  const handleCreate = async () => {
    if (!salonId || !createForm.name.trim() || !createForm.price) return
    setIsSaving(true)

    const { data, error } = await (supabase as any).from('services').insert({
      salon_id: salonId, name: createForm.name, description: createForm.description || null,
      category: (createForm.category === 'Outros' && createForm.customCategory) ? createForm.customCategory : createForm.category,
      price: parseFloat(createForm.price), duration: createForm.duration,
      commission_rate: createForm.commission_rate ? parseFloat(createForm.commission_rate) : null, is_active: createForm.is_active
    }).select().single()

    if (error) setMessage({ type: 'error', text: error.message })
    else if (data) {
      setServices(prev => [...prev, data])
      setMessage({ type: 'success', text: 'Serviço criado!' })
      setShowCreateDrawer(false)
      setCreateForm({ name: '', description: '', category: 'Cabelo', customCategory: '', price: '', duration: 60, commission_rate: '', is_active: true })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setEditForm({
      name: service.name, description: service.description || '', 
      category: categoryOptions.includes(service.category || '') ? service.category || 'Cabelo' : 'Outros', 
      customCategory: !categoryOptions.includes(service.category || '') ? service.category || '' : '',
      price: service.price.toString(), duration: service.duration, commission_rate: service.commission_rate?.toString() || '',
      is_active: service.is_active
    })
    setShowEditDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedService) return
    setIsSaving(true)
    const { error } = await (supabase as any).from('services').update({
      name: editForm.name, description: editForm.description || null, 
      category: (editForm.category === 'Outros' && editForm.customCategory) ? editForm.customCategory : editForm.category,
      price: parseFloat(editForm.price), duration: editForm.duration,
      commission_rate: editForm.commission_rate ? parseFloat(editForm.commission_rate) : null,
      is_active: editForm.is_active, updated_at: new Date().toISOString()
    }).eq('id', selectedService.id)

    if (!error) {
      setServices(prev => prev.map(s => s.id === selectedService.id ? { ...s, ...editForm, category: (editForm.category === 'Outros' && editForm.customCategory) ? editForm.customCategory : editForm.category, price: parseFloat(editForm.price), commission_rate: editForm.commission_rate ? parseFloat(editForm.commission_rate) : null } : s))
      setMessage({ type: 'success', text: 'Serviço atualizado!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const confirmDelete = async () => {
    if (!selectedService) return
    setIsSaving(true)
    const { error } = await (supabase as any).from('services').delete().eq('id', selectedService.id)
    if (!error) {
      setServices(prev => prev.filter(s => s.id !== selectedService.id))
      setMessage({ type: 'success', text: 'Serviço excluído!' })
      setShowDeleteModal(false)
    } else setMessage({ type: 'error', text: 'Erro ao excluir.' })
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  // --- Analytical Calculations ---
  const activeServices = services.filter(s => s.is_active).length
  const completedAppts = appointments.filter(a => ['completed', 'confirmed'].includes(a.status))
  
  // Calculate revenue from completed appointments
  const totalRevenue = completedAppts.reduce((sum, appt) => {
    const service = services.find(s => s.id === appt.service_id)
    return sum + (service ? service.price : 0)
  }, 0)

  const ticketMedio = completedAppts.length > 0 ? totalRevenue / completedAppts.length : 0

  // Line Chart Data (Revenue Evolution)
  const revenueChartData = []
  const now = new Date()
  let daysToSubtract = chartFilter === '7d' ? 6 : chartFilter === '15d' ? 14 : 29
  for (let i = daysToSubtract; i >= -1; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    
    // Revenue for this day
    const dayAppts = completedAppts.filter(a => a.scheduled_date === dateStr)
    const dayRevenue = dayAppts.reduce((sum, appt) => {
      const service = services.find(s => s.id === appt.service_id)
      return sum + (service ? service.price : 0)
    }, 0)

    revenueChartData.push({
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('. de ', ' '),
      Receita: dayRevenue,
      Agendamentos: dayAppts.length
    })
  }

  // Bar Chart Data (Top Categories)
  const categoryStats = services.reduce((acc, s) => {
    const cat = s.category || 'Outros'
    if (!acc[cat]) acc[cat] = 0
    acc[cat] += completedAppts.filter(a => a.service_id === s.id).length
    return acc
  }, {} as Record<string, number>)
  
  const topCategoriesData = Object.entries(categoryStats)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Service List (Table) Data
  const servicePerformance = services.map(s => {
    const sAppts = completedAppts.filter(a => a.service_id === s.id)
    return {
      ...s,
      timesPerformed: sAppts.length,
      revenueGenerated: sAppts.length * s.price,
      rating: 4.5 + Math.random() * 0.5 // Simulated rating
    }
  }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  .sort((a, b) => b.revenueGenerated - a.revenueGenerated)

  // Top Professionals Data
  const topProfessionals = professionals.map(p => {
    const profAppts = completedAppts.filter(a => a.professional_id === p.id)
    const revenue = profAppts.reduce((sum, a) => {
       const service = services.find(s => s.id === a.service_id)
       return sum + (service ? service.price : 0)
    }, 0)
    return { ...p, count: profAppts.length, revenue }
  }).filter(p => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)

  // Real Gauge Chart Data (Retention)
  const clientVisits: Record<string, number> = {}
  completedAppts.forEach(a => {
    const key = a.client_id || a.client_name
    if (key) clientVisits[key] = (clientVisits[key] || 0) + 1
  })
  
  const totalClients = Object.keys(clientVisits).length
  const returningClients = Object.values(clientVisits).filter(visits => visits > 1).length
  const retentionRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0
  
  const gaugeData = [
    { name: 'Retidos', value: retentionRate, fill: '#10b981' },
    { name: 'Não Retidos', value: 100 - retentionRate, fill: 'transparent' } 
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0f1419]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-slate-50 dark:bg-[#0f1419] min-h-screen text-slate-900 dark:text-white transition-colors lg:rounded-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Dashboard <span className="text-slate-300 dark:text-slate-700">/</span> Serviços
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-slate-700 dark:text-white"
            >
              <option value="7d" className="dark:bg-[#1a2332]">Últimos 7 dias</option>
              <option value="15d" className="dark:bg-[#1a2332]">Últimos 15 dias</option>
              <option value="30d" className="dark:bg-[#1a2332]">Últimos 30 dias</option>
            </select>
          </div>
          
          <button onClick={() => setShowCreateDrawer(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-primary-500/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Catálogo Ativo', val: activeServices, desc: 'Serviços cadastrados', color: 'text-blue-500', icon: Scissors, trend: '+2', trendUp: true },
          { title: 'Realizados', val: completedAppts.length, desc: 'Neste período', color: 'text-purple-500', icon: CheckCircle, trend: '+14%', trendUp: true },
          { title: 'Ticket Médio', val: formatCurrency(ticketMedio), desc: 'Por atendimento', color: 'text-amber-500', icon: Tag, trend: '+5.2%', trendUp: true },
          { title: 'Receita Total', val: formatCurrency(totalRevenue), desc: 'Dos serviços', color: 'text-emerald-500', icon: DollarSign, trend: '+8.4%', trendUp: true },
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</p>
              <div className={`p-2 rounded-xl bg-slate-50 dark:bg-white/5 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{card.val}</span>
              <span className={`text-xs font-bold flex items-center ${card.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {card.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {card.trend}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Chart */}
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receita por Serviço</h3>
                <p className="text-sm text-slate-500">Evolução diária de ganhos</p>
              </div>
              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><MoreHorizontal className="w-5 h-5"/></button>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-emerald-500 font-medium flex items-center mt-1"><TrendingUp className="w-4 h-4 mr-1"/> 24.4% vs mês passado</p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} className="dark:stroke-slate-700" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', color: '#0f1419' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Services Table (Best Selling Style) */}
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Catálogo de Serviços</h3>
              
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Serviço</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Preço</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Categoria</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Realizados</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Receita</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {servicePerformance.map((service, idx) => (
                    <tr key={service.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400`}>
                            <Scissors className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.duration} min</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(service.price)}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                          {service.category || 'Outros'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{service.timesPerformed}x</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-emerald-500">{formatCurrency(service.revenueGenerated)}</span>
                      </td>
                      <td className="py-4 text-center">
                        <button onClick={() => handleEdit(service)} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => {setSelectedService(service); setShowDeleteModal(true)}} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 ml-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {servicePerformance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">Nenhum serviço encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (Spans 1) */}
        <div className="space-y-6">
          
          {/* Most Popular Categories (Bar Chart) */}
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Categorias Populares</h3>
              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><MoreHorizontal className="w-5 h-5"/></button>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} width={80} />
                  <RechartsTooltip formatter={(value) => [value, 'Serviços Realizados']} cursor={{fill: 'rgba(148, 163, 184, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#10b981' }}/>
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                    {topCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#colorBar)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Retention Gauge */}
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Taxa de Retenção</h3>
              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><MoreHorizontal className="w-4 h-4"/></button>
            </div>
            
            <div className="h-[180px] w-full mt-8 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={40}
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className={index === 1 ? 'dark:fill-slate-800' : ''} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{retentionRate.toFixed(0)}%</span>
                <p className="text-xs text-slate-400 mt-1">Acima da meta de 80%</p>
              </div>
            </div>
            <button onClick={() => { setMessage({ type: 'success', text: 'Os detalhes de retenção estarão disponíveis na próxima versão!' }); setTimeout(() => setMessage(null), 3000); }} className="mt-2 px-4 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Ver detalhes
            </button>
          </div>

          {/* Top Professionals Widget */}
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Profissionais</h3>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">{chartFilter === '7d' ? '7 dias' : chartFilter === '15d' ? '15 dias' : '30 dias'}</span>
            </div>
            
            <div className="space-y-4">
              {topProfessionals.map((prof, idx) => (
                <div key={prof.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="relative">
                    {prof.photo_url ? (
                      <img src={prof.photo_url} alt={prof.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center font-bold text-slate-500">
                        {prof.name.charAt(0)}
                      </div>
                    )}
                    {idx === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1a2332]"><Star className="w-2.5 h-2.5 text-white" fill="white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{prof.name}</p>
                    <p className="text-xs text-slate-500">{prof.count} serviços realizados</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500 text-sm">{formatCurrency(prof.revenue)}</p>
                  </div>
                </div>
              ))}
              {topProfessionals.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Nenhum dado neste período.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Drawers and Modals logic reused from old code, wrapped in portals */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={() => setShowCreateDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onWheel={e => e.stopPropagation()}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[70] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Novo Serviço</h2>
                  </div>
                </div>
                <button onClick={() => setShowCreateDrawer(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="p-6 space-y-8">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Scissors className="w-4 h-4"/> Informações Básicas</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Nome do Serviço *</label>
                        <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ex: Corte Degrade" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Descrição Curta <span className="font-normal text-slate-400 ml-1">(Opcional)</span></label>
                        <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} placeholder="Detalhes do serviço..." className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Tag className="w-4 h-4"/> Categorização</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoryOptions.filter(c => c !== 'Outros').map((cat) => (
                        <button key={cat} type="button" onClick={() => setCreateForm({ ...createForm, category: cat })} className={`px-3 py-3 rounded-xl text-sm font-bold transition-all ${createForm.category === cat ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-slate-50 dark:bg-[#1a2332] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:border-primary-500/50'}`}>
                          {cat}
                        </button>
                      ))}
                      <button type="button" onClick={() => setCreateForm({ ...createForm, category: 'Outros' })} className={`px-3 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${createForm.category === 'Outros' ? 'bg-primary-500 text-white shadow-md' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 hover:bg-primary-100 dark:hover:bg-primary-500/20'}`}>
                        <Plus className="w-4 h-4"/> Nova
                      </button>
                    </div>
                    {createForm.category === 'Outros' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-5 bg-primary-50 dark:bg-primary-500/5 rounded-2xl border border-primary-100 dark:border-primary-500/20">
                        <label className="block text-sm font-bold text-primary-700 dark:text-primary-400 mb-2">Nome da Nova Categoria</label>
                        <input type="text" value={createForm.customCategory} onChange={(e) => setCreateForm({ ...createForm, customCategory: e.target.value })} placeholder="Ex: Spa, Cílios..." className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-primary-200 dark:border-primary-500/30 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold shadow-sm" />
                      </motion.div>
                    )}
                  </div>

                  {/* Preço e Tempo */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Precificação e Tempo</h3>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Valor *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                          <input type="number" step="0.01" min="0" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} placeholder="0,00" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-bold text-lg" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Tempo</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select value={createForm.duration} onChange={(e) => setCreateForm({ ...createForm, duration: Number(e.target.value) })} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-bold appearance-none">
                            {durationOptions.map((opt) => <option key={opt.value} value={opt.value} className="dark:bg-[#1a2332]">{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Comissão Especial <span className="font-normal text-slate-400 text-xs ml-1">(Opcional)</span></span>
                      </label>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        <input type="number" min="0" max="100" value={createForm.commission_rate} onChange={(e) => setCreateForm({ ...createForm, commission_rate: e.target.value })} placeholder="Usa padrão do profissional se vazio" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                <button onClick={handleCreate} disabled={isSaving || !createForm.name || !createForm.price} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Salvar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditDrawer && selectedService && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={() => setShowEditDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onWheel={e => e.stopPropagation()}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[70] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Editar Serviço</h2>
                  </div>
                </div>
                <button onClick={() => setShowEditDrawer(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="p-6 space-y-8">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Edit3 className="w-4 h-4"/> Informações Básicas</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Nome do Serviço *</label>
                        <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Descrição Curta <span className="font-normal text-slate-400 ml-1">(Opcional)</span></label>
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Tag className="w-4 h-4"/> Categorização</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoryOptions.filter(c => c !== 'Outros').map((cat) => (
                        <button key={cat} type="button" onClick={() => setEditForm({ ...editForm, category: cat })} className={`px-3 py-3 rounded-xl text-sm font-bold transition-all ${editForm.category === cat ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-slate-50 dark:bg-[#1a2332] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:border-primary-500/50'}`}>
                          {cat}
                        </button>
                      ))}
                      <button type="button" onClick={() => setEditForm({ ...editForm, category: 'Outros' })} className={`px-3 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${editForm.category === 'Outros' ? 'bg-primary-500 text-white shadow-md' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 hover:bg-primary-100 dark:hover:bg-primary-500/20'}`}>
                        <Plus className="w-4 h-4"/> Nova
                      </button>
                    </div>
                    {editForm.category === 'Outros' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-5 bg-primary-50 dark:bg-primary-500/5 rounded-2xl border border-primary-100 dark:border-primary-500/20">
                        <label className="block text-sm font-bold text-primary-700 dark:text-primary-400 mb-2">Nome da Nova Categoria</label>
                        <input type="text" value={editForm.customCategory} onChange={(e) => setEditForm({ ...editForm, customCategory: e.target.value })} placeholder="Ex: Spa, Cílios..." className="w-full px-4 py-3 bg-white dark:bg-[#1a2332] border border-primary-200 dark:border-primary-500/30 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold shadow-sm" />
                      </motion.div>
                    )}
                  </div>

                  {/* Preço e Tempo */}
                  <div>
                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Precificação e Tempo</h3>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Valor *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                          <input type="number" step="0.01" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-bold text-lg" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Tempo</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-bold appearance-none">
                            {durationOptions.map((opt) => <option key={opt.value} value={opt.value} className="dark:bg-[#1a2332]">{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Comissão Especial <span className="font-normal text-slate-400 text-xs ml-1">(Opcional)</span></span>
                      </label>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        <input type="number" min="0" max="100" value={editForm.commission_rate} onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })} placeholder="Usa padrão do profissional se vazio" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-4">Status do Serviço</label>
                    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-[#1a2332] rounded-xl">
                      <button type="button" onClick={() => setEditForm({ ...editForm, is_active: true })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${editForm.is_active ? 'bg-white dark:bg-[#273142] text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>Ativo no Catálogo</button>
                      <button type="button" onClick={() => setEditForm({ ...editForm, is_active: false })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!editForm.is_active ? 'bg-white dark:bg-[#273142] text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500'}`}>Serviço Oculto</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                <button onClick={handleSaveEdit} disabled={isSaving || !editForm.name || !editForm.price} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Salvar Alterações
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1c1c1f] rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Excluir Serviço?</h2>
              <p className="text-slate-500 text-center mb-8">Esta ação não pode ser desfeita. O serviço <strong>{selectedService.name}</strong> será removido do catálogo.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                <button onClick={confirmDelete} disabled={isSaving} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-4 z-[200] flex items-center gap-2 px-5 py-4 rounded-2xl shadow-xl ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}