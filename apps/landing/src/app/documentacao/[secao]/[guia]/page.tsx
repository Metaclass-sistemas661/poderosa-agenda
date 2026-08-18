'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Lightbulb, FileText, ArrowRight } from 'lucide-react'
import { PublicPageLayout, SupportBanner, Callout, ReadingContainer } from '@/components/public'
import {
  getSectionBySlug,
  getGuideBySlug,
  getPrevNextGuides,
  getAllGuides,
} from '@/content/documentation'

interface GuidePageProps {
  params: { secao: string; guia: string }
}

export default function DocGuidePage({ params }: GuidePageProps) {
  const section = getSectionBySlug(params.secao)
  const guide = getGuideBySlug(params.secao, params.guia)

  if (!section) {
    redirect('/documentacao')
  }

  if (!guide) {
    redirect(`/documentacao/${params.secao}`)
  }

  const { prev, next } = getPrevNextGuides(params.secao, params.guia)
  const Icon = section.icon

  // Get next step guides if defined
  const allGuides = getAllGuides()
  const nextStepGuides = guide.content.nextSteps
    ? guide.content.nextSteps
        .map((slug) => allGuides.find((g) => g.slug === slug))
        .filter(Boolean)
    : []

  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Icon, text: section.title },
        title: guide.title,
        subtitle: guide.description,
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Documentação', href: '/documentacao' },
          { label: section.title, href: `/documentacao/${params.secao}` },
          { label: guide.title },
        ],
      }}
      showCTA={false}
    >
      {/* Back Link */}
      <section className="pt-8">
        <div className="container-custom max-w-3xl">
          <Link
            href={`/documentacao/${params.secao}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para {section.title}
          </Link>
        </div>
      </section>

      <div className="container-custom max-w-5xl py-8">
        <div className="flex gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <ReadingContainer>
              {/* Intro */}
              <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
                {guide.content.intro}
              </p>

              {/* Content Sections */}
              {guide.content.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="mb-10 scroll-mt-24">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    {sec.title}
                  </h2>
                  <p className="text-slate-600 mb-4">{sec.content}</p>

                  {/* Steps */}
                  {sec.steps && sec.steps.length > 0 && (
                    <ol className="space-y-3 list-none my-6">
                      {sec.steps.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 text-sm font-bold border border-primary-100">
                            {index + 1}
                          </span>
                          <span className="text-slate-700 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Tip */}
                  {sec.tip && (
                    <Callout variant="info" icon={Lightbulb}>
                      <p className="text-sm text-slate-700">{sec.tip}</p>
                    </Callout>
                  )}
                </section>
              ))}

              {/* Next Steps */}
              {nextStepGuides.length > 0 && (
                <section className="mt-12 pt-8 border-t border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Próximos passos
                  </h2>
                  <div className="space-y-2">
                    {nextStepGuides.map((g) => (
                      <Link
                        key={g!.slug}
                        href={`/documentacao/${g!.sectionSlug}/${g!.slug}`}
                        className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
                      >
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-primary-600 transition-colors flex-1">
                          {g!.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </ReadingContainer>
          </div>

          {/* Table of Contents - Desktop */}
          {guide.content.sections.length > 1 && (
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <nav className="sticky top-24">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Nesta página
                </p>
                <ul className="space-y-2">
                  {guide.content.sections.map((sec) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="block text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
                      >
                        {sec.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </div>

      {/* Prev/Next Navigation */}
      {(prev || next) && (
        <section className="pb-8">
          <div className="container-custom max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
              {prev ? (
                <Link
                  href={`/documentacao/${prev.sectionSlug}/${prev.slug}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1 group-hover:text-primary-500 transition-colors">
                    <ArrowLeft className="w-3 h-3" /> Anterior
                  </p>
                  <p className="text-sm font-bold text-slate-600 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {prev.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/documentacao/${next.sectionSlug}/${next.slug}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all text-right"
                >
                  <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1 justify-end group-hover:text-primary-500 transition-colors">
                    Próximo <ArrowRight className="w-3 h-3" />
                  </p>
                  <p className="text-sm font-bold text-slate-600 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {next.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Support Banner */}
      <section className="pb-16">
        <div className="container-custom max-w-3xl">
          <SupportBanner
            title="Este guia foi útil?"
            description="Se tiver dúvidas, nossa equipe está pronta para ajudar."
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