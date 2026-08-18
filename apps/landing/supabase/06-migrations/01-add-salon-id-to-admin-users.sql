-- ============================================
-- MIGRATION: Adicionar salon_id em admin_users
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Adiciona a coluna salon_id para vincular usuários admin
--   a salões específicos (opcional - superadmins não precisam)
--
-- ============================================

-- Adicionar coluna salon_id
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE SET NULL;

-- Documentação
COMMENT ON COLUMN admin_users.salon_id IS 'Salão ao qual este usuário pertence (opcional para superadmins)';

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_users_salon_id ON admin_users(salon_id);