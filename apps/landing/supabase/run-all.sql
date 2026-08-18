-- ============================================
-- BEAUTYSAAS - EXECUÇÃO COMPLETA DO SCHEMA
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Script unificado que executa todos os arquivos SQL na ordem correta.
--   Use este arquivo para configurar o banco do zero no Supabase SQL Editor.
--
-- 🚀 COMO USAR:
--   Copie e cole TODO o conteúdo deste arquivo no Supabase SQL Editor
--   e execute de uma vez.
--
-- ⚠️  ATENÇÃO:
--   - Execute apenas em bancos NOVOS ou de desenvolvimento
--   - Em produção, execute cada arquivo individualmente
--   - O seed do superadmin está comentado (requer user_id do Auth)
--
-- ============================================

-- ============================================
-- 00 - SETUP: Extensões
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 01 - TABLES: Criação das tabelas
-- ============================================

-- 01-access-requests
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  professionals VARCHAR(20) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 02-salons
CREATE TABLE IF NOT EXISTS salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  owner_cpf VARCHAR(14),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  professionals_count VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 03-admin-users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('superadmin', 'admin', 'manager', 'support', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 02 - INDEXES: Índices de performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_salons_status ON salons(status);
CREATE INDEX IF NOT EXISTS idx_salons_email ON salons(email);
CREATE INDEX IF NOT EXISTS idx_salons_plan ON salons(plan);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- ============================================
-- 03 - TRIGGERS: Atualização automática de updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at
    BEFORE UPDATE ON access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON salons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 04 - POLICIES: Row Level Security
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para access_requests
DROP POLICY IF EXISTS "access_requests_insert_public" ON access_requests;
CREATE POLICY "access_requests_insert_public"
    ON access_requests FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "access_requests_select_authenticated" ON access_requests;
CREATE POLICY "access_requests_select_authenticated"
    ON access_requests FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "access_requests_update_authenticated" ON access_requests;
CREATE POLICY "access_requests_update_authenticated"
    ON access_requests FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "access_requests_delete_authenticated" ON access_requests;
CREATE POLICY "access_requests_delete_authenticated"
    ON access_requests FOR DELETE
    USING (auth.role() = 'authenticated');

-- Políticas para salons
DROP POLICY IF EXISTS "salons_all_authenticated" ON salons;
CREATE POLICY "salons_all_authenticated"
    ON salons FOR ALL
    USING (auth.role() = 'authenticated');

-- Políticas para admin_users
DROP POLICY IF EXISTS "admin_users_all_authenticated" ON admin_users;
CREATE POLICY "admin_users_all_authenticated"
    ON admin_users FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- 05 - SEEDS: Dados iniciais
-- ============================================

-- ⚠️  SUPERADMIN: Descomente após criar o usuário no Auth
-- 1. Vá em Supabase > Authentication > Users
-- 2. Crie um usuário com email: admin@beautysaas.com
-- 3. Copie o UUID e substitua abaixo

-- INSERT INTO admin_users (user_id, name, email, role, permissions)
-- VALUES (
--   'SEU_USER_ID_AQUI',
--   'Admin',
--   'admin@beautysaas.com',
--   'superadmin',
--   '{"all": true, "approve_requests": true, "create_salons": true, "delete_salons": true, "manage_users": true, "system_settings": true}'
-- );

-- ============================================
-- ✅ SCHEMA COMPLETO! 
-- Próximo passo: Criar o SuperAdmin no Auth
-- ============================================