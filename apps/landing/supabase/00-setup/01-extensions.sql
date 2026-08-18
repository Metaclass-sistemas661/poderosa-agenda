-- ============================================
-- 00-SETUP: EXTENSÕES DO POSTGRESQL
-- ============================================
-- Descrição: Habilita extensões necessárias para o funcionamento do sistema.
-- Dependências: Nenhuma
-- Executar: PRIMEIRO (antes de qualquer tabela)
-- ============================================

-- UUID: Gera identificadores únicos universais para as primary keys
-- Já habilitado por padrão no Supabase, mas garantimos aqui
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto: Funções criptográficas (gen_random_uuid)
-- Usado para gerar IDs aleatórios seguros
CREATE EXTENSION IF NOT EXISTS "pgcrypto";