'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText, ArrowLeft, Home } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getCategoryBySlug,
  getArticlesByCategory,
  getHelpCategories,
  getArticleCount,
} from '@/content/help'
import { motion } from 'framer-motion'

interface CategoryPageProps {
  params: { categoria: string }
}

export default function HelpCategoryPage({ params }: CategoryPageProps) {
  const category = getCategoryBySlug(params.categoria)

  if (!category) {
    redirect('/ajuda')
  }

  const articles = getArticlesByCategory(params.categoria)
  const Icon = category.icon

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <main className="pt-24 lg:pt-32 pb-24">
        {/* Breadcrumb & Hero */}
        <section className="bg-white py-12 md:py-16 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-8 font-medium">
              <Link href="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <Link href="/ajuda" className="hover:text-primary-600 transition-colors">
                Central de Ajuda
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="text-slate-900">{category.title}</span>
            </nav>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                <Icon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-2">
                  {category.title}
                </h1>
                <p className="text-lg text-slate-600">
                  {category.description}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Back Link */}
        <section className="pt-8 px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/ajuda"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-semibold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Central de Ajuda
            </Link>
          </div>
        </section>

        {/* Articles List */}
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {articles.length} artigo{articles.length !== 1 ? 's' : ''} nesta categoria
            </h2>

            <div className="space-y-4">
              {articles.map((article, index) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/ajuda/${params.categoria}/${article.slug}`}
                    className="group flex items-start gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                        {article.title}
                      </h3>
                      <p className="text-base text-slate-600 line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-3" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {articles.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm mt-6">
                <p className="text-lg text-slate-500">Nenhum artigo disponível nesta categoria ainda.</p>
              </div>
            )}
          </div>
        </section>

        {/* Other Categories */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Explore outras categorias</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getHelpCategories()
                .filter((cat) => cat.slug !== params.categoria)
                .slice(0, 4)
                .map((cat) => {
                  const CatIcon = cat.icon
                  return (
                    <Link
                      key={cat.slug}
                      href={`/ajuda/${cat.slug}`}
                      className="group p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
                    >
                      <CatIcon className="w-8 h-8 text-slate-400 group-hover:text-primary-500 mb-3 transition-colors" />
                      <p className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {cat.title}
                      </p>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        {getArticleCount(cat.slug)} artigos
                      </p>
                    </Link>
                  )
                })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}