'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface LegalSectionProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * LegalSection - Section component for legal content
 * 
 * All legal pages share the same reading experience.
 */
export function LegalSection({
  id,
  title,
  children,
  className,
}: LegalSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('scroll-mt-24', className)}
    >
      {/* Section Title */}
      <h2 className="text-xl font-bold text-white mb-4 lg:text-2xl">
        {title}
      </h2>

      {/* Content */}
      <div className={cn(
        'prose prose-invert prose-sm max-w-none',
        'prose-headings:text-white prose-headings:font-semibold',
        'prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3',
        'prose-p:text-white/60 prose-p:leading-relaxed',
        'prose-li:text-white/60',
        'prose-strong:text-white/80 prose-strong:font-medium',
        'prose-a:text-secondary-400 prose-a:no-underline hover:prose-a:text-secondary-300',
        '[&>*:first-child]:mt-0'
      )}>
        {children}
      </div>
    </motion.section>
  )
}