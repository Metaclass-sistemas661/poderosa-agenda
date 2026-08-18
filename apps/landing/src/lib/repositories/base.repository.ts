/**
 * Base Repository Interface
 * 
 * Defines the contract for all repositories in the application.
 * Provides type-safe CRUD operations with tenant isolation.
 */

export interface IRepository<T> {
    /**
     * Find entity by ID with tenant isolation
     */
    findById(id: string, salonId: string): Promise<T | null>

    /**
     * Find all entities with optional filters
     */
    findAll(salonId: string, filters?: Record<string, any>): Promise<T[]>

    /**
     * Create new entity
     */
    create(data: Partial<T>, salonId: string): Promise<T>

    /**
     * Update existing entity
     */
    update(id: string, data: Partial<T>, salonId: string): Promise<T>

    /**
     * Delete entity
     */
    delete(id: string, salonId: string): Promise<void>

    /**
     * Check if entity exists
     */
    exists(id: string, salonId: string): Promise<boolean>

    /**
     * Count entities with optional filters
     */
    count(salonId: string, filters?: Record<string, any>): Promise<number>
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

/**
 * Base repository with common functionality
 */
export abstract class BaseRepository<T> implements IRepository<T> {
    abstract findById(id: string, salonId: string): Promise<T | null>
    abstract findAll(salonId: string, filters?: Record<string, any>): Promise<T[]>
    abstract create(data: Partial<T>, salonId: string): Promise<T>
    abstract update(id: string, data: Partial<T>, salonId: string): Promise<T>
    abstract delete(id: string, salonId: string): Promise<void>

    async exists(id: string, salonId: string): Promise<boolean> {
        const entity = await this.findById(id, salonId)
        return entity !== null
    }

    abstract count(salonId: string, filters?: Record<string, any>): Promise<number>

    /**
     * Find with pagination
     */
    abstract findPaginated(
        salonId: string,
        options: PaginationOptions,
        filters?: Record<string, any>
    ): Promise<PaginatedResult<T>>

    /**
     * Helper to calculate pagination metadata
     */
    protected calculatePagination(
        total: number,
        page: number,
        pageSize: number
    ): Omit<PaginatedResult<any>, 'data'> {
        const totalPages = Math.ceil(total / pageSize)
        return {
            total,
            page,
            pageSize,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        }
    }
}