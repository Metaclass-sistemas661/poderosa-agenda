'use client'

import { cn } from '@/lib/utils'

type VariantType = 'gradient' | 'opacity' | 'glass'
type SizeType = 'sm' | 'md' | 'lg'

interface PageDividerProps {
  variant?: VariantType
  size?: SizeType
  className?: string
}

/**
 * PageDivider - Official divider component
 * 
 * Uses:
 * - gradient
 * - opacity
 * - glass
 * 
 * Never use <hr>.
 */
export function PageDivider({
  variant = 'gradient',
  size = 'md',
  className,
}: PageDividerProps) {
  const sizeClasses: Record<SizeType, string> = {
    sm: 'my-8',
    md: 'my-12 lg:my-16',
    lg: 'my-16 lg:my-24',
  }

  if (variant === 'gradient') {
    return (
      <div
        role="separator"
        aria-hidden="true"
        className={cn(
          'h-px w-full',
          'bg-gradient-to-r from-transparent via-white/10 to-transparent',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  if (variant === 'opacity') {
    return (
      <div
        role="separator"
        aria-hidden="true"
        className={cn(
          'h-px w-full',
          'bg-white/[0.06]',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  if (variant === 'glass') {
    return (
      <div
        role="separator"
        aria-hidden="true"
        className={cn(
          'h-px w-full',
          'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent',
          'backdrop-blur-sm',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return null
}