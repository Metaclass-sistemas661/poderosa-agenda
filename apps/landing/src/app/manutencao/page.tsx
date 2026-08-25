'use client'

import { motion } from 'framer-motion'
import { Settings, Wrench, ShieldAlert } from 'lucide-react'

export default function ManutencaoPage() {
  return (
    <div className="min-h-screen bg-[#0f1419] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-[#1a2332]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
          />
          <Settings className="w-10 h-10 text-emerald-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Sistema em Manutenção
        </h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Nossa plataforma está passando por uma atualização programada para melhorar a performance. 
          Estamos trabalhando nos bastidores e voltaremos em breve.
        </p>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 p-4 bg-black/30 rounded-2xl border border-white/5 transition-colors hover:border-emerald-500/30">
            <Wrench className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-left text-gray-300">
              Melhorias de infraestrutura e estabilidade
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-black/30 rounded-2xl border border-white/5 transition-colors hover:border-emerald-500/30">
            <ShieldAlert className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-left text-gray-300">
              Atualizações de segurança corporativa
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 w-full">
          <p className="text-xs text-gray-500">
            Poderosa Agenda &copy; {new Date().getFullYear()} — Obrigado pela paciência.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
