# Enterprise Architecture Guide

**Project:** Poderosa Agenda  
**Phase:** 18 — Architecture Improvements  
**Status:** Implementation Guide

---

## Overview

Este guia documenta a arquitetura enterprise do Poderosa Agenda, incluindo patterns, layers, e best practices para escalabilidade e manutenibilidade.

---

## 1. Architectural Layers

### Current Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│   (Next.js Pages, Components, UI)       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Application Layer               │
│      (Server Actions, API Routes)       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│    (Business Logic, Validation)         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│      (Supabase Client, Database)        │
└─────────────────────────────────────────┘
```

---

## 2. Repository Pattern

### Purpose
Abstrair acesso a dados, permitindo trocar implementação sem afetar business logic.

### Structure

```typescript
// src/lib/repositories/base.repository.ts
export interface IRepository<T> {
    findById(id: string): Promise<T | null>
    findAll(filters?: any): Promise<T[]>
    create(data: Partial<T>): Promise<T>
    update(id: string, data: Partial<T>): Promise<T>
    delete(id: string): Promise<void>
}

// src/lib/repositories/client.repository.ts
export class ClientRepository implements IRepository<Client> {
    constructor(private supabase: SupabaseClient) {}
    
    async findById(id: string, salonId: string): Promise<Client | null> {
        const { data, error } = await this.supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('salon_id', salonId)
            .single()
        
        if (error) throw new DatabaseError(error.message)
        return data
    }
    
    // ... other methods
}
```

### Benefits
✅ Single Responsibility Principle  
✅ Easy to test (mock repository)  
✅ Easy to swap data source  
✅ Consistent data access patterns

---

## 3. Service Layer

### Purpose
Encapsular business logic, coordenar repositories, aplicar regras de negócio.

### Structure

```typescript
// src/lib/services/client.service.ts
export class ClientService {
    constructor(
        private clientRepo: ClientRepository,
        private appointmentRepo: AppointmentRepository
    ) {}
    
    async createClient(
        data: CreateClientDTO,
        salonId: string
    ): Promise<Client> {
        // 1. Validação
        await this.validateClientData(data)
        
        // 2. Business rules
        await this.checkDuplicateEmail(data.email, salonId)
        
        // 3. Create client
        const client = await this.clientRepo.create({
            ...data,
            salon_id: salonId,
        })
        
        // 4. Side effects
        await this.sendWelcomeEmail(client)
        
        // 5. Audit log
        await this.auditService.log('client_created', client.id)
        
        return client
    }
    
    async deleteClient(id: string, salonId: string): Promise<void> {
        // Business rule: Can't delete if has future appointments
        const hasAppointments = await this.appointmentRepo
            .hasFutureAppointments(id)
        
        if (hasAppointments) {
            throw new ConflictError('Cannot delete client with future appointments')
        }
        
        await this.clientRepo.delete(id, salonId)
    }
}
```

### Benefits
✅ Business logic centralized  
✅ Reusable across different interfaces (API, UI, CLI)  
✅ Easy to test business rules  
✅ Transaction management  
✅ Cross-cutting concerns (logging, caching)

---

## 4. Domain-Driven Design (DDD)

### Entities

```typescript
// src/lib/domain/entities/Client.ts
export class Client {
    constructor(
        public readonly id: string,
        public name: string,
        public email: string,
        public phone: string,
        public readonly salonId: string,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}
    
    // Business logic methods
    updateContactInfo(email: string, phone: string): void {
        this.validateEmail(email)
        this.validatePhone(phone)
        this.email = email
        this.phone = phone
        this.updatedAt = new Date()
    }
    
    private validateEmail(email: string): void {
        if (!REGEX.EMAIL.test(email)) {
            throw new ValidationError('Invalid email format')
        }
    }
    
    private validatePhone(phone: string): void {
        if (!REGEX.PHONE.test(phone)) {
            throw new ValidationError('Invalid phone format')
        }
    }
    
    // Query methods
    get isNew(): boolean {
        const daysSinceCreation = 
            (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceCreation < 7
    }
}
```

### Value Objects

```typescript
// src/lib/domain/value-objects/Money.ts
export class Money {
    constructor(
        public readonly amount: number,
        public readonly currency: string = 'BRL'
    ) {
        if (amount < 0) {
            throw new ValidationError('Amount cannot be negative')
        }
    }
    
    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new ValidationError('Cannot add different currencies')
        }
        return new Money(this.amount + other.amount, this.currency)
    }
    
    multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency)
    }
    
    format(): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: this.currency,
        }).format(this.amount)
    }
}

