import { toast } from 'sonner'
import type { UserFacingError } from './types'

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
