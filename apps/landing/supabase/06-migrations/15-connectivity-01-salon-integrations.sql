-- ============================================================================
-- PHASE 15.1 — CONNECTIVITY: SALON INTEGRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS salon_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    
    -- Status dos módulos (true = ativado pelo usuário)
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_provider VARCHAR DEFAULT 'meta_api',
    
    calendar_enabled BOOLEAN DEFAULT false,
    
    payments_enabled BOOLEAN DEFAULT false,
    payments_primary_gateway VARCHAR DEFAULT 'mercado_pago', -- mercado_pago, asaas, stripe
    
    email_enabled BOOLEAN DEFAULT false,
    email_provider VARCHAR DEFAULT 'resend', -- resend, sendgrid
    
    api_webhooks_enabled BOOLEAN DEFAULT false,
    
    -- Configurações gerais em formato JSON
    whatsapp_settings JSONB DEFAULT '{}'::jsonb,
    calendar_settings JSONB DEFAULT '{}'::jsonb,
    payments_settings JSONB DEFAULT '{}'::jsonb,
    email_settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para ter apenas um registro de integração por salon
    CONSTRAINT unq_salon_integrations UNIQUE(salon_id)
);

-- RLS
ALTER TABLE salon_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their salon integrations" ON salon_integrations;
CREATE POLICY "Admins can view their salon integrations" ON salon_integrations
    FOR SELECT TO authenticated
    USING (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update their salon integrations" ON salon_integrations;
CREATE POLICY "Admins can update their salon integrations" ON salon_integrations
    FOR UPDATE TO authenticated
    USING (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin')));

DROP POLICY IF EXISTS "Admins can insert their salon integrations" ON salon_integrations;
CREATE POLICY "Admins can insert their salon integrations" ON salon_integrations
    FOR INSERT TO authenticated
    WITH CHECK (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin')));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_salon_integrations ON salon_integrations;
CREATE TRIGGER set_timestamp_salon_integrations
    BEFORE UPDATE ON salon_integrations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
