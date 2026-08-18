'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TrendType = 'up' | 'down' | 'neutral'

interface MetricCardProps {
  icon?: LucideIcon
  label: string
  value: string | number
  suffix?: string
  prefix?: string
  description?: string
  trend?: {
    type: TrendType
    value: string
    label?: string
  }
  delay?: number
  className?: string
}

const trendConfig: Record<TrendType, { icon: typeof TrendingUp; color: string }> = {
  up: {
    icon: TrendingUp,
    color: 'text-emerald-600',
  },
  down: {
    icon: TrendingDown,
    color: 'text-red-600',
  },
  neutral: {
    icon: Minus,
    color: 'text-slate-400',
  },
}

/**
 * MetricCard - Card for numbers, indicators, statistics, KPIs
 * 
 * Uses Dark Premium + Glassmorphism + Official patterns
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  prefix,
  description,
  trend,
  delay = 0,
  className,
}: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'relative flex flex-col p-6',
        'rounded-2xl border border-slate-200',
        'bg-white shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Label with optional icon */}
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-slate-500">
            {label}
          </span>
        </div>

        {/* Trend */}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trendConfig[trend.type].color
          )}>
            {(() => {
              const TrendIcon = trendConfig[trend.type].icon
              return <TrendIcon className="h-3 w-3" aria-hidden="true" />
            })()}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-xl font-medium text-slate-500">
            {prefix}
          </span>
        )}
        <motion.span
          initial={{ opacity: 0, scale: 0.95 }}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.6,
            delay: delay + 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-3xl font-bold text-slate-900 lg:text-4xl"
        >
          {value}
        </motion.span>
        {suffix && (
          <span className="text-xl font-medium text-slate-500">
            {suffix}
          </span>
        )}
      </div>

      {/* Description or Trend Label */}
      {(description || trend?.label) && (
        <p className="mt-2 text-sm font-medium text-slate-400">
          {description || trend?.label}
        </p>
      )}
    </motion.div>
  )
}