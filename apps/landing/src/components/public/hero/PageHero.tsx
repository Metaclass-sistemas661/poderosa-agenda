'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { PageContainer } from '../layout/PageContainer'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeroProps {
  badge?: {
    icon: LucideIcon
    text: string
  }
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function PageHero({
  badge,
  title,
  subtitle,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeroProps) {
  const prefersReducedMotion = useReducedMotion()
  const stagger = prefersReducedMotion ? 0 : 0.08
  const Icon = badge?.icon

  return (
    <section
      aria-labelledby="page-hero-title"
      className={cn(
        'relative overflow-hidden bg-white border-b border-slate-200 py-16 md:py-24',
        className
      )}
    >
      <PageContainer size="default" className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <motion.nav
              aria-label="Breadcrumb"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.4,
                delay: stagger * 0,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-8"
            >
              <ol className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                {breadcrumb.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="transition-colors hover:text-primary-600"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span aria-current="page" className="text-slate-900">
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </motion.nav>
          )}

          {/* Badge */}
          {badge && Icon && (
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: stagger * 1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-semibold"
            >
              <Icon className="w-4 h-4" />
              {badge.text}
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            id="page-hero-title"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.6,
              delay: stagger * 2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight"
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: stagger * 3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-6 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-600"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: stagger * 4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-4 max-w-xl text-base text-slate-500"
            >
              {description}
            </motion.p>
          )}

          {/* Actions */}
          {actions && (
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: stagger * 5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </PageContainer>
    </section>
  )
}