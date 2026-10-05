'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { motion, useScroll, useSpring } from 'framer-motion'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing padrão refinado
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // Overlays (drawers/modais) são renderizados via portal em <body>, fora do
      // <main data-lenis-prevent>. Sem isso o Lenis captura o wheel/touch e o
      // conteúdo interno não rola. Qualquer dialog é liberado para scroll nativo.
      prevent: (node: HTMLElement) =>
        !!node.closest?.('[data-lenis-prevent],[role="dialog"],[aria-modal="true"]'),
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Framer Motion Scroll Progress Bar
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <>
      {/* Barra de Progresso Super Fina e Elegante no Topo */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-400 to-primary-600 origin-left z-[9999] drop-shadow-md"
        style={{ scaleX }}
      />
      {children}
    </>
  )
}
