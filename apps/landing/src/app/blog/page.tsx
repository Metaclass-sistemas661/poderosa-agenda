import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BookOpen, Clock, ArrowRight, Tag, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { name: 'Todos', count: 24, active: true },
  { name: 'Gestão', count: 8 },
  { name: 'Finanças', count: 5 },
  { name: 'Marketing', count: 6 },
  { name: 'Atendimento', count: 5 },
]

const featuredPost = {
  category: 'Gestão',
  categoryColor: 'bg-violet-100 text-violet-700',
  title: '10 estratégias para aumentar o faturamento do seu salão em 2025',
  excerpt:
    'Descubra como salões de alto desempenho estão usando tecnologia, fidelização e gestão inteligente para crescer mesmo em cenários desafiadores.',
  author: 'Equipe Poderosa Agenda',
  date: '08 Ago 2026',
  readTime: '8 min',
  tag: 'Destaque',
}

const posts = [
  {
    category: 'Finanças',
    categoryColor: 'bg-emerald-100 text-emerald-700',
    title: 'Como calcular o preço certo dos seus serviços sem perder clientes',
    excerpt: 'Aprenda a precificar seus serviços considerando custos, mercado e valor percebido pelo cliente.',
    author: 'Carla Mendes',
    date: '05 Ago 2026',
    readTime: '6 min',
  },
  {
    category: 'Marketing',
    categoryColor: 'bg-rose-100 text-rose-700',
    title: 'Instagram para salões: o guia completo para atrair mais clientes',
    excerpt: 'Estratégias práticas de conteúdo, stories e reels para posicionar seu salão nas redes sociais.',
    author: 'Rafael Costa',
    date: '01 Ago 2026',
    readTime: '10 min',
  },
  {
    category: 'Gestão',
    categoryColor: 'bg-violet-100 text-violet-700',
    title: 'Controle de estoque em salões: como evitar desperdícios',
    excerpt: 'Um sistema eficiente de controle de produtos reduz custos e garante que você nunca fique sem insumos importantes.',
    author: 'Juliana Santos',
    date: '28 Jul 2026',
    readTime: '5 min',
  },
  {
    category: 'Atendimento',
    categoryColor: 'bg-amber-100 text-amber-700',
    title: 'Como reduzir as faltas e cancelamentos de última hora',
    excerpt: 'Técnicas de confirmação automática, políticas de cancelamento e como comunicá-las aos clientes.',
    author: 'Juliana Santos',
    date: '22 Jul 2026',
    readTime: '7 min',
  },
  {
    category: 'Finanças',
    categoryColor: 'bg-emerald-100 text-emerald-700',
    title: 'Fluxo de caixa para iniciantes: o básico que todo dono de salão precisa saber',
    excerpt: 'Entenda como organizar entradas e saídas financeiras para manter seu negócio saudável.',
    author: 'Carla Mendes',
    date: '18 Jul 2026',
    readTime: '9 min',
  },
  {
    category: 'Marketing',
    categoryColor: 'bg-rose-100 text-rose-700',
    title: 'Programa de fidelidade: por que seu salão precisa ter um',
    excerpt: 'Clientes fidelizados gastam até 67% mais. Veja como criar um programa simples e eficaz.',
    author: 'Rafael Costa',
    date: '14 Jul 2026',
    readTime: '6 min',
  },
]

const popularPosts = [
  { title: 'Como montar um salão do zero: guia completo', views: '12.4K' },
  { title: 'Os melhores softwares para salão em 2025', views: '9.8K' },
  { title: 'Como treinar sua equipe para vender mais', views: '7.2K' },
  { title: 'Erros fatais na gestão de salões (e como evitá-los)', views: '6.5K' },
]

export default function BlogPage() {
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
                'radial-gradient(circle at 30% 60%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 10%, rgba(255,255,255,0.1) 0%, transparent 40%)',
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
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span className="text-white/90 text-sm font-medium">Conteúdo Especializado</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Blog{' '}
            <span className="text-amber-300">Poderosa Agenda</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Dicas, estratégias e conteúdo especializado para você gerenciar, crescer e lucrar mais com seu salão de beleza.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Posts */}
            <div className="lg:col-span-2">

              {/* Filtros de Categoria */}
              <div className="flex flex-wrap gap-2 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      cat.active
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                    }`}
                  >
                    {cat.name}
                    <span className="ml-2 text-xs opacity-70">({cat.count})</span>
                  </button>
                ))}
              </div>

              {/* Post em Destaque */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100 mb-10 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${featuredPost.categoryColor}`}>
                    {featuredPost.category}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                    ⭐ {featuredPost.tag}
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-3 group-hover:text-violet-700 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span>{featuredPost.author}</span>
                    <span>•</span>
                    <span>{featuredPost.date}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-violet-600 font-medium text-sm group-hover:gap-2 transition-all">
                    Ler <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Grid de Posts */}
              <div className="grid md:grid-cols-2 gap-6">
                {posts.map((post, index) => (
                  <article
                    key={index}
                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.categoryColor}`}>
                      {post.category}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900 mt-3 mb-2 leading-snug group-hover:text-violet-700 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-violet-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </article>
                ))}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-center gap-2 mt-12">
                {[1, 2, 3, '...', 8].map((page, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      page === 1
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Newsletter */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Receba nosso conteúdo</h3>
                <p className="text-white/80 text-sm mb-4">
                  Novos artigos semanais sobre gestão, marketing e finanças para salões.
                </p>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/20 placeholder-white/60 text-white text-sm border border-white/20 focus:outline-none focus:bg-white/30 mb-3"
                />
                <button className="w-full py-2.5 bg-white text-violet-700 font-semibold rounded-xl text-sm hover:bg-gray-100 transition-colors">
                  Inscrever-se Grátis
                </button>
              </div>

              {/* Posts Populares */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold text-gray-900">Mais lidos</h3>
                </div>
                <div className="space-y-4">
                  {popularPosts.map((post, i) => (
                    <div key={i} className="flex items-start gap-3 group cursor-pointer">
                      <span className="text-2xl font-display font-bold text-gray-100 leading-none w-7 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-violet-700 transition-colors leading-snug mb-1">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-400">{post.views} visualizações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold text-gray-900">Tópicos</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Gestão', 'Marketing', 'Finanças', 'Atendimento', 'Equipe',
                    'Tecnologia', 'Precificação', 'Fidelização', 'Estoque', 'Lucro',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-violet-50 hover:text-violet-600 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Sidebar */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
                <p className="font-semibold text-gray-900 mb-2">Pronto para crescer?</p>
                <p className="text-gray-600 text-sm mb-4">
                  Experimente a Poderosa Agenda grátis por 14 dias.
                </p>
                <Link href="/cadastro" className="block w-full text-center py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                  Começar Agora
                </Link>
              </div>
            </aside>

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
