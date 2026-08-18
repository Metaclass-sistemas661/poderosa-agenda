'use client'

import { cn } from '@/lib/utils'

interface PublicPageBackgroundProps {
  className?: string
}

/**
 * PublicPageBackground — Shared atmospheric background system
 *
 * Replicates the exact visual layers from Landing Hero + page.tsx.
 * Used as the base for all public page content areas.
 *
 * Layers (bottom to top):
 * 1. Dark base #09090b
 * 2. Gradient mesh — slate → purple → slate (same as Hero)
 * 3. Secondary glow orb (top-left)
 * 4. Violet glow orb (bottom-right)
 * 5. Secondary fill orb (center-left)
 * 6. Purple fill orb (top-right)
 * 7. Subtle grid texture (opacity 0.025)
 * 8. Bottom edge fade → transparent
 */
export function PublicPageBackground({ className }: PublicPageBackgroundProps) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* 1. Dark Premium base */}
      <div className="absolute inset-0 bg-[#09090b]" />

      {/* 2. Gradient mesh — identical to Landing Hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950" />

      {/* 3. Primary atmospheric glow — secondary (top area) */}
      <div className="absolute -top-40 left-[30%] w-[700px] h-[700px] bg-secondary-600/12 rounded-full blur-[140px]" />

      {/* 4. Violet glow (bottom-right) */}
      <div className="absolute -bottom-20 right-[-5%] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[130px]" />

      {/* 5. Secondary fill (center-left) */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-16 w-[320px] h-[420px] bg-secondary-900/15 rounded-full blur-[110px]" />

      {/* 6. Purple fill (top-right) */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-purple-900/8 rounded-full blur-[100px]" />

      {/* 7. Subtle grid texture — identical to Landing Hero */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* 8. Bottom edge fade — seamless transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
    </div>
  )
}

/**
 * PublicClosingSurface — Unified CTA + Footer atmospheric surface
 *
 * Replicates the exact closing surface from page.tsx (lines 27-68).
 * Used to wrap FinalCTA + Footer in all public pages.
 *
 * Atmosphere is Hero-inspired, creating continuity between
 * main content → CTA → Footer.
 */
interface PublicClosingSurfaceProps {
  children: React.ReactNode
  className?: string
}

export function PublicClosingSurface({ children, className }: PublicClosingSurfaceProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Base background */}
      <div aria-hidden="true" className="absolute inset-0 bg-[#09090b]" />

      {/* Gradient mesh — same as Hero */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950" />

      {/* Atmospheric glow orbs — Hero-inspired */}
      <div
        aria-hidden="true"
        className="absolute top-20 left-[20%] w-[600px] h-[600px] bg-secondary-600/10 rounded-full blur-[140px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[-10%] w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[130px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-40 left-[-5%] w-[400px] h-[350px] bg-secondary-900/12 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Subtle grid texture — same as Hero */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Top transition gradient — seamless from main content */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#030B14] via-[#06080d] to-transparent pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}