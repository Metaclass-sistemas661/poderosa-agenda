'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors/mapper'
import { showErrorToast } from '@/lib/errors/toast'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Reset Password Page — Light Theme Experience
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

    if (password !== confirmPassword) {
      showErrorToast({ code: 'VALIDATION_ERROR', message: 'As senhas não coincidem.', retryable: true })
      return
    }

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
  // Wrapper Components for Layout
  // ─────────────────────────────────────────────────────────────────────────
  const PageBackground = () => (
    <>
      <div
        className="fixed inset-0 z-0 bg-cover bg-right bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/80 backdrop-blur-[2px] sm:backdrop-blur-none transition-all pointer-events-none"
      />
      <div className="fixed inset-y-0 left-[65%] md:left-[65%] lg:left-[60%] xl:left-[55%] 2xl:left-[50%] z-0 pointer-events-none hidden md:block w-[150px]">
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full text-slate-300/40" stroke="currentColor" fill="none">
          <path d="M50,0 C90,250 10,500 50,750 C90,1000 10,1250 50,1500" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" />
        </svg>
      </div>
    </>
  )

  const PageLogo = () => (
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
  )

  const PageFooter = () => (
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
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Loading State (checking session)
  // ─────────────────────────────────────────────────────────────────────────
  if (isValidSession === null) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
        <PageBackground />
        <div className="relative z-10 w-full px-6 md:px-12 py-8 flex flex-col justify-between min-h-[100dvh]">
          <PageLogo />
          <div className="flex-1 flex flex-col justify-center items-center">
             <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4" aria-hidden="true" />
             <p className="text-slate-500">Verificando autorização...</p>
          </div>
          <PageFooter />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Invalid/Expired Token
  // ─────────────────────────────────────────────────────────────────────────
  if (isValidSession === false) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
        <PageBackground />
        <div className="relative z-10 w-full px-6 md:px-12 py-8 flex flex-col justify-between min-h-[100dvh]">
          <PageLogo />

          <div className="flex-1 flex flex-col justify-center w-full max-w-[480px] md:ml-32 lg:ml-48 xl:ml-72 py-12">
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-amber-500" aria-hidden="true" />
                </div>
                
                <h1 className="text-2xl font-display font-bold text-slate-900 mb-4">
                  Link inválido ou expirado
                </h1>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  O link de redefinição de senha expirou ou já foi utilizado. Solicite um novo link.
                </p>
                
                <div className="space-y-3">
                  <Link
                    href="/esqueci-senha"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    Solicitar novo link
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 text-slate-500 hover:text-primary-600 font-medium transition-colors duration-200"
                  >
                    Voltar ao login
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
          <PageFooter />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Success Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
        <PageBackground />
        <div className="relative z-10 w-full px-6 md:px-12 py-8 flex flex-col justify-between min-h-[100dvh]">
          <PageLogo />

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
                  Senha atualizada!
                </h1>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
                </p>
                
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                >
                  Ir para o login
                </Link>
              </div>
            </motion.div>
          </div>
          <PageFooter />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password Reset Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">
      <PageBackground />
      <div className="relative z-10 w-full px-6 md:px-12 py-8 flex flex-col justify-between min-h-[100dvh]">
        <PageLogo />

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
                  Redefinir senha
                </h1>
                <p className="text-slate-500 text-sm">
                  Digite sua nova senha abaixo.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-md bg-white shadow-sm border border-slate-100"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Mínimo 8 caracteres, com maiúscula, minúscula e número.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2 pl-1">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-md bg-white shadow-sm border border-slate-100"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      <span>Atualizando...</span>
                    </span>
                  ) : (
                    'Redefinir senha'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        <PageFooter />
      </div>
    </div>
  )
}