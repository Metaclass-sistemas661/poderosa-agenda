/**
 * Enterprise Pagination System
 * 
 * Features:
 * - Cursor-based pagination (more efficient than offset)
 * - Offset-based pagination (simpler, for smaller datasets)
 * - Type-safe pagination helpers
 * - Metadata generation
 * - SEO-friendly pagination
 */

export interface PaginationParams {
    page?: number
    limit?: number
    cursor?: string
}

export interface PaginationMetadata {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
}

export interface PaginatedResult<T> {
    data: T[]
    metadata: PaginationMetadata
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMetadata(
    total: number,
    page: number,
    limit: number
): PaginationMetadata {
    const totalPages = Math.ceil(total / limit)

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    }
}

/**
 * Get offset for SQL queries
 */
export function getOffset(page: number, limit: number): number {
    return (page - 1) * limit
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
    page?: number,
    limit?: number
): { page: number; limit: number } {
    const DEFAULT_PAGE = 1
    const DEFAULT_LIMIT = 20
    const MAX_LIMIT = 100

    const validPage = Math.max(1, page || DEFAULT_PAGE)
    const validLimit = Math.min(
        Math.max(1, limit || DEFAULT_LIMIT),
        MAX_LIMIT
    )

    return { page: validPage, limit: validLimit }
}

/**
 * Create pagination result
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    return {
        data,
        metadata: calculatePaginationMetadata(total, page, limit),
    }
}

/**
 * Cursor-based pagination helper
 * More efficient for large datasets
 */
export interface CursorPaginationParams {
    cursor?: string
    limit?: number
    direction?: 'forward' | 'backward'
}

export interface CursorPaginatedResult<T> {
    data: T[]
    metadata: {
        limit: number
        hasNext: boolean
        hasPrev: boolean
        nextCursor?: string
        prevCursor?: string
    }
}

/**
 * Encode cursor (base64)
 */
export function encodeCursor(value: string | number | Date): string {
    const stringValue = value instanceof Date ? value.toISOString() : String(value)
    return Buffer.from(stringValue).toString('base64')
}

/**
 * Decode cursor
 */
export function decodeCursor(cursor: string): string {
    try {
        return Buffer.from(cursor, 'base64').toString('utf-8')
    } catch {
        throw new Error('Invalid cursor')
    }
}

/**
 * Create cursor-paginated result
 */
export function createCursorPaginatedResult<T extends { id: string }>(
    data: T[],
    limit: number,
    hasMore: boolean = false
): CursorPaginatedResult<T> {
    const hasNext = hasMore || data.length > limit
    const trimmedData = hasNext ? data.slice(0, limit) : data

    return {
        data: trimmedData,
        metadata: {
            limit,
            hasNext,
            hasPrev: false, // Would need previous cursor to determine
            nextCursor: hasNext && trimmedData.length > 0
                ? encodeCursor(trimmedData[trimmedData.length - 1].id)
                : undefined,
        },
    }
}

/**
 * Supabase pagination helper
 */
export async function paginateSupabaseQuery<T>(
    queryBuilder: any,
    page: number,
    limit: number
): Promise<PaginatedResult<T>> {
    const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit)
    const offset = getOffset(validPage, validLimit)

    // Get total count
    const { count } = await queryBuilder.select('*', { count: 'exact', head: true })

    // Get paginated data
    const { data, error } = await queryBuilder
        .select('*')
        .range(offset, offset + validLimit - 1)

    if (error) {
        throw error
    }

    return createPaginatedResult(data || [], count || 0, validPage, validLimit)
}

/**
 * React Query pagination hook helper
 */
export function usePaginationParams(searchParams: URLSearchParams) {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    return validatePaginationParams(page, limit)
}

/**
 * Generate pagination URLs for SEO
 */
export function generatePaginationUrls(
    baseUrl: string,
    currentPage: number,
    totalPages: number
): {
    first: string
    prev?: string
    next?: string
    last: string
} {
    const createUrl = (page: number) => `${baseUrl}?page=${page}`

    return {
        first: createUrl(1),
        prev: currentPage > 1 ? createUrl(currentPage - 1) : undefined,
        next: currentPage < totalPages ? createUrl(currentPage + 1) : undefined,
        last: createUrl(totalPages),
    }
}

/**
 * Server Action pagination wrapper
 */
export async function paginatedAction<T>(
    fetchFunction: (offset: number, limit: number) => Promise<T[]>,
    countFunction: () => Promise<number>,
    page: number,
    limit: number
): Promise<PaginatedResult<T>> {
    const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit)
    const offset = getOffset(validPage, validLimit)

    const [data, total] = await Promise.all([
        fetchFunction(offset, validLimit),
        countFunction(),
    ])

    return createPaginatedResult(data, total, validPage, validLimit)
}

/**
 * Infinite scroll helper
 */
export interface InfiniteScrollParams {
    page: number
    limit: number
    hasMore: boolean
}

export function createInfiniteScrollState(
    initialPage: number = 1,
    initialLimit: number = 20
): InfiniteScrollParams {
    return {
        page: initialPage,
        limit: initialLimit,
        hasMore: true,
    }
}

export function updateInfiniteScrollState(
    state: InfiniteScrollParams,
    hasMore: boolean
): InfiniteScrollParams {
    return {
        page: state.page + 1,
        limit: state.limit,
        hasMore,
    }
}