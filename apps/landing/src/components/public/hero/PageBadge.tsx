'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface PageBadgeProps {
  icon: LucideIcon
  text: string
  className?: string
}

export function PageBadge({ icon: Icon, text, className }: PageBadgeProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'inline-flex items-center gap-2',
        'px-4 py-2 rounded-full',
        'bg-white/[0.05] border border-white/[0.08]',
        'backdrop-blur-sm',
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className="h-4 w-4 text-purple-400"
      />
      <span className="text-sm font-medium uppercase tracking-wider text-purple-300/90">
        {text}
      </span>
    </motion.div>
  )
}