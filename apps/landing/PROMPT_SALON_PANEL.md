# 🚀 PROMPT ESTRUTURADO: IMPLEMENTAÇÃO DO PAINEL DE ADMIN DE SALÃO

## 📋 CONTEXTO DO PROJETO

Você está trabalhando no projeto **Hurick**, uma plataforma SaaS para gestão de salões de beleza. O projeto já possui:

✅ **Landing Page** funcional com formulário de cadastro
✅ **Painel SuperAdmin** completo em `/admin` (não mexer!)
✅ **Sistema de autenticação** via Supabase Auth
✅ **Banco de dados PostgreSQL** com 3 tabelas base (access_requests, salons, admin_users)

### Stack Tecnológico Atual
- **Framework**: Next.js 14.2.5 (App Router)
- **UI**: Tailwind CSS + Framer Motion 11.2.12
- **Ícones**: Lucide React 0.400.0
- **Backend**: Supabase (Auth + Database + Realtime)
- **Linguagem**: TypeScript 5.5.3

---

## 🎯 OBJETIVO PRINCIPAL

Criar um **painel de administração para salões de beleza** (diferente do SuperAdmin) localizado em `/salon`, com funcionalidades completas de:
- Gestão de agendamentos
- CRM de clientes
- Catálogo de serviços
- Gestão de profissionais
- Controle financeiro
- Estoque de produtos
- Relatórios e analytics

### 🚨 REGRAS CRÍTICAS

1. **NÃO MODIFICAR** o painel SuperAdmin existente em `/admin` (a menos que seja absolutamente necessário)
2. **NÃO ALTERAR** as tabelas existentes (access_requests, salons, admin_users)
3. **MANTER** o design system e paleta de cores atual
4. **SEGUIR** os padrões de código já estabelecidos no projeto
5. **IMPLEMENTAR** Row Level Security (RLS) em TODAS as novas tabelas
6. **GARANTIR** isolamento total de dados entre salões (multi-tenancy)

---

## 🗄️ FASE 1: ESTRUTURA DO BANCO DE DADOS

### 1.1. Criar Novas Tabelas SQL

Crie os arquivos SQL em `apps/landing/supabase/07-salon-tables/` com a seguinte estrutura:


#### Arquivo: `01-professionals.sql`

```sql
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
CREATE INDEX idx_professionals_salon_id ON professionals(salon_id);
CREATE INDEX idx_professionals_status ON professionals(status);

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
```


#### Arquivo: `02-services.sql`

```sql
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
  commission_rate DECIMAL(5,2), -- % específica para este serviço (sobrescreve a do profissional)
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- para ordenação customizada
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_services_salon_id ON services(salon_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- Comentários
COMMENT ON TABLE services IS 'Serviços oferecidos por cada salão';
COMMENT ON COLUMN services.duration IS 'Duração do serviço em minutos';
COMMENT ON COLUMN services.commission_rate IS 'Comissão específica deste serviço (sobrescreve a do profissional)';

-- RLS (mesmo padrão)
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
```


#### Arquivo: `03-clients.sql`

```sql
-- ============================================
-- TABELA: clients (Clientes/CRM)
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  birthday DATE,
  gender VARCHAR(20),
  photo_url TEXT,
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state CHAR(2),
  zip_code VARCHAR(10),
  
  -- CRM
  notes TEXT, -- Observações importantes (alergias, preferências, etc.)
  tags TEXT[], -- Array de tags: VIP, Frequente, Inadimplente, etc.
  
  -- Estatísticas
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  loyalty_points INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_salon_id ON clients(salon_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);

-- Comentários
COMMENT ON TABLE clients IS 'Clientes de cada salão (CRM)';
COMMENT ON COLUMN clients.tags IS 'Array de tags para segmentação';
COMMENT ON COLUMN clients.loyalty_points IS 'Pontos do programa de fidelidade';

-- RLS (mesmo padrão)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all clients" ON clients FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own clients" ON clients FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = clients.salon_id));

CREATE POLICY "Salon admins can insert own clients" ON clients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = clients.salon_id));

CREATE POLICY "Salon admins can update own clients" ON clients FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = clients.salon_id));

CREATE POLICY "Salon admins can delete own clients" ON clients FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = clients.salon_id));
```


#### Arquivo: `04-appointments.sql`

```sql
-- ============================================
-- TABELA: appointments (Agendamentos)
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Dados do agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  end_time TIME, -- calculado automaticamente
  duration INTEGER NOT NULL, -- minutos
  
  -- Status do agendamento
  status VARCHAR(20) DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Dados do cliente (denormalizados para histórico)
  client_name VARCHAR(255),
  client_phone VARCHAR(20),
  
  -- Valores
  service_name VARCHAR(255), -- denormalizado
  service_price DECIMAL(10,2),
  additional_products JSONB, -- [{name: 'Produto X', price: 50.00}]
  additional_price DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  total_price DECIMAL(10,2),
  
  -- Pagamento
  payment_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  payment_method VARCHAR(50), -- Dinheiro, Cartão Crédito, Cartão Débito, PIX, etc.
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Observações
  notes TEXT, -- Observações do agendamento
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES admin_users(id),
  
  -- Avaliação (pós-atendimento)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_professional ON appointments(scheduled_date, professional_id);

-- Comentários
COMMENT ON TABLE appointments IS 'Agendamentos de serviços';
COMMENT ON COLUMN appointments.end_time IS 'Horário de término (calculado: scheduled_time + duration)';
COMMENT ON COLUMN appointments.additional_products IS 'Produtos vendidos durante o atendimento';

-- RLS (mesmo padrão)
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
```


