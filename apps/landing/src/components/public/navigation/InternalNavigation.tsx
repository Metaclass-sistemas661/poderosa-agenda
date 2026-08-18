'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

export interface InternalNavigationItem {
  id: string
  label: string
  href?: string
}

interface InternalNavigationProps {
  items: InternalNavigationItem[]
  activeItem?: string
  orientation?: 'horizontal' | 'vertical'
  sticky?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * InternalNavigation - Section navigation component
 * 
 * Responsibilities:
 * - Navigation between sections
 * - Internal links
 * - Anchors
 * - Sticky navigation when necessary
 */
export function InternalNavigation({
  items,
  activeItem,
  orientation = 'horizontal',
  sticky = false,
  className,
  'aria-label': ariaLabel = 'Navegação interna',
}: InternalNavigationProps) {
  const prefersReducedMotion = useReducedMotion()

  const isVertical = orientation === 'vertical'

  return (
    <motion.nav
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        sticky && 'sticky top-20 z-40',
        className
      )}
    >
      <ul
        className={cn(
          'flex',
          isVertical ? 'flex-col gap-1' : 'flex-wrap items-center gap-1',
          !isVertical && [
            'rounded-xl border border-white/[0.06] bg-white/[0.02] p-1',
            'backdrop-blur-xl',
          ]
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        {items.map((item) => {
          const isActive = activeItem === item.id
          const href = item.href || `#${item.id}`

          return (
            <li key={item.id} role="presentation">
              <Link
                href={href}
                role="tab"
                aria-selected={isActive}
                aria-controls={item.id}
                className={cn(
                  'relative block px-4 py-2 text-sm font-medium',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50',
                  isVertical ? 'rounded-lg' : 'rounded-lg',
                  isActive
                    ? [
                        'text-white',
                        !isVertical && 'bg-white/[0.08]',
                        isVertical && 'bg-white/[0.06] border-l-2 border-secondary-500',
                      ]
                    : [
                        'text-white/50',
                        'hover:text-white/70 hover:bg-white/[0.04]',
                      ]
                )}
              >
                {item.label}
                
                {/* Active indicator for horizontal */}
                {isActive && !isVertical && (
                  <motion.span
                    layoutId="internal-nav-indicator"
                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                    style={{ zIndex: -1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}