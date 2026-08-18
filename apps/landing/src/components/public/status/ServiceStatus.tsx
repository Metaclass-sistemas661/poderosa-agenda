'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { StatusBadge } from './StatusBadge'

type StatusType = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown'

interface ServiceStatusProps {
  name: string
  status: StatusType
  description?: string
  uptime?: string
  lastChecked?: string
  delay?: number
  className?: string
}

/**
 * ServiceStatus - Individual service status row
 */
export function ServiceStatus({
  name,
  status,
  description,
  uptime,
  lastChecked,
  delay = 0,
  className,
}: ServiceStatusProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 p-4',
        'rounded-xl border border-slate-200',
        'bg-white shadow-sm',
        className
      )}
    >
      {/* Service Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span className={cn(
            'block h-2.5 w-2.5 rounded-full flex-shrink-0',
            status === 'operational' && 'bg-emerald-500',
            status === 'degraded' && 'bg-amber-500',
            status === 'outage' && 'bg-red-500',
            status === 'maintenance' && 'bg-secondary-500',
            status === 'unknown' && 'bg-white/30',
          )} />
          
          <h4 className="text-base font-semibold text-slate-900 truncate">
            {name}
          </h4>
        </div>
        
        {description && (
          <p className="mt-1 text-sm text-slate-500 pl-[22px]">
            {description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 pl-[22px] sm:pl-0">
        {uptime && (
          <span className="text-xs font-medium text-slate-400">
            {uptime} uptime
          </span>
        )}
        {lastChecked && (
          <span className="text-xs font-medium text-slate-400 hidden lg:block">
            {lastChecked}
          </span>
        )}
        <StatusBadge status={status} size="sm" />
      </div>
    </motion.div>
  )
}