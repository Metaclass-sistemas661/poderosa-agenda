# Enterprise Testing Strategy

**Project:** Poderosa Agenda  
**Phase:** 19 — Testing Infrastructure  
**Status:** Implementation Guide

---

## Overview

Este guia documenta a estratégia de testes enterprise do Poderosa Agenda, cobrindo unit tests, integration tests, E2E tests, e best practices.

---

## 1. Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          ← Few, slow, expensive
                 /--------\
                /          \
               / Integration \     ← Some, medium speed
              /--------------\
             /                \
            /   Unit Tests     \   ← Many, fast, cheap
           /____________________\
```

### Distribution

| Type | Percentage | Speed | Cost | Examples |
|------|-----------|-------|------|----------|
| Unit | 70% | Fast | Low | Functions, utilities, components |
| Integration | 20% | Medium | Medium | Repositories, APIs, services |
| E2E | 10% | Slow | High | User flows, critical paths |

---

## 2. Test Types

### 2.1 Unit Tests

**Purpose:** Test individual units in isolation

**Examples:**
- Pure functions
- Utility functions
- React components (isolated)
- Business logic
- Value objects

**Tools:**
- Jest/Vitest
- React Testing Library
- Mock Service Worker (MSW)

**Example:**
```typescript
// src/lib/utils/__tests__/formatters.test.ts
import { formatCurrency, formatPhone } from '../formatters'

describe('formatCurrency', () => {
    it('formats BRL currency correctly', () => {
        expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
    })
    
    it('handles zero', () => {
        expect(formatCurrency(0)).toBe('R$ 0,00')
    })
    
    it('handles negative values', () => {
        expect(formatCurrency(-100)).toBe('-R$ 100,00')
    })
})

describe('formatPhone', () => {
    it('formats Brazilian phone', () => {
        expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    })
    
    it('handles invalid input', () => {
        expect(formatPhone('invalid')).toBe('invalid')
    })
})
```

---

### 2.2 Integration Tests

**Purpose:** Test multiple units working together

**Examples:**
- Repository + Database
- API Routes
- Server Actions
- Service Layer + Repositories

**Tools:**
- Jest/Vitest
- Supabase Test Client
- Supertest (API testing)

**Example:**
```typescript
// src/lib/repositories/__tests__/client.repository.test.ts
import { ClientRepository } from '../client.repository'
import { createTestClient } from '@/test/utils/supabase'

describe('ClientRepository', () => {
    let repository: ClientRepository
    let testSalonId: string
    
    beforeAll(async () => {
        const supabase = createTestClient()
        repository = new ClientRepository(supabase)
        testSalonId = await createTestSalon()
    })
    
    afterAll(async () => {
        await cleanupTestData()
    })
    
    describe('create', () => {
        it('creates client with required fields', async () => {
            const client = await repository.create({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '11987654321'
            }, testSalonId)
            
            expect(client).toMatchObject({
                name: 'John Doe',
                email: 'john@example.com',
                salon_id: testSalonId
            })
            expect(client.id).toBeDefined()
        })
        
        it('throws error on duplicate email', async () => {
            await repository.create({
                name: 'John Doe',
                email: 'duplicate@example.com'
            }, testSalonId)
            
            await expect(
                repository.create({
                    name: 'Jane Doe',
                    email: 'duplicate@example.com'
                }, testSalonId)
            ).rejects.toThrow()
        })
    })
    
    describe('findPaginated', () => {
        it('returns paginated results', async () => {
            const result = await repository.findPaginated(
                testSalonId,
                { page: 1, pageSize: 10 }
            )
            
            expect(result).toMatchObject({
                data: expect.any(Array),
                total: expect.any(Number),
                page: 1,
                pageSize: 10,
                hasNext: expect.any(Boolean),
                hasPrev: false
            })
        })
    })
})
```

---

### 2.3 E2E Tests

**Purpose:** Test complete user flows

**Examples:**
- User registration flow
- Appointment booking flow
- Payment flow
- Critical business processes

**Tools:**
- Playwright
- Cypress

**Example:**
```typescript
// e2e/appointment-booking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Appointment Booking', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        await page.fill('[name="email"]', 'test@example.com')
        await page.fill('[name="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('/salon/dashboard')
    })
    
    test('complete appointment booking flow', async ({ page }) => {
        // Navigate to appointments
        await page.click('text=Agendamentos')
        await expect(page).toHaveURL('/salon/agendamentos')
        
        // Click new appointment
        await page.click('button:has-text("Novo Agendamento")')
        
        // Fill form
        await page.fill('[name="client_name"]', 'John Doe')
        await page.fill('[name="client_phone"]', '11987654321')
        await page.selectOption('[name="service"]', 'Corte de Cabelo')
        await page.selectOption('[name="professional"]', 'João Silva')
        await page.fill('[name="date"]', '2026-12-25')
        await page.fill('[name="time"]', '14:00')
        
        // Submit
        await page.click('button[type="submit"]')
        
        // Verify success
        await expect(page.locator('text=Agendamento criado com sucesso')).toBeVisible()
        await expect(page.locator('text=John Doe')).toBeVisible()
    })
    
    test('validates required fields', async ({ page }) => {
        await page.click('text=Agendamentos')
        await page.click('button:has-text("Novo Agendamento")')
        
        // Try to submit empty form
        await page.click('button[type="submit"]')
        
        // Check validation errors
        await expect(page.locator('text=Nome é obrigatório')).toBeVisible()
        await expect(page.locator('text=Telefone é obrigatório')).toBeVisible()
    })
})
```

---

## 3. Test Organization

### Directory Structure

```
apps/landing/
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── __tests__/
│   │   │       └── formatters.test.ts
│   │   ├── repositories/
│   │   │   ├── client.repository.ts
│   │   │   └── __tests__/
│   │   │       └── client.repository.test.ts
│   │   └── services/
│   │       ├── client.service.ts
│   │       └── __tests__/
│   │           └── client.service.test.ts
│   └── components/
│       ├── Button/
│       │   ├── Button.tsx
│       │   └── Button.test.tsx
│       └── Modal/
│           ├── Modal.tsx
│           └── Modal.test.tsx
├── test/
│   ├── setup.ts
│   ├── utils/
│   │   ├── supabase.ts
│   │   ├── factories.ts
│   │   └── fixtures.ts
│   └── mocks/
│       ├── handlers.ts
│       └── server.ts
└── e2e/
    ├── appointment-booking.spec.ts
    ├── client-management.spec.ts
    └── fixtures/
        └── test-data.json
