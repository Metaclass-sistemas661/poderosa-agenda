'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'

interface PageIntroProps {
  children: React.ReactNode
  className?: string
}

export function PageIntro({ children, className }: PageIntroProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'mx-auto max-w-3xl',
        'text-center',
        'text-lg text-white/60 leading-relaxed',
        className
      )}
    >
      {children}
    </motion.div>
  )
}