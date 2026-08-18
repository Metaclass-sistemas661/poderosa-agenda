'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type ColumnsType = 1 | 2 | 3 | 4 | 'auto-fit' | 'auto-fill'
type GapType = 'sm' | 'md' | 'lg' | 'xl'

interface PageGridProps {
  children: React.ReactNode
  columns?: ColumnsType
  gap?: GapType
  responsive?: boolean
  className?: string
  animate?: boolean
  staggerDelay?: number
}

const columnClasses: Record<number | string, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  'auto-fit': 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
}

const gapClasses: Record<GapType, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-10',
}

/**
 * PageGrid - Shared responsive grid component
 * 
 * Responsibilities:
 * - Responsive grid
 * - Consistent spacing
 * - Alignment
 * - Reusability
 */
export function PageGrid({
  children,
  columns = 3,
  gap = 'md',
  responsive = true,
  className,
  animate = true,
  staggerDelay = 0.1,
}: PageGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = animate && isInView && !prefersReducedMotion

  const columnClass = responsive
    ? columnClasses[columns]
    : typeof columns === 'number'
    ? `grid-cols-${columns}`
    : columnClasses[columns]

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'grid',
        columnClass,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/**
 * PageGridItem - Grid item with optional animation
 */
interface PageGridItemProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function PageGridItem({
  children,
  className,
  delay = 0,
}: PageGridItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}