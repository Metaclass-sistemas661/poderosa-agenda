'use client'

import { useRef, useMemo } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  Users,
  Star,
  Phone,
  Calendar,
  Heart,
  ClipboardList,
  UserCheck,
  FolderOpen,
  Sparkles
} from 'lucide-react'

interface CRMShowcaseProps {
  id?: string
}

export function CRMShowcase({ id = 'crm-showcase' }: CRMShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = isInView && !prefersReducedMotion

  const highlights = useMemo(() => [
    {
      icon: ClipboardList,
      title: 'Histórico completo',
      description: 'Saiba exatamente quando e como cada cliente foi atendido.'
    },
    {
      icon: Heart,
      title: 'Preferências',
      description: 'Guarde informações importantes para personalizar o atendimento.'
    },
    {
      icon: UserCheck,
      title: 'Fidelização',
      description: 'Acompanhe frequência e fortaleça o relacionamento.'
    },
    {
      icon: FolderOpen,
      title: 'Organização',
      description: 'Todos os dados do cliente centralizados em uma única ficha.'
    }
  ], [])

  const clientData = useMemo(() => ({
    name: 'Maria Oliveira',
    initial: 'M',
    isVip: true,
    phone: '(11) 98765-4321',
    birthday: '18 de Março',
    lastVisit: '05 Jan',
    preference: 'Coloração + Escova',
    professional: 'Fernanda',
    nextAppointment: '12 Jan',
    totalVisits: 24,
    totalSpent: 'R$ 3.840',
    status: 'Cliente recorrente',
    notes: 'Prefere produtos sem sulfato. Alergia a amônia.',
    clientSince: 'Mar 2024'
  }), [])

  const miniClients = useMemo(() => [
    { name: 'Ana Souza', initial: 'A', visits: 18, isVip: true },
    { name: 'Juliana Costa', initial: 'J', visits: 12, isVip: false },
    { name: 'Paula Mendes', initial: 'P', visits: 9, isVip: false }
  ], [])

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 overflow-hidden"
      aria-labelledby={`${id}-heading`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030B14] via-[#0a1525] to-[#030B14]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_70%)]" aria-hidden="true" />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <span className="text-sm font-medium text-primary-400">CRM Inteligente</span>
          </motion.div>

          <motion.h2
            id={`${id}-heading`}
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Conheça melhor cada cliente e fortaleça o relacionamento
          </motion.h2>

          <motion.p
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="text-lg leading-relaxed text-gray-400"
          >
            Histórico de atendimentos, preferências, aniversários, observações e informações importantes organizadas em um único lugar.
          </motion.p>
        </motion.div>

        {/* Content Grid - CRM LEFT, Highlights RIGHT */}
        <div className="grid lg:grid-cols-[7fr_5fr] gap-8 lg:gap-16 items-start">
          {/* CRM Showcase - Left */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
            <div
              className="relative bg-[#0f1419]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.08), 0 20px 60px -15px rgba(139, 92, 246, 0.27), 0 0 100px -20px rgba(139, 92, 246, 0.18)'
              }}
            >
              {/* Floating Glow */}
              <div className="absolute inset-0 opacity-[0.36] pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
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
                  <Users className="w-3.5 h-3.5" />
                  <span>Clientes</span>
                </div>
                <div className="w-20" />
              </div>

              {/* CRM Content */}
              <div className="relative p-6 space-y-5">
                {/* Client Card - Main */}
                <motion.div
                  initial={false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.4, delay: 0.44 }}
                  className="bg-[#1a2332]/60 rounded-xl p-5 border border-white/[0.06]"
                  style={{ willChange: 'transform' }}
                >
                  {/* Client Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">{clientData.initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{clientData.name}</h3>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" aria-label="Cliente VIP" />
                      </div>
                      <p className="text-sm text-gray-400">Cliente desde {clientData.clientSince}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <span className="text-[11px] font-medium text-primary-400">{clientData.status}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0f1419]/60 rounded-lg p-3 text-center border border-white/[0.04]">
                      <p className="text-[11px] text-gray-500 mb-1">Visitas</p>
                      <p className="text-xl font-bold text-white">{clientData.totalVisits}</p>
                    </div>
                    <div className="bg-[#0f1419]/60 rounded-lg p-3 text-center border border-white/[0.04]">
                      <p className="text-[11px] text-gray-500 mb-1">Total Gasto</p>
                      <p className="text-lg font-bold text-emerald-400">{clientData.totalSpent}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0f1419]/40 rounded-lg border border-white/[0.04]">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">Telefone</p>
                        <p className="text-[13px] text-white">{clientData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0f1419]/40 rounded-lg border border-white/[0.04]">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">Aniversário</p>
                        <p className="text-[13px] text-white">{clientData.birthday}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0f1419]/40 rounded-lg border border-white/[0.04]">
                      <Heart className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">Preferência</p>
                        <p className="text-[13px] text-white">{clientData.preference}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-3 px-3 py-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                    <p className="text-[11px] text-amber-400/70 mb-1">Observações</p>
                    <p className="text-[12px] text-gray-300 leading-relaxed">{clientData.notes}</p>
                  </div>
                </motion.div>

                {/* Mini Client List */}
                <motion.div
                  initial={false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: 0.56 }}
                  className="space-y-2"
                  style={{ willChange: 'transform' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white">Outros Clientes</h4>
                    <span className="text-[11px] text-gray-500 font-medium">+142 cadastrados</span>
                  </div>
                  {miniClients.map((client, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                      transition={{ duration: 0.3, delay: 0.64 + (index * 0.06) }}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a2332]/40 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      style={{ willChange: 'transform' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500/80 to-primary-600/80 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{client.initial}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] text-white font-medium">{client.name}</p>
                            {client.isVip && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-[11px] text-gray-500">{client.visits} visitas</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Footnote */}
              <motion.div
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.3, delay: 0.88 }}
                className="px-6 pb-5 pt-1"
              >
                <p className="text-[8px] text-white/25 text-center tracking-wide leading-4 font-medium uppercase">
                  Interface real • Sistema em produção
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Highlights - Right */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2 space-y-4"
          >
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.4, delay: 0.48 + (index * 0.08) }}
                className="group relative bg-[#0f1419]/60 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] hover:border-primary-500/30 transition-all duration-300"
                style={{ willChange: 'transform' }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/20 flex items-center justify-center">
                    <highlight.icon className="w-7 h-7 text-primary-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5">{highlight.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{highlight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}