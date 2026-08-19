'use client'

import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'
import Link from 'next/link'

const COOKIE_KEY = 'poderosa_agenda_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Mostra o banner se o usuário ainda não respondeu
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      // Pequeno delay para não aparecer imediatamente ao carregar
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Escuta o evento customizado disparado pelo link do footer
    const handler = () => setVisible(true)
    window.addEventListener('show-cookie-banner', handler)
    return () => window.removeEventListener('show-cookie-banner', handler)
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-full duration-500 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-8 justify-between relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 flex-1 w-full lg:w-auto pr-8 lg:pr-0">
          <div className="hidden sm:flex w-10 h-10 bg-primary-50 rounded-full items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Privacidade e Cookies</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
              Nós utilizamos cookies e tecnologias semelhantes para aprimorar sua experiência em nossa plataforma, analisar o tráfego e oferecer conteúdo personalizado. Ao continuar navegando, você concorda com a nossa{' '}
              <Link href="/privacidade" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2 transition-colors">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
          <button
            onClick={reject}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all duration-200 whitespace-nowrap"
          >
            Rejeitar Não Essenciais
          </button>
          <button
            onClick={accept}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap"
          >
            Aceitar Todos os Cookies
          </button>
        </div>
      </div>
    </div>
  )
}