#### Arquivo: `05-transactions.sql`

```sql
-- ============================================
-- TABELA: transactions (Transações Financeiras)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Tipo
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100), -- Serviço, Produto, Comissão, Aluguel, Salário, etc.
  description TEXT,
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  
  -- Para comissões de profissionais
  professional_id UUID REFERENCES professionals(id),
  commission_amount DECIMAL(10,2),
  
  -- Controle
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Anexos
  attachment_url TEXT, -- URL de nota fiscal, comprovante, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_transactions_salon_id ON transactions(salon_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_professional_id ON transactions(professional_id);

-- Comentários
COMMENT ON TABLE transactions IS 'Transações financeiras (receitas e despesas)';
COMMENT ON COLUMN transactions.type IS 'income = receita, expense = despesa';
COMMENT ON COLUMN transactions.commission_amount IS 'Valor de comissão do profissional';

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
```


#### Arquivo: `06-products.sql`

```sql
-- ============================================
-- TABELA: products (Estoque)
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do produto
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Shampoo, Condicionador, Tintura, etc.
  brand VARCHAR(100),
  photo_url TEXT,
  
  -- Estoque
  quantity DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'un', -- un, ml, kg, etc.
  min_quantity DECIMAL(10,2) DEFAULT 10, -- alerta de estoque baixo
  
  -- Valores
  cost_price DECIMAL(10,2), -- preço de custo
  sale_price DECIMAL(10,2), -- preço de venda
  
  -- Fornecedor
  supplier VARCHAR(255),
  supplier_contact TEXT,
  
  -- Controle
  barcode VARCHAR(100),
  sku VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_salon_id ON products(salon_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

-- Comentários
COMMENT ON TABLE products IS 'Produtos do estoque';
COMMENT ON COLUMN products.min_quantity IS 'Quantidade mínima para alerta';

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
```


#### Arquivo: `07-salon-settings.sql`

```sql
-- ============================================
-- TABELA: salon_settings (Configurações)
-- ============================================

CREATE TABLE IF NOT EXISTS salon_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Horários de funcionamento
  working_hours JSONB DEFAULT '{
    "mon": {"start": "09:00", "end": "18:00", "closed": false},
    "tue": {"start": "09:00", "end": "18:00", "closed": false},
    "wed": {"start": "09:00", "end": "18:00", "closed": false},
    "thu": {"start": "09:00", "end": "18:00", "closed": false},
    "fri": {"start": "09:00", "end": "18:00", "closed": false},
    "sat": {"start": "09:00", "end": "14:00", "closed": false},
    "sun": {"start": "09:00", "end": "14:00", "closed": true}
  }',
  
  -- Configurações de agendamento
  booking_interval INTEGER DEFAULT 30, -- minutos entre agendamentos
  advance_booking_days INTEGER DEFAULT 30, -- quantos dias de antecedência
  cancellation_hours INTEGER DEFAULT 24, -- horas mínimas para cancelar
  allow_online_booking BOOLEAN DEFAULT true,
  require_confirmation BOOLEAN DEFAULT true,
  
  -- Notificações
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 24, -- horas antes do agendamento
  
  -- Fidelidade
  loyalty_enabled BOOLEAN DEFAULT false,
  points_per_real DECIMAL(5,2) DEFAULT 1, -- pontos por real gasto
  points_to_money DECIMAL(5,2) DEFAULT 0.01, -- 1 ponto = R$ 0,01
  
  -- Financeiro
  tax_rate DECIMAL(5,2) DEFAULT 0, -- % de imposto
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Personalização
  theme_color VARCHAR(7) DEFAULT '#10b981', -- hex color
  logo_url TEXT,
  cover_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE UNIQUE INDEX idx_salon_settings_salon_id ON salon_settings(salon_id);

-- Comentários
COMMENT ON TABLE salon_settings IS 'Configurações específicas de cada salão';
COMMENT ON COLUMN salon_settings.booking_interval IS 'Intervalo em minutos entre agendamentos';
COMMENT ON COLUMN salon_settings.points_per_real IS 'Quantos pontos ganhar por real gasto';

-- RLS
ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all salon_settings" ON salon_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'superadmin'));

CREATE POLICY "Salon admins can view own settings" ON salon_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = salon_settings.salon_id));

CREATE POLICY "Salon admins can update own settings" ON salon_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.salon_id = salon_settings.salon_id));
```


### 1.2. Criar Triggers para updated_at

#### Arquivo: `apps/landing/supabase/08-salon-triggers/01-updated-at.sql`

