-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================
--
-- 📋 DESCRIÇÃO:
--   Índices criados para otimizar consultas frequentes.
--   Cada índice acelera buscas específicas no banco.
--
-- ⚡ IMPACTO:
--   - Consultas com WHERE ficam mais rápidas
--   - ORDER BY em campos indexados é instantâneo
--   - Buscas por email são otimizadas (UNIQUE já cria índice)
--
-- ============================================

-- === ACCESS_REQUESTS ===
-- Buscar por status (admin filtra pendentes)
CREATE INDEX IF NOT EXISTS idx_access_requests_status 
  ON access_requests(status);

-- Ordenar por data (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at 
  ON access_requests(created_at DESC);

-- === SALONS ===
-- Filtrar salões por status (ativos/inativos)
CREATE INDEX IF NOT EXISTS idx_salons_status 
  ON salons(status);

-- Buscar salão por email (login)
CREATE INDEX IF NOT EXISTS idx_salons_email 
  ON salons(email);

-- === ADMIN_USERS ===
-- Buscar admin por email
CREATE INDEX IF NOT EXISTS idx_admin_users_email 
  ON admin_users(email);

-- Filtrar por role
CREATE INDEX IF NOT EXISTS idx_admin_users_role 
  ON admin_users(role);