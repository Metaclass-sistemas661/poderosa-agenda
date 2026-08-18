-- ============================================
-- RLS POLICIES: access_requests
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Row Level Security para a tabela access_requests.
--   Permite INSERT público (formulário) mas restringe
--   leitura e atualização para admins autenticados.
--
-- ============================================

-- Habilitar RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- INSERT: Qualquer pessoa pode enviar solicitação (formulário público)
DROP POLICY IF EXISTS "Permitir insert público em access_requests" ON access_requests;
CREATE POLICY "Permitir insert público em access_requests" 
  ON access_requests
  FOR INSERT 
  WITH CHECK (true);

-- SELECT: Apenas admins autenticados podem ver
DROP POLICY IF EXISTS "Permitir select para autenticados em access_requests" ON access_requests;
CREATE POLICY "Permitir select para autenticados em access_requests" 
  ON access_requests
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- UPDATE: Apenas admins autenticados podem aprovar/rejeitar
DROP POLICY IF EXISTS "Permitir update para autenticados em access_requests" ON access_requests;
CREATE POLICY "Permitir update para autenticados em access_requests" 
  ON access_requests
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- DELETE: Apenas admins autenticados podem deletar
DROP POLICY IF EXISTS "Permitir delete para autenticados em access_requests" ON access_requests;
CREATE POLICY "Permitir delete para autenticados em access_requests" 
  ON access_requests
  FOR DELETE 
  USING (auth.role() = 'authenticated');