'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

type ContactVariant = 'phone' | 'email' | 'whatsapp' | 'address' | 'hours' | 'default'

interface ContactCardProps {
  icon: LucideIcon
  title: string
  value: string
  description?: string
  href?: string
  external?: boolean
  variant?: ContactVariant
  delay?: number
  className?: string
}

const variantStyles: Record<ContactVariant, { iconBg: string; iconColor: string }> = {
  phone: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  email: {
    iconBg: 'bg-secondary-500/10 border-secondary-500/20',
    iconColor: 'text-secondary-400',
  },
  whatsapp: {
    iconBg: 'bg-green-500/10 border-green-500/20',
    iconColor: 'text-green-400',
  },
  address: {
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  hours: {
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  default: {
    iconBg: 'bg-white/[0.04] border-white/[0.08]',
    iconColor: 'text-white/60',
  },
}

/**
 * ContactCard - Card used on Contact page
 * 
 * Examples:
 * - Phone
 * - Email
 * - WhatsApp
 * - Address
 * - Hours
 */
export function ContactCard({
  icon: Icon,
  title,
  value,
  description,
  href,
  external = false,
  variant = 'default',
  delay = 0,
  className,
}: ContactCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  const shouldAnimate = isInView && !prefersReducedMotion
  const styles = variantStyles[variant]

  const cardContent = (
    <>
      {/* Icon */}
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl border',
        styles.iconBg,
        'transition-all duration-200'
      )}>
        <Icon className={cn('h-6 w-6', styles.iconColor)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white/50 mb-1">
          {title}
        </h3>
        <p className={cn(
          'text-base font-semibold text-white',
          href && 'group-hover:text-secondary-300 transition-colors'
        )}>
          {value}
        </p>
        {description && (
          <p className="mt-1 text-sm text-white/40">
            {description}
          </p>
        )}
      </div>

      {/* External Link Indicator */}
      {href && external && (
        <ExternalLink className="h-4 w-4 text-white/30 group-hover:text-secondary-400 transition-colors flex-shrink-0" />
      )}
    </>
  )

  const cardClasses = cn(
    'group flex items-start gap-4 p-5',
    'rounded-xl border border-white/[0.06]',
    'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
    'backdrop-blur-xl',
    'transition-all duration-300 ease-out',
    href && 'hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer',
    className
  )

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
    >
      {href ? (
        external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={cardClasses}>
            {cardContent}
          </a>
        ) : (
          <Link href={href} className={cardClasses}>
            {cardContent}
          </Link>
        )
      ) : (
        <div className={cardClasses}>
          {cardContent}
        </div>
      )}
    </motion.div>
  )
}