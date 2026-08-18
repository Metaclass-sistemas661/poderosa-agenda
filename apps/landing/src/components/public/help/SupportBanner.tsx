'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SupportBannerProps {
  icon?: LucideIcon
  title: string
  description: string
  action: {
    label: string
    href: string
  }
  variant?: 'default' | 'highlighted'
  className?: string
}

export function SupportBanner({
  icon: Icon = MessageCircle,
  title,
  description,
  action,
  variant = 'default',
  className,
}: SupportBannerProps) {
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
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 lg:p-8',
        variant === 'highlighted'
          ? 'border border-primary-200 bg-primary-50 shadow-sm'
          : 'border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
        {/* Icon */}
        <div className={cn(
          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
          variant === 'highlighted'
            ? 'bg-primary-100 text-primary-600'
            : 'bg-slate-50 text-slate-400 border border-slate-100'
        )}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            {description}
          </p>

          {/* Action */}
          <Link
            href={action.href}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5',
              'text-sm font-semibold rounded-full',
              'transition-all duration-200',
              variant === 'highlighted'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            )}
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}