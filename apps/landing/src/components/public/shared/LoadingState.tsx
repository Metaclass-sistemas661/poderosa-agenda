'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type SkeletonVariant = 'hero' | 'card' | 'reading' | 'list' | 'sidebar' | 'grid' | 'section' | 'table'

interface LoadingStateProps {
  variant?: SkeletonVariant
  count?: number
  className?: string
}

/**
 * Skeleton - Base skeleton component with shimmer animation
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-white/[0.04]',
        'after:absolute after:inset-0',
        'after:translate-x-[-100%]',
        'after:animate-[shimmer_2s_infinite]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/[0.04] after:to-transparent',
        className
      )}
    />
  )
}

/**
 * HeroSkeleton - Skeleton for PageHero
 */
function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center text-center py-16 lg:py-24">
      {/* Badge */}
      <Skeleton className="h-8 w-32 rounded-full mb-6" />
      {/* Title */}
      <Skeleton className="h-12 w-80 max-w-full mb-4" />
      <Skeleton className="h-12 w-64 max-w-full mb-6" />
      {/* Subtitle */}
      <Skeleton className="h-6 w-96 max-w-full mb-2" />
      <Skeleton className="h-6 w-72 max-w-full mb-8" />
      {/* Actions */}
      <div className="flex gap-4">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * CardSkeleton - Skeleton for card components
 */
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      {/* Icon */}
      <Skeleton className="h-12 w-12 rounded-xl mb-4" />
      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-3" />
      {/* Description */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

/**
 * ReadingSkeleton - Skeleton for reading content
 */
function ReadingSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Heading */}
      <Skeleton className="h-8 w-64 mb-8" />
      {/* Paragraphs */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {/* Subheading */}
      <Skeleton className="h-6 w-48 mt-8 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

/**
 * ListSkeleton - Skeleton for list items
 */
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
        >
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/**
 * SidebarSkeleton - Skeleton for sidebar navigation
 */
function SidebarSkeleton() {
  return (
    <div className="w-64 space-y-6">
      {/* Section 1 */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      {/* Section 2 */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      {/* Section 3 */}
      <div>
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * GridSkeleton - Skeleton for card grids
 */
function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * SectionSkeleton - Skeleton for page sections
 */
function SectionSkeleton() {
  return (
    <div className="py-16 lg:py-24">
      {/* Title */}
      <div className="flex flex-col items-center text-center mb-12">
        <Skeleton className="h-4 w-24 rounded-full mb-4" />
        <Skeleton className="h-10 w-72 mb-3" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      {/* Content Grid */}
      <GridSkeleton count={3} />
    </div>
  )
}

/**
 * TableSkeleton - Skeleton for tables
 */
function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white/[0.02] border-b border-white/[0.06]">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-white/[0.04] last:border-b-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20 ml-auto rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * LoadingState - Shared loading state component
 * 
 * Create skeleton for:
 * - Hero
 * - Cards
 * - Reading
 * - Lists
 * - Sidebar
 * - Grid
 * - Section
 * - Table
 * 
 * Never use different loaders.
 */
export function LoadingState({
  variant = 'section',
  count,
  className,
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('animate-in fade-in duration-500', className)}
      role="status"
      aria-label="Carregando..."
    >
      {variant === 'hero' && <HeroSkeleton />}
      {variant === 'card' && <CardSkeleton />}
      {variant === 'reading' && <ReadingSkeleton />}
      {variant === 'list' && <ListSkeleton count={count} />}
      {variant === 'sidebar' && <SidebarSkeleton />}
      {variant === 'grid' && <GridSkeleton count={count} />}
      {variant === 'section' && <SectionSkeleton />}
      {variant === 'table' && <TableSkeleton count={count} />}
      
      <span className="sr-only">Carregando conteúdo...</span>
    </motion.div>
  )
}

// Export individual skeletons for more granular usage
export {
  Skeleton,
  HeroSkeleton,
  CardSkeleton,
  ReadingSkeleton,
  ListSkeleton,
  SidebarSkeleton,
  GridSkeleton,
  SectionSkeleton,
  TableSkeleton,
}