```sql
-- ============================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- ============================================

-- Função auxiliar (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salon_settings_updated_at
  BEFORE UPDATE ON salon_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.3. Atualizar Types do TypeScript

#### Arquivo: `apps/landing/src/lib/database.types.ts`

Adicione as novas tabelas ao arquivo de tipos (adicionar ao final do arquivo existente):

```typescript
// Adicionar ao final do arquivo database.types.ts

export interface Database {
  public: {
    Tables: {
      // ... tabelas existentes ...
      
      // NOVAS TABELAS
      professionals: {
        Row: {
          id: string
          salon_id: string
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          photo_url: string | null
          role: string | null
          specialty: string[] | null
          bio: string | null
          commission_rate: number
          working_days: Json
          working_hours: Json
          status: 'active' | 'inactive' | 'vacation'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['professionals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['professionals']['Insert']>
      }
      
      services: {
        Row: {
          id: string
          salon_id: string
          name: string
          description: string | null
          category: string | null
          photo_url: string | null
          price: number
          duration: number
          commission_rate: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      
      clients: {
        Row: {
          id: string
          salon_id: string
          name: string
          email: string | null
          phone: string
          cpf: string | null
          birthday: string | null
          gender: string | null
          photo_url: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          notes: string | null
          tags: string[] | null
          total_visits: number
          total_spent: number
          last_visit_at: string | null
          loyalty_points: number
          status: 'active' | 'inactive' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      
      appointments: {
        Row: {
          id: string
          salon_id: string
          client_id: string | null
          professional_id: string | null
          service_id: string | null
          scheduled_date: string
          scheduled_time: string
          end_time: string | null
          duration: number
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          client_name: string | null
          client_phone: string | null
          service_name: string | null
          service_price: number | null
          additional_products: Json | null
          additional_price: number
          discount: number
          discount_reason: string | null
          total_price: number | null
          payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
          payment_method: string | null
          paid_amount: number
          notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          rating: number | null
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      
      transactions: {
        Row: {
          id: string
          salon_id: string
          appointment_id: string | null
          type: 'income' | 'expense'
          category: string | null
          description: string | null
          amount: number
          payment_method: string | null
          professional_id: string | null
          commission_amount: number | null
          date: string
          status: 'pending' | 'completed' | 'cancelled'
          attachment_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      
      products: {
        Row: {
          id: string
          salon_id: string
          name: string
          description: string | null
          category: string | null
          brand: string | null
          photo_url: string | null
          quantity: number
          unit: string
          min_quantity: number
          cost_price: number | null
          sale_price: number | null
          supplier: string | null
          supplier_contact: string | null
          barcode: string | null
          sku: string | null
          status: 'active' | 'inactive' | 'discontinued'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      
      salon_settings: {
        Row: {
          id: string
          salon_id: string
          working_hours: Json
          booking_interval: number
          advance_booking_days: number
          cancellation_hours: number
          allow_online_booking: boolean
          require_confirmation: boolean
          sms_enabled: boolean
          email_enabled: boolean
          whatsapp_enabled: boolean
          reminder_hours: number
          loyalty_enabled: boolean
          points_per_real: number
          points_to_money: number
          tax_rate: number
          currency: string
          theme_color: string
          logo_url: string | null
          cover_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['salon_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['salon_settings']['Insert']>
      }
    }
  }
}

// Type helpers para as novas tabelas
export type Professional = Database['public']['Tables']['professionals']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type SalonSettings = Database['public']['Tables']['salon_settings']['Row']
```

---

## 🎨 FASE 2: ESTRUTURA DE ROTAS E LAYOUT

### 2.1. Criar Estrutura de Pastas

```bash
apps/landing/src/app/salon/
├── layout.tsx                    # Layout principal
├── page.tsx                      # Redirect para /salon/dashboard
├── dashboard/
│   └── page.tsx                  # Dashboard principal
├── agendamentos/
│   ├── page.tsx                  # Lista de agendamentos
│   └── calendario/
│       └── page.tsx              # Vista de calendário
├── clientes/
│   ├── page.tsx                  # Lista de clientes
│   └── [id]/
│       └── page.tsx              # Perfil do cliente
├── servicos/
│   └── page.tsx                  # CRUD de serviços
├── profissionais/
│   └── page.tsx                  # CRUD de profissionais
├── financeiro/
│   ├── caixa/
│   │   └── page.tsx              # Fluxo de caixa
│   ├── comissoes/
│   │   └── page.tsx              # Comissões
│   └── relatorios/
│       └── page.tsx              # Relatórios financeiros
├── estoque/
│   └── page.tsx                  # CRUD de produtos
└── configuracoes/
    ├── perfil/
    │   └── page.tsx              # Dados do salão
    ├── horarios/
    │   └── page.tsx              # Horários de funcionamento
    └── usuarios/
        └── page.tsx              # Equipe e permissões
```


### 2.2. Layout Principal do Painel de Salão

#### Arquivo: `apps/landing/src/app/salon/layout.tsx`

**IMPORTANTE**: Baseado em `/admin/layout.tsx`, mas com navegação específica para salão.

**Requisitos do Layout:**

1. **Sidebar com navegação:**
   - Dashboard (LayoutDashboard icon)
   - Agendamentos (Calendar icon)
   - Clientes (Users icon)
   - Serviços (Scissors icon)
   - Profissionais (UserCheck icon)
   - Financeiro (DollarSign icon) - com submenu
   - Estoque (Package icon)
   - Configurações (Settings icon)

2. **Header com:**
   - Nome do salão (buscar de `salons` via `salon_id`)
   - Notificações (agendamentos pendentes, estoque baixo)
   - Avatar do usuário
   - Botão de logout

3. **Verificação de autenticação:**
   - Verificar se o usuário está autenticado
   - Verificar se o usuário tem `salon_id` (não é superadmin)
   - Buscar dados do salão via `salon_id`
   - Redirecionar para `/login` se não autenticado
   - Redirecionar para `/admin` se for superadmin

4. **Temas e cores:**
   - Manter paleta escura (#0f1419, #1a2332)
   - Usar tema personalizado do salão (buscar de `salon_settings.theme_color`)
   - Suporte a dark/light mode (futuro)

5. **Responsividade:**
   - Mobile: Sidebar colapsável (hamburguer menu)
   - Tablet: Sidebar com ícones apenas
   - Desktop: Sidebar completa

6. **Realtime:**
   - Subscrever a eventos de agendamentos (Supabase Realtime)
   - Atualizar notificações em tempo real

**Exemplo de estrutura (adaptar de admin/layout.tsx):**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  DollarSign,
  Package,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/salon/dashboard', icon: LayoutDashboard },
  { name: 'Agendamentos', href: '/salon/agendamentos', icon: Calendar },
  { name: 'Clientes', href: '/salon/clientes', icon: Users },
  { name: 'Serviços', href: '/salon/servicos', icon: Scissors },
  { name: 'Profissionais', href: '/salon/profissionais', icon: UserCheck },
  { 
    name: 'Financeiro', 
    href: '/salon/financeiro', 
    icon: DollarSign,
    submenu: [
      { name: 'Caixa', href: '/salon/financeiro/caixa' },
      { name: 'Comissões', href: '/salon/financeiro/comissoes' },
      { name: 'Relatórios', href: '/salon/financeiro/relatorios' },
    ]
  },
  { name: 'Estoque', href: '/salon/estoque', icon: Package },
  { name: 'Configurações', href: '/salon/configuracoes', icon: Settings },
]

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [salon, setSalon] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Buscar dados do admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*, salons(*)')
      .eq('user_id', session.user.id)
      .single()

    // Se for superadmin, redirecionar para /admin
    if (adminUser && adminUser.role === 'superadmin') {
      router.push('/admin')
      return
    }

    // Se não tiver salon_id, redirecionar
    if (!adminUser || !adminUser.salon_id) {
      router.push('/login')
      return
    }

    setUser(adminUser)
    setSalon(adminUser.salons)
    setIsLoading(false)
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="flex h-screen bg-[#0f1419]">
      {/* Sidebar */}
      {/* Header */}
      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
```

---

## 📊 FASE 3: IMPLEMENTAÇÃO DAS PÁGINAS

### 3.1. Dashboard Principal

#### Arquivo: `apps/landing/src/app/salon/dashboard/page.tsx`

**Requisitos:**

1. **Cards KPI (4 colunas):**
   - Agendamentos Hoje (count + % vs ontem)
   - Receita do Mês (total + % vs mês anterior)
   - Clientes Atendidos (count do mês)
   - Taxa de Ocupação (% de horários preenchidos)

2. **Gráficos:**
   - Receita dos últimos 12 meses (Line Chart)
   - Serviços mais vendidos (Bar Chart)
   - Desempenho por profissional (Donut Chart)

3. **Agenda do Dia:**
   - Timeline vertical com agendamentos de hoje
   - Códigos de cores por status
   - Quick actions (check-in, cancelar)

4. **Alertas:**
   - Agendamentos pendentes de confirmação
   - Aniversariantes do dia
   - Estoque baixo (produtos < min_quantity)
   - Comissões a pagar

**Exemplo de estrutura:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  AlertTriangle 
} from 'lucide-react'

export default function SalonDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    monthRevenue: 0,
    monthClients: 0,
    occupancyRate: 0
  })
  
  const [todaySchedule, setTodaySchedule] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Buscar dados do dashboard
    // KPIs, agendamentos, alertas, etc.
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agendamentos Hoje */}
        {/* Card 2: Receita do Mês */}
        {/* Card 3: Clientes Atendidos */}
        {/* Card 4: Taxa de Ocupação */}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita */}
        {/* Gráfico de Serviços */}
      </div>

      {/* Agenda do Dia */}
      <div className="bg-[#1a2332] rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Agenda de Hoje</h2>
        {/* Timeline */}
      </div>

      {/* Alertas */}
      <div className="bg-[#1a2332] rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Alertas</h2>
        {/* Lista de alertas */}
      </div>
    </div>
  )
}
```


### 3.2. Gestão de Agendamentos

#### Arquivo: `apps/landing/src/app/salon/agendamentos/page.tsx`

**Requisitos:**

1. **Vista em Lista:**
   - Tabela com agendamentos
   - Filtros: data, profissional, status, cliente
   - Busca por nome do cliente
   - Badges coloridos por status
   - Quick actions: confirmar, cancelar, editar

2. **Drawer de Novo Agendamento:**
   - Buscar/criar cliente
   - Selecionar serviço (com preço)
   - Selecionar profissional
   - Selecionar data e horário (com validação de conflitos)
   - Adicionar observações
   - Calcular preço total

3. **Drawer de Edição:**
   - Mesmos campos do novo
   - Opção de cancelar com motivo
   - Histórico de alterações

4. **Modal de Check-in/Check-out:**
   - Marcar início do atendimento
   - Adicionar produtos extras
   - Aplicar descontos
   - Registrar pagamento
   - Finalizar atendimento

5. **Validações:**
   - Verificar conflitos de horário
   - Verificar disponibilidade do profissional
   - Validar horário de funcionamento
   - Alerta se cliente já tem agendamento no mesmo dia

**Padrão de componente (baseado em admin/saloes/page.tsx):**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Plus, Search, Filter } from 'lucide-react'

interface Appointment {
  id: string
  client_name: string
  client_phone: string
  professional_id: string
  professionals: { name: string }
  service_name: string
  scheduled_date: string
  scheduled_time: string
  status: string
  total_price: number
}

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAppointments()
  }, [filterDate])

  const fetchAppointments = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, professionals(name), services(name)')
      .eq('scheduled_date', filterDate)
      .order('scheduled_time')
    
    if (data) setAppointments(data)
    setIsLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
        <button
          onClick={() => setShowCreateDrawer(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      {/* Tabela/Lista */}
      {/* Drawers */}
    </div>
  )
}
```


### 3.3. CRM de Clientes

#### Arquivo: `apps/landing/src/app/salon/clientes/page.tsx`

**Requisitos:**

1. **Lista de Clientes:**
   - Cards ou tabela com foto, nome, telefone
   - Busca por nome, telefone, CPF
   - Filtros por tags, status
   - Ordenação por: nome, última visita, total gasto
   - Paginação ou scroll infinito

2. **Drawer de Novo Cliente:**
   - Dados pessoais (nome, email, telefone, CPF)
   - Data de nascimento
   - Endereço completo
   - Tags personalizadas
   - Observações (alergias, preferências)
   - Foto (upload opcional)

3. **Perfil do Cliente (página separada):**
   - Header com foto e dados principais
   - Estatísticas: total de visitas, valor gasto, última visita
   - Histórico de agendamentos (timeline)
   - Serviços favoritos
   - Notas e observações
   - Botão de agendar novo serviço

4. **Features CRM:**
   - Marcar como VIP
   - Adicionar tags customizadas
   - Alerta de aniversário
   - Histórico de campanhas
   - Programa de fidelidade (pontos)

**Estrutura:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Plus, Search, Tag, Calendar } from 'lucide-react'

export default function ClientesPage() {
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('all')

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    if (data) setClients(data)
  }

  return (
    <div className="p-6">
      {/* Header e filtros */}
      {/* Lista de clientes */}
      {/* Drawer de criar/editar */}
    </div>
  )
}
```

---

### 3.4. Catálogo de Serviços

#### Arquivo: `apps/landing/src/app/salon/servicos/page.tsx`

**Requisitos:**

1. **Grid de Serviços:**
   - Cards com foto, nome, preço, duração
   - Agrupados por categoria
   - Toggle ativo/inativo
   - Drag & drop para reordenar (display_order)

2. **CRUD Completo:**
   - Criar serviço
   - Editar serviço
   - Excluir serviço (com confirmação)
   - Upload de foto

3. **Campos:**
   - Nome do serviço
   - Descrição
   - Categoria (select ou criar nova)
   - Preço
   - Duração (em minutos)
   - % Comissão (sobrescreve a do profissional)
   - Foto
   - Status (ativo/inativo)

**Padrão CRUD (baseado em admin/saloes/page.tsx):**

```tsx
export default function ServicosPage() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState(['Cabelo', 'Unha', 'Estética', 'Barba'])

  return (
    <div className="p-6">
      {/* Header */}
      {/* Grid por categoria */}
      {/* Drawers */}
    </div>
  )
}
```

---

### 3.5. Gestão de Profissionais

#### Arquivo: `apps/landing/src/app/salon/profissionais/page.tsx`

**Requisitos:**

1. **Cards de Profissionais:**
   - Foto, nome, especialidade
   - % Comissão
   - Status (ativo, férias, inativo)
   - Estatísticas: atendimentos do mês, receita gerada

2. **CRUD:**
   - Criar profissional
   - Editar profissional
   - Desativar (não excluir, manter histórico)

3. **Configurações:**
   - Dias de trabalho (checkboxes)
   - Horário de trabalho (start/end)
   - Especialidades (array de tags)
   - % Comissão padrão

4. **Agenda do Profissional:**
   - Ver agendamentos de um profissional específico
   - Filtrar por data

**Estrutura:**

```tsx
export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState([])

  return (
    <div className="p-6">
      {/* Grid de profissionais */}
      {/* Drawer de criar/editar */}
    </div>
  )
}
```

---

### 3.6. Financeiro

#### Arquivo: `apps/landing/src/app/salon/financeiro/caixa/page.tsx`

**Requisitos:**

1. **Resumo do Dia:**
   - Total de entradas
   - Total de saídas
   - Saldo do dia
   - Métodos de pagamento (breakdown)

2. **Lançamentos:**
   - Lista de todas as transações
   - Filtros por tipo, data, categoria
   - Criar entrada/saída manual
   - Anexar comprovantes

3. **Categorias:**
   - Receitas: Serviços, Produtos, Outros
   - Despesas: Comissões, Aluguel, Salários, Produtos, Outros

**Estrutura:**

```tsx
export default function CaixaPage() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })

