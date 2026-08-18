'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'
import { PublicPageLayout } from '@/components/public/layout/PublicPageLayout'

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: 'Ao acessar ou utilizar a plataforma Poderosa Agenda, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço. O uso continuado da plataforma após alterações nos termos constitui aceitação das mudanças.',
  },
  {
    title: '2. Descrição do Serviço',
    content: 'A Poderosa Agenda é um sistema de gestão para salões de beleza que oferece funcionalidades de agendamento online, controle financeiro, gestão de clientes, profissionais e estoque. O serviço é fornecido como Software como Serviço (SaaS) mediante plano de assinatura.',
  },
  {
    title: '3. Cadastro e Conta',
    content: 'Para utilizar a plataforma, é necessário criar uma conta fornecendo informações verídicas, completas e atualizadas. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.',
  },
  {
    title: '4. Planos e Pagamentos',
    content: 'Os planos de assinatura são cobrados conforme descrito na página de preços. O não pagamento pode resultar na suspensão do acesso. Cancelamentos devem ser realizados antes do próximo ciclo de cobrança. Não há reembolso por períodos parciais, exceto em casos previstos pelo Código de Defesa do Consumidor.',
  },
  {
    title: '5. Uso Permitido',
    content: 'Você concorda em utilizar a plataforma apenas para fins legítimos de gestão do seu negócio. É proibido: compartilhar acesso com terceiros não autorizados; utilizar a plataforma para fins ilegais; realizar engenharia reversa do software; enviar spam ou conteúdo malicioso; ou violar direitos de propriedade intelectual.',
  },
  {
    title: '6. Dados e Privacidade',
    content: 'O tratamento dos seus dados pessoais é regido pela nossa Política de Privacidade. Você mantém a propriedade dos dados inseridos na plataforma. Garantimos a segurança e confidencialidade das informações dos seus clientes conforme a LGPD.',
  },
  {
    title: '7. Disponibilidade do Serviço',
    content: 'Nos comprometemos a manter a plataforma disponível com alta disponibilidade (SLA de 99,5%). Manutenções programadas serão comunicadas com antecedência. Não nos responsabilizamos por indisponibilidades causadas por fatores fora do nosso controle.',
  },
  {
    title: '8. Limitação de Responsabilidade',
    content: 'A Poderosa Agenda não se responsabiliza por danos indiretos, incidentais ou consequenciais resultantes do uso ou impossibilidade de uso da plataforma. Nossa responsabilidade total não excederá o valor pago pelo serviço nos últimos 12 meses.',
  },
  {
    title: '9. Rescisão',
    content: 'Qualquer parte pode encerrar o contrato a qualquer momento. Em caso de violação dos termos, podemos suspender ou encerrar seu acesso imediatamente. Após a rescisão, você terá 30 dias para exportar seus dados antes da exclusão.',
  },
  {
    title: '10. Alterações nos Termos',
    content: 'Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas por e-mail com 30 dias de antecedência. O uso continuado após esse período constitui aceitação dos novos termos.',
  },
  {
    title: '11. Legislação Aplicável',
    content: 'Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP, salvo disposição legal em contrário.',
  },
]

export default function TermosPage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: FileText, text: 'Legal' },
        title: 'Termos de Uso',
        subtitle: 'Última atualização: 08 de agosto de 2026',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Termos de Uso' },
        ],
      }}
    >
      <section className="py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
            {/* Sidebar — TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Sumário
                </p>
                <nav aria-label="Sumário do documento" className="space-y-3">
                  {sections.map((s) => (
                    <a
                      key={s.title}
                      href={`#${s.title.replace(/\s+/g, '-').toLowerCase()}`}
                      className="block text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors leading-relaxed"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Summary Box */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-10 shadow-sm">
                <p className="text-amber-900 text-base leading-relaxed">
                  <strong className="text-amber-700 font-bold">Resumo:</strong>{' '}
                  Estes termos estabelecem as regras de uso da plataforma Poderosa Agenda. Leia com atenção antes de utilizar nossos serviços. Em caso de dúvidas, entre em{' '}
                  <Link href="/contato" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
                    contato conosco
                  </Link>.
                </p>
              </div>

              {/* Content Blocks */}
              <div className="space-y-12">
                {sections.map((section) => (
                  <div
                    key={section.title}
                    id={section.title.replace(/\s+/g, '-').toLowerCase()}
                    className="scroll-mt-32"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                      {section.title}
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed">
                      <p>{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Tem alguma dúvida sobre estes termos?
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/contato"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Falar com Suporte
                  </Link>
                  <Link
                    href="/privacidade"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Política de Privacidade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}