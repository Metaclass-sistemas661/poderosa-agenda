-- ==============================================================================
-- MIGRATION: 19-access-requests-public-rpc.sql
-- DESCRIPTION: Enterprise-grade public access request submission via RPC.
--              Does NOT grant direct INSERT to anon (security risk).
--              Uses SECURITY DEFINER RPC with validation and rate limiting.
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Ensure access_requests table exists with proper structure
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    professionals VARCHAR(20) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    source VARCHAR(50) DEFAULT 'website',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON public.access_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 2: RLS Policies - NO direct access for anon
-- ==============================================================================

-- Drop any existing insecure policies
DROP POLICY IF EXISTS "Anon can insert access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Anyone can insert access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Public insert access requests" ON public.access_requests;

-- Only superadmins can read/update/delete access requests
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
-- STEP 3: SECURITY DEFINER RPC for public submissions
-- ==============================================================================

-- Helper: Check for duplicate submissions (rate limiting)
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
    -- Check if same email or phone submitted in last 24 hours
    SELECT COUNT(*) INTO v_recent_count
    FROM public.access_requests
    WHERE (email = p_email OR phone = p_phone)
      AND created_at > NOW() - INTERVAL '24 hours';
    
    -- Allow max 2 submissions per email/phone per 24h
    RETURN v_recent_count < 2;
END;
$$;

-- Main RPC: Submit access request (callable by anon via RPC)
CREATE OR REPLACE FUNCTION public.submit_access_request(
    p_salon_name VARCHAR,
    p_owner_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_city VARCHAR,
    p_state CHAR(2),
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
BEGIN
    -- ==================================================================
    -- VALIDATION LAYER
    -- ==================================================================
    
    -- 1. Required fields validation
    IF p_salon_name IS NULL OR LENGTH(TRIM(p_salon_name)) < 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Nome do salão é obrigatório (mínimo 2 caracteres)'
        );
    END IF;
    
    IF p_owner_name IS NULL OR LENGTH(TRIM(p_owner_name)) < 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Nome do proprietário é obrigatório (mínimo 2 caracteres)'
        );
    END IF;
    
    -- 2. Email format validation
    IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Email inválido'
        );
    END IF;
    
    -- 3. Phone validation (Brazilian format - at least 10 digits)
    IF p_phone IS NULL OR LENGTH(REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g')) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Telefone inválido (mínimo 10 dígitos)'
        );
    END IF;
    
    -- 4. State validation (Brazilian states)
    IF p_state IS NULL OR UPPER(p_state) NOT IN (
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
        'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
        'SP', 'SE', 'TO'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Estado inválido'
        );
    END IF;
    
    -- 5. City validation
    IF p_city IS NULL OR LENGTH(TRIM(p_city)) < 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Cidade é obrigatória'
        );
    END IF;
    
    -- 6. Professionals validation
    IF p_professionals IS NULL OR p_professionals NOT IN ('1', '2-3', '4-5', '6-10', '10+') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Quantidade de profissionais inválida'
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
            'message', 'Você já enviou uma solicitação recentemente. Aguarde 24 horas.'
        );
    END IF;
    
    -- ==================================================================
    -- INSERT (sanitized)
    -- ==================================================================
    
    INSERT INTO public.access_requests (
        salon_name,
        owner_name,
        email,
        phone,
        city,
        state,
        professionals,
        message,
        status,
        source,
        created_at,
        updated_at
    ) VALUES (
        TRIM(p_salon_name),
        TRIM(p_owner_name),
        LOWER(TRIM(p_email)),
        REGEXP_REPLACE(p_phone, '[^0-9+()-\s]', '', 'g'),  -- Sanitize phone
        TRIM(p_city),
        UPPER(p_state),
        p_professionals,
        CASE WHEN p_message IS NOT NULL THEN LEFT(TRIM(p_message), 1000) ELSE NULL END,  -- Limit message length
        'pending',
        COALESCE(p_source, 'website'),
        NOW(),
        NOW()
    ) RETURNING id INTO v_request_id;
    
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
            'message', 'Já existe uma solicitação com este email. Entre em contato conosco.'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INTERNAL_ERROR',
            'message', 'Erro interno. Tente novamente em alguns minutos.'
        );
END;
$$;

-- ==============================================================================
-- STEP 4: Grant execute permission to anon (RPC only, not direct table access)
-- ==============================================================================

REVOKE ALL ON FUNCTION public.submit_access_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_access_request TO anon;
GRANT EXECUTE ON FUNCTION public.submit_access_request TO authenticated;

-- Rate limit helper should not be directly callable
REVOKE ALL ON FUNCTION public.check_access_request_rate_limit FROM PUBLIC;

-- ==============================================================================
-- STEP 5: Unique constraint on email for pending requests
-- ==============================================================================

-- Partial unique index: only one pending request per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_email_pending 
ON public.access_requests(LOWER(email)) 
WHERE status = 'pending';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 19 completed successfully';
    RAISE NOTICE 'RPC submit_access_request is now available for anon users';
    RAISE NOTICE 'Direct INSERT on access_requests remains blocked by RLS';
END $$;