'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError('')

    // Create Supabase client with cookie-based auth (@supabase/ssr)
    const supabase = createClient()

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Email ou senha incorretos.')
        } else if (authError.message === 'Email not confirmed') {
          setError('Email não confirmado. Verifique sua caixa de entrada.')
        } else {
          setError('Não foi possível realizar o login. Tente novamente.')
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role, salon_id')
          .eq('user_id', data.user.id)
          .single()

        const typedAdminUser = adminUser as { role: string; salon_id: string | null } | null

        if (typedAdminUser) {
          if (typedAdminUser.role === 'superadmin') {
            router.push('/admin')
          } else {
            router.push('/salon')
          }
        } else {
          setError('Você não tem permissão para acessar. Entre em contato com o administrador.')
          setIsLoading(false)
        }
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setIsLoading(false)
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.4, ease: [0.16, 1, 0.3, 1] },
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-start relative overflow-hidden bg-white">

      {/* Background Image (Full Screen) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-right bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/salon-light-bg.png")' }}
        aria-hidden="true"
      />

      {/* Soft Light Fade Gradient: Forte na esquerda (onde fica o form) e sumindo para a direita */}
      <div
        className="fixed inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/80 backdrop-blur-[2px] sm:backdrop-blur-none transition-all pointer-events-none"
      />

      {/* Dotted Wave Divider (Reference aesthetic) */}
      <div className="fixed inset-y-0 left-[65%] md:left-[65%] lg:left-[60%] xl:left-[55%] 2xl:left-[50%] z-0 pointer-events-none hidden md:block w-[150px]">
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full text-slate-300/40" stroke="currentColor" fill="none">
          <path d="M50,0 C90,250 10,500 50,750 C90,1000 10,1250 50,1500" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
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
          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative overflow-hidden"
          >
            {/* Card subtle top glare */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-left mb-8">
                <h1 className="text-2xl font-display font-semibold text-slate-900 mb-2">
                  Acesse sua conta
                </h1>
                <p className="text-slate-500 text-sm">
                  Bem-vindo(a) de volta! Por favor, insira seus dados.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2 pl-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                    placeholder="seu@email.com"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2 pl-1"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-5 py-3.5 pr-12 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:bg-white"
                      placeholder="••••••••"
                      aria-describedby={error ? 'login-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-md bg-white shadow-sm border border-slate-100"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-1">
                  <Link
                    href="/esqueci-senha"
                    className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-sm"
                  >
                    Esqueceu a senha?
                  </Link>
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
                      <span>Entrando...</span>
                    </span>
                  ) : (
                    'Entrar na Plataforma'
                  )}
                </button>
              </form>

              {/* Secondary Actions */}
              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                  Ainda não possui conta?{' '}
                  <Link
                    href="/cadastro"
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-sm"
                  >
                    Criar conta grátis
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