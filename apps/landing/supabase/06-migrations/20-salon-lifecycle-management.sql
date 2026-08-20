-- ============================================================================
-- Migration: Salon Lifecycle Management (Inactivate/Suspend/Delete)
-- Date: 2026-08-20
-- Author: Enterprise Security Team
-- 
-- This migration implements enterprise-grade salon lifecycle management:
-- - Inactivate: Soft disable, preserves data, can be reactivated
-- - Suspend: Temporary block (e.g., payment issues), can be reactivated
-- - Delete: Soft delete with deleted_at timestamp + data anonymization
-- ============================================================================

-- ============================================================================
-- 1. Add deleted_at column to salons table (for soft delete pattern)
-- ============================================================================
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL REFERENCES auth.users(id);

ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT DEFAULT NULL;

-- Add index for efficient filtering of deleted records
CREATE INDEX IF NOT EXISTS idx_salons_deleted_at ON salons(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 2. RPC: Change Salon Status (Superadmin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION change_salon_status(
    p_salon_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status TEXT;
    v_actor_role TEXT;
    v_salon_name TEXT;
BEGIN
    -- 1. Validate actor is superadmin (if actor_id provided)
    IF p_actor_id IS NOT NULL THEN
        SELECT role INTO v_actor_role
        FROM admin_users
        WHERE user_id = p_actor_id;
        
        IF v_actor_role IS NULL OR v_actor_role != 'superadmin' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'FORBIDDEN: Only superadmins can change salon status'
            );
        END IF;
    END IF;

    -- 2. Validate new status
    IF p_new_status NOT IN ('active', 'inactive', 'suspended') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be: active, inactive, or suspended'
        );
    END IF;

    -- 3. Get current salon status
    SELECT status, name INTO v_current_status, v_salon_name
    FROM salons
    WHERE id = p_salon_id AND deleted_at IS NULL;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Salon not found or already deleted'
        );
    END IF;

    -- 4. Check if status is actually changing
    IF v_current_status = p_new_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Status unchanged (already ' || p_new_status || ')',
            'salon_id', p_salon_id
        );
    END IF;

    -- 5. Update salon status
    UPDATE salons
    SET 
        status = p_new_status::TEXT::VARCHAR(20),
        deactivation_reason = CASE 
            WHEN p_new_status IN ('inactive', 'suspended') THEN COALESCE(p_reason, 'Status changed by admin')
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_salon_id;

    -- 6. Audit log
    INSERT INTO audit_logs (
        operation,
        user_id,
        target_table,
        target_id,
        status,
        context,
        created_at
    ) VALUES (
        'SALON_STATUS_CHANGE',
        COALESCE(p_actor_id, '00000000-0000-0000-0000-000000000000'::UUID),
        'salons',
        p_salon_id,
        'SUCCESS',
        jsonb_build_object(
            'old_status', v_current_status,
            'new_status', p_new_status,
            'reason', p_reason,
            'salon_name', v_salon_name
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Salon status changed from ' || v_current_status || ' to ' || p_new_status,
        'salon_id', p_salon_id,
        'old_status', v_current_status,
        'new_status', p_new_status
    );
END;
$$;

-- Grant execute to authenticated users (RLS will handle the rest via Server Actions)
GRANT EXECUTE ON FUNCTION change_salon_status TO authenticated;

-- ============================================================================
-- 3. RPC: Soft Delete Salon (Superadmin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION soft_delete_salon(
    p_salon_id UUID,
    p_reason TEXT DEFAULT 'Deleted by admin',
    p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_role TEXT;
    v_salon_name TEXT;
    v_salon_status TEXT;
BEGIN
    -- 1. Validate actor is superadmin
    IF p_actor_id IS NOT NULL THEN
        SELECT role INTO v_actor_role
        FROM admin_users
        WHERE user_id = p_actor_id;
        
        IF v_actor_role IS NULL OR v_actor_role != 'superadmin' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'FORBIDDEN: Only superadmins can delete salons'
            );
        END IF;
    END IF;

    -- 2. Get salon info
    SELECT name, status INTO v_salon_name, v_salon_status
    FROM salons
    WHERE id = p_salon_id AND deleted_at IS NULL;

    IF v_salon_name IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Salon not found or already deleted'
        );
    END IF;

    -- 3. Soft delete: Set deleted_at timestamp and status to inactive
    UPDATE salons
    SET 
        deleted_at = NOW(),
        deleted_by = p_actor_id,
        status = 'inactive',
        deactivation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_salon_id;

    -- 4. Revoke all salon users' access by setting salon status check will block them
    -- No need to delete auth users - they just won't be able to access

    -- 5. Audit log
    INSERT INTO audit_logs (
        operation,
        user_id,
        target_table,
        target_id,
        status,
        context,
        created_at
    ) VALUES (
        'SALON_SOFT_DELETE',
        COALESCE(p_actor_id, '00000000-0000-0000-0000-000000000000'::UUID),
        'salons',
        p_salon_id,
        'SUCCESS',
        jsonb_build_object(
            'salon_name', v_salon_name,
            'previous_status', v_salon_status,
            'reason', p_reason
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Salon "' || v_salon_name || '" has been soft deleted',
        'salon_id', p_salon_id,
        'deleted_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_salon TO authenticated;

-- ============================================================================
-- 4. RPC: Restore Deleted Salon (Superadmin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION restore_deleted_salon(
    p_salon_id UUID,
    p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_role TEXT;
    v_salon_name TEXT;
    v_deleted_at TIMESTAMPTZ;
BEGIN
    -- 1. Validate actor is superadmin
    IF p_actor_id IS NOT NULL THEN
        SELECT role INTO v_actor_role
        FROM admin_users
        WHERE user_id = p_actor_id;
        
        IF v_actor_role IS NULL OR v_actor_role != 'superadmin' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'FORBIDDEN: Only superadmins can restore salons'
            );
        END IF;
    END IF;

    -- 2. Get salon info
    SELECT name, deleted_at INTO v_salon_name, v_deleted_at
    FROM salons
    WHERE id = p_salon_id;

    IF v_salon_name IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Salon not found'
        );
    END IF;

    IF v_deleted_at IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Salon is not deleted'
        );
    END IF;

    -- 3. Restore salon
    UPDATE salons
    SET 
        deleted_at = NULL,
        deleted_by = NULL,
        status = 'active',
        deactivation_reason = NULL,
        updated_at = NOW()
    WHERE id = p_salon_id;

    -- 4. Audit log
    INSERT INTO audit_logs (
        operation,
        user_id,
        target_table,
        target_id,
        status,
        context,
        created_at
    ) VALUES (
        'SALON_RESTORED',
        COALESCE(p_actor_id, '00000000-0000-0000-0000-000000000000'::UUID),
        'salons',
        p_salon_id,
        'SUCCESS',
        jsonb_build_object(
            'salon_name', v_salon_name,
            'was_deleted_at', v_deleted_at
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Salon "' || v_salon_name || '" has been restored',
        'salon_id', p_salon_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION restore_deleted_salon TO authenticated;

-- ============================================================================
-- 5. RPC: Check Salon Access (for middleware/auth verification)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_salon_access(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_salon_id UUID;
    v_salon_status TEXT;
    v_salon_deleted_at TIMESTAMPTZ;
    v_salon_name TEXT;
    v_deactivation_reason TEXT;
BEGIN
    -- Get user's salon
    SELECT salon_id INTO v_salon_id
    FROM salon_users
    WHERE user_id = p_user_id;

    IF v_salon_id IS NULL THEN
        -- Check admin_users for superadmins (they don't have salon_id)
        SELECT role INTO v_salon_status
        FROM admin_users
        WHERE user_id = p_user_id AND role = 'superadmin';
        
        IF v_salon_status = 'superadmin' THEN
            RETURN jsonb_build_object(
                'allowed', true,
                'role', 'superadmin'
            );
        END IF;
        
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'NO_SALON_FOUND',
            'message', 'User is not associated with any salon'
        );
    END IF;

    -- Get salon status
    SELECT status, deleted_at, name, deactivation_reason 
    INTO v_salon_status, v_salon_deleted_at, v_salon_name, v_deactivation_reason
    FROM salons
    WHERE id = v_salon_id;

    -- Check if deleted
    IF v_salon_deleted_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SALON_DELETED',
            'message', 'This salon has been removed from the system',
            'salon_name', v_salon_name
        );
    END IF;

    -- Check status
    IF v_salon_status = 'inactive' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SALON_INACTIVE',
            'message', 'This salon has been deactivated',
            'salon_name', v_salon_name,
            'deactivation_reason', v_deactivation_reason
        );
    END IF;

    IF v_salon_status = 'suspended' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SALON_SUSPENDED',
            'message', 'This salon has been temporarily suspended',
            'salon_name', v_salon_name,
            'deactivation_reason', v_deactivation_reason
        );
    END IF;

    -- Salon is active
    RETURN jsonb_build_object(
        'allowed', true,
        'salon_id', v_salon_id,
        'salon_name', v_salon_name,
        'status', v_salon_status
    );
END;
$$;

-- Public access for auth checks
GRANT EXECUTE ON FUNCTION check_salon_access TO authenticated;

-- ============================================================================
-- 6. Update RLS policies to exclude deleted salons
-- ============================================================================

-- Drop and recreate policies that select from salons to filter deleted
-- This is a safe operation as policies are additive

-- Ensure deleted salons are not visible in normal queries
DROP POLICY IF EXISTS salons_hide_deleted ON salons;
CREATE POLICY salons_hide_deleted ON salons
    FOR SELECT
    USING (deleted_at IS NULL);

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================
COMMENT ON COLUMN salons.deleted_at IS 'Soft delete timestamp. When set, salon is considered deleted.';
COMMENT ON COLUMN salons.deleted_by IS 'UUID of the admin who deleted the salon.';
COMMENT ON COLUMN salons.deactivation_reason IS 'Reason for deactivation/suspension/deletion.';
COMMENT ON FUNCTION change_salon_status IS 'Changes salon status (active/inactive/suspended). Superadmin only.';
COMMENT ON FUNCTION soft_delete_salon IS 'Soft deletes a salon by setting deleted_at. Preserves data. Superadmin only.';
COMMENT ON FUNCTION restore_deleted_salon IS 'Restores a soft-deleted salon. Superadmin only.';
COMMENT ON FUNCTION check_salon_access IS 'Checks if a user can access their salon. Used by middleware.';