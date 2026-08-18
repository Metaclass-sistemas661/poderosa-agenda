'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Gift, ChevronRight, CheckCircle, Zap, Shield, Rocket, Bug, AlertTriangle } from 'lucide-react'
import { APP_VERSION, hasSeenVersion, markVersionAsSeen } from '@/lib/version'
import { getLatestRelease, getCategoryConfig, type ChangeCategory, type Release } from '@/lib/changelog'

const categoryIcons: Record<ChangeCategory, any> = {
  feature: Gift,
  improvement: Zap,
  fix: Bug,
  security: Shield,
  performance: Rocket,
  breaking: AlertTriangle,
}

interface WhatsNewModalProps {
  forceOpen?: boolean
  onClose?: () => void
}

export function WhatsNewModal({ forceOpen, onClose }: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [release, setRelease] = useState<Release | null>(null)

  useEffect(() => {
    if (forceOpen) {
      setRelease(getLatestRelease())
      setIsOpen(true)
      return
    }

    // Verifica se há nova versão não vista
    const hasSeen = hasSeenVersion(APP_VERSION)
    if (!hasSeen) {
      setRelease(getLatestRelease())
      setIsOpen(true)
    }
  }, [forceOpen])

  const handleClose = () => {
    markVersionAsSeen(APP_VERSION)
    setIsOpen(false)
    onClose?.()
  }

  if (!release) return null

  // Agrupa mudanças por categoria
  const groupedChanges = release.changes.reduce((acc, change) => {
    if (!acc[change.category]) acc[change.category] = []
    acc[change.category].push(change)
    return acc
  }, {} as Record<ChangeCategory, typeof release.changes>)

  const categoryOrder: ChangeCategory[] = ['feature', 'improvement', 'security', 'performance', 'fix', 'breaking']

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#1a2332] to-[#0f1419] rounded-3xl shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Header com Gradiente */}
            <div className="relative overflow-hidden">
              {/* Background decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2230%22 height=%2230%22 viewBox=%220 0 30 30%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M15 0L30 15L15 30L0 15Z%22 fill=%22rgba(255,255,255,0.05)%22/%3E%3C/svg%3E')] opacity-50" />
              
              <div className="relative p-6 sm:p-8">
                {/* Botão Fechar */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Ícone e Título */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    O que há de novo
                  </h2>
                  <p className="text-white/70 text-sm">Versão {release.version}</p>
                </div>

                {/* Badge do título */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-semibold text-sm">{release.title}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de descrição */}
            <div className="px-4 sm:px-6 -mt-4 relative z-10">
              <div className="bg-[#242d3d] rounded-2xl p-4 border border-white/5 shadow-xl">
                <p className="text-gray-300 text-sm leading-relaxed">{release.description}</p>
                <p className="text-gray-500 text-xs mt-2">
                  📅 {new Date(release.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Lista de Mudanças */}
            <div className="p-4 sm:p-6 max-h-[40vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {categoryOrder.map((category) => {
                  const changes = groupedChanges[category]
                  if (!changes || changes.length === 0) return null

                  const config = getCategoryConfig(category)
                  const Icon = categoryIcons[category]

                  return (
                    <div key={category} className="bg-[#1e2736]/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <h3 className={`text-sm font-bold ${config.color}`}>
                          {config.label}s
                        </h3>
                        <span className="text-gray-500 text-xs">({changes.length})</span>
                      </div>

                      <div className="space-y-2">
                        {changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{change.title}</p>
                              {change.description && (
                                <p className="text-gray-400 text-xs mt-0.5">{change.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 pt-2 bg-gradient-to-t from-[#0f1419] to-transparent">
              <button
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
              >
                <span>Começar a usar!</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Badge de versão para mostrar no rodapé/sidebar
 */
export function VersionBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all group w-full"
      title="Ver novidades"
    >
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-xs text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors">
        v{APP_VERSION}
      </span>
    </button>
  )
}