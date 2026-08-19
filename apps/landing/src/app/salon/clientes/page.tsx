'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Loader2, RefreshCw, Trash2, Edit3, X, CheckCircle,
  AlertCircle, Save, Phone, Mail, Calendar, MapPin, Star, Eye, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, Clock, Activity, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Client {
  id: string
  salon_id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birth_date: string | null
  gender: string | null
  tags: string[] | null
  notes: string | null
  address: string | null
  address_zipcode?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  address_city?: string | null
  address_state?: string | null
  is_vip: boolean
  total_visits: number
  total_spent: number
  last_visit_at: string | null
  status: 'active' | 'inactive' | 'blocked'
  created_at: string
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  return numbers.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function ClientesPage() {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search') || ''

  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const { salonId } = useSalonLayout()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showViewDrawer, setShowViewDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '', email: '', phone: '', cpf: '', birth_date: '', gender: '', notes: '', is_vip: false,
    address_zip: '', address_street: '', address_number: '', address_neighborhood: '', address_city: '', address_state: ''
  })

  const [editForm, setEditForm] = useState({
    id: '', name: '', email: '', phone: '', cpf: '', birth_date: '', gender: '', notes: '', is_vip: false,
    address_zip: '', address_street: '', address_number: '', address_neighborhood: '', address_city: '', address_state: ''
  })

  useEffect(() => { if (salonId) fetchClients() }, [salonId])
  useEffect(() => { setSearchTerm(urlSearch) }, [urlSearch])

  const fetchClients = async () => {
    if (!salonId) return
    setIsLoading(true)
    const { data } = await (supabase as any).from('clients').select('*').eq('salon_id', salonId).order('name')
    if (data) setClients(data)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!salonId || !createForm.name.trim()) return
    setIsSaving(true)
    const { data, error } = await (supabase as any).from('clients').insert({
      salon_id: salonId,
      name: createForm.name,
      email: createForm.email || null,
      phone: createForm.phone ? createForm.phone.replace(/\D/g, '') : null,
      cpf: createForm.cpf ? createForm.cpf.replace(/\D/g, '') : null,
      birth_date: createForm.birth_date || null,
      gender: createForm.gender || null,
      notes: createForm.notes || null,
      address_street: createForm.address_street || null,
      address_number: createForm.address_number || null,
      address_neighborhood: createForm.address_neighborhood || null,
      address_city: createForm.address_city || null,
      address_state: createForm.address_state || null,
      address_zipcode: createForm.address_zip || null,
      is_vip: createForm.is_vip
    }).select().single()

    if (!error && data) {
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setMessage({ type: 'success', text: 'Cliente adicionado!' })
      setShowCreateDrawer(false)
      setCreateForm({ name: '', email: '', phone: '', cpf: '', birth_date: '', gender: '', notes: '', is_vip: false, address_zip: '', address_street: '', address_number: '', address_neighborhood: '', address_city: '', address_state: '' })
    } else {
      setMessage({ type: 'error', text: error?.message || 'Erro' })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleView = (client: Client) => { setSelectedClient(client); setShowViewDrawer(true) }

  const handleEdit = (client: Client) => {
    setEditForm({
      id: client.id,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      cpf: client.cpf || '',
      birth_date: client.birth_date || '',
      gender: client.gender || '',
      notes: client.notes || '',
      is_vip: client.is_vip || false,
      address_zip: client.address_zipcode || '',
      address_street: client.address_street || '',
      address_number: client.address_number || '',
      address_neighborhood: client.address_neighborhood || '',
      address_city: client.address_city || '',
      address_state: client.address_state || ''
    })
    setSelectedClient(client)
    setShowEditDrawer(true)
  }

  const saveEdit = async () => {
    if (!editForm.name.trim()) return
    setIsSaving(true)
    const { data, error } = await (supabase as any).from('clients').update({
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone ? editForm.phone.replace(/\D/g, '') : null,
      cpf: editForm.cpf ? editForm.cpf.replace(/\D/g, '') : null,
      birth_date: editForm.birth_date || null,
      gender: editForm.gender || null,
      notes: editForm.notes || null,
      address_street: editForm.address_street || null,
      address_number: editForm.address_number || null,
      address_neighborhood: editForm.address_neighborhood || null,
      address_city: editForm.address_city || null,
      address_state: editForm.address_state || null,
      address_zipcode: editForm.address_zip || null,
      is_vip: editForm.is_vip
    }).eq('id', editForm.id).select().single()

    if (!error && data) {
      setClients(prev => prev.map(c => c.id === data.id ? data : c))
      setMessage({ type: 'success', text: 'Cliente atualizado!' })
      setShowEditDrawer(false)
      setSelectedClient(data)
    } else {
      setMessage({ type: 'error', text: error?.message || 'Erro ao atualizar' })
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = (client: Client) => { setSelectedClient(client); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!selectedClient) return
    setIsSaving(true)
    const { error } = await (supabase as any).from('clients').delete().eq('id', selectedClient.id)
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== selectedClient.id))
      setMessage({ type: 'success', text: 'Cliente excluído!' })
      setShowDeleteModal(false)
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const toggleVip = async (client: Client) => {
    const { error } = await (supabase as any).from('clients').update({ is_vip: !client.is_vip }).eq('id', client.id)
    if (!error) {
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_vip: !c.is_vip } : c))
    }
  }

  const exportToExcel = () => {
    if (clients.length === 0) return

    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #be185d; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 13px; padding: 15px; text-align: left; border: 1px solid #9d174d; }
          td { padding: 12px; font-size: 13px; color: #334155; border: 1px solid #e2e8f0; vertical-align: middle; }
          .title { font-size: 22px; font-weight: bold; color: #ffffff; background-color: #0f172a; text-align: center; padding: 20px; text-transform: uppercase; border: none; }
          .subtitle { font-size: 12px; color: #64748b; background-color: #f8fafc; text-align: right; padding: 10px; border: none; }
          .vip { color: #d97706; font-weight: bold; }
          .money { color: #10b981; font-weight: bold; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th colspan="9" class="title">RELATÓRIO GERENCIAL DE CLIENTES - PODEROSA AGENDA</th>
            </tr>
            <tr>
              <th colspan="9" class="subtitle">Gerado em: ${new Date().toLocaleString('pt-BR')} | Total de Registros: ${clients.length}</th>
            </tr>
            <tr>
              <th>ID Sistema</th>
              <th>Nome Completo</th>
              <th>Telefone de Contato</th>
              <th>Correio Eletrônico (Email)</th>
              <th>Data de Nascimento</th>
              <th>Gênero</th>
              <th class="center">Status de Fidelidade</th>
              <th class="center">Frequência (Visitas)</th>
              <th>Receita Gerada (R$)</th>
            </tr>
          </thead>
          <tbody>
    `

    clients.forEach((c, index) => {
      const isVip = c.is_vip ? '<span class="vip">★ Cliente VIP</span>' : 'Padrão'
      const spent = (c.total_spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      tableHTML += `
            <tr>
              <td class="center">#${String(index + 1).padStart(4, '0')}</td>
              <td style="font-weight: bold;">${c.name}</td>
              <td>${c.phone ? formatPhone(c.phone) : '-'}</td>
              <td>${c.email || '-'}</td>
              <td>${c.birth_date ? new Date(c.birth_date).toLocaleDateString('pt-BR') : '-'}</td>
              <td>${c.gender === 'M' ? 'Masculino' : c.gender === 'F' ? 'Feminino' : c.gender === 'O' ? 'Outro' : 'N/D'}</td>
              <td class="center">${isVip}</td>
              <td class="center" style="font-weight: bold; color: #3b82f6;">${c.total_visits || 0}</td>
              <td class="money">${spent}</td>
            </tr>
      `
    })

    tableHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Relatorio_Clientes_Poderosa_${new Date().getTime()}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredClients = clients.filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()))

  const [currentSlide, setCurrentSlide] = useState(0)

  const getGrowthData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const data = months.map(m => ({ name: m, novos: 0 }))

    clients.forEach(c => {
      const d = new Date(c.created_at)
      if (d.getFullYear() === new Date().getFullYear()) {
        data[d.getMonth()].novos++
      }
    })
    const currentMonth = new Date().getMonth()
    return data.slice(0, currentMonth + 1)
  }
  const growthData = getGrowthData()

  const getGenderData = () => {
    let m = 0, f = 0, o = 0, nd = 0
    clients.forEach(c => {
      if (c.gender === 'M') m++
      else if (c.gender === 'F') f++
      else if (c.gender === 'O') o++
      else nd++
    })
    return [
      { name: 'Feminino', value: f, color: '#f43f5e' },
      { name: 'Masculino', value: m, color: '#3b82f6' },
      { name: 'Outros', value: o, color: '#8b5cf6' },
      { name: 'N/D', value: nd, color: '#64748b' }
    ].filter(d => d.value > 0)
  }
  const genderData = getGenderData()

  const topVips = [...clients].filter(c => c.is_vip).sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5)
  const recentVisits = [...clients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)
  const totalClients = clients.length

  const getRetentionIntelligence = () => {
    const now = new Date();

    let activeReturning = 0;
    let newRecent = 0;
    let churnRisk = 0;
    let totalEligible = 0;

    clients.forEach(c => {
      if (c.total_visits > 0) {
        const lastVisit = c.last_visit_at ? new Date(c.last_visit_at) : new Date(c.created_at);
        const daysSinceLast = (now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24);

        if (daysSinceLast <= 90) {
          if (c.total_visits > 1) activeReturning++;
          else newRecent++;
        } else {
          churnRisk++;
        }
      }
    });

    totalEligible = activeReturning + churnRisk;
    const retentionRate = totalEligible > 0 ? Math.round((activeReturning / totalEligible) * 100) : 0;

    let diagnosis = "Sua base está crescendo. Foco na primeira fidelização dos novos.";
    let diagnosisColor = "text-emerald-500";
    let icon = <TrendingUp className="w-4 h-4 text-emerald-500" />;
    let bgIcon = "bg-emerald-500/10";

    if (retentionRate >= 70 && totalEligible > 5) {
      diagnosis = "Excelente retenção! Seus clientes são extremamente fiéis ao salão.";
    } else if (retentionRate >= 40 && totalEligible > 5) {
      diagnosis = "Retenção mediana. Há um leve risco de evasão. Invista em lembretes.";
      diagnosisColor = "text-amber-500";
      icon = <Activity className="w-4 h-4 text-amber-500" />;
      bgIcon = "bg-amber-500/10";
    } else if (totalEligible > 5) {
      diagnosis = "Atenção: Alta taxa de evasão (Churn). Faça campanhas de reativação já.";
      diagnosisColor = "text-red-500";
      icon = <TrendingDown className="w-4 h-4 text-red-500" />;
      bgIcon = "bg-red-500/10";
    }

    return { retentionRate, activeReturning, churnRisk, newRecent, diagnosis, diagnosisColor, icon, bgIcon, totalEligible };
  }
  const retentionInt = getRetentionIntelligence();

  const getAgeData = () => {
    let under18 = 0, g18_24 = 0, g25_34 = 0, g35_44 = 0, g45_plus = 0, unknown = 0;
    const today = new Date();
    clients.forEach(c => {
      if (!c.birth_date) {
        unknown++;
        return;
      }
      const birth = new Date(c.birth_date);
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) under18++;
      else if (age >= 18 && age <= 24) g18_24++;
      else if (age >= 25 && age <= 34) g25_34++;
      else if (age >= 35 && age <= 44) g35_44++;
      else g45_plus++;
    });
    return [
      { name: '< 18', value: under18, color: '#38bdf8' },
      { name: '18-24', value: g18_24, color: '#a78bfa' },
      { name: '25-34', value: g25_34, color: '#f472b6' },
      { name: '35-44', value: g35_44, color: '#fb923c' },
      { name: '45+', value: g45_plus, color: '#4ade80' }
    ].filter(d => d.value > 0);
  }
  const ageData = getAgeData();

  const getLocationData = () => {
    const cityCounts: Record<string, number> = {};
    clients.forEach(c => {
      if (c.address_city && c.address_state) {
        const label = `${c.address_city} - ${c.address_state}`;
        cityCounts[label] = (cityCounts[label] || 0) + 1;
      }
    });
    return Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }
  const locationData = getLocationData();

  const handleNextSlide = () => setCurrentSlide(p => p === 2 ? 0 : p + 1)
  const handlePrevSlide = () => setCurrentSlide(p => p === 0 ? 2 : p - 1)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Dashboard de Relacionamento e CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchClients} disabled={isLoading} className="p-2.5 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 shadow-sm transition-all" />
          </div>
          <button onClick={() => setShowCreateDrawer(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm rounded-xl shadow-md transition-all">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {isLoading && clients.length === 0 ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-1 lg:col-span-8 bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolução de Novos Clientes</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Cadastros por mês neste ano</p>
                </div>
              </div>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-card)' }}
                    />
                    <Bar dataKey="novos" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-primary-600 to-rose-600 rounded-2xl p-6 shadow-lg shadow-primary-500/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Total de Clientes</p>
                      <h2 className="text-3xl font-black">{totalClients}</h2>
                    </div>
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">VIPs</p>
                      <p className="font-bold text-lg">{clients.filter(c => c.is_vip).length}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Ativos</p>
                      <p className="font-bold text-lg">{clients.filter(c => c.status === 'active').length}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button onClick={exportToExcel} className="flex-1 py-2 bg-white text-primary-600 font-bold text-xs rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Gerar Relatório Excel</button>
                    <button onClick={() => setShowCreateDrawer(true)} className="flex-1 py-2 bg-black/20 text-white font-bold text-xs rounded-lg hover:bg-black/30 transition-colors backdrop-blur-sm">Adicionar</button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Clientes VIP</h3>
                </div>
                {topVips.length > 0 ? (
                  <div className="flex justify-between items-center px-2">
                    {topVips.map(vip => (
                      <div key={vip.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleView(vip)}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform ring-2 ring-white dark:ring-[#1a2332]">
                          {vip.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-gray-400 truncate max-w-[50px] font-medium">{vip.name.split(' ')[0]}</span>
                      </div>
                    ))}
                    {topVips.length < 5 && (
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-slate-300 dark:text-white/20" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">Nenhum VIP ainda.</p>
                )}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-4 bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Retenção de Clientes</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Ativos nos últimos 90 dias</p>
                </div>
                <div className={`p-2 ${retentionInt.bgIcon} rounded-lg`}>
                  {retentionInt.icon}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">{retentionInt.retentionRate}%</h2>
                  <span className="text-xs text-slate-500 font-medium mb-1">{retentionInt.activeReturning} fidelizados de {retentionInt.totalEligible} elegíveis</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                  <div className={`h-full ${retentionInt.retentionRate >= 70 ? 'bg-emerald-500' : retentionInt.retentionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'} rounded-full`} style={{ width: `${retentionInt.retentionRate}%` }}></div>
                </div>
                <p className={`text-[10px] ${retentionInt.diagnosisColor} mt-3 font-medium flex items-center gap-1`}>
                  <Activity className="w-3 h-3" /> {retentionInt.diagnosis}
                </p>
                {retentionInt.churnRisk > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    *{retentionInt.churnRisk} clientes não retornam há mais de 3 meses.
                  </p>
                )}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-4 bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-center mb-2 z-10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentSlide === 0 ? 'Perfil por Gênero' : currentSlide === 1 ? 'Perfil Etário' : 'Top Localizações'}
                </h3>
                <div className="flex gap-1">
                  <button onClick={handlePrevSlide} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleNextSlide} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <AnimatePresence mode="wait">
                  {currentSlide === 0 && (
                    <motion.div key="slide0" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex">
                      {genderData.length > 0 ? (
                        <>
                          <div className="w-1/2 h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={genderData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                                  {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-1/2 flex flex-col justify-center space-y-2">
                            {genderData.map((d, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}</span>
                                </div>
                                <span className="font-bold">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center">Cadastre o gênero para gerar este gráfico.</div>
                      )}
                    </motion.div>
                  )}

                  {currentSlide === 1 && (
                    <motion.div key="slide1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex flex-col justify-center pt-4">
                      {ageData.length > 0 ? (
                        <div className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                              <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                {ageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center">Preencha a data de nascimento para ativar.</div>
                      )}
                    </motion.div>
                  )}

                  {currentSlide === 2 && (
                    <motion.div key="slide2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex flex-col justify-center pt-2">
                      {locationData.length > 0 ? (
                        <div className="space-y-3 w-full px-2">
                          {locationData.map((loc, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><MapPin className="w-3 h-3 text-primary-500" /> {loc.name}</span>
                              <span className="text-xs font-black text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded">{loc.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center">Insira endereços dos clientes para ativar.</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-4 bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Novos Cadastros</h3>
              </div>
              <div className="flex-1 space-y-3">
                {recentVisits.length > 0 ? recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between cursor-pointer" onClick={() => handleView(visit)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {visit.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">{visit.name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(visit.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {visit.is_vip ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline-block mb-1" /> : <div className="h-3.5" />}
                      <p className="text-xs font-medium text-emerald-500">{formatCurrency(visit.total_spent || 0)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 text-center py-4">Nenhum cliente cadastrado.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Base de Clientes</h2>
            {filteredClients.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[calc(100vh-400px)] custom-scrollbar">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-slate-50 dark:bg-white/5 sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Histórico</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-white/10 dark:to-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-slate-700 dark:text-white font-bold">{client.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-slate-900 dark:text-white font-semibold text-sm">{client.name}</p>
                                  {client.is_vip && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                                </div>
                                {(client.address_city || client.address_state) && (
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {client.address_city}{client.address_city && client.address_state ? ' - ' : ''}{client.address_state}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              {client.phone ? (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 text-xs"><Phone className="w-3 h-3 text-slate-400" />{formatPhone(client.phone)}</div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><Phone className="w-3 h-3 opacity-50" />Não informado</div>
                              )}
                              {client.email && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 text-xs"><Mail className="w-3 h-3 text-slate-400" />{client.email}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-600 dark:text-gray-400"><span className="font-semibold text-slate-900 dark:text-white">{client.total_visits}</span> visitas</p>
                              <p className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(client.total_spent || 0)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleView(client)} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors" title="Ver Perfil"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleEdit(client)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => toggleVip(client)} className={`p-2 rounded-lg transition-colors ${client.is_vip ? 'text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`} title={client.is_vip ? "Remover VIP" : "Tornar VIP"}><Star className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(client)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/5 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-400" /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum cliente encontrado</h3>
                <p className="text-slate-500 text-sm mb-6">Busque por outro termo ou cadastre um novo cliente.</p>
                {searchTerm === '' && (
                  <button onClick={() => setShowCreateDrawer(true)} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-md transition-all">Cadastrar Primeiro</button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateDrawer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowCreateDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onWheel={(e) => e.stopPropagation()} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-primary-600 dark:text-primary-400" /></div>
                    <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Novo Cliente</h2><p className="text-xs text-slate-500">Cadastrar no CRM</p></div>
                  </div>
                  <button onClick={() => setShowCreateDrawer(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nome *</label><input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Nome completo" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Telefone</label><input type="tel" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-9999" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">CPF</label><input type="text" value={createForm.cpf} onChange={(e) => setCreateForm({ ...createForm, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  </div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label><input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nascimento</label><input type="date" value={createForm.birth_date} onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Gênero</label><select value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="O">Outro</option></select></div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                    <label className="block text-xs font-bold uppercase text-slate-500">Endereço Completo</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"><input type="text" value={createForm.address_zip} onChange={(e) => setCreateForm({ ...createForm, address_zip: e.target.value })} placeholder="CEP" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div className="col-span-2"><input type="text" value={createForm.address_street} onChange={(e) => setCreateForm({ ...createForm, address_street: e.target.value })} placeholder="Rua / Avenida" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"><input type="text" value={createForm.address_number} onChange={(e) => setCreateForm({ ...createForm, address_number: e.target.value })} placeholder="Número" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div className="col-span-2"><input type="text" value={createForm.address_neighborhood} onChange={(e) => setCreateForm({ ...createForm, address_neighborhood: e.target.value })} placeholder="Bairro" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><input type="text" value={createForm.address_city} onChange={(e) => setCreateForm({ ...createForm, address_city: e.target.value })} placeholder="Cidade" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div><input type="text" value={createForm.address_state} onChange={(e) => setCreateForm({ ...createForm, address_state: e.target.value })} placeholder="Estado" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                  </div>

                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Observações</label><textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Alergias, preferências..." rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                  <button type="button" onClick={() => setCreateForm({ ...createForm, is_vip: !createForm.is_vip })} className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${createForm.is_vip ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400' : 'bg-white dark:bg-[#1a2332] border-slate-200 dark:border-white/10 hover:border-slate-300'}`}><Star className={`w-5 h-5 ${createForm.is_vip ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} /><span className={`font-bold ${createForm.is_vip ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500'}`}>Cliente VIP</span></button>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <button onClick={handleCreate} disabled={isSaving || !createForm.name} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Cadastro'}</button>
                  <button onClick={() => setShowCreateDrawer(false)} className="w-full px-6 py-4 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-xl font-bold transition-all">Cancelar</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* VIEW DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showViewDrawer && selectedClient && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowViewDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onWheel={(e) => e.stopPropagation()} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-rose-600 rounded-full flex items-center justify-center shadow-md"><span className="text-white font-bold text-2xl">{selectedClient.name.charAt(0).toUpperCase()}</span></div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">{selectedClient.name}{selectedClient.is_vip && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}</h2>
                      <p className="text-xs text-slate-500 mt-1">Cliente desde {new Date(selectedClient.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowViewDrawer(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-[#1a2332] border border-slate-100 dark:border-white/5 rounded-2xl p-5 text-center"><p className="text-slate-500 text-xs font-bold uppercase mb-1">Visitas</p><p className="text-3xl font-black text-slate-900 dark:text-white">{selectedClient.total_visits}</p></div>
                    <div className="bg-slate-50 dark:bg-[#1a2332] border border-slate-100 dark:border-white/5 rounded-2xl p-5 text-center"><p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Gasto</p><p className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(selectedClient.total_spent || 0)}</p></div>
                  </div>
                  {selectedClient.phone && <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#1a2332] border border-slate-100 dark:border-white/5 rounded-2xl"><div className="p-2 bg-white dark:bg-white/5 rounded-lg"><Phone className="w-5 h-5 text-primary-500" /></div><div><p className="text-xs font-bold uppercase text-slate-500">Telefone</p><p className="text-slate-900 dark:text-white font-medium">{formatPhone(selectedClient.phone)}</p></div></div>}
                  {selectedClient.email && <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#1a2332] border border-slate-100 dark:border-white/5 rounded-2xl"><div className="p-2 bg-white dark:bg-white/5 rounded-lg"><Mail className="w-5 h-5 text-primary-500" /></div><div><p className="text-xs font-bold uppercase text-slate-500">Email</p><p className="text-slate-900 dark:text-white font-medium">{selectedClient.email}</p></div></div>}
                  {selectedClient.birth_date && <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#1a2332] border border-slate-100 dark:border-white/5 rounded-2xl"><div className="p-2 bg-white dark:bg-white/5 rounded-lg"><Calendar className="w-5 h-5 text-primary-500" /></div><div><p className="text-xs font-bold uppercase text-slate-500">Nascimento</p><p className="text-slate-900 dark:text-white font-medium">{new Date(selectedClient.birth_date).toLocaleDateString('pt-BR')}</p></div></div>}

                  {selectedClient.notes && <div className="p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl"><p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Observações</p><p className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed">{selectedClient.notes}</p></div>}
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-2">
                  <button onClick={() => { setShowViewDrawer(false); handleEdit(selectedClient) }} className="flex-1 px-6 py-4 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl font-bold transition-all">Editar Perfil</button>
                  <button onClick={() => setShowViewDrawer(false)} className="flex-1 px-6 py-4 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-xl font-bold transition-all">Fechar Perfil</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* DELETE MODAL */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showDeleteModal && selectedClient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#1a2332] rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="w-8 h-8 text-red-500" /></div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Excluir Cliente?</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm text-center mb-8">Esta ação é irreversível. Tem certeza que deseja excluir os registros de <strong className="text-slate-900 dark:text-white">{selectedClient.name}</strong>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 font-bold rounded-xl transition-colors">Cancelar</button>
                  <button onClick={confirmDelete} disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-md transition-colors">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* EDIT DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showEditDrawer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm" onClick={() => setShowEditDrawer(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onWheel={(e) => e.stopPropagation()} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1c1c1f] z-[60] shadow-2xl flex flex-col rounded-l-3xl border-l border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center"><Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Cliente</h2><p className="text-xs text-slate-500">Atualizar dados cadastrais</p></div>
                  </div>
                  <button onClick={() => setShowEditDrawer(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nome Completo *</label><input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome completo" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">WhatsApp</label><input type="text" value={formatPhone(editForm.phone)} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">CPF</label><input type="text" value={formatCPF(editForm.cpf)} onChange={e => setEditForm({ ...editForm, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  </div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">E-mail</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nascimento</label><input type="date" value={editForm.birth_date} onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Gênero</label><select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Selecione</option><option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option></select></div>
                  </div>

                  {/* Endereço */}
                  <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                    <label className="block text-xs font-bold uppercase text-slate-500">Endereço</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"><input type="text" value={editForm.address_zip} onChange={e => setEditForm({ ...editForm, address_zip: e.target.value })} placeholder="CEP" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div className="col-span-2"><input type="text" value={editForm.address_street} onChange={e => setEditForm({ ...editForm, address_street: e.target.value })} placeholder="Rua / Avenida" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"><input type="text" value={editForm.address_number} onChange={e => setEditForm({ ...editForm, address_number: e.target.value })} placeholder="Número" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div className="col-span-2"><input type="text" value={editForm.address_neighborhood} onChange={e => setEditForm({ ...editForm, address_neighborhood: e.target.value })} placeholder="Bairro" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><input type="text" value={editForm.address_city} onChange={e => setEditForm({ ...editForm, address_city: e.target.value })} placeholder="Cidade" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                      <div><input type="text" value={editForm.address_state} onChange={e => setEditForm({ ...editForm, address_state: e.target.value })} placeholder="Estado" className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                  </div>

                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Observações</label><textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Alergias, preferências..." rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                  <button type="button" onClick={() => setEditForm({ ...editForm, is_vip: !editForm.is_vip })} className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${editForm.is_vip ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400' : 'bg-white dark:bg-[#1a2332] border-slate-200 dark:border-white/10 hover:border-slate-300'}`}><Star className={`w-5 h-5 ${editForm.is_vip ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} /><span className={`font-bold ${editForm.is_vip ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500'}`}>Cliente VIP</span></button>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <button onClick={saveEdit} disabled={isSaving || !editForm.name.trim()} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Atualizar Dados</>}</button>
                  <button onClick={() => setShowEditDrawer(false)} className="w-full px-6 py-4 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-xl font-bold transition-all">Cancelar</button>
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