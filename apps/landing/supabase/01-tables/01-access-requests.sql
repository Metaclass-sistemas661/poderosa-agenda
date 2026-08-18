-- ============================================
-- TABELA: access_requests (Solicitações de Acesso)
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Armazena todas as solicitações de acesso feitas através do
--   formulário de cadastro na landing page (/cadastro).
--   Quando um salão deseja usar o sistema, ele preenche o formulário
--   e os dados são salvos aqui com status "pending".
--
-- 🔄 FLUXO:
--   1. Cliente preenche formulário → INSERT com status 'pending'
--   2. Admin vê no painel → SELECT WHERE status = 'pending'
--   3. Admin aprova/rejeita → UPDATE status = 'approved' ou 'rejected'
--
-- 📊 CAMPOS:
--   id            → Identificador único (UUID auto-gerado)
--   salon_name    → Nome do salão de beleza
--   owner_name    → Nome do proprietário/responsável
--   email         → Email de contato
--   phone         → Telefone/WhatsApp
--   city          → Cidade do salão
--   state         → Estado (sigla UF - 2 caracteres)
--   professionals → Quantidade de profissionais (faixa)
--   message       → Mensagem opcional do cliente
--   status        → Status: pending | approved | rejected
--   created_at    → Data/hora da solicitação
--   updated_at    → Data/hora da última atualização
--
-- 🔒 SEGURANÇA:
--   - INSERT: Público (qualquer pessoa pode solicitar)
--   - SELECT: Apenas usuários autenticados (admins)
--   - UPDATE: Apenas usuários autenticados (admins)
--   - DELETE: Não permitido (histórico)
--
-- ============================================

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados do salão
  salon_name VARCHAR(255) NOT NULL,
  
  -- Dados do proprietário
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Localização
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  
  -- Informações adicionais
  professionals VARCHAR(20) NOT NULL,
  message TEXT,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentário na tabela para documentação no banco
COMMENT ON TABLE access_requests IS 'Solicitações de acesso ao sistema feitas via formulário de cadastro';
COMMENT ON COLUMN access_requests.status IS 'pending = aguardando, approved = aprovado, rejected = rejeitado';
COMMENT ON COLUMN access_requests.professionals IS 'Faixa de profissionais: 1, 2-3, 4-5, 6-10, 10+';