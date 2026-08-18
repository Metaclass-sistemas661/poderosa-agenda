-- ============================================================================
-- PHASE 15.4 — CONNECTIVITY: WEBHOOK DELIVERY LOGS
-- ============================================================================

-- Rastreamento de entregas de webhooks para retentativas e logs
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID NOT NULL REFERENCES webhooks_outbound(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    
    event_type VARCHAR NOT NULL,
    payload JSONB NOT NULL,
    
    status VARCHAR NOT NULL, -- 'success', 'failed', 'pending'
    http_status INTEGER,
    error_message TEXT,
    
    delivery_attempts INTEGER DEFAULT 1,
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their webhook logs" ON webhook_delivery_logs;
CREATE POLICY "Admins can view their webhook logs" ON webhook_delivery_logs
    FOR SELECT TO authenticated
    USING (salon_id IN (SELECT salon_id FROM admin_users WHERE user_id = auth.uid()));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_webhook_delivery_logs ON webhook_delivery_logs;
CREATE TRIGGER set_timestamp_webhook_delivery_logs
    BEFORE UPDATE ON webhook_delivery_logs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
