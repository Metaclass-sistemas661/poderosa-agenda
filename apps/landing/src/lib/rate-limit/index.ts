// ============================================================================
// RATE LIMITING — ENTERPRISE-GRADE PROTECTION AGAINST ABUSE
// ============================================================================
// Este módulo implementa rate limiting com sliding window para proteção
// contra brute-force, DoS e abuso de API.
// Projetado para escala de 200.000+ clientes com flexibilidade enterprise.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuração de rate limit
 */
export interface RateLimitConfig {
    /** Número máximo de requisições no período */
    limit: number
    /** Período em segundos */
    windowSizeSeconds: number
    /** Identificador único (ex: 'auth', 'api', 'search') */
    identifier: string
    /** Mensagem de erro personalizada */
    errorMessage?: string
}

/**
 * Resultado da verificação de rate limit
 */
export interface RateLimitResult {
    /** Se a requisição está dentro do limite */
    success: boolean
    /** Requisições restantes no período atual */
    remaining: number
    /** Timestamp de reset do período (Unix seconds) */
    resetTime: number
    /** Total de requisições permitidas */
    limit: number
    /** Tempo de retry em segundos (se bloqueado) */
    retryAfter?: number
}

/**
 * Entrada no store de rate limit
 */
interface RateLimitEntry {
    count: number
    windowStart: number
    requests: number[]  // timestamps das requisições (sliding window)
}

/**
 * Identificador de cliente para rate limiting
 */
export interface ClientIdentifier {
    /** IP do cliente */
    ip: string
    /** ID do usuário (se autenticado) */
    userId?: string
    /** ID do tenant/salon (se aplicável) */
    tenantId?: string
}

// ============================================================================
// RATE LIMIT PRESETS — ENTERPRISE CONFIGURATIONS
// ============================================================================

/**
 * Configurações pré-definidas para diferentes tipos de endpoints
 */
export const RATE_LIMIT_PRESETS = {
    /** Login/signup - proteção contra brute-force */
    AUTH: {
        limit: 5,
        windowSizeSeconds: 60,       // 5 tentativas por minuto
        identifier: 'auth',
        errorMessage: 'Muitas tentativas de login. Aguarde 1 minuto.'
    },

    /** Reset de senha - mais restritivo */
    PASSWORD_RESET: {
        limit: 3,
        windowSizeSeconds: 300,      // 3 tentativas por 5 minutos
        identifier: 'password-reset',
        errorMessage: 'Muitas tentativas de reset de senha. Aguarde 5 minutos.'
    },

    /** API geral - balanceado */
    API: {
        limit: 100,
        windowSizeSeconds: 60,       // 100 req/min
        identifier: 'api',
        errorMessage: 'Limite de requisições excedido. Aguarde um momento.'
    },

    /** Operações de escrita - mais restritivo */
    MUTATIONS: {
        limit: 30,
        windowSizeSeconds: 60,       // 30 mutations/min
        identifier: 'mutations',
        errorMessage: 'Muitas operações de escrita. Aguarde um momento.'
    },

    /** Busca global - proteção contra scraping */
    SEARCH: {
        limit: 30,
        windowSizeSeconds: 60,       // 30 buscas/min
        identifier: 'search',
        errorMessage: 'Muitas buscas. Aguarde um momento.'
    },

    /** Upload de arquivos */
    UPLOAD: {
        limit: 10,
        windowSizeSeconds: 300,      // 10 uploads por 5 minutos
        identifier: 'upload',
        errorMessage: 'Muitos uploads. Aguarde 5 minutos.'
    },

    /** Webhooks de entrada */
    WEBHOOK: {
        limit: 1000,
        windowSizeSeconds: 60,       // 1000/min para webhooks
        identifier: 'webhook'
    },

    /** Exportação de dados */
    EXPORT: {
        limit: 5,
        windowSizeSeconds: 3600,     // 5 exports por hora
        identifier: 'export',
        errorMessage: 'Muitas exportações. Aguarde 1 hora.'
    },

    /** Superadmin - mais permissivo */
    SUPERADMIN: {
        limit: 1000,
        windowSizeSeconds: 60,       // 1000/min para superadmin
        identifier: 'superadmin'
    }
} as const satisfies Record<string, RateLimitConfig>

// ============================================================================
// IN-MEMORY STORE (Development / Single Instance)
// ============================================================================

/**
 * Store em memória para rate limiting.
 * 
 * NOTA: Para produção com múltiplas instâncias, use Redis.
 * Este store é adequado para:
 * - Desenvolvimento
 * - Produção single-instance
 * - Edge functions (cada instância tem seu próprio store)
 */
