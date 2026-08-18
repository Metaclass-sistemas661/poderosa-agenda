/**
 * Application Constants
 * 
 * Centralized constants to avoid magic strings/numbers
 * and ensure consistency across the application.
 */

// Application Info
export const APP_NAME = 'Poderosa Agenda'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://poderosa-agenda.com'
export const APP_VERSION = '1.0.0'

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 5,
} as const

// Cache TTL (in seconds)
export const CACHE_TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 600,        // 10 minutes
    VERY_LONG: 3600,  // 1 hour
} as const

// User Roles
export const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    RECEPTIONIST: 'receptionist',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// Role Hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [ROLES.SUPERADMIN]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.STAFF]: 2,
    [ROLES.RECEPTIONIST]: 1,
}

// Appointment Status
export const APPOINTMENT_STATUS = {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
} as const

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS]

// Transaction Types
export const TRANSACTION_TYPES = {
    PAYMENT: 'payment',
    REFUND: 'refund',
    ADJUSTMENT: 'adjustment',
} as const

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]

// Transaction Categories
export const TRANSACTION_CATEGORIES = {
    SERVICE: 'service',
    PRODUCT: 'product',
    OTHER: 'other',
} as const

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[keyof typeof TRANSACTION_CATEGORIES]

// Payment Methods
export const PAYMENT_METHODS = {
    CASH: 'cash',
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PIX: 'pix',
    BANK_TRANSFER: 'bank_transfer',
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

// Date/Time Formats
export const DATE_FORMATS = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd/MM/yyyy HH:mm',
    TIME_ONLY: 'HH:mm',
    ISO: 'yyyy-MM-dd',
} as const

// Validation Rules
export const VALIDATION = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    PASSWORD_MIN_LENGTH: 8,
    CPF_LENGTH: 11,
    PRICE_MIN: 0,
    PRICE_MAX: 999999.99,
    DURATION_MIN: 5,      // minutes
    DURATION_MAX: 480,    // 8 hours
    STOCK_MIN: 0,
    COMMISSION_MIN: 0,    // percentage
    COMMISSION_MAX: 100,  // percentage
} as const

// File Upload Limits
export const FILE_UPLOAD = {
    MAX_SIZE_AVATAR: 2 * 1024 * 1024,      // 2MB
    MAX_SIZE_LOGO: 2 * 1024 * 1024,        // 2MB
    MAX_SIZE_PRODUCT: 5 * 1024 * 1024,     // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
} as const

// Rate Limiting
export const RATE_LIMITS = {
    AUTH: {
        points: 5,
        duration: 60, // 1 minute
    },
    API: {
        points: 100,
        duration: 60, // 1 minute
    },
    MUTATIONS: {
        points: 30,
        duration: 60, // 1 minute
    },
} as const

// Storage Buckets
export const STORAGE_BUCKETS = {
    AVATARS: 'avatars',
    SALON_LOGOS: 'salon-logos',
    PRODUCTS: 'products',
} as const

// Route Paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/cadastro',
    DASHBOARD: '/salon/dashboard',
    CLIENTS: '/salon/clientes',
    APPOINTMENTS: '/salon/agendamentos',
    PROFESSIONALS: '/salon/profissionais',
    SERVICES: '/salon/servicos',
    PRODUCTS: '/salon/estoque',
    FINANCIAL: '/salon/financeiro',
    SETTINGS: '/salon/configuracoes',
} as const

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REGISTER: '/api/auth/register',
    },
    INTEGRATIONS: {
        GOOGLE_CALLBACK: '/api/integrations/google/callback',
        WHATSAPP_WEBHOOK: '/api/integrations/whatsapp/webhook',
    },
} as const

// Feature Flags
export const FEATURES = {
    ENABLE_WHATSAPP: process.env.NEXT_PUBLIC_ENABLE_WHATSAPP === 'true',
    ENABLE_GOOGLE_CALENDAR: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_CALENDAR === 'true',
    ENABLE_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
} as const

// Error Codes
export const ERROR_CODES = {
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
    APPOINTMENT_REMINDER: 'appointment_reminder',
    APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
    APPOINTMENT_CANCELLATION: 'appointment_cancellation',
    PAYMENT_RECEIVED: 'payment_received',
    LOW_STOCK: 'low_stock',
} as const

// Default Values
export const DEFAULTS = {
    AVATAR_URL: '/images/default-avatar.png',
    LOGO_URL: '/images/default-logo.png',
    TIMEZONE: 'America/Sao_Paulo',
    LOCALE: 'pt-BR',
    CURRENCY: 'BRL',
} as const

// Regex Patterns
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const

// Business Hours
export const BUSINESS_HOURS = {
    DEFAULT_OPEN: '08:00',
    DEFAULT_CLOSE: '18:00',
    INTERVAL_MINUTES: 15,
} as const

// Environment
export const ENV = {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_TEST: process.env.NODE_ENV === 'test',
} as const