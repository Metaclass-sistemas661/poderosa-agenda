'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'

interface DocCardProps {
  title: string
  description?: string
  href: string
  readTime?: string
  category?: string
  isNew?: boolean
  delay?: number
  className?: string
}

/**
 * DocCard - Documentation article card
 */
export function DocCard({
  title,
  description,
  href,
  readTime,
  category,
  isNew = false,
  delay = 0,
  className,
}: DocCardProps) {
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
          'group flex items-start gap-4 p-4',
          'rounded-xl border border-white/[0.06]',
          'bg-gradient-to-br from-white/[0.02] to-transparent',
          'transition-all duration-300 ease-out',
          'hover:border-white/[0.1] hover:bg-white/[0.04]',
          'hover:-translate-y-0.5',
          className
        )}
      >
        {/* Icon */}
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          'border border-white/[0.08] bg-white/[0.04]',
          'transition-colors duration-200',
          'group-hover:border-secondary-500/30 group-hover:bg-secondary-500/10'
        )}>
          <FileText className="h-5 w-5 text-secondary-400" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta line */}
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="text-xs font-medium text-secondary-400/80">
                {category}
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                NOVO
              </span>
            )}
            {readTime && (
              <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
                <Clock className="h-3 w-3" />
                {readTime}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-medium text-white group-hover:text-secondary-300 transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="mt-1 text-sm text-white/50 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className={cn(
          'h-5 w-5 flex-shrink-0 text-white/20 mt-2.5',
          'transition-all duration-200',
          'group-hover:text-secondary-400 group-hover:translate-x-1'
        )} />
      </Link>
    </motion.div>
  )
}