```

---

## 4. Test Utilities

### 4.1 Test Database Setup

```typescript
// test/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL!
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY!

export function createTestClient() {
    return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY)
}

export async function cleanupTestData() {
    const supabase = createTestClient()
    
    // Clean up test data
    await supabase.from('appointments').delete().like('client_name', 'TEST_%')
    await supabase.from('clients').delete().like('email', '%@test.example.com')
    await supabase.from('salons').delete().like('slug', 'test-%')
}
```

---

### 4.2 Factory Functions

```typescript
// test/utils/factories.ts
import { faker } from '@faker-js/faker'

export function createClient(overrides = {}) {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('11#########'),
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        ...overrides
    }
}

export function createAppointment(overrides = {}) {
    return {
        id: faker.string.uuid(),
        client_name: faker.person.fullName(),
        client_phone: faker.phone.number('11#########'),
        service_name: 'Corte de Cabelo',
        service_price: 50.00,
        scheduled_date: faker.date.future().toISOString().split('T')[0],
        scheduled_time: '14:00',
        status: 'scheduled' as const,
        salon_id: faker.string.uuid(),
        professional_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        ...overrides
    }
}

export function createSalon(overrides = {}) {
    return {
        id: faker.string.uuid(),
        name: faker.company.name(),
        slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
        plan: 'basic' as const,
        status: 'active' as const,
        owner_email: faker.internet.email(),
        created_at: faker.date.past().toISOString(),
        ...overrides
    }
}
```

---

### 4.3 Mock Service Worker (MSW)

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
    // Mock Supabase REST API
    http.get('https://*/rest/v1/clients', () => {
        return HttpResponse.json([
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'Jane Doe', email: 'jane@example.com' }
        ])
    }),
    
    http.post('https://*/rest/v1/clients', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({
            id: '3',
            ...body,
            created_at: new Date().toISOString()
        }, { status: 201 })
    }),
    
    // Mock external APIs
    http.post('https://api.stripe.com/v1/payment_intents', () => {
        return HttpResponse.json({
            id: 'pi_test_123',
            status: 'succeeded'
        })
    })
]

// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

---

## 5. Testing Best Practices

### ✅ DO

1. **Write tests first (TDD)** - Define behavior before implementation
2. **Test behavior, not implementation** - Focus on what, not how
3. **Use descriptive test names** - `it('creates client with valid data')`
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Use factories for test data** - Keep tests DRY
6. **Mock external dependencies** - Isolate units
7. **Clean up after tests** - Prevent test pollution
8. **Test error cases** - Not just happy paths
9. **Keep tests fast** - Fast feedback loop
10. **Maintain test coverage** - Aim for >80%

### ❌ DON'T

1. **Test implementation details** - Don't test private methods
2. **Write flaky tests** - Tests should be deterministic
3. **Share state between tests** - Each test should be independent
4. **Ignore test failures** - Fix or remove broken tests
5. **Over-mock** - Mock only external dependencies
6. **Test framework code** - Trust the framework
7. **Write long tests** - Keep tests focused
8. **Skip edge cases** - Test boundary conditions
9. **Forget to test errors** - Error handling is critical
10. **Neglect test maintenance** - Update tests with code

---

## 6. Test Configuration

### 6.1 Jest/Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'src/app/**', // Next.js app directory
            ]
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})
```

### 6.2 Test Setup File

```typescript
// test/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
```

---

## 7. Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| Utils | >90% | TBD |
| Repositories | >85% | TBD |
| Services | >85% | TBD |
| Components | >75% | TBD |
| Overall | >80% | TBD |

---

## 8. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
```

---

## 9. Testing Checklist

### Before Release

- [ ] All tests passing
- [ ] Coverage >80%
- [ ] No skipped tests
- [ ] E2E tests for critical flows
- [ ] Performance tests run
- [ ] Security tests run
- [ ] Accessibility tests run

### Per Feature

- [ ] Unit tests for business logic
- [ ] Integration tests for data layer
- [ ] Component tests for UI
- [ ] E2E test for happy path
- [ ] Error handling tested
- [ ] Edge cases covered

---

**Last Updated:** 2026-08-17  
**Document Version:** 1.0  
**Status:** Phase 19 Testing Strategy Complete