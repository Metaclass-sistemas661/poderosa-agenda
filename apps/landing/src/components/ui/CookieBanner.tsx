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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Ícone + texto */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Usamos cookies 🍪</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Utilizamos cookies para melhorar sua experiência. Saiba mais em nossa{' '}
              <Link href="/privacidade" className="text-violet-600 hover:underline font-medium">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={reject}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl transition-opacity shadow-sm"
          >
            Aceitar todos
          </button>
          <button
            onClick={() => setVisible(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}