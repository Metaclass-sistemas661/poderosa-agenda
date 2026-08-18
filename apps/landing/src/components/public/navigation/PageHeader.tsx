'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'
import { PageContainer } from '../layout/PageContainer'

interface PageHeaderBadge {
  text: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  badge?: PageHeaderBadge
  actions?: React.ReactNode
  icon?: LucideIcon
  className?: string
}

const badgeVariants = {
  default: 'bg-white/[0.06] text-white/60 border-white/[0.08]',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20',
}

/**
 * PageHeader - Institutional page header component
 * 
 * Responsibilities:
 * - Institutional title
 * - Secondary actions
 * - Breadcrumb
 * - Optional badges
 * 
 * NOTE: This component does NOT replace the Hero.
 * It complements more complex pages.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  badge,
  actions,
  icon: Icon,
  className,
}: PageHeaderProps) {
  const prefersReducedMotion = useReducedMotion()
  const stagger = prefersReducedMotion ? 0 : 0.08

  return (
    <header
      className={cn(
        'relative border-b border-white/[0.06]',
        'bg-[#09090b]',
        'py-8 lg:py-12',
        className
      )}
    >
      <PageContainer size="default" className="relative z-10">
        <div className="flex flex-col gap-4">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.4,
                delay: stagger * 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Breadcrumb items={breadcrumb} />
            </motion.div>
          )}

          {/* Title Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Icon */}
              {Icon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    delay: stagger * 1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center',
                    'rounded-xl border border-white/[0.08] bg-white/[0.04]'
                  )}
                >
                  <Icon className="h-6 w-6 text-secondary-400" />
                </motion.div>
              )}

              <div className="flex flex-col gap-2">
                {/* Title with Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    delay: stagger * 2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {title}
                  </h1>
                  
                  {badge && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5',
                        'rounded-full border text-xs font-medium',
                        badgeVariants[badge.variant || 'default']
                      )}
                    >
                      {badge.text}
                    </span>
                  )}
                </motion.div>

                {/* Subtitle */}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.4,
                      delay: stagger * 3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="text-base text-white/50"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Actions */}
            {actions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: stagger * 4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-wrap items-center gap-3"
              >
                {actions}
              </motion.div>
            )}
          </div>
        </div>
      </PageContainer>
    </header>
  )
}