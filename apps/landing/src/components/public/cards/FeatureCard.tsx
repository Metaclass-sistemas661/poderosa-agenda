'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

interface FeatureCardProps {
  icon?: LucideIcon
  title: string
  description: string
  features?: string[]
  highlighted?: boolean
  delay?: number
  className?: string
}

/**
 * FeatureCard - Card for features, advantages, benefits, lists
 * 
 * Uses Dark Premium + Glassmorphism + Official patterns
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  highlighted = false,
  delay = 0,
  className,
}: FeatureCardProps) {
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
      className={cn(
        'relative flex flex-col p-6',
        'rounded-2xl border',
        highlighted
          ? 'border-secondary-500/30 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5'
          : 'border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
        'backdrop-blur-xl',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:shadow-black/20',
        'hover:-translate-y-0.5',
        className
      )}
    >
      {/* Highlighted badge */}
      {highlighted && (
        <div className="absolute -top-3 left-6">
          <span className={cn(
            'inline-flex items-center px-3 py-1',
            'rounded-full border border-secondary-500/30 bg-secondary-500/20',
            'text-xs font-medium text-secondary-300'
          )}>
            Destaque
          </span>
        </div>
      )}

      {/* Icon */}
      {Icon && (
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          highlighted
            ? 'border border-secondary-500/30 bg-secondary-500/20'
            : 'border border-white/[0.08] bg-white/[0.04]',
          'mb-4 transition-colors duration-200'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            highlighted ? 'text-secondary-300' : 'text-secondary-400'
          )} aria-hidden="true" />
        </div>
      )}

      {/* Title */}
      <h3 className={cn(
        'text-lg font-semibold mb-2',
        highlighted ? 'text-white' : 'text-white'
      )}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed mb-4">
        {description}
      </p>

      {/* Features List */}
      {features && features.length > 0 && (
        <ul className="mt-auto space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className={cn(
                'h-4 w-4 flex-shrink-0 mt-0.5',
                highlighted ? 'text-secondary-400' : 'text-emerald-400'
              )} />
              <span className="text-sm text-white/70">{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}