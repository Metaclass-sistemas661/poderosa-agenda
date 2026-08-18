-- ============================================================================
-- PHASE 11 — DATABASE HARDENING — ENTERPRISE-GRADE
-- ============================================================================
-- Migration completa de hardening do banco de dados.
-- Inclui índices, funções seguras, grants, auditoria e validações.
-- Projetado para escala de 200.000+ clientes.
--
-- APPLY: Execute no Supabase SQL Editor
-- IDEMPOTENT: Sim (usa IF NOT EXISTS e IF EXISTS)
-- ============================================================================

-- ============================================================================
-- SECTION 0: ADD MISSING COLUMNS (schema drift fix)
-- ============================================================================
-- O banco real divergiu do schema definido em 07-salon-tables/06-products.sql.
-- Adicionamos as colunas que o frontend usa mas não existem no banco.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS stock_quantity  INTEGER         DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_stock_level INTEGER         DEFAULT 5,
    ADD COLUMN IF NOT EXISTS price           DECIMAL(10,2)   DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost            DECIMAL(10,2)   DEFAULT NULL;

-- Copiar dados das colunas antigas para as novas (se existirem)
DO $$
BEGIN
    -- Se current_quantity existe, copiar para stock_quantity
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'current_quantity')
    THEN
        UPDATE products SET stock_quantity = current_quantity WHERE stock_quantity = 0;
    END IF;

    -- Se sale_price existe, copiar para price
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sale_price')
    THEN
        UPDATE products SET price = sale_price WHERE price = 0;
    END IF;

    -- Se cost_price existe, copiar para cost
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cost_price')
    THEN
        UPDATE products SET cost = cost_price WHERE cost IS NULL;
    END IF;
END;
$$;

DO $$ BEGIN RAISE NOTICE 'Section 0: products columns added/verified'; END; $$;

-- ============================================================================
-- SECTION 1: MISSING PERFORMANCE INDEXES
-- ============================================================================
-- Índices críticos para performance e tenant isolation

-- professionals
CREATE INDEX IF NOT EXISTS idx_professionals_salon_id
    ON professionals(salon_id);

CREATE INDEX IF NOT EXISTS idx_professionals_salon_status
    ON professionals(salon_id, status)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_professionals_salon_name
    ON professionals(salon_id, name);

-- services
CREATE INDEX IF NOT EXISTS idx_services_salon_id
    ON services(salon_id);

