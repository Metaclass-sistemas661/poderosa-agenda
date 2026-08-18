'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type AlignType = 'left' | 'center' | 'right'
type GapType = 'sm' | 'md' | 'lg'

interface PageActionsProps {
  children: React.ReactNode
  align?: AlignType
  gap?: GapType
  direction?: 'horizontal' | 'vertical'
  wrap?: boolean
  className?: string
  animate?: boolean
  delay?: number
}

const alignClasses: Record<AlignType, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

const gapClasses: Record<GapType, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
}

/**
 * PageActions - Wrapper for buttons, links, CTAs
 * 
 * Responsibilities:
 * - Buttons
 * - Links
 * - Secondary CTA
 * - Download
 * - External links
 * 
 * Automatic spacing.
 */
export function PageActions({
  children,
  align = 'center',
  gap = 'md',
  direction = 'horizontal',
  wrap = true,
  className,
  animate = true,
  delay = 0,
}: PageActionsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = animate && isInView && !prefersReducedMotion

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row items-center' : 'flex-col items-stretch',
        alignClasses[align],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </motion.div>
  )
}