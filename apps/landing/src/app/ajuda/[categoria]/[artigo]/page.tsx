'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Lightbulb, Info, FileText, Home } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getCategoryBySlug,
  getArticleBySlug,
  getArticlesByCategory,
  getRelatedArticles,
} from '@/content/help'
import { motion } from 'framer-motion'

interface ArticlePageProps {
  params: { categoria: string; artigo: string }
}

export default function HelpArticlePage({ params }: ArticlePageProps) {
  const category = getCategoryBySlug(params.categoria)
  const article = getArticleBySlug(params.categoria, params.artigo)

  if (!category) {
    redirect('/ajuda')
  }

  if (!article) {
    redirect(`/ajuda/${params.categoria}`)
  }

  const relatedArticles = getRelatedArticles(article)
  const categoryArticles = getArticlesByCategory(params.categoria)
  const currentIndex = categoryArticles.findIndex((a) => a.slug === article.slug)
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null
  const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <main className="pt-24 lg:pt-32 pb-24">
        {/* Breadcrumb */}
        <section className="bg-white py-8 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 font-medium">
              <Link href="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <Link href="/ajuda" className="hover:text-primary-600 transition-colors">
                Ajuda
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <Link href={`/ajuda/${params.categoria}`} className="hover:text-primary-600 transition-colors">
                {category.title}
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="text-slate-900 truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
            </nav>
          </div>
        </section>

        {/* Back Link */}
        <section className="pt-8 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/ajuda/${params.categoria}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-semibold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para {category.title}
            </Link>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12 px-6">
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200"
          >
            {/* Header */}
            <header className="mb-10 pb-10 border-b border-slate-100">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 leading-tight">
                {article.title}
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                {article.description}
              </p>
            </header>

            {/* Intro */}
            <div className="prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed mb-12">
              <p>{article.content.intro}</p>
            </div>

            {/* Steps */}
            {article.content.steps && article.content.steps.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Passo a passo
                </h2>
                <ol className="space-y-4 list-none p-0 m-0">
                  {article.content.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-5 p-5 rounded-2xl border border-slate-100 bg-slate-50"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 text-sm font-bold shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 text-lg pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {article.content.tips && article.content.tips.length > 0 && (
              <div className="mb-12 space-y-4">
                {article.content.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900"
                  >
                    <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold mb-1">Dica</h4>
                      <p className="text-base leading-relaxed opacity-90">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {article.content.warnings && article.content.warnings.length > 0 && (
              <div className="mb-12 space-y-4">
                {article.content.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900"
                  >
                    <Info className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold mb-1">Importante</h4>
                      <p className="text-base leading-relaxed opacity-90">{warning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.article>
        </section>

        {/* Navigation & Related */}
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Prev/Next Articles */}
            <div className="grid sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <Link
                  href={`/ajuda/${params.categoria}/${prevArticle.slug}`}
                  className="group flex flex-col p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all text-left"
                >
                  <span className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Artigo anterior
                  </span>
                  <span className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {prevArticle.title}
                  </span>
                </Link>
              ) : <div />}
              
              {nextArticle && (
                <Link
                  href={`/ajuda/${params.categoria}/${nextArticle.slug}`}
                  className="group flex flex-col p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all text-right items-end"
                >
                  <span className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                    Próximo artigo <ChevronRight className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {nextArticle.title}
                  </span>
                </Link>
              )}
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Artigos relacionados</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relatedArticles.map((related) => {
                    const relatedCategory = getCategoryBySlug(related.categorySlug)
                    return (
                      <Link
                        key={related.slug}
                        href={`/ajuda/${related.categorySlug}/${related.slug}`}
                        className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-md transition-all"
                      >
                        <FileText className="w-5 h-5 text-slate-300 group-hover:text-primary-500 mt-0.5 flex-shrink-0 transition-colors" />
                        <div>
                          <p className="font-semibold text-slate-900 text-base group-hover:text-primary-600 transition-colors mb-1 line-clamp-2">
                            {related.title}
                          </p>
                          <span className="text-xs font-medium text-slate-500">
                            {relatedCategory?.title}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}