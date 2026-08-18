'use client'

import { useState, useRef, useId } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  id: string
}

function FAQItem({ question, answer, isOpen, onClick, id }: FAQItemProps) {
  const prefersReducedMotion = useReducedMotion()
  const contentId = `faq-content-${id}`
  const buttonId = `faq-button-${id}`

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        "bg-[#0f1419]/60 backdrop-blur-xl border border-white/[0.08]",
        "hover:border-white/[0.12]",
        isOpen && "border-white/[0.15] bg-[#0f1419]/80"
      )}
    >
      <button
        id={buttonId}
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030B14] rounded-2xl"
      >
        <span className={cn(
          "text-[15px] md:text-base font-medium transition-colors duration-300",
          isOpen ? "text-white" : "text-white/80 group-hover:text-white"
        )}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300",
            isOpen ? "bg-primary-500/20 text-primary-400" : "bg-white/[0.05] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white/70"
          )}
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-5 text-gray-400 text-[14px] md:text-[15px] leading-relaxed pr-14">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const faqData = [
  {
    question: 'Preciso instalar algum programa?',
    answer: 'Não. A Poderosa Agenda funciona diretamente pelo navegador. Você pode acessar de qualquer dispositivo conectado à internet, seja computador, tablet ou celular.',
  },
  {
    question: 'É difícil começar a usar?',
    answer: 'Não. A interface foi projetada para ser intuitiva. Você configura os dados básicos do seu salão, adiciona seus profissionais e serviços, e já pode começar a utilizar.',
  },
  {
    question: 'Minha equipe também pode acessar?',
    answer: 'Sim. Cada profissional pode ter seu próprio acesso com as permissões adequadas para visualizar agenda, registrar atendimentos e acompanhar seu desempenho.',
  },
  {
    question: 'Como funcionam os lembretes por WhatsApp?',
    answer: 'Após configurar uma única vez, o sistema envia lembretes automaticamente antes dos agendamentos, ajudando a reduzir faltas e confirmando a presença dos clientes.',
  },
  {
    question: 'Quanto custa a Poderosa Agenda?',
    answer: 'O plano mensal custa R$ 59,90 e inclui acesso completo a todos os recursos. O plano anual custa R$ 49,90/mês, representando uma economia de aproximadamente 17%.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim. Não existe fidelidade. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel, sem taxas ou burocracia.',
  },
  {
    question: 'Existe período de teste?',
    answer: 'Consulte nossa equipe comercial para conhecer as condições atuais de experimentação do produto.',
  },
  {
    question: 'Como meus dados são protegidos?',
    answer: 'Utilizamos práticas modernas de segurança para proteger as informações do seu negócio e de seus clientes. Os dados são armazenados em servidores seguros com criptografia.',
  },
  {
    question: 'Vocês oferecem suporte?',
    answer: 'Sim. Oferecemos suporte por chat e email para ajudar com dúvidas sobre o uso da plataforma.',
  },
]

interface FAQProps {
  id?: string
}

export function FAQ({ id = 'faq' }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = isInView && !prefersReducedMotion
  const uniqueId = useId()

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 overflow-hidden"
      aria-labelledby={`${id}-heading`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030B14] via-[#0a1525] to-[#030B14]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 lg:mb-16"
        >
          <motion.div
            initial={false}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mb-6"
          >
            <span className="text-sm font-semibold tracking-widest text-primary-400 uppercase">Dúvidas frequentes</span>
          </motion.div>

          <motion.h2
            id={`${id}-heading`}
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-3xl lg:text-5xl font-display font-semibold text-white tracking-tight mb-6"
          >
            Ainda ficou alguma dúvida?
          </motion.h2>

          <motion.p
            initial={false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto mb-10 font-medium"
          >
            Respondemos às principais perguntas sobre o produto, uso e contratação.
          </motion.p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
          role="list"
        >
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.36 + (index * 0.04) }}
              role="listitem"
            >
              <FAQItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                id={`${uniqueId}-${index}`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}