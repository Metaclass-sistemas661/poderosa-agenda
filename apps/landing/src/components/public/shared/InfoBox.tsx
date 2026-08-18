'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'

type VariantType = 'info' | 'tip' | 'warning' | 'note' | 'context'

interface InfoBoxProps {
  children: React.ReactNode
  title?: string
  icon?: LucideIcon
  variant?: VariantType
  className?: string
  animate?: boolean
}

const variantStyles: Record<VariantType, { 
  container: string
  icon: string
  title: string 
}> = {
  info: {
    container: 'bg-secondary-500/5 border-secondary-500/20',
    icon: 'text-secondary-400',
    title: 'text-secondary-300',
  },
  tip: {
    container: 'bg-emerald-500/5 border-emerald-500/20',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  warning: {
    container: 'bg-amber-500/5 border-amber-500/20',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
  note: {
    container: 'bg-white/[0.02] border-white/[0.08]',
    icon: 'text-white/40',
    title: 'text-white/70',
  },
  context: {
    container: 'bg-purple-500/5 border-purple-500/20',
    icon: 'text-purple-400',
    title: 'text-purple-300',
  },
}

/**
 * InfoBox - Reusable block for contextual information
 * 
 * Used for:
 * - Information
 * - Tips
 * - Warnings
 * - Context
 * - Observations
 * 
 * Never use arbitrary divs.
 */
export function InfoBox({
  children,
  title,
  icon: Icon = Info,
  variant = 'info',
  className,
  animate = true,
}: InfoBoxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = animate && isInView && !prefersReducedMotion
  const styles = variantStyles[variant]

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'rounded-xl border p-4',
        styles.container,
        className
      )}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('text-sm font-medium mb-1', styles.title)}>
              {title}
            </p>
          )}
          <div className="text-sm text-white/60 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}