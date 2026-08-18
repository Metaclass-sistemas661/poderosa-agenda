'use client'

import { cn } from '@/lib/utils'

interface ContentSectionProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

const spacingClasses = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
}

export function ContentSection({
  children,
  className,
  spacing = 'md',
}: ContentSectionProps) {
  return (
    <div className={cn('flex flex-col', spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}