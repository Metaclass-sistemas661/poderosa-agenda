-- ============================================
-- TABELA: salon_settings (Configurações do Salão)
-- ============================================

CREATE TABLE IF NOT EXISTS salon_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Horários de funcionamento
  working_hours JSONB DEFAULT '{
    "mon": {"open": "09:00", "close": "18:00", "is_open": true},
    "tue": {"open": "09:00", "close": "18:00", "is_open": true},
    "wed": {"open": "09:00", "close": "18:00", "is_open": true},
    "thu": {"open": "09:00", "close": "18:00", "is_open": true},
    "fri": {"open": "09:00", "close": "18:00", "is_open": true},
    "sat": {"open": "09:00", "close": "13:00", "is_open": true},
    "sun": {"open": "", "close": "", "is_open": false}
  }',
  business_hours JSONB DEFAULT '{
    "mon": {"open": "09:00", "close": "18:00", "is_closed": false},
    "tue": {"open": "09:00", "close": "18:00", "is_closed": false},
    "wed": {"open": "09:00", "close": "18:00", "is_closed": false},
    "thu": {"open": "09:00", "close": "18:00", "is_closed": false},
    "fri": {"open": "09:00", "close": "18:00", "is_closed": false},
    "sat": {"open": "09:00", "close": "14:00", "is_closed": false},
    "sun": {"open": "00:00", "close": "00:00", "is_closed": true}
  }',
  
  -- Configurações de agendamento
  booking_interval INTEGER DEFAULT 30,
  booking_advance_days INTEGER DEFAULT 30,
  appointment_interval INTEGER DEFAULT 30, -- minutos entre agendamentos
  max_advance_days INTEGER DEFAULT 30, -- dias de antecedência permitidos
  min_cancel_hours INTEGER DEFAULT 2, -- horas mínimas para cancelamento
  allow_online_booking BOOLEAN DEFAULT true,
  require_confirmation BOOLEAN DEFAULT true,
  
  -- Notificações
  send_appointment_reminder BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  notify_whatsapp BOOLEAN DEFAULT false,
  notify_sms BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 24, -- horas antes para lembrete
  
  -- Configurações financeiras
  default_payment_methods TEXT[] DEFAULT ARRAY['dinheiro', 'pix', 'credito', 'debito'],
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Visual
  theme_color VARCHAR(50) DEFAULT '#10b981',
  animations_enabled BOOLEAN DEFAULT true,
  sidebar_compact BOOLEAN DEFAULT false,
  logo_url TEXT,
  cover_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_salon_settings_salon_id ON salon_settings(salon_id);

-- RLS
ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all settings" ON salon_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own settings" ON salon_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = salon_settings.salon_id));

CREATE POLICY "Salon admins can insert own settings" ON salon_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = salon_settings.salon_id));

CREATE POLICY "Salon admins can update own settings" ON salon_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = salon_settings.salon_id));