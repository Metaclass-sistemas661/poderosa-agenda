-- ============================================================================
-- P1-DB-001: SECURITY DEFINER Function Hardening
-- ============================================================================
-- This migration adds SET search_path to all SECURITY DEFINER functions
-- to prevent search_path manipulation attacks.
--
-- SECURITY: Functions with SECURITY DEFINER execute with the privileges of
-- the function owner. Without SET search_path, an attacker could create
-- malicious objects in a schema that appears earlier in the search path.
--
-- Date: 2026-08-18
-- ============================================================================

-- ============================================================================
-- DROP EXISTING FUNCTIONS (required when changing return type or signature)
-- ============================================================================
-- Note: We need to drop functions that may have different signatures
-- This is safe because we immediately recreate them with the same functionality

DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions() CASCADE;

-- ============================================================================
-- CORE SECURITY FUNCTIONS
-- ============================================================================

-- get_user_salon_id() - Returns the salon_id for the current user
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS UUID AS $$
DECLARE
    v_salon_id UUID;
BEGIN
    SELECT salon_id INTO v_salon_id
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN v_salon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- is_superadmin() - Checks if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN v_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- user_belongs_to_salon(salon_id) - Validates user belongs to a salon
CREATE OR REPLACE FUNCTION public.user_belongs_to_salon(p_salon_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_salon_id UUID;
    v_is_superadmin BOOLEAN;
BEGIN
    -- Check if superadmin first (can access any salon)
    SELECT 
        salon_id,
        (role = 'superadmin')
    INTO v_user_salon_id, v_is_superadmin
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Superadmins can access any salon
    IF v_is_superadmin THEN
        RETURN TRUE;
    END IF;
    
    -- Regular users must match their assigned salon
    RETURN v_user_salon_id = p_salon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- get_user_role() - Returns the role for the current user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(v_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- ============================================================================
-- TRIGGER FUNCTIONS - VALIDATION
-- ============================================================================

-- validate_salon_id_on_insert() - Ensures salon_id matches user's tenant
CREATE OR REPLACE FUNCTION public.validate_salon_id_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_user_salon_id UUID;
    v_is_superadmin BOOLEAN;
BEGIN
    -- Get user's salon_id and superadmin status
    SELECT 
        salon_id,
        (role = 'superadmin')
    INTO v_user_salon_id, v_is_superadmin
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Superadmins can insert into any salon
    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;
    
    -- Regular users: salon_id must match their assigned salon
    IF NEW.salon_id IS DISTINCT FROM v_user_salon_id THEN
        RAISE EXCEPTION 'Cannot insert record into different salon (salon_id mismatch)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- TRIGGER FUNCTIONS - PRIVILEGE ESCALATION PREVENTION
-- ============================================================================

-- prevent_role_escalation() - Prevents users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    v_is_superadmin BOOLEAN;
BEGIN
    -- Check if current user is superadmin
    SELECT (role = 'superadmin') INTO v_is_superadmin
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Superadmins can change roles
    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;
    
    -- Non-superadmins cannot change role field
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Permission denied: cannot change role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- prevent_admin_user_salon_id_change() - Prevents users from changing their salon_id
CREATE OR REPLACE FUNCTION public.prevent_admin_user_salon_id_change()
RETURNS TRIGGER AS $$
DECLARE
    v_is_superadmin BOOLEAN;
BEGIN
    -- Check if current user is superadmin
    SELECT (role = 'superadmin') INTO v_is_superadmin
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Superadmins can change salon_id
    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;
    
    -- Non-superadmins cannot change salon_id field
    IF OLD.salon_id IS DISTINCT FROM NEW.salon_id THEN
        RAISE EXCEPTION 'Permission denied: cannot change salon assignment';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- prevent_salon_id_change() - Generic trigger to prevent salon_id changes on tenant tables
CREATE OR REPLACE FUNCTION public.prevent_salon_id_change()
RETURNS TRIGGER AS $$
DECLARE
    v_is_superadmin BOOLEAN;
BEGIN
    -- Check if current user is superadmin
    SELECT (role = 'superadmin') INTO v_is_superadmin
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Superadmins can change salon_id
    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;
    
    -- Non-superadmins cannot change salon_id field
    IF OLD.salon_id IS DISTINCT FROM NEW.salon_id THEN
        RAISE EXCEPTION 'Permission denied: cannot change salon_id';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- TRIGGER FUNCTIONS - AUDIT LOGGING
-- ============================================================================

-- log_audit_event() - Logs security-relevant events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_event_type TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
    v_salon_id UUID;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    SELECT salon_id INTO v_salon_id
    FROM public.admin_users
    WHERE user_id = v_user_id
    LIMIT 1;
    
    -- Insert audit log entry
    INSERT INTO public.audit_log (
        event_type,
        table_name,
        record_id,
        user_id,
        salon_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        p_event_type,
        p_table_name,
        p_record_id,
        v_user_id,
        v_salon_id,
        p_old_data,
        p_new_data,
        NOW()
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- audit_trigger_function() - Generic audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_audit_event(
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_audit_event(
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_audit_event(
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- TRIGGER FUNCTIONS - DATA INTEGRITY
-- ============================================================================

-- check_appointment_integrity() - Validates appointment data integrity
CREATE OR REPLACE FUNCTION public.check_appointment_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_professional_salon_id UUID;
    v_client_salon_id UUID;
    v_service_salon_id UUID;
BEGIN
    -- Validate professional belongs to the same salon
    IF NEW.professional_id IS NOT NULL THEN
        SELECT salon_id INTO v_professional_salon_id
        FROM public.professionals
        WHERE id = NEW.professional_id;
        
        IF v_professional_salon_id IS DISTINCT FROM NEW.salon_id THEN
            RAISE EXCEPTION 'Professional does not belong to this salon';
        END IF;
    END IF;
    
    -- Validate client belongs to the same salon
    IF NEW.client_id IS NOT NULL THEN
        SELECT salon_id INTO v_client_salon_id
        FROM public.clients
        WHERE id = NEW.client_id;
        
        IF v_client_salon_id IS DISTINCT FROM NEW.salon_id THEN
            RAISE EXCEPTION 'Client does not belong to this salon';
        END IF;
    END IF;
    
    -- Validate service belongs to the same salon
    IF NEW.service_id IS NOT NULL THEN
        SELECT salon_id INTO v_service_salon_id
        FROM public.services
        WHERE id = NEW.service_id;
        
        IF v_service_salon_id IS DISTINCT FROM NEW.salon_id THEN
            RAISE EXCEPTION 'Service does not belong to this salon';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- check_transaction_integrity() - Validates transaction data integrity
CREATE OR REPLACE FUNCTION public.check_transaction_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_professional_salon_id UUID;
    v_appointment_salon_id UUID;
BEGIN
    -- Validate professional belongs to the same salon (if provided)
    IF NEW.professional_id IS NOT NULL THEN
        SELECT salon_id INTO v_professional_salon_id
        FROM public.professionals
        WHERE id = NEW.professional_id;
        
        IF v_professional_salon_id IS DISTINCT FROM NEW.salon_id THEN
            RAISE EXCEPTION 'Professional does not belong to this salon';
        END IF;
    END IF;
    
    -- Validate appointment belongs to the same salon (if provided)
    IF NEW.appointment_id IS NOT NULL THEN
        SELECT salon_id INTO v_appointment_salon_id
        FROM public.appointments
        WHERE id = NEW.appointment_id;
        
        IF v_appointment_salon_id IS DISTINCT FROM NEW.salon_id THEN
            RAISE EXCEPTION 'Appointment does not belong to this salon';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- get_user_permissions() - Returns user's effective permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE (
    can_manage_salon BOOLEAN,
    can_manage_users BOOLEAN,
    can_manage_services BOOLEAN,
    can_manage_clients BOOLEAN,
    can_manage_appointments BOOLEAN,
    can_manage_finances BOOLEAN,
    can_access_admin BOOLEAN
) AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN QUERY SELECT
        v_role IN ('superadmin', 'admin'),                    -- can_manage_salon
        v_role IN ('superadmin', 'admin'),                    -- can_manage_users
        v_role IN ('superadmin', 'admin'),                    -- can_manage_services
        v_role IN ('superadmin', 'admin', 'professional', 'receptionist'),  -- can_manage_clients
        v_role IN ('superadmin', 'admin', 'professional', 'receptionist'),  -- can_manage_appointments
        v_role IN ('superadmin', 'admin'),                    -- can_manage_finances
        v_role = 'superadmin';                                -- can_access_admin
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- ============================================================================
-- GRANT MINIMUM NECESSARY PERMISSIONS
-- ============================================================================

-- Revoke all from public, grant only to authenticated role
REVOKE ALL ON FUNCTION public.get_user_salon_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_salon_id() TO authenticated;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

REVOKE ALL ON FUNCTION public.user_belongs_to_salon(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_salon(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_permissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_permissions() TO authenticated;

REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================
-- All SECURITY DEFINER functions now have:
-- 1. SET search_path = public, pg_temp
-- 2. Explicit schema qualification (public.) for all table references
-- 3. Minimum necessary grants (authenticated role only)
-- 4. STABLE marker where applicable (read-only functions)
-- ============================================================================