-- ============================================
-- RLS POLICIES: admin_users
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Row Level Security para a tabela admin_users.
--   Apenas usuários autenticados (admins) podem
--   realizar qualquer operação.
--
-- ============================================

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ALL: Apenas admins autenticados podem fazer tudo
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em admin_users" ON admin_users;
CREATE POLICY "Permitir todas operações para autenticados em admin_users" 
  ON admin_users
  FOR ALL 
  USING (auth.role() = 'authenticated');
