'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', side: 'left', image: '/whatsapp.jpeg' },
  { id: 'calendar', name: 'Google Calendar', color: '#4285F4', side: 'right', image: '/calendar.jpeg' },
  { id: 'pix', name: 'Pix & Pagamentos', color: '#32BCAD', side: 'left', image: '/pix.jpeg' },
  { id: 'email', name: 'E-mail & SMS', color: '#9CA3AF', side: 'right', image: '/computer.jpeg' },
  { id: 'api', name: 'API & Webhooks', color: '#8B5CF6', side: 'left', image: '/terminal-window.jpeg' },
]

function IntegrationImage({ item, index, totalItems, smoothProgress }: any) {
  const step = 1 / (totalItems - 1)
  const center = index * step

  const isLast = index === totalItems - 1
  const range = isLast
    ? [center - step, center, 1]
    : [center - step, center, center + step]

  const imageOpacity = useTransform(smoothProgress, range, isLast ? [0, 1, 1] : [0, 1, 0])
  const imageY = useTransform(smoothProgress, range, isLast ? ['-30%', '0%', '0%'] : ['-30%', '0%', '30%'])

  const panelClass = item.side === 'left'
    ? "absolute left-[4%] lg:left-[8%] xl:left-[12%] top-1/2 -translate-y-1/2 w-[22vw] max-w-[300px] aspect-[4/5]"
    : "absolute right-[4%] lg:right-[8%] xl:right-[12%] top-1/2 -translate-y-1/2 w-[22vw] max-w-[300px] aspect-[4/5]"

  return (
    <motion.div
      style={{ opacity: imageOpacity, y: imageY }}
      className={`${panelClass} rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 flex items-center justify-center`}
    >
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
    </motion.div>
  )
}

function IntegrationItem({ item, index, totalItems, smoothProgress }: any) {
  const step = 1 / (totalItems - 1)
  const center = index * step

  const isLast = index === totalItems - 1
  const range = isLast
    ? [center - step, center, 1]
    : [center - step, center, center + step]

  const opacity = useTransform(smoothProgress, range, isLast ? [0.15, 1, 1] : [0.15, 1, 0.15])
  const scale = useTransform(smoothProgress, range, isLast ? [0.85, 1.1, 1.1] : [0.85, 1.1, 0.85])
  const color = useTransform(smoothProgress, range, isLast ? ['#cbd5e1', '#0f172a', '#0f172a'] : ['#cbd5e1', '#0f172a', '#cbd5e1'])

  const arrowRange = isLast
    ? [center - 0.1, center, 1]
    : [center - 0.1, center, center + 0.1]

  const arrowOpacity = useTransform(smoothProgress, arrowRange, isLast ? [0, 1, 1] : [0, 1, 0])

  const arrowXLeft = useTransform(smoothProgress, arrowRange, isLast ? [20, 0, 0] : [20, 0, -20])
  const arrowXRight = useTransform(smoothProgress, arrowRange, isLast ? [-20, 0, 0] : [-20, 0, 20])

  return (
    <motion.div
      className="flex items-center gap-4 whitespace-nowrap cursor-default"
      style={{ opacity, scale }}
    >
      {item.side === 'left' && (
        <motion.div style={{ opacity: arrowOpacity, x: arrowXLeft }} className="hidden sm:block">
          <ArrowLeft className="w-8 h-8 sm:w-12 sm:h-12 text-slate-900" />
        </motion.div>
      )}

      <motion.h2
        style={{ color }}
        className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight transition-colors duration-200"
      >
        {item.name}
      </motion.h2>

      {item.side === 'right' && (
        <motion.div style={{ opacity: arrowOpacity, x: arrowXRight }} className="hidden sm:block">
          <ArrowRight className="w-8 h-8 sm:w-12 sm:h-12 text-slate-900" />
        </motion.div>
      )}
    </motion.div>
  )
}

export function Integrations({ id = 'integracoes' }: { id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 })
  const listY = useTransform(smoothProgress, [0, 1], ['25vh', '-35vh'])

  return (
    <section
      ref={containerRef}
      id={id}
      className="relative bg-white h-[300vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-white">

        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 bg-white" aria-hidden="true" />
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#f4ece3] blur-[100px] opacity-40 pointer-events-none" />

        {/* Small Intro Text */}
        <div className="absolute top-24 left-0 w-full text-center px-4 z-10">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary-500 mb-3">Conectividade</p>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Integre tudo o que você já usa e automatize sua operação através do
          </p>
        </div>

        {/* The Central Scrolling List */}
        <div className="relative w-full max-w-4xl px-4 flex justify-center items-center h-full z-20">
          <motion.div
            ref={containerRef}
            className="flex flex-col items-center gap-6 sm:gap-10 transition-transform"
          >
            {INTEGRATIONS.map((item, index) => (
              <IntegrationItem
                key={item.id}
                item={item}
                index={index}
                totalItems={INTEGRATIONS.length}
                smoothProgress={smoothProgress}
              />
            ))}
          </motion.div>
        </div>

        {/* Structured Side Panels for Images */}
        <div className="absolute inset-0 pointer-events-none z-30 hidden sm:block">
          {INTEGRATIONS.map((item, index) => (
            <IntegrationImage
              key={`img-${item.id}`}
              item={item}
              index={index}
              totalItems={INTEGRATIONS.length}
              smoothProgress={smoothProgress}
            />
          ))}
        </div>

      </div>
    </section>
  )
}