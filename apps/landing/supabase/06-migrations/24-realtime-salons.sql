-- ==============================================================================
-- MIGRATION: 24-realtime-salons.sql
-- DESCRIPTION: Enable Realtime for the 'salons' table to allow instant blocking
-- ==============================================================================

-- Add 'salons' table to the 'supabase_realtime' publication if not already present
-- We use a DO block to prevent errors if the table is already in the publication

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'salons'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;
    END IF;
END
$$;
