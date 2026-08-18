-- ============================================
-- MIGRATION: Adicionar campos CPF/CNPJ e Telefone
-- ============================================

-- Adicionar campos na tabela admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Adicionar campos na tabela salons
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(4) DEFAULT 'cpf' CHECK (document_type IN ('cpf', 'cnpj')),
ADD COLUMN IF NOT EXISTS document VARCHAR(18) UNIQUE;

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_users_cpf ON admin_users(cpf);
CREATE INDEX IF NOT EXISTS idx_salons_document ON salons(document);

-- Comentários
COMMENT ON COLUMN admin_users.cpf IS 'CPF do usuário (formato: 000.000.000-00)';
COMMENT ON COLUMN admin_users.phone IS 'Telefone do usuário';
COMMENT ON COLUMN salons.document_type IS 'Tipo de documento: cpf ou cnpj';
COMMENT ON COLUMN salons.document IS 'CPF ou CNPJ do salão';