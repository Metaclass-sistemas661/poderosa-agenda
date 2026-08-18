/**
 * Test Data Factories
 * 
 * Provides factory functions for generating test data.
 * Uses faker for realistic, random data generation.
 */

import { faker } from '@faker-js/faker'

/**
 * Create a test client
 */
export function createTestClient(overrides: Partial<any> = {}) {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.helpers.fromRegExp(/11[9]\d{8}/), // Brazilian mobile
        birth_date: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
        gender: faker.helpers.arrayElement(['male', 'female', 'other'] as const),
        notes: faker.lorem.sentence(),
        total_visits: faker.number.int({ min: 0, max: 50 }),
        last_visit: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test appointment
 */
export function createTestAppointment(overrides: Partial<any> = {}) {
    const date = faker.date.future()
    return {
        id: faker.string.uuid(),
        client_id: faker.string.uuid(),
        professional_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        client_name: faker.person.fullName(),
        client_phone: faker.helpers.fromRegExp(/11[9]\d{8}/),
        service_name: faker.helpers.arrayElement(['Corte de Cabelo', 'Manicure', 'Pedicure', 'Escova']),
        service_price: faker.number.float({ min: 30, max: 200, fractionDigits: 2 }),
        scheduled_date: date.toISOString().split('T')[0],
        scheduled_time: `${String(faker.number.int({ min: 8, max: 18 })).padStart(2, '0')}:00`,
        duration: faker.helpers.arrayElement([30, 60, 90, 120]),
        status: faker.helpers.arrayElement(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const),
        notes: faker.lorem.sentence(),
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test professional
 */
export function createTestProfessional(overrides: Partial<any> = {}) {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.helpers.fromRegExp(/11[9]\d{8}/),
        specialty: faker.helpers.arrayElement(['Cabeleireiro', 'Manicure', 'Esteticista', 'Barbeiro']),
        photo_url: faker.image.avatar(),
        commission_rate: faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
        is_active: faker.datatype.boolean(),
        status: faker.helpers.arrayElement(['active', 'inactive', 'vacation'] as const),
        working_hours: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '09:00', end: '14:00' }
        },
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test service
 */
export function createTestService(overrides: Partial<any> = {}) {
    return {
        id: faker.string.uuid(),
        name: faker.helpers.arrayElement(['Corte Feminino', 'Corte Masculino', 'Manicure', 'Pedicure', 'Escova']),
        description: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(['Cabelo', 'Unhas', 'Estética']),
        price: faker.number.float({ min: 30, max: 200, fractionDigits: 2 }),
        duration: faker.helpers.arrayElement([30, 60, 90, 120]),
        is_active: faker.datatype.boolean(),
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test salon
 */
export function createTestSalon(overrides: Partial<any> = {}) {
    const name = faker.company.name()
    return {
        id: faker.string.uuid(),
        name,
        slug: faker.helpers.slugify(name).toLowerCase(),
        plan: faker.helpers.arrayElement(['free', 'basic', 'professional', 'enterprise'] as const),
        status: faker.helpers.arrayElement(['active', 'inactive', 'suspended'] as const),
        owner_email: faker.internet.email().toLowerCase(),
        phone: faker.helpers.fromRegExp(/11[9]\d{8}/),
        address: faker.location.streetAddress(true),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test transaction
 */
export function createTestTransaction(overrides: Partial<any> = {}) {
    const amount = faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
    return {
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['income', 'expense'] as const),
        category: faker.helpers.arrayElement(['service', 'product', 'other']),
        description: faker.lorem.sentence(),
        amount,
        date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
        payment_method: faker.helpers.arrayElement(['cash', 'credit_card', 'debit_card', 'pix']),
        professional_id: faker.string.uuid(),
        appointment_id: faker.string.uuid(),
        commission_amount: faker.number.float({ min: 0, max: amount * 0.5, fractionDigits: 2 }),
        is_confirmed: faker.datatype.boolean(),
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create a test product
 */
export function createTestProduct(overrides: Partial<any> = {}) {
    const salePrice = faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
    return {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        barcode: faker.string.numeric(13),
        category: faker.helpers.arrayElement(['Cabelo', 'Maquiagem', 'Unhas', 'Skincare']),
        sale_price: salePrice,
        cost_price: faker.number.float({ min: salePrice * 0.3, max: salePrice * 0.7, fractionDigits: 2 }),
        stock_quantity: faker.number.int({ min: 0, max: 100 }),
        min_stock: faker.number.int({ min: 5, max: 20 }),
        is_active: faker.datatype.boolean(),
        salon_id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...overrides
    }
}

/**
 * Create multiple test items
 */
export function createTestItems<T>(
    factory: (overrides?: Partial<T>) => T,
    count: number,
    overrides: Partial<T> = {}
): T[] {
    return Array.from({ length: count }, () => factory(overrides))
}