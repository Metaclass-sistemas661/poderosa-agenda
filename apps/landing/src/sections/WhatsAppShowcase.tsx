'use client'

import { useRef, useMemo } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  MessageSquare,
  Bell,
  Send,
  Clock,
  CheckCheck,
  CalendarCheck,
  Gift,
  Megaphone,
  Sparkles,
  Zap
} from 'lucide-react'

interface WhatsAppShowcaseProps {
  id?: string
}

export function WhatsAppShowcase({ id = 'whatsapp-showcase' }: WhatsAppShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = isInView && !prefersReducedMotion

  const highlights = useMemo(() => [
    {
      icon: CalendarCheck,
      title: 'Confirmações automáticas',
      description: 'Reduza faltas enviando lembretes antes do atendimento.'
    },
    {
      icon: Bell,
      title: 'Lembretes',
      description: 'Nunca esqueça aniversários ou retornos importantes.'
    },
    {
      icon: Megaphone,
      title: 'Campanhas',
      description: 'Envie promoções para clientes segmentados.'
    },
    {
      icon: Zap,
      title: 'Economia de tempo',
      description: 'Automatize tarefas repetitivas e foque no atendimento.'
    }
  ], [])

  const messageQueue = useMemo(() => [
    {
      type: 'confirmation',
      title: 'Confirmação de Agendamento',
      recipient: 'Maria Oliveira',
      time: 'Agora',
      status: 'sent',
      statusLabel: 'Enviado'
    },
    {
      type: 'reminder',
      title: 'Lembrete 24h',
      recipient: 'Ana Souza',
      time: 'Em 2h',
      status: 'scheduled',
      statusLabel: 'Programado'
    },
    {
      type: 'birthday',
      title: 'Feliz Aniversário!',
      recipient: 'Juliana Costa',
      time: 'Hoje 08:00',
      status: 'sent',
      statusLabel: 'Enviado'
    }
  ], [])

  const stats = useMemo(() => [
    { label: 'Na fila', value: '5', color: 'text-amber-400' },
    { label: 'Enviadas hoje', value: '23', color: 'text-emerald-400' },
    { label: 'Aniversários', value: '3', color: 'text-purple-400' }
  ], [])

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
    return <Clock className="w-3.5 h-3.5 text-amber-400" />
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'confirmation': return <CalendarCheck className="w-4 h-4" />
      case 'reminder': return <Bell className="w-4 h-4" />
      case 'birthday': return <Gift className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 overflow-hidden"
      aria-labelledby={`${id}-heading`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030B14] via-[#0a1525] to-[#030B14]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,211,102,0.06),transparent_70%)]" aria-hidden="true" />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
            <span className="text-sm font-medium text-[#25D366]">WhatsApp Inteligente</span>
          </motion.div>

          <motion.h2
            id={`${id}-heading`}
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Automatize a comunicação e economize horas todos os dias
          </motion.h2>

          <motion.p
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="text-lg leading-relaxed text-gray-400"
          >
            Envie confirmações, lembretes, aniversários e mensagens automáticas diretamente pelo WhatsApp.
          </motion.p>
        </motion.div>

        {/* Content Grid - Highlights LEFT, WhatsApp RIGHT (INVERTIDO) */}
        <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-16 items-start">
          {/* Highlights - Left */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 space-y-4"
          >
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.4, delay: 0.4 + (index * 0.08) }}
                className="group relative bg-[#0f1419]/60 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] hover:border-[#25D366]/30 transition-all duration-300"
                style={{ willChange: 'transform' }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#25D366]/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/20 flex items-center justify-center">
                    <highlight.icon className="w-7 h-7 text-[#25D366]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5">{highlight.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{highlight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* WhatsApp Showcase - Right */}
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="order-2"
          >
            <div
              className="relative bg-[#0f1419]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{
                boxShadow: '0 0 0 1px rgba(37, 211, 102, 0.08), 0 20px 60px -15px rgba(37, 211, 102, 0.27), 0 0 100px -20px rgba(37, 211, 102, 0.18)'
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
                <div className="w-20" />
              </div>

              {/* WhatsApp Content */}
              <div className="relative p-6 space-y-5">
                {/* Stats Row */}
                <motion.div
                  initial={false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.4, delay: 0.52 }}
                  className="grid grid-cols-3 gap-3"
                  style={{ willChange: 'transform' }}
                >
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="bg-[#1a2332]/60 rounded-xl p-3 text-center border border-white/[0.06]"
                    >
                      <p className="text-[11px] text-gray-500 mb-1">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Message Queue */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
                      Fila de Mensagens
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium">Automático</span>
                  </div>
                  
                  {messageQueue.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, delay: 0.6 + (index * 0.08) }}
                      className="flex items-center justify-between px-4 py-3 bg-[#1a2332]/40 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      style={{ willChange: 'transform' }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(msg.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white font-medium truncate">{msg.title}</p>
                          <p className="text-[11px] text-gray-500">{msg.recipient} • {msg.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {getStatusIcon(msg.status)}
                        <span className={`text-[11px] font-medium ${msg.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {msg.statusLabel}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Automation Status */}
                <motion.div
                  initial={false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, delay: 0.84 }}
                  className="flex items-center justify-between p-4 bg-[#25D366]/5 rounded-xl border border-[#25D366]/10"
                  style={{ willChange: 'transform' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
                    <span className="text-[13px] text-[#25D366] font-medium">Automações ativas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Confirmações, Lembretes, Aniversários</span>
                  </div>
                </motion.div>
              </div>

              {/* Footnote */}
              <motion.div
                initial={false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.3, delay: 0.92 }}
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