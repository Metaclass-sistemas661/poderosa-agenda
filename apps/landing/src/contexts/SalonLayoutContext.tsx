'use client'

import { createContext, useContext } from 'react'

// ============================================================================
// SALON LAYOUT CONTEXT — ENTERPRISE-GRADE TENANT DATA DISTRIBUTION
// ============================================================================
// Este contexto é provido EXCLUSIVAMENTE pelo SalonLayout, que já resolveu
// o tenant (salonId, user, salon) durante a autenticação.
//
// REGRA DE SEGURANÇA: O salonId é SEMPRE derivado da sessão autenticada
// no layout, NUNCA aceita de input externo (URL, query param, etc.).
//
// As páginas-filhas DEVEM usar useSalonLayout() para obter o salonId,
// eliminando chamadas duplicadas de getSession() + admin_users query.
// ============================================================================

export interface SalonLayoutUser {
  id: string
  name: string
  email: string
  role: string
  salon_id: string
}

export interface SalonLayoutSalon {
  id: string
  name: string
  plan: string
  status: string
}

export interface SalonLayoutContextType {
  /** ID do salão — derivado da sessão autenticada, nunca de input externo */
  salonId: string
  /** Dados do admin_user autenticado */
  user: SalonLayoutUser
  /** Dados do salão associado ao usuário */
  salon: SalonLayoutSalon
}

const SalonLayoutContext = createContext<SalonLayoutContextType | null>(null)

/**
 * Hook para consumir dados do tenant já resolvidos pelo layout.
 *
 * IMPORTANTE: Este hook DEVE ser usado APENAS dentro de páginas /salon/*.
 * Ele lança um erro explícito se usado fora do SalonLayout.
 *
 * @throws {Error} Se usado fora do SalonLayout (indica bug de arquitetura)
 *
 * @example
 * ```tsx
 * function MinhaPage() {
 *   const { salonId } = useSalonLayout()
 *   // salonId já está disponível — zero queries adicionais
 * }
 * ```
 */
export function useSalonLayout(): SalonLayoutContextType {
  const context = useContext(SalonLayoutContext)
  if (!context) {
    throw new Error(
      '[useSalonLayout] Este hook deve ser usado dentro de uma página /salon/*. ' +
      'O SalonLayout provê o contexto após autenticação. ' +
      'Se você está vendo este erro, verifique se a página está dentro da árvore do SalonLayout.'
    )
  }
  return context
}

/**
 * Provider interno — usado exclusivamente pelo salon/layout.tsx
 * NÃO deve ser importado por outras páginas.
 */
export { SalonLayoutContext }
