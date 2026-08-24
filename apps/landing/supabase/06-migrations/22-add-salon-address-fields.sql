-- ============================================================================
-- Migration: Add Salon Address Fields and Update RPC
-- Date: 2026-08-24
-- Author: Enterprise Security Team
-- ============================================================================

-- 1. Add new columns to the salons table
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);

-- 2. Drop the previous version of the RPC (if it was created) to change its signature
DROP FUNCTION IF EXISTS update_salon_details;

-- 3. Recreate the RPC with the new fields
CREATE OR REPLACE FUNCTION update_salon_details(
    p_salon_id UUID,
    p_actor_id UUID,
    p_name VARCHAR DEFAULT NULL,
    p_owner_name VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL,
    p_plan VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_cnpj VARCHAR DEFAULT NULL,
    p_owner_cpf VARCHAR DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_professionals_count VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_zip_code VARCHAR DEFAULT NULL,
    p_address_number VARCHAR DEFAULT NULL,
    p_neighborhood VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_role TEXT;
    v_old_record JSONB;
    v_new_record JSONB;
    v_changes JSONB := '{}'::JSONB;
    v_salon_name TEXT;
BEGIN
    -- 1. Validate actor is superadmin
    SELECT role INTO v_actor_role
    FROM admin_users
    WHERE user_id = p_actor_id;
    
    IF v_actor_role IS NULL OR v_actor_role != 'superadmin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'FORBIDDEN: Only superadmins can update salon details'
        );
    END IF;

    -- 2. Get current salon state for audit diff
    SELECT jsonb_build_object(
        'name', name,
        'owner_name', owner_name,
        'email', email,
        'phone', phone,
        'city', city,
        'state', state,
        'plan', plan,
        'status', status,
        'cnpj', cnpj,
        'owner_cpf', owner_cpf,
        'address', address,
        'professionals_count', professionals_count,
        'zip_code', zip_code,
        'address_number', address_number,
        'neighborhood', neighborhood
    ) INTO v_old_record
    FROM salons
    WHERE id = p_salon_id AND deleted_at IS NULL;

    IF v_old_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Salon not found or has been deleted'
        );
    END IF;

    SELECT name INTO v_salon_name FROM salons WHERE id = p_salon_id;

    -- 3. Validate plan and status if provided
    IF p_plan IS NOT NULL AND p_plan NOT IN ('basic', 'pro', 'enterprise') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid plan. Must be: basic, pro, or enterprise'
        );
    END IF;

    IF p_status IS NOT NULL AND p_status NOT IN ('active', 'inactive', 'suspended') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be: active, inactive, or suspended'
        );
    END IF;

    -- 4. Apply updates
    UPDATE salons SET
        name = COALESCE(p_name, name),
        owner_name = COALESCE(p_owner_name, owner_name),
        phone = COALESCE(p_phone, phone),
        city = CASE WHEN p_city IS NOT NULL THEN p_city ELSE city END,
        state = CASE WHEN p_state IS NOT NULL THEN p_state ELSE state END,
        plan = COALESCE(p_plan, plan),
        status = COALESCE(p_status, status),
        cnpj = CASE WHEN p_cnpj IS NOT NULL THEN p_cnpj ELSE cnpj END,
        owner_cpf = CASE WHEN p_owner_cpf IS NOT NULL THEN p_owner_cpf ELSE owner_cpf END,
        address = CASE WHEN p_address IS NOT NULL THEN p_address ELSE address END,
        professionals_count = COALESCE(p_professionals_count, professionals_count),
        email = COALESCE(p_email, email),
        zip_code = CASE WHEN p_zip_code IS NOT NULL THEN p_zip_code ELSE zip_code END,
        address_number = CASE WHEN p_address_number IS NOT NULL THEN p_address_number ELSE address_number END,
        neighborhood = CASE WHEN p_neighborhood IS NOT NULL THEN p_neighborhood ELSE neighborhood END,
        updated_at = NOW()
    WHERE id = p_salon_id;

    -- 5. Get new state for audit diff
    SELECT jsonb_build_object(
        'name', name,
        'owner_name', owner_name,
        'email', email,
        'phone', phone,
        'city', city,
        'state', state,
        'plan', plan,
        'status', status,
        'cnpj', cnpj,
        'owner_cpf', owner_cpf,
        'address', address,
        'professionals_count', professionals_count,
        'zip_code', zip_code,
        'address_number', address_number,
        'neighborhood', neighborhood
    ) INTO v_new_record
    FROM salons
    WHERE id = p_salon_id;

    -- 6. Build changes diff (only changed fields)
    IF v_old_record->>'name' IS DISTINCT FROM v_new_record->>'name' THEN v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', v_old_record->>'name', 'new', v_new_record->>'name')); END IF;
    IF v_old_record->>'owner_name' IS DISTINCT FROM v_new_record->>'owner_name' THEN v_changes := v_changes || jsonb_build_object('owner_name', jsonb_build_object('old', v_old_record->>'owner_name', 'new', v_new_record->>'owner_name')); END IF;
    IF v_old_record->>'email' IS DISTINCT FROM v_new_record->>'email' THEN v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', v_old_record->>'email', 'new', v_new_record->>'email')); END IF;
    IF v_old_record->>'phone' IS DISTINCT FROM v_new_record->>'phone' THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', v_old_record->>'phone', 'new', v_new_record->>'phone')); END IF;
    IF v_old_record->>'plan' IS DISTINCT FROM v_new_record->>'plan' THEN v_changes := v_changes || jsonb_build_object('plan', jsonb_build_object('old', v_old_record->>'plan', 'new', v_new_record->>'plan')); END IF;
    IF v_old_record->>'status' IS DISTINCT FROM v_new_record->>'status' THEN v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_record->>'status', 'new', v_new_record->>'status')); END IF;

    -- 7. Audit log
    INSERT INTO audit_logs (
        operation,
        user_id,
        target_table,
        target_id,
        status,
        context,
        created_at
    ) VALUES (
        'SALON_DETAILS_UPDATED',
        p_actor_id,
        'salons',
        p_salon_id,
        'SUCCESS',
        jsonb_build_object(
            'salon_name', v_salon_name,
            'changes', v_changes
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Salon "' || COALESCE(p_name, v_salon_name) || '" updated successfully',
        'salon_id', p_salon_id,
        'changes_count', (SELECT count(*) FROM jsonb_object_keys(v_changes))
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_salon_details TO authenticated;
