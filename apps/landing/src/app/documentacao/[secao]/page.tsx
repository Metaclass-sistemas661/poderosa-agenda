'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText, ArrowLeft } from 'lucide-react'
import { PublicPageLayout, SectionTitle, SupportBanner } from '@/components/public'
import {
  getSectionBySlug,
  getGuidesBySection,
  getDocSections,
  getGuideCount,
} from '@/content/documentation'

interface SectionPageProps {
  params: { secao: string }
}

export default function DocSectionPage({ params }: SectionPageProps) {
  const section = getSectionBySlug(params.secao)

  if (!section) {
    redirect('/documentacao')
  }

  const guides = getGuidesBySection(params.secao)
  const Icon = section.icon

  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Icon, text: section.title },
        title: section.title,
        subtitle: section.description,
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Documentação', href: '/documentacao' },
          { label: section.title },
        ],
      }}
    >
      {/* Back Link */}
      <section className="pt-8">
        <div className="container-custom max-w-4xl">
          <Link
            href="/documentacao"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Documentação
          </Link>
        </div>
      </section>

      {/* Guides List */}
      <section className="py-12">
        <div className="container-custom max-w-4xl">
          <SectionTitle
            title={`${guides.length} guia${guides.length !== 1 ? 's' : ''} nesta seção`}
            size="sm"
            align="left"
            as="h2"
            animate={false}
          />

          <div className="mt-6 space-y-3">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/documentacao/${params.secao}/${guide.slug}`}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {guide.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-2" />
              </Link>
            ))}
          </div>

          {guides.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">Nenhum guia disponível nesta seção ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Other Sections */}
      <section className="pb-8">
        <div className="container-custom max-w-4xl">
          <SectionTitle
            title="Outras seções"
            size="sm"
            align="left"
            as="h2"
            animate={false}
          />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {getDocSections()
              .filter((s) => s.slug !== params.secao)
              .slice(0, 4)
              .map((s) => {
                const SIcon = s.icon
                return (
                  <Link
                    key={s.slug}
                    href={`/documentacao/${s.slug}`}
                    className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all text-center"
                  >
                    <SIcon className="w-5 h-5 text-slate-400 mx-auto mb-2 group-hover:text-primary-600 transition-colors" />
                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {s.title}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {getGuideCount(s.slug)} guias
                    </p>
                  </Link>
                )
              })}
          </div>
        </div>
      </section>

      {/* Support Banner */}
      <section className="pb-16">
        <div className="container-custom max-w-3xl">
          <SupportBanner
            title="Precisa de ajuda?"
            description="Entre em contato com nossa equipe."
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