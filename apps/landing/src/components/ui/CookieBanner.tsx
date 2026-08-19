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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[420px] z-[9999] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6 flex flex-col gap-4 relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-primary-500" />
          </div>
          <div className="pr-4">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Privacidade e Cookies</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Utilizamos cookies para melhorar sua experiência em nossa plataforma, analisar o tráfego e personalizar conteúdo. 
              Ao continuar, você concorda com nossa{' '}
              <Link href="/privacidade" className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <button
            onClick={reject}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200"
          >
            Rejeitar Não Essenciais
          </button>
          <button
            onClick={accept}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
          >
            Aceitar Todos
          </button>
        </div>
      </div>
    </div>
  )
}