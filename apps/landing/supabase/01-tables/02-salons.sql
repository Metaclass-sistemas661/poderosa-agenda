-- ============================================
-- TABELA: salons (Salões de Beleza)
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Armazena todos os salões de beleza cadastrados no sistema.
--   Um registro é criado quando o admin aprova uma solicitação
--   ou quando cria manualmente pelo painel.
--
-- 🔄 FLUXO:
--   1. Admin aprova solicitação → cria registro aqui
--   2. Sistema gera credenciais → salão pode acessar dashboard
--   3. Admin gerencia → ativa/desativa/suspende
--
-- 📊 CAMPOS:
--   id                  → Identificador único (UUID)
--   name                → Nome do salão
--   cnpj                → CNPJ (opcional)
--   owner_name          → Nome do proprietário
--   owner_cpf           → CPF do proprietário (opcional)
--   email               → Email principal (login do salão)
--   phone               → Telefone/WhatsApp
--   address             → Endereço completo (opcional)
--   city                → Cidade
--   state               → Estado (UF)
--   plan                → Plano: basic | pro | enterprise
--   professionals_count → Quantidade de profissionais
--   status              → Status: active | inactive | suspended
--   created_at          → Data de criação
--   updated_at          → Data da última atualização
--
-- 🔒 SEGURANÇA:
--   - Todas operações: Apenas usuários autenticados
--
-- ============================================

CREATE TABLE IF NOT EXISTS salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados do salão
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  
  -- Dados do proprietário
  owner_name VARCHAR(255) NOT NULL,
  owner_cpf VARCHAR(14),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  
  -- Endereço
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  
  -- Configurações
  plan VARCHAR(20) DEFAULT 'basic' 
    CHECK (plan IN ('basic', 'pro', 'enterprise')),
  professionals_count VARCHAR(20) NOT NULL,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentação
COMMENT ON TABLE salons IS 'Salões de beleza cadastrados e ativos no sistema';
COMMENT ON COLUMN salons.plan IS 'basic = Básico, pro = Profissional, enterprise = Empresarial';
COMMENT ON COLUMN salons.status IS 'active = Ativo, inactive = Inativo, suspended = Suspenso';
COMMENT ON COLUMN salons.email IS 'Email único usado para login do salão no sistema';