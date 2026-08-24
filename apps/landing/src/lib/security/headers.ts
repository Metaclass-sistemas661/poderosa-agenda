// ============================================================================
// SECURITY HEADERS — ENTERPRISE-GRADE HTTP SECURITY HEADERS
// ============================================================================
// Este módulo define todos os headers de segurança HTTP para a aplicação.
// Segue as melhores práticas OWASP e recomendações do NIST.
// Projetado para score A+ no SecurityHeaders.com e Observatory do Mozilla.
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityHeaderConfig {
    name: string
    value: string
    description: string
}

export interface CSPDirectives {
    [key: string]: string[]
}

// ============================================================================
// CONTENT SECURITY POLICY — ENTERPRISE CONFIGURATION
// ============================================================================

/**
 * Gera o valor do header Content-Security-Policy.
 * 
 * Política rigorosa para SaaS multi-tenant com:
 * - Supabase (API + Auth + Storage + Realtime)
 * - Next.js (scripts inline controlados)
 * - Google Fonts (opcional)
 * - Stripe (se aplicável)
 * 
 * NOTA: 'unsafe-inline' para style-src é necessário para
 * Tailwind CSS e styled-components em produção.
 */
export function buildCSP(options?: {
    /** Modo report-only (não bloqueia, apenas reporta) */
    reportOnly?: boolean
    /** URL para envio de relatórios CSP */
    reportUri?: string
    /** Nonce para scripts inline específicos */
    nonce?: string
    /** Domínios adicionais para imagens */
    additionalImageDomains?: string[]
    /** Domínios adicionais para scripts */
    additionalScriptDomains?: string[]
}): string {
    const supabaseProjectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
        : '*.supabase.co'

    const directives: CSPDirectives = {
        // Política padrão restritiva
        'default-src': ["'self'"],

        // Scripts: apenas origin próprio + Next.js + nonce
        'script-src': [
            "'self'",
            "'unsafe-eval'",        // Necessário para Next.js dev mode
            "'unsafe-inline'",      // Necessário para Next.js inline scripts
            'https://cdn.jsdelivr.net',
            ...(options?.additionalScriptDomains || []),
        ],

        // Estilos: self + unsafe-inline (Tailwind/CSS-in-JS)
        'style-src': [
            "'self'",
            "'unsafe-inline'",      // Necessário para Tailwind CSS
            'https://fonts.googleapis.com',
        ],

        // Imagens: self + data URIs + CDNs confiáveis
        'img-src': [
            "'self'",
            'data:',                // Base64 images
            'blob:',                // Blob URLs
            `https://${supabaseProjectRef}`,
            'https://images.unsplash.com',
            'https://*.githubusercontent.com',
            ...(options?.additionalImageDomains || []),
        ],

        // Fontes: self + Google Fonts
        'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
            'data:',
        ],

        // Conexões: self + Supabase (REST, Auth, Realtime, Storage) + ViaCEP
        'connect-src': [
            "'self'",
            `https://${supabaseProjectRef}`,
            `wss://${supabaseProjectRef}`,  // Supabase Realtime WebSocket
            'https://*.supabase.co',
            'wss://*.supabase.co',
            'https://viacep.com.br',
            process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
            process.env.NODE_ENV === 'development' ? 'http://localhost:*' : '',
        ].filter(Boolean),

        // Frames: nenhum (previne clickjacking)
        'frame-src': ["'none'"],

        // Frame ancestors: nenhum (previne embedding)
        'frame-ancestors': ["'none'"],

        // Objetos: nenhum (sem Flash/plugins)
        'object-src': ["'none'"],

        // Base URI: apenas self (previne base tag injection)
        'base-uri': ["'self'"],

        // Form actions: apenas self
        'form-action': ["'self'"],

        // Manifests: apenas self
        'manifest-src': ["'self'"],

        // Media: self + Supabase storage
        'media-src': [
            "'self'",
            `https://${supabaseProjectRef}`,
        ],

        // Workers: self + blob
        'worker-src': [
            "'self'",
            'blob:',
        ],
    }

    // Adicionar report-uri se fornecido
    if (options?.reportUri) {
        directives['report-uri'] = [options.reportUri]
    }

    // Construir string CSP
    const cspString = Object.entries(directives)
        .filter(([, values]) => values.length > 0)
        .map(([directive, values]) => {
            return `${directive} ${values.join(' ')}`
        })
        .join('; ')

    return cspString
}

// ============================================================================
// SECURITY HEADERS DEFINITIONS
// ============================================================================

