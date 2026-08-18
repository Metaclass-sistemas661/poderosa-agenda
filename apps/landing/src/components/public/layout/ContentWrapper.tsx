'use client'

import { cn } from '@/lib/utils'

interface ContentWrapperProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

export function ContentWrapper({
  children,
  className,
  align = 'left',
}: ContentWrapperProps) {
  return (
    <div
      className={cn(
        'w-full',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}