import { log } from '@/lib/observability/logger';
import { UserFacingError } from './types';

/**
 * Type guard for PostgrestError from Supabase
 */
function isPostgrestError(error: unknown): error is { code: string; message: string; details: string; hint: string } {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'details' in error;
}

/**
 * Type guard for generic JavaScript error with message
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string';
}

/**
 * Type guard for Supabase AuthApiError
 */
function isAuthError(error: unknown): error is { name: string; status?: number; message: string } {
  return isErrorWithMessage(error) && (error as any).name === 'AuthApiError';
}

/**
 * Normalizes any unknown error into a UserFacingError, preventing technical leakage.
 * Logs the actual technical error to the observability layer.
 */
export function mapSupabaseError(error: unknown, context?: string): UserFacingError {
  // Always log the actual error internally for diagnostics
  log.error(`[Error Mapper] Operation failed${context ? ` at ${context}` : ''}`, error instanceof Error ? error : new Error(String(error)), {
    rawError: error,
  });

  // Handle Supabase Auth errors
  if (isAuthError(error)) {
    switch (error.message) {
      case 'Invalid login credentials':
        return {
          code: 'UNAUTHORIZED',
          message: 'Email ou senha incorretos.',
          retryable: true,
          action: 'Verifique suas credenciais e tente novamente.'
        };
      case 'Email not confirmed':
        return {
          code: 'UNAUTHORIZED',
          message: 'Email não confirmado. Verifique sua caixa de entrada.',
          retryable: true,
          action: 'Acesse o link enviado para o seu email.'
        };
      case 'User not found':
        return {
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
          retryable: true
        };
      case 'Password should be at least 6 characters':
      case 'Password should be at least 6 characters.':
        return {
          code: 'VALIDATION_ERROR',
          message: 'A senha deve ter pelo menos 6 caracteres.',
          retryable: true
        };
      case 'User already registered':
        return {
          code: 'ALREADY_EXISTS',
          message: 'Este email já está cadastrado.',
          retryable: true,
          action: 'Tente fazer login ou redefinir sua senha.'
        };
      default:
        if (error.message.includes('same as')) {
          return {
            code: 'VALIDATION_ERROR',
            message: 'A nova senha não pode ser igual à anterior.',
            retryable: true
          };
        }
        // Handle generic auth errors or token expirations
        if (error.message.includes('Token expired') || error.message.includes('refresh token')) {
          return {
            code: 'AUTHENTICATION_ERROR',
            message: 'Sua sessão expirou.',
            retryable: true,
            action: 'Por favor, faça login novamente.'
          };
        }
        return {
          code: 'AUTHENTICATION_ERROR',
          message: 'Ocorreu um erro de autenticação.',
          retryable: true,
          action: 'Verifique seus dados e tente novamente.'
        };
    }
  }

  // Handle Supabase/PostgREST errors
  if (isPostgrestError(error)) {
    switch (error.code) {
      case '23505': // unique_violation
        // Check for specific constraint names to provide contextual messages
        if (error.details && error.details.includes('idx_access_requests_email_pending')) {
          return {
            code: 'ALREADY_EXISTS',
            message: 'Já existe uma solicitação pendente com este email.',
            retryable: false,
            action: 'Aguarde a análise da sua solicitação anterior ou entre em contato conosco.',
          };
        }
        if (error.details && (error.details.includes('clients_email') || error.details.includes('email_key'))) {
          return {
            code: 'ALREADY_EXISTS',
            message: 'Este email já está cadastrado no sistema.',
            retryable: false,
            action: 'Tente fazer login ou utilize outro email.',
          };
        }
        if (error.details && error.details.includes('phone')) {
          return {
            code: 'ALREADY_EXISTS',
            message: 'Este telefone já está cadastrado no sistema.',
            retryable: false,
            action: 'Verifique os dados informados.',
          };
        }
        // Generic unique constraint
        return {
          code: 'ALREADY_EXISTS',
          message: 'Esta informação já está em uso ou já foi cadastrada.',
          retryable: false,
          action: 'Verifique os dados informados.',
        };
      case '23503': // foreign_key_violation
        return {
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Não é possível concluir a operação pois o registro depende de outras informações que foram removidas.',
          retryable: false,
        };
      case '42501': // insufficient_privilege (RLS)
        return {
          code: 'AUTHORIZATION_ERROR',
          message: 'Você não tem permissão para realizar esta operação.',
          retryable: false,
        };
      case '23514': // check_violation
        return {
          code: 'VALIDATION_ERROR',
          message: 'Os dados informados são inválidos ou não cumprem as regras do sistema.',
          retryable: false,
        };
      case 'PGRST116': // JSON object requested, multiple (or no) rows returned
      case 'PGRST100':
        return {
          code: 'NOT_FOUND',
          message: 'O registro não foi encontrado.',
          retryable: false,
        };
      case '57014': // query_canceled (often timeouts)
        return {
          code: 'TIMEOUT',
          message: 'A operação demorou muito para responder.',
          retryable: true,
          action: 'Tente novamente em instantes.',
        };
      default:
        // Connection drops from PostgREST often manifest without code but with fetch failed
        if (error.message && error.message.includes('Failed to fetch')) {
          return {
            code: 'NETWORK_ERROR',
            message: 'Não foi possível conectar ao servidor no momento.',
            retryable: true,
            action: 'Verifique sua conexão e tente novamente.',
          };
        }
        return {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível concluir a operação no momento.',
          retryable: true,
          action: 'Tente novamente. Se o problema persistir, contate o suporte.',
        };
    }
  }

  // Handle basic network errors
  if (isErrorWithMessage(error)) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao servidor no momento.',
        retryable: true,
        action: 'Tente novamente em instantes.',
      };
    }
    if (msg.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'O servidor está demorando muito para responder.',
        retryable: true,
        action: 'Tente novamente em instantes.',
      };
    }
  }

  // Fallback for completely unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Ocorreu um erro inesperado.',
    retryable: true,
    action: 'Por favor, tente novamente.',
  };
}
