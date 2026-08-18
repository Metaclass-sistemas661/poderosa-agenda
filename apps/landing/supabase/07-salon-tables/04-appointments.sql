-- ============================================
-- TABELA: appointments (Agendamentos)
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Relacionamentos
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Dados do cliente (denormalizados para facilitar)
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_email VARCHAR(255),
  
  -- Dados do serviço (denormalizados)
  service_name VARCHAR(255) NOT NULL,
  service_duration INTEGER NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  
  -- Agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  end_time TIME,
  
  -- Status
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',    -- Agendado
    'confirmed',    -- Confirmado pelo cliente
    'in_progress',  -- Em andamento
    'completed',    -- Concluído
    'cancelled',    -- Cancelado
    'no_show'       -- Cliente não compareceu
  )),
  
  -- Financeiro
  total_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method VARCHAR(30),
  paid_at TIMESTAMPTZ,
  
  -- Comissão
  commission_rate DECIMAL(5,2),
  commission_value DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT false,
  
  -- Observações
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50), -- client, salon, professional
  cancelled_at TIMESTAMPTZ,
  
  -- Check-in/Check-out
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(scheduled_date, scheduled_time);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all appointments" ON appointments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own appointments" ON appointments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = appointments.salon_id));

CREATE POLICY "Salon admins can insert own appointments" ON appointments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = appointments.salon_id));

CREATE POLICY "Salon admins can update own appointments" ON appointments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = appointments.salon_id));

CREATE POLICY "Salon admins can delete own appointments" ON appointments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = appointments.salon_id));