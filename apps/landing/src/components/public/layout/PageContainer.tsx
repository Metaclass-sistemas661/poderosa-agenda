'use client'

import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'content' | 'wide'
}

const sizeClasses = {
  narrow: 'max-w-3xl', // 768px - Reading content
  default: 'max-w-4xl', // 896px - Hero, CTA
  content: 'max-w-5xl', // 1024px - Content sections
  wide: 'max-w-7xl', // 1280px - Full layouts
}

export function PageContainer({
  children,
  className,
  size = 'wide',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  )
}