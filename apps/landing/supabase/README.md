# 📦 Supabase - Estrutura do Banco de Dados

## Organização dos Schemas

Este diretório contém todos os scripts SQL organizados para o banco de dados Supabase.

### 📁 Estrutura de Diretórios

```
supabase/
├── README.md                    ← Este arquivo
├── run-all.sql                  ← Script unificado (executa tudo de uma vez)
├── 00-setup/
│   └── 01-extensions.sql       ← Extensões do PostgreSQL
├── 01-tables/
│   ├── 01-access-requests.sql  ← Solicitações de acesso
│   ├── 02-salons.sql           ← Salões cadastrados
│   └── 03-admin-users.sql      ← Usuários admin do painel
├── 02-indexes/
│   └── 01-indexes.sql          ← Índices para performance
├── 03-triggers/
│   └── 01-updated-at.sql       ← Trigger de updated_at automático
├── 04-policies/
│   ├── 01-access-requests.sql  ← RLS para solicitações
│   ├── 02-salons.sql           ← RLS para salões
│   └── 03-admin-users.sql      ← RLS para admin
└── 05-seeds/
    └── 01-superadmin.sql       ← Dados iniciais (superadmin)
```

### 🚀 Como Executar

**Opção 1: Executar tudo de uma vez (desenvolvimento/banco novo)**
- Abra o arquivo `run-all.sql`
- Copie e cole todo o conteúdo no Supabase > SQL Editor > New Query
- Clique em "Run"
- ⚠️ Use apenas em bancos novos ou de desenvolvimento

**Opção 2: Executar separadamente (recomendado para produção)**
- Execute os arquivos na ordem numérica (00, 01, 02, 03, 04, 05)
- Vá em Supabase > SQL Editor > New Query > Cole o SQL > Run
- Isso permite mais controle e revisão de cada etapa

### 📋 Tabelas

| Tabela | Descrição | Arquivo |
|--------|-----------|---------|
| `access_requests` | Solicitações de acesso vindas do formulário de cadastro | `01-tables/01-access-requests.sql` |
| `salons` | Salões de beleza cadastrados e aprovados no sistema | `01-tables/02-salons.sql` |
| `admin_users` | Usuários administradores do painel SuperAdmin | `01-tables/03-admin-users.sql` |

### 🔐 Índices

| Índice | Tabela | Coluna | Propósito |
|--------|--------|--------|-----------|
| `idx_access_requests_status` | access_requests | status | Filtrar por status |
| `idx_access_requests_created_at` | access_requests | created_at DESC | Ordenação cronológica |
| `idx_access_requests_email` | access_requests | email | Busca por email |
| `idx_salons_status` | salons | status | Filtrar por status |
| `idx_salons_email` | salons | email | Busca por email |
| `idx_salons_plan` | salons | plan | Filtrar por plano |
| `idx_admin_users_email` | admin_users | email | Busca por email |
| `idx_admin_users_role` | admin_users | role | Filtrar por role |
| `idx_admin_users_user_id` | admin_users | user_id | Lookup por auth user |

### 🔒 Segurança (RLS)

| Tabela | INSERT | SELECT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `access_requests` | ✅ Público (formulário) | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `salons` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `admin_users` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |

### ⚡ Triggers

| Trigger | Tabela | Ação |
|---------|--------|------|
| `update_access_requests_updated_at` | access_requests | Atualiza `updated_at` automaticamente |
| `update_salons_updated_at` | salons | Atualiza `updated_at` automaticamente |
| `update_admin_users_updated_at` | admin_users | Atualiza `updated_at` automaticamente |

### 🌱 Seeds (Dados Iniciais)

Após configurar o banco, você precisa criar o primeiro SuperAdmin:

1. Vá em Supabase > **Authentication** > **Users**
2. Clique em "Add User" > "Create New User"
3. Email: `admin@beautysaas.com` | Senha: (defina uma forte)
4. Copie o UUID do usuário criado
5. Abra `05-seeds/01-superadmin.sql`
6. Descomente o INSERT e substitua `SEU_USER_ID_AQUI` pelo UUID
7. Execute no SQL Editor

### ⚠️ Observações

- Os erros exibidos no VS Code são do linter **T-SQL** — o SQL está correto para **PostgreSQL/Supabase**
- Para suprimir os erros, instale a extensão "PostgreSQL" no VS Code e associe arquivos `.sql` ao modo PostgreSQL
- O arquivo `supabase-schema.sql` na raiz do projeto está descontinuado (mantido apenas como referência)