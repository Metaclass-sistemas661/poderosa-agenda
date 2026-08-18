/**
 * Client Repository
 * 
 * Data access layer for Client entities.
 * Handles all database operations with tenant isolation.
 */

import { BaseRepository, PaginationOptions, PaginatedResult } from './base.repository'
import { DatabaseError, NotFoundError } from '@/lib/errors/handler'
import { Tables } from '@/lib/database/types'

export type Client = Tables<'clients'>

export interface ClientFilters {
    search?: string
    isActive?: boolean
}

export class ClientRepository extends BaseRepository<Client> {
    constructor(private supabase: any) {
        super()
    }

    async findById(id: string, salonId: string): Promise<Client | null> {
        const { data, error } = await this.supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('salon_id', salonId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new DatabaseError(error.message)
        }

        return data
    }

    async findAll(salonId: string, filters?: ClientFilters): Promise<Client[]> {
        let query = this.supabase
            .from('clients')
            .select('*')
            .eq('salon_id', salonId)

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
        }

        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive)
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (error) throw new DatabaseError(error.message)
        return data || []
    }

    async findPaginated(
        salonId: string,
        options: PaginationOptions,
        filters?: ClientFilters
    ): Promise<PaginatedResult<Client>> {
        const { page, pageSize, sortBy = 'name', sortOrder = 'asc' } = options

        let query = this.supabase
            .from('clients')
            .select('*', { count: 'exact' })
            .eq('salon_id', salonId)

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
        }

        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive)
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(from, to)

        const { data, error, count } = await query

        if (error) throw new DatabaseError(error.message)

        return {
            data: data || [],
            ...this.calculatePagination(count || 0, page, pageSize),
        }
    }

    async create(data: Partial<Client>, salonId: string): Promise<Client> {
        const { data: client, error } = await this.supabase
            .from('clients')
            .insert({
                ...data,
                salon_id: salonId,
            })
            .select()
            .single()

        if (error) throw new DatabaseError(error.message)
        return client
    }

    async update(id: string, data: Partial<Client>, salonId: string): Promise<Client> {
        const { data: client, error } = await this.supabase
            .from('clients')
            .update(data)
            .eq('id', id)
            .eq('salon_id', salonId)
            .select()
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Client', id)
            }
            throw new DatabaseError(error.message)
        }

        return client
    }

    async delete(id: string, salonId: string): Promise<void> {
        const { error } = await this.supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('salon_id', salonId)

        if (error) throw new DatabaseError(error.message)
    }

    async count(salonId: string, filters?: ClientFilters): Promise<number> {
        let query = this.supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('salon_id', salonId)

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
        }

        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive)
        }

        const { count, error } = await query

        if (error) throw new DatabaseError(error.message)
        return count || 0
    }

    async findByEmail(email: string, salonId: string): Promise<Client | null> {
        const { data, error } = await this.supabase
            .from('clients')
            .select('*')
            .eq('email', email)
            .eq('salon_id', salonId)
            .maybeSingle()

        if (error) throw new DatabaseError(error.message)
        return data
    }

    async findByPhone(phone: string, salonId: string): Promise<Client | null> {
        const { data, error } = await this.supabase
            .from('clients')
            .select('*')
            .eq('phone', phone)
            .eq('salon_id', salonId)
            .maybeSingle()

        if (error) throw new DatabaseError(error.message)
        return data
    }
}