'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface LegalArticleProps {
  children: React.ReactNode
  className?: string
}

/**
 * LegalArticle - Article wrapper for legal document content
 * 
 * Provides consistent typography and spacing for legal text.
 */
export function LegalArticle({
  children,
  className,
}: LegalArticleProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'space-y-10',
        // Prose styling for legal content
        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-4',
        'lg:[&_h2]:text-2xl',
        '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-3 [&_h3]:mt-6',
        '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-white/90 [&_h4]:mb-2 [&_h4]:mt-4',
        '[&_p]:text-white/60 [&_p]:leading-relaxed [&_p]:mb-4',
        '[&_ul]:space-y-2 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc',
        '[&_ol]:space-y-2 [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal',
        '[&_li]:text-white/60 [&_li]:leading-relaxed',
        '[&_strong]:text-white/80 [&_strong]:font-medium',
        '[&_a]:text-secondary-400 [&_a]:underline-offset-2 [&_a]:hover:text-secondary-300 [&_a]:transition-colors',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-secondary-500/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:text-white/50 [&_blockquote]:italic',
        '[&_table]:w-full [&_table]:border-collapse',
        '[&_th]:text-left [&_th]:text-white/70 [&_th]:font-medium [&_th]:p-3 [&_th]:border-b [&_th]:border-white/[0.08]',
        '[&_td]:text-white/60 [&_td]:p-3 [&_td]:border-b [&_td]:border-white/[0.04]',
        className
      )}
    >
      {children}
    </motion.article>
  )
}