-- ============================================
-- RLS POLICIES: salons
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Row Level Security para a tabela salons.
--   Apenas usuários autenticados (admins) podem
--   realizar qualquer operação.
--
-- ============================================

-- Habilitar RLS
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

-- ALL: Apenas admins autenticados podem fazer tudo
DROP POLICY IF EXISTS "Permitir todas operações para autenticados em salons" ON salons;
CREATE POLICY "Permitir todas operações para autenticados em salons" 
  ON salons
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');