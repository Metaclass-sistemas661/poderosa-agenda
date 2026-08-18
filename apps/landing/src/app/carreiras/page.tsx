import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Users, Coffee, Laptop, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'

const perks = [
  { icon: Laptop, title: 'Remoto 100%', description: 'Trabalhe de onde quiser, com flexibilidade total de horário.' },
  { icon: Heart, title: 'Plano de Saúde', description: 'Cobertura médica e odontológica para você e seus dependentes.' },
  { icon: Zap, title: 'Desenvolvimento', description: 'Budget anual para cursos, livros e eventos da sua área.' },
  { icon: Coffee, title: 'Home Office Kit', description: 'Equipamentos e auxílio para montar seu escritório em casa.' },
  { icon: Star, title: 'Stock Options', description: 'Participação nos resultados e opção de ações da empresa.' },
  { icon: Users, title: 'Time Incrível', description: 'Trabalhe com pessoas apaixonadas por impactar o setor de beleza.' },
]

const openings = [
  {
    title: 'Engenheiro(a) Full Stack',
    area: 'Tecnologia',
    areaColor: 'bg-violet-100 text-violet-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Pleno / Sênior',
    description: 'Buscamos engenheiro(a) com experiência em React, Next.js, Node.js e PostgreSQL para evoluir nossa plataforma SaaS.',
    tags: ['React', 'Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    title: 'Designer de Produto (UX/UI)',
    area: 'Produto',
    areaColor: 'bg-rose-100 text-rose-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Pleno',
    description: 'Profissional de design com forte foco em UX para criar interfaces intuitivas e belas para donos de salões de beleza.',
    tags: ['Figma', 'Design System', 'User Research', 'Prototipação'],
  },
  {
    title: 'Analista de Customer Success',
    area: 'Customer Success',
    areaColor: 'bg-emerald-100 text-emerald-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Júnior / Pleno',
    description: 'Profissional dedicado a garantir que nossos clientes tenham sucesso na plataforma, reduzindo churn e aumentando NPS.',
    tags: ['Relacionamento', 'CRM', 'Onboarding', 'Retenção'],
  },
  {
    title: 'Especialista em Marketing de Conteúdo',
    area: 'Marketing',
    areaColor: 'bg-amber-100 text-amber-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Pleno',
    description: 'Profissional criativo para produzir conteúdo relevante sobre gestão de salões, SEO e redes sociais para nossa audiência.',
    tags: ['SEO', 'Blog', 'Redes Sociais', 'Copywriting'],
  },
  {
    title: 'Analista de Dados',
    area: 'Tecnologia',
    areaColor: 'bg-violet-100 text-violet-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Pleno',
    description: 'Profissional de dados para construir dashboards, pipelines e insights que guiam as decisões do negócio e do produto.',
    tags: ['SQL', 'Python', 'Power BI', 'dbt'],
  },
  {
    title: 'Executivo(a) de Vendas (SDR)',
    area: 'Comercial',
    areaColor: 'bg-cyan-100 text-cyan-700',
    type: 'CLT',
    location: 'Remoto',
    level: 'Júnior',
    description: 'Profissional de vendas para prospectar e qualificar donos de salão, apresentando a plataforma e convertendo em clientes.',
    tags: ['Prospecção', 'CRM', 'Inside Sales', 'SaaS'],
  },
]

const values = [
  { emoji: '🚀', title: 'Velocidade', description: 'Entregamos rápido, aprendemos rápido e melhoramos constantemente.' },
  { emoji: '🤝', title: 'Confiança', description: 'Transparência e honestidade em todas as relações, internas e externas.' },
  { emoji: '💡', title: 'Inovação', description: 'Questionamos o status quo e buscamos soluções criativas para problemas reais.' },
  { emoji: '❤️', title: 'Impacto', description: 'Cada linha de código, cada conteúdo, cada atendimento transforma um salão.' },
]

export default function CarreirasPage() {
  return (
    <>
      <Header />

      {/* Banner */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 40%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32C840 35 960 40 1080 42C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Briefcase className="w-4 h-4 text-amber-300" />
            <span className="text-white/90 text-sm font-medium">Trabalhe Conosco</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Construa o futuro da{' '}
            <span className="text-amber-300">beleza com a gente</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Somos um time remoto, apaixonado por tecnologia e pelo impacto real que geramos para milhares de profissionais de beleza no Brasil.
          </p>
          <div className="flex flex-wrap gap-6 justify-center text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-300" />
              <span>+30 pessoas no time</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>100% remoto</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ambiente de alto crescimento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-4">Benefícios</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Por que trabalhar na Poderosa Agenda?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Acreditamos que um time feliz constrói produtos incríveis. Por isso, investimos pesado no bem-estar e crescimento de cada pessoa.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-start gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <perk.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{perk.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{perk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultura */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full mb-4">Nossa Cultura</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Os valores que guiam nosso time
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-sm border border-violet-100 text-center">
                <div className="text-4xl mb-4">{v.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vagas Abertas */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-4">Vagas Abertas</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              {openings.length} oportunidades disponíveis
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Todas as posições são remotas e oferecem contratação CLT com benefícios completos.
            </p>
          </div>
          <div className="space-y-4 max-w-4xl mx-auto">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${job.areaColor}`}>
                        {job.area}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </div>
                      <span className="text-xs text-gray-500">• {job.level}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-50 group-hover:bg-violet-600 rounded-xl flex items-center justify-center transition-colors">
                    <ArrowRight className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Candidatura espontânea */}
          <div className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-center text-white">
            <Briefcase className="w-10 h-10 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold mb-3">Não encontrou sua vaga?</h3>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Enviamos candidaturas espontâneas! Se você é uma pessoa excepcional e quer fazer parte do nosso time, mande seu currículo.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Enviar Candidatura Espontânea
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        {/* Wave transition */}
        <div className="absolute -top-[59px] left-0 right-0 w-full overflow-hidden">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block rotate-180" preserveAspectRatio="none" style={{ height: '60px' }}>
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32C840 35 960 40 1080 42C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
        <Footer className="bg-transparent pt-20" />
      </div>
    </>
  )
}
