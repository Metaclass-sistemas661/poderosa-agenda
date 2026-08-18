'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface PageSectionProps {
  children: React.ReactNode
  id?: string
  className?: string
  ariaLabelledBy?: string
}

export function PageSection({
  children,
  id,
  className,
  ariaLabelledBy,
}: PageSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.section
      ref={ref}
      id={id}
      aria-labelledby={ariaLabelledBy}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('py-16 lg:py-24', className)}
    >
      {children}
    </motion.section>
  )
}