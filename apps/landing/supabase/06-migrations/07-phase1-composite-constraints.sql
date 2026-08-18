-- ============================================================================
-- PHASE 1 COMPLETION: Composite Unique Constraints & Foreign Keys
-- ============================================================================
-- Migration: 07-phase1-composite-constraints.sql
-- Date: 2026-08-17
-- Purpose: Add tenant-scoped unique constraints and composite foreign keys
-- ============================================================================

-- ============================================================================
-- COMPOSITE UNIQUE CONSTRAINTS
-- ============================================================================
-- These ensure business uniqueness within a tenant (salon_id scope)

-- 1. professionals: email unique per salon
ALTER TABLE professionals
ADD CONSTRAINT professionals_email_salon_unique 
UNIQUE (salon_id, email);

-- 2. services: name unique per salon
ALTER TABLE services
ADD CONSTRAINT services_name_salon_unique 
UNIQUE (salon_id, name);

-- 3. clients: email unique per salon (if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clients_email_salon_unique'
    ) THEN
        ALTER TABLE clients
        ADD CONSTRAINT clients_email_salon_unique 
        UNIQUE (salon_id, email);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. clients: phone unique per salon (if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clients_phone_salon_unique'
    ) THEN
        ALTER TABLE clients
        ADD CONSTRAINT clients_phone_salon_unique 
        UNIQUE (salon_id, phone);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 5. products: barcode unique per salon (if barcode is not null)
ALTER TABLE products
ADD CONSTRAINT products_barcode_salon_unique 
UNIQUE (salon_id, barcode);

-- ============================================================================
-- COMPOSITE FOREIGN KEY INDEXES
-- ============================================================================
-- These improve query performance for tenant-scoped joins

-- Index for appointments -> professionals (within same salon)
CREATE INDEX IF NOT EXISTS idx_appointments_salon_professional 
ON appointments (salon_id, professional_id);

-- Index for appointments -> services (within same salon)
CREATE INDEX IF NOT EXISTS idx_appointments_salon_service 
ON appointments (salon_id, service_id);

-- Index for appointments -> clients (within same salon)
CREATE INDEX IF NOT EXISTS idx_appointments_salon_client 
ON appointments (salon_id, client_id);

-- Index for transactions -> professionals (for commissions)
CREATE INDEX IF NOT EXISTS idx_transactions_salon_professional 
ON transactions (salon_id, professional_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 1 Composite Constraints Migration Complete';
    RAISE NOTICE '   - professionals_email_salon_unique';
    RAISE NOTICE '   - services_name_salon_unique';
    RAISE NOTICE '   - clients_email_salon_unique';
    RAISE NOTICE '   - clients_phone_salon_unique';
    RAISE NOTICE '   - products_barcode_salon_unique';
    RAISE NOTICE '   - idx_appointments_salon_professional';
    RAISE NOTICE '   - idx_appointments_salon_service';
    RAISE NOTICE '   - idx_appointments_salon_client';
    RAISE NOTICE '   - idx_transactions_salon_professional';
END $$;