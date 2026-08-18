// ============================================================================
// VALIDATION SCHEMAS — ENTERPRISE-GRADE ZOD SCHEMAS
// ============================================================================
// Este módulo contém todos os schemas de validação para entidades do sistema.
// Usa Zod para validação runtime com inferência de tipos TypeScript.
// Projetado para escala de 200.000+ clientes com mensagens de erro localizadas.
// ============================================================================

import { z } from 'zod'

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

/**
 * Validadores reutilizáveis para campos comuns
 */
export const validators = {
    /** UUID v4 */
    uuid: z.string().uuid('ID inválido'),

    /** Email com validação robusta */
    email: z.string()
        .email('Email inválido')
        .max(255, 'Email muito longo (máx. 255 caracteres)')
        .transform(v => v.toLowerCase().trim()),

    /** Telefone brasileiro (aceita vários formatos) */
    phone: z.string()
        .min(10, 'Telefone deve ter pelo menos 10 dígitos')
        .max(20, 'Telefone muito longo')
        .regex(/^[\d\s\-\(\)\+]+$/, 'Formato de telefone inválido')
        .transform(v => v.replace(/\D/g, '')), // Remove não-dígitos

    /** CPF brasileiro */
    cpf: z.string()
        .length(11, 'CPF deve ter 11 dígitos')
        .regex(/^\d{11}$/, 'CPF deve conter apenas números')
        .refine(validateCPF, 'CPF inválido'),

    /** CNPJ brasileiro */
    cnpj: z.string()
        .length(14, 'CNPJ deve ter 14 dígitos')
        .regex(/^\d{14}$/, 'CNPJ deve conter apenas números')
        .refine(validateCNPJ, 'CNPJ inválido'),

    /** Valor monetário (centavos) */
    money: z.number()
        .int('Valor deve ser inteiro (centavos)')
        .min(0, 'Valor não pode ser negativo')
        .max(999999999, 'Valor muito alto'),

    /** Valor monetário decimal */
    moneyDecimal: z.number()
        .min(0, 'Valor não pode ser negativo')
        .max(9999999.99, 'Valor muito alto')
        .transform(v => Math.round(v * 100) / 100), // 2 casas decimais

    /** Porcentagem (0-100) */
    percentage: z.number()
        .min(0, 'Porcentagem mínima é 0%')
        .max(100, 'Porcentagem máxima é 100%'),

    /** Duração em minutos */
    duration: z.number()
        .int('Duração deve ser em minutos inteiros')
        .min(5, 'Duração mínima é 5 minutos')
        .max(480, 'Duração máxima é 8 horas'),

    /** Data ISO */
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

    /** Hora HH:MM */
    time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora deve estar no formato HH:MM'),

    /** Nome de pessoa */
    name: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome muito longo (máx. 100 caracteres)')
        .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
        .transform(v => v.trim()),

    /** Texto livre com limite */
    text: (maxLength: number = 500) => z.string()
        .max(maxLength, `Texto muito longo (máx. ${maxLength} caracteres)`)
        .transform(v => v.trim()),

    /** Texto opcional */
    optionalText: (maxLength: number = 500) => z.string()
        .max(maxLength, `Texto muito longo (máx. ${maxLength} caracteres)`)
        .transform(v => v.trim())
        .optional()
        .nullable(),
}

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

/**
 * Schema para criação de cliente
 */
