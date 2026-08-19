-- ==============================================================================
-- MIGRATION: 18-system-audit-logs.sql
-- DESCRIPTION: System-wide audit log table for tracing provisioning events, 
--              rejections, and sensitive administrative actions.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES auth.users(id), -- User who performed the action
    action VARCHAR(255) NOT NULL,                     -- e.g., 'TENANT_PROVISIONED', 'REQUEST_REJECTED'
    target_id UUID,                                   -- The ID of the affected resource (access_request, salon_id)
    details JSONB DEFAULT '{}'::jsonb,                -- Context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying by Super Admins
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.system_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.system_audit_logs(target_id);

-- Enable RLS
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Security Definer Hardening: Only superadmins (or service_role via bypass) can read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_audit_logs' AND policyname = 'Superadmins can view audit logs'
    ) THEN
        CREATE POLICY "Superadmins can view audit logs"
        ON public.system_audit_logs
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE user_id = auth.uid() AND role = 'superadmin'
            )
        );
    END IF;
END $$;