// src/lib/domain/value-objects/Email.ts
export class Email {
    constructor(public readonly value: string) {
        if (!REGEX.EMAIL.test(value)) {
            throw new ValidationError('Invalid email format')
        }
    }
    
    get domain(): string {
        return this.value.split('@')[1]
    }
    
    equals(other: Email): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase()
    }
}
```

### Aggregates

```typescript
// src/lib/domain/aggregates/Appointment.ts
export class Appointment {
    constructor(
        public readonly id: string,
        public readonly clientId: string,
        public readonly professionalId: string,
        public readonly serviceId: string,
        public appointmentDate: Date,
        public status: AppointmentStatus,
        public notes: string,
        private products: AppointmentProduct[] = []
    ) {}
    
    // Aggregate root methods
    addProduct(productId: string, quantity: number, price: Money): void {
        const product = new AppointmentProduct(productId, quantity, price)
        this.products.push(product)
    }
    
    removeProduct(productId: string): void {
        this.products = this.products.filter(p => p.productId !== productId)
    }
    
    confirm(): void {
        if (this.status !== APPOINTMENT_STATUS.SCHEDULED) {
            throw new ValidationError('Can only confirm scheduled appointments')
        }
        this.status = APPOINTMENT_STATUS.CONFIRMED
    }
    
    complete(totalPaid: Money): void {
        if (this.status !== APPOINTMENT_STATUS.IN_PROGRESS) {
            throw new ValidationError('Can only complete in-progress appointments')
        }
        
        const total = this.calculateTotal()
        if (totalPaid.amount < total.amount) {
            throw new ValidationError('Payment insufficient')
        }
        
        this.status = APPOINTMENT_STATUS.COMPLETED
    }
    
    calculateTotal(): Money {
        return this.products.reduce(
            (sum, product) => sum.add(product.subtotal),
            new Money(0)
        )
    }
}
```

---

## 5. Dependency Injection

### Manual DI

```typescript
// src/lib/container/index.ts
import { createClient } from '@/lib/supabase/server'

export class Container {
    private static instance: Container
    
    private constructor() {}
    
    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container()
        }
        return Container.instance
    }
    
    // Repositories
    getClientRepository() {
        const supabase = createClient()
        return new ClientRepository(supabase)
    }
    
    getAppointmentRepository() {
        const supabase = createClient()
        return new AppointmentRepository(supabase)
    }
    
    // Services
    getClientService() {
        return new ClientService(
            this.getClientRepository(),
            this.getAppointmentRepository()
        )
    }
    
    getAppointmentService() {
        return new AppointmentService(
            this.getAppointmentRepository(),
            this.getClientRepository(),
            this.getProfessionalRepository(),
            this.getServiceRepository()
        )
    }
}

// Usage in Server Action
export async function createClient(data: CreateClientDTO) {
    const container = Container.getInstance()
    const clientService = container.getClientService()
    const salonId = await getSalonId()
    
    return await clientService.createClient(data, salonId)
}
```

---

## 6. Use Cases (Clean Architecture)

```typescript
// src/lib/use-cases/CreateAppointmentUseCase.ts
export class CreateAppointmentUseCase {
    constructor(
        private appointmentService: AppointmentService,
        private notificationService: NotificationService
    ) {}
    
    async execute(input: CreateAppointmentInput): Promise<CreateAppointmentOutput> {
        // 1. Validate input
        const validatedData = await this.validate(input)
        
        // 2. Execute business logic
        const appointment = await this.appointmentService.create(validatedData)
        
        // 3. Send notifications
        await this.notificationService.sendAppointmentConfirmation(appointment)
        
        // 4. Return output
        return {
            appointment,
            message: 'Appointment created successfully',
        }
    }
    
    private async validate(input: CreateAppointmentInput) {
        // Validation logic
        return input
    }
}
```

---

## 7. Event-Driven Architecture

```typescript
// src/lib/events/EventBus.ts
export class EventBus {
    private static instance: EventBus
    private listeners: Map<string, Array<(data: any) => void>> = new Map()
    
    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus()
        }
        return EventBus.instance
    }
    
    publish(event: string, data: any): void {
        const listeners = this.listeners.get(event) || []
        listeners.forEach(listener => listener(data))
    }
    
    subscribe(event: string, listener: (data: any) => void): void {
        const listeners = this.listeners.get(event) || []
        listeners.push(listener)
        this.listeners.set(event, listeners)
    }
}

