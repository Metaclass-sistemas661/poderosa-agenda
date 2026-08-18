/**
 * Changelog Estruturado - Poderosa Agenda
 * 
 * Cada release contém:
 * - version: Versão semântica
 * - date: Data de lançamento
 * - title: Título amigável
 * - description: Descrição geral
 * - changes: Mudanças categorizadas
 */

export type ChangeCategory = 'feature' | 'improvement' | 'fix' | 'security' | 'performance' | 'breaking'

export interface Change {
  category: ChangeCategory
  title: string
  description?: string
}

export interface Release {
  version: string
  date: string
  title: string
  description: string
  isHighlight?: boolean
  changes: Change[]
}

export const CHANGELOG: Release[] = [
  {
    version: '1.0.0',
    date: '2026-08-04',
    title: 'Lançamento Oficial 🚀',
    description: 'Primeira versão estável do Poderosa Agenda - Sistema completo de gestão para salões de beleza.',
    isHighlight: true,
    changes: [
      // Features principais
      { category: 'feature', title: 'Dashboard Inteligente', description: 'KPIs em tempo real, comparativos e alertas automáticos' },
      { category: 'feature', title: 'Agendamentos Completo', description: 'Criação, edição, confirmação e cancelamento de agendamentos' },
      { category: 'feature', title: 'Gestão de Clientes', description: 'Cadastro completo com histórico de atendimentos' },
      { category: 'feature', title: 'Catálogo de Serviços', description: 'Serviços com preços, duração e profissionais vinculados' },
      { category: 'feature', title: 'Gestão de Equipe', description: 'Profissionais com horários, comissões e especialidades' },
      { category: 'feature', title: 'Módulo Financeiro', description: 'Controle de receitas, despesas e fluxo de caixa' },
      { category: 'feature', title: 'Controle de Estoque', description: 'Produtos com alertas de estoque mínimo' },
      
      // Melhorias de UX
      { category: 'improvement', title: 'Notificações em Tempo Real', description: 'Alertas instantâneos via Supabase Realtime' },
      { category: 'improvement', title: 'Interface Responsiva', description: 'Design mobile-first, funciona em qualquer dispositivo' },
      { category: 'improvement', title: 'Tema Claro/Escuro', description: 'Alternância entre temas com persistência' },
      { category: 'improvement', title: 'Animações Suaves', description: 'Transições com Framer Motion' },
      
      // Segurança
      { category: 'security', title: 'Multi-Tenant Completo', description: 'Isolamento total de dados por salão via RLS' },
      { category: 'security', title: 'Autenticação Segura', description: 'Login via Supabase Auth com sessão persistente' },
      { category: 'security', title: 'Controle de Acesso', description: 'Superadmin vs Admin de Salão com permissões específicas' },
      
      // Performance
      { category: 'performance', title: 'Carregamento Otimizado', description: 'Server-side rendering com Next.js 14' },
      { category: 'performance', title: 'Índices de Banco', description: 'Queries otimizadas com índices compostos' },
    ]
  },
  // Template para futuras versões
  // {
  //   version: '1.1.0',
  //   date: '2026-09-01',
  //   title: 'Nome da Versão',
  //   description: 'Descrição das mudanças',
  //   changes: [
  //     { category: 'feature', title: 'Nova funcionalidade', description: 'Detalhes' },
  //   ]
  // }
]

/**
 * Retorna o changelog mais recente
 */
export function getLatestRelease(): Release {
  return CHANGELOG[0]
}

/**
 * Retorna releases desde uma versão específica
 */
export function getReleasesSince(version: string): Release[] {
  const index = CHANGELOG.findIndex(r => r.version === version)
  if (index === -1) return CHANGELOG
  return CHANGELOG.slice(0, index)
}

/**
 * Retorna a configuração de categoria
 */
export function getCategoryConfig(category: ChangeCategory) {
  const configs: Record<ChangeCategory, { label: string; color: string; bgColor: string }> = {
    feature: { label: 'Novo', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    improvement: { label: 'Melhoria', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    fix: { label: 'Correção', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    security: { label: 'Segurança', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    performance: { label: 'Performance', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    breaking: { label: 'Atenção', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  }
  return configs[category]
}