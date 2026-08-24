-- ============================================================================
-- CONTACT MESSAGES TABLE - ENTERPRISE-GRADE CONTACT FORM INFRASTRUCTURE
-- ============================================================================
-- Migration: 25-contact-messages.sql
-- Description: Tabela para armazenar mensagens do formulário de contato
-- Features: RLS, audit trail, indexação, status tracking
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sender Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Message Content
    subject TEXT NOT NULL DEFAULT 'suporte',
    message TEXT NOT NULL,
    
    -- Anti-spam
    honeypot_field TEXT,  -- Se preenchido, é bot
    ip_address INET,
    user_agent TEXT,
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived', 'spam')),
    
    -- Response Tracking
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id),
    response_notes TEXT,
    
    -- Email Delivery Status
    team_email_sent BOOLEAN DEFAULT FALSE,
    team_email_sent_at TIMESTAMPTZ,
    team_email_message_id TEXT,
    confirmation_email_sent BOOLEAN DEFAULT FALSE,
    confirmation_email_sent_at TIMESTAMPTZ,
    confirmation_email_message_id TEXT,
    
    -- Metadata
    source TEXT DEFAULT 'landing_page', -- landing_page, mobile_app, api
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index para busca por status
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- Index para busca por email
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);

-- Index para ordenação por data
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Index composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON public.contact_messages(status, created_at DESC);

-- Index para detecção de spam (IP)
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip ON public.contact_messages(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER trigger_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_select_superadmin" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_update_superadmin" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_delete_superadmin" ON public.contact_messages;

-- INSERT: Qualquer um pode criar mensagem (via RPC para bypass de RLS)
-- A inserção será feita via RPC com SECURITY DEFINER

-- SELECT: Apenas superadmins podem ver mensagens
CREATE POLICY "contact_messages_select_superadmin" ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role = 'superadmin'
        )
    );

-- UPDATE: Apenas superadmins podem atualizar
CREATE POLICY "contact_messages_update_superadmin" ON public.contact_messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role = 'superadmin'
        )
    );

-- DELETE: Apenas superadmins podem deletar
CREATE POLICY "contact_messages_delete_superadmin" ON public.contact_messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role = 'superadmin'
        )
    );

-- ============================================================================
-- 5. RPC: CREATE CONTACT MESSAGE (SECURITY DEFINER - Bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_contact_message(
    p_name TEXT,
    p_email TEXT,
    p_subject TEXT,
    p_message TEXT,
    p_phone TEXT DEFAULT NULL,
    p_honeypot_field TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'landing_page',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_message_id UUID;
    v_is_spam BOOLEAN := FALSE;
    v_spam_count INTEGER;
BEGIN
    -- ==========================================================
    -- 1. HONEYPOT CHECK - Se preenchido, é bot
    -- ==========================================================
    IF p_honeypot_field IS NOT NULL AND p_honeypot_field <> '' THEN
        v_is_spam := TRUE;
    END IF;
    
    -- ==========================================================
    -- 2. RATE LIMIT CHECK - Max 10 mensagens por IP por hora
    -- ==========================================================
    IF p_ip_address IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_spam_count
        FROM public.contact_messages
        WHERE ip_address = p_ip_address
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF v_spam_count >= 10 THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'RATE_LIMIT_EXCEEDED',
                'message', 'Muitas mensagens enviadas. Tente novamente em 1 hora.'
            );
        END IF;
    END IF;
    
    -- ==========================================================
    -- 3. CONTENT VALIDATION
    -- ==========================================================
    IF LENGTH(TRIM(p_name)) < 2 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_ERROR',
            'field', 'name',
            'message', 'Nome deve ter pelo menos 2 caracteres'
        );
    END IF;
    
    IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_ERROR',
            'field', 'email',
            'message', 'Email inválido'
        );
    END IF;
    
    IF LENGTH(TRIM(p_message)) < 10 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_ERROR',
            'field', 'message',
            'message', 'Mensagem deve ter pelo menos 10 caracteres'
        );
    END IF;
    
    IF LENGTH(p_message) > 10000 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_ERROR',
            'field', 'message',
            'message', 'Mensagem muito longa (máximo 10.000 caracteres)'
        );
    END IF;
    
    -- ==========================================================
    -- 4. INSERT MESSAGE
    -- ==========================================================
    INSERT INTO public.contact_messages (
        name,
        email,
        phone,
        subject,
        message,
        honeypot_field,
        ip_address,
        user_agent,
        source,
        metadata,
        status
    ) VALUES (
        TRIM(p_name),
        LOWER(TRIM(p_email)),
        NULLIF(TRIM(p_phone), ''),
        COALESCE(p_subject, 'suporte'),
        TRIM(p_message),
        NULLIF(p_honeypot_field, ''),
        p_ip_address,
        LEFT(p_user_agent, 500),  -- Limitar tamanho
        COALESCE(p_source, 'landing_page'),
        COALESCE(p_metadata, '{}'),
        CASE WHEN v_is_spam THEN 'spam' ELSE 'pending' END
    )
    RETURNING id INTO v_message_id;
    
    -- ==========================================================
    -- 5. RETURN SUCCESS
    -- ==========================================================
    RETURN jsonb_build_object(
        'success', TRUE,
        'message_id', v_message_id,
        'is_spam', v_is_spam
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'DATABASE_ERROR',
            'message', 'Erro ao salvar mensagem. Tente novamente.',
            'details', SQLERRM
        );