  return (
    <div className="p-6">
      {/* Cards de resumo */}
      {/* Lista de transações */}
      {/* Modal de novo lançamento */}
    </div>
  )
}
```

#### Arquivo: `apps/landing/src/app/salon/financeiro/comissoes/page.tsx`

**Requisitos:**

1. **Lista de Comissões:**
   - Por profissional
   - Período selecionável
   - Status: pendente, pago
   - Detalhamento por serviço

2. **Ações:**
   - Marcar como pago
   - Exportar relatório
   - Gerar comprovante

---

### 3.7. Estoque

#### Arquivo: `apps/landing/src/app/salon/estoque/page.tsx`

**Requisitos:**

1. **Lista de Produtos:**
   - Nome, categoria, quantidade, preço
   - Alerta visual para estoque baixo
   - Busca e filtros

2. **CRUD:**
   - Adicionar produto
   - Editar produto
   - Registrar entrada/saída
   - Histórico de movimentações

3. **Alertas:**
   - Produtos abaixo do estoque mínimo
   - Produtos sem fornecedor

**Estrutura:**

```tsx
export default function EstoquePage() {
  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])

  return (
    <div className="p-6">
      {/* Alertas de estoque baixo */}
      {/* Tabela de produtos */}
      {/* Drawer de criar/editar */}
    </div>
  )
}
```

---

### 3.8. Configurações

#### Arquivo: `apps/landing/src/app/salon/configuracoes/perfil/page.tsx`

**Requisitos:**

1. **Dados do Salão:**
   - Nome, email, telefone
   - CNPJ/CPF, endereço
   - Logo e foto de capa
   - Redes sociais

2. **Horários de Funcionamento:**
   - Por dia da semana
   - Horário de início e fim
   - Checkbox de fechado

3. **Configurações de Agendamento:**
   - Intervalo entre agendamentos
   - Dias de antecedência permitidos
   - Horas mínimas para cancelamento

4. **Notificações:**
   - WhatsApp, SMS, Email
   - Horário de lembrete

**Estrutura:**

```tsx
export default function ConfiguracoesPerfilPage() {
  const [settings, setSettings] = useState(null)
  const [salon, setSalon] = useState(null)

  return (
    <div className="p-6">
      {/* Formulário de configurações */}
    </div>
  )
}
```

---

## 🎯 FASE 4: COMPONENTES REUTILIZÁVEIS

### Criar em: `apps/landing/src/components/salon/`

1. **AppointmentCard.tsx** - Card de agendamento
2. **ClientCard.tsx** - Card de cliente
3. **ProfessionalCard.tsx** - Card de profissional
4. **ServiceCard.tsx** - Card de serviço
5. **StatCard.tsx** - Card de estatística
6. **Timeline.tsx** - Timeline de eventos
7. **CalendarView.tsx** - Vista de calendário
8. **StatusBadge.tsx** - Badge de status
9. **EmptyState.tsx** - Estado vazio
10. **LoadingState.tsx** - Estado de carregamento

**Padrão de componente:**

```tsx
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color?: string
}

