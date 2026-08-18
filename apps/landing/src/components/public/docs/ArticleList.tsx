'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'

interface ArticleListItem {
  title: string
  href: string
  readTime?: string
  isNew?: boolean
}

interface ArticleListProps {
  title?: string
  articles: ArticleListItem[]
  showAll?: {
    label: string
    href: string
  }
  className?: string
}

/**
 * ArticleList - List of documentation articles
 */
export function ArticleList({
  title,
  articles,
  showAll,
  className,
}: ArticleListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion
  const stagger = prefersReducedMotion ? 0 : 0.05

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('space-y-1', className)}
    >
      {/* Title */}
      {title && (
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">
          {title}
        </h3>
      )}

      {/* Articles */}
      <div className="space-y-0.5">
        {articles.map((article, index) => (
          <motion.div
            key={article.href}
            initial={{ opacity: 0, x: -10 }}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{
              duration: 0.4,
              delay: stagger * index,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Link
              href={article.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200',
                'hover:bg-white/[0.04]'
              )}
            >
              <span className="flex-1 text-sm text-white/70 group-hover:text-white transition-colors line-clamp-1">
                {article.title}
              </span>

              {article.isNew && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  NOVO
                </span>
              )}

              {article.readTime && (
                <span className="flex items-center gap-1 text-xs text-white/30 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </span>
              )}

              <ChevronRight className={cn(
                'h-4 w-4 text-white/20 flex-shrink-0',
                'transition-all duration-200',
                'group-hover:text-secondary-400 group-hover:translate-x-0.5'
              )} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Show All Link */}
      {showAll && (
        <div className="pt-3 px-3">
          <Link
            href={showAll.href}
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              'text-secondary-400 hover:text-secondary-300 transition-colors'
            )}
          >
            {showAll.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}