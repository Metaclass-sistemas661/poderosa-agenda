import { toast } from 'sonner'
import type { UserFacingError } from './types'
import { mapSupabaseError } from './mapper'

/**
 * Exibe um toast padronizado para mensagens de erro do domínio.
 */
export function showErrorToast(error: UserFacingError) {
  toast.error(error.message, {
    description: error.action,
    duration: 5000,
  })
}

/**
 * Exibe um toast padronizado para sucessos.
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

/**
 * Exibe um toast de aviso (warning).
 */
export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 5000,
  })
}

/**
 * Função helper que mapeia um erro desconhecido para mensagem segura PT-BR e exibe toast.
 * Use isso em catch blocks para NUNCA vazar error.message para o usuário.
 * 
 * @example
 * ```typescript
 * try {
 *   await supabase.from('clientes').insert(data)
 * } catch (err) {
 *   handleAndShowError(err, 'Erro ao criar cliente')
 * }
 * ```
 */
export function handleAndShowError(error: unknown, fallbackMessage: string, context?: string): string {
  const mapped = mapSupabaseError(error, context)
  toast.error(mapped.message, {
    description: mapped.action || 'Tente novamente.',
    duration: 5000,
  })
  // Retorna a mensagem segura para quem quiser usar em setMessage também
  return mapped.message
}

/**
 * Retorna apenas a mensagem segura sem exibir toast.
 * Use quando você quer controlar como exibir (ex: setMessage em vez de toast).
 */
export function getSafeErrorMessage(error: unknown, context?: string): string {
  const mapped = mapSupabaseError(error, context)
  return mapped.message
}
