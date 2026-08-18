'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type SizeType = 'sm' | 'md' | 'lg' | 'xl'

interface SectionTitleBadge {
  text: string
  variant?: 'default' | 'success' | 'warning' | 'info'
}

interface SectionTitleProps {
  title: string
  subtitle?: string
  badge?: SectionTitleBadge
  as?: HeadingLevel
  size?: SizeType
  align?: 'left' | 'center' | 'right'
  id?: string
  className?: string
  animate?: boolean
}

const sizeClasses: Record<SizeType, { heading: string; subtitle: string }> = {
  sm: {
    heading: 'text-lg font-semibold sm:text-xl',
    subtitle: 'text-sm',
  },
  md: {
    heading: 'text-xl font-bold sm:text-2xl',
    subtitle: 'text-base',
  },
  lg: {
    heading: 'text-2xl font-bold sm:text-3xl lg:text-4xl',
    subtitle: 'text-base sm:text-lg',
  },
  xl: {
    heading: 'text-3xl font-bold sm:text-4xl lg:text-5xl',
    subtitle: 'text-lg sm:text-xl',
  },
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

const badgeVariants = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-primary-50 text-primary-700 border-primary-200',
}

/**
 * SectionTitle - Official section heading component
 * 
 * Responsibilities:
 * - Heading
 * - Subtitle
 * - Optional badge
 * 
 * Used in ALL pages.
 * Never create isolated headings.
 */
export function SectionTitle({
  title,
  subtitle,
  badge,
  as: Heading = 'h2',
  size = 'lg',
  align = 'center',
  id,
  className,
  animate = true,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = animate && isInView && !prefersReducedMotion
  const stagger = prefersReducedMotion ? 0 : 0.1

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-3 max-w-3xl',
        alignClasses[align],
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <motion.span
          initial={animate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.4,
            delay: stagger * 0,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            'inline-flex items-center self-center px-3 py-1',
            'rounded-full border text-xs font-medium',
            badgeVariants[badge.variant || 'default']
          )}
        >
          {badge.text}
        </motion.span>
      )}

      {/* Heading */}
      <motion.div
        initial={animate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{
          duration: 0.5,
          delay: stagger * 1,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Heading
          id={id}
          className={cn(
            sizeClasses[size].heading,
            'text-slate-900'
          )}
        >
          {title}
        </Heading>
      </motion.div>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={animate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.5,
            delay: stagger * 2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            sizeClasses[size].subtitle,
            'text-slate-500'
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}