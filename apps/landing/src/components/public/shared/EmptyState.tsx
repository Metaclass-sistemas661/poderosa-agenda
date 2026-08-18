'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { FileX, FolderOpen, Search, FileText, AlertCircle, Inbox } from 'lucide-react'

type VariantType = 'article' | 'category' | 'incident' | 'document' | 'search' | 'content'

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  variant?: VariantType
  className?: string
}

const variantConfig: Record<VariantType, {
  defaultIcon: LucideIcon
  iconColor: string
}> = {
  article: {
    defaultIcon: FileText,
    iconColor: 'text-primary-500',
  },
  category: {
    defaultIcon: FolderOpen,
    iconColor: 'text-amber-500',
  },
  incident: {
    defaultIcon: AlertCircle,
    iconColor: 'text-emerald-500',
  },
  document: {
    defaultIcon: FileX,
    iconColor: 'text-purple-500',
  },
  search: {
    defaultIcon: Search,
    iconColor: 'text-slate-400',
  },
  content: {
    defaultIcon: Inbox,
    iconColor: 'text-slate-300',
  },
}

/**
 * EmptyState - Shared empty state component
 * 
 * Used for:
 * - No articles
 * - No categories
 * - No incidents
 * - No documents
 * - No results
 * - No content
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'content',
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion()
  const config = variantConfig[variant]
  const Icon = icon || config.defaultIcon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      {/* Icon Container */}
      <div className={cn(
        'flex h-16 w-16 items-center justify-center rounded-2xl',
        'bg-slate-50 border border-slate-100 shadow-sm',
        'mb-6'
      )}>
        <Icon className={cn('h-8 w-8', config.iconColor)} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="max-w-sm text-sm text-slate-500 mb-6 font-medium">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className={cn(
              'inline-flex items-center px-4 py-2.5',
              'text-sm font-semibold text-primary-700',
              'rounded-xl border border-primary-200 bg-primary-50',
              'transition-all duration-200',
              'hover:bg-primary-100 hover:border-primary-300 shadow-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50'
            )}
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center px-4 py-2.5',
              'text-sm font-semibold text-primary-700',
              'rounded-xl border border-primary-200 bg-primary-50',
              'transition-all duration-200',
              'hover:bg-primary-100 hover:border-primary-300 shadow-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50'
            )}
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  )
}