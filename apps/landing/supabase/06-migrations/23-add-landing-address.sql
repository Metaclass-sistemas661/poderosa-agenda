-- ==============================================================================
-- MIGRATION: 23-add-landing-address.sql
-- DESCRIPTION: Add address fields to access_requests and update submit_access_request RPC
-- ==============================================================================

-- 1. Add columns to access_requests
ALTER TABLE public.access_requests
ADD COLUMN IF NOT EXISTS address_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(255);

-- 2. Update the RPC function
CREATE OR REPLACE FUNCTION public.submit_access_request(
    p_salon_name VARCHAR,
    p_owner_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_city VARCHAR,
    p_state VARCHAR,
    p_professionals VARCHAR,
    p_message TEXT DEFAULT NULL,
    p_source VARCHAR DEFAULT 'website',
    p_address_zip VARCHAR DEFAULT NULL,
    p_address_street VARCHAR DEFAULT NULL,
    p_address_number VARCHAR DEFAULT NULL,
    p_address_neighborhood VARCHAR DEFAULT NULL
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
    v_clean_phone VARCHAR;
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
    
    -- Clean phone: keep only digits (simple and safe)
    v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
    
    IF LENGTH(v_clean_phone) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'VALIDATION_ERROR',
            'message', 'Telefone inválido (mínimo 10 dígitos)'
        );
    END IF;
    
    -- ==================================================================
    -- RATE LIMITING
    -- ==================================================================
    
    SELECT public.check_access_request_rate_limit(LOWER(TRIM(p_email)), v_clean_phone) INTO v_rate_limit_ok;
    
    IF NOT v_rate_limit_ok THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'RATE_LIMIT',
            'message', 'Muitas solicitações. Aguarde 24 horas.'
        );
    END IF;
    
    -- ==================================================================
    -- INSERT
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
            status,
            source,
            address_zip,
            address_street,
            address_number,
            address_neighborhood
        ) VALUES (
            TRIM(p_salon_name),
            TRIM(p_owner_name),
            LOWER(TRIM(p_email)),
            v_clean_phone,
            TRIM(COALESCE(p_city, '')),
            UPPER(TRIM(COALESCE(p_state, ''))),
            COALESCE(p_professionals, '1'),
            CASE WHEN p_message IS NOT NULL THEN LEFT(TRIM(p_message), 1000) ELSE NULL END,
            'pending',
            COALESCE(p_source, 'website'),
            p_address_zip,
            p_address_street,
            p_address_number,
            p_address_neighborhood
        ) RETURNING id INTO v_request_id;
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSERT_ERROR',
            'message', v_error_msg
        );
    END;
    
    -- ==================================================================
    -- RETURN SUCCESS
    -- ==================================================================
    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_request_id,
        'message', 'Solicitação de acesso enviada com sucesso.'
    );
END;
$$;
