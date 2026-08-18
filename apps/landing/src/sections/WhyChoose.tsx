'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function WhyChoose({ id = 'por-que-escolher' }: { id?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  // Animation variants for the bento items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative py-24 lg:py-32 bg-[#fcf1f1] overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
        >
          
          {/* 1. Title Block (Col 1) */}
          <motion.div variants={itemVariants} className="flex flex-col justify-center p-4 lg:p-8">
            <h2 className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 leading-tight mb-4 tracking-tight">
              Por que <br className="hidden md:block" />
              escolher a <br className="hidden md:block" />
              Poderosa Agenda
            </h2>
            <p className="text-lg text-slate-500 max-w-sm">
              Não é apenas um sistema de agendamento. É uma transformação para o seu negócio.
            </p>
          </motion.div>

          {/* 2. Feature 1 (Col 2) */}
          <motion.div variants={itemVariants} className="bg-[#fcfaf8] rounded-3xl p-8 lg:p-10 flex flex-col justify-between aspect-square md:aspect-auto">
            <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Interface Intuitiva</h3>
            <p className="text-slate-600 mt-8 text-lg">Sua equipe aprende a usar em minutos. Esqueça manuais complexos e sistemas engessados do passado.</p>
          </motion.div>

          {/* 3. Feature 2 (Col 3) */}
          <motion.div variants={itemVariants} className="bg-[#f5f7f9] rounded-3xl p-8 lg:p-10 flex flex-col justify-between aspect-square md:aspect-auto">
            <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Segurança & Nuvem</h3>
            <p className="text-slate-600 mt-8 text-lg">Seus dados financeiros e o histórico de seus clientes protegidos com criptografia de ponta e acessíveis 24/7.</p>
          </motion.div>

          {/* 4. Large Image Card (Col 1 & 2) */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[2/1] md:aspect-auto md:h-[450px] bg-slate-100 group">
            <img src="/smartphone.jpeg" alt="Automação Inteligente" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
            <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between">
              <h3 className="text-2xl lg:text-3xl font-semibold text-white drop-shadow-lg tracking-tight">Automação Inteligente</h3>
              <p className="text-white/90 text-lg lg:text-xl max-w-md drop-shadow-lg font-medium leading-relaxed">
                Gestão que trabalha por você – desde confirmações automáticas no WhatsApp até relatórios no fim do dia.
              </p>
            </div>
          </motion.div>

          {/* 5. Square Image Card (Col 3) */}
          <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden aspect-square md:aspect-auto md:h-[450px] bg-slate-100 group">
            <img src="/futuristc.jpeg" alt="Crescimento Escalonável" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
            <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between">
              <h3 className="text-2xl lg:text-3xl font-semibold text-white drop-shadow-lg tracking-tight">Crescimento sem limites</h3>
              <p className="text-white/90 text-lg lg:text-xl drop-shadow-lg font-medium leading-relaxed">
                Construído para acompanhar o seu sucesso, do seu primeiro salão até uma rede de franquias.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}