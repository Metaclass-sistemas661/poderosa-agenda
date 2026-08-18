'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

type OverallStatusType = 'operational' | 'degraded' | 'outage'

interface OverallStatusProps {
  status: OverallStatusType
  message?: string
  lastUpdated?: string
  className?: string
}

const statusConfig: Record<OverallStatusType, {
  label: string
  icon: typeof CheckCircle
  bgColor: string
  borderColor: string
  textColor: string
  iconColor: string
}> = {
  operational: {
    label: 'Todos os sistemas operacionais',
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900',
    iconColor: 'text-emerald-600',
  },
  degraded: {
    label: 'Alguns sistemas com performance reduzida',
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-600',
  },
  outage: {
    label: 'Sistemas com interrupção ativa',
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
}

/**
 * OverallStatus - Overall system status banner
 */
export function OverallStatus({
  status,
  message,
  lastUpdated,
  className,
}: OverallStatusProps) {
  const prefersReducedMotion = useReducedMotion()
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Glow */}
      <div 
        className={cn(
          'absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-30',
          status === 'operational' && 'bg-emerald-500',
          status === 'degraded' && 'bg-amber-500',
          status === 'outage' && 'bg-red-500',
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div className={cn(
          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
          'bg-white border border-white/50 shadow-sm'
        )}>
          <StatusIcon className={cn('h-7 w-7', config.iconColor)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className={cn('text-lg font-bold', config.textColor)}>
            {message || config.label}
          </h2>
          {lastUpdated && (
            <p className={cn('text-sm mt-1', config.textColor, 'opacity-70')}>
              Última verificação: {lastUpdated}
            </p>
          )}
        </div>

        {/* Pulse dot for operational */}
        {status === 'operational' && (
          <div className="relative flex-shrink-0">
            <span className="block h-4 w-4 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 h-4 w-4 rounded-full bg-emerald-500 animate-ping opacity-50" />
          </div>
        )}
      </div>
    </motion.div>
  )
}