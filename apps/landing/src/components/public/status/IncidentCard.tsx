'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { StatusBadge } from './StatusBadge'

type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance'
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

interface IncidentUpdate {
  status: IncidentStatus
  message: string
  timestamp: string
}

interface IncidentCardProps {
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  createdAt: string
  resolvedAt?: string
  updates?: IncidentUpdate[]
  affectedServices?: string[]
  delay?: number
  className?: string
}

const severityConfig: Record<IncidentSeverity, {
  badgeColor: string
  borderColor: string
}> = {
  critical: {
    badgeColor: 'bg-red-50 text-red-600 border-red-200',
    borderColor: 'border-l-red-500',
  },
  major: {
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
    borderColor: 'border-l-amber-500',
  },
  minor: {
    badgeColor: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    borderColor: 'border-l-yellow-500',
  },
  maintenance: {
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    borderColor: 'border-l-slate-400',
  },
}

const statusLabels: Record<IncidentStatus, string> = {
  investigating: 'Investigando',
  identified: 'Identificado',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
}

/**
 * IncidentCard - Incident display for Status page
 */
export function IncidentCard({
  title,
  severity,
  status,
  createdAt,
  resolvedAt,
  updates,
  affectedServices,
  delay = 0,
  className,
}: IncidentCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion
  const config = severityConfig[severity]

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
        'rounded-xl border border-slate-200 border-l-4',
        'bg-white shadow-sm',
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>{createdAt}</span>
              {resolvedAt && (
                <>
                  <span>→</span>
                  <span>{resolvedAt}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium',
              config.badgeColor
            )}>
              {severity === 'critical' ? 'Crítico' :
               severity === 'major' ? 'Grave' :
               severity === 'minor' ? 'Menor' : 'Manutenção'}
            </span>
            <StatusBadge
              status={status === 'resolved' ? 'operational' : 'degraded'}
              label={statusLabels[status]}
              size="sm"
            />
          </div>
        </div>

        {/* Affected Services */}
        {affectedServices && affectedServices.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {affectedServices.map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200 font-medium"
              >
                {service}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Updates Timeline */}
      {updates && updates.length > 0 && (
        <div className="border-t border-slate-200 px-5 py-4 bg-slate-50/50 rounded-b-xl">
          <div className="space-y-3">
            {updates.map((update, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn(
                    'block h-2 w-2 rounded-full mt-1.5',
                    index === 0 ? 'bg-primary-500' : 'bg-slate-300'
                  )} />
                  {index < updates.length - 1 && (
                    <span className="w-px h-full bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-700">
                      {statusLabels[update.status]}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {update.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {update.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}