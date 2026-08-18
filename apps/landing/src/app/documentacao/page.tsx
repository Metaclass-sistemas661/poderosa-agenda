'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Search, X, FileText, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { PublicPageLayout, SectionTitle, SupportBanner } from '@/components/public'
import {
  getDocSections,
  getAllGuides,
  searchDocumentation,
  getGuideCount,
} from '@/content/documentation'

export default function DocumentacaoPage() {
  const [query, setQuery] = useState('')

  const sections = getDocSections()
  const allGuides = getAllGuides()

  const searchResults = useMemo(() => {
    return searchDocumentation(query)
  }, [query])

  const isSearching = query.trim().length > 0
  const hasResults = searchResults.length > 0

  // Quick start guides
  const quickStartGuides = allGuides.filter((g) => g.sectionSlug === 'comecando').slice(0, 3)

  return (
    <PublicPageLayout
      hero={{
        badge: { icon: BookOpen, text: 'Documentação' },
        title: 'Documentação',
        subtitle: 'Guias completos para utilizar todos os recursos da Poderosa Agenda.',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Documentação' },
        ],
        actions: (
          <div className="relative w-full max-w-lg">
            <label htmlFor="doc-search" className="sr-only">
              Pesquisar na documentação
            </label>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="doc-search"
              type="search"
              placeholder="Buscar na documentação..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl text-slate-900 text-sm bg-white border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      }}
    >
      {/* Search Results */}
      {isSearching && (
        <section className="py-12">
          <div className="container-custom max-w-4xl">
            {hasResults ? (
              <>
                <SectionTitle
                  title={`${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} para "${query}"`}
                  size="sm"
                  align="left"
                  as="h2"
                  animate={false}
                />
                <div className="mt-6 space-y-3">
                  {searchResults.map(({ guide, section }) => (
                    <Link
                      key={`${section.slug}-${guide.slug}`}
                      href={`/documentacao/${section.slug}/${guide.slug}`}
                      className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                          {guide.description}
                        </p>
                        <span className="text-xs font-semibold text-primary-600">
                          {section.title}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-2" />
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 mx-auto mb-6">
                  <Search className="h-8 w-8 text-slate-300" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  Nenhum resultado encontrado
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Não encontramos guias para "{query}".
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  Limpar busca
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Start */}
      {!isSearching && (
        <section className="py-16">
          <div className="container-custom">
            <SectionTitle
              title="Comece por aqui"
              subtitle="Guias essenciais para começar a usar a plataforma"
              size="md"
              align="left"
              as="h2"
            />
            <div className="mt-8 grid md:grid-cols-3 gap-4 max-w-4xl">
              {quickStartGuides.map((guide, index) => (
                <Link
                  key={guide.slug}
                  href={`/documentacao/comecando/${guide.slug}`}
                  className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 text-sm font-bold mb-3 border border-primary-100">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Documentation Sections */}
      {!isSearching && (
        <section className="py-8 pb-16">
          <div className="container-custom">
            <SectionTitle
              title="Explorar documentação"
              subtitle="Navegue por módulo para encontrar o que precisa"
              size="md"
              align="left"
              as="h2"
            />
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.map((sec) => {
                const Icon = sec.icon
                const count = getGuideCount(sec.slug)
                return (
                  <Link
                    key={sec.slug}
                    href={`/documentacao/${sec.slug}`}
                    className="group relative flex flex-col p-5 rounded-2xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 mb-4 transition-all duration-200 group-hover:bg-primary-50 group-hover:border-primary-200">
                      <Icon className="h-6 w-6 text-slate-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1">
                      {sec.description}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-500 transition-colors">
                        {count} guia{count !== 1 ? 's' : ''}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:text-primary-600 group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Help Center Link */}
      {!isSearching && (
        <section className="pb-8">
          <div className="container-custom max-w-4xl">
            <Link
              href="/ajuda"
              className="group flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-primary-50 transition-all border border-slate-100 group-hover:border-primary-100">
                  <HelpCircle className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                    Precisa de uma resposta rápida?
                  </p>
                  <p className="text-sm text-slate-500">
                    Acesse a Central de Ajuda para dúvidas frequentes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* Support Banner */}
      <section className="pb-16">
        <div className="container-custom max-w-3xl">
          <SupportBanner
            title="Precisa de ajuda?"
            description="Nossa equipe está pronta para auxiliar com dúvidas sobre a plataforma."
            action={{
              label: 'Entrar em contato',
              href: '/contato',
            }}
            variant="default"
          />
        </div>
      </section>
    </PublicPageLayout>
  )
}