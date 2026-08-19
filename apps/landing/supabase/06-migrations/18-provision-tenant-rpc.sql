-- ==============================================================================
-- MIGRATION: 18-provision-tenant-rpc.sql
-- DESCRIPTION: Core RPC for atomic tenant provisioning.
--              Ensures idempotency and transactional consistency.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.provision_tenant(
    p_request_id UUID,
    p_auth_user_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request RECORD;
    v_salon_id UUID;
    v_admin_id UUID;
BEGIN
    -- 1. Lock the request row to prevent concurrent provisioning
    SELECT * INTO v_request 
    FROM public.access_requests 
    WHERE id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found: %', p_request_id;
    END IF;

    -- 2. Idempotency Guard
    IF v_request.status != 'pending' THEN
        RAISE EXCEPTION 'Request already processed (status: %)', v_request.status;
    END IF;

    -- 3. Create Tenant (Salon)
    INSERT INTO public.salons (
        name, 
        owner_name, 
        email, 
        phone, 
        city, 
        state, 
        professionals_count,
        plan,
        status
    ) VALUES (
        v_request.salon_name,
        v_request.owner_name,
        v_request.email,
        v_request.phone,
        v_request.city,
        v_request.state,
        v_request.professionals,
        'basic', -- default plan
        'active'
    ) RETURNING id INTO v_salon_id;

    -- 4. Create Admin User linked to Auth
    INSERT INTO public.admin_users (
        user_id,
        salon_id,
        name,
        email,
        role,
        permissions
    ) VALUES (
        p_auth_user_id,
        v_salon_id,
        v_request.owner_name,
        v_request.email,
        'admin', -- Initial tenant owner is 'admin' for their tenant
        '{"owner": true}'::jsonb
    ) RETURNING id INTO v_admin_id;

    -- 5. Update Request Status
    UPDATE public.access_requests 
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_request_id;

    -- 6. Audit Logging
    BEGIN
        INSERT INTO audit_logs (
            operation,
            user_id,
            salon_id,
            target_table,
            target_id,
            status,
            metadata,
            created_at
        ) VALUES (
            'TENANT_PROVISIONED',
            p_actor_id,
            v_salon_id,
            'access_requests',
            p_request_id,
            'SUCCESS',
            jsonb_build_object(
                'auth_user_id', p_auth_user_id,
                'admin_id', v_admin_id
            ),
            NOW()
        );
    EXCEPTION WHEN undefined_table THEN
        -- Safely ignore if audit_logs table does not exist
    END;

    -- 7. Return success
    RETURN jsonb_build_object(
        'success', true,
        'salon_id', v_salon_id,
        'admin_user_id', v_admin_id
    );
END;
$$;
