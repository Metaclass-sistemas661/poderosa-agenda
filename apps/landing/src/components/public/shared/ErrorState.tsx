'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { 
  FileQuestion, 
  ServerCrash, 
  WifiOff, 
  SearchX, 
  AlertOctagon, 
  ShieldX 
} from 'lucide-react'
import Link from 'next/link'

type ErrorVariant = '404' | '500' | 'offline' | 'no-results' | 'validation' | 'permission'

interface ErrorStateAction {
  label: string
  onClick?: () => void
  href?: string
}

interface ErrorStateProps {
  variant?: ErrorVariant
  title?: string
  description?: string
  icon?: LucideIcon
  action?: ErrorStateAction
  secondaryAction?: ErrorStateAction
  className?: string
}

const variantConfig: Record<ErrorVariant, {
  defaultTitle: string
  defaultDescription: string
  defaultIcon: LucideIcon
  iconColor: string
  code?: string
}> = {
  '404': {
    defaultTitle: 'Página não encontrada',
    defaultDescription: 'Não conseguimos encontrar a página que você está procurando. Verifique o endereço ou volte para a página inicial.',
    defaultIcon: FileQuestion,
    iconColor: 'text-amber-400',
    code: '404',
  },
  '500': {
    defaultTitle: 'Erro interno do servidor',
    defaultDescription: 'Algo deu errado do nosso lado. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.',
    defaultIcon: ServerCrash,
    iconColor: 'text-red-400',
    code: '500',
  },
  'offline': {
    defaultTitle: 'Você está offline',
    defaultDescription: 'Parece que você perdeu a conexão com a internet. Verifique sua conexão e tente novamente.',
    defaultIcon: WifiOff,
    iconColor: 'text-white/40',
  },
  'no-results': {
    defaultTitle: 'Nenhum resultado encontrado',
    defaultDescription: 'Não encontramos resultados para sua busca. Tente usar termos diferentes ou mais genéricos.',
    defaultIcon: SearchX,
    iconColor: 'text-secondary-400',
  },
  'validation': {
    defaultTitle: 'Erro de validação',
    defaultDescription: 'Alguns campos não foram preenchidos corretamente. Por favor, revise as informações e tente novamente.',
    defaultIcon: AlertOctagon,
    iconColor: 'text-amber-400',
  },
  'permission': {
    defaultTitle: 'Acesso negado',
    defaultDescription: 'Você não tem permissão para acessar este recurso. Entre em contato com o suporte se acredita que isso é um erro.',
    defaultIcon: ShieldX,
    iconColor: 'text-red-400',
    code: '403',
  },
}

/**
 * ErrorState - Shared error state component
 * 
 * Supports:
 * - 404
 * - 500
 * - Offline
 * - No Results
 * - Validation Error
 * - Permission Denied
 * 
 * All reusing the same visual pattern.
 */
export function ErrorState({
  variant = '404',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const prefersReducedMotion = useReducedMotion()
  const config = variantConfig[variant]
  const Icon = icon || config.defaultIcon
  const stagger = prefersReducedMotion ? 0 : 0.1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'flex flex-col items-center justify-center py-16 lg:py-24 text-center',
        className
      )}
      role="alert"
    >
      {/* Error Code */}
      {config.code && (
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            delay: stagger * 0,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mb-4 text-7xl font-bold text-white/10 lg:text-9xl"
          aria-hidden="true"
        >
          {config.code}
        </motion.span>
      )}

      {/* Icon Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.4,
          delay: stagger * 1,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-2xl',
          'border border-white/[0.06] bg-white/[0.02]',
          'mb-6',
          !config.code && 'mt-0'
        )}
      >
        <Icon className={cn('h-10 w-10', config.iconColor)} aria-hidden="true" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.4,
          delay: stagger * 2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="text-2xl font-bold text-white mb-3 lg:text-3xl"
      >
        {title || config.defaultTitle}
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.4,
          delay: stagger * 3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="max-w-md text-base text-white/50 mb-8"
      >
        {description || config.defaultDescription}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            delay: stagger * 4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className={cn(
                  'inline-flex items-center px-5 py-2.5',
                  'text-sm font-medium text-white',
                  'rounded-xl bg-secondary-600',
                  'transition-all duration-200',
                  'hover:bg-secondary-500',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50'
                )}
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center px-5 py-2.5',
                  'text-sm font-medium text-white',
                  'rounded-xl bg-secondary-600',
                  'transition-all duration-200',
                  'hover:bg-secondary-500',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50'
                )}
              >
                {action.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className={cn(
                  'inline-flex items-center px-5 py-2.5',
                  'text-sm font-medium text-white/70',
                  'rounded-xl border border-white/[0.08] bg-white/[0.02]',
                  'transition-all duration-200',
                  'hover:bg-white/[0.04] hover:text-white',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                )}
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={cn(
                  'inline-flex items-center px-5 py-2.5',
                  'text-sm font-medium text-white/70',
                  'rounded-xl border border-white/[0.08] bg-white/[0.02]',
                  'transition-all duration-200',
                  'hover:bg-white/[0.04] hover:text-white',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                )}
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </motion.div>
      )}
    </motion.div>
  )
}