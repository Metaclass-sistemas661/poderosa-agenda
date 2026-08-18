# Enterprise Code Refactoring Guide

**Project:** Poderosa Agenda  
**Phase:** 17 — Code Refactoring  
**Status:** Implementation Guide

---

## Overview

Este guia documenta oportunidades de refactoring identificadas no codebase e fornece soluções enterprise para melhorar qualidade, manutenibilidade e consistência do código.

---

## 1. Issues Identificados

### 1.1 Código Duplicado

#### A. `loadSalonId()` Duplicado

**Problema:** Função `loadSalonId()` aparece em múltiplos arquivos com pequenas variações.

**Localizações:**
- `src/app/salon/clientes/page.tsx`
- `src/app/salon/agendamentos/page.tsx`
- `src/app/salon/profissionais/page.tsx`
- `src/app/salon/servicos/page.tsx`
- `src/app/salon/estoque/page.tsx`
- `src/app/salon/financeiro/page.tsx`
- `src/app/salon/configuracoes/page.tsx`

**Código atual (repetido 7+ vezes):**
```typescript
async function loadSalonId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()
  
  if (!adminUser?.salon_id) redirect('/login')
  
  return adminUser.salon_id
}
```

**✅ Solução:** Centralizar em `src/lib/auth/salon.ts`

---

#### B. Contexto de Tenant Duplicado

**Problema:** Lógica de obter `salon_id` duplicada entre:
- Client-side: `useTenant()` hook
- Server-side: `getTenantContext()` function
- Server Actions: `loadSalonId()` inline

**✅ Solução:** Unificar em utilities compartilhadas

---

### 1.2 Context Provider Não Utilizado

#### `SalonProvider` (apps/landing/src/contexts/SalonContext.tsx)

**Problema:** Context criado mas não usado na aplicação.

**Análise:**
- Provider não está no layout principal
- Substituído por `useTenant()` hook
- Código morto

**✅ Solução:** Remover arquivo e dependências

---

### 1.3 Inconsistências de Pattern

#### A. Data Fetching Patterns

**Problema:** Mistura de patterns:
```typescript
// Pattern 1: Server Component (bom)
async function Page() {
  const data = await getData()
  return <Component data={data} />
}

// Pattern 2: useEffect (evitar)
'use client'
function Component() {
  useEffect(() => {
    fetchData()
  }, [])
}

// Pattern 3: Server Action inline (inconsistente)
async function Page() {
  const data = await supabase.from('table').select()
  return <Component data={data} />
}
```

**✅ Solução:** Padronizar em Server Actions (`src/lib/actions/`)

---

#### B. Error Handling

**Problema:** Tratamento de erros inconsistente:
```typescript
// Algumas places
try {
  await action()
} catch (error) {
  console.error(error) // Apenas log
}

// Outras places
try {
  await action()
} catch (error) {
  throw error // Re-throw
}

// Ainda outras
const { error } = await action()
if (error) return null // Silent fail
```

**✅ Solução:** Implementar error handling unificado

---

### 1.4 Type Safety Issues

#### A. `any` Types

**Problema:** Uso excessivo de `any`:
```typescript
function processData(data: any) { // Bad
  return data.map((item: any) => item.value)
}
```

**✅ Solução:** Substituir por types adequados

---

#### B. Missing Types

**Problema:** Interfaces incompletas:
```typescript
interface Client {
  id: string
  name: string
  // Faltam: email, phone, created_at, etc.
}
```

**✅ Solução:** Gerar types completos do Supabase schema

---

## 2. Refactoring Plan

### Priority 1: Critical (P1)

#### 1.1 Consolidar `loadSalonId()`

**Action:** Criar utility centralizada

**File:** `src/lib/auth/salon.ts` (novo)

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get salon_id for the current authenticated user
 * Throws error if user is not authenticated or has no salon
 */
export async function getSalonId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()
  
  if (error || !adminUser?.salon_id) {
    redirect('/login')
  }
  
  return adminUser.salon_id
}

/**
 * Get salon_id with user info
 */
export async function getSalonContext() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('salon_id, role, email')
    .eq('user_id', user.id)
    .single()
  
  if (!adminUser?.salon_id) {
    redirect('/login')
  }
  
  return {
    userId: user.id,
    salonId: adminUser.salon_id,
    role: adminUser.role,
    email: adminUser.email,
  }
}
```

**Refactor:** Substituir todas as instâncias de `loadSalonId()` por `getSalonId()`

---

#### 1.2 Remover `SalonProvider`

**Files to delete:**
- `src/contexts/SalonContext.tsx`

**Files to update:**
- Remove imports em qualquer arquivo que referencie

---

#### 1.3 Standardizar Error Handling

**File:** `src/lib/errors/handler.ts` (novo)

```typescript
import { log } from '@/lib/observability/logger'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

