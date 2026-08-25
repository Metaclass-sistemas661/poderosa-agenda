'use client'

import { Suspense, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors/mapper'
import { showErrorToast } from '@/lib/errors/toast'
import { useViaCEP } from '@/hooks/useViaCEP'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Access Request Page — Premium Dark Experience
 *
 * Epic 5.2H — Request Access • Dark Premium • UX • Validation • Accessibility
 *
 * IMPORTANT: This is NOT a registration/signup page.
 * It creates an ACCESS REQUEST that requires admin approval.
 *
 * Flow:
 * 1. User fills form
 * 2. Record inserted into `access_requests` table with status='pending'
 * 3. Success screen shown
 * 4. Admin reviews in /admin/solicitacoes
 * 5. Admin approves → user is created
 *
 * CRITICAL RULES:
 * - NO Header
 * - NO Footer
 * - NO FinalCTA
 * - NO PublicPageLayout
 * - Preserve existing database logic
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Brazilian states
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

// Professional count options
const PROFESSIONAL_OPTIONS = [
  { value: '1', label: 'Apenas eu' },
  { value: '2-3', label: '2 a 3 profissionais' },
  { value: '4-5', label: '4 a 5 profissionais' },
  { value: '6-10', label: '6 a 10 profissionais' },
  { value: '10+', label: 'Mais de 10 profissionais' },
]

function CadastroForm() {
  const searchParams = useSearchParams()
  const planType = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly'
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    address_zip: '',
    address_street: '',
    address_number: '',
    address_neighborhood: '',
    professionals: '',
    message: '',
  })

  const { fetchCep, formatCEP, isLoading: isLoadingCep, error: cepError, setError: setCepError } = useViaCEP()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isLoading) return

    setIsLoading(true)

    try {
      // Enterprise: Use RPC function for secure submission with validation
      // This avoids granting direct INSERT permission to anon users
      // Type cast needed until database types are regenerated
      const { data, error: rpcError } = await (supabase.rpc as any)('submit_access_request', {
        p_salon_name: formData.salonName,
        p_owner_name: formData.ownerName,
        p_email: formData.email,
        p_phone: formData.phone,
        p_city: formData.city,
        p_state: formData.state,
        p_address_zip: formData.address_zip || null,
        p_address_street: formData.address_street || null,
        p_address_number: formData.address_number || null,
        p_address_neighborhood: formData.address_neighborhood || null,
        p_professionals: formData.professionals,
        p_message: formData.message || null,
        p_source: 'website',
        p_plan_type: planType
      })

      if (rpcError) {
        const mappedError = mapSupabaseError(rpcError, 'submit_access_request')
        showErrorToast(mappedError)
      } else if (data && typeof data === 'object') {
        // Parse RPC response
        const response = data as { success: boolean; error?: string; message?: string }

        if (response.success) {
          setIsSubmitted(true)
        } else {
          // Fallback map if the RPC itself returned a string error code
          // Although the RPC returns strings like 'VALIDATION_ERROR', mapping helps unify
          showErrorToast({ code: 'INTERNAL_ERROR', message: response.message || 'Erro ao processar solicitação.', retryable: true })
        }
      } else {
        showErrorToast({ code: 'INTERNAL_ERROR', message: 'Resposta inesperada do servidor. Tente novamente.', retryable: true })
      }
    } catch (err) {
      const mappedError = mapSupabaseError(err, 'submit_access_request catch')
      showErrorToast(mappedError)
    }

    setIsLoading(false)
  }

  // Animation settings
  const fadeIn = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.4, ease: [0.16, 1, 0.3, 1] },
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Success Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-white py-8 md:py-12">

        {/* Background Image (Full Screen) - fixed para não quebrar no scroll do mobile */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
          aria-hidden="true"
        />

        {/* Soft Light Fade Gradient to blend the box */}
        <div
          className="fixed inset-0 z-0 bg-white/40 sm:bg-white/10 backdrop-blur-md sm:backdrop-blur-sm transition-all"
          aria-hidden="true"
        />
        <div
          className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_30%,rgba(255,255,255,0.4)_70%,transparent_100%)] pointer-events-none"
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-[600px] mx-auto px-6">

          {/* Back to home */}
          <motion.div
            {...fadeIn}
            className="absolute -top-12 left-6 sm:top-6 sm:-left-20 lg:-left-32 z-50"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-full px-4 py-2 bg-white/60 hover:bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Início</span>
            </Link>
          </motion.div>

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-2xl border border-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.06)] text-center"
          >
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Solicitação enviada!</h2>
            <p className="text-slate-600 mb-8">
              Recebemos seus dados. Nossa equipe analisará seu cadastro e entraremos em contato pelo WhatsApp em breve.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Voltar ao início
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Request Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white py-8 md:py-12">

      {/* Background Image (Full Screen) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-right bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
        aria-hidden="true"
      />

      {/* Soft Light Fade Gradient: Forte na esquerda e sumindo para a direita */}
      <div
        className="fixed inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/80 backdrop-blur-[2px] sm:backdrop-blur-none transition-all pointer-events-none"
      />

      {/* Dotted Wave Divider (Reference aesthetic) */}
      <div className="fixed inset-y-0 left-[65%] md:left-[65%] lg:left-[60%] xl:left-[55%] 2xl:left-[50%] z-0 pointer-events-none hidden md:block w-[150px]">
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full text-slate-300/40" stroke="currentColor" fill="none">
          <path d="M50,0 C90,250 10,500 50,750 C90,1000 10,1250 50,1500" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 py-8 flex flex-col justify-between min-h-[100dvh]">

        {/* Logo (Top Left Corner) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Link
            href="/"
            className="inline-block text-xl md:text-2xl font-logo uppercase tracking-[0.25em] font-semibold text-primary-600 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-lg py-1"
          >
            PODEROSA AGENDA
          </Link>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-[600px] md:ml-32 lg:ml-48 xl:ml-72 py-12">

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white/90 backdrop-blur-2xl border border-white rounded-[32px] p-6 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-left mb-8">
                <h1 className="text-2xl font-display font-semibold text-slate-900 mb-2">
                  Solicitar Acesso
                </h1>
                <p className="text-slate-500 text-sm">
                  Preencha os dados abaixo e entraremos em contato.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Salon Name & Owner Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="salonName" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                      Nome do Salão <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                      <input
                        id="salonName"
                        type="text"
                        required
                        value={formData.salonName}
                        onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                        placeholder="Salão Beleza Total"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                      Seu Nome <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                      <input
                        id="ownerName"
                        type="text"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                        placeholder="Maria Silva"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Address Complete Section */}
                <div className="border-t border-slate-100 pt-6 mt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 pl-1">Endereço Completo</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                        <input
                          type="text"
                          value={formData.address_zip}
                          onChange={async (e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                            const formatted = formatCEP(e.target.value);
                            setFormData({ ...formData, address_zip: formatted });
                            if (val.length === 8) {
                              const result = await fetchCep(val);
                              if (result) {
                                setFormData(prev => ({
                                  ...prev,
                                  address_zip: formatted,
                                  address_street: result.isGeneral ? '' : result.address,
                                  address_neighborhood: result.isGeneral ? '' : result.neighborhood,
                                  city: result.city,
                                  state: result.state
                                }));
                                setTimeout(() => {
                                  const nextId = result.isGeneral ? 'landing-street' : 'landing-number';
                                  document.getElementById(nextId)?.focus();
                                }, 50);
                              }
                            } else {
                              setCepError(null);
                            }
                          }}
                          className="w-full pl-11 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                          placeholder="CEP"
                        />
                        {isLoadingCep && <div className="absolute right-3 top-3.5"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" /></div>}
                      </div>
                      {cepError && <p className="text-xs text-red-400 mt-1 ml-1">{cepError}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <input
                        id="landing-street"
                        type="text"
                        value={formData.address_street}
                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                        placeholder="Rua / Avenida"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                      <input
                        id="landing-number"
                        type="text"
                        value={formData.address_number}
                        onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                        placeholder="Número"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={formData.address_neighborhood}
                        onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                        placeholder="Bairro"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                        Cidade <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                        <input
                          id="city"
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                          placeholder="São Paulo"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                        Estado <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="state"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:bg-white"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                      >
                        <option value="" className="text-slate-500">Selecione</option>
                        {BRAZILIAN_STATES.map((uf) => (
                          <option key={uf} value={uf} className="text-slate-900 bg-white">{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Professionals */}
                <div>
                  <label htmlFor="professionals" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Quantos profissionais? <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <select
                      id="professionals"
                      required
                      value={formData.professionals}
                      onChange={(e) => setFormData({ ...formData, professionals: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:bg-white"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    >
                      <option value="" className="text-slate-500">Selecione</option>
                      {PROFESSIONAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Mensagem <span className="text-white/30">(opcional)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
                    <textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-none hover:bg-white"
                      placeholder="Conte-nos um pouco sobre seu salão..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-4 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-primary-500/20 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      <span>Enviando...</span>
                    </span>
                  ) : (
                    'Enviar Solicitação'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                  Já possui conta?{' '}
                  <Link
                    href="/login"
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-sm"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Full Width */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full mt-12 py-6 border-t border-slate-200/50"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:px-8">
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/sobre" className="hover:text-primary-600 transition-colors">Sobre</Link>
              <Link href="/termos" className="hover:text-primary-600 transition-colors">Termos & Condições</Link>
              <Link href="/privacidade" className="hover:text-primary-600 transition-colors">Política de Privacidade</Link>
              <Link href="/contato" className="hover:text-primary-600 transition-colors">Contato</Link>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#" className="hover:text-primary-600 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
          <div className="mt-4 md:px-8 text-xs text-slate-400">
            © {new Date().getFullYear()} Poderosa Agenda. Todos os direitos reservados.
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1419] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>}>
      <CadastroForm />
    </Suspense>
  )
}