'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'

interface LegalTOCItem {
  id: string
  title: string
  level?: number
}

interface LegalTOCProps {
  items: LegalTOCItem[]
  activeItem?: string
  title?: string
  className?: string
}

/**
 * LegalTOC - Table of Contents for legal documents
 */
export function LegalTOC({
  items,
  activeItem,
  title = 'Sumário',
  className,
}: LegalTOCProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      aria-label="Sumário do documento"
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] p-5',
        className
      )}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-4">
        {title}
      </h3>

      {/* Items */}
      <ol className="space-y-1">
        {items.map((item, index) => {
          const isActive = activeItem === item.id
          const level = item.level || 1

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'flex items-baseline gap-2 py-1.5 text-sm rounded-md px-2 -mx-2',
                  'transition-all duration-200',
                  level === 2 && 'pl-6',
                  level === 3 && 'pl-10',
                  isActive
                    ? 'text-secondary-400 bg-secondary-500/5 font-medium'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/[0.02]'
                )}
              >
                <span className={cn(
                  'text-xs font-medium flex-shrink-0',
                  isActive ? 'text-secondary-400' : 'text-white/30'
                )}>
                  {index + 1}.
                </span>
                <span className="line-clamp-1">{item.title}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </motion.nav>
  )
}