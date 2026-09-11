'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors/mapper'
import { showErrorToast } from '@/lib/errors/toast'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Forgot Password Page — Light Theme Experience
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function EsqueciSenhaPage() {
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)

    try {
      // Supabase password reset - sends email with magic link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (resetError) {
        const mappedError = mapSupabaseError(resetError, 'resetPassword')
        showErrorToast(mappedError)
      } else {
        // Always show success to prevent email enumeration
        setIsSubmitted(true)
      }
    } catch (err) {
      const mappedError = mapSupabaseError(err, 'resetPassword catch')
      showErrorToast(mappedError)
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
      <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
        {/* Background Image (Full Screen) */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-right bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
          aria-hidden="true"
        />

        {/* Soft Light Fade Gradient */}
        <div
          className="fixed inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/80 backdrop-blur-[2px] sm:backdrop-blur-none transition-all pointer-events-none"
        />

        {/* Dotted Wave Divider */}
        <div className="fixed inset-y-0 left-[65%] md:left-[65%] lg:left-[60%] xl:left-[55%] 2xl:left-[50%] z-0 pointer-events-none hidden md:block w-[150px]">
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full text-slate-300/40" stroke="currentColor" fill="none">
            <path d="M50,0 C90,250 10,500 50,750 C90,1000 10,1250 50,1500" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" />
          </svg>
        </div>

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

          <div className="flex-1 flex flex-col justify-center w-full max-w-[480px] md:ml-32 lg:ml-48 xl:ml-72 py-12">
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
                </motion.div>
                
                <h1 className="text-2xl font-display font-bold text-slate-900 mb-4">
                  Verifique seu email
                </h1>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Se o email <strong className="text-slate-900">{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <p className="text-slate-400 text-sm mb-8">
                  O link expira em 1 hora. Verifique também a pasta de spam.
                </p>
                
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                >
                  Voltar ao login
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full mt-12 py-6 border-t border-slate-200/50"
          >
             <div className="mt-4 md:px-8 text-xs text-slate-400">
              © {new Date().getFullYear()} Poderosa Agenda. Todos os direitos reservados.
            </div>
          </motion.footer>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Email Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
      {/* Background Image (Full Screen) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-right bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
        aria-hidden="true"
      />

      {/* Soft Light Fade Gradient */}
      <div
        className="fixed inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/80 backdrop-blur-[2px] sm:backdrop-blur-none transition-all pointer-events-none"
      />

      {/* Dotted Wave Divider */}
      <div className="fixed inset-y-0 left-[65%] md:left-[65%] lg:left-[60%] xl:left-[55%] 2xl:left-[50%] z-0 pointer-events-none hidden md:block w-[150px]">
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full text-slate-300/40" stroke="currentColor" fill="none">
          <path d="M50,0 C90,250 10,500 50,750 C90,1000 10,1250 50,1500" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" />
        </svg>
      </div>

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
        <div className="flex-1 flex flex-col justify-center w-full max-w-[480px] md:ml-32 lg:ml-48 xl:ml-72 py-12">
          
          <motion.div {...fadeIn} className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-md px-1 py-0.5"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Voltar ao login</span>
            </Link>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

            <div className="relative z-10">
              <div className="text-left mb-8">
                <h1 className="text-2xl font-display font-semibold text-slate-900 mb-2">
                  Esqueceu sua senha?
                </h1>
                <p className="text-slate-500 text-sm">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-4 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
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

              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                  Lembrou sua senha?{' '}
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

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full mt-12 py-6 border-t border-slate-200/50"
        >
          <div className="mt-4 md:px-8 text-xs text-slate-400">
            © {new Date().getFullYear()} Poderosa Agenda. Todos os direitos reservados.
          </div>
        </motion.footer>
      </div>
    </div>
  )
}