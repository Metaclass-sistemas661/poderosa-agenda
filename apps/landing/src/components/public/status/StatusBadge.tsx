'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, AlertTriangle, XCircle, Clock, Minus } from 'lucide-react'

type StatusType = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown'
type SizeType = 'sm' | 'md' | 'lg'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: SizeType
  showIcon?: boolean
  pulse?: boolean
  className?: string
}

const statusConfig: Record<StatusType, {
  label: string
  icon: typeof CheckCircle
  dotColor: string
  badgeColor: string
}> = {
  operational: {
    label: 'Operacional',
    icon: CheckCircle,
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  degraded: {
    label: 'Degradado',
    icon: AlertTriangle,
    dotColor: 'bg-amber-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  outage: {
    label: 'Indisponível',
    icon: XCircle,
    dotColor: 'bg-red-500',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
  },
  maintenance: {
    label: 'Manutenção',
    icon: Clock,
    dotColor: 'bg-slate-500',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  unknown: {
    label: 'Desconhecido',
    icon: Minus,
    dotColor: 'bg-slate-300',
    badgeColor: 'bg-slate-50 text-slate-500 border-slate-200',
  },
}

const sizeClasses: Record<SizeType, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1 text-sm gap-2',
  lg: 'px-4 py-1.5 text-sm gap-2',
}

/**
 * StatusBadge - Status indicator badge
 */
export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  pulse = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon
  const displayLabel = label || config.label

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeClasses[size],
        config.badgeColor,
        className
      )}
    >
      {showIcon ? (
        <StatusIcon className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
        )} aria-hidden="true" />
      ) : (
        <span className="relative">
          <span className={cn(
            'block rounded-full',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            config.dotColor
          )} />
          {pulse && status === 'operational' && (
            <span className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-50',
              size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
              config.dotColor
            )} />
          )}
        </span>
      )}
      {displayLabel}
    </span>
  )
}