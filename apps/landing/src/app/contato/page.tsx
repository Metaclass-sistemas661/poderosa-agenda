'use client'

import { useState } from 'react'
import { MessageSquare, Mail, CheckCircle, Send, Loader2, AlertCircle, HelpCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { PublicPageLayout, SectionTitle } from '@/components/public'
import { submitContactForm, type ContactFormData, type ContactFormResult } from './actions'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const inputClasses = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm'
const errorInputClasses = 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'

export default function ContatoPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: 'suporte',
    message: '',
  })
  const [formState, setFormState] = useState<FormState>('idle')
  const [result, setResult] = useState<ContactFormResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formState === 'submitting') return

    setFormState('submitting')
    setResult(null)

    try {
      const response = await submitContactForm(formData)
      setResult(response)

      if (response.success) {
        setFormState('success')
        setFormData({ name: '', email: '', subject: 'suporte', message: '' })
      } else {
        setFormState('error')
      }
    } catch {
      setFormState('error')
      setResult({
        success: false,
        message: 'Erro de conexão. Por favor, tente novamente.',
      })
    }
  }

  const resetForm = () => {
    setFormState('idle')
    setResult(null)
  }

  const getFieldError = (field: keyof ContactFormData) => result?.fieldErrors?.[field]

  return (
    <PublicPageLayout
      hero={{
        badge: { icon: MessageSquare, text: 'Contato' },
        title: 'Fale com a gente',
        subtitle: 'Tem alguma dúvida ou precisa de ajuda? Preencha o formulário e responderemos assim que possível.',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Contato' },
        ],
      }}
    >
      {/* Quick Links */}
      <section className="py-8">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/ajuda"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  Precisa de uma resposta rápida?
                </p>
                <p className="text-sm text-slate-500">
                  Consulte a Central de Ajuda
                </p>
              </div>
            </Link>
            <Link
              href="/documentacao"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  Quer aprender a usar a plataforma?
                </p>
                <p className="text-sm text-slate-500">
                  Acesse a Documentação
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-8 pb-16">
        <div className="container-custom max-w-2xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {formState === 'success' ? (
              <div className="text-center py-8" role="status">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Mensagem enviada</h2>
                <p className="text-slate-600 mb-6">
                  {result?.message || 'Recebemos sua mensagem e responderemos em breve.'}
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <>
                <SectionTitle
                  title="Envie uma mensagem"
                  subtitle="Preencha os campos abaixo e responderemos assim que possível."
                  size="sm"
                  align="left"
                  as="h2"
                  animate={false}
                />

                {formState === 'error' && result && !result.fieldErrors && (
                  <div
                    className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-3"
                    role="alert"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{result.message}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome"
                        className={`${inputClasses} ${getFieldError('name') ? errorInputClasses : ''}`}
                        aria-invalid={!!getFieldError('name')}
                        aria-describedby={getFieldError('name') ? 'name-error' : undefined}
                      />
                      {getFieldError('name') && (
                        <p id="name-error" className="mt-1 text-xs text-red-500">
                          {getFieldError('name')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 mb-2">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className={`${inputClasses} ${getFieldError('email') ? errorInputClasses : ''}`}
                        aria-invalid={!!getFieldError('email')}
                        aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                      />
                      {getFieldError('email') && (
                        <p id="email-error" className="mt-1 text-xs text-red-500">
                          {getFieldError('email')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-semibold text-slate-700 mb-2">
                      Assunto <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contact-subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={`${inputClasses} [&>option]:bg-white [&>option]:text-slate-900`}
                    >
                      <option value="suporte">Suporte</option>
                      <option value="comercial">Comercial</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700 mb-2">
                      Mensagem <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Descreva sua dúvida ou solicitação..."
                      className={`${inputClasses} resize-y min-h-[120px] ${getFieldError('message') ? errorInputClasses : ''}`}
                      aria-invalid={!!getFieldError('message')}
                      aria-describedby={getFieldError('message') ? 'message-error' : undefined}
                    />
                    {getFieldError('message') && (
                      <p id="message-error" className="mt-1 text-xs text-red-500">
                        {getFieldError('message')}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {formState === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Ao enviar, você concorda com nossa{' '}
                    <Link
                      href="/privacidade"
                      className="text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Email contact */}
      <section className="pb-16">
        <div className="container-custom max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 flex-shrink-0">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Prefere e-mail direto?</p>
              <a
                href="mailto:contato@poderosaagenda.com.br"
                className="text-slate-900 font-bold hover:text-primary-600 transition-colors"
              >
                contato@poderosaagenda.com.br
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}