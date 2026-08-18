-- ============================================
-- FUNÇÕES DE SEGURANÇA E MULTI-TENANCY
-- ============================================

-- ============================================================================
-- FUNÇÃO: Obter salon_id do usuário autenticado
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_salon_id()
RETURNS UUID AS $$
DECLARE
  v_salon_id UUID;
BEGIN
  SELECT salon_id INTO v_salon_id
  FROM admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_salon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_salon_id() IS 'Retorna o salon_id do usuário autenticado';

-- ============================================================================
-- FUNÇÃO: Verificar se usuário é superadmin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_superadmin() IS 'Verifica se o usuário autenticado é superadmin';

-- ============================================================================
-- FUNÇÃO: Verificar se usuário pertence ao salão
-- ============================================================================

CREATE OR REPLACE FUNCTION user_belongs_to_salon(p_salon_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superadmin tem acesso a todos os salões
  IF is_superadmin() THEN
    RETURN TRUE;
  END IF;
  
  -- Verifica se o usuário pertence ao salão específico
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND salon_id = p_salon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_belongs_to_salon(UUID) IS 'Verifica se o usuário tem acesso ao salão especificado';

-- ============================================================================
-- FUNÇÃO: Obter role do usuário
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS 'Retorna a role do usuário autenticado';

-- ============================================================================
-- TRIGGER: Validar salon_id no INSERT
-- Garante que usuário só pode inserir dados no próprio salão
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_salon_id_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_user_salon_id UUID;
BEGIN
  -- Superadmin pode inserir em qualquer salão
  IF is_superadmin() THEN
    RETURN NEW;
  END IF;
  
  -- Obter salon_id do usuário
  v_user_salon_id := get_user_salon_id();
  
  -- Validar se o salon_id do novo registro corresponde ao do usuário
  IF NEW.salon_id IS NULL THEN
    NEW.salon_id := v_user_salon_id;
  ELSIF NEW.salon_id != v_user_salon_id THEN
    RAISE EXCEPTION 'Acesso negado: você não pode inserir dados em outro salão';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em todas as tabelas multi-tenant
DO $$
DECLARE
  tables TEXT[] := ARRAY['professionals', 'services', 'clients', 'appointments', 'transactions', 'products', 'salon_settings'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS validate_salon_id_%I ON %I;
      CREATE TRIGGER validate_salon_id_%I
        BEFORE INSERT ON %I
        FOR EACH ROW
        EXECUTE FUNCTION validate_salon_id_on_insert();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================================
-- TRIGGER: Prevenir alteração de salon_id no UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_salon_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.salon_id != NEW.salon_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o salon_id de um registro';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de prevenção de mudança de salon_id
DO $$
DECLARE
  tables TEXT[] := ARRAY['professionals', 'services', 'clients', 'appointments', 'transactions', 'products'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS prevent_salon_id_change_%I ON %I;
      CREATE TRIGGER prevent_salon_id_change_%I
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION prevent_salon_id_change();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================================
-- FUNÇÃO: Auditoria de acesso a dados
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  salon_id UUID,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_salon_id ON audit_log(salon_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- RLS para audit_log (apenas superadmin pode ver)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only superadmins can view audit_log" ON audit_log;
CREATE POLICY "Only superadmins can view audit_log"
ON audit_log FOR SELECT
TO authenticated
USING (is_superadmin());

DROP POLICY IF EXISTS "System can insert audit_log" ON audit_log;
CREATE POLICY "System can insert audit_log"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- ============================================================================
-- FUNÇÃO: Log de auditoria genérico
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_table_name TEXT,
  p_action TEXT,
  p_record_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (user_id, salon_id, table_name, action, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    get_user_salon_id(),
    p_table_name,
    p_action,
    p_record_id,
    p_old_data,
    p_new_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auditoria automática para tabelas sensíveis
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(TG_TABLE_NAME, 'DELETE', OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(TG_TABLE_NAME, 'INSERT', NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria em tabelas sensíveis (transações financeiras)
DROP TRIGGER IF EXISTS audit_transactions ON transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- VIEWS SEGURAS: Garantir isolamento de dados
-- ============================================================================

-- View de agendamentos do salão atual
CREATE OR REPLACE VIEW v_my_appointments AS
SELECT a.*, 
       p.name as professional_name,
       c.name as client_name_full,
       s.name as service_name_full
FROM appointments a
LEFT JOIN professionals p ON a.professional_id = p.id
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN services s ON a.service_id = s.id
WHERE a.salon_id = get_user_salon_id()
   OR is_superadmin();

-- View de clientes do salão atual
CREATE OR REPLACE VIEW v_my_clients AS
SELECT * FROM clients
WHERE salon_id = get_user_salon_id()
   OR is_superadmin();

-- View de profissionais do salão atual
CREATE OR REPLACE VIEW v_my_professionals AS
SELECT * FROM professionals
WHERE salon_id = get_user_salon_id()
   OR is_superadmin();

-- View de serviços do salão atual
CREATE OR REPLACE VIEW v_my_services AS
SELECT * FROM services
WHERE salon_id = get_user_salon_id()
   OR is_superadmin();

-- View de produtos do salão atual
CREATE OR REPLACE VIEW v_my_products AS
SELECT * FROM products
WHERE salon_id = get_user_salon_id()
   OR is_superadmin();

-- View de transações do salão atual
CREATE OR REPLACE VIEW v_my_transactions AS
SELECT * FROM transactions
WHERE salon_id = get_user_salon_id()
   OR is_superadmin();

-- ============================================================================
-- FUNÇÃO: Estatísticas do salão (segura)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_salon_stats(p_salon_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_clients BIGINT,
  total_professionals BIGINT,
  total_services BIGINT,
  total_appointments_today BIGINT,
  total_revenue_month NUMERIC,
  total_appointments_month BIGINT
) AS $$
DECLARE
  v_salon_id UUID;
BEGIN
  -- Determinar salon_id
  IF p_salon_id IS NOT NULL AND is_superadmin() THEN
    v_salon_id := p_salon_id;
  ELSE
    v_salon_id := get_user_salon_id();
  END IF;
  
  -- Retornar estatísticas
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM clients WHERE salon_id = v_salon_id AND status = 'active'),
    (SELECT COUNT(*) FROM professionals WHERE salon_id = v_salon_id AND status = 'active'),
    (SELECT COUNT(*) FROM services WHERE salon_id = v_salon_id AND is_active = true),
    (SELECT COUNT(*) FROM appointments WHERE salon_id = v_salon_id AND scheduled_date = CURRENT_DATE),
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE salon_id = v_salon_id AND type = 'income' AND date >= date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*) FROM appointments WHERE salon_id = v_salon_id AND scheduled_date >= date_trunc('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- GRANT: Permissões explícitas
-- ============================================================================

-- Revogar acesso público
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Garantir que apenas usuários autenticados podem acessar
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- CONSTRAINT: Garantir integridade referencial com salon_id
-- ============================================================================

-- Verificar se appointments referencia dados do mesmo salão
CREATE OR REPLACE FUNCTION check_appointment_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se professional pertence ao mesmo salão
  IF NEW.professional_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM professionals WHERE id = NEW.professional_id AND salon_id = NEW.salon_id) THEN
      RAISE EXCEPTION 'Profissional não pertence a este salão';
    END IF;
  END IF;
  
  -- Verificar se client pertence ao mesmo salão
  IF NEW.client_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM clients WHERE id = NEW.client_id AND salon_id = NEW.salon_id) THEN
      RAISE EXCEPTION 'Cliente não pertence a este salão';
    END IF;
  END IF;
  
  -- Verificar se service pertence ao mesmo salão
  IF NEW.service_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = NEW.service_id AND salon_id = NEW.salon_id) THEN
      RAISE EXCEPTION 'Serviço não pertence a este salão';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_appointment_integrity ON appointments;
CREATE TRIGGER check_appointment_integrity
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_integrity();

-- Verificar integridade de transactions
CREATE OR REPLACE FUNCTION check_transaction_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se appointment pertence ao mesmo salão
  IF NEW.appointment_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = NEW.appointment_id AND salon_id = NEW.salon_id) THEN
      RAISE EXCEPTION 'Agendamento não pertence a este salão';
    END IF;
  END IF;
  
  -- Verificar se professional pertence ao mesmo salão
  IF NEW.professional_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM professionals WHERE id = NEW.professional_id AND salon_id = NEW.salon_id) THEN
      RAISE EXCEPTION 'Profissional não pertence a este salão';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_transaction_integrity ON transactions;
CREATE TRIGGER check_transaction_integrity
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_transaction_integrity();

-- ============================================================================
-- ÍNDICES DE PERFORMANCE PARA QUERIES MULTI-TENANT
-- ============================================================================

-- Índices compostos para melhor performance em queries filtradas por salon_id
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON appointments(salon_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_professional ON appointments(salon_id, professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_status ON appointments(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_salon_status ON clients(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_services_salon_active ON services(salon_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_salon_date ON transactions(salon_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_salon_type ON transactions(salon_id, type);
CREATE INDEX IF NOT EXISTS idx_products_salon_status ON products(salon_id, status);

COMMENT ON INDEX idx_appointments_salon_date IS 'Índice otimizado para busca de agendamentos por salão e data';