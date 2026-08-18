-- ============================================================================
-- PHASE 16 — CONNECTIVITY: RPC HELPERS FOR SECURE ENCRYPTION
-- ============================================================================

-- Função RPC para salvar de forma segura as credenciais de integrações (Pix, WhatsApp, etc)
CREATE OR REPLACE FUNCTION upsert_integration_credential(
    p_salon_id UUID,
    p_provider VARCHAR,
    p_credential_type VARCHAR,
    p_token TEXT,
    p_key TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted_token TEXT;
    v_result JSONB;
BEGIN
    -- Validar se o usuário atual é admin/superadmin do salão
    IF NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() 
        AND salon_id = p_salon_id 
        AND role IN ('superadmin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Não autorizado. Apenas administradores podem gerenciar integrações.';
    END IF;

    -- Criptografar o token usando p_key
    v_encrypted_token := encrypt_secret(p_token, p_key);

    -- Upsert na tabela integration_credentials
    INSERT INTO integration_credentials (
        salon_id, provider, credential_type, encrypted_token, metadata, updated_at
    ) VALUES (
        p_salon_id, p_provider, p_credential_type, v_encrypted_token, p_metadata, NOW()
    )
    ON CONFLICT (salon_id, provider, credential_type) 
    DO UPDATE SET 
        encrypted_token = EXCLUDED.encrypted_token,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    v_result := jsonb_build_object('success', true, 'message', 'Credencial salva com segurança.');
    RETURN v_result;
END;
$$;

-- Função RPC para criar webhooks de forma segura, gerando um secret criptografado
CREATE OR REPLACE FUNCTION upsert_webhook_outbound(
    p_salon_id UUID,
    p_url TEXT,
    p_events TEXT[],
    p_secret TEXT,
    p_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted_secret TEXT;
    v_result JSONB;
BEGIN
    -- Validar se o usuário atual é admin/superadmin do salão
    IF NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() 
        AND salon_id = p_salon_id 
        AND role IN ('superadmin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Não autorizado. Apenas administradores podem gerenciar webhooks.';
    END IF;

    -- Criptografar o secret usando p_key
    v_encrypted_secret := encrypt_secret(p_secret, p_key);

    -- Insert na tabela webhooks_outbound
    INSERT INTO webhooks_outbound (
        salon_id, url, events, encrypted_secret, updated_at
    ) VALUES (
        p_salon_id, p_url, p_events, v_encrypted_secret, NOW()
    );

    v_result := jsonb_build_object('success', true, 'message', 'Webhook criado com sucesso.');
    RETURN v_result;
END;
$$;
