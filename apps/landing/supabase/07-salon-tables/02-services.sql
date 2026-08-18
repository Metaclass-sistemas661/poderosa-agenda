-- ============================================
-- TABELA: services (Serviços)
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do serviço
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Cabelo, Unha, Estética, Barba, etc.
  photo_url TEXT,
  
  -- Valores
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- minutos
  commission_rate DECIMAL(5,2), -- % específica para este serviço
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- para ordenação customizada
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Comentários
COMMENT ON TABLE services IS 'Serviços oferecidos por cada salão';
COMMENT ON COLUMN services.duration IS 'Duração do serviço em minutos';
COMMENT ON COLUMN services.commission_rate IS 'Comissão específica deste serviço';

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all services" ON services FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own services" ON services FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = services.salon_id));

CREATE POLICY "Salon admins can insert own services" ON services FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = services.salon_id));

CREATE POLICY "Salon admins can update own services" ON services FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = services.salon_id));

CREATE POLICY "Salon admins can delete own services" ON services FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = services.salon_id));