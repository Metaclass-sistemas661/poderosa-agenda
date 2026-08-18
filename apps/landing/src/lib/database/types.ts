// ============================================================================
// DATABASE TYPES — ENTERPRISE-GRADE TYPE DEFINITIONS
// ============================================================================
// Estas definições de tipo fornecem segurança de tipo completa para todas
// as operações de banco de dados. São derivadas do schema do Supabase.
// ============================================================================

/**
 * Tabelas com escopo de tenant (salon_id)
 */
export type TenantScopedTable =
    | 'professionals'
    | 'services'
    | 'clients'
    | 'appointments'
    | 'transactions'
    | 'products'
    | 'salon_settings'

/**
 * Tabelas do sistema (sem escopo de tenant)
 */
export type SystemTable =
    | 'salons'
    | 'admin_users'

/**
 * Todas as tabelas do banco
 */
export type DatabaseTable = TenantScopedTable | SystemTable

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Base para todas as entidades com escopo de tenant
 * Index signature permite uso genérico em helpers
 */
export interface BaseTenantEntity {
    id: string
    salon_id: string
    created_at: string
    updated_at?: string | null
    [key: string]: unknown
}

/**
 * Salon (tenant)
 */
export interface Salon {
    id: string
    name: string
    slug: string
    plan: 'free' | 'basic' | 'professional' | 'enterprise'
    status: 'active' | 'inactive' | 'suspended'
    owner_email: string
    phone?: string | null
    address?: string | null
    created_at: string
    updated_at?: string | null
}

/**
 * Admin User
 */
export interface AdminUser {
    id: string
    user_id: string
    salon_id: string | null
    role: 'superadmin' | 'admin' | 'professional' | 'receptionist'
    name: string
    email: string
    phone?: string | null
    cpf?: string | null
    created_at: string
    updated_at?: string | null
}

/**
 * Professional
 */
export interface Professional extends BaseTenantEntity {
    name: string
    email?: string | null
    phone?: string | null
    specialty?: string | null
    photo_url?: string | null
    commission_rate: number
    is_active: boolean
    status: 'active' | 'inactive' | 'vacation'
    working_hours?: Record<string, unknown> | null
}

/**
 * Service
 */
export interface Service extends BaseTenantEntity {
    name: string
    description?: string | null
    category: string
    price: number
    duration: number
    is_active: boolean
}

/**
 * Client
 */
export interface Client extends BaseTenantEntity {
    name: string
    email?: string | null
    phone?: string | null
    birth_date?: string | null
    gender?: 'male' | 'female' | 'other' | null
    notes?: string | null
    total_visits: number
    last_visit?: string | null
}

/**
 * Appointment
 */
export interface Appointment extends BaseTenantEntity {
    client_id?: string | null
    professional_id: string
    service_id?: string | null
    client_name: string
    client_phone?: string | null
    service_name: string
    service_price: number
    scheduled_date: string
    scheduled_time: string
    duration: number
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
    notes?: string | null
}

/**
 * Transaction
 */
export interface Transaction extends BaseTenantEntity {
    type: 'income' | 'expense'
    category: string
    description?: string | null
    amount: number
    date: string
    payment_method?: string | null
    professional_id?: string | null
    appointment_id?: string | null
    commission_amount?: number | null
    is_confirmed: boolean
}

/**
 * Product
 */
export interface Product extends BaseTenantEntity {
    name: string
    description?: string | null
    barcode?: string | null
    category?: string | null
    sale_price: number
    cost_price?: number | null
    stock_quantity: number
    min_stock: number
    is_active: boolean
}

/**
 * Salon Settings
 */
export interface SalonSettings extends BaseTenantEntity {
    working_hours?: Record<string, unknown> | null
    theme_color?: string | null
    logo_url?: string | null
    sidebar_compact: boolean
    animations_enabled: boolean
    notifications_enabled: boolean
    notification_email?: string | null
    notification_whatsapp?: string | null
}

// ============================================================================
// MAPPED TYPES — TABLE TO ENTITY MAPPING
// ============================================================================

/**
 * Mapeia nome da tabela para tipo da entidade
 */
