'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { PlayCircle, UserPlus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function Hero() {
  const [activeVideo, setActiveVideo] = useState(0)
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const video3Ref = useRef<HTMLVideoElement>(null)
  const shouldReduce = useReducedMotion()

  const handleVideo1End = () => {
    setActiveVideo(1)
    if (video2Ref.current) {
      video2Ref.current.currentTime = 0
      video2Ref.current.play().catch(console.error)
    }
  }

  const handleVideo2End = () => {
    setActiveVideo(2)
    if (video3Ref.current) {
      video3Ref.current.currentTime = 0
      video3Ref.current.play().catch(console.error)
    }
  }

  const handleVideo3End = () => {
    setActiveVideo(0)
    if (video1Ref.current) {
      video1Ref.current.currentTime = 0
      video1Ref.current.play().catch(console.error)
    }
  }

  // Autoplay first video on mount
  useEffect(() => {
    if (video1Ref.current) {
      video1Ref.current.play().catch(console.error)
    }
  }, [])

  return (
    <section
      aria-labelledby="hero-headline"
      className="relative min-h-screen flex items-center overflow-hidden bg-black"
    >
      {/* ── Background Videos Container ── */}
      <div className="absolute inset-0 bg-black">
        {/* ── Background Video 1 ──────────────────────────────────────────── */}
        <video 
          ref={video1Ref}
          muted 
          playsInline
          preload="auto"
          onEnded={handleVideo1End}
          className={cn(
            "absolute inset-0 object-cover w-full h-full scale-105 transition-opacity duration-[1500ms]",
            activeVideo === 0 ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <source src="/primeiro-hero.mp4" type="video/mp4" />
        </video>

        {/* ── Background Video 2 ──────────────────────────────────────────── */}
        <video 
          ref={video2Ref}
          muted 
          playsInline
          preload="auto"
          onEnded={handleVideo2End}
          className={cn(
            "absolute inset-0 object-cover w-full h-full scale-105 transition-opacity duration-[1500ms]",
            activeVideo === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <source src="/segundo-hero-section.mp4" type="video/mp4" />
        </video>

        {/* ── Background Video 3 ──────────────────────────────────────────── */}
        <video 
          ref={video3Ref}
          muted 
          playsInline
          preload="auto"
          onEnded={handleVideo3End}
          className={cn(
            "absolute inset-0 object-cover w-full h-full scale-105 transition-opacity duration-[1500ms]",
            activeVideo === 2 ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <source src="/terceiro-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ── Dark Gradient Overlay for Text Readability ──────────────────────────── */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 z-20 pointer-events-none"
      />

      {/* ── Content (Bottom Left aligned like GlossGenius) ─────────────────────────────────────────────── */}
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
            Gestão completa para o seu salão de beleza.
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