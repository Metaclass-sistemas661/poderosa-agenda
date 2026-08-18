# 📦 07-salon-tables - Tabelas do Painel do Salão

## 🏗️ Arquitetura

```
07-salon-tables/
├── 01-professionals.sql     → Equipe/Profissionais
├── 02-services.sql          → Serviços oferecidos
├── 03-clients.sql           → Base de clientes
├── 04-appointments.sql      → Agendamentos
├── 05-transactions.sql      → Financeiro
├── 06-products.sql          → Produtos à venda
├── 07-salon-settings.sql    → Configurações
├── 08-triggers.sql          → Triggers de updated_at
├── 09-security-functions.sql → Funções helper de segurança
└── README.md                → Esta documentação
```

## ⚠️ PRÉ-REQUISITOS

Antes de executar estes arquivos, você **DEVE** ter executado:
- `run-all.sql` (cria tabelas base: salons, admin_users, access_requests)

## 🚀 Ordem de Execução

Execute no Supabase SQL Editor na seguinte ordem:

```
1. 01-professionals.sql        → Tabela de profissionais
2. 02-services.sql             → Tabela de serviços
3. 03-clients.sql              → Tabela de clientes
4. 04-appointments.sql         → Tabela de agendamentos
5. 05-transactions.sql         → Tabela de transações
6. 06-products.sql             → Tabela de produtos
7. 07-salon-settings.sql       → Tabela de configurações
8. 08-triggers.sql             → Triggers de updated_at
9. 09-security-functions.sql   ← POR ÚLTIMO! (funções + índices + views)
```

## 🔒 Segurança Multi-Tenant

Todas as tabelas possuem:
- `salon_id` como FK obrigatória para `salons(id)`
- RLS (Row Level Security) habilitado
- Policies que garantem isolamento por salão:
  - **Superadmin**: Acesso total (usa `is_superadmin()`)
  - **Admin do Salão**: Apenas seus dados (usa `get_user_salon_id()`)

## 📊 Diferença: Superadmin vs Painel do Salão

| Contexto | Tabelas | Descrição |
|----------|---------|-----------|
| **SUPERADMIN** | access_requests, salons, admin_users | Gestão da plataforma |
| **PAINEL DO SALÃO** | professionals, services, clients, appointments, transactions, products, salon_settings | Operação do salão |

## 🔑 Funções de Segurança

Definidas em `09-security-functions.sql`:

```sql
-- Retorna o salon_id do usuário logado
get_user_salon_id() → UUID

-- Verifica se o usuário é superadmin
is_superadmin() → BOOLEAN