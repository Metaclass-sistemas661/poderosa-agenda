'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface QuickStartStep {
  number: number
  title: string
  description: string
  href?: string
}

interface QuickStartProps {
  title?: string
  description?: string
  icon?: LucideIcon
  steps: QuickStartStep[]
  className?: string
}

/**
 * QuickStart - Quick start guide component for documentation
 */
export function QuickStart({
  title = 'Início Rápido',
  description,
  icon: Icon = Zap,
  steps,
  className,
}: QuickStartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion
  const stagger = prefersReducedMotion ? 0 : 0.1

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
        'border border-secondary-500/20 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5',
        'backdrop-blur-xl',
        className
      )}
    >
      {/* Glow */}
      <div 
        className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-secondary-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500/20 border border-secondary-500/30">
            <Icon className="h-5 w-5 text-secondary-300" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white/50">{description}</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mt-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -10 }}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{
                duration: 0.4,
                delay: stagger * (index + 1),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {step.href ? (
                <Link
                  href={step.href}
                  className={cn(
                    'group flex items-start gap-4 p-3 -mx-3 rounded-xl',
                    'transition-colors duration-200',
                    'hover:bg-white/[0.04]'
                  )}
                >
                  <StepContent step={step} />
                </Link>
              ) : (
                <div className="flex items-start gap-4 p-3 -mx-3">
                  <StepContent step={step} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function StepContent({ step }: { step: QuickStartStep }) {
  return (
    <>
      {/* Step Number */}
      <span className={cn(
        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
        'bg-secondary-500/20 border border-secondary-500/30',
        'text-xs font-bold text-secondary-300'
      )}>
        {step.number}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {step.title}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {step.description}
        </p>
      </div>

      {/* Arrow for links */}
      {step.href && (
        <ArrowRight className="h-4 w-4 text-white/20 mt-0.5 group-hover:text-secondary-400 transition-colors" />
      )}
    </>
  )
}