export const createClientSchema = z.object({
    name: validators.name,
    email: validators.email.optional().nullable(),
    phone: validators.phone.optional().nullable(),
    birth_date: validators.date.optional().nullable(),
    gender: z.enum(['male', 'female', 'other']).optional().nullable(),
    notes: validators.optionalText(1000),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

/**
 * Schema para atualização de cliente
 */
export const updateClientSchema = z.object({
    id: validators.uuid,
    name: validators.name.optional(),
    email: validators.email.optional().nullable(),
    phone: validators.phone.optional().nullable(),
    birth_date: validators.date.optional().nullable(),
    gender: z.enum(['male', 'female', 'other']).optional().nullable(),
    notes: validators.optionalText(1000),
})

export type UpdateClientInput = z.infer<typeof updateClientSchema>

// ============================================================================
// PROFESSIONAL SCHEMAS
// ============================================================================

/**
 * Schema para criação de profissional
 */
export const createProfessionalSchema = z.object({
    name: validators.name,
    email: validators.email.optional().nullable(),
    phone: validators.phone.optional().nullable(),
    specialty: validators.optionalText(100),
    commission_rate: validators.percentage.default(0),
    status: z.enum(['active', 'inactive', 'vacation']).default('active'),
})

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>

/**
 * Schema para atualização de profissional
 */
export const updateProfessionalSchema = z.object({
    id: validators.uuid,
    name: validators.name.optional(),
    email: validators.email.optional().nullable(),
    phone: validators.phone.optional().nullable(),
    specialty: validators.optionalText(100),
    commission_rate: validators.percentage.optional(),
    status: z.enum(['active', 'inactive', 'vacation']).optional(),
})

export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>

// ============================================================================
// SERVICE SCHEMAS
// ============================================================================

/**
 * Schema para criação de serviço
 */
export const createServiceSchema = z.object({
    name: z.string()
        .min(2, 'Nome do serviço deve ter pelo menos 2 caracteres')
        .max(100, 'Nome do serviço muito longo'),
    description: validators.optionalText(500),
    category: z.string()
        .min(1, 'Categoria é obrigatória')
        .max(50, 'Categoria muito longa'),
    price: validators.moneyDecimal,
    duration: validators.duration,
    is_active: z.boolean().default(true),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>

/**
 * Schema para atualização de serviço
 */
export const updateServiceSchema = z.object({
    id: validators.uuid,
    name: z.string()
        .min(2, 'Nome do serviço deve ter pelo menos 2 caracteres')
        .max(100, 'Nome do serviço muito longo')
        .optional(),
    description: validators.optionalText(500),
    category: z.string()
        .min(1, 'Categoria é obrigatória')
        .max(50, 'Categoria muito longa')
        .optional(),
    price: validators.moneyDecimal.optional(),
    duration: validators.duration.optional(),
    is_active: z.boolean().optional(),
})

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>

// ============================================================================
// APPOINTMENT SCHEMAS
// ============================================================================

/**
 * Schema para criação de agendamento
 */
export const createAppointmentSchema = z.object({
    client_id: validators.uuid.optional().nullable(),
    professional_id: validators.uuid,
    service_id: validators.uuid.optional().nullable(),
    client_name: validators.name,
    client_phone: validators.phone.optional().nullable(),
    service_name: z.string().min(1, 'Nome do serviço é obrigatório').max(100),
    service_price: validators.moneyDecimal,
    scheduled_date: validators.date,
    scheduled_time: validators.time,
    duration: validators.duration,
    notes: validators.optionalText(500),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

/**
 * Schema para atualização de agendamento
 */
export const updateAppointmentSchema = z.object({
    id: validators.uuid,
    client_id: validators.uuid.optional().nullable(),
    professional_id: validators.uuid.optional(),
    service_id: validators.uuid.optional().nullable(),
    client_name: validators.name.optional(),
    client_phone: validators.phone.optional().nullable(),
    service_name: z.string().min(1).max(100).optional(),
    service_price: validators.moneyDecimal.optional(),
    scheduled_date: validators.date.optional(),
    scheduled_time: validators.time.optional(),
    duration: validators.duration.optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
    notes: validators.optionalText(500),
})

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

/**
 * Schema para criação de transação
 */
export const createTransactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Categoria é obrigatória').max(50),
    description: validators.optionalText(200),
    amount: validators.moneyDecimal.refine(v => v > 0, 'Valor deve ser maior que zero'),
    date: validators.date,
    payment_method: z.string().max(50).optional().nullable(),
    professional_id: validators.uuid.optional().nullable(),
    appointment_id: validators.uuid.optional().nullable(),
    commission_amount: validators.moneyDecimal.optional().nullable(),
    is_confirmed: z.boolean().default(false),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

/**
 * Schema para atualização de transação
 */
export const updateTransactionSchema = z.object({
    id: validators.uuid,
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).max(50).optional(),
    description: validators.optionalText(200),
    amount: validators.moneyDecimal.optional(),
    date: validators.date.optional(),
    payment_method: z.string().max(50).optional().nullable(),
    is_confirmed: z.boolean().optional(),
})

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

/**
 * Schema para criação de produto
 */
export const createProductSchema = z.object({
    name: z.string()
        .min(2, 'Nome do produto deve ter pelo menos 2 caracteres')
        .max(100, 'Nome do produto muito longo'),
    description: validators.optionalText(500),
    barcode: z.string().max(50).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    price: validators.moneyDecimal,
    cost_price: validators.moneyDecimal.optional().nullable(),
    stock_quantity: z.number().int().min(0, 'Quantidade não pode ser negativa').default(0),
    min_stock_level: z.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

/**
 * Schema para atualização de produto
 */
export const updateProductSchema = z.object({
    id: validators.uuid,
    name: z.string().min(2).max(100).optional(),
    description: validators.optionalText(500),
    barcode: z.string().max(50).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    price: validators.moneyDecimal.optional(),
    cost_price: validators.moneyDecimal.optional().nullable(),
    stock_quantity: z.number().int().min(0).optional(),
    min_stock_level: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ============================================================================
// SALON SETTINGS SCHEMAS
// ============================================================================

/**
 * Schema para atualização de configurações do salon
 */
export const updateSalonSettingsSchema = z.object({
    theme_color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
        .optional()
        .nullable(),
    sidebar_compact: z.boolean().optional(),
    animations_enabled: z.boolean().optional(),
    notifications_enabled: z.boolean().optional(),
    notification_email: validators.email.optional().nullable(),
    notification_whatsapp: validators.phone.optional().nullable(),
    working_hours: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type UpdateSalonSettingsInput = z.infer<typeof updateSalonSettingsSchema>

// ============================================================================
// DELETE SCHEMA
// ============================================================================

/**
 * Schema genérico para exclusão
 */
export const deleteSchema = z.object({
    id: validators.uuid,
})

export type DeleteInput = z.infer<typeof deleteSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida CPF brasileiro
 */
function validateCPF(cpf: string): boolean {
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false // Todos dígitos iguais

    let sum = 0
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(10))) return false

    return true
}

/**
 * Valida CNPJ brasileiro
 */
function validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false // Todos dígitos iguais

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights1[i]
    }
    let remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(cnpj.charAt(12))) return false

    sum = 0
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights2[i]
    }
    remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(cnpj.charAt(13))) return false

    return true
}

/**
 * Extrai erros de validação do Zod em formato amigável
 */
export function extractValidationErrors(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const issue of error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
            errors[path] = issue.message
        }
    }
    return errors
}

/**
 * Valida input e retorna resultado tipado
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(input)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, errors: extractValidationErrors(result.error) }
}