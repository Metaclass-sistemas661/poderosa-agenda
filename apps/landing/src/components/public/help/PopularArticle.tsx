'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface PopularArticleProps {
  title: string
  href: string
  views?: number
  category?: string
  index?: number
  delay?: number
  className?: string
}

/**
 * PopularArticle - Popular article item for Help Center
 * 
 * Components only - no content implementation
 */
export function PopularArticle({
  title,
  href,
  views,
  category,
  index,
  delay = 0,
  className,
}: PopularArticleProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-3 py-3',
          'border-b border-white/[0.04] last:border-b-0',
          'transition-colors duration-200',
          'hover:bg-white/[0.02]',
          className
        )}
      >
        {/* Index/Ranking */}
        {index !== undefined && (
          <span className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center',
            'rounded text-xs font-semibold',
            index < 3
              ? 'bg-secondary-500/20 text-secondary-400'
              : 'bg-white/[0.06] text-white/40'
          )}>
            {index + 1}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">
            {title}
          </p>
          {category && (
            <span className="text-xs text-white/40 mt-0.5">
              {category}
            </span>
          )}
        </div>

        {/* Views or Arrow */}
        {views !== undefined ? (
          <div className="flex items-center gap-1 text-xs text-white/30">
            <TrendingUp className="h-3 w-3" />
            <span>{views.toLocaleString()}</span>
          </div>
        ) : (
          <ChevronRight className={cn(
            'h-4 w-4 text-white/20',
            'transition-all duration-200',
            'group-hover:text-secondary-400 group-hover:translate-x-0.5'
          )} />
        )}
      </Link>
    </motion.div>
  )
}