'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors/mapper'
import { showErrorToast } from '@/lib/errors/toast'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Reset Password Page — Premium Dark Experience
 *
 * Epic 5.2I — Password Reset • Secure Update • Dark Premium • Accessibility
 *
 * Flow:
 * 1. User clicks link from email
 * 2. Supabase auto-detects tokens via detectSessionInUrl
 * 3. User enters new password
 * 4. Password updated via updateUser
 * 5. Redirect to login
 *
 * CRITICAL RULES:
 * - NO Header
 * - NO Footer
 * - NO FinalCTA
 * - NO PublicPageLayout
 * - Validate password strength
 * - Handle token errors
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Check for valid session on mount (Supabase auto-detects tokens from URL)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()

    // Listen for auth state changes (token detection)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      } else if (session) {
        setIsValidSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres.'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra maiúscula.'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra minúscula.'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'A senha deve conter pelo menos um número.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return

    // Validate passwords match
    if (password !== confirmPassword) {
      showErrorToast({ code: 'VALIDATION_ERROR', message: 'As senhas não coincidem.', retryable: true })
      return
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      showErrorToast({ code: 'VALIDATION_ERROR', message: passwordError, retryable: true })
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        const mappedError = mapSupabaseError(updateError, 'updateUser')
        showErrorToast(mappedError)
      } else {
        setIsSuccess(true)
        // Sign out after password change
        await supabase.auth.signOut()
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      const mappedError = mapSupabaseError(err, 'updateUser catch')
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
  // Loading State (checking session)
  // ─────────────────────────────────────────────────────────────────────────
  if (isValidSession === null) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
        <div className="relative z-10 text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-white/60">Verificando...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Invalid/Expired Token
  // ─────────────────────────────────────────────────────────────────────────
  if (isValidSession === false) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
        <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/[0.025] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-12 max-w-md mx-6 text-center shadow-2xl shadow-black/40"
        >
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" aria-hidden="true" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Link inválido ou expirado
          </h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            O link de redefinição de senha expirou ou já foi utilizado. Solicite um novo link.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/esqueci-senha"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold rounded-xl shadow-lg shadow-secondary-500/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50"
            >
              Solicitar novo link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 text-white/60 hover:text-white/90 font-medium transition-colors duration-200"
            >
              Voltar ao login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Success Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
        <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/[0.025] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-12 max-w-md mx-6 text-center shadow-2xl shadow-black/40"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" aria-hidden="true" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Senha atualizada!
          </h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
          </p>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold rounded-xl shadow-lg shadow-secondary-500/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50"
          >
            Ir para o login
          </Link>
        </motion.div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password Reset Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" aria-hidden="true" />
      
      <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
      
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 py-8">
        
        <motion.div {...fadeIn} className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-md px-1 py-0.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Voltar ao login</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.025] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-block text-2xl font-display font-bold text-white mb-4 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-lg px-2 py-1"
            >
              Poderosa<span className="font-light">Agenda</span>
            </Link>
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              Redefinir senha
            </h1>
            <p className="text-white/50 text-sm">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Mínimo 8 caracteres, com maiúscula, minúscula e número.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50 rounded-md"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  <span>Atualizando...</span>
                </span>
              ) : (
                'Redefinir senha'
              )}
            </button>
          </form>
        </motion.div>

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