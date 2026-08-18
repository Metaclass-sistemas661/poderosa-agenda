'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, DollarSign, Calendar, TrendingUp, Users, Clock, Gift, Package, ArrowUpRight, Phone, Scissors,
  MessageSquare, Bell, Send, CheckCheck, CalendarCheck, Megaphone, Zap, ArrowDownRight, Wallet, Receipt, BarChart3, PieChart,
  CheckCircle, AlertCircle, Play, Star, Heart, ClipboardList, UserCheck, FolderOpen
} from 'lucide-react'

// --- DATA ---
const kpiCards = [
  { title: 'Receita Hoje', value: 'R$ 1.240', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { title: 'Agendamentos', value: '12', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { title: 'Receita Mês', value: 'R$ 18.400', icon: TrendingUp, color: 'from-secondary-500 to-violet-600' },
]

const todaySchedule = [
  { time: '09:00', client: 'Ana Souza', service: 'Corte Feminino', status: 'confirmed', statusColor: 'bg-emerald-500/20 text-emerald-400', statusLabel: 'Confirmado', professional: 'Juliana' },
  { time: '10:30', client: 'Mariana Lima', service: 'Coloração', status: 'scheduled', statusColor: 'bg-blue-500/20 text-blue-400', statusLabel: 'Agendado', professional: 'Carla' },
  { time: '14:00', client: 'Fernanda Alves', service: 'Manicure', status: 'in_progress', statusColor: 'bg-amber-500/20 text-amber-400', statusLabel: 'Em andamento', professional: 'Paula' },
]

const messageQueue = [
  { type: 'confirmation', title: 'Confirmação', recipient: 'Maria Oliveira', time: 'Agora', status: 'sent', statusLabel: 'Enviado' },
  { type: 'reminder', title: 'Lembrete 24h', recipient: 'Ana Souza', time: 'Em 2h', status: 'scheduled', statusLabel: 'Programado' },
]

const marketingQueue = [
  { type: 'promo', title: 'Promoção Dia das Mães', stats: 'Enviado p/ 450 clientes', status: 'active', statusLabel: 'Ativo' },
  { type: 'recover', title: 'Recuperação de Ausentes', stats: 'Enviado p/ 128 clientes', status: 'paused', statusLabel: 'Pausado' },
]

const finStats = [
  { icon: ArrowUpRight, label: 'Receitas', value: 'R$ 18.400', bgColor: 'from-emerald-500/20 to-emerald-600/10', borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400' },
  { icon: ArrowDownRight, label: 'Despesas', value: 'R$ 6.820', bgColor: 'from-red-500/20 to-red-600/10', borderColor: 'border-red-500/20', textColor: 'text-red-400' },
]

const recentTransactions = [
  { type: 'income', desc: 'Corte Feminino', value: '+ R$ 85,00', date: '08 Jan' },
  { type: 'expense', desc: 'Fornecedores', value: '- R$ 420,00', date: '07 Jan' },
]

const clientData = {
  name: 'Maria Oliveira', initial: 'M', isVip: true, phone: '(11) 98765-4321', birthday: '18 de Março',
  preference: 'Coloração + Escova', totalVisits: 24, totalSpent: 'R$ 3.840', status: 'Cliente recorrente'
}

// --- MOCKUP COMPONENTS ---

function DashboardMockup() {
  return (
    <div className="absolute bottom-0 left-8 right-8 h-[72%] bg-[#0f1117] rounded-t-3xl shadow-2xl border border-white/[0.1] border-b-0 transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.08] bg-gradient-to-b from-[#0d0e13] to-[#0c0d12] rounded-t-3xl">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="flex-1 mx-4 h-7 bg-white/[0.04] border border-white/[0.06] rounded-lg" />
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {kpiCards.map((kpi) => (
            <div key={kpi.title} className="bg-[#161b26] rounded-2xl p-4 border border-white/[0.06]">
              <p className="text-white/45 text-xs font-medium mb-2">{kpi.title}</p>
              <p className="text-white font-bold text-xl">{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#161b26] rounded-2xl p-6 border border-white/[0.06]">
          <h4 className="text-white text-sm font-bold mb-4">Agenda de Hoje</h4>
          <div className="space-y-3">
            {todaySchedule.slice(0, 2).map((apt) => (
              <div key={apt.time} className="flex items-center gap-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.02]">
                <p className="text-white font-bold text-sm w-12">{apt.time}</p>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{apt.client}</p>
                  <p className="text-white/40 text-xs">{apt.service}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-medium ${apt.statusColor}`}>{apt.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatsAppMockup() {
  return (
    <div className="absolute bottom-0 left-8 right-8 lg:left-16 lg:right-16 h-[75%] bg-[#0f1419]/95 backdrop-blur-xl rounded-t-3xl border border-white/[0.08] border-b-0 overflow-hidden transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0"
         style={{
           boxShadow: '0 -20px 60px -15px rgba(37, 211, 102, 0.15), 0 0 100px -20px rgba(37, 211, 102, 0.1)'
         }}
    >
      {/* Floating Glow */}
      <div className="absolute inset-0 opacity-[0.36] pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#25D366]/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#128C7E]/20 rounded-full blur-[100px]" />
      </div>

      {/* macOS Chrome */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1a2332]/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Automações</span>
        </div>
        <div className="w-16" />
      </div>

      {/* WhatsApp Content */}
      <div className="relative p-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a2332]/60 rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-[11px] text-gray-500 mb-1">Na fila</p>
            <p className="text-xl font-bold text-amber-400">5</p>
          </div>
          <div className="bg-[#1a2332]/60 rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-[11px] text-gray-500 mb-1">Enviadas hoje</p>
            <p className="text-xl font-bold text-emerald-400">23</p>
          </div>
          <div className="bg-[#1a2332]/60 rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-[11px] text-gray-500 mb-1">Aniversários</p>
            <p className="text-xl font-bold text-purple-400">3</p>
          </div>
        </div>

        {/* Message Queue */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
              Fila de Mensagens
            </h4>
            <span className="text-[11px] text-gray-500 font-medium">Automático</span>
          </div>
          
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a2332]/40 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium truncate">Confirmação de Agendamento</p>
                <p className="text-[11px] text-gray-500">Maria Oliveira • Agora</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">Enviado</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[#1a2332]/40 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium truncate">Lembrete 24h</p>
                <p className="text-[11px] text-gray-500">Ana Souza • Em 2h</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-400">Programado</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[#1a2332]/40 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium truncate">Feliz Aniversário!</p>
                <p className="text-[11px] text-gray-500">Juliana Costa • Hoje 08:00</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">Enviado</span>
            </div>
          </div>
        </div>

        {/* Automation Status */}
        <div className="flex items-center justify-between p-4 bg-[#25D366]/5 rounded-xl border border-[#25D366]/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
            <span className="text-[13px] text-[#25D366] font-medium">Automações ativas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Confirmações, Lembretes, Aniversários</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatsAppMarketingMockup() {
  return (
    <div className="absolute bottom-0 left-12 right-12 h-[72%] bg-[#0f1419] rounded-t-3xl shadow-2xl border border-[#25D366]/20 border-b-0 transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
      <div className="px-6 py-5 border-b border-white/[0.08] bg-[#1a2332]/50 flex items-center justify-between rounded-t-3xl">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-[#25D366]" />
          <span className="text-sm text-white font-semibold">Marketing via WhatsApp</span>
        </div>
        <div className="px-3 py-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg">
          <span className="text-xs font-bold text-[#25D366]">IA Ativada</span>
        </div>
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-[#1a2332]/60 rounded-2xl p-6 border border-[#25D366]/10">
           <div className="flex items-center justify-between mb-6">
             <h4 className="text-sm font-bold text-white flex items-center gap-2">
               <Zap className="w-4 h-4 text-amber-400" /> Disparos Inteligentes
             </h4>
             <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
               + R$ 2.450 em Retorno
             </span>
           </div>
           <div className="space-y-3">
             {marketingQueue.map((camp, index) => (
               <div key={index} className="flex items-center justify-between px-5 py-4 bg-[#0f1419]/60 rounded-xl border border-white/[0.04]">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-[#25D366]/20 rounded-lg flex items-center justify-center">
                     <Megaphone className="w-5 h-5 text-[#25D366]" />
                   </div>
                   <div>
                     <p className="text-sm text-white font-medium">{camp.title}</p>
                     <p className="text-xs text-gray-500 mt-1">{camp.stats}</p>
                   </div>
                 </div>
                 <span className={`text-xs font-medium px-3 py-1 rounded-full ${camp.status === 'active' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-gray-500/10 text-gray-400'}`}>{camp.statusLabel}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function FinancialMockup() {
  return (
    <div className="absolute bottom-0 left-12 right-12 h-[72%] bg-[#0f1419] rounded-t-3xl shadow-2xl border border-white/[0.08] border-b-0 transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
      <div className="px-6 py-5 border-b border-white/[0.08] bg-[#1a2332]/50 flex items-center gap-3 rounded-t-3xl">
        <DollarSign className="w-5 h-5 text-emerald-400" />
        <span className="text-sm text-white font-semibold">Caixa Atual</span>
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {finStats.map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-5 border ${stat.borderColor}`}>
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
                <p className={`text-xs font-medium ${stat.textColor}`}>{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-400 font-medium">Movimentações Recentes</p>
          {recentTransactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between bg-[#1a2332]/60 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex gap-4 items-center">
                <div className={`w-8 h-8 rounded-lg flex justify-center items-center ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{t.desc}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.date}</p>
                </div>
              </div>
              <p className={`text-base font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgendaMockup() {
  return (
    <div className="absolute bottom-0 left-8 right-8 h-[72%] bg-[#0f1419] rounded-t-3xl shadow-2xl border border-white/[0.08] border-b-0 transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
      <div className="px-6 py-5 border-b border-white/[0.08] bg-[#1a2332]/50 flex items-center justify-between rounded-t-3xl">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-white font-semibold">Agenda Hoje, 08 Jan</span>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="text-xs font-medium text-emerald-400">3 confirmados</span>
        </div>
      </div>
      <div className="p-6 md:p-8">
        <div className="space-y-3">
          {todaySchedule.map((apt, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#1a2332]/60 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-16">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-white">{apt.time}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">{apt.client}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{apt.service}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-xs text-blue-400">{apt.professional}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${apt.statusColor}`}>{apt.statusLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CRMMockup() {
  return (
    <div className="absolute bottom-0 left-12 right-12 h-[72%] bg-[#0f1419] rounded-t-3xl shadow-2xl border border-white/[0.08] border-b-0 transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
      <div className="px-6 py-5 border-b border-white/[0.08] bg-[#1a2332]/50 flex items-center gap-3 rounded-t-3xl">
        <Users className="w-5 h-5 text-purple-400" />
        <span className="text-sm text-white font-semibold">Ficha do Cliente</span>
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-[#1a2332]/60 rounded-2xl p-6 border border-white/[0.06]">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{clientData.initial}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{clientData.name}</h3>
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg mt-2">
                <span className="text-xs font-medium text-purple-400">{clientData.status}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0f1419]/60 rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-xs text-gray-500 mb-2">Visitas</p>
              <p className="text-2xl font-bold text-white">{clientData.totalVisits}</p>
            </div>
            <div className="bg-[#0f1419]/60 rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-xs text-gray-500 mb-2">Total Gasto</p>
              <p className="text-2xl font-bold text-emerald-400">{clientData.totalSpent}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-[#0f1419]/40 rounded-xl border border-white/[0.04]">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Telefone</p>
                <p className="text-sm text-white font-medium">{clientData.phone}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-[#0f1419]/40 rounded-xl border border-white/[0.04]">
              <Heart className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Preferência</p>
                <p className="text-sm text-white font-medium">{clientData.preference}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- MAIN CAROUSEL ---

const cardsData = [
  { id: 'dashboard', color: 'bg-primary-50', title: 'Painel em Tempo Real', desc: 'Receita, agendamentos, estoque e alertas. Todo o pulso do seu salão em uma única tela.', Mockup: DashboardMockup },
  { id: 'whatsapp', color: 'bg-slate-100', title: 'Fim das Faltas', desc: 'Automação completa via WhatsApp para lembretes, aniversários e confirmações.', Mockup: WhatsAppMockup },
  { id: 'marketing', color: 'bg-primary-100', title: 'Marketing Inteligente', desc: 'Recupere clientes inativos e dispare promoções que geram dinheiro no caixa via WhatsApp.', Mockup: WhatsAppMarketingMockup },
  { id: 'financeiro', color: 'bg-slate-200', title: 'Controle Financeiro', desc: 'Comissões calculadas automaticamente, despesas mapeadas e lucro garantido.', Mockup: FinancialMockup },
  { id: 'agenda', color: 'bg-primary-50', title: 'Agenda Inteligente', desc: 'Visualize horários, encaixes e profissionais simultaneamente sem confusão.', Mockup: AgendaMockup },
  { id: 'crm', color: 'bg-[#fcfaf8]', title: 'Histórico de Clientes', desc: 'Saiba o que cada cliente prefere, quanto gastou e quando foi a última visita.', Mockup: CRMMockup },
]

export function HowItWorks() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const CARDS_COUNT = cardsData.length
  const DURATION_MS = 5000
  const TICK_MS = 50

  useEffect(() => {
    if (isHovered) return

    const tickAmount = (TICK_MS / DURATION_MS) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = (activeIndex + 1) % CARDS_COUNT
          scrollToIndex(nextIndex)
          return 0
        }
        return prev + tickAmount
      })
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [activeIndex, isHovered, CARDS_COUNT])

  const scrollToIndex = (index: number) => {
    setActiveIndex(index)
    setProgress(0)
    
    if (carouselRef.current) {
      const cardWidth = window.innerWidth > 768 ? 900 : window.innerWidth * 0.90
      const gap = 32 // 2rem (gap-8)
      carouselRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: 'smooth'
      })
    }
  }

  const handleScroll = () => {
    if (!carouselRef.current) return
    const scrollLeft = carouselRef.current.scrollLeft
    const cardWidth = window.innerWidth > 768 ? 932 : (window.innerWidth * 0.90) + 32
    const newIndex = Math.round(scrollLeft / cardWidth)
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < CARDS_COUNT) {
      setActiveIndex(newIndex)
      setProgress(0)
    }
  }

  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-3">O que tem no sistema</p>
            <h2 className="text-4xl lg:text-5xl font-display font-semibold text-slate-900 leading-[1.1] tracking-tight">
              Tudo que você precisa para crescer.
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <button 
              onClick={() => scrollToIndex((activeIndex - 1 + CARDS_COUNT) % CARDS_COUNT)}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => scrollToIndex((activeIndex + 1) % CARDS_COUNT)}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        <div 
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-8 px-6 md:px-12 lg:px-[10vw] pb-12 hide-scrollbar items-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cardsData.map((card, index) => (
            <div 
              key={card.id}
              className={`shrink-0 snap-center relative w-[90vw] md:w-[900px] h-[600px] md:h-[750px] ${card.color} rounded-[40px] overflow-hidden p-8 md:p-14 flex flex-col justify-between group transition-all duration-700 ease-out origin-center ${activeIndex === index ? 'scale-100 opacity-100' : 'scale-95 opacity-40'}`}
            >
              <div className="relative z-10 max-w-xl mb-12">
                <h3 className="text-2xl md:text-3xl font-display font-semibold text-slate-900 mb-4">{card.title}</h3>
                <p className="text-slate-800 text-lg md:text-xl font-medium leading-snug">
                  {card.desc}
                </p>
              </div>

              <div className="absolute top-0 left-0 w-full h-2 bg-black/10">
                {activeIndex === index && (
                  <div className="h-full bg-slate-900 transition-all ease-linear" style={{ width: `${progress}%` }} />
                )}
              </div>

              {/* MOCKUP INJECTED HERE */}
              <card.Mockup />

            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}