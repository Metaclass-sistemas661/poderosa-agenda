'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Phone,
  ArrowUpRight,
  Gift,
  Package,
  Scissors,
  BarChart3,
  Activity,
} from 'lucide-react'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard Showcase Section — RFC-001 Final Luxury Polish
 *
 * Objetivo: Demonstrar o Dashboard REAL da Poderosa Agenda.
 * O visitante precisa pensar: "Esse sistema realmente parece profissional."
 *
 * Baseado fielmente em: apps/landing/src/app/salon/dashboard/page.tsx
 *
 * NÃO é um mockup fictício. É uma reprodução estática do UI real com dados
 * representativos. Estrutura idêntica: KPIs, Agenda, Alertas, Quick Actions.
 *
 * RFC-001: Final luxury polish with precision refinements (v1.1)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Representative data — mirrors real dashboard structure exactly
const kpiCards = [
  {
    title: 'Receita de Hoje',
    value: 'R$ 1.240',
    change: '+18%',
    changeLabel: 'vs mês anterior',
    positive: true,
    icon: DollarSign,
    highlight: true,
    color: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
  },
  {
    title: 'Agendamentos Hoje',
    value: '12',
    change: '+3',
    changeLabel: 'média semanal',
    positive: true,
    icon: Calendar,
    highlight: false,
    color: 'from-blue-500 to-cyan-600',
    shadowColor: '',
  },
  {
    title: 'Receita do Mês',
    value: 'R$ 18.400',
    change: '+22%',
    changeLabel: 'vs mês anterior',
    positive: true,
    icon: TrendingUp,
    highlight: false,
    color: 'from-secondary-500 to-violet-600',
    shadowColor: '',
  },
  {
    title: 'Taxa de Ocupação',
    value: '84%',
    change: 'Meta atingida',
    changeLabel: 'meta 80%',
    positive: true,
    icon: Users,
    highlight: false,
    color: 'from-amber-500 to-orange-600',
    shadowColor: '',
  },
]

