'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Construction, LogOut, Calendar, Users, DollarSign, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser({
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      })
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Poderosa Agenda
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm hidden sm:block">
                Olá, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Construction Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 mb-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Área em Construção
            </h1>
            <p className="text-white/80 max-w-md mx-auto">
              Estamos trabalhando duro para trazer o melhor sistema de gestão para seu salão. Em breve você terá acesso a todas as funcionalidades.
            </p>
          </div>

          {/* Preview Features */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            O que está por vir...
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Calendar, title: 'Agenda Online', desc: 'Gerencie todos os agendamentos em um só lugar', color: 'from-purple-500 to-indigo-500' },
              { icon: Users, title: 'Clientes', desc: 'Cadastro completo com histórico de atendimentos', color: 'from-blue-500 to-cyan-500' },
              { icon: DollarSign, title: 'Financeiro', desc: 'Controle de receitas, despesas e comissões', color: 'from-emerald-500 to-teal-500' },
              { icon: BarChart3, title: 'Relatórios', desc: 'Métricas e insights para seu negócio', color: 'from-pink-500 to-rose-500' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-gray-100 rounded-xl">
            <p className="text-gray-600 mb-2">
              Enquanto isso, entre em contato conosco:
            </p>
            <a 
              href="mailto:suporte@poderosaagenda.com.br" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              suporte@poderosaagenda.com.br
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  )
}