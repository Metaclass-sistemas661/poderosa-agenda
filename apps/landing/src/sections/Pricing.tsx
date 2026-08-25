'use client'

import { useRef, useState, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Star, ArrowRight, Calendar, Users, BarChart3, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export function Pricing({ id = 'planos' }: { id?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const [isAnnual, setIsAnnual] = useState(false)

  const pricing = useMemo(() => ({
    monthly: 49.90,
    annual: 39.90,
    savings: Math.round(((49.90 - 39.90) / 49.90) * 100)
  }), [])

  const currentPrice = isAnnual ? pricing.annual : pricing.monthly

  // Grouped features for the card (using icons to match reference style)
  const features = useMemo(() => [
    { icon: Calendar, text: 'Agenda completa e ilimitada' },
    { icon: Users, text: 'Gestão de clientes e equipe' },
    { icon: BarChart3, text: 'Dashboard financeiro avançado' },
    { icon: MessageSquare, text: 'Lembretes via WhatsApp' },
    { icon: Star, text: 'Atualizações contínuas gratuitas' }
  ], [])

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 bg-white overflow-hidden"
    >
      {/* Wavy Background (SVG) */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
        <svg 
          viewBox="0 0 1440 320" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-w-[1440px]"
        >
          <path 
            fill="#fcf1f1" 
            d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,192C672,213,768,203,864,181.3C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-3">
            Simples e Transparente
          </p>
          <h2 className="text-4xl lg:text-5xl font-display font-semibold text-slate-900 tracking-tight mb-4">
            Um único plano.<br className="hidden sm:block" /> Tudo o que seu negócio precisa.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Cresça sem limites com acesso a todas as funcionalidades desde o primeiro dia.
          </p>

          {/* Custom Toggle (Mensal / Anual) */}
          <div className="flex items-center justify-center gap-4 bg-white/50 backdrop-blur-sm w-fit mx-auto px-6 py-3 rounded-full shadow-sm border border-slate-100">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Mensal
            </span>
            
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 rounded-full bg-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              role="switch"
              aria-checked={isAnnual}
              aria-label="Alternar plano"
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
            
            <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Anual
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold tracking-wide uppercase">
                {pricing.savings}% Off
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Card Area */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 50 }}
            className="w-full max-w-[400px]"
          >
            {/* The Highlighted Purple Card */}
            <div className="relative bg-primary-600 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-primary-900/20 text-white mt-8">
              
              {/* Floating Top Icon */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <div className="relative bg-white text-primary-600 w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center">
                  <Star className="w-8 h-8 fill-current" />
                  {/* Little bottom triangle */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
                </div>
              </div>

              {/* Card Header */}
              <div className="text-center mt-6 mb-8">
                <h3 className="text-xl font-bold mb-4 opacity-90">Poderosa Agenda</h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-3xl font-medium opacity-80">R$</span>
                  <span className="text-6xl font-black tracking-tight">{currentPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="text-white/80 text-sm font-medium h-6">
                  {isAnnual ? 'cobrado anualmente' : '/mês'}
                </div>
              </div>

              {/* Features Boxes */}
              <div className="space-y-3 mb-10">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 transition-colors hover:bg-white/15">
                    <feature.icon className="w-5 h-5 text-white/80 flex-shrink-0" />
                    <span className="text-[15px] font-medium leading-tight">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link 
                href="/cadastro" 
                className="w-full py-4 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 group"
              >
                Assinar Agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <p className="text-center text-xs font-medium text-white/70 mt-6">
                Cancele a qualquer momento. Sem surpresas.
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}