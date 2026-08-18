'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface HelpCategoryProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  articleCount?: number
  delay?: number
  className?: string
}

/**
 * HelpCategory - Category component for Help Center
 * 
 * Components only - no content implementation
 */
export function HelpCategory({
  icon: Icon,
  title,
  description,
  href,
  articleCount,
  delay = 0,
  className,
}: HelpCategoryProps) {
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
        {/* Icon Container */}
        <div className={cn(
          'flex h-14 w-14 items-center justify-center rounded-xl',
          'border border-secondary-500/20 bg-secondary-500/10',
          'mb-5 transition-all duration-200',
          'group-hover:border-secondary-500/30 group-hover:bg-secondary-500/15'
        )}>
          <Icon className="h-7 w-7 text-secondary-400" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-secondary-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
          {articleCount !== undefined && (
            <span className="text-xs text-white/40">
              {articleCount} {articleCount === 1 ? 'artigo' : 'artigos'}
            </span>
          )}
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            'text-secondary-400 transition-colors duration-200',
            'group-hover:text-secondary-300',
            articleCount === undefined && 'ml-auto'
          )}>
            <span>Explorar</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}