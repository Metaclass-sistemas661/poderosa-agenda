-- ============================================
-- TABELA: admin_users (Usuários Administradores)
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Armazena os usuários que têm acesso ao painel SuperAdmin.
--   Vinculado à tabela auth.users do Supabase Auth.
--
-- 🔄 FLUXO:
--   1. SuperAdmin cria usuário no Supabase Auth
--   2. Registro é criado aqui com role e permissões
--   3. No login, sistema verifica role para direcionar
--
-- 📊 CAMPOS:
--   id          → Identificador único (UUID)
--   user_id     → FK para auth.users (Supabase Auth)
--   name        → Nome do administrador
--   email       → Email (mesmo do auth)
--   role        → Nível: superadmin | admin | manager | support | viewer
--   permissions → JSON com permissões específicas
--   created_at  → Data de criação
--   updated_at  → Data da última atualização
--
-- 🔐 ROLES:
--   superadmin → Acesso total, pode tudo
--   admin      → Acesso total exceto configurações do sistema
--   manager    → Gerenciar salões e usuários
--   support    → Visualizar e ajudar clientes
--   viewer     → Apenas visualização (somente leitura)
--
-- 🔒 SEGURANÇA:
--   - Todas operações: Apenas usuários autenticados
--
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Vínculo com Supabase Auth
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- Permissões
  role VARCHAR(20) DEFAULT 'viewer' 
    CHECK (role IN ('superadmin', 'admin', 'manager', 'support', 'viewer')),
  permissions JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentação
COMMENT ON TABLE admin_users IS 'Usuários administradores do painel SuperAdmin';
COMMENT ON COLUMN admin_users.user_id IS 'FK para auth.users - vínculo com autenticação Supabase';
COMMENT ON COLUMN admin_users.role IS 'superadmin=total, admin=quase total, manager=gerente, support=suporte, viewer=leitura';
COMMENT ON COLUMN admin_users.permissions IS 'JSON com permissões granulares: {"approve_requests": true, "delete_salons": false}';