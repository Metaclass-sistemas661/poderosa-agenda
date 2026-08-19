'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Loader2, UserCircle, Star, Phone, Mail, Clock,
  MapPin, CheckCircle, AlertCircle, X, Save, Edit3, Trash2, User, ChevronLeft, ChevronRight,
  ShoppingBag, Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Appointment {
  id: string
  salon_id: string
  client_id: string | null
  professional_id: string | null
  service_id: string | null
  scheduled_date: string
  scheduled_time: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  client_name: string | null
  client_phone: string | null
  service_name: string | null
  service_price: number | null
  total_price: number | null
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
  notes: string | null
  created_at: string
  professionals?: { name: string; id: string }
  clients?: { name: string; phone: string }
  services?: { name: string; price: number; duration: number }
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#64748b']

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  in_progress: { label: 'Em andamento', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  completed: { label: 'Concluído', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  no_show: { label: 'Não compareceu', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export default function AgendamentosHealthRatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlProfId = searchParams.get('professional_id')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(urlProfId || null)
  const { salonId } = useSalonLayout()
  const [showProfDropdown, setShowProfDropdown] = useState(false)

  // Modals
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [createForm, setCreateForm] = useState({
    client_id: '', client_name: '', client_phone: '', service_id: '', scheduled_time: '09:00'
  })
  const [editForm, setEditForm] = useState({
    status: 'scheduled' as Appointment['status'], notes: ''
  })

  // Checkout Modals
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false)
  const [checkoutProducts, setCheckoutProducts] = useState<any[]>([])
  const [selectedCheckoutProducts, setSelectedCheckoutProducts] = useState<{ product: any, quantity: number }[]>([])
  const [checkoutSearch, setCheckoutSearch] = useState('')

  useEffect(() => { if (salonId) fetchData() }, [salonId, selectedProfessionalId, filterDate])

  const fetchData = async () => {
    if (!salonId) return
    setIsLoading(true)
    const [profRes, servRes, cliRes, apptRes] = await Promise.all([
      (supabase as any).from('professionals').select('*').eq('salon_id', salonId).order('name'),
      (supabase as any).from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('name'),
      (supabase as any).from('clients').select('id, name, phone').eq('salon_id', salonId).order('name'),
      (supabase as any).from('appointments').select('*, professionals(name), clients(name, phone), services(name, price, duration)')
        .eq('salon_id', salonId)
        .eq('scheduled_date', filterDate)
        .eq(selectedProfessionalId ? 'professional_id' : 'salon_id', selectedProfessionalId || salonId)
        .neq('status', 'cancelled')
        .order('scheduled_time')
    ])

    if (profRes.data) {
      setProfessionals(profRes.data)
      if (!selectedProfessionalId && profRes.data.length > 0) setSelectedProfessionalId(profRes.data[0].id)
    }
    if (servRes.data) setServices(servRes.data)
    if (cliRes.data) setClients(cliRes.data)
    if (apptRes.data) setAppointments(apptRes.data)

    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!salonId || !selectedProfessionalId || !createForm.service_id || (!createForm.client_id && !createForm.client_name)) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios.' })
      return setTimeout(() => setMessage(null), 3000)
    }

    const selectedProf = professionals.find(p => p.id === selectedProfessionalId)
    if (selectedProf?.status === 'inactive') {
      setMessage({ type: 'error', text: 'Profissional inativo. É necessário ativá-lo novamente para agendar horários.' })
      return setTimeout(() => setMessage(null), 4000)
    }

    setIsSaving(true)
    const selectedService = services.find(s => s.id === createForm.service_id)

    try {
      let finalClientId = createForm.client_id !== 'new' && createForm.client_id !== '' ? createForm.client_id : null;
      let finalClientName = createForm.client_name;
      let finalClientPhone = createForm.client_phone;

      if (finalClientId) {
        const existingClient = clients.find(c => c.id === finalClientId);
        if (existingClient) {
          finalClientName = existingClient.name;
          finalClientPhone = existingClient.phone || '';
        }
      } else {
        // Cria cliente rápido se n existir
        const { data: newClient } = await (supabase as any).from('clients').insert({
          salon_id: salonId, name: createForm.client_name, phone: createForm.client_phone.replace(/\D/g, '') || null
        }).select().single()
        if (newClient) finalClientId = newClient.id
      }

      const { data, error } = await (supabase as any).from('appointments').insert({
        salon_id: salonId, client_id: finalClientId, client_name: finalClientName,
        client_phone: finalClientPhone.replace(/\D/g, '') || null,
        professional_id: selectedProfessionalId, service_id: createForm.service_id,
        service_name: selectedService.name, service_price: selectedService.price,
        scheduled_date: filterDate, scheduled_time: createForm.scheduled_time, duration: selectedService.duration,
        total_price: selectedService.price, status: 'scheduled', payment_status: 'pending'
      }).select().single()

      if (error) throw error
      if (data) {
        setAppointments(prev => [...prev, data])
        setMessage({ type: 'success', text: 'Agendado com sucesso!' })
        setShowCreateDrawer(false)
        setCreateForm({ client_id: '', client_name: '', client_phone: '', service_id: '', scheduled_time: '09:00' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const loadCheckoutProducts = async () => {
    const { data } = await (supabase as any).from('products').select('*').eq('salon_id', salonId).eq('status', 'active').gt('stock_quantity', 0)
    if (data) setCheckoutProducts(data)
  }

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return

    // Intercepta para Checkout se mudando para 'completed'
    if (editForm.status === 'completed' && selectedAppointment.status !== 'completed') {
      setShowEditDrawer(false)
      loadCheckoutProducts()
      setShowCheckoutDrawer(true)
      return
    }

    await performSaveEdit()
  }

  const handleCompleteCheckout = async () => {
    if (!selectedAppointment) return
    setIsSaving(true)
    try {
      // Insert appointment_products
      if (selectedCheckoutProducts.length > 0) {
        const inserts = selectedCheckoutProducts.map(p => ({
          appointment_id: selectedAppointment.id,
          product_id: p.product.id,
          quantity: p.quantity,
          unit_cost_price: p.product.cost_price || 0,
          unit_sale_price: p.product.sale_price || 0
        }))
        const { error: errProd } = await (supabase as any).from('appointment_products').insert(inserts)
        if (errProd) throw errProd
      }

      await performSaveEdit()
      setShowCheckoutDrawer(false)
      setSelectedCheckoutProducts([])
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
      setIsSaving(false)
    }
  }

  const performSaveEdit = async () => {
    if (!selectedAppointment) return
    setIsSaving(true)
    try {
      const { error } = await (supabase as any).from('appointments').update({
        status: editForm.status, notes: editForm.notes
      }).eq('id', selectedAppointment.id)

      if (error) throw error

      // Update client stats if status changed to/from 'completed'
      let clientId = selectedAppointment.client_id;

      // Se for um agendamento antigo sem ID do cliente, tenta buscar pelo nome
      if (!clientId && selectedAppointment.client_name) {
        const { data: existingClient } = await (supabase as any).from('clients').select('id').eq('salon_id', salonId).eq('name', selectedAppointment.client_name).limit(1).single()
        if (existingClient) {
          clientId = existingClient.id
          await (supabase as any).from('appointments').update({ client_id: clientId }).eq('id', selectedAppointment.id)
        }
      }

      if (clientId && selectedAppointment.status !== editForm.status) {
        if (editForm.status === 'completed') {
          // Changed to completed -> increment
          const { data: clientData } = await (supabase as any).from('clients').select('total_visits, total_spent').eq('id', clientId).single()
          if (clientData) {
            await (supabase as any).from('clients').update({
              total_visits: (clientData.total_visits || 0) + 1,
              total_spent: (clientData.total_spent || 0) + (selectedAppointment.total_price || 0),
              last_visit_at: selectedAppointment.scheduled_date
            }).eq('id', clientId)
          }
          // @ts-ignore - Runtime pode ter 'completed', type guard desnecessário aqui
        } else if (selectedAppointment.status === 'completed' && editForm.status !== 'completed') {
          // Changed from completed to something else -> decrement
          const { data: clientData } = await (supabase as any).from('clients').select('total_visits, total_spent').eq('id', clientId).single()
          if (clientData) {
            await (supabase as any).from('clients').update({
              total_visits: Math.max(0, (clientData.total_visits || 0) - 1),
              total_spent: Math.max(0, (clientData.total_spent || 0) - (selectedAppointment.total_price || 0))
            }).eq('id', clientId)
          }
        }
      }

      setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status: editForm.status, notes: editForm.notes } : a))
      setMessage({ type: 'success', text: 'Status atualizado!' })
      setShowEditDrawer(false)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  // Generate Week Days for horizontal calendar
  const weekDays = []
  const currentDate = new Date(filterDate + 'T12:00:00')
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    weekDays.push(d)
  }

  const handlePrevWeek = () => {
    const d = new Date(filterDate + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    setFilterDate(d.toISOString().split('T')[0])
  }

  const handleNextWeek = () => {
    const d = new Date(filterDate + 'T12:00:00')
    d.setDate(d.getDate() + 7)
    setFilterDate(d.toISOString().split('T')[0])
  }

  const selectedProf = professionals.find(p => p.id === selectedProfessionalId)

  // Generate Time Slots
  const timeSlots = []
  for (let h = 8; h <= 20; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`)
  }

  // Real data for Donut Chart
  const calculateTopServices = () => {
    if (!appointments || appointments.length === 0) return []
    const serviceCounts: Record<string, number> = {}
    let total = 0
    appointments.forEach(a => {
      if (a.service_name) {
        serviceCounts[a.service_name] = (serviceCounts[a.service_name] || 0) + 1
        total++
      }
    })

    if (total === 0) return []

    const sorted = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
      .sort((a, b) => b.value - a.value)

    // Return top 3, group rest into 'Outros'
    if (sorted.length > 4) {
      const top3 = sorted.slice(0, 3)
      const othersValue = sorted.slice(3).reduce((acc, curr) => acc + curr.value, 0)
      top3.push({ name: 'Outros', value: othersValue })
      return top3
    }
    return sorted
  }

  const pieData = calculateTopServices()

  if (isLoading && professionals.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#121214]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 dark:bg-[#121214] min-h-screen text-slate-900 dark:text-white transition-colors lg:rounded-2xl">
      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${message.type === 'success' ? 'bg-emerald-500' : 'bg-primary-500'} text-white`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Reserva & Perfil</h1>
          <p className="text-sm text-slate-500 mt-1">Selecione o profissional para ver a agenda</p>
        </div>
        <div className="relative w-full sm:w-72">
          <button
            onClick={() => setShowProfDropdown(!showProfDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              {selectedProf?.photo_url ? (
                <img src={selectedProf.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary-500" />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedProf?.name || 'Carregando...'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{selectedProf?.role || 'Profissional'}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showProfDropdown ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-40 max-h-64 overflow-y-auto"
              >
                {professionals.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProfessionalId(p.id); setShowProfDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${selectedProfessionalId === p.id ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}
                  >
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                        <span className="text-slate-500 text-xs font-bold">{p.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`text-sm font-bold leading-tight ${selectedProfessionalId === p.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{p.role || 'Geral'}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Profile */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1c1c1f] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 text-center flex flex-col items-center">
            {selectedProf?.photo_url ? (
              <img src={selectedProf.photo_url} alt="Profile" className="w-40 h-40 rounded-2xl object-cover mb-4 shadow-md" />
            ) : (
              <div className="w-40 h-40 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-white/10">
                <UserCircle className="w-16 h-16 text-slate-400" />
              </div>
            )}
            <h2 className="text-xl font-bold">{selectedProf?.name || 'Selecione...'}</h2>
            <p className="text-sm text-primary-500 font-medium uppercase tracking-wide mt-1">{selectedProf?.role || 'Profissional'}</p>

            <div className="w-full mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {(() => {
                    if (!selectedProf?.address) return 'Endereço não cadastrado'
                    try {
                      const a = JSON.parse(selectedProf.address)
                      if (a.street) return `${a.street}, ${a.number} - ${a.neighborhood}, ${a.city} - ${a.state} (${a.zip})`
                      return selectedProf.address
                    } catch {
                      return selectedProf.address
                    }
                  })()}
                </span>
              </div>
              {selectedProf?.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Phone className="w-4 h-4 flex-shrink-0" /> <span>{selectedProf.phone}</span>
                </div>
              )}
              {selectedProf?.birth_date && (
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4 flex-shrink-0" /> <span>Nasc: {new Date(selectedProf.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {selectedProf?.specialty && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Especialidades</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedProf.specialty.map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-xs text-slate-600 dark:text-slate-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Stats & Reviews */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1c1c1f] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex items-center gap-6">
            <div className="flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-500/10 p-4 rounded-2xl text-primary-600 dark:text-primary-400 min-w-[100px]">
              <span className="text-4xl font-black">4.8</span>
              <div className="flex gap-1 mt-1"><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current opacity-30" /></div>
              <span className="text-[10px] mt-1 font-semibold">120 Reviews</span>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Os clientes elogiam muito o profissionalismo e a pontualidade. Os agendamentos fluem rapidamente e sem atrasos.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c1f] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="font-bold text-lg mb-4">Serviços Mais Realizados</h3>
            {pieData.length > 0 ? (
              <div className="flex items-center">
                <div className="w-1/2 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1c1c1f', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                Ainda não há dados suficientes.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Grid */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1c1c1f] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5">
          <h3 className="text-xl font-bold mb-6">Agenda Profissional</h3>

          {/* Week Calendar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex gap-2 sm:gap-4 overflow-x-auto">
              {weekDays.map((d, i) => {
                const isSelected = d.toISOString().split('T')[0] === filterDate
                return (
                  <div
                    key={i}
                    onClick={() => setFilterDate(d.toISOString().split('T')[0])}
                    className={`flex flex-col items-center p-3 rounded-2xl cursor-pointer min-w-[50px] transition-all ${isSelected ? 'bg-slate-900 dark:bg-white text-[#ffffff] dark:!text-slate-900 shadow-md' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                  >
                    <span className="text-[10px] uppercase font-bold mb-1">{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <span className="text-lg font-black">{d.getDate()}</span>
                  </div>
                )
              })}
            </div>
            <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <hr className="border-slate-100 dark:border-white/5 mb-6" />

          {/* Time Slots */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Horários ({new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR')})</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {timeSlots.map((time) => {
                  const occupied = appointments.find(a => {
                    const aptStart = a.scheduled_time.substring(0, 5)
                    return aptStart === time
                  })

                  if (occupied) {
                    return (
                      <div
                        key={time}
                        onClick={() => { setSelectedAppointment(occupied); setEditForm({ status: occupied.status, notes: occupied.notes || '' }); setShowEditDrawer(true); }}
                        className={`col-span-2 flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity ${statusConfig[occupied.status]?.color || 'bg-slate-100 dark:bg-white/5'}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{time}</span>
                          <span className="text-[10px] truncate max-w-[80px] font-medium">{occupied.client_name}</span>
                        </div>
                        <User className="w-4 h-4 opacity-50" />
                      </div>
                    )
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => { setCreateForm(p => ({ ...p, scheduled_time: time })); setShowCreateDrawer(true); }}
                      className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary-500 hover:text-primary-500 text-sm font-semibold transition-all text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1a2332]"
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateDrawer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowCreateDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold">Novo Agendamento</h2>
                  <button onClick={() => setShowCreateDrawer(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="flex gap-4 mb-4 bg-slate-100 dark:bg-white/5 p-4 rounded-xl">
                    <div><p className="text-xs text-slate-500">Data</p><p className="font-bold">{new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>
                    <div><p className="text-xs text-slate-500">Horário</p><p className="font-bold">{createForm.scheduled_time}</p></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-2">Cliente *</label>
                    <select
                      value={createForm.client_id}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== 'new') {
                          const c = clients.find(c => c.id === val);
                          setCreateForm({ ...createForm, client_id: val, client_name: c ? c.name : '', client_phone: c?.phone || '' })
                        } else {
                          setCreateForm({ ...createForm, client_id: 'new', client_name: '', client_phone: '' })
                        }
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a2332] outline-none"
                    >
                      <option value="">Selecione um cliente...</option>
                      <option value="new">+ Cadastrar Novo Cliente Rápido</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                    </select>
                  </div>

                  {createForm.client_id === 'new' && (
                    <div className="space-y-4 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/5">
                      <div><label className="block text-xs font-semibold uppercase mb-2">Nome do Cliente *</label><input type="text" value={createForm.client_name} onChange={e => setCreateForm({ ...createForm, client_name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2332] outline-none" placeholder="Nome do cliente" /></div>
                      <div><label className="block text-xs font-semibold uppercase mb-2">Telefone</label><input type="text" value={createForm.client_phone} onChange={e => setCreateForm({ ...createForm, client_phone: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2332] outline-none" placeholder="(11) 99999-9999" /></div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-2">Serviço *</label>
                    <select value={createForm.service_id} onChange={e => setCreateForm({ ...createForm, service_id: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a2332] outline-none">
                      <option value="">Selecione...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-white/10">
                  <button onClick={handleCreate} disabled={isSaving || !createForm.service_id || (!createForm.client_id && !createForm.client_name)} className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl shadow-lg hover:bg-primary-600 transition-colors flex justify-center">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agendar'}</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* EDIT/MANAGE DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showEditDrawer && selectedAppointment && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowEditDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold">Detalhes da Reserva</h2>
                  <button onClick={() => setShowEditDrawer(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-8 h-8 text-slate-400" /></div>
                    <h3 className="text-xl font-bold">{selectedAppointment.client_name}</h3>
                    <p className="text-slate-500 text-sm">{selectedAppointment.client_phone || 'Sem telefone'}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Serviço</span><span className="font-semibold">{selectedAppointment.service_name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Data</span><span className="font-semibold">{new Date(selectedAppointment.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedAppointment.scheduled_time.substring(0, 5)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Valor Total</span><span className="font-bold text-emerald-500">R$ {selectedAppointment.total_price}</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase mb-2">Alterar Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <button key={key} onClick={() => setEditForm({ ...editForm, status: key as any })} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${editForm.status === key ? config.color : 'bg-slate-50 dark:bg-[#1a2332] text-slate-500 border-slate-200 dark:border-white/5 hover:border-primary-500'}`}>
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3">
                  <button onClick={() => setShowEditDrawer(false)} className="flex-1 py-4 text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold rounded-xl transition-colors">Fechar</button>
                  <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 py-4 bg-primary-500 text-white font-bold rounded-xl shadow-lg hover:bg-primary-600 transition-colors flex justify-center">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alteração'}</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CHECKOUT DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCheckoutDrawer && selectedAppointment && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowCheckoutDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary-500" /> Checkout</h2>
                  <button onClick={() => setShowCheckoutDrawer(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Resumo do Serviço */}
                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Serviço Realizado</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{selectedAppointment.service_name}</span>
                      <span className="font-bold">R$ {selectedAppointment.service_price}</span>
                    </div>
                  </div>

                  {/* Adicionar Produtos */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">O cliente consumiu produtos?</h3>
                    <div className="relative mb-4">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={checkoutSearch}
                        onChange={(e) => setCheckoutSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl outline-none"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {checkoutProducts.filter(p => p.name.toLowerCase().includes(checkoutSearch.toLowerCase())).map(product => {
                        const isSelected = selectedCheckoutProducts.find(sp => sp.product.id === product.id)
                        return (
                          <div key={product.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-white dark:bg-transparent">
                            <div>
                              <p className="text-sm font-bold">{product.name}</p>
                              <p className="text-xs text-slate-500">R$ {product.sale_price} (Estoque: {product.stock_quantity})</p>
                            </div>
                            {isSelected ? (
                              <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedCheckoutProducts(prev => prev.map(p => p.product.id === product.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p))} className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-white/10 rounded-full">-</button>
                                <span className="text-sm font-bold w-4 text-center">{isSelected.quantity}</span>
                                <button onClick={() => setSelectedCheckoutProducts(prev => prev.map(p => p.product.id === product.id ? { ...p, quantity: Math.min(product.stock_quantity, p.quantity + 1) } : p))} className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-white/10 rounded-full">+</button>
                                <button onClick={() => setSelectedCheckoutProducts(prev => prev.filter(p => p.product.id !== product.id))} className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setSelectedCheckoutProducts([...selectedCheckoutProducts, { product, quantity: 1 }])} className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-lg hover:bg-primary-100 transition-colors">Add</button>
                            )}
                          </div>
                        )
                      })}
                      {checkoutProducts.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhum produto com estoque disponível.</p>}
                    </div>
                  </div>

                  {/* Resumo Total */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center text-sm mb-2 text-slate-500">
                      <span>Subtotal Serviços</span>
                      <span>R$ {selectedAppointment.service_price}</span>
                    </div>
                    {selectedCheckoutProducts.length > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2 text-slate-500">
                        <span>Subtotal Produtos</span>
                        <span>R$ {selectedCheckoutProducts.reduce((acc, p) => acc + (p.quantity * (p.product.sale_price || 0)), 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-bold text-lg">Total a Pagar</span>
                      <span className="font-black text-2xl text-emerald-500">
                        R$ {((selectedAppointment.service_price || 0) + selectedCheckoutProducts.reduce((acc, p) => acc + (p.quantity * (p.product.sale_price || 0)), 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3">
                  <button onClick={() => setShowCheckoutDrawer(false)} className="flex-1 py-4 text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold rounded-xl transition-colors">Voltar</button>
                  <button onClick={handleCompleteCheckout} disabled={isSaving} className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-colors flex justify-center">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Atendimento'}</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}
