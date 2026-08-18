'use client'

import { cn } from '@/lib/utils'

interface SectionDividerProps {
  className?: string
}

export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-px w-full',
        'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent',
        className
      )}
    />
  )
}