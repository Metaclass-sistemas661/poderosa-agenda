'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Problem() {
  return (
    <section id="problema" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="container-custom">
        
          {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-20 md:mb-32"
        >
          <h2 className="text-3xl lg:text-5xl font-display font-semibold text-slate-900 leading-[1.15] tracking-tight">
            Sua agenda lotada não significa nada se os clientes não aparecem.
          </h2>
        </motion.div>

        {/* Content Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left: Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center lg:justify-start"
          >
            {/* Container to tightly hug the image width for exact SVG placement */}
            <div className="relative inline-block">
              {/* Main Pill Image */}
              <div className="relative w-[280px] h-[420px] md:w-[320px] md:h-[480px] rounded-[160px] overflow-hidden border-[2px] border-primary-200 z-10 shadow-sm">
                <img 
                  src="/imagem-seção-2.jpeg" 
                  alt="Profissional no salão" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Decorative dashed arrow (SVG) tightly anchored to the image */}
              <svg className="absolute top-[60%] -right-[160px] md:-right-[220px] w-48 md:w-64 h-48 transform -translate-y-1/2 hidden lg:block text-slate-300 z-0 pointer-events-none" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* SVG paths mimicking the Uogi loop from under the image */}
                <path d="M0 120 C 60 160, 90 100, 60 70 C 30 40, 0 90, 40 120 C 80 150, 140 80, 180 50" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
                <path d="M175 40 L190 45 L180 60 Z" fill="#f43f5e" /> {/* Pink Arrowhead */}
              </svg>
            </div>

            {/* Small Overlapping Circle 1 */}
            <div className="absolute -bottom-6 -left-6 md:-left-8 w-24 h-24 md:w-32 md:h-32 rounded-full border-[4px] border-white overflow-hidden z-20 shadow-lg">
              <img 
                src="/imagem-seção-3.jpeg" 
                alt="Cliente feliz" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Small Overlapping Circle 2 */}
            <div className="absolute -bottom-16 left-12 md:left-16 w-20 h-20 md:w-28 md:h-28 rounded-full border-[4px] border-primary-400 overflow-hidden z-30 shadow-lg">
              <img 
                src="/imagem-seção-4.jpeg" 
                alt="Atendimento" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Right: Text and Button */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl text-center lg:text-left mx-auto lg:mx-0 relative z-10"
          >
            <h3 className="text-3xl md:text-4xl lg:text-[40px] font-display font-semibold text-slate-900 leading-[1.2] mb-6">
              Chega de buracos na agenda e faturamento perdido.
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
              Entre confirmações manuais no WhatsApp, encaixes que dão errado e o caixa que não bate, a gestão do seu negócio consome o tempo que você deveria usar para crescer. A Poderosa Agenda automatiza o trabalho chato, para você focar no que realmente importa.
            </p>
            
            <a href="/cadastro" className="inline-flex">
              <button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-8 py-3.5 text-base font-bold transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg mx-auto lg:mx-0">
                Explorar Poderosa Agenda
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>
            </a>
          </motion.div>
        </div>


      </div>
    </section>
  )
}