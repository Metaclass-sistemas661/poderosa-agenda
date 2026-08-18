'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'

interface LegalCardProps {
  icon?: LucideIcon
  title: string
  description: string
  href: string
  lastUpdated?: string
  delay?: number
  className?: string
}

/**
 * LegalCard - Card used on legal pages
 * 
 * Never create specific cards for each page.
 * Uses Dark Premium + Glassmorphism + Official patterns
 */
export function LegalCard({
  icon: Icon = FileText,
  title,
  description,
  href,
  lastUpdated,
  delay = 0,
  className,
}: LegalCardProps) {
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
    >
      <Link
        href={href}
        className={cn(
          'group flex flex-col p-6',
          'rounded-2xl border border-white/[0.06]',
          'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
          'backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          'hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20',
          'hover:-translate-y-0.5',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            'border border-white/[0.08] bg-white/[0.04]',
            'transition-colors duration-200',
            'group-hover:border-secondary-500/30 group-hover:bg-secondary-500/10'
          )}>
            <Icon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white group-hover:text-secondary-300 transition-colors">
              {title}
            </h3>
            {lastUpdated && (
              <p className="text-xs text-white/40 mt-1">
                Atualizado: {lastUpdated}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed flex-1">
          {description}
        </p>

        {/* Action */}
        <div className={cn(
          'mt-4 pt-4 border-t border-white/[0.06]',
          'flex items-center justify-between'
        )}>
          <span className={cn(
            'text-sm font-medium text-secondary-400',
            'group-hover:text-secondary-300 transition-colors'
          )}>
            Ler documento
          </span>
          <ChevronRight className={cn(
            'h-4 w-4 text-secondary-400',
            'transition-transform duration-200 group-hover:translate-x-1'
          )} />
        </div>
      </Link>
    </motion.div>
  )
}