// Domain Events
export class AppointmentCreatedEvent {
    constructor(
        public readonly appointmentId: string,
        public readonly clientId: string,
        public readonly professionalId: string,
        public readonly appointmentDate: Date
    ) {}
}

// Event Handlers
export class SendAppointmentConfirmationHandler {
    async handle(event: AppointmentCreatedEvent): Promise<void> {
        // Send email/SMS confirmation
    }
}

export class UpdateProfessionalCalendarHandler {
    async handle(event: AppointmentCreatedEvent): Promise<void> {
        // Update calendar
    }
}

// Usage
const eventBus = EventBus.getInstance()

eventBus.subscribe('appointment.created', (event: AppointmentCreatedEvent) => {
    new SendAppointmentConfirmationHandler().handle(event)
})

eventBus.subscribe('appointment.created', (event: AppointmentCreatedEvent) => {
    new UpdateProfessionalCalendarHandler().handle(event)
})

// Publish event
eventBus.publish('appointment.created', new AppointmentCreatedEvent(...))
```

---

## 8. CQRS (Command Query Responsibility Segregation)

### Commands (Write)

```typescript
// src/lib/commands/CreateClientCommand.ts
export class CreateClientCommand {
    constructor(
        public readonly name: string,
        public readonly email: string,
        public readonly phone: string,
        public readonly salonId: string
    ) {}
}

export class CreateClientCommandHandler {
    constructor(private clientService: ClientService) {}
    
    async handle(command: CreateClientCommand): Promise<Client> {
        return await this.clientService.create({
            name: command.name,
            email: command.email,
            phone: command.phone,
            salon_id: command.salonId,
        })
    }
}
```

### Queries (Read)

```typescript
// src/lib/queries/GetClientByIdQuery.ts
export class GetClientByIdQuery {
    constructor(
        public readonly clientId: string,
        public readonly salonId: string
    ) {}
}

export class GetClientByIdQueryHandler {
    constructor(private clientRepository: ClientRepository) {}
    
    async handle(query: GetClientByIdQuery): Promise<Client | null> {
        return await this.clientRepository.findById(
            query.clientId,
            query.salonId
        )
    }
}
```

---

## 9. Architecture Patterns Summary

### Repository Pattern
✅ **Use when:** Need to abstract data access  
✅ **Benefits:** Testability, flexibility, separation of concerns

### Service Layer
✅ **Use when:** Complex business logic  
✅ **Benefits:** Reusability, transaction management, clear boundaries

### Domain-Driven Design
✅ **Use when:** Complex domain logic  
✅ **Benefits:** Rich domain models, ubiquitous language, bounded contexts

### Use Cases / Interactors
✅ **Use when:** Clean Architecture approach  
✅ **Benefits:** Independent of frameworks, testable, clear intent

### Event-Driven Architecture
✅ **Use when:** Decoupled components, async processing  
✅ **Benefits:** Scalability, loose coupling, extensibility

### CQRS
✅ **Use when:** Different read/write patterns  
✅ **Benefits:** Optimized queries, scalability, clear separation

---

## 10. Implementation Roadmap

### Phase 18.1: Repository Layer
- [ ] Create base repository interface
- [ ] Implement repositories for core entities
- [ ] Add caching to repositories
- [ ] Write repository tests

### Phase 18.2: Service Layer
- [ ] Create service classes for business logic
- [ ] Move logic from Server Actions to services
- [ ] Add transaction support
- [ ] Write service tests

### Phase 18.3: Domain Layer
- [ ] Create domain entities
- [ ] Create value objects
- [ ] Define aggregates
- [ ] Implement domain events

### Phase 18.4: Dependency Injection
- [ ] Create container
- [ ] Register dependencies
- [ ] Update Server Actions to use DI

---

## 11. Best Practices

✅ **DO:**
- Keep layers independent
- Use interfaces for dependencies
- Implement proper error handling
- Write tests for each layer
- Document domain concepts

❌ **DON'T:**
- Mix concerns between layers
- Put business logic in UI components
- Skip validation in domain layer
- Create god services (too many responsibilities)
- Couple to specific frameworks

---

**Last Updated:** 2026-08-17  
**Document Version:** 1.0  
**Status:** Phase 18 Architecture Guide