-- ============================================
-- TABELA: professionals (Profissionais/Equipe)
-- ============================================

CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  photo_url TEXT,
  
  -- Profissional
  role VARCHAR(100), -- Cabeleireiro, Manicure, Barbeiro, etc.
  specialty TEXT[], -- Array de especialidades
  bio TEXT,
  
  -- Configurações
  commission_rate DECIMAL(5,2) DEFAULT 0, -- % de comissão (ex: 40.00)
  working_days JSONB DEFAULT '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}',
  working_hours JSONB DEFAULT '{"start":"09:00","end":"18:00"}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vacation')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professionals_salon_id ON professionals(salon_id);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);

-- Comentários
COMMENT ON TABLE professionals IS 'Profissionais/colaboradores de cada salão';
COMMENT ON COLUMN professionals.commission_rate IS 'Percentual de comissão sobre serviços (0-100)';
COMMENT ON COLUMN professionals.working_days IS 'JSON com dias da semana que trabalha';
COMMENT ON COLUMN professionals.working_hours IS 'JSON com horário de início e fim';

-- RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "Superadmins can manage all professionals"
ON professionals FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'superadmin'
  )
);

-- Admin de salão vê apenas seus profissionais
CREATE POLICY "Salon admins can view own professionals"
ON professionals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.salon_id = professionals.salon_id
  )
);

CREATE POLICY "Salon admins can insert own professionals"
ON professionals FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.salon_id = professionals.salon_id
  )
);

CREATE POLICY "Salon admins can update own professionals"
ON professionals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.salon_id = professionals.salon_id
  )
);

CREATE POLICY "Salon admins can delete own professionals"
ON professionals FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.salon_id = professionals.salon_id
  )
);