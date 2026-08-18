-- ============================================
-- EMERGENCY FIX: Remove duplicate/conflicting policies
-- ============================================
-- Date: 2026-08-17
-- Issue: Old permissive policies still exist alongside new restrictive ones
-- Impact: TEN-001 and TEN-002 NOT ACTUALLY FIXED due to policy conflict
-- ============================================

-- ============================================================================
-- FIX admin_users: Remove old permissive policy
-- ============================================================================

-- The old policy with different name was not dropped
DROP POLICY IF EXISTS "admin_users_all_authenticated" ON admin_users;
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em admin_users" ON admin_users;

-- ============================================================================
-- FIX salons: Remove old permissive policy (verify if exists with different name)
-- ============================================================================

DROP POLICY IF EXISTS "salons_all_authenticated" ON salons;
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em salons" ON salons;

-- ============================================================================
-- VERIFICATION: Ensure only new restrictive policies exist
-- ============================================================================
-- After running this, the only policies on admin_users should be:
--   - admin_users_select_own
--   - admin_users_update_own
--   - admin_users_insert_superadmin_only
--   - admin_users_delete_superadmin_only
--
-- And on salons:
--   - salons_select_own
--   - salons_update_own
--   - salons_insert_superadmin_only
--   - salons_delete_superadmin_only
-- ============================================================================