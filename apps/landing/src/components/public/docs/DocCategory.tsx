'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DocCategoryProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  docCount?: number
  delay?: number
  className?: string
}

/**
 * DocCategory - Documentation category card
 */
export function DocCategory({
  icon: Icon,
  title,
  description,
  href,
  docCount,
  delay = 0,
  className,
}: DocCategoryProps) {
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
          'group relative flex flex-col h-full p-6',
          'rounded-2xl border border-white/[0.06]',
          'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
          'backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          'hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20',
          'hover:-translate-y-0.5',
          className
        )}
      >
        {/* Icon */}
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          'border border-white/[0.08] bg-white/[0.04]',
          'mb-4 transition-colors duration-200',
          'group-hover:border-secondary-500/30 group-hover:bg-secondary-500/10'
        )}>
          <Icon className="h-6 w-6 text-secondary-400" aria-hidden="true" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-secondary-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed flex-1">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          {docCount !== undefined && (
            <span className="text-xs text-white/40">
              {docCount} {docCount === 1 ? 'documento' : 'documentos'}
            </span>
          )}
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            'text-secondary-400 transition-colors duration-200',
            'group-hover:text-secondary-300',
            docCount === undefined && 'ml-auto'
          )}>
            <span>Ver docs</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}