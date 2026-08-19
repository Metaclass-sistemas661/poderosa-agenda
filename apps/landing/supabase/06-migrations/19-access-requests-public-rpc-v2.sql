-- ==============================================================================
-- MIGRATION: 19-access-requests-public-rpc-v2.sql
-- DESCRIPTION: Fixed version that adapts to existing table structure
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Add missing columns if they don't exist
-- ==============================================================================
DO $$
BEGIN
    -- Add source column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'access_requests' 
                   AND column_name = 'source') THEN
        ALTER TABLE public.access_requests ADD COLUMN source VARCHAR(50) DEFAULT 'website';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'access_requests' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.access_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ==============================================================================
-- STEP 2: Enable RLS
-- ==============================================================================
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 3: Create RLS Policy for superadmins (if not exists)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'access_requests' AND policyname = 'Superadmins can manage access requests'
    ) THEN
        CREATE POLICY "Superadmins can manage access requests"
        ON public.access_requests
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE user_id = auth.uid() AND role = 'superadmin'
            )
        );
    END IF;
END $$;

-- ==============================================================================
-- STEP 4: Rate limit helper
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_access_request_rate_limit(
    p_email VARCHAR,
    p_phone VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_recent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.access_requests
    WHERE (email = p_email OR phone = p_phone)
      AND created_at > NOW() - INTERVAL '24 hours';
    
    RETURN v_recent_count < 3;  -- Allow 3 submissions per 24h
END;
$$;

-- ==============================================================================
-- STEP 5: Main RPC - Simplified to match existing table
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_access_request(
    p_salon_name VARCHAR,
    p_owner_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_city VARCHAR,
    p_state VARCHAR,  -- Changed from CHAR(2) to VARCHAR for flexibility
    p_professionals VARCHAR,
    p_message TEXT DEFAULT NULL,
    p_source VARCHAR DEFAULT 'website'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_request_id UUID;
    v_rate_limit_ok BOOLEAN;
    v_error_msg TEXT;
    v_error_detail TEXT;
BEGIN
    -- ==================================================================
    -- VALIDATION
    -- ==================================================================
    
    IF p_salon_name IS NULL OR LENGTH(TRIM(p_salon_name)) < 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Nome do salão é obrigatório'
        );
    END IF;
    
    IF p_owner_name IS NULL OR LENGTH(TRIM(p_owner_name)) < 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Nome do proprietário é obrigatório'
        );
    END IF;
    
    IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Email inválido'
        );
    END IF;
    
    IF p_phone IS NULL OR LENGTH(REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g')) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Telefone inválido (mínimo 10 dígitos)'
        );
    END IF;
    
    -- ==================================================================
    -- RATE LIMITING
    -- ==================================================================
    
    SELECT public.check_access_request_rate_limit(LOWER(TRIM(p_email)), p_phone) INTO v_rate_limit_ok;
    
    IF NOT v_rate_limit_ok THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'RATE_LIMIT',
            'message', 'Muitas solicitações. Aguarde 24 horas.'
        );
    END IF;
    
    -- ==================================================================
    -- INSERT - Minimal columns for compatibility
    -- ==================================================================
    
    BEGIN
        INSERT INTO public.access_requests (
            salon_name,
            owner_name,
            email,
            phone,
            city,
            state,
            professionals,
            message,
            status
        ) VALUES (
            TRIM(p_salon_name),
            TRIM(p_owner_name),
            LOWER(TRIM(p_email)),
            REGEXP_REPLACE(p_phone, '[^0-9+()-\s]', '', 'g'),
            TRIM(COALESCE(p_city, '')),
            UPPER(TRIM(COALESCE(p_state, ''))),
            COALESCE(p_professionals, '1'),
            CASE WHEN p_message IS NOT NULL THEN LEFT(TRIM(p_message), 1000) ELSE NULL END,
            'pending'
        ) RETURNING id INTO v_request_id;
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT,
                                v_error_detail = PG_EXCEPTION_DETAIL;
        
        -- Return the actual error for debugging
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSERT_ERROR',
            'message', v_error_msg,
            'detail', v_error_detail
        );
    END;
    
    -- ==================================================================
    -- SUCCESS
    -- ==================================================================
    
    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_request_id,
        'message', 'Solicitação enviada com sucesso'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'DUPLICATE',
            'message', 'Já existe uma solicitação com este email'
        );
    WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INTERNAL_ERROR',
            'message', v_error_msg
        );
END;
$$;

-- ==============================================================================
-- STEP 6: Grant permissions
-- ==============================================================================
REVOKE ALL ON FUNCTION public.submit_access_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_access_request TO anon;
GRANT EXECUTE ON FUNCTION public.submit_access_request TO authenticated;

REVOKE ALL ON FUNCTION public.check_access_request_rate_limit FROM PUBLIC;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 19-v2 completed. RPC submit_access_request ready.';
END $$;