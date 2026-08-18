'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Star } from 'lucide-react'

export function FinalCTA({ id = 'comecar' }: { id?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <div ref={sectionRef} id={id} className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 flex justify-center px-3 sm:px-4 md:px-6 z-20">
      
      {/* Top half background (white) to blend with Pricing */}
      <div className="absolute top-0 left-0 right-0 h-[60%] bg-white -z-10" />

      {/* The Main Light-Gray Rounded Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[1600px] rounded-[3rem] px-6 py-16 md:py-24 overflow-hidden border border-slate-200 shadow-xl"
      >
        
        {/* Background Video */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/seção-cta.mp4" type="video/mp4" />
        </video>

        {/* Overlay para legibilidade do texto */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

        {/* Central Content Wrapper */}
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center text-center">
          

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl lg:text-6xl font-display font-semibold text-slate-900 tracking-tight leading-[1.1] mb-6"
          >
            Eleve o Nível<br />do Seu Salão
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-500 mb-10 max-w-md"
          >
            Mantenha sua agenda cheia, finanças sob controle e clientes fiéis com a nossa plataforma.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-primary-500 text-white font-bold text-lg hover:bg-primary-600 transition-transform hover:scale-105 duration-300 shadow-xl shadow-primary-500/20"
            >
              Começar Agora
            </Link>
          </motion.div>
          
        </div>
      </motion.div>
    </div>
  )
}