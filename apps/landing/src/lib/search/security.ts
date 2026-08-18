// ============================================================================
// SEARCH SECURITY — ENTERPRISE-GRADE SEARCH INPUT SANITIZATION
// ============================================================================
// Este módulo fornece sanitização e validação de inputs de busca.
// Previne SQL injection, filter injection e ataques via caracteres especiais.
// Projetado para escala de 200.000+ clientes.
// ============================================================================

import { z } from 'zod'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Limite máximo de caracteres para busca
 */
export const SEARCH_MAX_LENGTH = 100

/**
 * Limite mínimo de caracteres para busca (evita queries muito amplas)
 */
export const SEARCH_MIN_LENGTH = 1

/**
 * Caracteres SQL perigosos que devem ser escapados
 */
const SQL_DANGEROUS_CHARS = /[%_\[\]\\'";\-\-\/\*]/g

/**
 * Padrões de SQL injection comuns
 */
const SQL_INJECTION_PATTERNS = [
    /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /(\bOR\b|\bAND\b)\s*['"]?[^'"\s]+['"]?\s*=\s*['"]?[^'"\s]+['"]?/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|TRUNCATE)/i,
    /--\s*$/,
    /\/\*.*\*\//,
    /xp_\w+/i,
    /EXEC(\s+|\()/i,
    /EXECUTE(\s+|\()/i,
]

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Schema base para validação de termo de busca
 */
export const searchTermSchema = z.string()
    .max(SEARCH_MAX_LENGTH, `Busca deve ter no máximo ${SEARCH_MAX_LENGTH} caracteres`)
    .transform(v => v.trim())
    .refine(v => !containsSqlInjection(v), 'Termo de busca contém caracteres não permitidos')
    .transform(sanitizeSearchTerm)

/**
 * Schema para busca opcional (pode ser vazio)
 */
export const optionalSearchSchema = z.string()
    .max(SEARCH_MAX_LENGTH)
    .transform(v => v.trim())
    .transform(v => v === '' ? null : sanitizeSearchTerm(v))
    .nullable()
    .optional()

/**
 * Schema para busca com mínimo de caracteres
 */
export const requiredSearchSchema = z.string()
    .min(SEARCH_MIN_LENGTH, 'Digite pelo menos 1 caractere para buscar')
    .max(SEARCH_MAX_LENGTH, `Busca deve ter no máximo ${SEARCH_MAX_LENGTH} caracteres`)
    .transform(v => v.trim())
    .refine(v => !containsSqlInjection(v), 'Termo de busca contém caracteres não permitidos')
    .transform(sanitizeSearchTerm)

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Verifica se o termo contém padrões de SQL injection
 */
export function containsSqlInjection(term: string): boolean {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(term))
}

/**
 * Escapa caracteres especiais do PostgreSQL LIKE/ILIKE
 * 
 * @param term - Termo de busca bruto
 * @returns Termo sanitizado seguro para uso em ILIKE
 */
export function escapePostgresLike(term: string): string {
    // Escapa % e _ que são wildcards no LIKE
    // Escapa \ que é o caractere de escape
    return term
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
}

/**
 * Remove caracteres potencialmente perigosos
 * 
 * @param term - Termo de busca bruto
 * @returns Termo limpo
 */
export function removeSpecialChars(term: string): string {
    // Remove caracteres SQL perigosos mantendo acentos e espaços
    return term
        .replace(/['";\-\-\/\*\[\]\\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Sanitiza termo de busca para uso seguro em queries
 * 
 * @param term - Termo de busca bruto
 * @returns Termo sanitizado
 */
export function sanitizeSearchTerm(term: string): string {
    if (!term) return ''

    // 1. Trim e normaliza espaços
    let sanitized = term.trim().replace(/\s+/g, ' ')

    // 2. Limita tamanho
    sanitized = sanitized.slice(0, SEARCH_MAX_LENGTH)

    // 3. Remove caracteres perigosos
    sanitized = removeSpecialChars(sanitized)

    // 4. Escapa wildcards do LIKE
    sanitized = escapePostgresLike(sanitized)

    return sanitized
}

/**
 * Prepara termo para busca com ILIKE adicionando wildcards seguros
 * 
 * @param term - Termo já sanitizado
 * @returns Termo pronto para .ilike()
 */
export function prepareIlikeTerm(term: string): string {
    const sanitized = sanitizeSearchTerm(term)
    if (!sanitized) return ''
    return `%${sanitized}%`
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida e sanitiza termo de busca
 * Retorna null se inválido
 */
export function validateSearchTerm(term: unknown): string | null {
    const result = searchTermSchema.safeParse(term)
    if (!result.success) return null
    return result.data
}

/**
 * Valida termo de busca com erro detalhado
 */
export function validateSearchTermWithError(term: unknown): { success: true; data: string } | { success: false; error: string } {
    const result = searchTermSchema.safeParse(term)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, error: result.error.issues[0]?.message || 'Termo inválido' }
}

// ============================================================================
// SEARCH QUERY BUILDER
// ============================================================================

export interface SearchConfig {
    /** Termo de busca (será sanitizado) */
    term: string
    /** Colunas para buscar */
    columns: string[]
    /** Limite de resultados */
    limit?: number
    /** Busca exata (sem wildcards) */
    exactMatch?: boolean
}

/**
 * Constrói cláusula OR segura para busca em múltiplas colunas
 * 
 * @example
 * ```ts
 * const orClause = buildSearchOrClause({
 *   term: userInput,
 *   columns: ['name', 'email', 'phone']
 * })
 * // Resultado: "name.ilike.%termo%,email.ilike.%termo%,phone.ilike.%termo%"
 * 
 * query.or(orClause)
 * ```
 */
export function buildSearchOrClause(config: SearchConfig): string | null {
    const sanitized = sanitizeSearchTerm(config.term)
    if (!sanitized) return null

    const term = config.exactMatch ? sanitized : `%${sanitized}%`

    return config.columns
        .map(col => `${col}.ilike.${term}`)
        .join(',')
}

/**
 * Constrói array de filtros para busca
 */
export function buildSearchFilters(config: SearchConfig): Array<{
    column: string
    operator: 'ilike'
    value: string
}> {
    const sanitized = sanitizeSearchTerm(config.term)
    if (!sanitized) return []

    const term = config.exactMatch ? sanitized : `%${sanitized}%`

    return config.columns.map(column => ({
        column,
        operator: 'ilike' as const,
        value: term
    }))
}

// ============================================================================
// SAFE SEARCH HOOK HELPER
// ============================================================================

/**
 * Estado de busca seguro para uso em componentes
 */
export interface SafeSearchState {
    /** Termo original (para display) */
    displayTerm: string
    /** Termo sanitizado (para queries) */
    sanitizedTerm: string
    /** Se o termo é válido para busca */
    isValid: boolean
    /** Mensagem de erro se inválido */
    error: string | null
}

/**
 * Processa termo de busca e retorna estado seguro
 */
export function processSafeSearch(rawTerm: string): SafeSearchState {
    const displayTerm = rawTerm.slice(0, SEARCH_MAX_LENGTH)

    if (!rawTerm.trim()) {
        return {
            displayTerm,
            sanitizedTerm: '',
            isValid: true,
            error: null
        }
    }

    const validation = validateSearchTermWithError(rawTerm)

    if (!validation.success) {
        return {
            displayTerm,
            sanitizedTerm: '',
            isValid: false,
            error: validation.error
        }
    }

    return {
        displayTerm,
        sanitizedTerm: validation.data,
        isValid: true,
        error: null
    }
}

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================

/**
 * Debounce seguro para busca (evita muitas requisições)
 */
export function debounceSearch<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            fn(...args)
        }, delay)
    }
}