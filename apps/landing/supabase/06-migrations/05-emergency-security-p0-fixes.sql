-- ============================================
-- EMERGENCY SECURITY MIGRATION: P0 FIXES
-- ============================================
-- Date: 2026-08-17
-- Findings: TEN-001, TEN-002, TEN-003, TEN-004
-- Purpose: Eliminate critical cross-tenant vulnerabilities
-- ============================================

-- ============================================================================
-- TEN-001: FIX salons RLS - Users can only see their own salon
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em salons" ON salons;

-- SELECT: User can only see salon they belong to, superadmin can see all
CREATE POLICY "salons_select_own"
  ON salons
  FOR SELECT
  TO authenticated
  USING (
    is_superadmin()
    OR id = get_user_salon_id()
  );

-- INSERT: Only superadmin can create new salons
CREATE POLICY "salons_insert_superadmin_only"
  ON salons
  FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- UPDATE: User can update own salon, superadmin can update all
CREATE POLICY "salons_update_own"
  ON salons
  FOR UPDATE
  TO authenticated
  USING (
    is_superadmin()
    OR id = get_user_salon_id()
  )
  WITH CHECK (
    is_superadmin()
    OR id = get_user_salon_id()
  );

-- DELETE: Only superadmin can delete salons
CREATE POLICY "salons_delete_superadmin_only"
  ON salons
  FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================================
-- TEN-002: FIX admin_users RLS - Users can only see their own record
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em admin_users" ON admin_users;

-- SELECT: User can only see their own record, superadmin can see all
CREATE POLICY "admin_users_select_own"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    is_superadmin()
    OR user_id = auth.uid()
  );

-- INSERT: Only superadmin can create new admin users
CREATE POLICY "admin_users_insert_superadmin_only"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- UPDATE: User can update ONLY limited fields of their own record (handled by trigger)
-- Superadmin can update all
CREATE POLICY "admin_users_update_own"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    is_superadmin()
    OR user_id = auth.uid()
  )
  WITH CHECK (
    is_superadmin()
    OR user_id = auth.uid()
  );

-- DELETE: Only superadmin can delete admin users
CREATE POLICY "admin_users_delete_superadmin_only"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================================
-- TEN-003: TRIGGER to prevent role escalation (non-superadmin cannot change role)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Superadmin can change any role
  IF is_superadmin() THEN
    RETURN NEW;
  END IF;
  
  -- Non-superadmin cannot change their own role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Acesso negado: você não pode alterar sua própria role. Apenas superadmin pode fazer isso.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON admin_users;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

COMMENT ON FUNCTION prevent_role_escalation() IS 'TEN-003: Prevents non-superadmin from changing their role';

-- ============================================================================
-- TEN-004: TRIGGER to prevent salon_id change (tenant hopping)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_admin_user_salon_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Superadmin can change salon_id
  IF is_superadmin() THEN
    RETURN NEW;
  END IF;
  
  -- Non-superadmin cannot change salon_id
  IF OLD.salon_id IS DISTINCT FROM NEW.salon_id THEN
    RAISE EXCEPTION 'Acesso negado: você não pode alterar seu salon_id. Apenas superadmin pode fazer isso.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_admin_user_salon_id_change_trigger ON admin_users;
CREATE TRIGGER prevent_admin_user_salon_id_change_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_user_salon_id_change();

COMMENT ON FUNCTION prevent_admin_user_salon_id_change() IS 'TEN-004: Prevents non-superadmin from changing their salon_id (tenant hopping)';

-- ============================================================================
-- Add missing indexes for admin_users (DB-001)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_salon_id ON admin_users(salon_id);

-- ============================================================================
-- AUDIT LOG: Record security-related changes to admin_users
-- ============================================================================

DROP TRIGGER IF EXISTS audit_admin_users ON admin_users;
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- VERIFICATION: These policies should now block cross-tenant access
-- ============================================================================
-- 
-- Test 1: User from Salon A cannot SELECT from salons WHERE id = Salon B
-- Test 2: User from Salon A cannot UPDATE salons SET ... WHERE id = Salon B
-- Test 3: User from Salon A cannot SELECT * FROM admin_users (only their own record)
-- Test 4: User cannot UPDATE admin_users SET role = 'superadmin' WHERE user_id = own_id
-- Test 5: User cannot UPDATE admin_users SET salon_id = another_salon WHERE user_id = own_id
-- 
-- Expected: All above operations should be DENIED by RLS or triggers
-- ============================================================================