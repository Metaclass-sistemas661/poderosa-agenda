'use client'
import { PublicPageLayout, PageSection, SectionTitle, SupportBanner } from '@/components/public'
import { Users, MessageSquare, Star, TrendingUp, ArrowRight, Heart, BookOpen } from 'lucide-react'
import Link from 'next/link'

const channels = [
  { icon: MessageSquare, title: 'Grupo no WhatsApp', description: 'Tire dúvidas e compartilhe experiências com outros donos de salão.', members: '2.4K membros', color: 'bg-emerald-50 text-emerald-600', action: 'Entrar no grupo' },
  { icon: Users, title: 'Fórum Online', description: 'Discussões aprofundadas, dicas e soluções para desafios do dia a dia.', members: '1.8K usuários', color: 'bg-primary-50 text-primary-600', action: 'Acessar fórum' },
  { icon: Star, title: 'Programa de Embaixadores', description: 'Torne-se um embaixador e ajude outros profissionais a crescerem.', members: '320 embaixadores', color: 'bg-amber-50 text-amber-600', action: 'Quero ser embaixador' },
]

const highlights = [
  { name: 'Fernanda Costa', role: 'Dona de salão — SP', quote: 'A comunidade me ajudou a configurar o módulo financeiro em minutos. Incrível o nível de suporte dos outros usuários!', avatar: 'FC' },
  { name: 'Ricardo Alves', role: 'Barbeiro — RJ', quote: 'Aprendi mais sobre gestão de negócios no fórum da Poderosa Agenda do que em qualquer curso que já fiz.', avatar: 'RA' },
  { name: 'Mariana Silva', role: 'Esteticista — MG', quote: 'O grupo do WhatsApp é sensacional. Sempre tem alguém disposto a ajudar. Me sinto parte de uma família!', avatar: 'MS' },
]

const topics = [
  { title: 'Como organizar a agenda de alta demanda', replies: 47, views: '1.2K' },
  { title: 'Dicas para fidelizar clientes no verão', replies: 32, views: '890' },
  { title: 'Calculando comissões de forma justa', replies: 28, views: '760' },
  { title: 'Como lidar com cancelamentos de última hora', replies: 55, views: '2.1K' },
]

export default function ComunidadePage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Heart, text: 'Comunidade' },
        title: 'A comunidade dos profissionais de beleza',
        subtitle: 'Conecte-se com mais de 4.000 donos de salão, compartilhe experiências, tire dúvidas e cresça junto com quem entende os seus desafios.',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Comunidade' },
        ],
      }}
    >
      {/* Stats row directly after hero */}
      <PageSection className="py-8 pb-12 border-b border-slate-200">
        <div className="container-custom max-w-4xl">
          <div className="flex flex-wrap gap-8 justify-center items-center text-slate-600 font-medium">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary-500" /><span>4.200+ membros</span></div>
            <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary-500" /><span>15K+ mensagens por mês</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" /><span>Crescendo todo dia</span></div>
          </div>
        </div>
      </PageSection>

      {/* Canais */}
      <PageSection className="py-16 md:py-24 bg-slate-50/50">
        <div className="container-custom">
          <SectionTitle
            title="Escolha seu canal"
            subtitle="Participe do jeito que preferir — redes sociais, fórum ou programa de embaixadores."
            size="md"
          />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {channels.map((ch) => {
              const Icon = ch.icon
              return (
                <div key={ch.title} className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-md hover:border-primary-300 transition-all text-center group flex flex-col h-full">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform ${ch.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">{ch.title}</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">{ch.description}</p>
                  <p className="text-primary-600 text-xs font-bold mb-6">{ch.members}</p>
                  <button className="w-full py-3 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 border border-primary-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    {ch.action} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </PageSection>

      {/* Destaques do Fórum & Depoimentos */}
      <PageSection className="py-16 md:py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <SectionTitle
                title="Discussões populares"
                subtitle="Em alta no fórum"
                size="sm"
                align="left"
              />
              <div className="space-y-4 mt-8">
                {topics.map((topic, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 px-6 py-5 hover:shadow-sm hover:border-primary-300 transition-all cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-100">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{topic.title}</p>
                    </div>
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-4 flex-shrink-0 ml-4">
                      <span>{topic.replies} resp.</span>
                      <span>{topic.views} views</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle
                title="O que dizem nossos membros"
                subtitle="Vozes da comunidade"
                size="sm"
                align="left"
              />
              <div className="space-y-4 mt-8">
                {highlights.map((h) => (
                  <div key={h.name} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <p className="text-slate-600 text-sm leading-relaxed mb-5 italic font-medium">&ldquo;{h.quote}&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-100 border border-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 text-xs font-bold">{h.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{h.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{h.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* CTA section using SupportBanner */}
      <PageSection className="pb-16 md:pb-24">
        <div className="container-custom max-w-4xl">
          <SupportBanner
            title="Faça parte da comunidade"
            description="É gratuito para todos os usuários da Poderosa Agenda. Clique e entre agora mesmo para tirar dúvidas e aprender."
            action={{
              label: 'Criar conta grátis',
              href: '/cadastro',
            }}
            variant="default"
          />
        </div>
      </PageSection>

    </PublicPageLayout>
  )
}