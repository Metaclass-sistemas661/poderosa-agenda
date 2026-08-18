-- ============================================
-- TABELA: transactions (Transações Financeiras)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Relacionamentos opcionais
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Tipo
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(50) NOT NULL, -- servicos, produtos, comissoes, aluguel, salarios, etc.
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(500),
  
  -- Pagamento
  payment_method VARCHAR(50), -- dinheiro, pix, credito, debito, etc.
  date DATE DEFAULT CURRENT_DATE,
  
  -- Controle
  is_confirmed BOOLEAN DEFAULT true,
  attachment_url TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_salon_id ON transactions(salon_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all transactions" ON transactions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own transactions" ON transactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = transactions.salon_id));

CREATE POLICY "Salon admins can insert own transactions" ON transactions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = transactions.salon_id));

CREATE POLICY "Salon admins can update own transactions" ON transactions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = transactions.salon_id));

CREATE POLICY "Salon admins can delete own transactions" ON transactions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = transactions.salon_id));