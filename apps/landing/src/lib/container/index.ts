/**
 * Dependency Injection Container
 * 
 * Provides centralized dependency management using Singleton pattern.
 * Makes testing easier through dependency injection.
 */

import { createClient } from '@/lib/supabase/client'
import { ClientRepository } from '@/lib/repositories/client.repository'

/**
 * Service Container - Singleton
 * 
 * Usage:
 * ```typescript
 * const container = Container.getInstance()
 * const clientRepo = container.getClientRepository()
 * ```
 */
export class Container {
    private static instance: Container

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container()
        }
        return Container.instance
    }

    // ========================================================================
    // REPOSITORIES
    // ========================================================================

    /**
     * Get Client Repository
     */
    getClientRepository(): ClientRepository {
        const supabase = createClient()
        return new ClientRepository(supabase)
    }

    // Add more repositories as needed:
    // getAppointmentRepository()
    // getProfessionalRepository()
    // getServiceRepository()
    // getProductRepository()
    // etc.
}

/**
 * Helper function to get container instance
 */
export function getContainer(): Container {
    return Container.getInstance()
}