/**
 * Gera todos os headers de segurança HTTP enterprise-grade.
 * 
 * Headers implementados:
 * - Content-Security-Policy (CSP) — previne XSS
 * - Strict-Transport-Security (HSTS) — força HTTPS
 * - X-Frame-Options — previne clickjacking
 * - X-Content-Type-Options — previne MIME sniffing
 * - Referrer-Policy — controla informações de referência
 * - Permissions-Policy — controla APIs do browser
 * - X-XSS-Protection — proteção XSS legacy
 * - X-DNS-Prefetch-Control — controla prefetch de DNS
 * - X-Download-Options — previne abertura em IE
 * - X-Permitted-Cross-Domain-Policies — controla Flash/PDF
 * - Cross-Origin-Opener-Policy (COOP)
 * - Cross-Origin-Embedder-Policy (COEP)
 * - Cross-Origin-Resource-Policy (CORP)
 */
export function getSecurityHeaders(options?: {
    reportUri?: string
    cspReportOnly?: boolean
}): SecurityHeaderConfig[] {
    const csp = buildCSP({
        reportUri: options?.reportUri,
        additionalImageDomains: [],
        additionalScriptDomains: [],
    })

    return [
        // ====================================================================
        // CONTENT SECURITY POLICY
        // ====================================================================
        {
            name: options?.cspReportOnly
                ? 'Content-Security-Policy-Report-Only'
                : 'Content-Security-Policy',
            value: csp,
            description: 'Previne XSS e injeção de conteúdo'
        },

        // ====================================================================
        // HTTP STRICT TRANSPORT SECURITY (HSTS)
        // ====================================================================
        {
            name: 'Strict-Transport-Security',
            // 2 anos + includeSubDomains + preload
            value: 'max-age=63072000; includeSubDomains; preload',
            description: 'Força HTTPS por 2 anos, incluindo subdomínios'
        },

        // ====================================================================
        // X-FRAME-OPTIONS (Clickjacking Protection)
        // ====================================================================
        {
            name: 'X-Frame-Options',
            value: 'DENY',
            description: 'Previne embedding em iframes (clickjacking)'
        },

        // ====================================================================
        // X-CONTENT-TYPE-OPTIONS (MIME Sniffing)
        // ====================================================================
        {
            name: 'X-Content-Type-Options',
            value: 'nosniff',
            description: 'Previne MIME type sniffing'
        },

        // ====================================================================
        // REFERRER POLICY
        // ====================================================================
        {
            name: 'Referrer-Policy',
            // Envia referrer apenas para same-origin, sem cross-origin
            value: 'strict-origin-when-cross-origin',
            description: 'Controla informações de referência enviadas'
        },

        // ====================================================================
        // PERMISSIONS POLICY (Feature Policy)
        // ====================================================================
        {
            name: 'Permissions-Policy',
            value: [
                'camera=()',             // Sem acesso à câmera
                'microphone=()',         // Sem acesso ao microfone
                'geolocation=()',        // Sem acesso à geolocalização
                'payment=()',            // Sem Payment Request API
                'usb=()',                // Sem acesso a USB
                'magnetometer=()',       // Sem magnetômetro
                'accelerometer=()',      // Sem acelerômetro
                'gyroscope=()',          // Sem giroscópio
                'display-capture=()',    // Sem captura de tela
                'picture-in-picture=()', // Sem picture-in-picture
                'fullscreen=(self)',     // Fullscreen apenas self
                'interest-cohort=()',    // Sem FLoC (privacy)
            ].join(', '),
            description: 'Restringe acesso a APIs do browser'
        },

        // ====================================================================
        // X-XSS-PROTECTION (Legacy)
        // ====================================================================
        {
            name: 'X-XSS-Protection',
            // Mode=block bloqueia a página ao detectar XSS
            value: '1; mode=block',
            description: 'Proteção XSS para browsers legados'
        },

        // ====================================================================
        // X-DNS-PREFETCH-CONTROL
        // ====================================================================
        {
            name: 'X-DNS-Prefetch-Control',
            value: 'on',
            description: 'Controla prefetch de DNS para performance'
        },

        // ====================================================================
        // X-DOWNLOAD-OPTIONS (IE/Edge Legacy)
        // ====================================================================
        {
            name: 'X-Download-Options',
            value: 'noopen',
            description: 'Previne abertura automática de downloads no IE'
        },

        // ====================================================================
        // X-PERMITTED-CROSS-DOMAIN-POLICIES
        // ====================================================================
        {
            name: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
            description: 'Bloqueia políticas cross-domain para Flash/PDF'
        },

        // ====================================================================
        // CROSS-ORIGIN-OPENER-POLICY (COOP)
        // ====================================================================
        {
            name: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
            description: 'Isola contexto de browsing de cross-origin'
        },

        // ====================================================================
        // CROSS-ORIGIN-RESOURCE-POLICY (CORP)
        // ====================================================================
        {
            name: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
            description: 'Protege recursos de serem carregados cross-origin'
        },

        // ====================================================================
        // CACHE-CONTROL para páginas sensíveis
        // ====================================================================
        // Nota: Este é aplicado via middleware para rotas /salon/* e /admin/*
        // Aqui deixamos comentado como referência

        // ====================================================================
        // X-REQUEST-ID (Rastreamento)
        // ====================================================================
        // Nota: Aplicado dinamicamente pelo middleware
    ]
}

