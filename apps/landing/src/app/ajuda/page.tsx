'use client'

import { useState, useMemo } from 'react'
import { HelpCircle, Search, X, FileText, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getHelpCategories,
  getAllArticles,
  searchHelpArticles,
  getArticleCount,
} from '@/content/help'
import { motion } from 'framer-motion'

export default function AjudaPage() {
  const [query, setQuery] = useState('')

  const categories = getHelpCategories()
  const allArticles = getAllArticles()

  // Functional search
  const searchResults = useMemo(() => {
    return searchHelpArticles(query)
  }, [query])

  const isSearching = query.trim().length > 0
  const hasResults = searchResults.length > 0

  // Featured articles (first article from each category for "Comece por aqui")
  const featuredArticles = useMemo(() => {
    const seen = new Set<string>()
    return allArticles.filter((article) => {
      if (seen.has(article.categorySlug)) return false
      seen.add(article.categorySlug)
      return true
    }).slice(0, 6)
  }, [allArticles])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <main className="pt-24 lg:pt-32 pb-24">
        {/* Hero & Search Section */}
        <section className="relative w-full overflow-hidden bg-white py-16 md:py-24 shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-semibold mb-6"
            >
              <HelpCircle className="w-4 h-4" />
              Central de Ajuda
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight mb-6"
            >
              Como podemos ajudar?
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto"
            >
              Encontre respostas, orientações e recursos para aproveitar ao máximo a Poderosa Agenda.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative w-full max-w-2xl mx-auto shadow-xl shadow-slate-200/50 rounded-2xl"
            >
              <label htmlFor="help-search" className="sr-only">Pesquisar na Central de Ajuda</label>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
              <input
                id="help-search"
                type="search"
                placeholder="Busque por uma dúvida ou funcionalidade..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-5 rounded-2xl text-slate-900 text-lg bg-white border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full"
                  aria-label="Limpar busca"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Search Results */}
        {isSearching && (
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              {hasResults ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{query}"
                  </h2>
                  <div className="space-y-4">
                    {searchResults.map(({ article, category }) => (
                      <Link
                        key={`${category.slug}-${article.slug}`}
                        href={`/ajuda/${category.slug}/${article.slug}`}
                        className="group flex items-start gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-500 group-hover:bg-primary-100 transition-all">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                            {article.title}
                          </h3>
                          <p className="text-base text-slate-600 line-clamp-2 mb-2">
                            {article.description}
                          </p>
                          <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {category.title}
                          </span>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-3" />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mx-auto mb-6">
                    <Search className="h-10 w-10 text-slate-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-3">Nenhum resultado encontrado</h2>
                  <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto">
                    Não encontramos resultados para "{query}". Tente pesquisar usando outras palavras.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="inline-flex items-center px-6 py-3 font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {!isSearching && (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Navegar por categoria</h2>
                <p className="text-lg text-slate-600">Explore orientações de acordo com a área da plataforma</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, index) => {
                  const Icon = cat.icon
                  const count = getArticleCount(cat.slug)
                  return (
                    <motion.div 
                      key={cat.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/ajuda/${cat.slug}`}
                        className="group flex flex-col h-full p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mb-6 group-hover:bg-primary-100 transition-colors">
                          <Icon className="h-7 w-7 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-base text-slate-600 leading-relaxed mb-6 flex-1">
                          {cat.description}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-sm font-medium text-slate-500">
                            {count} artigo{count !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Featured Articles & Docs */}
        {!isSearching && (
          <section className="py-10 px-6">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">
              
              {/* Left Column: Featured */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Comece por aqui</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {featuredArticles.map((article) => {
                    const category = categories.find((c) => c.slug === article.categorySlug)
                    return (
                      <Link
                        key={`${article.categorySlug}-${article.slug}`}
                        href={`/ajuda/${article.categorySlug}/${article.slug}`}
                        className="group flex items-start justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start gap-4 min-w-0 pr-4">
                          <FileText className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base group-hover:text-primary-600 transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            <span className="text-sm text-slate-500 mt-1 block">
                              {category?.title}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 flex-shrink-0 mt-1" />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Docs & Support Banner */}
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Recursos extras</h2>
                
                {/* Documentation Link */}
                <Link
                  href="/documentacao"
                  className="group flex items-start p-6 rounded-3xl border border-slate-200 bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors mb-4">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                      Documentação Técnica
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Guias completos, referência de API e tutoriais avançados.
                    </p>
                    <span className="inline-flex items-center text-sm font-semibold text-primary-600">
                      Acessar Docs <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}