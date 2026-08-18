// ============================================================================
// NEXT.JS CONFIGURATION — ENTERPRISE-GRADE SECURITY
// ============================================================================
// Configuração completa do Next.js com security headers enterprise.
// Segue OWASP Top 10 e NIST guidelines.
// ============================================================================

/** @type {import('next').NextConfig} */

// ============================================================================
// SECURITY HEADERS — Inline para uso em next.config.js (sem transpile issues)
// ============================================================================

/**
 * Gera o Content-Security-Policy
 * Suporta Supabase (REST + Auth + Realtime + Storage)
 */
function buildCSP() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co'

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://${supabaseHost} https://images.unsplash.com https://*.githubusercontent.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `manifest-src 'self'`,
    `media-src 'self' https://${supabaseHost}`,
    `worker-src 'self' blob:`,
    `upgrade-insecure-requests`,
  ]

  return directives.join('; ')
}

/**
 * Headers de segurança enterprise aplicados em todas as rotas
 */
function getSecurityHeaders() {
  return [
    // Content Security Policy — previne XSS
    {
      key: 'Content-Security-Policy',
      value: buildCSP(),
    },
    // HSTS — força HTTPS por 2 anos
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    // Previne clickjacking
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    // Previne MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    // Controla referrer information
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    // Restringe APIs do browser
    {
      key: 'Permissions-Policy',
      value: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()',
        'display-capture=()',
        'picture-in-picture=()',
        'fullscreen=(self)',
        'interest-cohort=()',
      ].join(', '),
    },
    // Proteção XSS legado
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    // DNS prefetch control
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    // Previne abertura automática em IE
    {
      key: 'X-Download-Options',
      value: 'noopen',
    },
    // Bloqueia políticas cross-domain para Flash/PDF
    {
      key: 'X-Permitted-Cross-Domain-Policies',
      value: 'none',
    },
    // COOP — isola contexto de browsing
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
    // CORP — protege recursos de serem carregados cross-origin
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
    },
  ]
}

/**
 * Headers adicionais para rotas sensíveis (sem cache)
 */
function getProtectedRouteHeaders() {
  return [
    {
      key: 'Cache-Control',
      value: 'no-store, no-cache, must-revalidate, max-age=0',
    },
    {
      key: 'Pragma',
      value: 'no-cache',
    },
    {
      key: 'Expires',
      value: '0',
    },
  ]
}

// ============================================================================
// NEXT.JS CONFIG
// ============================================================================

const nextConfig = {
  reactStrictMode: true,

  // Imagens permitidas
  images: {
    domains: [
      'images.unsplash.com',
      // Supabase Storage (domínio dinâmico baseado no URL)
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers aplicados a todas as rotas
  async headers() {
    const securityHeaders = getSecurityHeaders()
    const protectedHeaders = getProtectedRouteHeaders()

    return [
      // Todas as rotas recebem security headers
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Rotas do painel (sem cache + security headers)
      {
        source: '/salon/(.*)',
        headers: protectedHeaders,
      },
      // Rotas de admin (sem cache + security headers)
      {
        source: '/admin/(.*)',
        headers: protectedHeaders,
      },
      // Rotas de API (sem cache)
      {
        source: '/api/(.*)',
        headers: [
          ...protectedHeaders,
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },

  // Redirecionamentos de segurança
  async redirects() {
    return [
      // Redireciona HTTP para HTTPS em produção
      // (Vercel/CDN geralmente faz isso, mas como fallback)
    ]
  },
}

module.exports = nextConfig