'use client'

import { cn } from '@/lib/utils'
import { PageContainer } from '../layout/PageContainer'

interface LegalLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

/**
 * LegalLayout - Shared layout for all legal pages
 * 
 * All legal pages share the same reading experience.
 */
export function LegalLayout({
  children,
  sidebar,
  className,
}: LegalLayoutProps) {
  return (
    <PageContainer size="default" className={cn('py-12 lg:py-16', className)}>
      <div className={cn(
        'flex flex-col lg:flex-row gap-8 lg:gap-12',
      )}>
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-full lg:w-64 flex-shrink-0">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </PageContainer>
  )
}