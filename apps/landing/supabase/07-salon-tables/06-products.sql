-- ============================================
-- TABELA: products (Produtos/Estoque)
-- ============================================
-- Atualizado para refletir schema real do banco (2026-08-17)
-- Colunas alinhadas com frontend estoque/page.tsx

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,

  -- Dados do produto
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sku VARCHAR(50),
  barcode VARCHAR(50),
  photo_url TEXT,

  -- Valores
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT NULL,

  -- Estoque
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  unit VARCHAR(20) DEFAULT 'un',

  -- Fornecedor
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(100),

  -- Controle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_products_salon_id ON products(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(salon_id, stock_quantity, min_stock_level);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all products" ON products FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own products" ON products FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = products.salon_id));

CREATE POLICY "Salon admins can insert own products" ON products FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = products.salon_id));

CREATE POLICY "Salon admins can update own products" ON products FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = products.salon_id));

CREATE POLICY "Salon admins can delete own products" ON products FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = products.salon_id));