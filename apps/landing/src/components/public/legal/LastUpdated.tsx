'use client'

import { cn } from '@/lib/utils'
import { Calendar, RefreshCw } from 'lucide-react'

interface LastUpdatedProps {
  date: string
  version?: string
  className?: string
}

/**
 * LastUpdated - Shows last update date for legal documents
 */
export function LastUpdated({
  date,
  version,
  className,
}: LastUpdatedProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-4 px-4 py-2.5',
      'rounded-lg border border-white/[0.06] bg-white/[0.02]',
      'text-sm text-white/50',
      className
    )}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-white/30" aria-hidden="true" />
        <span>Última atualização: <time className="text-white/70 font-medium">{date}</time></span>
      </div>
      
      {version && (
        <>
          <span className="w-px h-4 bg-white/[0.08]" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
            <span>Versão <span className="text-white/70 font-medium">{version}</span></span>
          </div>
        </>
      )}
    </div>
  )
}