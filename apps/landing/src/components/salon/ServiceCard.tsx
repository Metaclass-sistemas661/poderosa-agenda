'use client'

import { Clock, DollarSign, Power, Edit3, Trash2 } from 'lucide-react'

interface ServiceCardProps {
  id: string
  name: string
  description?: string | null
  category?: string | null
  price: number
  duration: number
  isActive: boolean
  commissionRate?: number | null
  onEdit?: () => void
  onDelete?: () => void
  onToggleActive?: () => void
}

export function ServiceCard({
  name,
  description,
  category,
  price,
  duration,
  isActive,
  commissionRate,
  onEdit,
  onDelete,
  onToggleActive
}: ServiceCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`
  }

  return (
    <div className={`bg-[#1a2332] rounded-xl p-4 border transition-all ${
      isActive 
        ? 'border-white/5 hover:border-emerald-500/30' 
        : 'border-white/5 opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{name}</h3>
            {!isActive && (
              <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-lg">
                Inativo
              </span>
            )}
          </div>
          
          {category && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg">
              {category}
            </span>
          )}
          
          {description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {onToggleActive && (
            <button
              onClick={onToggleActive}
              className={`p-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-emerald-400 hover:bg-emerald-500/10' 
                  : 'text-gray-400 hover:bg-white/5'
              }`}
              title={isActive ? 'Desativar' : 'Ativar'}
            >
              <Power className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(duration)}</span>
          </div>
          {commissionRate && commissionRate > 0 && (
            <span className="text-gray-500 text-sm">
              {commissionRate}% comissão
            </span>
          )}
        </div>
        <p className="text-emerald-400 font-bold text-lg">{formatCurrency(price)}</p>
      </div>
    </div>
  )
}