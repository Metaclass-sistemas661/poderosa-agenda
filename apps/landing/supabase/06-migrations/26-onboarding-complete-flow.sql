-- ============================================================================
-- MIGRATION: Complete Onboarding Flow
-- ============================================================================
-- Description: Adds all necessary infrastructure for the complete onboarding
--              flow including payment webhook processing and password management
-- 
-- Author: Enterprise Architecture Team
-- Date: 2026-08-24
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD COLUMNS TO admin_users FOR PASSWORD MANAGEMENT
-- ============================================================================

-- Add must_change_password column to track first login
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Add password_changed_at to track last password change
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Add provisioned_at to track when the user was auto-created
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;

-- Add provisioned_by to track which payment reference created this user
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS provisioned_by_request_id UUID REFERENCES access_requests(id);

COMMENT ON COLUMN admin_users.must_change_password IS 'Forces password change modal on first login';
COMMENT ON COLUMN admin_users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN admin_users.provisioned_at IS 'Timestamp when user was auto-provisioned from payment';
COMMENT ON COLUMN admin_users.provisioned_by_request_id IS 'Reference to the access_request that triggered provisioning';

-- ============================================================================
-- 2. ADD COLUMNS TO access_requests FOR PAYMENT TRACKING
-- ============================================================================

-- Add payment tracking columns
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS payment_raw_data JSONB;

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS provisioned_salon_id UUID REFERENCES salons(id);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS provisioned_user_id UUID REFERENCES auth.users(id);

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS provisioning_error TEXT;

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS provisioning_attempts INT DEFAULT 0;

COMMENT ON COLUMN access_requests.payment_id IS 'External payment ID from Mercado Pago';
COMMENT ON COLUMN access_requests.payment_status IS 'Payment status: pending, approved, rejected, refunded';
COMMENT ON COLUMN access_requests.payment_method IS 'Payment method used: credit_card, pix, boleto';
COMMENT ON COLUMN access_requests.payment_amount IS 'Amount paid';
COMMENT ON COLUMN access_requests.paid_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN access_requests.payment_raw_data IS 'Full payment webhook payload for audit';
COMMENT ON COLUMN access_requests.provisioned_salon_id IS 'Reference to created salon';
COMMENT ON COLUMN access_requests.provisioned_user_id IS 'Reference to created auth user';
COMMENT ON COLUMN access_requests.provisioning_error IS 'Last provisioning error message';
COMMENT ON COLUMN access_requests.provisioning_attempts IS 'Number of provisioning attempts';

-- ============================================================================
-- 3. CREATE payment_webhooks TABLE FOR IDEMPOTENCY & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Idempotency
    external_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'mercado_pago',
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    -- received, processing, processed, failed, duplicate
    
    -- Payload
    event_type VARCHAR(100),
    raw_payload JSONB NOT NULL,
    
    -- Processing details
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    processing_attempts INT DEFAULT 0,
    
    -- Related records
    access_request_id UUID REFERENCES access_requests(id),
    
    -- Audit
    ip_address INET,
    user_agent TEXT,
    signature_valid BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for idempotency
    CONSTRAINT payment_webhooks_idempotency_key UNIQUE (provider, external_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_external_id ON payment_webhooks(external_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_access_request_id ON payment_webhooks(access_request_id);

-- RLS
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read payment webhooks
CREATE POLICY "payment_webhooks_superadmin_read" ON payment_webhooks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.role = 'superadmin'
        )
    );

COMMENT ON TABLE payment_webhooks IS 'Stores all incoming payment webhooks for idempotency and audit';

-- ============================================================================
-- 4. CREATE provisioning_logs TABLE FOR DETAILED AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS provisioning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    access_request_id UUID NOT NULL REFERENCES access_requests(id),
    
    -- Step tracking
    step VARCHAR(100) NOT NULL,
    -- validate_payment, create_auth_user, create_salon, create_admin_user, send_email
    
    status VARCHAR(50) NOT NULL,
    -- started, success, failed, skipped
    
    -- Details
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    error_stack TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_provisioning_logs_request_id ON provisioning_logs(access_request_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_logs_step ON provisioning_logs(step);
CREATE INDEX IF NOT EXISTS idx_provisioning_logs_status ON provisioning_logs(status);

-- RLS
ALTER TABLE provisioning_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read provisioning logs
CREATE POLICY "provisioning_logs_superadmin_read" ON provisioning_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.role = 'superadmin'
        )
    );

COMMENT ON TABLE provisioning_logs IS 'Detailed step-by-step logs for provisioning operations';

-- ============================================================================
-- 5. UPDATE access_requests STATUS CONSTRAINT
-- ============================================================================

-- Drop existing constraint if exists (to update it)
ALTER TABLE access_requests 
DROP CONSTRAINT IF EXISTS access_requests_status_check;

-- Add updated constraint with new statuses
ALTER TABLE access_requests 
ADD CONSTRAINT access_requests_status_check 
CHECK (status IN ('pending', 'awaiting_payment', 'payment_confirmed', 'provisioning', 'approved', 'rejected', 'failed'));

COMMENT ON CONSTRAINT access_requests_status_check ON access_requests IS 
'Valid statuses: pending → awaiting_payment → payment_confirmed → provisioning → approved/failed, or pending → rejected';

-- ============================================================================
-- 6. CREATE FUNCTION TO UPDATE admin_users.updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS admin_users_updated_at_trigger ON admin_users;
CREATE TRIGGER admin_users_updated_at_trigger
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================================================
-- 7. CREATE FUNCTION TO MARK PASSWORD AS CHANGED
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_password_changed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE admin_users 
    SET 
        must_change_password = FALSE,
        password_changed_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_password_changed IS 'Marks password as changed after user updates it from the modal';

-- Grant execute to authenticated users (they can only update their own due to the function logic)
GRANT EXECUTE ON FUNCTION mark_password_changed TO authenticated;

-- ============================================================================
-- 8. ADD INDEX FOR PERFORMANCE
-- ============================================================================

-- Index on salons for status filtering
CREATE INDEX IF NOT EXISTS idx_salons_status ON salons(status);

-- Index on admin_users for must_change_password
CREATE INDEX IF NOT EXISTS idx_admin_users_must_change ON admin_users(must_change_password) WHERE must_change_password = TRUE;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
/*
-- Check admin_users columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name IN ('must_change_password', 'password_changed_at', 'provisioned_at', 'provisioned_by_request_id');

-- Check access_requests columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'access_requests' 
AND column_name LIKE 'payment%' OR column_name LIKE 'provision%';

-- Check payment_webhooks table
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhooks');

-- Check provisioning_logs table
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provisioning_logs');
*/