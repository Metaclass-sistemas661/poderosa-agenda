'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  CalendarCheck,
  Bell,
  MessageCircle,
  PiggyBank,
  UsersRound,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Solution Section
 *
 * Objetivo: Responder diretamente às dores do Epic 4.4 (Problem).
 * NÃO apresenta funcionalidades detalhadas — apresenta transformação.
 *
 * Psicologia: Esperança — "existe uma solução"
 * Posição: #5 (após Problem, antes de Features)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Solution blocks — each responds to a specific pain point from Problem section
const solutionBlocks = [
  {
    icon: CalendarCheck,
    title: 'Agenda sempre organizada',
    description: 'Todos os atendimentos em um único lugar, sem conflitos e sem esquecimentos.',
    painPoint: 'Agenda desorganizada',
  },
  {
    icon: Bell,
    title: 'Clientes que comparecem',
    description: 'Lembretes automáticos que reduzem faltas e protegem seu faturamento.',
    painPoint: 'Clientes que esquecem',
  },
  {
    icon: MessageCircle,
    title: 'Comunicação centralizada',
    description: 'Menos tempo no WhatsApp, mais tempo para atender quem está no salão.',
    painPoint: 'WhatsApp sem fim',
  },
  {
    icon: PiggyBank,
    title: 'Finanças sob controle',
    description: 'Saiba exatamente quanto entrou, quanto saiu e quanto sobrou.',
    painPoint: 'Caixa que não fecha',
  },
  {
    icon: UsersRound,
    title: 'Equipe conectada',
    description: 'Todos na mesma página, com acesso às informações que precisam.',
    painPoint: 'Equipe sem alinhamento',
  },
  {
    icon: LayoutGrid,
    title: 'Tudo em um só lugar',
    description: 'Chega de cadernos, planilhas e post-its. Uma plataforma para tudo.',
    painPoint: 'Informações espalhadas',
  },
]

// Before/After transformation items
const beforeItems = ['Rotina caótica', 'Retrabalho constante', 'Decisões no escuro']
const afterItems = ['Organização natural', 'Processos fluidos', 'Controle total']

export function Solution() {
  const shouldReduce = useReducedMotion()

  return (
    <section
      id="solucao"
      aria-labelledby="solution-heading"
      className="relative py-20 lg:py-28 overflow-hidden bg-[#09090b]"
    >
      {/* Gradient background — relief/hope tone */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#0c0c0e] via-[#09090b] to-[#09090b]"
      />

      {/* Atmospheric glow — violet for hope/solution */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="container-custom relative z-10">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          {/* Label */}
          <p className="text-sm font-semibold tracking-widest text-primary-400 uppercase mb-4">
            A transformação
          </p>

          {/* Headline */}
          <h2
            className="text-3xl lg:text-4xl font-display font-semibold text-white leading-tight mb-6"
          >
            Imagine um salão que{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
              funciona para você
            </span>
          </h2>

          <p className="text-lg lg:text-xl text-white/80 font-medium leading-relaxed">
            Uma rotina mais leve, clientes satisfeitos, equipe alinhada e tempo de sobra
            para fazer o que você mais ama: transformar vidas através da beleza.
          </p>
        </motion.div>

        {/* ── Solution Blocks Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {solutionBlocks.map((block, index) => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: shouldReduce ? 0.01 : 0.5,
                delay: shouldReduce ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative bg-white/[0.03] border border-secondary-500/[0.08] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-secondary-500/[0.05] hover:border-secondary-500/20 hover:shadow-xl hover:shadow-secondary-900/15"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-secondary-500/12 border border-secondary-500/20 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-secondary-500/20 group-hover:border-secondary-500/35 group-hover:shadow-md group-hover:shadow-secondary-500/10">
                <block.icon
                  aria-hidden="true"
                  className="w-5 h-5 text-secondary-400 transition-colors duration-300 group-hover:text-secondary-300"
                />
              </div>

              {/* Title — prominent */}
              <h3 className="text-white text-base font-bold font-display mb-2.5 tracking-tight">
                {block.title}
              </h3>

              {/* Description — subtle */}
              <p className="text-white/45 text-sm leading-relaxed">
                {block.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Before → After (Hero element) ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.6, delay: shouldReduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 lg:p-12 shadow-xl shadow-black/20">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-6 items-center">
              
              {/* Before */}
              <div className="text-center md:text-left">
                <p className="text-amber-500/60 text-xs font-semibold tracking-widest uppercase mb-5">
                  Antes
                </p>
                <ul className="space-y-3.5">
                  {beforeItems.map((item) => (
                    <li key={item} className="text-white/35 text-sm font-medium flex items-center gap-3 md:justify-start justify-center">
                      <span aria-hidden="true" className="w-2 h-2 rounded-full bg-amber-500/40 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow — prominent */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500/20 to-violet-500/20 border border-secondary-500/25 flex items-center justify-center shadow-lg shadow-secondary-900/20">
                  <ArrowRight
                    aria-hidden="true"
                    className="w-5 h-5 text-secondary-400 rotate-90 md:rotate-0"
                  />
                </div>
              </div>

              {/* After */}
              <div className="text-center md:text-right">
                <p className="text-emerald-400/70 text-xs font-semibold tracking-widest uppercase mb-5">
                  Depois
                </p>
                <ul className="space-y-3.5">
                  {afterItems.map((item) => (
                    <li key={item} className="text-white/80 text-sm font-medium flex items-center gap-3 md:justify-end justify-center">
                      {item}
                      <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Closing — bridge to Features ───────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: shouldReduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.5, delay: shouldReduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-white/45 text-sm mt-12 max-w-xl mx-auto"
        >
          Conheça as ferramentas que tornam essa transformação possível.
        </motion.p>

      </div>

      {/* Bottom separator */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      />
    </section>
  )
}