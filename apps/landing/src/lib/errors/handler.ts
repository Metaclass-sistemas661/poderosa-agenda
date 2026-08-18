/**
 * Enterprise Error Handling System
 * 
 * Provides consistent error handling across the application with:
 * - Custom error classes
 * - Centralized error logging
 * - Type-safe error handling
 * - Integration with observability
 */

import { log } from '@/lib/observability/logger'

/**
 * Base application error class
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'AppError'
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
        }
    }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        super(
            `${resource}${id ? ` with id '${id}'` : ''} not found`,
            'NOT_FOUND',
            404,
            { resource, id }
        )
        this.name = 'NotFoundError'
    }
}

/**
 * Unauthorized access error (401)
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED', 401)
        this.name = 'UnauthorizedError'
    }
}

/**
 * Forbidden access error (403)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 'FORBIDDEN', 403)
        this.name = 'ForbiddenError'
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
    constructor(message: string, fields?: Record<string, string>) {
        super(message, 'VALIDATION_ERROR', 400, { fields })
        this.name = 'ValidationError'
    }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
    constructor(message: string, conflictingField?: string) {
        super(message, 'CONFLICT', 409, { conflictingField })
        this.name = 'ConflictError'
    }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends AppError {
    constructor(retryAfter?: number) {
        super(
            'Rate limit exceeded',
            'RATE_LIMIT_EXCEEDED',
            429,
            { retryAfter }
        )
        this.name = 'RateLimitError'
    }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(message, 'DATABASE_ERROR', 500, { originalError: originalError?.message })
        this.name = 'DatabaseError'
    }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message: string) {
        super(
            `External service error: ${service} - ${message}`,
            'EXTERNAL_SERVICE_ERROR',
            502,
            { service }
        )
        this.name = 'ExternalServiceError'
    }
}

/**
 * Handle errors in Server Actions
 * Logs the error and re-throws as AppError
 */
export function handleActionError(error: unknown): never {
    // Already an AppError - just log and re-throw
    if (error instanceof AppError) {
        log.error(error.message, error, {
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
        })
        throw error
    }

    // Standard Error - wrap in AppError
    if (error instanceof Error) {
        log.error('Unexpected error in action', error)
        throw new AppError(
            'Internal server error',
            'INTERNAL_ERROR',
            500,
            { originalMessage: error.message }
        )
    }

    // Unknown error type
    log.error('Unknown error type', undefined, { error })
    throw new AppError('Unknown error', 'UNKNOWN_ERROR', 500)
}

/**
 * Wrap Server Action with error handling and logging
 * 
 * @example
 * ```typescript
 * export const createClient = withErrorHandling(async (data: ClientData) => {
 *   // Your logic here
 * })
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    actionName?: string
): T {
    return (async (...args: Parameters<T>) => {
        const start = Date.now()
        try {
            const result = await fn(...args)
            const duration = Date.now() - start

            log.info(`Action completed: ${actionName || fn.name}`, {
                duration_ms: duration,
                action: actionName || fn.name,
            })

            return result
        } catch (error) {
            const duration = Date.now() - start

            log.error(
                `Action failed: ${actionName || fn.name}`,
                error as Error,
                {
                    duration_ms: duration,
                    action: actionName || fn.name,
                    args: JSON.stringify(args).substring(0, 100), // First 100 chars
                }
            )

            return handleActionError(error)
        }
    }) as T
}

/**
 * Assert condition or throw error
 * 
 * @example
 * ```typescript
 * assert(user !== null, new UnauthorizedError('User not found'))
 * ```
 */
export function assert(condition: boolean, error: AppError): asserts condition {
    if (!condition) {
        throw error
    }
}

/**
 * Try-catch wrapper that returns [error, null] or [null, data]
 * Useful for avoiding try-catch blocks
 * 
 * @example
 * ```typescript
 * const [error, user] = await tryCatch(getUser(id))
 * if (error) return handleError(error)
 * // user is safely available here
 * ```
 */
export async function tryCatch<T>(
    promise: Promise<T>
): Promise<[Error, null] | [null, T]> {
    try {
        const data = await promise
        return [null, data]
    } catch (error) {
        return [error as Error, null]
    }
}

/**
 * Safely execute async function with default fallback
 * 
 * @example
 * ```typescript
 * const user = await safeAsync(
 *   () => getUser(id),
 *   null // fallback value
 * )
 * ```
 */
export async function safeAsync<T>(
    fn: () => Promise<T>,
    fallback: T
): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        log.warn('Safe async caught error', { error })
        return fallback
    }
}

/**
 * Error response formatter for API routes
 */
export function formatErrorResponse(error: unknown) {
    if (error instanceof AppError) {
        return {
            error: {
                message: error.message,
                code: error.code,
                details: error.details,
            },
            statusCode: error.statusCode,
        }
    }

    if (error instanceof Error) {
        return {
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
            },
            statusCode: 500,
        }
    }

    return {
        error: {
            message: 'Unknown error',
            code: 'UNKNOWN_ERROR',
        },
        statusCode: 500,
    }
}