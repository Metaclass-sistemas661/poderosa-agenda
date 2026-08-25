'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Plus, Minus, Instagram, Facebook, Linkedin, Scissors, CalendarDays, CreditCard, Star, Clock } from 'lucide-react'

const faqs = [
  { q: "Preciso instalar algum programa?", a: "Não. A Poderosa Agenda funciona diretamente pelo navegador em qualquer dispositivo, seja computador, tablet ou celular." },
  { q: "Minha equipe também pode acessar?", a: "Sim. Cada profissional pode ter seu próprio acesso com permissões específicas para ver apenas a própria agenda ou o salão todo." },
  { q: "Quanto custa a Poderosa Agenda?", a: "Temos um plano único com acesso a absolutamente todos os recursos. R$ 59,90 no plano mensal ou com 16% de desconto no plano anual." },
  { q: "Posso cancelar quando quiser?", a: "Sim, somos 100% livres de fidelidade. Você pode cancelar sua assinatura a qualquer momento com um único clique." }
]



export function Footer({ className }: { className?: string }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const controls = useAnimation()

  // Salon-context icons for the background animation
  const icons = [
    { Icon: Scissors, color: 'text-pink-400', bg: 'bg-pink-100', left: '5%', delay: 0.2 },
    { Icon: CalendarDays, color: 'text-green-400', bg: 'bg-green-100', left: '25%', delay: 0.4 },
    { Icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100', left: '50%', delay: 0.1 },
    { Icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-100', left: '75%', delay: 0.5 },
    { Icon: Clock, color: 'text-purple-400', bg: 'bg-purple-100', left: '90%', delay: 0.3 },
  ]

  useEffect(() => {
    if (isInView) {
      icons.forEach((item, i) => {
        controls.start(i => ({
          y: 0,
          opacity: 0.5,
          rotate: i % 2 === 0 ? 12 : -12,
          transition: { type: "spring", bounce: 0.5, duration: 2, delay: item.delay }
        })).then(() => {
          controls.start(i => ({
            y: [0, -15, 0],
            rotate: i % 2 === 0 ? [12, 16, 12] : [-12, -16, -12],
            transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }))
        })
      })
    }
  }, [isInView, controls])

  return (
    <footer className={`relative pt-32 bg-slate-100 overflow-hidden flex flex-col ${className ?? ''}`}>
      
      {/* Background Salon Icons Animation */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {icons.map((item, i) => (
          <motion.div
            custom={i}
            key={i}
            initial={{ y: -800, opacity: 0, rotate: -30 }}
            animate={controls}
            className={`absolute bottom-[80px] w-20 h-20 md:w-28 md:h-28 rounded-3xl ${item.bg} flex items-center justify-center shadow-sm origin-bottom`}
            style={{ left: item.left }}
          >
            <item.Icon className={`w-10 h-10 md:w-14 md:h-14 ${item.color}`} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-8 flex flex-col gap-24 pb-32">
        
        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto w-full">
          <h2 className="text-3xl lg:text-5xl font-display font-semibold text-slate-900 tracking-tight text-center mb-10">
            Perguntas Frequentes
          </h2>
          <div className="border-t border-slate-300">
            {faqs.map((faq, i) => {
              const isOpen = openFAQ === i
              return (
                <div key={i} className="border-b border-slate-300">
                  <button
                    onClick={() => setOpenFAQ(isOpen ? null : i)}
                    className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className={`text-lg md:text-xl font-medium pr-8 transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {faq.q}
                    </span>
                    <span className="text-slate-400 flex-shrink-0 group-hover:text-slate-900 transition-colors">
                      {isOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-slate-500 text-base md:text-lg leading-relaxed pr-12">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 pt-16 border-t border-slate-300">
          
          {/* Logo & Description */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <Link href="/" className="inline-block focus-visible:outline-none">
              <span className="text-xl font-logo uppercase tracking-[0.25em] font-semibold text-primary-600 transition-opacity duration-300 hover:opacity-80">
                PODEROSA AGENDA
              </span>
            </Link>
            
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6">
              O sistema completo para gestão de salões de beleza e barbearias. Simplifique sua operação e encante seus clientes.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <strong className="text-slate-700">Email:</strong> contato@poderosaagenda.com.br
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <strong className="text-slate-700">WhatsApp:</strong> 
                <a 
                  href="https://wa.me/5513996640359" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary-600 transition-colors"
                >
                  +55 13 99664-0359
                </a>
              </div>
              <div className="flex flex-col text-slate-500 text-sm">
                <strong className="text-slate-700 mb-1">Endereço:</strong>
                <span>São Paulo - Brasil</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-slate-900 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-slate-900 transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Nav Columns */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Produto</h3>
            <ul className="space-y-3">
              <li><Link href="/#como-funciona" className="text-sm text-slate-500 hover:text-slate-900">Como Funciona</Link></li>
              <li><Link href="/#para-quem" className="text-sm text-slate-500 hover:text-slate-900">Para Quem</Link></li>
              <li><Link href="/#por-que-escolher" className="text-sm text-slate-500 hover:text-slate-900">Vantagens</Link></li>
              <li><Link href="/#planos" className="text-sm text-slate-500 hover:text-slate-900">Planos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Suporte</h3>
            <ul className="space-y-3">
              <li><Link href="/ajuda" className="text-sm text-slate-500 hover:text-slate-900">Central de Ajuda</Link></li>
              <li><Link href="/status" className="text-sm text-slate-500 hover:text-slate-900">Status do Sistema</Link></li>
              <li><Link href="/contato" className="text-sm text-slate-500 hover:text-slate-900">Fale Conosco</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/termos" className="text-sm text-slate-500 hover:text-slate-900">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="text-sm text-slate-500 hover:text-slate-900">Privacidade</Link></li>
              <li><Link href="/cookies" className="text-sm text-slate-500 hover:text-slate-900">Cookies</Link></li>
              <li><Link href="/lgpd" className="text-sm text-slate-500 hover:text-slate-900">LGPD</Link></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Copyright Bar at the absolute bottom */}
      <div className="w-full text-center py-6 border-t border-slate-200 relative z-20 mt-auto bg-slate-100">
        <p className="text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Poderosa Agenda. Todos os direitos reservados.
        </p>
      </div>
      
    </footer>
  )
}