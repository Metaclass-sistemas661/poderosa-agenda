'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface LegalSidebarItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
}

interface LegalSidebarProps {
  items: LegalSidebarItem[]
  activeItem?: string
  title?: string
  className?: string
}

/**
 * LegalSidebar - Sidebar navigation for legal pages
 */
export function LegalSidebar({
  items,
  activeItem,
  title = 'Documentos Legais',
  className,
}: LegalSidebarProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      aria-label="Navegação legal"
      className={cn(
        'sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto',
        className
      )}
    >
      {/* Title */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 px-3">
        {title}
      </h3>

      {/* Items */}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = activeItem === item.id
          const Icon = item.icon

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-secondary-500/10 text-secondary-400 font-medium'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}