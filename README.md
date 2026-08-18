# 🏪 Poderosa Agenda - Sistema para Salões de Beleza

> SaaS completo para gestão de salões de beleza com agendamento online, controle financeiro e dashboard profissional.

## 📁 Estrutura do Projeto

```
├── apps/
│   ├── web/                    # Aplicação Next.js principal
│   │   ├── src/
│   │   │   ├── app/            # App Router (páginas)
│   │   │   ├── components/     # Componentes React
│   │   │   ├── hooks/          # Custom Hooks
│   │   │   ├── lib/            # Utilitários e configurações
│   │   │   ├── services/       # Serviços e API calls
│   │   │   ├── styles/         # Estilos globais
│   │   │   └── types/          # TypeScript types
│   │   └── public/             # Assets estáticos
│   │
│   └── landing/                # Landing Page
│       ├── src/
│       │   ├── components/     # Componentes da landing
│       │   ├── sections/       # Seções da página
│       │   └── assets/         # Imagens e ícones
│       └── public/
│
├── packages/
│   ├── database/               # Schema e migrações Supabase
│   │   ├── migrations/         # Arquivos de migração
│   │   ├── seeds/              # Dados iniciais
│   │   └── schema/             # Definições de tabelas
│   │
│   ├── shared/                 # Código compartilhado
│   │   ├── types/              # Types compartilhados
│   │   ├── utils/              # Funções utilitárias
│   │   └── constants/          # Constantes
│   │
│   └── ui/                     # Componentes UI reutilizáveis
│       └── components/
│
├── docs/                       # Documentação
│   ├── api/                    # Documentação da API
│   ├── setup/                  # Guias de instalação
│   └── features/               # Documentação de features
│
└── scripts/                    # Scripts de automação
```

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Deploy**: Firebase App Hosting
- **Gráficos**: Recharts

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

## 🌐 Ambientes

- **Desenvolvimento**: http://localhost:3000
- **Produção**: (Gerenciado pelo Firebase App Hosting)

---

Desenvolvido com ❤️