const todaySchedule = [
  { time: '09:00', client: 'Maria Silva', service: 'Corte + Escova', professional: 'Ana Lima', status: 'confirmed' },
  { time: '10:30', client: 'Juliana Costa', service: 'Coloração', professional: 'Bia Santos', status: 'in_progress' },
  { time: '11:00', client: 'Fernanda Nunes', service: 'Manicure', professional: 'Carol R.', status: 'confirmed' },
  { time: '14:00', client: 'Patrícia Alves', service: 'Hidratação', professional: 'Ana Lima', status: 'scheduled' },
  { time: '15:30', client: 'Renata Melo', service: 'Corte', professional: 'Bia Santos', status: 'scheduled' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/20 text-emerald-400' },
  in_progress: { label: 'Em andamento', color: 'bg-amber-500/20 text-amber-400' },
  scheduled: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Concluído', color: 'bg-white/10 text-white/40' },
}

const alerts = [
  { type: 'birthday', icon: Gift, color: 'bg-pink-500/20 text-pink-400', title: 'Aniversariantes hoje', desc: '2 clientes fazem aniversário hoje' },
  { type: 'pending', icon: Clock, color: 'bg-amber-500/20 text-amber-400', title: 'Agendamentos pendentes', desc: '5 aguardando confirmação' },
  { type: 'low_stock', icon: Package, color: 'bg-red-500/20 text-red-400', title: 'Estoque baixo', desc: '3 produtos abaixo do mínimo' },
]

const quickActions = [
  { label: 'Novo Agendamento', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { label: 'Novo Cliente', icon: Users, color: 'from-secondary-500 to-violet-600' },
  { label: 'Registrar Venda', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { label: 'Ver Relatórios', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
]

// Landing-level highlights that point to dashboard areas
const highlights = [
  {
    icon: Activity,
    label: 'Tempo real',
    description: 'Dados atualizados automaticamente',
  },
  {
    icon: Calendar,
    label: 'Agenda do dia',
    description: 'Todos os agendamentos em um só lugar',
  },
  {
    icon: DollarSign,
    label: 'Receita',
    description: 'Faturamento diário e mensal com comparativos',
  },
  {
    icon: BarChart3,
    label: 'Indicadores',
    description: 'Taxa de ocupação e metas de desempenho',
  },
]

export function DashboardShowcase() {
  const shouldReduce = useReducedMotion()

  return (
    <section
      id="dashboard"
      aria-labelledby="dashboard-heading"
      className="relative py-20 lg:py-28 overflow-hidden bg-[#07070a]"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#09090c] via-[#07070a] to-[#09090b]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-secondary-500/[0.04] rounded-full blur-[150px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.025] rounded-full blur-[130px] pointer-events-none"
      />

      <div className="container-custom relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-14 lg:mb-16"
        >
          <p className="text-sm font-semibold tracking-widest text-primary-400 uppercase mb-4">
            Dashboard
          </p>
          <h2
            className="text-3xl lg:text-4xl font-display font-semibold text-white leading-tight mb-5"
          >
            Controle total do seu salão{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
              em tempo real
            </span>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg lg:text-xl text-white/80 font-medium leading-relaxed"
          >
            Agendamentos, receita, clientes e indicadores. Tudo atualizado automaticamente.
          </motion.p>
        </motion.div>

        {/* Main layout: Dashboard + Highlights — RFC-001: Precise spacing */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 xl:gap-8 items-start">

          {/* Dashboard Mockup — RFC-001: ~5% visual presence increase, enhanced depth */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduce ? 0 : 30, scale: shouldReduce ? 1 : 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1.05 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduce ? 0.01 : 0.7, delay: shouldReduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 xl:order-1"
          >
            <div className="relative">
              {/* RFC-001: Multi-layer glow for floating effect */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -m-8 bg-secondary-500/[0.06] rounded-[3rem] blur-[80px] pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -m-4 bg-emerald-500/[0.05] rounded-[2rem] blur-[50px] pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -m-2 bg-white/[0.02] rounded-[1.5rem] blur-[30px] pointer-events-none"
              />

              {/* Dashboard container — RFC-001: Enhanced depth & separation */}
              <div className="relative bg-[#0f1117] border border-white/[0.1] rounded-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7),0_30px_60px_-30px_rgba(139,92,246,0.15),0_0_0_1px_rgba(255,255,255,0.06)] will-change-transform">

                {/* RFC-001: Refined browser chrome with desktop app feel */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.08] bg-gradient-to-b from-[#0d0e13] to-[#0c0d12]">
                  <div aria-hidden="true" className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_4px_rgba(255,95,87,0.5)]" />
                  <div aria-hidden="true" className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_4px_rgba(254,188,46,0.5)]" />
                  <div aria-hidden="true" className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_4px_rgba(40,200,64,0.5)]" />
                  <div className="flex-1 mx-4 h-6 bg-white/[0.04] border border-white/[0.06] rounded-lg backdrop-blur-sm flex items-center px-3 gap-2" aria-hidden="true">
                    <svg className="w-3 h-3 text-emerald-400/60" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/30 text-[11px] font-mono">app.poderosaagenda.com.br</span>
                  </div>
                </div>

                {/* Dashboard inner */}
                <div className="p-4 lg:p-6 space-y-4 bg-[#0f1117]" aria-label="Dashboard preview">

                  {/* Dashboard header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Dashboard</h3>
                      <p className="text-white/40 text-xs">Visão geral do seu salão</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg hover:bg-white/[0.06] transition-colors">
                      <Scissors aria-hidden="true" className="w-3 h-3 text-white/40" />
                      <span className="text-white/50 text-xs font-medium">Atualizar</span>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {kpiCards.map((kpi) => (
                      <div
                        key={kpi.title}
                        className={`bg-[#161b26] rounded-xl p-3.5 border transition-all ${
                          kpi.highlight
                            ? 'border-emerald-500/40 ring-2 ring-emerald-500/15 shadow-lg shadow-emerald-500/10'
                            : 'border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <p className="text-white/45 text-[10px] font-medium truncate">{kpi.title}</p>
                              {kpi.highlight && (
                                <div aria-hidden="true" className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <p className="text-white font-bold text-sm">{kpi.value}</p>
                            <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${kpi.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                              <ArrowUpRight aria-hidden="true" className="w-3 h-3" />
                              <span>{kpi.change}</span>
                            </div>
                          </div>
                          <div className={`w-8 h-8 bg-gradient-to-br ${kpi.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${kpi.shadowColor || ''}`}>
                            <kpi.icon aria-hidden="true" className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main grid: Agenda + Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Agenda do Dia */}
                    <div className="lg:col-span-2 bg-[#161b26] rounded-xl p-4 border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white text-sm font-bold">Agenda de Hoje</h4>
                        <span className="text-white/35 text-[10px] font-medium">segunda-feira, 8 de junho</span>
                      </div>
                      <div className="space-y-2">
                        {todaySchedule.slice(0, 4).map((apt) => {
                          const status = statusConfig[apt.status] || statusConfig.scheduled
                          return (
                            <div
                              key={apt.time + apt.client}
                              className="flex items-center gap-3 p-2.5 bg-white/[0.04] rounded-lg hover:bg-white/[0.06] transition-colors"
                            >
                              <div className="min-w-[44px] text-center">
                                <p className="text-white font-bold text-xs">{apt.time}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{apt.client}</p>
                                <p className="text-white/40 text-[10px] truncate">{apt.service}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                                <div className="w-5 h-5 flex items-center justify-center text-white/25 hover:text-emerald-400 transition-colors cursor-pointer">
                                  <Phone aria-hidden="true" className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Alertas */}
                    <div className="bg-[#161b26] rounded-xl p-4 border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white text-sm font-bold">Alertas</h4>
                        <span className="w-5 h-5 bg-red-500/25 text-red-400 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shadow-red-500/20">
                          {alerts.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {alerts.map((alert) => (
                          <div
                            key={alert.type}
                            className="flex items-start gap-2.5 p-2.5 bg-white/[0.04] rounded-lg hover:bg-white/[0.06] transition-colors"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.color}`}>
                              <alert.icon aria-hidden="true" className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[11px] font-medium">{alert.title}</p>
                              <p className="text-white/40 text-[10px] mt-0.5">{alert.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action) => (
                      <div
                        key={action.label}
                        className="flex flex-col items-center gap-1.5 p-2.5 bg-[#161b26] border border-white/[0.06] rounded-xl hover:border-white/[0.12] hover:bg-white/[0.04] transition-all cursor-pointer group"
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-md`}>
                          <action.icon aria-hidden="true" className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/50 text-[9px] text-center leading-tight font-medium group-hover:text-white/70 transition-colors">{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RFC-001: Refined highlights with reduced padding, consistent alignment */}
          <div className="order-1 xl:order-2 space-y-3">
            {highlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: shouldReduce ? 0.01 : 0.5,
                  delay: shouldReduce ? 0 : 0.4 + index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative flex gap-3.5 items-start p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl transition-all duration-300 hover:bg-secondary-500/[0.05] hover:border-secondary-500/25 hover:shadow-md hover:shadow-secondary-500/5 hover:-translate-y-0.5"
              >
                {/* RFC-001: Consistent icon sizing and alignment */}
                <div className="relative w-9 h-9 rounded-lg bg-secondary-500/15 border border-secondary-500/25 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-secondary-500/25 group-hover:border-secondary-400/35 group-hover:shadow-md group-hover:shadow-secondary-500/15">
                  <item.icon aria-hidden="true" className="w-[18px] h-[18px] text-secondary-400" />
                </div>
                {/* RFC-001: Precise typography alignment */}
                <div className="flex-1 pt-0.5">
                  <p className="text-white text-sm font-bold mb-1 leading-tight transition-colors duration-300 group-hover:text-white">{item.label}</p>
                  <p className="text-white/50 text-xs leading-relaxed transition-colors duration-300 group-hover:text-white/65">{item.description}</p>
                </div>
              </motion.div>
            ))}

            {/* RFC-001: Technical footnote styling */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduce ? 0.01 : 0.5, delay: shouldReduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/25 text-[9px] leading-[1.4] pt-4 px-1 mt-1 border-t border-white/[0.05]"
            >
              Interface demonstrativa com dados representativos. Os números exibidos em tempo real são os do seu próprio salão.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}