-- ============================================================================
-- PHASE 15.3 — CONNECTIVITY: WEBHOOKS OUTBOUND
-- ============================================================================

-- Cadastro de webhooks que o salão quer receber
CREATE TABLE IF NOT EXISTS webhooks_outbound (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- Ex: ['appointment.created', 'payment.received']
    is_active BOOLEAN DEFAULT true,
    
    -- Secret para o cliente validar a assinatura HMAC (criptografado)
    encrypted_secret TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE webhooks_outbound ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their webhooks" ON webhooks_outbound;
CREATE POLICY "Admins can view their webhooks" ON webhooks_outbound
    FOR ALL TO authenticated
    USING (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin')));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_webhooks_outbound ON webhooks_outbound;
CREATE TRIGGER set_timestamp_webhooks_outbound
    BEFORE UPDATE ON webhooks_outbound
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