class InMemoryRateLimitStore {
    private store: Map<string, RateLimitEntry> = new Map()
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor() {
        // Cleanup automático a cada 5 minutos
        if (typeof setInterval !== 'undefined') {
            this.cleanupInterval = setInterval(() => {
                this.cleanup()
            }, 5 * 60 * 1000)
        }
    }

    /**
     * Obtém entrada do store
     */
    get(key: string): RateLimitEntry | undefined {
        return this.store.get(key)
    }

    /**
     * Define entrada no store
     */
    set(key: string, entry: RateLimitEntry): void {
        this.store.set(key, entry)
    }

    /**
     * Remove entradas expiradas
     */
    cleanup(): void {
        const now = Date.now()
        const maxAge = 3600 * 1000 // 1 hora
        const entries = Array.from(this.store.entries())

        for (let i = 0; i < entries.length; i++) {
            const [key, entry] = entries[i]
            if (now - entry.windowStart > maxAge) {
                this.store.delete(key)
            }
        }
    }

    /**
     * Limpa todo o store (útil para testes)
     */
    clear(): void {
        this.store.clear()
    }

    /**
     * Obtém estatísticas do store
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.store.size,
            keys: Array.from(this.store.keys())
        }
    }
}

// Singleton do store
const rateLimitStore = new InMemoryRateLimitStore()

// ============================================================================
// CORE RATE LIMITING LOGIC — SLIDING WINDOW
// ============================================================================

/**
 * Gera chave única para rate limiting
 */
function generateKey(config: RateLimitConfig, client: ClientIdentifier): string {
    // Prioridade: userId > tenantId > IP
    const clientKey = client.userId || client.tenantId || client.ip
    return `ratelimit:${config.identifier}:${clientKey}`
}

/**
 * Implementação de sliding window rate limiting.
 * Mais preciso que fixed window, mais simples que sliding log.
 */
export function checkRateLimit(
    config: RateLimitConfig,
    client: ClientIdentifier
): RateLimitResult {
    const key = generateKey(config, client)
    const now = Date.now()
    const windowMs = config.windowSizeSeconds * 1000

    let entry = rateLimitStore.get(key)

    if (!entry) {
        // Primeira requisição - criar entrada
        entry = {
            count: 1,
            windowStart: now,
            requests: [now]
        }
        rateLimitStore.set(key, entry)

        return {
            success: true,
            remaining: config.limit - 1,
            resetTime: Math.ceil((now + windowMs) / 1000),
            limit: config.limit
        }
    }

    // Limpar requisições antigas (fora da janela)
    const windowStart = now - windowMs
    entry.requests = entry.requests.filter(t => t > windowStart)
    entry.count = entry.requests.length

    // Verificar limite
    if (entry.count >= config.limit) {
        // Calcular tempo de retry
        const oldestRequest = entry.requests[0]
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)

        return {
            success: false,
            remaining: 0,
            resetTime: Math.ceil((oldestRequest + windowMs) / 1000),
            limit: config.limit,
            retryAfter: Math.max(1, retryAfter)
        }
    }

    // Adicionar requisição
    entry.requests.push(now)
    entry.count = entry.requests.length
    rateLimitStore.set(key, entry)

    return {
        success: true,
        remaining: config.limit - entry.count,
        resetTime: Math.ceil((entry.requests[0] + windowMs) / 1000),
        limit: config.limit
    }
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Extrai IP do cliente da requisição Next.js
 */
export function getClientIP(request: NextRequest): string {
    // Ordem de preferência para IPs
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        // x-forwarded-for pode conter múltiplos IPs
        return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    // Fallback para IP do Vercel/Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
        return cfConnectingIP
    }

    // IP padrão se não encontrar
    return '127.0.0.1'
}

/**
 * Cria headers de rate limit para a resposta
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
    const headers = new Headers()

    headers.set('X-RateLimit-Limit', result.limit.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', result.resetTime.toString())

    if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString())
    }

    return headers
}

/**
 * Cria resposta de erro 429 Too Many Requests
 */
export function createRateLimitResponse(
    result: RateLimitResult,
    config: RateLimitConfig
): NextResponse {
    const headers = createRateLimitHeaders(result)

    return NextResponse.json(
        {
            error: 'Too Many Requests',
            message: config.errorMessage || 'Limite de requisições excedido. Tente novamente mais tarde.',
            retryAfter: result.retryAfter,
            resetTime: result.resetTime
        },
        {
            status: 429,
            headers
        }
    )
}

// ============================================================================
// RATE LIMIT MIDDLEWARE
// ============================================================================

