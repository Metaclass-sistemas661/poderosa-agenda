-- Atualiza a tabela salon_settings para adicionar as colunas faltantes que o frontend espera

ALTER TABLE salon_settings
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "mon": {"open": "09:00", "close": "18:00", "is_open": true},
  "tue": {"open": "09:00", "close": "18:00", "is_open": true},
  "wed": {"open": "09:00", "close": "18:00", "is_open": true},
  "thu": {"open": "09:00", "close": "18:00", "is_open": true},
  "fri": {"open": "09:00", "close": "18:00", "is_open": true},
  "sat": {"open": "09:00", "close": "13:00", "is_open": true},
  "sun": {"open": "", "close": "", "is_open": false}
}',
ADD COLUMN IF NOT EXISTS booking_interval INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS booking_advance_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS send_appointment_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sidebar_compact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50) DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT;
