'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Rocket, Lock, Zap, Target } from 'lucide-react'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Future Metrics
 *
 * Quando a plataforma possuir dados reais,
 * estes cards poderão ser substituídos
 * por métricas vindas do backend.
 *
 * Exemplos:
 * - Salões ativos
 * - Agendamentos realizados
 * - Clientes cadastrados
 * - Receita processada
 *
 * Não alterar layout nem animações.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const trustCards = [
  {
    icon: Rocket,
    title: 'Tecnologia moderna',
    description: 'Construído com arquitetura escalável e as melhores práticas do mercado.',
  },
  {
    icon: Lock,
    title: 'Segurança',
    description: 'Proteção de dados com criptografia SSL e conformidade com a LGPD.',
  },
  {
    icon: Zap,
    title: 'Gestão simplificada',
    description: 'Tudo o que você precisa em um só lugar, sem burocracia e sem complicação.',
  },
  {
    icon: Target,
    title: 'Foco no salão',
    description: 'Desenvolvido especificamente para a gestão de salões de beleza.',
  },
]

export function TrustBadges() {
  const shouldReduce = useReducedMotion()

  return (
    <section
      id="prova-social"
      aria-labelledby="social-proof-heading"
      className="relative py-12 lg:py-16 overflow-hidden bg-[#09090b]"
    >
      {/* Top border separator from Hero */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />

      {/* Subtle atmospheric glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] bg-secondary-600/8 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="container-custom relative z-10">

        {/* ── Section label ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduce ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <p
            id="social-proof-heading"
            className="text-white/35 text-sm font-medium tracking-widest uppercase"
          >
            Tecnologia criada para quem vive da beleza
          </p>
        </motion.div>

        {/* ── Trust cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {trustCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: shouldReduce ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: shouldReduce ? 0.01 : 0.5,
                delay: shouldReduce ? 0 : index * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
          className="group bg-[#09090b] px-6 py-8 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.015] hover:border-white/[0.10] hover:shadow-lg hover:shadow-black/20"
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-secondary-500/12 border border-secondary-500/20 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-secondary-500/18 group-hover:border-secondary-500/30 group-hover:shadow-sm group-hover:shadow-secondary-500/15">
            <card.icon
              aria-hidden="true"
              className="w-[22px] h-[22px] text-secondary-400 transition-colors duration-300 group-hover:text-secondary-300"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-white/90 text-sm font-semibold leading-snug font-display">
              {card.title}
            </h3>
            <p className="text-white/55 text-sm leading-relaxed">
              {card.description}
            </p>
          </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Bottom separator to next section */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      />
    </section>
  )
}