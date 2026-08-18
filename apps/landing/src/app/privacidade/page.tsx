'use client'

import { Shield } from 'lucide-react'
import Link from 'next/link'
import { PublicPageLayout } from '@/components/public/layout/PublicPageLayout'

const sections = [
  { title: '1. Quais dados coletamos', content: 'Coletamos dados que você nos fornece diretamente (nome, e-mail, telefone, dados do salão), dados de uso da plataforma (páginas acessadas, funcionalidades utilizadas, horários de acesso) e dados técnicos (endereço IP, tipo de navegador, dispositivo). Também coletamos dados dos clientes dos salões cadastrados na plataforma para viabilizar os agendamentos.' },
  { title: '2. Como usamos seus dados', content: 'Utilizamos seus dados para: fornecer e melhorar nossos serviços; processar pagamentos; enviar notificações de agendamentos e atualizações do sistema; prestar suporte ao cliente; cumprir obrigações legais; e enviar comunicações de marketing (com seu consentimento). Nunca vendemos seus dados a terceiros.' },
  { title: '3. Compartilhamento de dados', content: 'Compartilhamos dados apenas com: prestadores de serviço essenciais (processadores de pagamento, provedores de nuvem, serviços de e-mail) que se comprometem a proteger suas informações; parceiros de integração quando você os autoriza; e autoridades públicas quando exigido por lei.' },
  { title: '4. Segurança dos dados', content: 'Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS) e em repouso; autenticação multifator; controle de acesso baseado em funções; backups regulares; monitoramento contínuo de segurança; e testes periódicos de vulnerabilidade.' },
  { title: '5. Seus direitos', content: 'Conforme a LGPD, você tem direito a: confirmar a existência de tratamento dos seus dados; acessar seus dados; corrigir dados incompletos ou desatualizados; anonimizar, bloquear ou eliminar dados desnecessários; portabilidade dos dados; informação sobre compartilhamento; e revogação do consentimento.' },
  { title: '6. Retenção de dados', content: 'Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para prestar serviços. Após o encerramento, os dados são excluídos em até 90 dias, salvo obrigação legal de retenção por prazo maior. Você pode solicitar a exclusão antecipada a qualquer momento.' },
  { title: '7. Cookies', content: 'Utilizamos cookies para melhorar sua experiência na plataforma. Para mais detalhes, consulte nossa Política de Cookies. Você pode gerenciar suas preferências de cookies nas configurações do navegador.' },
  { title: '8. Contato do DPO', content: 'Nosso Encarregado de Proteção de Dados (DPO) está disponível para dúvidas sobre o tratamento dos seus dados. Entre em contato pelo e-mail: privacidade@poderosaagenda.com.br.' },
]

export default function PrivacidadePage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Shield, text: 'Legal' },
        title: 'Política de Privacidade',
        subtitle: 'Última atualização: 08 de agosto de 2026',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Política de Privacidade' },
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
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 mb-10 shadow-sm">
                <p className="text-primary-900 text-base leading-relaxed">
                  <strong className="text-primary-700 font-bold">Compromisso com sua privacidade:</strong>{' '}
                  A Poderosa Agenda respeita e protege os dados pessoais de todos os usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {sections.map((sec) => (
                  <div
                    key={sec.title}
                    id={sec.title.replace(/\s+/g, '-').toLowerCase()}
                    className="scroll-mt-32"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                      {sec.title}
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed">
                      <p>{sec.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer links */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Dúvidas?{' '}
                  <Link href="/contato" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
                    Entre em contato
                  </Link>
                </p>
                <div className="flex gap-4">
                  <Link href="/termos" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                    Termos de Uso
                  </Link>
                  <Link href="/lgpd" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                    LGPD
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