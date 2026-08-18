-- ============================================================================
-- PHASE 15.2 — CONNECTIVITY: INTEGRATION CREDENTIALS
-- ============================================================================

-- Habilitar pgcrypto para criptografar credentials
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Armazena tokens criptografados usando PGP_SYM_ENCRYPT
CREATE TABLE IF NOT EXISTS integration_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    
    provider VARCHAR NOT NULL, -- 'mercado_pago', 'asaas', 'stripe', 'google_calendar', 'meta_whatsapp', 'resend', 'sendgrid'
    credential_type VARCHAR NOT NULL, -- 'api_key', 'access_token', 'refresh_token', 'webhook_secret'
    
    -- O token real será criptografado e armazenado aqui como texto blindado
    encrypted_token TEXT NOT NULL,
    
    -- Algumas credenciais expiram (ex: OAuth access_tokens)
    expires_at TIMESTAMPTZ,
    
    -- Metadados úteis que não precisam de criptografia (ex: account_id)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Um salon só pode ter uma credencial ativa do mesmo tipo por provedor
    CONSTRAINT unq_salon_provider_cred UNIQUE(salon_id, provider, credential_type)
);

-- Funções Auxiliares de Criptografia
CREATE OR REPLACE FUNCTION encrypt_secret(p_secret TEXT, p_key TEXT)
RETURNS TEXT 
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT pgp_sym_encrypt(p_secret, p_key)::TEXT;
$$;

CREATE OR REPLACE FUNCTION decrypt_secret(p_encrypted TEXT, p_key TEXT)
RETURNS TEXT 
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT pgp_sym_decrypt(p_encrypted::bytea, p_key);
$$;

-- RLS
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert credentials" ON integration_credentials;
CREATE POLICY "Admins can insert credentials" ON integration_credentials
    FOR INSERT TO authenticated
    WITH CHECK (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin')));

DROP POLICY IF EXISTS "Admins can update credentials" ON integration_credentials;
CREATE POLICY "Admins can update credentials" ON integration_credentials
    FOR UPDATE TO authenticated
    USING (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin')));

-- View Segura (Para o frontend listar o que está conectado, sem expor o token real)
CREATE OR REPLACE VIEW safe_integration_credentials AS
SELECT id, salon_id, provider, credential_type, expires_at, metadata, created_at, updated_at
FROM integration_credentials;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_integration_credentials ON integration_credentials;
CREATE TRIGGER set_timestamp_integration_credentials
    BEFORE UPDATE ON integration_credentials
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
