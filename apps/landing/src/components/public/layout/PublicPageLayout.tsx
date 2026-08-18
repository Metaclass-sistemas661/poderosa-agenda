'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FinalCTA } from '@/sections/FinalCTA'
import { PageHero } from '../hero/PageHero'
import type { LucideIcon } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeroConfig {
  badge?: {
    icon: LucideIcon
    text: string
  }
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
}

interface PublicPageLayoutProps {
  hero: PageHeroConfig
  children: React.ReactNode
  showCTA?: boolean
  className?: string
}

/**
 * PublicPageLayout — Unified shell for all public pages
 * Refactored to Light Mode Premium to match Landing Page aesthetic
 */
export function PublicPageLayout({
  hero,
  children,
  showCTA = true,
  className,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <PageHero
        badge={hero.badge}
        title={hero.title}
        subtitle={hero.subtitle}
        description={hero.description}
        actions={hero.actions}
        breadcrumb={hero.breadcrumb}
      />

      <main className={className}>
        {children}
      </main>

      {showCTA && (
        <div className="mt-20">
          <FinalCTA />
        </div>
      )}
      
      <div className={showCTA ? "-mt-24 md:-mt-32 relative z-10" : ""}>
        <Footer className={showCTA ? "!pt-40 md:!pt-48" : ""} />
      </div>
    </div>
  )
}