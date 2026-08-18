-- ============================================
-- SEED: SuperAdmin - BeautySaaS
-- ============================================
-- 
-- Execute este SQL no Supabase SQL Editor para criar
-- o primeiro usuário SuperAdmin do sistema.
--
-- ============================================

-- Primeiro, remove se já existir (para evitar duplicatas)
DELETE FROM admin_users WHERE email = 'admin@beautysaas.com';

-- Inserir SuperAdmin
INSERT INTO admin_users (user_id, name, email, role, permissions)
VALUES (
  '782eab8c-7b91-4428-83af-816aa480f59f',
  'Admin',
  'admin@beautysaas.com',
  'superadmin',
  '{"all": true, "approve_requests": true, "create_salons": true, "delete_salons": true, "manage_users": true, "system_settings": true}'
);

-- Verificar se foi criado
SELECT id, user_id, name, email, role FROM admin_users WHERE email = 'admin@beautysaas.com';