/**
 * Middleware de rate limiting para Next.js
 * 
 * @example
 * ```ts
 * // Em middleware.ts
 * import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
 * 
 * export async function middleware(request: NextRequest) {
 *   // Rate limit para auth endpoints
 *   if (request.nextUrl.pathname.startsWith('/api/auth')) {
 *     const result = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.AUTH)
 *     if (result) return result
 *   }
 *   
 *   // Rate limit geral para API
 *   if (request.nextUrl.pathname.startsWith('/api/')) {
 *     const result = rateLimitMiddleware(request, RATE_LIMIT_PRESETS.API)
 *     if (result) return result
 *   }
 * }
 * ```
 */
export function rateLimitMiddleware(
    request: NextRequest,
    config: RateLimitConfig,
    userId?: string,
    tenantId?: string
): NextResponse | null {
    const client: ClientIdentifier = {
        ip: getClientIP(request),
        userId,
        tenantId
    }

    const result = checkRateLimit(config, client)

    if (!result.success) {
        return createRateLimitResponse(result, config)
    }

    // Requisição permitida - retorna null para continuar
    return null
}

// ============================================================================
// SERVER ACTION RATE LIMITER
// ============================================================================

/**
 * Rate limiter para Server Actions
 * 
 * @example
 * ```ts
 * import { serverActionRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
 * 
 * export async function createClient(data: CreateClientInput) {
 *   // Verificar rate limit
 *   const rateLimitResult = await serverActionRateLimit(
 *     RATE_LIMIT_PRESETS.MUTATIONS,
 *     'user-123',
 *     'salon-456'
 *   )
 *   
 *   if (!rateLimitResult.success) {
 *     return {
 *       error: 'Rate limit exceeded',
 *       retryAfter: rateLimitResult.retryAfter
 *     }
 *   }
 *   
 *   // Continuar com a operação...
 * }
 * ```
 */
export function serverActionRateLimit(
    config: RateLimitConfig,
    userId?: string,
    tenantId?: string,
    ip: string = '127.0.0.1'
): RateLimitResult {
    const client: ClientIdentifier = {
        ip,
        userId,
        tenantId
    }

    return checkRateLimit(config, client)
}

// ============================================================================
// RATE LIMIT DECORATOR FOR ACTIONS
// ============================================================================

/**
 * Higher-order function que adiciona rate limiting a Server Actions
 * 
 * @example
 * ```ts
 * import { withRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
 * 
 * const createClientWithRateLimit = withRateLimit(
 *   RATE_LIMIT_PRESETS.MUTATIONS,
 *   async (ctx, data: CreateClientInput) => {
 *     // Sua lógica aqui
 *   }
 * )
 * ```
 */
export function withRateLimit<TInput, TOutput>(
    config: RateLimitConfig,
    handler: (input: TInput) => Promise<TOutput>,
    getIdentifiers?: (input: TInput) => { userId?: string; tenantId?: string; ip?: string }
): (input: TInput) => Promise<TOutput | { error: string; code: 'RATE_LIMITED'; retryAfter: number }> {
    return async (input: TInput) => {
        const identifiers = getIdentifiers?.(input) || {}

        const result = serverActionRateLimit(
            config,
            identifiers.userId,
            identifiers.tenantId,
            identifiers.ip
        )

        if (!result.success) {
            return {
                error: config.errorMessage || 'Rate limit exceeded',
                code: 'RATE_LIMITED' as const,
                retryAfter: result.retryAfter || 60
            }
        }

        return handler(input)
    }
}

// ============================================================================
// ADMIN / DEBUG FUNCTIONS
// ============================================================================

/**
 * Obtém estatísticas do rate limiter (para admin/debug)
 */
export function getRateLimitStats(): {
    size: number
    keys: string[]
} {
    return rateLimitStore.stats()
}

/**
 * Limpa o store de rate limit (para testes)
 */
export function clearRateLimitStore(): void {
    rateLimitStore.clear()
}

/**
 * Reseta rate limit para um cliente específico
 */
/**
 * Simple rate limit wrapper for API routes
 * Throws error if limit exceeded
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<void> {
    const result = checkRateLimit(
        {
            identifier: key,
            limit,
            windowSizeSeconds: windowSeconds,
        },
        { ip: key }
    )

    if (!result.success) {
        throw new Error('Rate limit exceeded')
    }
}

export function resetRateLimit(
    config: RateLimitConfig,
    client: ClientIdentifier
): void {
    const key = generateKey(config, client)
    rateLimitStore.set(key, {
        count: 0,
        windowStart: Date.now(),
        requests: []
    })
}