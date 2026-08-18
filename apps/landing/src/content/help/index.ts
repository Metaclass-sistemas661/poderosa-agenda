import { Calendar, Users, Briefcase, Package, DollarSign, Settings, LayoutDashboard, Scissors, type LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HelpCategory = {
  slug: string
  title: string
  description: string
  icon: LucideIcon
}

export type HelpArticle = {
  slug: string
  categorySlug: string
  title: string
  description: string
  keywords: string[]
  content: HelpArticleContent
}

export type HelpArticleContent = {
  intro: string
  steps?: string[]
  tips?: string[]
  warnings?: string[]
  related?: string[] // article slugs
}

export type HelpSearchResult = {
  article: HelpArticle
  category: HelpCategory
}

// ---------------------------------------------------------------------------
// Categories — Based on REAL salon modules
// ---------------------------------------------------------------------------

export const helpCategories: HelpCategory[] = [
  {
    slug: 'primeiros-passos',
    title: 'Primeiros Passos',
    description: 'Configure sua conta e comece a usar a plataforma',
    icon: LayoutDashboard,
  },
  {
    slug: 'agendamentos',
    title: 'Agendamentos',
    description: 'Como criar, editar e gerenciar sua agenda',
    icon: Calendar,
  },
  {
    slug: 'clientes',
    title: 'Clientes',
    description: 'Cadastro e gestão de clientes',
    icon: Users,
  },
  {
    slug: 'profissionais',
    title: 'Profissionais',
    description: 'Gestão da equipe e profissionais',
    icon: Briefcase,
  },
  {
    slug: 'servicos',
    title: 'Serviços',
    description: 'Cadastro e configuração de serviços',
    icon: Scissors,
  },
  {
    slug: 'financeiro',
    title: 'Financeiro',
    description: 'Controle de caixa, comissões e finanças',
    icon: DollarSign,
  },
  {
    slug: 'estoque',
    title: 'Estoque',
    description: 'Gestão de produtos e inventário',
    icon: Package,
  },
  {
    slug: 'configuracoes',
    title: 'Configurações',
    description: 'Configurações da conta e preferências',
    icon: Settings,
  },
]

// ---------------------------------------------------------------------------
// Articles — Based on REAL functionality verified in /salon/** pages
// ---------------------------------------------------------------------------

export const helpArticles: HelpArticle[] = [
  // === PRIMEIROS PASSOS ===
  {
    slug: 'acessar-dashboard',
    categorySlug: 'primeiros-passos',
    title: 'Como acessar o dashboard',
    description: 'Aprenda a acessar e entender o painel principal',
    keywords: ['dashboard', 'painel', 'inicio', 'home'],
    content: {
      intro: 'O dashboard é a tela inicial do sistema onde você visualiza um resumo das informações mais importantes do seu salão.',
      steps: [
        'Faça login na sua conta',
        'Você será direcionado automaticamente para o Dashboard',
        'No menu lateral, clique em "Dashboard" para voltar a qualquer momento',
      ],
      tips: [
        'O dashboard mostra agendamentos do dia, faturamento e outras métricas',
        'Mantenha o dashboard como página inicial para acompanhar seu negócio',
      ],
    },
  },
  {
    slug: 'navegacao-menu',
    categorySlug: 'primeiros-passos',
    title: 'Navegando pelo menu',
    description: 'Entenda a estrutura do menu e como acessar cada módulo',
    keywords: ['menu', 'navegacao', 'modulos', 'sidebar'],
    content: {
      intro: 'O menu lateral permite acesso rápido a todos os módulos do sistema.',
      steps: [
        'O menu está localizado no lado esquerdo da tela',
        'Clique em qualquer item para acessar o módulo correspondente',
        'Os módulos disponíveis são: Dashboard, Agendamentos, Clientes, Profissionais, Serviços, Estoque, Financeiro e Configurações',
      ],
      tips: [
        'No mobile, o menu pode ser acessado pelo ícone de hambúrguer',
      ],
    },
  },

  // === AGENDAMENTOS ===
  {
    slug: 'criar-agendamento',
    categorySlug: 'agendamentos',
    title: 'Como criar um novo agendamento',
    description: 'Passo a passo para agendar um atendimento',
    keywords: ['criar', 'novo', 'agendamento', 'agendar', 'marcar'],
    content: {
      intro: 'Criar um agendamento permite registrar um atendimento para um cliente específico.',
      steps: [
        'Acesse o menu "Agendamentos"',
        'Clique no botão "Novo Agendamento"',
        'Selecione o cliente (ou cadastre um novo)',
        'Escolha o serviço desejado',
        'Selecione o profissional que irá atender',
        'Escolha a data e horário disponível',
        'Confirme o agendamento',
      ],
      tips: [
        'Verifique se o profissional está disponível no horário escolhido',
        'O sistema mostra automaticamente os horários livres',
      ],
      related: ['editar-agendamento', 'cancelar-agendamento'],
    },
  },
  {
    slug: 'editar-agendamento',
    categorySlug: 'agendamentos',
    title: 'Como editar um agendamento',
    description: 'Altere data, horário ou outras informações',
    keywords: ['editar', 'alterar', 'modificar', 'agendamento'],
    content: {
      intro: 'Você pode alterar as informações de um agendamento existente.',
      steps: [
        'Acesse o menu "Agendamentos"',
        'Localize o agendamento que deseja editar',
        'Clique sobre o agendamento para abrir os detalhes',
        'Faça as alterações necessárias',
        'Salve as mudanças',
      ],
      tips: [
        'Ao alterar o horário, verifique a disponibilidade do profissional',
      ],
      related: ['criar-agendamento', 'cancelar-agendamento'],
    },
  },
  {
    slug: 'cancelar-agendamento',
    categorySlug: 'agendamentos',
    title: 'Como cancelar um agendamento',
    description: 'Cancele um atendimento agendado',
    keywords: ['cancelar', 'desmarcar', 'agendamento'],
    content: {
      intro: 'Caso necessário, você pode cancelar um agendamento.',
      steps: [
        'Acesse o menu "Agendamentos"',
        'Localize o agendamento que deseja cancelar',
        'Clique para abrir os detalhes',
        'Clique em "Cancelar" ou altere o status para "Cancelado"',
        'Confirme a ação',
      ],
      tips: [
        'Agendamentos cancelados ficam registrados no histórico',
      ],
      related: ['criar-agendamento', 'editar-agendamento'],
    },
  },

  // === CLIENTES ===
  {
    slug: 'cadastrar-cliente',
    categorySlug: 'clientes',
    title: 'Como cadastrar um novo cliente',
    description: 'Adicione clientes à sua base',
    keywords: ['cadastrar', 'novo', 'cliente', 'adicionar'],
    content: {
      intro: 'Cadastre seus clientes para agendar atendimentos e manter um histórico.',
      steps: [
        'Acesse o menu "Clientes"',
        'Clique em "Novo Cliente"',
        'Preencha os dados: nome, telefone, e-mail',
        'Salve o cadastro',
      ],
      tips: [
        'O telefone é importante para contato e notificações',
        'Você pode marcar clientes como VIP para identificação rápida',
      ],
      related: ['editar-cliente'],
    },
  },
  {
    slug: 'editar-cliente',
    categorySlug: 'clientes',
    title: 'Como editar dados de um cliente',
    description: 'Atualize informações de clientes cadastrados',
    keywords: ['editar', 'cliente', 'alterar', 'atualizar'],
    content: {
      intro: 'Mantenha os dados dos clientes sempre atualizados.',
      steps: [
        'Acesse o menu "Clientes"',
        'Localize o cliente na lista ou use a busca',
        'Clique no cliente para ver detalhes',
        'Clique em "Editar"',
        'Atualize as informações necessárias',
        'Salve as alterações',
      ],
      related: ['cadastrar-cliente'],
    },
  },

  // === PROFISSIONAIS ===
  {
    slug: 'cadastrar-profissional',
    categorySlug: 'profissionais',
    title: 'Como cadastrar um profissional',
    description: 'Adicione membros da equipe ao sistema',
    keywords: ['cadastrar', 'profissional', 'funcionario', 'equipe'],
    content: {
      intro: 'Cadastre os profissionais que realizam atendimentos no seu salão.',
      steps: [
        'Acesse o menu "Profissionais"',
        'Clique em "Novo Profissional"',
        'Preencha nome, especialidades e taxa de comissão',
        'Configure os dias e horários de trabalho',
        'Salve o cadastro',
      ],
      tips: [
        'A taxa de comissão é usada para calcular ganhos',
        'Configure corretamente os horários para evitar conflitos na agenda',
      ],
    },
  },
  {
    slug: 'configurar-horarios-profissional',
    categorySlug: 'profissionais',
    title: 'Como configurar horários de trabalho',
    description: 'Defina dias e horários de cada profissional',
    keywords: ['horarios', 'trabalho', 'profissional', 'agenda'],
    content: {
      intro: 'Configure quando cada profissional está disponível para atendimentos.',
      steps: [
        'Acesse "Profissionais"',
        'Selecione o profissional',
        'Na seção de horários, defina os dias da semana disponíveis',
        'Configure horário de início e fim para cada dia',
        'Salve as configurações',
      ],
      tips: [
        'Profissionais só aparecem como opção nos horários configurados',
      ],
    },
  },

  // === SERVIÇOS ===
  {
    slug: 'cadastrar-servico',
    categorySlug: 'servicos',
    title: 'Como cadastrar um serviço',
    description: 'Adicione serviços oferecidos pelo salão',
    keywords: ['cadastrar', 'servico', 'novo', 'adicionar'],
    content: {
      intro: 'Cadastre os serviços que seu salão oferece para usá-los nos agendamentos.',
      steps: [
        'Acesse o menu "Serviços"',
        'Clique em "Novo Serviço"',
        'Preencha nome, descrição e categoria',
        'Defina o preço e duração estimada',
        'Salve o serviço',
      ],
      tips: [
        'A duração é importante para calcular disponibilidade na agenda',
        'Organize serviços em categorias para facilitar a busca',
      ],
    },
  },

  // === FINANCEIRO ===
  {
    slug: 'registrar-entrada-caixa',
    categorySlug: 'financeiro',
    title: 'Como registrar uma entrada no caixa',
    description: 'Registre receitas e pagamentos recebidos',
    keywords: ['entrada', 'caixa', 'receita', 'pagamento', 'dinheiro'],
    content: {
      intro: 'Registre entradas financeiras para controlar o caixa do salão.',
      steps: [
        'Acesse "Financeiro" > "Caixa"',
        'Clique em "Nova Entrada"',
        'Selecione a categoria (ex: Serviço, Produto)',
        'Informe o valor e forma de pagamento',
        'Adicione uma descrição se necessário',
        'Salve o registro',
      ],
      tips: [
        'Atendimentos finalizados podem gerar entrada automaticamente',
      ],
      related: ['registrar-despesa', 'visualizar-comissoes'],
    },
  },
  {
    slug: 'registrar-despesa',
    categorySlug: 'financeiro',
    title: 'Como registrar uma despesa',
    description: 'Registre gastos e saídas do caixa',
    keywords: ['despesa', 'gasto', 'saida', 'caixa'],
    content: {
      intro: 'Registre despesas para manter o controle financeiro completo.',
      steps: [
        'Acesse "Financeiro" > "Caixa"',
        'Clique em "Nova Despesa"',
        'Selecione a categoria da despesa',
        'Informe o valor e descrição',
        'Salve o registro',
      ],
      related: ['registrar-entrada-caixa'],
    },
  },
  {
    slug: 'visualizar-comissoes',
    categorySlug: 'financeiro',
    title: 'Como visualizar comissões',
    description: 'Acompanhe as comissões dos profissionais',
    keywords: ['comissoes', 'profissional', 'ganhos'],
    content: {
      intro: 'Visualize quanto cada profissional ganhou em comissões.',
      steps: [
        'Acesse "Financeiro" > "Comissões"',
        'Selecione o período desejado',
        'Visualize o total por profissional',
      ],
      tips: [
        'A comissão é calculada com base na taxa configurada para cada profissional',
      ],
    },
  },

  // === ESTOQUE ===
  {
    slug: 'cadastrar-produto',
    categorySlug: 'estoque',
    title: 'Como cadastrar um produto',
    description: 'Adicione produtos ao estoque',
    keywords: ['cadastrar', 'produto', 'estoque', 'inventario'],
    content: {
      intro: 'Cadastre produtos para controlar o estoque do salão.',
      steps: [
        'Acesse o menu "Estoque"',
        'Clique em "Novo Produto"',
        'Preencha nome, categoria e código de barras (opcional)',
        'Defina preço de venda e custo',
        'Informe a quantidade inicial em estoque',
        'Configure o estoque mínimo para alertas',
        'Salve o produto',
      ],
      tips: [
        'O sistema alerta quando o estoque está abaixo do mínimo',
      ],
    },
  },
  {
    slug: 'ajustar-estoque',
    categorySlug: 'estoque',
    title: 'Como ajustar quantidade em estoque',
    description: 'Atualize a quantidade de produtos',
    keywords: ['ajustar', 'estoque', 'quantidade', 'inventario'],
    content: {
      intro: 'Ajuste a quantidade de produtos quando necessário.',
      steps: [
        'Acesse "Estoque"',
        'Localize o produto',
        'Clique para editar',
        'Atualize a quantidade em estoque',
        'Salve as alterações',
      ],
    },
  },

  // === CONFIGURAÇÕES ===
  {
    slug: 'alterar-dados-conta',
    categorySlug: 'configuracoes',
    title: 'Como alterar dados da conta',
    description: 'Atualize informações do salão e da conta',
    keywords: ['configuracoes', 'conta', 'dados', 'perfil'],
    content: {
      intro: 'Mantenha as informações do seu salão atualizadas.',
      steps: [
        'Acesse o menu "Configurações"',
        'Na seção de dados do salão, clique em "Editar"',
        'Atualize nome, endereço, telefone e outras informações',
        'Salve as alterações',
      ],
    },
  },
  {
    slug: 'alterar-senha',
    categorySlug: 'configuracoes',
    title: 'Como alterar sua senha',
    description: 'Mude a senha de acesso à sua conta',
    keywords: ['senha', 'alterar', 'trocar', 'seguranca'],
    content: {
      intro: 'Por segurança, altere sua senha periodicamente.',
      steps: [
        'Acesse "Configurações"',
        'Vá para a seção de segurança',
        'Clique em "Alterar Senha"',
        'Digite a senha atual',
        'Digite a nova senha',
        'Confirme a nova senha',
        'Salve',
      ],
      tips: [
        'Use uma senha forte com letras, números e caracteres especiais',
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getHelpCategories(): HelpCategory[] {
  return helpCategories
}

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return helpCategories.find((cat) => cat.slug === slug)
}

export function getArticlesByCategory(categorySlug: string): HelpArticle[] {
  return helpArticles.filter((article) => article.categorySlug === categorySlug)
}

export function getArticleBySlug(
  categorySlug: string,
  articleSlug: string
): HelpArticle | undefined {
  return helpArticles.find(
    (article) =>
      article.categorySlug === categorySlug && article.slug === articleSlug
  )
}

export function getAllArticles(): HelpArticle[] {
  return helpArticles
}

export function searchHelpArticles(query: string): HelpSearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: HelpSearchResult[] = []

  for (const article of helpArticles) {
    const matchTitle = article.title.toLowerCase().includes(q)
    const matchDescription = article.description.toLowerCase().includes(q)
    const matchKeywords = article.keywords.some((kw) =>
      kw.toLowerCase().includes(q)
    )
    const matchContent = article.content.intro.toLowerCase().includes(q)

    if (matchTitle || matchDescription || matchKeywords || matchContent) {
      const category = getCategoryBySlug(article.categorySlug)
      if (category) {
        results.push({ article, category })
      }
    }
  }

  return results
}

export function getRelatedArticles(article: HelpArticle): HelpArticle[] {
  if (!article.content.related || article.content.related.length === 0) {
    // Fallback: return other articles from same category
    return getArticlesByCategory(article.categorySlug)
      .filter((a) => a.slug !== article.slug)
      .slice(0, 3)
  }

  return article.content.related
    .map((slug) => helpArticles.find((a) => a.slug === slug))
    .filter((a): a is HelpArticle => a !== undefined)
}

export function getArticleCount(categorySlug: string): number {
  return helpArticles.filter((a) => a.categorySlug === categorySlug).length
}