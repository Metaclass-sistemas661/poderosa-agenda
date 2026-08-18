'use client'

import { Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { PublicPageLayout } from '@/components/public/layout/PublicPageLayout'

const rights = [
  { title: 'Confirmação', desc: 'Saber se tratamos seus dados pessoais.' },
  { title: 'Acesso', desc: 'Obter cópia dos dados que temos sobre você.' },
  { title: 'Correção', desc: 'Solicitar correção de dados incorretos ou desatualizados.' },
  { title: 'Anonimização', desc: 'Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.' },
  { title: 'Portabilidade', desc: 'Receber seus dados em formato estruturado para outro fornecedor.' },
  { title: 'Eliminação', desc: 'Solicitar exclusão dos dados tratados com base no consentimento.' },
  { title: 'Revogação', desc: 'Retirar o consentimento para tratamento de dados a qualquer momento.' },
  { title: 'Informação', desc: 'Saber com quais entidades seus dados são compartilhados.' },
]

const sections = [
  { title: '1. O que é a LGPD', content: 'A Lei Geral de Proteção de Dados (Lei 13.709/2018) é a legislação brasileira que regula o tratamento de dados pessoais, garantindo direitos aos titulares e estabelecendo obrigações para as empresas que tratam esses dados.' },
  { title: '2. Bases legais que utilizamos', content: 'Tratamos seus dados com base em: consentimento (quando solicitamos sua autorização); execução de contrato (para prestar o serviço contratado); cumprimento de obrigação legal; legítimo interesse (para melhorar nossa plataforma e prevenir fraudes).' },
  { title: '3. Dados que tratamos', content: 'Tratamos dados de identificação (nome, CPF/CNPJ, e-mail, telefone), dados de uso da plataforma, dados financeiros para processamento de pagamentos, e dados dos clientes do seu salão inseridos na plataforma.' },
  { title: '4. Transferência internacional', content: 'Podemos transferir dados para servidores localizados fora do Brasil (como serviços de nuvem da AWS e Google Cloud). Garantimos que essas transferências ocorrem com salvaguardas adequadas, conforme exigido pela LGPD.' },
  { title: '5. Encarregado de Dados (DPO)', content: 'Nossa Encarregada de Proteção de Dados é responsável por garantir conformidade com a LGPD e atender às solicitações dos titulares. Contato: privacidade@poderosaagenda.com.br' },
  { title: '6. Como exercer seus direitos', content: 'Para exercer qualquer direito previsto na LGPD, entre em contato conosco pelo e-mail privacidade@poderosaagenda.com.br ou pelo formulário de contato. Responderemos em até 15 dias úteis.' },
]

export default function LgpdPage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Lock, text: 'Legal' },
        title: 'Conformidade com a LGPD',
        subtitle: 'Lei Geral de Proteção de Dados — Lei 13.709/2018',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'LGPD' },
        ],
      }}
    >
      {/* Rights Grid */}
      <section className="py-16">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-primary-200 bg-primary-50 text-xs font-semibold text-primary-600 mb-4 shadow-sm">
              Seus direitos
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Como titular de dados, você tem direito a:
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rights.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500 mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{r.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="pb-16">
        <div className="container-custom max-w-3xl">
          <div className="space-y-4">
            {sections.map((sec) => (
              <div
                key={sec.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <h2 className="text-base font-bold text-slate-900 mb-3">
                  {sec.title}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm mb-3">Veja também:</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacidade" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}