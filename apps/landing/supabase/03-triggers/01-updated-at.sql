-- ============================================
-- TRIGGERS: Atualização automática de updated_at
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Cria uma função e triggers que atualizam automaticamente
--   o campo "updated_at" toda vez que um registro é modificado.
--   Isso garante que sempre sabemos quando foi a última alteração.
--
-- 🔧 COMO FUNCIONA:
--   1. Função update_updated_at_column() é criada
--   2. Trigger é adicionado em cada tabela (BEFORE UPDATE)
--   3. Quando qualquer UPDATE acontece, updated_at = NOW()
--
-- ============================================

-- Função reutilizável para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger na tabela access_requests
DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at
    BEFORE UPDATE ON access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger na tabela salons
DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON salons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger na tabela admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