/**
 * Handle errors in Server Actions
 */
export function handleActionError(error: unknown): never {
  if (error instanceof AppError) {
    log.error(error.message, error, { code: error.code })
    throw error
  }
  
  if (error instanceof Error) {
    log.error('Unexpected error', error)
    throw new AppError('Internal server error', 'INTERNAL_ERROR', 500)
  }
  
  log.error('Unknown error', undefined, { error })
  throw new AppError('Unknown error', 'UNKNOWN_ERROR', 500)
}

/**
 * Wrap Server Action with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleActionError(error)
    }
  }) as T
}
```

---

### Priority 2: Important (P2)

#### 2.1 Complete Database Types

**File:** `src/lib/database/types.ts` (atualizar)

```typescript
// Generate from Supabase
export type Database = {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ... complete for all tables
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type Salon = Tables<'salons'>
export type Client = Tables<'clients'>
export type Professional = Tables<'professionals'>
export type Appointment = Tables<'appointments'>
// ... etc
```

**Command to generate:**
```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/database/types.ts
```

---

#### 2.2 Standardizar Data Fetching

**Pattern:** Todos os data fetching via Server Actions

**Bad (atual):**
```typescript
// Directly in component
async function Page() {
  const { data } = await supabase.from('clients').select()
  return <List data={data} />
}
```

**Good (refatorado):**
```typescript
// src/lib/actions/clients.ts
export async function getClients(salonId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('salon_id', salonId)
  
  if (error) throw new Error(error.message)
  return data
}

// In component
async function Page() {
  const salonId = await getSalonId()
  const clients = await getClients(salonId)
  return <List data={clients} />
}
```

---

### Priority 3: Nice to Have (P3)

#### 3.1 Component Library

**File:** `src/components/ui/index.ts`

Consolidar componentes reutilizáveis:
```typescript
export { Button } from './Button'
export { Input } from './Input'
export { Select } from './Select'
export { Modal } from './Modal'
export { Card } from './Card'
export { Badge } from './Badge'
// ... etc
```

---

#### 3.2 Constant Centralization

**File:** `src/lib/constants/index.ts`

```typescript
export const APP_NAME = 'Poderosa Agenda'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
} as const

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  RECEPTIONIST: 'receptionist',
} as const

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const
```

---

## 3. Implementation Checklist

### Phase 17.1: Critical Refactoring ✅

- [ ] Create `src/lib/auth/salon.ts` with centralized functions
- [ ] Replace all `loadSalonId()` calls with `getSalonId()`
- [ ] Remove `SalonProvider` and related files
- [ ] Create `src/lib/errors/handler.ts`
- [ ] Update Server Actions to use error handling

### Phase 17.2: Type Safety

- [ ] Generate complete Supabase types
- [ ] Replace all `any` types
- [ ] Add missing interfaces
- [ ] Enable strict TypeScript mode

### Phase 17.3: Standardization

- [ ] Move all data fetching to Server Actions
- [ ] Standardize error handling
- [ ] Consolidate constants
- [ ] Create component library index

### Phase 17.4: Documentation

- [ ] Add JSDoc comments to public functions
- [ ] Document patterns and conventions
- [ ] Update README with refactoring notes

---

## 4. Code Smell Detection

### Red Flags to Look For

❌ **Code Smells:**
- Functions > 50 lines
- Nested callbacks > 3 levels
- Duplicate code blocks
- Magic numbers/strings
- `any` types
- Unused imports
- Console.logs in production

✅ **Good Practices:**
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Type safety
- Error handling
- Consistent patterns
- Clear naming

---

## 5. Testing Strategy

### Before Refactoring

1. Document current behavior
2. Identify critical paths
3. Create smoke tests

### During Refactoring

1. Refactor one pattern at a time
2. Test after each change
3. Use feature flags if needed

### After Refactoring

1. Verify no regressions
2. Update documentation
3. Monitor production logs

---

## 6. Metrics

### Code Quality Metrics

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| Code duplication | ~15% | <5% | TBD |
| Type coverage | ~70% | >95% | TBD |
| Function complexity (avg) | ~12 | <10 | TBD |
| File size (avg) | ~250 lines | <200 lines | TBD |

---

## 7. Next Steps

### Immediate (Phase 17.1)

1. Create centralized `getSalonId()`
2. Remove duplicate code
3. Implement error handling

### Short-term (Phase 17.2-17.3)

4. Complete type definitions
5. Standardize patterns
6. Consolidate constants

### Before Production (Phase 17.4)

7. Add comprehensive documentation
8. Code review
9. Performance verification

---

**Last Updated:** 2026-08-17  
**Document Version:** 1.0  
**Status:** Phase 17 Planning Complete