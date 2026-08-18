'use client'

import { cn } from '@/lib/utils'

interface PageFooterSpacerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-12 lg:h-16',
  md: 'h-16 lg:h-24',
  lg: 'h-24 lg:h-32',
}

export function PageFooterSpacer({
  className,
  size = 'md',
}: PageFooterSpacerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(sizeClasses[size], className)}
    />
  )
}