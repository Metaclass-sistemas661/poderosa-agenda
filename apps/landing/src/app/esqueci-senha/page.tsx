'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Forgot Password Page — Premium Dark Experience
 *
 * Epic 5.2I — Password Recovery • Secure Reset • Dark Premium • Accessibility
 *
 * Flow:
 * 1. User enters email
 * 2. Supabase sends reset email with magic link
 * 3. Link redirects to /redefinir-senha
 *
 * CRITICAL RULES:
 * - NO Header
 * - NO Footer
 * - NO FinalCTA
 * - NO PublicPageLayout
 * - Safe error messages (no account enumeration)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function EsqueciSenhaPage() {
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)
    setError('')

    try {
      // Supabase password reset - sends email with magic link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (resetError) {
        // Safe error message - don't reveal if email exists
        console.error('Reset error:', resetError)
        setError('Não foi possível enviar o email. Tente novamente.')
      } else {
        // Always show success to prevent email enumeration
        setIsSubmitted(true)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    }

    setIsLoading(false)
  }

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
      <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
        {/* Dark Premium Background */}
        <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
        <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 bg-white/[0.025] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-12 max-w-md mx-6 text-center shadow-2xl shadow-black/40"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-secondary-500/10 border border-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-secondary-400" aria-hidden="true" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Verifique seu email
          </h1>
          <p className="text-white/60 mb-4 leading-relaxed">
            Se o email <strong className="text-white/80">{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <p className="text-white/40 text-sm mb-8">
            O link expira em 1 hora. Verifique também a pasta de spam.
          </p>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold rounded-xl shadow-lg shadow-secondary-500/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
          >
            Voltar ao login
          </Link>
        </motion.div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Email Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
      {/* Dark Premium Background */}
      <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
      
      {/* Atmospheric glows */}
      <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Grid texture */}
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Edge vignette */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 py-8">
        
        {/* Back to login */}
        <motion.div {...fadeIn} className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-md px-1 py-0.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Voltar ao login</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.025] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-block text-2xl font-display font-bold text-white mb-4 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-lg px-2 py-1"
            >
              Poderosa<span className="font-light">Agenda</span>
            </Link>
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              Esqueceu sua senha?
            </h1>
            <p className="text-white/50 text-sm">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold rounded-xl shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  <span>Enviando...</span>
                </span>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-white/40 text-sm">
              Lembrou sua senha?{' '}
              <Link
                href="/login"
                className="text-secondary-400 hover:text-secondary-300 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-sm"
              >
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center text-white/20 text-xs mt-8"
        >
          © {new Date().getFullYear()} Poderosa Agenda
        </motion.p>
      </div>
    </div>
  )
}