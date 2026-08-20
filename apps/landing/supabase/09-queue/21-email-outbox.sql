-- Migration: 21-email-outbox.sql
-- Description: Creates the email_outbox table for the Outbox Pattern

-- 1. Create Enum for Email Status
DO $$ BEGIN
    CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Outbox Table
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status email_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create updated_at function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS handle_email_outbox_updated_at ON public.email_outbox;
CREATE TRIGGER handle_email_outbox_updated_at
    BEFORE UPDATE ON public.email_outbox
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable RLS
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Service Role only needs to access it, so we don't expose it to authenticated users for now)
-- The Server Actions and Webhooks will use the service_role key to insert emails into this table.
-- The Cron API route will also use the service_role key to select/update them.
-- Therefore, we don't need any public or authenticated policies for this internal queue.
