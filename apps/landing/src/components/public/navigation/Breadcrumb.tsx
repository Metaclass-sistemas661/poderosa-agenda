'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Breadcrumb - Official hierarchical navigation component
 * 
 * Responsibilities:
 * - Indicate page location
 * - Improve UX
 * - Improve SEO
 * - Improve accessibility
 * 
 * Rules:
 * - Last item is not clickable
 * - Discrete separators
 * - Responsive
 * - aria-label required
 * - navigation landmark required
 */
export function Breadcrumb({
  items,
  showHome = true,
  className,
  'aria-label': ariaLabel = 'Navegação de migalhas',
}: BreadcrumbProps) {
  const prefersReducedMotion = useReducedMotion()

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : items

  return (
    <motion.nav
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('flex items-center', className)}
    >
      <ol
        className="flex flex-wrap items-center gap-1.5 text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isHome = index === 0 && showHome

          return (
            <li
              key={index}
              className="flex items-center gap-1.5"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 flex-shrink-0 text-white/30"
                  aria-hidden="true"
                />
              )}
              
              {isLast ? (
                <span
                  aria-current="page"
                  itemProp="name"
                  className="font-medium text-white/70"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  itemProp="item"
                  className={cn(
                    'inline-flex items-center gap-1.5 text-white/40',
                    'transition-colors duration-200',
                    'hover:text-white/60',
                    'focus:outline-none focus:text-white/60',
                    'focus-visible:ring-2 focus-visible:ring-secondary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] rounded'
                  )}
                >
                  {isHome && (
                    <Home className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span itemProp="name">{isHome ? '' : item.label}</span>
                </Link>
              ) : (
                <span itemProp="name" className="text-white/40">
                  {item.label}
                </span>
              )}
              
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          )
        })}
      </ol>
    </motion.nav>
  )
}