END;
$$;

-- Grant execute to anon (formulário público)
GRANT EXECUTE ON FUNCTION public.create_contact_message TO anon, authenticated;

-- ============================================================================
-- 6. RPC: UPDATE MESSAGE STATUS (Superadmin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_contact_message_status(
    p_message_id UUID,
    p_status TEXT,
    p_response_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check superadmin
    SELECT role INTO v_user_role
    FROM public.admin_users
    WHERE user_id = auth.uid();
    
    IF v_user_role IS NULL OR v_user_role != 'superadmin' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'UNAUTHORIZED',
            'message', 'Acesso negado'
        );
    END IF;
    
    -- Validate status
    IF p_status NOT IN ('pending', 'read', 'replied', 'archived', 'spam') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_STATUS',
            'message', 'Status inválido'
        );
    END IF;
    
    -- Update
    UPDATE public.contact_messages
    SET 
        status = p_status,
        response_notes = COALESCE(p_response_notes, response_notes),
        responded_at = CASE WHEN p_status = 'replied' THEN NOW() ELSE responded_at END,
        responded_by = CASE WHEN p_status = 'replied' THEN auth.uid() ELSE responded_by END
    WHERE id = p_message_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_FOUND',
            'message', 'Mensagem não encontrada'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message_id', p_message_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_contact_message_status TO authenticated;

-- ============================================================================
-- 7. RPC: MARK EMAIL SENT (For webhook callback)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_contact_email_sent(
    p_message_id UUID,
    p_email_type TEXT,  -- 'team' or 'confirmation'
    p_email_message_id TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    IF p_email_type = 'team' THEN
        UPDATE public.contact_messages
        SET 
            team_email_sent = TRUE,
            team_email_sent_at = NOW(),
            team_email_message_id = p_email_message_id
        WHERE id = p_message_id;
    ELSIF p_email_type = 'confirmation' THEN
        UPDATE public.contact_messages
        SET 
            confirmation_email_sent = TRUE,
            confirmation_email_sent_at = NOW(),
            confirmation_email_message_id = p_email_message_id
        WHERE id = p_message_id;
    ELSE
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_EMAIL_TYPE'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE
    );
END;
$$;

-- Grant to service role only (será chamado pelo backend)
REVOKE EXECUTE ON FUNCTION public.mark_contact_email_sent FROM anon, authenticated;

-- ============================================================================
-- 8. STATS VIEW FOR ADMIN DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW public.contact_messages_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'read') AS read_count,
    COUNT(*) FILTER (WHERE status = 'replied') AS replied_count,
    COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
    COUNT(*) FILTER (WHERE status = 'spam') AS spam_count,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_7d_count,
    AVG(
        CASE 
            WHEN responded_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600 
        END
    )::NUMERIC(10,2) AS avg_response_time_hours
FROM public.contact_messages;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.contact_messages IS 'Mensagens do formulário de contato da landing page';
COMMENT ON COLUMN public.contact_messages.honeypot_field IS 'Campo oculto para detecção de bots - se preenchido, é spam';
COMMENT ON COLUMN public.contact_messages.status IS 'pending=novo, read=lido, replied=respondido, archived=arquivado, spam=spam';
COMMENT ON FUNCTION public.create_contact_message IS 'RPC público para criar mensagem de contato com validação e anti-spam';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================