export interface TableEntityMap {
    salons: Salon
    admin_users: AdminUser
    professionals: Professional
    services: Service
    clients: Client
    appointments: Appointment
    transactions: Transaction
    products: Product
    salon_settings: SalonSettings
}

/**
 * Obtém o tipo de entidade a partir do nome da tabela
 */
export type EntityFromTable<T extends DatabaseTable> = TableEntityMap[T]

/**
 * Helper type para compatibilidade com padrão Supabase
 * Permite uso: Tables<'clients'> para obter tipo Client
 */
export type Tables<T extends keyof TableEntityMap> = TableEntityMap[T]

// ============================================================================
// MUTATION TYPES
// ============================================================================

/**
 * Tipo para inserção (exclui campos gerados automaticamente)
 */
export type InsertData<T extends BaseTenantEntity> = Omit<T, 'id' | 'salon_id' | 'created_at' | 'updated_at'>

/**
 * Tipo para atualização (todos os campos opcionais exceto os protegidos)
 */
export type UpdateData<T extends BaseTenantEntity> = Partial<Omit<T, 'id' | 'salon_id' | 'created_at'>>

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Resultado de operação de banco de dados
 */
export interface DatabaseResult<T> {
    data: T | null
    error: DatabaseError | null
    success: boolean
}

/**
 * Resultado de operação de lista
 */
export interface DatabaseListResult<T> {
    data: T[] | null
    error: DatabaseError | null
    count: number
    success: boolean
}

/**
 * Erro de banco de dados estruturado
 */
export interface DatabaseError {
    code: string
    message: string
    details?: string | null
    hint?: string | null
}

// ============================================================================
// QUERY OPTIONS
// ============================================================================

/**
 * Opções de query para listagem
 */
export interface QueryOptions<T> {
    /** Campos a selecionar (default: '*') */
    select?: string
    /** Ordenação */
    orderBy?: {
        column: keyof T
        ascending?: boolean
    }
    /** Limite de resultados */
    limit?: number
    /** Offset para paginação */
    offset?: number
    /** Filtros adicionais */
    filters?: QueryFilter<T>[]
}

/**
 * Filtro de query
 */
export interface QueryFilter<T> {
    column: keyof T
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is'
    value: unknown
}

// ============================================================================
// SUPABASE CLIENT WRAPPER TYPES
// ============================================================================

/**
 * Interface para cliente Supabase com tipos dinâmicos
 */
export interface SupabaseClientWrapper {
    from: (table: string) => SupabaseQueryBuilder
    auth: {
        getSession: () => Promise<{ data: { session: unknown }; error: unknown }>
        getUser: () => Promise<{ data: { user: unknown }; error: unknown }>
        signOut: () => Promise<{ error: unknown }>
    }
}

/**
 * Interface para query builder
 */
export interface SupabaseQueryBuilder {
    select: (columns?: string) => SupabaseQueryBuilder
    insert: (data: unknown) => SupabaseQueryBuilder
    update: (data: unknown) => SupabaseQueryBuilder
    delete: () => SupabaseQueryBuilder
    eq: (column: string, value: unknown) => SupabaseQueryBuilder
    neq: (column: string, value: unknown) => SupabaseQueryBuilder
    gt: (column: string, value: unknown) => SupabaseQueryBuilder
    gte: (column: string, value: unknown) => SupabaseQueryBuilder
    lt: (column: string, value: unknown) => SupabaseQueryBuilder
    lte: (column: string, value: unknown) => SupabaseQueryBuilder
    like: (column: string, value: unknown) => SupabaseQueryBuilder
    ilike: (column: string, value: unknown) => SupabaseQueryBuilder
    in: (column: string, values: unknown[]) => SupabaseQueryBuilder
    is: (column: string, value: unknown) => SupabaseQueryBuilder
    order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder
    limit: (count: number) => SupabaseQueryBuilder
    range: (from: number, to: number) => SupabaseQueryBuilder
    single: () => Promise<{ data: unknown; error: unknown }>
    then: <T>(resolve: (result: { data: unknown; error: unknown }) => T) => Promise<T>
}