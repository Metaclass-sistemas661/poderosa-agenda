'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface InfoCardProps {
  icon?: LucideIcon
  title: string
  description: string
  href?: string
  action?: {
    label: string
    onClick?: () => void
  }
  delay?: number
  className?: string
}

/**
 * InfoCard - Card for explanations, benefits, information, institutional content
 * 
 * Uses Dark Premium + Glassmorphism + Official patterns
 */
export function InfoCard({
  icon: Icon,
  title,
  description,
  href,
  action,
  delay = 0,
  className,
}: InfoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  const cardContent = (
    <>
      {/* Icon */}
      {Icon && (
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          'border border-white/[0.08] bg-white/[0.04]',
          'mb-4 transition-colors duration-200',
          'group-hover:border-secondary-500/30 group-hover:bg-secondary-500/10'
        )}>
          <Icon className="h-6 w-6 text-secondary-400" aria-hidden="true" />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed mb-4">
        {description}
      </p>

      {/* Action */}
      {(href || action) && (
        <div className={cn(
          'mt-auto flex items-center gap-1.5 text-sm font-medium',
          'text-secondary-400 transition-colors duration-200',
          'group-hover:text-secondary-300'
        )}>
          <span>{action?.label || 'Saiba mais'}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </>
  )

  const cardClasses = cn(
    'group relative flex flex-col p-6',
    'rounded-2xl border border-white/[0.06]',
    'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
    'backdrop-blur-xl',
    'transition-all duration-300 ease-out',
    'hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20',
    'hover:-translate-y-0.5',
    className
  )

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
    >
      {href ? (
        <Link href={href} className={cardClasses}>
          {cardContent}
        </Link>
      ) : action?.onClick ? (
        <button type="button" onClick={action.onClick} className={cn(cardClasses, 'text-left w-full')}>
          {cardContent}
        </button>
      ) : (
        <div className={cardClasses}>
          {cardContent}
        </div>
      )}
    </motion.div>
  )
}