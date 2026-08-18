'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface ReadingContainerProps {
  children: React.ReactNode
  className?: string
}

export function ReadingContainer({ children, className }: ReadingContainerProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0 }}
      animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        // Container
        'mx-auto max-w-3xl',
        // Typography - Reading experience
        'prose prose-slate prose-lg',
        // Headings
        'prose-headings:text-slate-900 prose-headings:font-semibold',
        'prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4',
        'prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3',
        // Paragraphs
        'prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4',
        // Links
        'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700',
        // Lists
        'prose-li:text-slate-600 prose-ul:space-y-2 prose-ol:space-y-2',
        // Blockquotes
        'prose-blockquote:border-l-4 prose-blockquote:border-primary-500/50',
        'prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-500',
        // Code
        'prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5',
        'prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-code:text-primary-700',
        // Tables
        'prose-table:border-collapse',
        'prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-3 prose-th:text-left',
        'prose-td:border prose-td:border-slate-200 prose-td:p-3',
        // Strong
        'prose-strong:text-slate-900 prose-strong:font-semibold',
        className
      )}
    >
      {children}
    </motion.article>
  )
}