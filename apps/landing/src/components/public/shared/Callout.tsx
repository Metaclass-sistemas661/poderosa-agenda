'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  MessageCircle 
} from 'lucide-react'

type VariantType = 'info' | 'success' | 'warning' | 'error' | 'neutral'

interface CalloutProps {
  children: React.ReactNode
  title?: string
  icon?: LucideIcon
  variant?: VariantType
  className?: string
  animate?: boolean
}

const variantConfig: Record<VariantType, { 
  container: string
  iconBg: string
  icon: string
  title: string
  defaultIcon: LucideIcon
}> = {
  info: {
    container: 'border-secondary-500/30 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5',
    iconBg: 'bg-secondary-500/20',
    icon: 'text-secondary-400',
    title: 'text-secondary-300',
    defaultIcon: Info,
  },
  success: {
    container: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/20',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
    defaultIcon: CheckCircle,
  },
  warning: {
    container: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5',
    iconBg: 'bg-amber-500/20',
    icon: 'text-amber-400',
    title: 'text-amber-300',
    defaultIcon: AlertTriangle,
  },
  error: {
    container: 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5',
    iconBg: 'bg-red-500/20',
    icon: 'text-red-400',
    title: 'text-red-300',
    defaultIcon: XCircle,
  },
  neutral: {
    container: 'border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02]',
    iconBg: 'bg-white/10',
    icon: 'text-white/50',
    title: 'text-white/80',
    defaultIcon: MessageCircle,
  },
}

/**
 * Callout - Reusable callout component
 * 
 * Supports:
 * - Info
 * - Success
 * - Warning
 * - Error
 * - Neutral
 * 
 * All using official tokens.
 */
export function Callout({
  children,
  title,
  icon,
  variant = 'info',
  className,
  animate = true,
}: CalloutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = animate && isInView && !prefersReducedMotion
  const config = variantConfig[variant]
  const Icon = icon || config.defaultIcon

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      role="alert"
      className={cn(
        'relative overflow-hidden rounded-xl border p-5',
        config.container,
        className
      )}
    >
      {/* Decorative glow */}
      <div 
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{
          background: variant === 'info' ? 'rgb(var(--secondary-500))' :
                     variant === 'success' ? 'rgb(16 185 129)' :
                     variant === 'warning' ? 'rgb(245 158 11)' :
                     variant === 'error' ? 'rgb(239 68 68)' :
                     'rgb(255 255 255 / 0.1)'
        }}
        aria-hidden="true"
      />

      <div className="relative flex gap-4">
        {/* Icon */}
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          config.iconBg
        )}>
          <Icon className={cn('h-5 w-5', config.icon)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-base font-semibold mb-1', config.title)}>
              {title}
            </h4>
          )}
          <div className="text-sm text-white/60 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}