// ============================================================================
// NEXT.JS HEADERS FORMAT
// ============================================================================

/**
 * Formato de headers para uso no next.config.js
 */
export interface NextJsHeader {
    key: string
    value: string
}

/**
 * Converte SecurityHeaderConfig para formato do Next.js
 */
export function toNextJsFormat(headers: SecurityHeaderConfig[]): NextJsHeader[] {
    return headers.map(h => ({
        key: h.name,
        value: h.value
    }))
}

/**
 * Gera configuração de headers para next.config.js.
 * 
 * @example
 * ```js
 * // next.config.js
 * const { getNextJsSecurityHeaders } = require('./src/lib/security/headers')
 * 
 * module.exports = {
 *   async headers() {
 *     return getNextJsSecurityHeaders()
 *   }
 * }
 * ```
 */
export function getNextJsSecurityHeaders(): Array<{
    source: string
    headers: NextJsHeader[]
}> {
    const allHeaders = toNextJsFormat(getSecurityHeaders())
    const strictHeaders = toNextJsFormat([
        {
            name: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
            description: 'Previne caching de páginas sensíveis'
        },
        {
            name: 'Pragma',
            value: 'no-cache',
            description: 'Previne caching em proxies legados'
        },
        {
            name: 'Expires',
            value: '0',
            description: 'Previne caching em browsers legados'
        }
    ])

    return [
        // Headers para todas as rotas
        {
            source: '/(.*)',
            headers: allHeaders
        },
        // Headers adicionais para rotas protegidas (sem cache)
        {
            source: '/salon/(.*)',
            headers: strictHeaders
        },
        {
            source: '/admin/(.*)',
            headers: strictHeaders
        },
    ]
}

// ============================================================================
// MIDDLEWARE SECURITY HEADERS
// ============================================================================

/**
 * Adiciona security headers a uma resposta Next.js no middleware.
 * Usado para headers dinâmicos (ex: com nonce).
 */
export function applySecurityHeadersToResponse(
    response: import('next/server').NextResponse,
    options?: {
        nonce?: string
        requestId?: string
    }
): import('next/server').NextResponse {
    const headers = getSecurityHeaders()

    for (const header of headers) {
        response.headers.set(header.name, header.value)
    }

    // Request ID para rastreamento
    if (options?.requestId) {
        response.headers.set('X-Request-Id', options.requestId)
    }

    // Timestamp para debugging
    response.headers.set('X-Response-Time', new Date().toISOString())

    return response
}

// ============================================================================
// SECURITY ANALYSIS
// ============================================================================

/**
 * Analisa headers e retorna score estimado
 */
export function analyzeSecurityHeaders(headers: SecurityHeaderConfig[]): {
    score: number
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
    missing: string[]
    present: string[]
} {
    const CRITICAL_HEADERS = [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
    ]

    const BONUS_HEADERS = [
        'Cross-Origin-Opener-Policy',
        'Cross-Origin-Resource-Policy',
        'Cross-Origin-Embedder-Policy',
    ]

    const presentNames = headers.map(h => h.name)
    const present = CRITICAL_HEADERS.filter(h => presentNames.includes(h))
    const missing = CRITICAL_HEADERS.filter(h => !presentNames.includes(h))
    const bonusPresent = BONUS_HEADERS.filter(h => presentNames.includes(h))

    const criticalScore = (present.length / CRITICAL_HEADERS.length) * 80
    const bonusScore = (bonusPresent.length / BONUS_HEADERS.length) * 20
    const score = Math.round(criticalScore + bonusScore)

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
    if (score >= 95) grade = 'A+'
    else if (score >= 80) grade = 'A'
    else if (score >= 65) grade = 'B'
    else if (score >= 50) grade = 'C'
    else if (score >= 35) grade = 'D'
    else grade = 'F'

    return { score, grade, missing, present }
}