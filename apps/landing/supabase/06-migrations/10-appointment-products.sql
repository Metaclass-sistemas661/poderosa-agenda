-- ============================================================================
-- MIGRATION: 10-appointment-products.sql
-- DESCRIÇÃO: Criação da tabela de relacionamento entre agendamentos e produtos,
--            permitindo registrar os produtos consumidos no serviço.
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_appointment_products_appointment_id ON appointment_products(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_products_product_id ON appointment_products(product_id);

-- Habilitar RLS
ALTER TABLE appointment_products ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Superadmins can manage appointment_products" ON appointment_products FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

-- Permitir acesso para administradores do salão baseado na tabela appointments
CREATE POLICY "Salon admins can view appointment_products" ON appointment_products FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments a
        JOIN admin_users au ON a.salon_id = au.salon_id
        WHERE a.id = appointment_products.appointment_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY "Salon admins can insert appointment_products" ON appointment_products FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM appointments a
        JOIN admin_users au ON a.salon_id = au.salon_id
        WHERE a.id = appointment_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY "Salon admins can update appointment_products" ON appointment_products FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments a
        JOIN admin_users au ON a.salon_id = au.salon_id
        WHERE a.id = appointment_products.appointment_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY "Salon admins can delete appointment_products" ON appointment_products FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments a
        JOIN admin_users au ON a.salon_id = au.salon_id
        WHERE a.id = appointment_products.appointment_id
        AND au.user_id = auth.uid()
    )
);
