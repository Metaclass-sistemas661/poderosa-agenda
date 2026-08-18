import {
  BookOpen,
  Calendar,
  Users,
  Briefcase,
  Scissors,
  DollarSign,
  Package,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types — Similar to Help Center but for structured documentation
// ---------------------------------------------------------------------------

export type DocSection = {
  slug: string
  title: string
  description: string
  icon: LucideIcon
  order: number
}

export type DocGuide = {
  slug: string
  sectionSlug: string
  title: string
  description: string
  keywords: string[]
  order: number
  content: DocGuideContent
}

export type DocGuideContent = {
  intro: string
  sections: DocContentSection[]
  nextSteps?: string[]
}

export type DocContentSection = {
  id: string
  title: string
  content: string
  steps?: string[]
  tip?: string
}

export type DocSearchResult = {
  guide: DocGuide
  section: DocSection
}

// ---------------------------------------------------------------------------
// Sections — Based on REAL product modules in /salon/**
// ---------------------------------------------------------------------------

export const docSections: DocSection[] = [
  {
    slug: 'comecando',
    title: 'Começando',
    description: 'Primeiros passos para configurar e usar a plataforma',
    icon: LayoutDashboard,
    order: 1,
  },
  {
    slug: 'agenda',
    title: 'Agenda',
    description: 'Gerencie agendamentos, horários e disponibilidade',
    icon: Calendar,
    order: 2,
  },
  {
    slug: 'clientes',
    title: 'Clientes',
    description: 'Cadastro, histórico e gestão de clientes',
    icon: Users,
    order: 3,
  },
  {
    slug: 'profissionais',
    title: 'Profissionais',
    description: 'Gestão de equipe, horários e comissões',
    icon: Briefcase,
    order: 4,
  },
  {
    slug: 'servicos',
    title: 'Serviços',
    description: 'Cadastro e configuração de serviços oferecidos',
    icon: Scissors,
    order: 5,
  },
  {
    slug: 'financeiro',
    title: 'Financeiro',
    description: 'Controle de caixa, receitas, despesas e comissões',
    icon: DollarSign,
    order: 6,
  },
  {
    slug: 'estoque',
    title: 'Estoque',
    description: 'Gestão de produtos e controle de inventário',
    icon: Package,
    order: 7,
  },
  {
    slug: 'configuracoes',
    title: 'Configurações',
    description: 'Preferências da conta e configurações do sistema',
    icon: Settings,
    order: 8,
  },
]

// ---------------------------------------------------------------------------
// Guides — Based on REAL functionality verified in /salon/** pages
// ---------------------------------------------------------------------------

export const docGuides: DocGuide[] = [
  // === COMEÇANDO ===
  {
    slug: 'visao-geral',
    sectionSlug: 'comecando',
    title: 'Visão geral da plataforma',
    description: 'Conheça os principais módulos e funcionalidades',
    keywords: ['visao', 'geral', 'introducao', 'plataforma'],
    order: 1,
    content: {
      intro:
        'A Poderosa Agenda é uma plataforma completa para gestão de salões de beleza. Este guia apresenta os principais módulos disponíveis.',
      sections: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          content:
            'O dashboard é a tela inicial onde você visualiza um resumo do seu negócio: agendamentos do dia, faturamento e métricas importantes.',
        },
        {
          id: 'modulos',
          title: 'Módulos disponíveis',
          content: 'A plataforma está organizada em módulos acessíveis pelo menu lateral:',
          steps: [
            'Agenda — Gerencie agendamentos e horários',
            'Clientes — Cadastre e acompanhe seus clientes',
            'Profissionais — Gerencie sua equipe',
            'Serviços — Configure os serviços oferecidos',
            'Financeiro — Controle caixa e finanças',
            'Estoque — Gerencie produtos',
            'Configurações — Personalize o sistema',
          ],
        },
      ],
      nextSteps: ['configuracao-inicial', 'primeiro-agendamento'],
    },
  },
  {
    slug: 'configuracao-inicial',
    sectionSlug: 'comecando',
    title: 'Configuração inicial',
    description: 'Configure seu salão para começar a usar o sistema',
    keywords: ['configuracao', 'inicial', 'setup', 'comecar'],
    order: 2,
    content: {
      intro:
        'Antes de começar a usar a plataforma, é importante configurar as informações básicas do seu salão.',
      sections: [
        {
          id: 'dados-salao',
          title: 'Dados do salão',
          content: 'Acesse Configurações e preencha os dados do seu estabelecimento:',
          steps: [
            'Nome do salão',
            'Endereço completo',
            'Telefone de contato',
            'Horário de funcionamento',
          ],
        },
        {
          id: 'profissionais',
          title: 'Cadastre sua equipe',
          content: 'Adicione os profissionais que trabalham no salão em Profissionais > Novo Profissional.',
          tip: 'Configure os horários de trabalho de cada profissional para que eles apareçam corretamente na agenda.',
        },
        {
          id: 'servicos',
          title: 'Cadastre seus serviços',
          content: 'Em Serviços, adicione todos os serviços oferecidos com nome, preço e duração.',
          tip: 'A duração do serviço é importante para calcular a disponibilidade na agenda.',
        },
      ],
      nextSteps: ['primeiro-agendamento'],
    },
  },
  {
    slug: 'primeiro-agendamento',
    sectionSlug: 'comecando',
    title: 'Criando seu primeiro agendamento',
    description: 'Aprenda a criar um agendamento do início ao fim',
    keywords: ['primeiro', 'agendamento', 'criar', 'tutorial'],
    order: 3,
    content: {
      intro: 'Este guia mostra como criar um agendamento completo no sistema.',
      sections: [
        {
          id: 'passo-a-passo',
          title: 'Passo a passo',
          content: 'Siga os passos abaixo para criar seu primeiro agendamento:',
          steps: [
            'Acesse o módulo Agendamentos no menu lateral',
            'Clique no botão "Novo Agendamento"',
            'Selecione o cliente (ou cadastre um novo)',
            'Escolha o serviço desejado',
            'Selecione o profissional que irá atender',
            'Escolha a data e horário disponível',
            'Revise as informações e confirme',
          ],
        },
        {
          id: 'dicas',
          title: 'Dicas importantes',
          content: 'O sistema mostra automaticamente os horários disponíveis baseado na agenda dos profissionais e na duração dos serviços.',
          tip: 'Certifique-se de que os profissionais e serviços estejam cadastrados antes de criar agendamentos.',
        },
      ],
    },
  },

  // === AGENDA ===
  {
    slug: 'gerenciando-agenda',
    sectionSlug: 'agenda',
    title: 'Gerenciando a agenda',
    description: 'Como visualizar e organizar seus agendamentos',
    keywords: ['agenda', 'visualizar', 'organizar', 'calendario'],
    order: 1,
    content: {
      intro:
        'O módulo de Agenda é o coração do sistema, onde você visualiza e gerencia todos os atendimentos.',
      sections: [
        {
          id: 'visualizacao',
          title: 'Visualização da agenda',
          content: 'A agenda pode ser visualizada em diferentes formatos para facilitar o planejamento:',
          steps: [
            'Dia — Veja todos os agendamentos de um dia específico',
            'Semana — Visualize a semana inteira para planejamento',
            'Por profissional — Filtre por profissional específico',
          ],
        },
        {
          id: 'status',
          title: 'Status dos agendamentos',
          content: 'Cada agendamento possui um status que indica sua situação:',
          steps: [
            'Agendado — Agendamento confirmado aguardando atendimento',
            'Em andamento — Atendimento iniciado',
            'Concluído — Atendimento finalizado',
            'Cancelado — Agendamento foi cancelado',
          ],
        },
      ],
    },
  },
  {
    slug: 'editar-agendamento',
    sectionSlug: 'agenda',
    title: 'Editando agendamentos',
    description: 'Como alterar ou cancelar agendamentos existentes',
    keywords: ['editar', 'alterar', 'cancelar', 'agendamento'],
    order: 2,
    content: {
      intro: 'Você pode editar ou cancelar agendamentos a qualquer momento.',
      sections: [
        {
          id: 'editar',
          title: 'Editando um agendamento',
          content: 'Para alterar um agendamento existente:',
          steps: [
            'Localize o agendamento na agenda',
            'Clique sobre ele para abrir os detalhes',
            'Altere as informações necessárias (horário, serviço, profissional)',
            'Salve as alterações',
          ],
          tip: 'Ao alterar o horário, verifique se o profissional está disponível no novo horário.',
        },
        {
          id: 'cancelar',
          title: 'Cancelando um agendamento',
          content: 'Para cancelar um agendamento:',
          steps: [
            'Abra os detalhes do agendamento',
            'Clique em "Cancelar" ou altere o status para "Cancelado"',
            'Confirme a ação',
          ],
          tip: 'Agendamentos cancelados permanecem no histórico para referência.',
        },
      ],
    },
  },

  // === CLIENTES ===
  {
    slug: 'cadastro-clientes',
    sectionSlug: 'clientes',
    title: 'Cadastro de clientes',
    description: 'Como cadastrar e gerenciar sua base de clientes',
    keywords: ['cadastro', 'cliente', 'adicionar', 'base'],
    order: 1,
    content: {
      intro: 'O módulo de Clientes permite manter uma base organizada com informações de contato e histórico.',
      sections: [
        {
          id: 'novo-cliente',
          title: 'Cadastrando um cliente',
          content: 'Para adicionar um novo cliente:',
          steps: [
            'Acesse Clientes no menu',
            'Clique em "Novo Cliente"',
            'Preencha os dados: nome, telefone, e-mail',
            'Salve o cadastro',
          ],
          tip: 'O telefone é essencial para contato e notificações.',
        },
        {
          id: 'cliente-vip',
          title: 'Clientes VIP',
          content: 'Você pode marcar clientes como VIP para identificação rápida na lista e nos agendamentos.',
        },
      ],
    },
  },

  // === PROFISSIONAIS ===
  {
    slug: 'gestao-equipe',
    sectionSlug: 'profissionais',
    title: 'Gestão da equipe',
    description: 'Cadastre profissionais e configure horários de trabalho',
    keywords: ['profissional', 'equipe', 'funcionario', 'horario'],
    order: 1,
    content: {
      intro: 'Gerencie os profissionais que realizam atendimentos no seu salão.',
      sections: [
        {
          id: 'cadastro',
          title: 'Cadastrando profissionais',
          content: 'Para adicionar um profissional:',
          steps: [
            'Acesse Profissionais no menu',
            'Clique em "Novo Profissional"',
            'Preencha nome, especialidades e taxa de comissão',
            'Configure os dias e horários de trabalho',
            'Salve o cadastro',
          ],
        },
        {
          id: 'horarios',
          title: 'Configurando horários',
          content: 'Os horários de trabalho determinam quando o profissional aparece como disponível na agenda:',
          steps: [
            'Defina os dias da semana que trabalha',
            'Configure horário de início e fim para cada dia',
          ],
          tip: 'Profissionais só aparecem como opção nos horários configurados.',
        },
        {
          id: 'comissao',
          title: 'Taxa de comissão',
          content: 'A taxa de comissão define o percentual que o profissional recebe sobre os atendimentos realizados.',
        },
      ],
    },
  },

  // === SERVIÇOS ===
  {
    slug: 'cadastro-servicos',
    sectionSlug: 'servicos',
    title: 'Cadastro de serviços',
    description: 'Configure os serviços oferecidos pelo salão',
    keywords: ['servico', 'cadastro', 'preco', 'duracao'],
    order: 1,
    content: {
      intro: 'Cadastre todos os serviços oferecidos para usá-los nos agendamentos.',
      sections: [
        {
          id: 'novo-servico',
          title: 'Cadastrando um serviço',
          content: 'Para adicionar um serviço:',
          steps: [
            'Acesse Serviços no menu',
            'Clique em "Novo Serviço"',
            'Preencha nome e descrição',
            'Defina o preço',
            'Configure a duração estimada',
            'Salve o serviço',
          ],
          tip: 'A duração é usada para calcular disponibilidade na agenda.',
        },
        {
          id: 'categorias',
          title: 'Organizando por categorias',
          content: 'Organize seus serviços em categorias para facilitar a busca durante os agendamentos.',
        },
      ],
    },
  },

  // === FINANCEIRO ===
  {
    slug: 'controle-financeiro',
    sectionSlug: 'financeiro',
    title: 'Controle financeiro',
    description: 'Gerencie receitas, despesas e o fluxo de caixa',
    keywords: ['financeiro', 'caixa', 'receita', 'despesa'],
    order: 1,
    content: {
      intro: 'O módulo Financeiro oferece controle completo do fluxo de caixa do seu salão.',
      sections: [
        {
          id: 'entradas',
          title: 'Registrando entradas',
          content: 'Para registrar uma receita:',
          steps: [
            'Acesse Financeiro > Caixa',
            'Clique em "Nova Entrada"',
            'Selecione a categoria',
            'Informe valor e forma de pagamento',
            'Salve o registro',
          ],
          tip: 'Atendimentos finalizados podem gerar entradas automaticamente.',
        },
        {
          id: 'saidas',
          title: 'Registrando despesas',
          content: 'Para registrar uma despesa:',
          steps: [
            'Acesse Financeiro > Caixa',
            'Clique em "Nova Despesa"',
            'Selecione a categoria',
            'Informe valor e descrição',
            'Salve o registro',
          ],
        },
      ],
    },
  },
  {
    slug: 'comissoes',
    sectionSlug: 'financeiro',
    title: 'Comissões',
    description: 'Visualize e gerencie as comissões dos profissionais',
    keywords: ['comissao', 'profissional', 'pagamento', 'ganhos'],
    order: 2,
    content: {
      intro: 'Acompanhe quanto cada profissional ganhou em comissões.',
      sections: [
        {
          id: 'visualizar',
          title: 'Visualizando comissões',
          content: 'Para ver as comissões:',
          steps: [
            'Acesse Financeiro > Comissões',
            'Selecione o período desejado',
            'Visualize o total por profissional',
          ],
        },
        {
          id: 'calculo',
          title: 'Como é calculado',
          content: 'A comissão é calculada automaticamente com base na taxa configurada no cadastro de cada profissional.',
        },
      ],
    },
  },

  // === ESTOQUE ===
  {
    slug: 'gestao-estoque',
    sectionSlug: 'estoque',
    title: 'Gestão de estoque',
    description: 'Cadastre produtos e controle o inventário',
    keywords: ['estoque', 'produto', 'inventario', 'quantidade'],
    order: 1,
    content: {
      intro: 'O módulo de Estoque permite controlar os produtos do seu salão.',
      sections: [
        {
          id: 'cadastro',
          title: 'Cadastrando produtos',
          content: 'Para adicionar um produto:',
          steps: [
            'Acesse Estoque no menu',
            'Clique em "Novo Produto"',
            'Preencha nome e categoria',
            'Defina preço de venda e custo',
            'Informe quantidade em estoque',
            'Configure estoque mínimo para alertas',
            'Salve o produto',
          ],
          tip: 'O sistema alerta quando o estoque está abaixo do mínimo.',
        },
        {
          id: 'ajustes',
          title: 'Ajustando estoque',
          content: 'Para ajustar a quantidade de um produto, localize-o na lista, clique para editar e atualize a quantidade.',
        },
      ],
    },
  },

  // === CONFIGURAÇÕES ===
  {
    slug: 'configuracoes-conta',
    sectionSlug: 'configuracoes',
    title: 'Configurações da conta',
    description: 'Personalize as configurações do sistema',
    keywords: ['configuracao', 'conta', 'preferencias', 'perfil'],
    order: 1,
    content: {
      intro: 'Acesse Configurações para personalizar o sistema.',
      sections: [
        {
          id: 'dados',
          title: 'Dados do salão',
          content: 'Atualize as informações do seu estabelecimento como nome, endereço e horário de funcionamento.',
        },
        {
          id: 'senha',
          title: 'Alterando a senha',
          content: 'Para alterar sua senha:',
          steps: [
            'Acesse Configurações',
            'Vá para a seção de segurança',
            'Clique em "Alterar Senha"',
            'Digite a senha atual e a nova senha',
            'Confirme',
          ],
          tip: 'Use uma senha forte com letras, números e caracteres especiais.',
        },
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getDocSections(): DocSection[] {
  return docSections.sort((a, b) => a.order - b.order)
}

export function getSectionBySlug(slug: string): DocSection | undefined {
  return docSections.find((s) => s.slug === slug)
}

export function getGuidesBySection(sectionSlug: string): DocGuide[] {
  return docGuides
    .filter((g) => g.sectionSlug === sectionSlug)
    .sort((a, b) => a.order - b.order)
}

export function getGuideBySlug(sectionSlug: string, guideSlug: string): DocGuide | undefined {
  return docGuides.find((g) => g.sectionSlug === sectionSlug && g.slug === guideSlug)
}

export function getAllGuides(): DocGuide[] {
  return docGuides.sort((a, b) => {
    const sectionA = docSections.find((s) => s.slug === a.sectionSlug)?.order ?? 0
    const sectionB = docSections.find((s) => s.slug === b.sectionSlug)?.order ?? 0
    if (sectionA !== sectionB) return sectionA - sectionB
    return a.order - b.order
  })
}

export function searchDocumentation(query: string): DocSearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: DocSearchResult[] = []

  for (const guide of docGuides) {
    const matchTitle = guide.title.toLowerCase().includes(q)
    const matchDescription = guide.description.toLowerCase().includes(q)
    const matchKeywords = guide.keywords.some((kw) => kw.toLowerCase().includes(q))
    const matchIntro = guide.content.intro.toLowerCase().includes(q)

    if (matchTitle || matchDescription || matchKeywords || matchIntro) {
      const section = getSectionBySlug(guide.sectionSlug)
      if (section) {
        results.push({ guide, section })
      }
    }
  }

  return results
}

export function getGuideCount(sectionSlug: string): number {
  return docGuides.filter((g) => g.sectionSlug === sectionSlug).length
}

export function getPrevNextGuides(
  sectionSlug: string,
  guideSlug: string
): { prev: DocGuide | null; next: DocGuide | null } {
  const allGuides = getAllGuides()
  const currentIndex = allGuides.findIndex(
    (g) => g.sectionSlug === sectionSlug && g.slug === guideSlug
  )

  return {
    prev: currentIndex > 0 ? allGuides[currentIndex - 1] : null,
    next: currentIndex < allGuides.length - 1 ? allGuides[currentIndex + 1] : null,
  }
}