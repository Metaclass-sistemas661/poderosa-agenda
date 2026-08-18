-- ============================================
-- PHASE 0 VERIFICATION TESTS
-- ============================================
-- Execute these tests in Supabase SQL Editor
-- Replace placeholder UUIDs with actual values from your database
-- ============================================

-- ============================================
-- SETUP: Get test data (run first to identify test values)
-- ============================================

-- List all salons to identify Tenant A and Tenant B
SELECT id, name, email FROM salons LIMIT 10;

-- List all admin_users to identify test users
SELECT id, user_id, salon_id, role, email FROM admin_users LIMIT 10;

-- ============================================
-- TEST SETUP INSTRUCTIONS
-- ============================================
-- 1. Identify a non-superadmin user (Tenant A) - note their user_id
-- 2. Identify another salon (Tenant B) - note the salon id
-- 3. In Supabase Dashboard, use "Impersonate User" feature with Tenant A's user_id
-- 4. Or use the test queries below with SET LOCAL role commands

-- ============================================
-- TEST-001: Tenant A SELECT salons (cross-tenant)
-- Expected: Only 1 row (own salon)
-- ============================================
-- As Tenant A user, run:
-- SELECT * FROM salons;
-- Result should be 1 row with only their salon

-- ============================================
-- TEST-002: Tenant A UPDATE other salon
-- Expected: 0 rows updated (DENIED)
-- ============================================
-- As Tenant A user, run:
-- UPDATE salons SET name = 'Hacked' WHERE id = '<TENANT_B_SALON_ID>';
-- Result should be: 0 rows affected

-- ============================================
-- TEST-003: Tenant A DELETE other salon
-- Expected: 0 rows deleted (DENIED)
-- ============================================
-- As Tenant A user, run:
-- DELETE FROM salons WHERE id = '<TENANT_B_SALON_ID>';
-- Result should be: 0 rows affected

-- ============================================
-- TEST-004: Tenant A SELECT all admin_users
-- Expected: Only 1 row (own record)
-- ============================================
-- As Tenant A user, run:
-- SELECT * FROM admin_users;
-- Result should be 1 row with only their own admin_user record

-- ============================================
-- TEST-005: Tenant A UPDATE other admin_user
-- Expected: 0 rows updated (DENIED)
-- ============================================
-- As Tenant A user, run:
-- UPDATE admin_users SET role = 'viewer' WHERE id = '<OTHER_ADMIN_USER_ID>';
-- Result should be: 0 rows affected

-- ============================================
-- TEST-006: Tenant A DELETE other admin_user
-- Expected: 0 rows deleted (DENIED)
-- ============================================
-- As Tenant A user, run:
-- DELETE FROM admin_users WHERE id = '<OTHER_ADMIN_USER_ID>';
-- Result should be: 0 rows affected

-- ============================================
-- TEST-007: User UPDATE own role to superadmin
-- Expected: EXCEPTION raised
-- ============================================
-- As non-superadmin user, run:
-- UPDATE admin_users SET role = 'superadmin' WHERE user_id = auth.uid();
-- Expected error: "Acesso negado: você não pode alterar sua própria role"

-- ============================================
-- TEST-008: User UPDATE own role to admin
-- Expected: EXCEPTION raised
-- ============================================
-- As non-superadmin user (who is NOT admin), run:
-- UPDATE admin_users SET role = 'admin' WHERE user_id = auth.uid();
-- Expected error: "Acesso negado: você não pode alterar sua própria role"

-- ============================================
-- TEST-009: User UPDATE own salon_id
-- Expected: EXCEPTION raised
-- ============================================
-- As non-superadmin user, run:
-- UPDATE admin_users SET salon_id = '<ANOTHER_SALON_ID>' WHERE user_id = auth.uid();
-- Expected error: "Acesso negado: você não pode alterar seu salon_id"

-- ============================================
-- TEST-010: User UPDATE salon_id to NULL
-- Expected: EXCEPTION raised
-- ============================================
-- As non-superadmin user, run:
-- UPDATE admin_users SET salon_id = NULL WHERE user_id = auth.uid();
-- Expected error: "Acesso negado: você não pode alterar seu salon_id"

-- ============================================
-- TEST-011: Superadmin SELECT all salons
-- Expected: ALL rows returned
-- ============================================
-- As superadmin user, run:
-- SELECT * FROM salons;
-- Result should show ALL salons in the database

-- ============================================
-- TEST-012: Superadmin UPDATE salon
-- Expected: SUCCESS
-- ============================================
-- As superadmin user, run:
-- UPDATE salons SET updated_at = NOW() WHERE id = '<ANY_SALON_ID>';
-- Result should be: 1 row affected

-- ============================================
-- TEST-013: Legitimate user access own data
-- Expected: SUCCESS
-- ============================================
-- As Tenant A user, run:
-- SELECT * FROM salons WHERE id = get_user_salon_id();
-- Result should be: 1 row with their salon data

-- As Tenant A user, run:
-- SELECT * FROM admin_users WHERE user_id = auth.uid();
-- Result should be: 1 row with their admin_user record

-- ============================================
-- TEST-014: Anonymous SELECT salons
-- Expected: DENIED (empty result or error)
-- ============================================
-- Without authentication (anon role), run:
-- SELECT * FROM salons;
-- Result should be: 0 rows or permission denied

-- ============================================
-- TEST-015: Anonymous SELECT admin_users
-- Expected: DENIED (empty result or error)
-- ============================================
-- Without authentication (anon role), run:
-- SELECT * FROM admin_users;
-- Result should be: 0 rows or permission denied

-- ============================================
-- VERIFICATION HELPER QUERIES
-- Run as superadmin to check policy configuration
-- ============================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('salons', 'admin_users');

-- Check policies on salons
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'salons';

-- Check policies on admin_users
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Check triggers on admin_users
SELECT tgname, tgenabled, tgtype
FROM pg_trigger 
WHERE tgrelid = 'admin_users'::regclass;

-- Check indexes on admin_users
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'admin_users';

-- ============================================
-- QUICK VALIDATION (Run as superadmin)
-- ============================================

-- Verify functions exist
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('is_superadmin', 'get_user_salon_id', 'prevent_role_escalation', 'prevent_admin_user_salon_id_change');

-- Test is_superadmin function returns correct value
-- (This should return TRUE only for superadmin users)
SELECT is_superadmin();

-- Test get_user_salon_id function
SELECT get_user_salon_id();