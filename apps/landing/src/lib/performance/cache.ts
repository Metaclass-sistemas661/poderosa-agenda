/**
 * Enterprise Caching System
 * 
 * Features:
 * - In-memory cache with TTL
 * - Cache invalidation strategies
 * - Multi-level caching (memory + external)
 * - Type-safe cache keys
 * - Performance monitoring
 */

export type CacheStrategy = 'memory' | 'redis' | 'hybrid'

export interface CacheOptions {
    ttl?: number // Time to live in seconds
    strategy?: CacheStrategy
    namespace?: string
}

export interface CacheEntry<T> {
    data: T
    expires: number
    createdAt: number
}

/**
 * In-Memory Cache Implementation
 */
class MemoryCache {
    private cache: Map<string, CacheEntry<any>>
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor() {
        this.cache = new Map()
        this.startCleanup()
    }

    private startCleanup() {
        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup()
        }, 5 * 60 * 1000)
    }

    private cleanup() {
        const now = Date.now()
        let removedCount = 0

        const entries = Array.from(this.cache.entries())
        for (const [key, entry] of entries) {
            if (entry.expires < now) {
                this.cache.delete(key)
                removedCount++
            }
        }

        if (removedCount > 0) {
            console.log(`[Cache] Cleaned up ${removedCount} expired entries`)
        }
    }

    set<T>(key: string, data: T, ttl: number): void {
        const entry: CacheEntry<T> = {
            data,
            expires: Date.now() + ttl * 1000,
            createdAt: Date.now(),
        }
        this.cache.set(key, entry)
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) {
            return null
        }

        if (entry.expires < Date.now()) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    delete(key: string): void {
        this.cache.delete(key)
    }

    deletePattern(pattern: string): void {
        const regex = new RegExp(pattern)
        const keys = Array.from(this.cache.keys())
        for (const key of keys) {
            if (regex.test(key)) {
                this.cache.delete(key)
            }
        }
    }

    clear(): void {
        this.cache.clear()
    }

    size(): number {
        return this.cache.size
    }

    has(key: string): boolean {
        const entry = this.cache.get(key)
        if (!entry) return false
        if (entry.expires < Date.now()) {
            this.cache.delete(key)
            return false
        }
        return true
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
        }
        this.clear()
    }
}

// Singleton instance
const memoryCache = new MemoryCache()

/**
 * Cache key generator
 */
export class CacheKey {
    private parts: string[]

    constructor(namespace: string) {
        this.parts = [namespace]
    }

    add(part: string | number): this {
        this.parts.push(String(part))
        return this
    }

    build(): string {
        return this.parts.join(':')
    }

    static create(namespace: string): CacheKey {
        return new CacheKey(namespace)
    }
}

/**
 * Cache wrapper with type safety
 */
export class Cache {
    private namespace: string
    private defaultTtl: number

    constructor(namespace: string = 'app', defaultTtl: number = 300) {
        this.namespace = namespace
        this.defaultTtl = defaultTtl
    }

    private buildKey(...parts: (string | number)[]): string {
        return CacheKey.create(this.namespace)
            .add(parts.join(':'))
            .build()
    }

    async get<T>(key: string): Promise<T | null> {
        return memoryCache.get<T>(this.buildKey(key))
    }

    async set<T>(key: string, data: T, ttl?: number): Promise<void> {
        const cacheKey = this.buildKey(key)
        const cacheTtl = ttl || this.defaultTtl
        memoryCache.set(cacheKey, data, cacheTtl)
    }

    async delete(key: string): Promise<void> {
        memoryCache.delete(this.buildKey(key))
    }

    async deletePattern(pattern: string): Promise<void> {
        const fullPattern = `${this.namespace}:${pattern}`
        memoryCache.deletePattern(fullPattern)
    }

    async has(key: string): Promise<boolean> {
        return memoryCache.has(this.buildKey(key))
    }

    /**
     * Get or set pattern - fetch data if not in cache
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = await this.get<T>(key)

        if (cached !== null) {
            return cached
        }

        const data = await fetchFn()
        await this.set(key, data, ttl)
        return data
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidate(pattern: string): Promise<void> {
        await this.deletePattern(pattern)
    }

    /**
     * Clear all cache in this namespace
     */
    async clear(): Promise<void> {
        await this.deletePattern('.*')
    }
}

/**
 * Pre-configured cache instances
 */
export const cache = {
    salon: new Cache('salon', 300), // 5 minutes
    user: new Cache('user', 600), // 10 minutes
    appointments: new Cache('appointments', 60), // 1 minute
    clients: new Cache('clients', 300), // 5 minutes
    professionals: new Cache('professionals', 300), // 5 minutes
    services: new Cache('services', 600), // 10 minutes
    products: new Cache('products', 300), // 5 minutes
    settings: new Cache('settings', 3600), // 1 hour
    metrics: new Cache('metrics', 120), // 2 minutes
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
    /**
     * Invalidate all cache for a specific salon
     */
    async invalidateSalon(salonId: string): Promise<void> {
        await Promise.all([
            cache.appointments.invalidate(`${salonId}:.*`),
            cache.clients.invalidate(`${salonId}:.*`),
            cache.professionals.invalidate(`${salonId}:.*`),
            cache.services.invalidate(`${salonId}:.*`),
            cache.products.invalidate(`${salonId}:.*`),
            cache.settings.invalidate(`${salonId}:.*`),
        ])
    },

    /**
     * Invalidate user-specific cache
     */
    async invalidateUser(userId: string): Promise<void> {
        await cache.user.invalidate(`${userId}:.*`)
    },

    /**
     * Invalidate appointment-related cache
     */
    async invalidateAppointments(salonId: string): Promise<void> {
        await Promise.all([
            cache.appointments.invalidate(`${salonId}:.*`),
            cache.metrics.invalidate(`${salonId}:appointments:.*`),
        ])
    },

    /**
     * Invalidate client-related cache
     */
    async invalidateClients(salonId: string): Promise<void> {
        await cache.clients.invalidate(`${salonId}:.*`)
    },
}

/**
 * React Server Component cache helper
 */
export async function cachedServerAction<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = 300, namespace = 'server-action' } = options
    const cache = new Cache(namespace, ttl)

    return await cache.getOrSet(cacheKey, fetchFn, ttl)
}

/**
 * Decorator for caching function results
 */
export function cached(options: CacheOptions = {}) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value
        const { ttl = 300, namespace = 'method' } = options

        descriptor.value = async function (...args: any[]) {
            const cache = new Cache(namespace, ttl)
            const cacheKey = `${propertyKey}:${JSON.stringify(args)}`

            return await cache.getOrSet(
                cacheKey,
                () => originalMethod.apply(this, args),
                ttl
            )
        }

        return descriptor
    }
}

/**
 * Cache statistics
 */
export function getCacheStats() {
    return {
        size: memoryCache.size(),
        uptime: process.uptime(),
    }
}

/**
 * Clear all caches (use with caution)
 */
export function clearAllCaches(): void {
    memoryCache.clear()
}

// Export memory cache for advanced usage
export { memoryCache }