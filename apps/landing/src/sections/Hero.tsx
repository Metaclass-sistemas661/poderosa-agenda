'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { PlayCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Inverted order as requested: Micro -> Lash -> Nail -> Quarto
const VIDEOS = [
  '/micropigmentação-hero.mp4',
  '/lash-designer.mp4',
  '/nail-designer.mp4',
  '/beauty-quarto-video.mp4'
]

const TRANSITION_DURATION = 1500; // 1.5s crossfade in CSS

export function Hero() {
  const shouldReduce = useReducedMotion()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A')
  
  // Players start with video 0 and video 1
  const [srcA, setSrcA] = useState(VIDEOS[0])
  const [srcB, setSrcB] = useState(VIDEOS[1])

  const playerARef = useRef<HTMLVideoElement>(null)
  const playerBRef = useRef<HTMLVideoElement>(null)

  const handleEnded = () => {
    // Graceful fallback for reduced motion: just loop the current video
    if (shouldReduce) {
      const currentVid = activePlayer === 'A' ? playerARef.current : playerBRef.current
      if (currentVid) {
        currentVid.currentTime = 0
        currentVid.play().catch(() => {})
      }
      return
    }

    const nextIndex = (currentIndex + 1) % VIDEOS.length
    setCurrentIndex(nextIndex)
    setActivePlayer(prev => prev === 'A' ? 'B' : 'A')
  }

  // Preload the next video in the background player AFTER the crossfade completes
  useEffect(() => {
    if (shouldReduce) return;
    
    const timer = setTimeout(() => {
      const preloadIndex = (currentIndex + 1) % VIDEOS.length
      if (activePlayer === 'A') {
        // Player B is now hidden, we can safely swap its source to the next one
        setSrcB(VIDEOS[preloadIndex])
      } else {
        // Player A is now hidden, swap its source
        setSrcA(VIDEOS[preloadIndex])
      }
    }, TRANSITION_DURATION)

    return () => clearTimeout(timer)
  }, [currentIndex, activePlayer, shouldReduce])

  // Play the newly active player
  useEffect(() => {
    const currentVid = activePlayer === 'A' ? playerARef.current : playerBRef.current
    if (currentVid) {
      // In reduced motion, we only play on mount and it loops via handleEnded
      currentVid.play().catch(console.error)
    }
  }, [activePlayer])

  return (
    <section
      aria-labelledby="hero-headline"
      className="relative min-h-screen flex items-center overflow-hidden bg-black"
    >
      {/* ── Background Videos Container (Double-Buffer) ── */}
      <div className="absolute inset-0 bg-black">
        {/* Player A */}
        <video 
          ref={playerARef}
          src={srcA}
          muted 
          playsInline
          preload="auto"
          onEnded={handleEnded}
          className={cn(
            "absolute inset-0 object-cover object-center w-full h-full scale-105 transition-opacity duration-[1500ms]",
            activePlayer === 'A' ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        />

        {/* Player B */}
        <video 
          ref={playerBRef}
          src={srcB}
          muted 
          playsInline
          preload="auto"
          onEnded={handleEnded}
          className={cn(
            "absolute inset-0 object-cover object-center w-full h-full scale-105 transition-opacity duration-[1500ms]",
            activePlayer === 'B' ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        />
      </div>

      {/* ── Dark Gradient Overlay for Text Readability ──────────────────────────── */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none"
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 z-30 w-full px-6 md:px-12 lg:px-20 pb-12 lg:pb-16">
        <div className="max-w-4xl">
          {/* Headline */}
          <motion.h1
            id="hero-headline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl lg:text-6xl font-display font-semibold text-white leading-[1.05] tracking-tight mb-6"
          >
            Gestão completa para o seu negócio de beleza.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg lg:text-xl text-white/80 font-medium max-w-2xl mb-10 leading-relaxed"
          >
            Automatize seus agendamentos, acabe com as faltas surpresas e tenha o controle do caixa na palma da mão.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link href="#demonstracao">
              <Button
                size="lg"
                className="bg-primary-500 hover:bg-primary-600 text-white border-0 rounded-full px-8 py-6 text-base font-bold transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Ver demonstração
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Bouncing Scroll Arrow ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 hidden md:block"
      >
        <button 
          onClick={() => {
            const el = document.getElementById('problema');
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top: y, behavior: 'instant' });
            }
          }}
          aria-label="Rolar para baixo"
          className="focus:outline-none"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronDown className="w-8 h-8 text-white/70" />
          </motion.div>
        </button>
      </motion.div>
    </section>
  )
}