export function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-[#1a2332] rounded-2xl p-6 border border-white/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color || 'bg-emerald-500/20'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
```

---

## 🔐 FASE 5: SEGURANÇA E VALIDAÇÕES

### 5.1. Middleware de Autenticação

#### Arquivo: `apps/landing/src/middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas protegidas /salon/*
  if (req.nextUrl.pathname.startsWith('/salon')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verificar se tem salon_id
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('salon_id, role')
      .eq('user_id', session.user.id)
      .single()

    if (!adminUser || !adminUser.salon_id) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Superadmin não pode acessar /salon
    if (adminUser.role === 'superadmin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/salon/:path*']
}
```


### 5.2. Helpers de Validação

#### Arquivo: `apps/landing/src/lib/validations.ts`

```typescript
// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '')
  if (numbers.length !== 11 || /^(\d)\1+$/.test(numbers)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i)
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(numbers[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i)
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === parseInt(numbers[10])
}

// Formatação de CPF
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Validação de telefone
export const validatePhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '')
  return numbers.length === 10 || numbers.length === 11
}

// Formatação de telefone
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

// Validação de email
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Formatação de data
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

// Formatação de horário
export const formatTime = (time: string): string => {
  return time.substring(0, 5) // HH:MM
}

// Verificar conflito de horário
export const checkTimeConflict = (
  existingAppointments: Array<{ scheduled_time: string; duration: number }>,
  newTime: string,
  newDuration: number
): boolean => {
  const newStart = parseTime(newTime)
  const newEnd = newStart + newDuration

  for (const apt of existingAppointments) {
    const existingStart = parseTime(apt.scheduled_time)
    const existingEnd = existingStart + apt.duration

    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return true // Conflito detectado
    }
  }

  return false
}

// Helper para converter HH:MM em minutos
const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
```

---

## 📱 FASE 6: FEATURES AVANÇADAS

### 6.1. Realtime com Supabase

#### Arquivo: `apps/landing/src/hooks/useRealtimeAppointments.ts`

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/lib/database.types'

export function useRealtimeAppointments(salonId: string, date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    // Buscar agendamentos iniciais
    fetchAppointments()

    // Subscrever a mudanças
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salonId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [...prev, payload.new as Appointment])
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev =>
              prev.map(apt => apt.id === payload.new.id ? payload.new as Appointment : apt)
            )
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(apt => apt.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [salonId, date])

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('salon_id', salonId)
      .eq('scheduled_date', date)
      .order('scheduled_time')

    if (data) setAppointments(data)
  }

  return appointments
}
```

### 6.2. Hook para Dados do Salão

#### Arquivo: `apps/landing/src/hooks/useSalonContext.ts`

```typescript
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SalonContextType {
  salon: any
  salonSettings: any
  user: any
  isLoading: boolean
}

const SalonContext = createContext<SalonContextType | null>(null)

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [salon, setSalon] = useState(null)
  const [salonSettings, setSalonSettings] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSalonData()
  }, [])

  const loadSalonData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*, salons(*)')
      .eq('user_id', session.user.id)
      .single()

    if (adminUser) {
      setUser(adminUser)
      setSalon(adminUser.salons)

      // Buscar configurações
      const { data: settings } = await supabase
        .from('salon_settings')
        .select('*')
        .eq('salon_id', adminUser.salon_id)
        .single()

      setSalonSettings(settings)
    }

    setIsLoading(false)
  }

  return (
    <SalonContext.Provider value={{ salon, salonSettings, user, isLoading }}>
      {children}
    </SalonContext.Provider>
  )
}

export function useSalonContext() {
  const context = useContext(SalonContext)
  if (!context) throw new Error('useSalonContext must be used within SalonProvider')
  return context
}
```

---

## 🎨 FASE 7: DESIGN PATTERNS E BOAS PRÁTICAS

### 7.1. Padrões de Código

1. **Nomenclatura:**
   - Componentes: PascalCase (AppointmentCard.tsx)
   - Hooks: camelCase com prefixo use (useRealtimeAppointments.ts)
   - Utils/Helpers: camelCase (formatCurrency)
   - Constantes: UPPER_SNAKE_CASE

2. **Estrutura de Componentes:**
   ```tsx
   // Imports
   // Types/Interfaces
   // Constants
   // Component
   // Hooks
   // Handlers
   // Effects
   // Render
   ```

3. **Tratamento de Erros:**
   ```tsx
   try {
     const { data, error } = await supabase.from('table').select()
     if (error) throw error
     // Sucesso
   } catch (error) {
     console.error('Erro:', error)
     setMessage({ type: 'error', text: 'Erro ao carregar dados' })
   }
   ```

4. **Loading States:**
   - Skeleton screens
   - Loaders com Lucide icons
   - Disabled states em botões

5. **Empty States:**
   - Ícone + mensagem + ação
   - Sugestões de próximos passos

### 7.2. Performance

1. **Server Components quando possível**
2. **Lazy loading de rotas**
3. **Memoização com useMemo/useCallback**
4. **Paginação ou virtualização de listas grandes**
5. **Otimização de imagens (Next.js Image)**

### 7.3. Acessibilidade

1. **aria-labels em botões de ícones**
2. **Navegação por teclado**
3. **Contraste adequado (WCAG AA)**
4. **Focus visible**
5. **Screen reader friendly**

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Criar tabela `professionals` com RLS
- [ ] Criar tabela `services` com RLS
- [ ] Criar tabela `clients` com RLS
- [ ] Criar tabela `appointments` com RLS
- [ ] Criar tabela `transactions` com RLS
- [ ] Criar tabela `products` com RLS
- [ ] Criar tabela `salon_settings` com RLS
- [ ] Criar triggers para updated_at
- [ ] Atualizar database.types.ts
- [ ] Testar políticas RLS

### Estrutura de Rotas
- [ ] Criar pasta `/salon` e estrutura de subpastas
- [ ] Criar layout.tsx do painel salon
- [ ] Criar página de redirect (page.tsx)
- [ ] Criar todas as páginas principais

### Páginas Core
- [ ] Dashboard com KPIs e gráficos
- [ ] Agendamentos (lista + calendário)
- [ ] Clientes (lista + perfil)
- [ ] Serviços (CRUD completo)
- [ ] Profissionais (CRUD completo)
- [ ] Financeiro (caixa + comissões)
- [ ] Estoque (CRUD + alertas)
- [ ] Configurações (perfil + horários)

### Componentes
- [ ] Criar componentes reutilizáveis em /components/salon
- [ ] StatCard, AppointmentCard, ClientCard, etc.
- [ ] StatusBadge, EmptyState, LoadingState
- [ ] Timeline, CalendarView

### Funcionalidades
- [ ] Sistema de notificações em tempo real
- [ ] Validação de conflitos de horário
- [ ] Upload de imagens (profissionais, clientes, serviços)
- [ ] Filtros e buscas
- [ ] Paginação
- [ ] Exportação de relatórios

### Segurança
- [ ] Middleware de autenticação
- [ ] Verificação de salon_id em todas as queries
- [ ] Validação de inputs
- [ ] Sanitização de dados

### UX/UI
- [ ] Animações com Framer Motion
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Toasts/Notificações
- [ ] Responsividade (mobile, tablet, desktop)
- [ ] Dark theme (padrão atual)

### Testes
- [ ] Testar autenticação e redirecionamentos
- [ ] Testar isolamento de dados (RLS)
- [ ] Testar conflitos de horário
- [ ] Testar validações de formulários
- [ ] Testar responsividade

---

## 🚨 AVISOS IMPORTANTES

### ❌ O QUE NÃO FAZER

1. **NÃO modificar o painel SuperAdmin** (`/admin`)
2. **NÃO alterar as tabelas existentes** (access_requests, salons, admin_users)
3. **NÃO mudar as políticas RLS** das tabelas existentes
4. **NÃO alterar o sistema de autenticação** existente
5. **NÃO mudar a paleta de cores** ou design system atual

### ✅ O QUE FAZER

1. **CRIAR novas tabelas** com prefixo ou estrutura separada
2. **IMPLEMENTAR RLS** em TODAS as novas tabelas
3. **SEGUIR os padrões** de código existentes
4. **MANTER consistência** visual com o SuperAdmin
5. **TESTAR isolamento** de dados entre salões
6. **DOCUMENTAR** mudanças e decisões

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2): Fundação
1. Criar todas as tabelas SQL
2. Configurar RLS
3. Atualizar database.types.ts
4. Criar estrutura de rotas
5. Implementar layout base
6. Dashboard básico (sem gráficos ainda)

### Sprint 2 (Semana 3-4): Features Core
1. CRUD Profissionais
2. CRUD Serviços
3. CRUD Clientes
4. Sistema de agendamentos básico (lista)
5. Validação de conflitos
6. Check-in/Check-out

### Sprint 3 (Semana 5-6): Features Avançadas
1. Dashboard completo com gráficos
2. Calendário drag & drop
3. CRM completo (histórico, tags)
4. Financeiro (caixa, comissões)
5. Estoque
6. Realtime notifications

### Sprint 4 (Semana 7-8): Polish e Otimizações
1. Configurações completas
2. Analytics avançados
3. Exportação de relatórios
4. Upload de imagens
5. Testes finais
6. Documentação

---

## 📚 REFERÊNCIAS E RECURSOS

### Bibliotecas Sugeridas

```json
{
  "recharts": "^2.10.0", // Gráficos
  "date-fns": "^3.0.0", // Manipulação de datas
  "react-hook-form": "^7.49.0", // Formulários
  "zod": "^3.22.0", // Validação de schemas
  "@tanstack/react-table": "^8.11.0", // Tabelas avançadas
  "react-dropzone": "^14.2.0", // Upload de arquivos
  "@hello-pangea/dnd": "^16.5.0" // Drag and drop
}
```

### Patterns de UI

- Drawers laterais (criar/editar)
- Modais para confirmações
- Toast notifications
- Cards com glassmorphism
- Badges coloridos por status
- Timeline vertical
- Skeleton screens

---

## 🎉 RESULTADO ESPERADO

Ao final da implementação, o sistema terá:

✅ **Painel de Salão completo** em `/salon`
✅ **7 novas tabelas** com RLS configurado
✅ **Multi-tenancy seguro** (cada salão vê apenas seus dados)
✅ **Dashboard moderno** com KPIs e gráficos
✅ **Sistema de agendamentos** com validação de conflitos
✅ **CRM completo** para gestão de clientes
✅ **Controle financeiro** (caixa, comissões, relatórios)
✅ **Gestão de estoque** com alertas
✅ **Realtime updates** via Supabase
✅ **Design enterprise** consistente e responsivo
✅ **Performance otimizada** (Server Components, lazy loading)
✅ **Acessibilidade** (WCAG AA)

---

## 💡 DICAS FINAIS

1. **Comece pelas tabelas** - É a base de tudo
2. **Teste RLS constantemente** - Garanta isolamento de dados
3. **Siga o padrão do SuperAdmin** - Reutilize componentes e patterns
4. **Priorize funcionalidades core** - Dashboard, agendamentos, clientes
5. **Documente conforme avança** - Facilita manutenção futura
6. **Peça feedback cedo** - Valide UX com usuários reais
7. **Mantenha código limpo** - Siga os patterns estabelecidos
8. **Teste em diferentes cenários** - Multi-salão, multi-profissional

---

## 📞 CONTATO E SUPORTE

Se encontrar dúvidas ou problemas durante a implementação:

1. Revise este documento
2. Consulte a documentação do Supabase
3. Verifique os patterns existentes em `/admin`
4. Teste as políticas RLS no SQL Editor do Supabase
5. Use o console do navegador para debug

**BOA SORTE NA IMPLEMENTAÇÃO! 🚀**
