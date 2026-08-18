'use client'
import { PublicPageLayout, PageSection, SectionTitle, ReadingContainer, Callout } from '@/components/public'
import { Cookie, CheckCircle, Lightbulb } from 'lucide-react'
import Link from 'next/link'

const cookieTypes = [
  { type: 'Essenciais', required: true, color: 'bg-primary-50 text-primary-700 border-primary-200', desc: 'Necessários para o funcionamento básico da plataforma. Não podem ser desativados.', examples: 'Sessão de login, preferências de idioma, carrinho de compras.' },
  { type: 'Analíticos', required: false, color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Nos ajudam a entender como os usuários interagem com a plataforma para melhorar a experiência.', examples: 'Google Analytics, Hotjar — páginas visitadas, tempo de sessão, cliques.' },
  { type: 'Funcionais', required: false, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Permitem funcionalidades avançadas e personalização da experiência.', examples: 'Preferências de tema (claro/escuro), região, configurações do painel.' },
  { type: 'Marketing', required: false, color: 'bg-amber-50 text-amber-700 border-amber-200', desc: 'Usados para exibir anúncios relevantes e medir a eficácia de campanhas.', examples: 'Facebook Pixel, Google Ads — conversões e retargeting.' },
]

export default function CookiesPage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Cookie, text: 'Legal' },
        title: 'Política de Cookies',
        subtitle: 'Última atualização: 08 de agosto de 2026',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Política de Cookies' },
        ],
      }}
    >
      <PageSection className="py-12 md:py-16 lg:py-24">
        <div className="container-custom max-w-4xl">
          <ReadingContainer>
            
            <section className="mb-12">
              <SectionTitle
                title="Tipos de cookies que utilizamos"
                size="sm"
                align="left"
                as="h2"
                animate={false}
              />
              <div className="grid md:grid-cols-2 gap-5 mt-6">
                {cookieTypes.map((c) => (
                  <div key={c.type} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${c.color}`}>{c.type}</span>
                      {c.required ? (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Obrigatório</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">Ativo</span>
                          <div className="w-8 h-4 bg-primary-500 rounded-full relative cursor-pointer">
                            <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{c.desc}</p>
                    <p className="text-slate-500 text-xs"><strong className="text-slate-700 font-semibold">Exemplos:</strong> {c.examples}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Callout variant="info" icon={CheckCircle}>
                  <p className="font-bold text-slate-900 text-sm mb-1">Seu controle é total</p>
                  <p className="text-slate-700 text-sm leading-relaxed">Você pode alterar suas preferências de cookies a qualquer momento nas configurações da sua conta ou nas configurações do navegador. Cookies essenciais não podem ser desativados pois são necessários para o funcionamento da plataforma.</p>
                </Callout>
              </div>
            </section>

            <div className="prose prose-slate prose-lg max-w-none">
              <h2>1. O que são cookies</h2>
              <p>
                Cookies são pequenos arquivos de texto armazenados no seu navegador quando você acessa um site. Eles permitem que a plataforma reconheça seu dispositivo em visitas futuras, mantendo preferências e sessões ativas.
              </p>

              <h2>2. Como usamos cookies</h2>
              <p>
                Utilizamos cookies para manter sua sessão ativa após o login, lembrar suas preferências (como tema claro/escuro), analisar o uso da plataforma para melhorias contínuas, e exibir conteúdo relevante.
              </p>

              <h2>3. Cookies de terceiros</h2>
              <p>
                Alguns cookies são definidos por serviços de terceiros que utilizamos, como Google Analytics para análise de uso e serviços de pagamento para transações seguras. Cada terceiro possui sua própria política de privacidade.
              </p>

              <h2>4. Gerenciar cookies</h2>
              <p>
                Você pode controlar e/ou excluir cookies nas configurações do seu navegador. Bloquear todos os cookies pode afetar algumas funcionalidades da plataforma, especialmente o sistema de login e preferências.
              </p>

              <h2>5. Validade dos cookies</h2>
              <p>
                Cookies de sessão são excluídos quando você fecha o navegador. Cookies persistentes têm validade definida, geralmente entre 30 dias e 2 anos, dependendo da finalidade.
              </p>
            </div>

            {/* See Also */}
            <div className="mt-16 pt-8 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-4">Veja também:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/privacidade" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Política de Privacidade
                </Link>
                <Link href="/termos" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Termos de Uso
                </Link>
                <Link href="/lgpd" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  LGPD
                </Link>
              </div>
            </div>

          </ReadingContainer>
        </div>
      </PageSection>
    </PublicPageLayout>
  )
}