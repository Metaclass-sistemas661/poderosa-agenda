'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FinalCTA } from '@/sections/FinalCTA'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <main className="pt-24 lg:pt-32">
        {/* =========================================================================
            SECTION 1: HERO (Image 1 Ref)
            Left: Text ("Nosso sonho...") | Right: Large Image with geometric transition
            ========================================================================= */}
        <section className="relative w-full overflow-hidden mb-24 md:mb-40">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-0">
            {/* Left Column: Text */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:pr-12 relative z-10 pt-12 lg:pt-0"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight text-slate-900 mb-6">
                Nosso sonho <br className="hidden md:block" />
                é simplificar o seu.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Plataforma de gestão inteligente para você criar experiências únicas e focar no que realmente importa: seu talento.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/cadastro" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3.5 rounded-full transition-all focus:outline-none shadow-md shadow-primary-500/20">
                    Solicite acesso
                  </button>
                </Link>
                <Link href="#problema" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-transparent border border-slate-300 hover:border-slate-900 text-slate-900 font-bold px-8 py-3.5 rounded-full transition-all focus:outline-none">
                    Saiba mais
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Large Image with Geometric Triangle Mask */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-[500px] lg:h-[700px] -mr-6 lg:-mr-12"
            >
              {/* Background solid accent optional */}
              <div className="absolute inset-0 bg-primary-50 rounded-l-[40px] md:rounded-l-[80px]" />
              
              <img 
                src="/images/sobre-hero.jpg" // We will generate this
                alt="Profissionais trabalhando no salão" 
                className="w-full h-full object-cover rounded-l-[40px] md:rounded-l-[80px] object-center relative z-10"
              />

              {/* Triangle overlay simulating the cut effect from Image 1 */}
              <div className="absolute inset-0 pointer-events-none z-20 flex justify-start items-center">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-[150px] lg:w-[250px] text-white hidden md:block">
                   <polygon fill="currentColor" points="0,0 100,0 0,25 50,50 0,75 100,100 0,100" />
                   <polygon fill="currentColor" points="0,25 60,50 0,75" opacity="0.8" />
                   <polygon fill="currentColor" points="0,15 80,35 0,55" opacity="0.6" />
                   <polygon fill="currentColor" points="0,45 80,65 0,85" opacity="0.6" />
                 </svg>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: O Problema (Image 2 Ref)
            ========================================================================= */}
        <section id="problema" className="py-20 md:py-32 px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight mb-8"
            >
              Os negócios locais estão sendo prejudicados.
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-6 text-base md:text-lg text-slate-600 leading-relaxed font-medium mx-auto max-w-3xl"
            >
              <p>
                Em média, uma empresa de serviços perde tempo valioso e milhares de reais por ano em receita não capturada. Não por falta de ambição, mas por não ter a tecnologia certa ou equipe suficiente para aproveitar todas as oportunidades.
              </p>
              <p>
                Um cliente que não comparece, um que esquece de remarcar, taxas ocultas que abocanham uma fatia cada vez maior do negócio. Essas pequenas perdas se acumulam silenciosamente e prejudicam o crescimento das empresas. Nós decidimos resolver esse problema.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto h-[400px] md:h-[600px] rounded-[32px] md:rounded-[64px] overflow-hidden shadow-2xl relative"
          >
            <img 
              src="/images/sobre-problema.jpg" 
              alt="Reunião no salão" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </section>

        {/* =========================================================================
            SECTION 3: A Solução (Image 4 Ref)
            ========================================================================= */}
        <section className="py-20 md:py-32 px-6 bg-slate-50">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-6"
            >
              Dando a cada negócio uma vantagem competitiva.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
            >
              Como profissionais de beleza, víamos de perto a necessidade de algo melhor. Essa clareza de propósito significava que não poderíamos apenas fazer "mais do mesmo", mas construir uma ferramenta muito mais inteligente do que qualquer outra já criada para o setor.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto h-[350px] md:h-[500px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-xl"
          >
            <img 
              src="/images/sobre-vantagem.jpg" 
              alt="Profissionais de beleza sorrindo" 
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        </section>

        {/* =========================================================================
            SECTION 4: O Parceiro (Image 4 Ref pt 2)
            ========================================================================= */}
        <section className="py-20 md:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-6"
            >
              O parceiro sempre presente que impulsiona o crescimento do seu negócio.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
            >
              A Poderosa Agenda oferece aos negócios um ecossistema completo que trabalha constantemente em segundo plano para atrair mais clientes, aumentar o valor médio dos serviços e fidelizar as pessoas. Um sistema que ajuda a visualizar como aumentar a receita e liberar seu tempo.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto h-[350px] md:h-[500px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-xl"
          >
            <img 
              src="/images/sobre-parceiro.jpg" 
              alt="Cliente no caixa do salão" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </section>

        {/* =========================================================================
            SECTION 5: Final CTA (Padronizado com a Landing Page)
            ========================================================================= */}
        <FinalCTA />
      </main>

      {/* Unified Footer over the page background */}
      <div className="relative z-10 -mt-24 md:-mt-32">
        <Footer className="!pt-40 md:!pt-48" />
      </div>
    </div>
  )
}