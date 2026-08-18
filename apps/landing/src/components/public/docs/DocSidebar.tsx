'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface DocSidebarItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  items?: DocSidebarItem[]
}

interface DocSidebarSection {
  title: string
  items: DocSidebarItem[]
}

interface DocSidebarProps {
  sections: DocSidebarSection[]
  activeItem?: string
  sticky?: boolean
  className?: string
}

/**
 * DocSidebar - Documentation sidebar navigation
 */
export function DocSidebar({
  sections,
  activeItem,
  sticky = true,
  className,
}: DocSidebarProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      aria-label="Navegação da documentação"
      className={cn(
        'w-64 flex-shrink-0',
        sticky && 'sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto',
        className
      )}
    >
      <nav className="space-y-6 pb-8">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Title */}
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              {section.title}
            </h4>

            {/* Section Items */}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <DocSidebarItemComponent
                  key={item.id}
                  item={item}
                  activeItem={activeItem}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </motion.aside>
  )
}

function DocSidebarItemComponent({
  item,
  activeItem,
}: {
  item: DocSidebarItem
  activeItem?: string
}) {
  const [isExpanded, setIsExpanded] = useState(
    item.items?.some((sub) => sub.id === activeItem) || false
  )
  const isActive = activeItem === item.id
  const hasChildren = item.items && item.items.length > 0
  const Icon = item.icon

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
            'transition-all duration-200',
            isActive
              ? 'bg-secondary-500/10 text-secondary-400 font-medium border-l-2 border-secondary-500 -ml-[2px] pl-[14px]'
              : 'text-white/60 hover:text-white/80 hover:bg-white/[0.04]'
          )}
        >
          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
          <span className="truncate">{item.label}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-white/40 hover:text-white/60 transition-colors"
            aria-expanded={isExpanded}
          >
            <ChevronDown className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )} />
          </button>
        )}
      </div>

      {/* Nested Items */}
      {hasChildren && isExpanded && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
          {item.items!.map((subItem) => (
            <li key={subItem.id}>
              <Link
                href={subItem.href}
                className={cn(
                  'block px-3 py-1.5 text-sm rounded-lg',
                  'transition-all duration-200',
                  activeItem === subItem.id
                    ? 'text-secondary-400 font-medium'
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                {subItem.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}