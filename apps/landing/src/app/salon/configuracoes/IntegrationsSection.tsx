'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { saveIntegrationCredential, saveWebhookOutbound } from '@/lib/actions/integrations'
import { Loader2, MessageCircle, Calendar, CreditCard, Mail, Webhook, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SalonIntegration } from '@/lib/database.types'

export function IntegrationsSection({ salonId }: { salonId: string }) {
  const [integration, setIntegration] = useState<SalonIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  // Form states
  const [whatsappForm, setWhatsappForm] = useState({ phoneId: '', accessToken: '' })
  const [paymentsForm, setPaymentsForm] = useState({ provider: 'mercado_pago', accessToken: '', publicKey: '' })
  const [emailForm, setEmailForm] = useState({ apiKey: '', domain: '' })
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] as string[] })
  const [isFormSaving, setIsFormSaving] = useState<string | null>(null)

  const handleSaveCredential = async (provider: string, type: string, token: string, metadata: any = {}) => {
    setIsFormSaving(provider)
    try {
      const res = await saveIntegrationCredential(salonId, provider, type, token, metadata)
      if (res.success) {
        setMessage({ type: 'success', text: 'Credenciais salvas e blindadas com sucesso!' })
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar credenciais: ' + res.error })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Erro inesperado: ' + e.message })
    } finally {
      setIsFormSaving(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleSaveWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url) return

    setIsFormSaving('webhook')
    try {
      const res = await saveWebhookOutbound(salonId, webhookForm.url, webhookForm.events)
      if (res.success) {
        setMessage({ type: 'success', text: 'Webhook cadastrado! O Secret gerado é: ' + res.secret })
        setShowWebhookModal(false)
        setWebhookForm({ name: '', url: '', events: [] })
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar webhook: ' + res.error })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Erro inesperado: ' + e.message })
    } finally {
      setIsFormSaving(null)
      setTimeout(() => setMessage(null), 8000)
    }
  }

  useEffect(() => {
    if (salonId) {
      loadIntegrations()
    }
  }, [salonId])

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('salon_integrations')
        .select('*')
        .eq('salon_id', salonId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setIntegration(data)
      } else {
        setIntegration({
          id: '',
          salon_id: salonId,
          whatsapp_enabled: false,
          whatsapp_provider: 'meta_api',
          calendar_enabled: false,
          payments_enabled: false,
          payments_primary_gateway: 'mercado_pago',
          email_enabled: false,
          email_provider: 'resend',
          api_webhooks_enabled: false,
          whatsapp_settings: {},
          calendar_settings: {},
          payments_settings: {},
          email_settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (field: keyof SalonIntegration) => {
    if (!integration || !integration.salon_id) return

    const newValue = !integration[field]
    const updatedIntegration = { ...integration, [field]: newValue }

    setIntegration(updatedIntegration)
    setIsSaving(true)
    setMessage(null)

    try {
      if (integration.id) {
        const { error } = await (supabase as any)
          .from('salon_integrations')
          .update({ [field]: newValue })
          .eq('id', integration.id)

        if (error) throw error
      } else {
        const { data, error } = await (supabase as any)
          .from('salon_integrations')
          .insert({
            salon_id: integration.salon_id,
            [field]: newValue
          })
          .select()
          .single()

        if (error) throw error
        if (data) setIntegration(data)
      }

      setMessage({ type: 'success', text: 'Integração atualizada com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setIntegration(integration)
      setMessage({ type: 'error', text: 'Erro ao atualizar integração: ' + error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[var(--color-primary-500)] animate-spin" />
      </div>
    )
  }

  const integrationModules = [
    {
      id: 'whatsapp_enabled',
      name: 'WhatsApp API Oficial',
      description: 'Envie lembretes e confirmações automáticas para seus clientes via WhatsApp.',
      icon: MessageCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      id: 'calendar_enabled',
      name: 'Google Calendar',
      description: 'Sincronize seus agendamentos com o Google Calendar em tempo real.',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      id: 'payments_enabled',
      name: 'Pix & Pagamentos',
      description: 'Gere cobranças via Pix e concilie pagamentos automaticamente.',
      icon: CreditCard,
      color: 'text-violet-500',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10'
    },
    {
      id: 'email_enabled',
      name: 'E-mail Transactional',
      description: 'Envie recibos e alertas via E-mail para clientes e equipe.',
      icon: Mail,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10'
    },
    {
      id: 'api_webhooks_enabled',
      name: 'API Pública & Webhooks',
      description: 'Conecte seu salão com outras ferramentas e ERPs.',
      icon: Webhook,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-500/10'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
    >
      <div className="p-8 border-b border-slate-200 dark:border-white/5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrações</h1>
        <p className="text-slate-500 dark:text-gray-400 mt-1">Conecte seu salão com as melhores ferramentas do mercado.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white",
              message.type === 'success' ? 'bg-[var(--color-primary-500)]' : 'bg-red-500'
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 space-y-6">

        <div className="grid gap-4">
          {integrationModules.map((module) => {
            const isEnabled = integration?.[module.id as keyof SalonIntegration] as boolean
            const Icon = module.icon

            return (
              <div key={module.id} className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex gap-4 items-start sm:items-center">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", module.bgColor)}>
                      <Icon className={cn("w-6 h-6", module.color)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{module.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{module.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => handleToggle(module.id as keyof SalonIntegration)}
                      disabled={isSaving}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isEnabled ? 'bg-[var(--color-primary-500)]' : 'bg-slate-300 dark:bg-gray-700',
                        isSaving ? 'opacity-50 cursor-not-allowed' : ''
                      )}
                    >
                      <span className="sr-only">Toggle {module.name}</span>
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {module.id === 'whatsapp_enabled' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Configurações da Meta API (WhatsApp Oficial)</h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Phone Number ID</label>
                              <input
                                type="text"
                                value={whatsappForm.phoneId}
                                onChange={e => setWhatsappForm({ ...whatsappForm, phoneId: e.target.value })}
                                placeholder="Ex: 1045982..."
                                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Permanent Access Token</label>
                              <input
                                type="password"
                                value={whatsappForm.accessToken}
                                onChange={e => setWhatsappForm({ ...whatsappForm, accessToken: e.target.value })}
                                placeholder="EAADxxxx..."
                                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => handleSaveCredential('meta_whatsapp', 'access_token', whatsappForm.accessToken, { phone_id: whatsappForm.phoneId })}
                              disabled={isFormSaving === 'meta_whatsapp'}
                              className="px-6 py-2.5 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                            >
                              {isFormSaving === 'meta_whatsapp' && <Loader2 className="w-4 h-4 animate-spin" />}
                              Salvar Credenciais
                            </button>
                          </div>
                        </div>
                      )}

                      {module.id === 'calendar_enabled' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Autenticação Google</h4>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Vincule sua conta do Google Workspace para sincronização bidirecional.</p>
                            </div>
                            {!isGoogleConnected ? (
                              <button
                                onClick={async () => {
                                  setIsGoogleLoading(true)
                                  try {
                                    const { data, error } = await supabase.auth.linkIdentity({
                                      provider: 'google',
                                      options: {
                                        scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                                        redirectTo: `${window.location.origin}/salon/configuracoes?tab=integrations`
                                      }
                                    })
                                    if (error) throw error
                                    // Se o redirecionamento funcionar, o usuário será levado para a tela do Google.
                                    // Caso contrário (ex: provider não configurado), cairá aqui.
                                  } catch (error: any) {
                                    setMessage({ type: 'error', text: 'Erro ao conectar com Google: ' + error.message })
                                    setIsGoogleLoading(false)
                                  }
                                }}
                                disabled={isGoogleLoading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                Autenticar com Google
                              </button>
                            ) : (
                              <button
                                onClick={() => setIsGoogleConnected(false)}
                                className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 text-sm font-semibold rounded-xl transition-all"
                              >
                                Desconectar
                              </button>
                            )}
                          </div>
                          <div className={cn(
                            "p-4 rounded-xl border",
                            isGoogleConnected
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                              : "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
                          )}>
                            {isGoogleConnected ? (
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Sincronização Ativa</p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Sua conta do Workspace (salao@exemplo.com) está sincronizando em tempo real.</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-blue-800 dark:text-blue-300">
                                Nenhuma conta vinculada atualmente. Autentique-se via OAuth 2.0 para começar a sincronizar seus eventos automaticamente.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {module.id === 'payments_enabled' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Gateway de Pagamentos</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Provedor Principal</label>
                              <select
                                value={paymentsForm.provider}
                                onChange={e => setPaymentsForm({ ...paymentsForm, provider: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                              >
                                <option value="mercado_pago">Mercado Pago (Pix + Cartões)</option>
                                <option value="stripe">Stripe</option>
                                <option value="asaas">Asaas</option>
                              </select>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Access Token (Produção)</label>
                                <input
                                  type="password"
                                  value={paymentsForm.accessToken}
                                  onChange={e => setPaymentsForm({ ...paymentsForm, accessToken: e.target.value })}
                                  placeholder="APP_USR-xxxx..."
                                  className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Chave Pública</label>
                                <input
                                  type="text"
                                  value={paymentsForm.publicKey}
                                  onChange={e => setPaymentsForm({ ...paymentsForm, publicKey: e.target.value })}
                                  placeholder="APP_USR-xxxx..."
                                  className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleSaveCredential(paymentsForm.provider, 'access_token', paymentsForm.accessToken, { public_key: paymentsForm.publicKey })}
                                disabled={isFormSaving === paymentsForm.provider}
                                className="px-6 py-2.5 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                              >
                                {isFormSaving === paymentsForm.provider && <Loader2 className="w-4 h-4 animate-spin" />}
                                Salvar Chaves da API
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {module.id === 'email_enabled' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Provedor de E-mail (Resend)</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">API Key do Resend / SendGrid</label>
                              <input
                                type="password"
                                value={emailForm.apiKey}
                                onChange={e => setEmailForm({ ...emailForm, apiKey: e.target.value })}
                                placeholder="re_xxxx..."
                                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Domínio Remetente (Verificado)</label>
                              <input
                                type="text"
                                value={emailForm.domain}
                                onChange={e => setEmailForm({ ...emailForm, domain: e.target.value })}
                                placeholder="no-reply@seusalao.com.br"
                                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[var(--color-primary-500)] outline-none"
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleSaveCredential('resend', 'api_key', emailForm.apiKey, { sender_domain: emailForm.domain })}
                                disabled={isFormSaving === 'resend'}
                                className="px-6 py-2.5 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                              >
                                {isFormSaving === 'resend' && <Loader2 className="w-4 h-4 animate-spin" />}
                                Salvar Configuração SMTP
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {module.id === 'api_webhooks_enabled' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Webhooks Outbound</h4>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Gerencie endpoints que receberão eventos do sistema em tempo real.</p>
                            </div>
                            <button
                              onClick={() => setShowWebhookModal(true)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              Novo Webhook
                            </button>
                          </div>
                          <div className="p-8 border border-dashed border-slate-300 dark:border-white/10 rounded-xl text-center">
                            <Webhook className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-gray-400">Nenhum webhook configurado. Crie um para receber notificações automáticas sobre novos agendamentos e pagamentos.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {showWebhookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWebhookModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Webhook className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Novo Webhook</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Adicionar endpoint de integração</p>
                  </div>
                </div>
                <button onClick={() => setShowWebhookModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Nome do Webhook</label>
                  <input
                    type="text"
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ex: ERP Integração ou Make.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Payload URL</label>
                  <input
                    type="url"
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="https://api.exemplo.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Eventos Assinados</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {['appointment.created', 'appointment.cancelled', 'payment.success', 'client.created'].map((evt) => (
                      <label key={evt} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl cursor-pointer hover:border-rose-500/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(evt)}
                          onChange={e => {
                            const newEvents = e.target.checked
                              ? [...webhookForm.events, evt]
                              : webhookForm.events.filter(x => x !== evt)
                            setWebhookForm({ ...webhookForm, events: newEvents })
                          }}
                          className="w-4 h-4 text-rose-500 rounded border-slate-300 focus:ring-rose-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-3">
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-xl transition-colors font-medium shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWebhook}
                  disabled={!webhookForm.name || !webhookForm.url || isFormSaving === 'webhook'}
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isFormSaving === 'webhook' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Webhook
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
