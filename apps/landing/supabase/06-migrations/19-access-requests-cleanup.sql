-- ==============================================================================
-- CLEANUP: Remove duplicate functions first
-- Run this BEFORE the main migration
-- ==============================================================================

-- Drop all versions of submit_access_request
DROP FUNCTION IF EXISTS public.submit_access_request(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, CHAR, VARCHAR, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.submit_access_request(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.submit_access_request(character varying, character varying, character varying, character varying, character varying, character, character varying, text, character varying);
DROP FUNCTION IF EXISTS public.submit_access_request(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, character varying);

-- Drop rate limit helper too
DROP FUNCTION IF EXISTS public.check_access_request_rate_limit(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.check_access_request_rate_limit(character varying, character varying);

-- Verify cleanup
DO $$
BEGIN
    RAISE NOTICE 'Cleanup completed. Old functions dropped.';
END $$;