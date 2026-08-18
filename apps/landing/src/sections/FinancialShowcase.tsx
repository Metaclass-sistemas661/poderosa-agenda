'use client'

import { useRef, useMemo } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  BarChart3,
  PieChart,
  Sparkles
} from 'lucide-react'

interface FinancialShowcaseProps {
  id?: string
}

export function FinancialShowcase({ id = 'financial-showcase' }: FinancialShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = isInView && !prefersReducedMotion

  // Memoized data to prevent re-renders
  const stats = useMemo(() => [
    {
      icon: ArrowUpRight,
      label: 'Receitas',
      value: 'R$ 18.400',
      bgColor: 'from-emerald-500/20 to-emerald-600/10',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-400'
    },
    {
      icon: ArrowDownRight,
      label: 'Despesas',
      value: 'R$ 6.820',
      bgColor: 'from-red-500/20 to-red-600/10',
      borderColor: 'border-red-500/20',
      iconBg: 'bg-red-500/20',
      textColor: 'text-red-400'
    },
    {
      icon: Wallet,
      label: 'Saldo',
      value: 'R$ 11.580',
      bgColor: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/20',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-400'
    },
    {
      icon: Receipt,
      label: 'Transações',
      value: '127',
      bgColor: '',
      borderColor: 'border-white/[0.06]',
      iconBg: 'bg-white/5',
      textColor: 'text-gray-400'
    }
  ], [])

  const highlights = useMemo(() => [
    {
      icon: BarChart3,
      title: 'Fluxo de Caixa',
      description: 'Acompanhe entradas e saídas diariamente.'
    },
    {
      icon: DollarSign,
      title: 'Comissões',
      description: 'Controle automaticamente o valor de cada profissional.'
    },
    {
      icon: PieChart,
      title: 'Relatórios',
      description: 'Visualize resultados por período.'
    },
    {
      icon: TrendingUp,
      title: 'Decisões',
      description: 'Tenha indicadores para administrar melhor seu negócio.'
    }
  ], [])

  const recentTransactions = useMemo(() => [
    { type: 'income', desc: 'Corte Feminino', value: '+ R$ 85,00', date: '08 Jan' },
    { type: 'income', desc: 'Coloração', value: '+ R$ 180,00', date: '08 Jan' },
    { type: 'expense', desc: 'Fornecedores', value: '- R$ 420,00', date: '07 Jan' },
    { type: 'income', desc: 'Manicure', value: '+ R$ 45,00', date: '07 Jan' }
  ], [])

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 overflow-hidden"
      aria-labelledby={`${id}-heading`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030B14] via-[#0a1525] to-[#030B14]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center mb-16 lg:mb-20"
        >
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="text-sm font-medium text-emerald-400">Controle Financeiro</span>
          </motion.div>

          {/* MELHORIA 4: Headline refinada — mais curta, mais forte */}
          <motion.h2
            id={`${id}-heading`}
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Controle financeiro completo para o seu salão
          </motion.h2>

          <motion.p
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="text-lg leading-relaxed text-gray-400"
          >
            Acompanhe receitas, despesas, fluxo de caixa, comissões e indicadores financeiros em tempo real, tudo em um único painel.
          </motion.p>
        </motion.div>

        {/* Content Grid - INVERTED LAYOUT */}
        {/* MELHORIA 1: Showcase protagonista (5fr / 7fr ≈ 42%/58% → closer to 36%/64%) */}
        {/* MELHORIA 3: Increased gap (+16px → lg:gap-16) */}
        <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-16 items-start">
          {/* Highlights - Left Side on Desktop (INVERTED) */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 space-y-4"
          >
            {/* MELHORIA 5: Icons 10% larger, better alignment, refined spacing */}
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.4, delay: 0.4 + (index * 0.08) }}
                className="group relative bg-[#0f1419]/60 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300"
                style={{ willChange: 'transform' }}
              >
                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                
                <div className="relative flex items-center gap-4">
                  {/* MELHORIA 5: Icon container 10% larger (w-12→w-[52px]), icon w-6→w-7 */}
                  <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/20 flex items-center justify-center">
                    <highlight.icon className="w-7 h-7 text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5">{highlight.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{highlight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Financial Showcase - Right Side on Desktop (INVERTED) */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="order-2"
          >
            {/* Financial Card */}
            {/* MELHORIA 2: Glow reduced ~10% (0.3→0.27, 0.2→0.18) */}
            <div
              className="relative bg-[#0f1419]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{
                boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.08), 0 20px 60px -15px rgba(16, 185, 129, 0.27), 0 0 100px -20px rgba(16, 185, 129, 0.18)'
              }}
            >
              {/* MELHORIA 2: Floating Glow reduced 10% (opacity-40→opacity-36) */}
              <div className="absolute inset-0 opacity-[0.36] pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]" />
              </div>

              {/* macOS-style Chrome */}
              <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1a2332]/50">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Financeiro</span>
                </div>
                <div className="w-20" />
              </div>

              {/* Financial Content */}
              <div className="relative p-6 space-y-5">
                {/* Period Header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Este Mês</h3>
                    <p className="text-sm text-gray-400">Janeiro 2026</p>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-xs font-medium text-emerald-400">Saldo Positivo</span>
                  </div>
                </div>

                {/* MELHORIA 6: Stats Grid — pixel perfect, uniform padding/height */}
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      transition={{ duration: 0.3, delay: 0.56 + (index * 0.06) }}
                      className={`relative bg-gradient-to-br ${stat.bgColor || 'from-[#1a2332]/60 to-[#1a2332]/40'} backdrop-blur-sm rounded-xl p-4 border ${stat.borderColor} min-h-[100px] flex flex-col justify-between`}
                      style={{ willChange: 'transform' }}
                    >
                      <div className="flex items-center gap-2.5 mb-auto">
                        <div className={`w-8 h-8 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                          <stat.icon className={`w-4 h-4 ${stat.textColor}`} aria-hidden="true" />
                        </div>
                        <span className={`text-xs font-medium ${stat.textColor}`}>{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold text-white mt-3">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* MELHORIA 7: Recent Transactions — refined spacing, contrast, alignment */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Movimentações Recentes</h4>
                    <span className="text-[11px] text-gray-500 font-medium">Últimas 4</span>
                  </div>
                  <div className="space-y-2.5">
                    {recentTransactions.map((trans, index) => (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: 0.72 + (index * 0.06) }}
                        className="flex items-center justify-between px-3.5 py-3 bg-[#1a2332]/40 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                        style={{ willChange: 'transform' }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            trans.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          }`}>
                            {trans.type === 'income' ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-white font-medium truncate">{trans.desc}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{trans.date}</p>
                          </div>
                        </div>
                        <span className={`text-[13px] font-semibold tabular-nums ml-4 ${
                          trans.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {trans.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MELHORIA 8: Technical Footnote — refined typography */}
              <motion.div
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.3, delay: 0.96 }}
                className="px-6 pb-5 pt-1"
              >
                <p className="text-[8px] text-white/25 text-center tracking-wide leading-4 font-medium uppercase">
                  Interface real • Sistema em produção
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}