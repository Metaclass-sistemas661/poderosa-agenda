'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock, Minus } from 'lucide-react'

type StatusType = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown'

interface StatusCardProps {
  service: string
  status: StatusType
  lastUpdated?: string
  description?: string
  delay?: number
  className?: string
}

const statusConfig: Record<StatusType, {
  label: string
  icon: typeof CheckCircle
  indicatorColor: string
  badgeColor: string
}> = {
  operational: {
    label: 'Operacional',
    icon: CheckCircle,
    indicatorColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  degraded: {
    label: 'Degradado',
    icon: AlertTriangle,
    indicatorColor: 'bg-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  outage: {
    label: 'Indisponível',
    icon: XCircle,
    indicatorColor: 'bg-red-500',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  maintenance: {
    label: 'Manutenção',
    icon: Clock,
    indicatorColor: 'bg-secondary-500',
    badgeColor: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20',
  },
  unknown: {
    label: 'Desconhecido',
    icon: Minus,
    indicatorColor: 'bg-white/30',
    badgeColor: 'bg-white/[0.06] text-white/50 border-white/[0.08]',
  },
}

/**
 * StatusCard - Card used on Status page
 * 
 * Responsible for:
 * - Service display
 * - Status
 * - Last update
 * - Indicator
 */
export function StatusCard({
  service,
  status,
  lastUpdated,
  description,
  delay = 0,
  className,
}: StatusCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion
  const config = statusConfig[status]
  const StatusIcon = config.icon

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
        'relative flex items-start gap-4 p-5',
        'rounded-xl border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
        'backdrop-blur-xl',
        className
      )}
    >
      {/* Status Indicator */}
      <div className="relative flex-shrink-0 mt-1">
        <span className={cn(
          'block h-3 w-3 rounded-full',
          config.indicatorColor
        )} />
        {/* Pulse animation for operational */}
        {status === 'operational' && (
          <span className={cn(
            'absolute inset-0 h-3 w-3 rounded-full animate-ping',
            config.indicatorColor,
            'opacity-50'
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">
            {service}
          </h3>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1',
            'rounded-full border text-xs font-medium',
            config.badgeColor
          )}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {config.label}
          </span>
        </div>
        
        {description && (
          <p className="mt-2 text-sm text-white/50">
            {description}
          </p>
        )}

        {lastUpdated && (
          <p className="mt-2 text-xs text-white/30">
            Última atualização: {lastUpdated}
          </p>
        )}
      </div>
    </motion.div>
  )
}