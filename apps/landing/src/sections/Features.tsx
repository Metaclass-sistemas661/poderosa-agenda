'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  MessageSquare,
  Smartphone,
  Shield,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Feature Overview Section
 *
 * Objetivo: Apresentar uma visão geral da plataforma — "Veja tudo que existe
 * dentro da Poderosa Agenda."
 *
 * NÃO aprofunda módulos. NÃO explica funcionalidades em detalhe.
 * Apenas desperta curiosidade mostrando amplitude.
 *
 * Psicologia: Fascínio — "isso tem tudo que eu preciso"
 * Posição: #6 (após Solution, antes dos showcases dedicados)
 *
 * v1.1 — RFC-001 Premium Polish Applied
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Feature cards — brief, curiosity-driven. Do NOT explain modules deeply.
const featureCards = [
  {
    icon: Calendar,
    title: 'Agendamento inteligente',
    description: 'Seus clientes marcam horários 24h, sem depender de você.',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Histórico completo e preferências de cada cliente reunidos.',
  },
  {
    icon: CreditCard,
    title: 'Controle financeiro',
    description: 'Receitas, despesas e comissões organizados automaticamente.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em tempo real',
    description: 'Métricas do seu negócio atualizadas a cada momento.',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Menos faltas com avisos que chegam na hora certa.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp integrado',
    description: 'Comunicação profissional direto pelo canal que seus clientes usam.',
  },
]

// Feature grid items — secondary benefits, no overlap with cards above
const gridFeatures = [
  { icon: Smartphone, title: 'Mobile first', description: 'Funciona perfeitamente no celular' },
  { icon: Shield, title: 'Dados protegidos', description: 'Segurança de nível bancário' },
  { icon: Zap, title: 'Rápido e leve', description: 'Carrega em menos de 2 segundos' },
  { icon: Clock, title: 'Disponível 24h', description: 'Sempre online quando você precisar' },
  { icon: TrendingUp, title: 'Relatórios claros', description: 'Decisões baseadas em dados reais' },
]

export function Features() {
  const shouldReduce = useReducedMotion()

  return (
    <section
      id="funcionalidades"
      aria-labelledby="features-heading"
      className="relative py-24 lg:py-32 overflow-hidden bg-slate-50"
    >
      {/* Background — Clean light mode with very subtle accents */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white"
      />

      <div className="container-custom relative z-10">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary-500 mb-3">
            Funcionalidades
          </p>
          <h2
            className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 leading-tight mb-6"
          >
            Sua gestão completa,{' '}
            <span className="text-primary-500">
              simplificada
            </span>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Agendamento, finanças, clientes e comunicação reunidos em uma única
            plataforma feita para o seu salão crescer.
          </motion.p>
        </motion.div>

        {/* ── Main Content: Cards + Smartphone ────────────────────────────── */}
        <div className="relative mb-16 lg:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">

            {/* Left Feature Cards */}
            <div className="space-y-6 order-2 lg:order-1">
              {featureCards.slice(0, 3).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="group flex gap-5 items-start lg:flex-row-reverse lg:text-right bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-primary-100 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-900 text-base font-semibold font-display mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Center Smartphone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center order-1 lg:order-2"
            >
              <div className="relative">
                {/* Phone Frame - Light Mode */}
                <div className="relative w-[305px] md:w-[328px] h-[590px] md:h-[632px] bg-white rounded-[3.2rem] p-[8px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] ring-1 ring-slate-200">
                  <div className="w-full h-full bg-slate-50 rounded-[2.8rem] overflow-hidden border border-slate-100">
                    {/* Status Bar */}
                    <div className="h-8 flex items-center justify-center pt-2">
                      <div className="w-24 h-5 bg-slate-200 rounded-full" />
                    </div>
                    {/* Screen Content */}
                    <div className="p-5 space-y-4">
                      {/* App Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Poderosa Agenda</p>
                          <p className="text-[11px] text-slate-500">Seu salão no controle</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                          <p className="text-lg font-bold text-primary-500">24</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Agendamentos</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                          <p className="text-lg font-bold text-emerald-500">R$ 2.4K</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Faturamento</p>
                        </div>
                      </div>

                      {/* Appointment Items */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 bg-white border border-slate-100 shadow-sm rounded-xl p-3">
                          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-500 text-xs font-bold">M</div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">Maria Silva</p>
                            <p className="text-[11px] text-slate-500">14:00 — Corte</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-slate-100 shadow-sm rounded-xl p-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-xs font-bold">A</div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">Ana Costa</p>
                            <p className="text-[11px] text-slate-500">15:30 — Manicure</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Element — Left */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="absolute -left-8 md:-left-16 top-32 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 hidden md:flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 text-sm font-bold">✓</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">Novo agendamento</span>
                </motion.div>

                {/* Floating Element — Right */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="absolute -right-8 md:-right-16 bottom-32 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 hidden md:flex items-center gap-3"
                >
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-500">+32%</p>
                    <p className="text-[11px] text-slate-500">crescimento</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Feature Cards */}
            <div className="space-y-6 order-3">
              {featureCards.slice(3, 6).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="group flex gap-5 items-start bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-primary-100 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-900 text-base font-semibold font-display mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {gridFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                className="group"
              >
                <div className="h-full bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm hover:border-primary-200 hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-2">{feature.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}