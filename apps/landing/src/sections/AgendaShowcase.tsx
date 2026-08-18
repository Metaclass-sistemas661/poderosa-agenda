'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Play,
  Sparkles
} from 'lucide-react'

interface AgendaShowcaseProps {
  id?: string
}

export function AgendaShowcase({ id = 'agenda-showcase' }: AgendaShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = isInView && !prefersReducedMotion

  // Realistic appointments data
  const appointments = [
    {
      time: '09:00',
      client: 'Ana Souza',
      service: 'Corte Feminino',
      professional: 'Juliana',
      status: 'confirmed',
      statusLabel: 'Confirmado',
      statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      time: '10:30',
      client: 'Mariana Lima',
      service: 'Coloração',
      professional: 'Carla',
      status: 'scheduled',
      statusLabel: 'Agendado',
      statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      time: '11:15',
      client: 'Juliana Costa',
      service: 'Escova',
      professional: 'Juliana',
      status: 'confirmed',
      statusLabel: 'Confirmado',
      statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      time: '14:00',
      client: 'Fernanda Alves',
      service: 'Manicure',
      professional: 'Paula',
      status: 'in_progress',
      statusLabel: 'Em andamento',
      statusColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      time: '15:30',
      client: 'Paula Mendes',
      service: 'Design de Sobrancelhas',
      professional: 'Carla',
      status: 'scheduled',
      statusLabel: 'Agendado',
      statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  ]

  const highlights = [
    {
      icon: Calendar,
      title: 'Organização',
      description: 'Todos os horários em um único lugar.'
    },
    {
      icon: CheckCircle,
      title: 'Confirmações',
      description: 'Veja quem confirmou antes do atendimento.'
    },
    {
      icon: User,
      title: 'Equipe',
      description: 'Controle profissionais simultaneamente.'
    },
    {
      icon: Clock,
      title: 'Disponibilidade',
      description: 'Visualize horários livres rapidamente.'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle
      case 'scheduled':
        return Clock
      case 'in_progress':
        return Play
      default:
        return AlertCircle
    }
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 overflow-hidden"
      aria-labelledby={`${id}-heading`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030B14] via-[#0a1525] to-[#030B14]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" aria-hidden="true" />

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
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <span className="text-sm font-medium text-primary-400">Agenda Inteligente</span>
          </motion.div>

          <motion.h2
            id={`${id}-heading`}
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Sua agenda organizada do primeiro ao último atendimento
          </motion.h2>

          <motion.p
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg leading-relaxed text-gray-400"
          >
            Visualize os horários do dia, acompanhe confirmações, encaixes, profissionais e disponibilidade em uma única tela.
          </motion.p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Agenda Showcase - Left Side on Desktop */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
            {/* Agenda Card */}
            <div
              className="relative bg-[#0f1419]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.1), 0 20px 60px -15px rgba(139, 92, 246, 0.3), 0 0 100px -20px rgba(139, 92, 246, 0.2)'
              }}
            >
              {/* Floating Glow Effect */}
              <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
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
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendamentos</span>
                </div>
                <div className="w-20" /> {/* Spacer for balance */}
              </div>

              {/* Agenda Content */}
              <div className="relative p-6 space-y-4">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Hoje, 08 Jan</h3>
                    <p className="text-sm text-gray-400">5 atendimentos agendados</p>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-xs font-medium text-emerald-400">3 confirmados</span>
                  </div>
                </div>

                {/* Appointments List */}
                <div className="space-y-3">
                  {appointments.map((apt, index) => {
                    const StatusIcon = getStatusIcon(apt.status)
                    return (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.08) }}
                        className="group relative bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                        style={{ willChange: 'transform' }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Time */}
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                            <span className="text-sm font-semibold text-white">{apt.time}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate mb-1">{apt.client}</p>
                            <p className="text-xs text-gray-400 truncate mb-2">{apt.service}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">{apt.professional.charAt(0)}</span>
                              </div>
                              <span className="text-xs text-gray-500">{apt.professional}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${apt.statusColor}`}>
                              <StatusIcon className="w-3 h-3" aria-hidden="true" />
                              <span className="hidden sm:inline">{apt.statusLabel}</span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Technical Footnote */}
              <div className="px-6 pb-4">
                <p className="text-[9px] text-gray-600 text-center">
                  Interface real • Sistema em produção
                </p>
              </div>
            </div>
          </motion.div>

          {/* Highlights - Right Side on Desktop */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2 space-y-4"
          >
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={false}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.4, delay: 0.6 + (index * 0.08) }}
                className="group relative bg-[#0f1419]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.08] hover:border-primary-500/30 transition-all duration-300"
                style={{ willChange: 'transform' }}
              >
                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/20 flex items-center justify-center">
                    <highlight.icon className="w-6 h-6 text-primary-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">{highlight.title}</h3>
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