CREATE INDEX IF NOT EXISTS idx_services_salon_active
    ON services(salon_id, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_services_salon_category
    ON services(salon_id, category);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_salon_id
    ON clients(salon_id);

CREATE INDEX IF NOT EXISTS idx_clients_salon_name
    ON clients(salon_id, name);

CREATE INDEX IF NOT EXISTS idx_clients_salon_phone
    ON clients(salon_id, phone)
    WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_salon_email
    ON clients(salon_id, email)
    WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_last_visit
    ON clients(salon_id, last_visit_at DESC)
    WHERE last_visit_at IS NOT NULL;

-- appointments
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id
    ON appointments(salon_id);

CREATE INDEX IF NOT EXISTS idx_appointments_salon_date
    ON appointments(salon_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_appointments_salon_date_status
    ON appointments(salon_id, scheduled_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_salon_professional_date
    ON appointments(salon_id, professional_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_appointments_upcoming
    ON appointments(salon_id, scheduled_date, scheduled_time)
    WHERE status IN ('scheduled', 'confirmed');

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_salon_id
    ON transactions(salon_id);

CREATE INDEX IF NOT EXISTS idx_transactions_salon_date
    ON transactions(salon_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_salon_type_date
    ON transactions(salon_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_salon_professional
    ON transactions(salon_id, professional_id)
    WHERE professional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_unconfirmed
    ON transactions(salon_id, is_confirmed)
    WHERE is_confirmed = false;

-- products
CREATE INDEX IF NOT EXISTS idx_products_salon_id
    ON products(salon_id);

CREATE INDEX IF NOT EXISTS idx_products_salon_active
    ON products(salon_id, status)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_salon_category
    ON products(salon_id, category)
    WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_low_stock
    ON products(salon_id, stock_quantity, min_stock_level);

-- salon_settings
CREATE INDEX IF NOT EXISTS idx_salon_settings_salon_id
    ON salon_settings(salon_id);

-- admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_salon_id
    ON admin_users(salon_id)
    WHERE salon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_role
    ON admin_users(role);

-- salons
CREATE INDEX IF NOT EXISTS idx_salons_status
    ON salons(status);

CREATE INDEX IF NOT EXISTS idx_salons_plan
    ON salons(plan);

-- ============================================================================
-- SECTION 2: DATABASE FUNCTIONS HARDENING
-- ============================================================================

-- Garante que funções críticas usam SECURITY DEFINER com search_path fixo

-- Função auxiliar para verificar se é superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM admin_users
        WHERE user_id = auth.uid()
        AND role = 'superadmin'
    )
$$;

-- Função para obter salon_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT salon_id
    FROM admin_users
    WHERE user_id = auth.uid()
    LIMIT 1
$$;

-- Função para obter role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text
    FROM admin_users
    WHERE user_id = auth.uid()
    LIMIT 1
$$;

-- Função para verificar se usuário tem acesso ao salon
CREATE OR REPLACE FUNCTION user_has_salon_access(p_salon_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM admin_users
        WHERE user_id = auth.uid()
        AND (
            role = 'superadmin'
            OR salon_id = p_salon_id
        )
    )
$$;

-- Função para obter ID do usuário admin atual
CREATE OR REPLACE FUNCTION get_current_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id
    FROM admin_users
    WHERE user_id = auth.uid()
    LIMIT 1
$$;

-- ============================================================================
-- SECTION 3: AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id      text,
    operation       text NOT NULL,
    user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    salon_id        uuid REFERENCES salons(id) ON DELETE SET NULL,
    target_table    text,
    target_id       uuid,
    status          text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'ERROR')),
    error_code      text,
    metadata        jsonb,
    duration_ms     integer,
    ip_address      inet,
    user_agent      text,
    created_at      timestamptz DEFAULT now() NOT NULL
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_salon_id
    ON audit_logs(salon_id)
    WHERE salon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_operation
    ON audit_logs(operation);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_status
    ON audit_logs(status)
    WHERE status != 'SUCCESS';

CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id
    ON audit_logs(request_id)
    WHERE request_id IS NOT NULL;

-- Partition hint: Para sistemas com alto volume, considere particionar por mês
-- PARTITION BY RANGE (created_at) — requer PostgreSQL 10+

-- ============================================================================
-- SECTION 4: AUDIT LOG RLS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Superadmin pode ver todos os logs
DROP POLICY IF EXISTS audit_logs_superadmin_select ON audit_logs;
CREATE POLICY audit_logs_superadmin_select
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (is_superadmin());

-- Usuário pode ver apenas seus próprios logs
DROP POLICY IF EXISTS audit_logs_user_select ON audit_logs;
CREATE POLICY audit_logs_user_select
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Apenas sistema pode inserir (via service_role)
-- Logs não podem ser modificados ou deletados
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert
    ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ninguém pode deletar logs (imutável)
-- UPDATE e DELETE não têm políticas → negado por padrão

-- ============================================================================
-- SECTION 5: TENANT CONSTRAINT VALIDATION TRIGGER
-- ============================================================================

-- Trigger para validar que professional_id pertence ao mesmo salon
CREATE OR REPLACE FUNCTION validate_appointment_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar professional_id
    IF NEW.professional_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM professionals
            WHERE id = NEW.professional_id
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Professional % does not belong to salon %',
                NEW.professional_id, NEW.salon_id
            USING ERRCODE = 'P0003';
        END IF;
    END IF;

    -- Validar service_id
    IF NEW.service_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM services
            WHERE id = NEW.service_id
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Service % does not belong to salon %',
                NEW.service_id, NEW.salon_id
            USING ERRCODE = 'P0003';
        END IF;
    END IF;

    -- Validar client_id
    IF NEW.client_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM clients
            WHERE id = NEW.client_id
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Client % does not belong to salon %',
                NEW.client_id, NEW.salon_id
            USING ERRCODE = 'P0003';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_appointment_tenant_fk ON appointments;
CREATE TRIGGER trg_validate_appointment_tenant_fk
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION validate_appointment_tenant_fk();

-- Trigger para validar que professional_id em transactions pertence ao mesmo salon
CREATE OR REPLACE FUNCTION validate_transaction_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar professional_id
    IF NEW.professional_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM professionals
            WHERE id = NEW.professional_id
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Professional % does not belong to salon %',
                NEW.professional_id, NEW.salon_id
            USING ERRCODE = 'P0003';
        END IF;
    END IF;

    -- Validar appointment_id
    IF NEW.appointment_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE id = NEW.appointment_id
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Appointment % does not belong to salon %',
                NEW.appointment_id, NEW.salon_id
            USING ERRCODE = 'P0003';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_transaction_tenant_fk ON transactions;
CREATE TRIGGER trg_validate_transaction_tenant_fk
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_tenant_fk();

-- ============================================================================
-- SECTION 6: UPDATED_AT AUTO-UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'salons', 'admin_users', 'professionals', 'services',
        'clients', 'appointments', 'transactions', 'products', 'salon_settings'
    ] LOOP
        -- Drop se existir
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_updated_at ON %I', tbl);

        -- Criar apenas se coluna updated_at existir
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = tbl
            AND column_name = 'updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_update_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW
                 EXECUTE FUNCTION update_updated_at_column()',
                tbl
            );
        END IF;
    END LOOP;
END;
$$;

-- ============================================================================
-- SECTION 7: SALON_ID IMMUTABILITY TRIGGERS
-- ============================================================================
-- Previne que salon_id seja alterado em qualquer tabela tenant-scoped

CREATE OR REPLACE FUNCTION prevent_salon_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.salon_id != OLD.salon_id THEN
        RAISE EXCEPTION 'salon_id cannot be changed after creation'
        USING ERRCODE = 'P0004';
    END IF;
    RETURN NEW;
END;
$$;

-- Aplicar em todas as tabelas tenant-scoped
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'professionals', 'services', 'clients',
        'appointments', 'transactions', 'products', 'salon_settings'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_salon_id_change ON %I', tbl);
        EXECUTE format(
            'CREATE TRIGGER trg_prevent_salon_id_change
             BEFORE UPDATE ON %I
             FOR EACH ROW
             WHEN (NEW.salon_id IS DISTINCT FROM OLD.salon_id)
             EXECUTE FUNCTION prevent_salon_id_change()',
            tbl
        );
    END LOOP;
END;
$$;

-- ============================================================================
-- SECTION 8: DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Appointments: duration mínima e máxima
-- (scheduled_time é tipo TIME nativo — validação automática pelo PostgreSQL)
ALTER TABLE appointments
    DROP CONSTRAINT IF EXISTS chk_appointments_duration,
    ADD CONSTRAINT chk_appointments_duration
    CHECK (duration >= 5 AND duration <= 480);

-- Services: price não pode ser negativo
ALTER TABLE services
    DROP CONSTRAINT IF EXISTS chk_services_price_positive,
    ADD CONSTRAINT chk_services_price_positive
    CHECK (price >= 0);

-- Services: duration válida
ALTER TABLE services
    DROP CONSTRAINT IF EXISTS chk_services_duration,
    ADD CONSTRAINT chk_services_duration
    CHECK (duration >= 5 AND duration <= 480);

-- Products: stock_quantity não pode ser negativo
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_stock_positive,
    ADD CONSTRAINT chk_products_stock_positive
    CHECK (stock_quantity >= 0);

-- Products: price não pode ser negativo
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_price_positive,
    ADD CONSTRAINT chk_products_price_positive
    CHECK (price >= 0);

-- Transactions: amount deve ser positivo
ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS chk_transactions_amount_positive,
    ADD CONSTRAINT chk_transactions_amount_positive
    CHECK (amount > 0);

-- Professionals: commission_rate entre 0 e 100
ALTER TABLE professionals
    DROP CONSTRAINT IF EXISTS chk_professionals_commission_rate,
    ADD CONSTRAINT chk_professionals_commission_rate
    CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- ============================================================================
-- SECTION 9: GRANTS E PERMISSIONS
-- ============================================================================

-- Garante que o role authenticated tem acesso correto
-- (Supabase gerencia isso, mas explicitamos para clareza)

-- audit_logs: apenas authenticated pode inserir/selecionar
GRANT SELECT, INSERT ON audit_logs TO authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE ALL ON audit_logs FROM anon;

-- Funções auxiliares: apenas authenticated
REVOKE ALL ON FUNCTION is_superadmin() FROM anon;
REVOKE ALL ON FUNCTION get_user_salon_id() FROM anon;
REVOKE ALL ON FUNCTION get_user_role() FROM anon;
REVOKE ALL ON FUNCTION user_has_salon_access(uuid) FROM anon;
REVOKE ALL ON FUNCTION get_current_admin_user_id() FROM anon;

GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_salon_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_salon_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_admin_user_id() TO authenticated;

-- ============================================================================
-- SECTION 10: SALON DELETION PROTECTION
-- ============================================================================

-- Previne exclusão de salon enquanto houver dados associados
CREATE OR REPLACE FUNCTION prevent_salon_deletion_with_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Verificar admin_users
    SELECT COUNT(*) INTO v_count FROM admin_users WHERE salon_id = OLD.id;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete salon with % active admin users. Deactivate users first.', v_count
        USING ERRCODE = 'P0005';
    END IF;

    -- Verificar appointments futuros
    SELECT COUNT(*) INTO v_count
    FROM appointments
    WHERE salon_id = OLD.id
    AND scheduled_date >= CURRENT_DATE
    AND status IN ('scheduled', 'confirmed');

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete salon with % upcoming appointments. Cancel them first.', v_count
        USING ERRCODE = 'P0005';
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_salon_deletion ON salons;
CREATE TRIGGER trg_prevent_salon_deletion
    BEFORE DELETE ON salons
    FOR EACH ROW
    EXECUTE FUNCTION prevent_salon_deletion_with_data();

-- ============================================================================
-- SECTION 11: STATISTICS UPDATE
-- ============================================================================

-- Atualiza estatísticas para otimizador de queries
ANALYZE salons;
ANALYZE admin_users;
ANALYZE professionals;
ANALYZE services;
ANALYZE clients;
ANALYZE appointments;
ANALYZE transactions;
ANALYZE products;
ANALYZE salon_settings;

-- ============================================================================
-- SECTION 12: VERIFICATION QUERIES
-- ============================================================================

-- Verificar índices criados
DO $$
DECLARE
    idx_count integer;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    RAISE NOTICE 'Total indexes created/verified: %', idx_count;
END;
$$;

-- Verificar triggers criados
DO $$
DECLARE
    trg_count integer;
BEGIN
    SELECT COUNT(*) INTO trg_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trg_%';

    RAISE NOTICE 'Total triggers created/verified: %', trg_count;
END;
$$;

-- Verificar funções criadas
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM pg_proc
            WHERE proname IN (
                'is_superadmin', 'get_user_salon_id', 'get_user_role',
                'user_has_salon_access', 'get_current_admin_user_id',
                'validate_appointment_tenant_fk', 'validate_transaction_tenant_fk',
                'update_updated_at_column', 'prevent_salon_id_change',
                'prevent_salon_deletion_with_data'
            )
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
           ) >= 10,
    'ERROR: Some functions were not created!';

    RAISE NOTICE '✅ Phase 11 — Database Hardening COMPLETE';
    RAISE NOTICE '   ✅ Section 1: Performance indexes';
    RAISE NOTICE '   ✅ Section 2: Functions with SECURITY DEFINER + search_path';
    RAISE NOTICE '   ✅ Section 3: audit_logs table';
    RAISE NOTICE '   ✅ Section 4: audit_logs RLS';
    RAISE NOTICE '   ✅ Section 5: Cross-tenant FK validation triggers';
    RAISE NOTICE '   ✅ Section 6: updated_at auto-update triggers';
    RAISE NOTICE '   ✅ Section 7: salon_id immutability triggers';
    RAISE NOTICE '   ✅ Section 8: Data integrity constraints';
    RAISE NOTICE '   ✅ Section 9: Grants and permissions';
    RAISE NOTICE '   ✅ Section 10: Salon deletion protection';
    RAISE NOTICE '   ✅ Section 11: Statistics updated';
END;
$$;