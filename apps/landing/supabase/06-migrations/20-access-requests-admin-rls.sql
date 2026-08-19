-- ==============================================================================
-- MIGRATION: 20-access-requests-admin-rls.sql
-- DESCRIPTION: Enterprise RLS for access_requests - superadmin management
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Ensure admin_users table exists
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 2: Drop existing policies to recreate
-- ==============================================================================
DROP POLICY IF EXISTS "Superadmins can manage access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Superadmins can select access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Superadmins can update access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Superadmins can delete access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Authenticated admins can manage access requests" ON public.access_requests;

-- ==============================================================================
-- STEP 3: Create helper function to check superadmin status
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    -- Check if current user is a superadmin in admin_users table
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() 
        AND role = 'superadmin'
    );
END;
$$;

-- ==============================================================================
-- STEP 4: Create RLS policies for authenticated superadmins
-- ==============================================================================

-- SELECT policy for superadmins
CREATE POLICY "Superadmins can select access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
    public.is_superadmin()
);

-- UPDATE policy for superadmins
CREATE POLICY "Superadmins can update access requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (
    public.is_superadmin()
)
WITH CHECK (
    public.is_superadmin()
);

-- DELETE policy for superadmins
CREATE POLICY "Superadmins can delete access requests"
ON public.access_requests
FOR DELETE
TO authenticated
USING (
    public.is_superadmin()
);

-- Note: INSERT is handled via RPC (submit_access_request) for anon users
-- No direct INSERT policy needed

-- ==============================================================================
-- STEP 5: Create RPC for superadmin operations (more secure than direct access)
-- ==============================================================================

-- List access requests (for admin panel)
CREATE OR REPLACE FUNCTION public.admin_list_access_requests(
    p_status VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_total INTEGER;
BEGIN
    -- Check authorization
    IF NOT public.is_superadmin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'Acesso não autorizado'
        );
    END IF;
    
    -- Get total count
    IF p_status IS NOT NULL THEN
        SELECT COUNT(*) INTO v_total FROM public.access_requests WHERE status = p_status;
    ELSE
        SELECT COUNT(*) INTO v_total FROM public.access_requests;
    END IF;
    
    -- Get data
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'salon_name', salon_name,
            'owner_name', owner_name,
            'email', email,
            'phone', phone,
            'city', city,
            'state', state,
            'professionals', professionals,
            'message', message,
            'status', status,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ) INTO v_result
    FROM (
        SELECT *
        FROM public.access_requests
        WHERE (p_status IS NULL OR status = p_status)
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) sub;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_result, '[]'::jsonb),
        'total', v_total,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;

-- Update access request status
CREATE OR REPLACE FUNCTION public.admin_update_access_request(
    p_request_id UUID,
    p_status VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check authorization
    IF NOT public.is_superadmin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'Acesso não autorizado'
        );
    END IF;
    
    -- Validate status
    IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Status inválido'
        );
    END IF;
    
    -- Update
    UPDATE public.access_requests
    SET status = p_status, updated_at = NOW()
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND',
            'message', 'Solicitação não encontrada'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status atualizado com sucesso'
    );
END;
$$;

-- ==============================================================================
-- STEP 6: Grant RPC permissions
-- ==============================================================================
REVOKE ALL ON FUNCTION public.is_superadmin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_access_requests FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_access_requests TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_access_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_access_request TO authenticated;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 20 completed.';
    RAISE NOTICE 'RLS policies created for superadmins.';
    RAISE NOTICE 'Admin RPCs created: admin_list_access_requests, admin_update_access_request';
END $$;