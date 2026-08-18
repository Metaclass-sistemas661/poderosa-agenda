'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

export function TargetAudience() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  // Parallax effects for different images
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -40])
  const y3 = useTransform(scrollYProgress, [0, 1], [-20, 60])
  const y4 = useTransform(scrollYProgress, [0, 1], [20, -20])

  return (
    <section 
      ref={containerRef}
      className="relative py-20 lg:py-24 overflow-hidden bg-slate-50"
      id="para-quem"
    >
      <div className="absolute inset-0 bg-white" aria-hidden="true" />
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#f4ece3] blur-[100px] pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: The Mosaic Collage */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square">
            {/* Decorative background shape */}
            <div className="absolute top-[10%] left-[5%] w-[80%] h-[80%] bg-[#fcf9f5] rounded-[60px] transform rotate-3" />
            <div className="absolute top-[5%] left-0 w-[45%] h-[50%] bg-[#e3d1c4]/30 rounded-tl-[60px] rounded-bl-xl rounded-tr-xl rounded-br-[60px]" />
            
            {/* Sparkles SVG */}
            <svg className="absolute bottom-[15%] left-[-5%] w-16 h-16 text-[#cfa88b] z-20 animate-pulse" viewBox="0 0 100 100" fill="none">
              <path d="M50 0L53 40L93 43L55 50L58 90L45 55L5 52L43 45Z" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-[5%] left-[5%] w-8 h-8 text-[#cfa88b] z-20 opacity-70" viewBox="0 0 100 100" fill="none">
              <path d="M50 0L53 40L93 43L55 50L58 90L45 55L5 52L43 45Z" fill="currentColor" />
            </svg>

            {/* Image 1 (Top Left) - Salão */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="absolute top-[5%] left-[5%] w-[45%] h-[50%] z-10 rounded-tl-[60px] rounded-br-[60px] rounded-tr-3xl rounded-bl-3xl overflow-hidden shadow-xl border border-white"
            >
              <motion.img 
                style={{ y: y1 }}
                src="/niche-salao.png" 
                alt="Salão de Beleza"
                className="w-full h-[120%] object-cover -mt-[10%]"
              />
            </motion.div>

            {/* Image 2 (Top Right) - Barbearia */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute top-[15%] right-[10%] w-[35%] h-[40%] z-10 rounded-[40px] overflow-hidden shadow-xl border border-white"
            >
              <motion.img 
                style={{ y: y2 }}
                src="/niche-barbearia.png" 
                alt="Barbearia"
                className="w-full h-[120%] object-cover -mt-[10%]"
              />
            </motion.div>

            {/* Image 3 (Bottom Left) - Estética */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute bottom-[10%] left-[10%] w-[35%] h-[35%] z-20 rounded-[32px] overflow-hidden shadow-xl border-4 border-white"
            >
              <motion.img 
                style={{ y: y3 }}
                src="/niche-estetica.png" 
                alt="Estética"
                className="w-full h-[120%] object-cover -mt-[10%]"
              />
            </motion.div>

            {/* Image 4 (Bottom Right) - Esmalteria */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute bottom-[5%] right-[5%] w-[45%] h-[40%] z-10 rounded-t-[60px] rounded-b-3xl overflow-hidden shadow-xl border-4 border-white"
            >
              <motion.img 
                style={{ y: y4 }}
                src="/niche-esmalteria.png" 
                alt="Esmalteria"
                className="w-full h-[120%] object-cover -mt-[10%]"
              />
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Content */}
          <div className="flex flex-col justify-center h-full lg:pl-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              
              <h2 className="text-4xl lg:text-5xl font-display font-medium text-slate-900 leading-[1.05] mb-5 tracking-tight">
                Feito sob medida para<br className="hidden lg:block" /> o seu negócio.
              </h2>
              
              <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-3">Para Quem</p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                Seja você o dono de um salão de alto padrão, uma barbearia com grande fluxo ou uma clínica moderna, nós nos adaptamos à sua realidade. Automatize a gestão, engaje clientes e foque apenas em entregar o melhor serviço.
              </p>

            </motion.div>

            {/* Stats Banner (Ultra Minimalist) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#fcf9f5]/50 backdrop-blur-md border border-[#e5ded6]/60 rounded-2xl p-4 flex items-center justify-between shadow-sm mt-8 max-w-sm"
            >
              <div className="text-center px-2">
                <p className="text-2xl font-bold text-slate-800 mb-0.5">15h+</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Livres</p>
              </div>
              
              <div className="w-px h-8 bg-slate-200" />
              
              <div className="text-center px-2">
                <p className="text-2xl font-bold text-slate-800 mb-0.5">-80%</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Faltas</p>
              </div>
              
              <div className="w-px h-8 bg-slate-200" />
              
              <div className="text-center px-2">
                <p className="text-2xl font-bold text-slate-800 mb-0.5">+30%</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Retenção</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
