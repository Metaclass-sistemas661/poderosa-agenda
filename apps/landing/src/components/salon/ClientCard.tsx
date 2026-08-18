'use client'

import { Phone, Mail, Star, Eye, Edit3, Trash2, Calendar } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

interface ClientCardProps {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  isVip?: boolean
  totalVisits: number
  totalSpent: number
  lastVisitAt?: string | null
  status: 'active' | 'inactive' | 'blocked'
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onWhatsApp?: () => void
}

export function ClientCard({
  name,
  phone,
  email,
  isVip = false,
  totalVisits,
  totalSpent,
  lastVisitAt,
  status,
  onView,
  onEdit,
  onDelete,
  onWhatsApp
}: ClientCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="bg-[#1a2332] rounded-xl p-4 border border-white/5 hover:border-emerald-500/30 transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">{getInitials(name)}</span>
          </div>
          {isVip && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{name}</h3>
            <StatusBadge status={status} />
          </div>
          
          {phone && (
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
              <Phone className="w-3 h-3" />
              {formatPhone(phone)}
            </p>
          )}
          
          {email && (
            <p className="text-gray-500 text-xs flex items-center gap-1.5 mt-0.5 truncate">
              <Mail className="w-3 h-3" />
              {email}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onView && (
            <button
              onClick={onView}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Ver detalhes"
            >
              <Eye className="w-4 h-4" />
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
        <div className="text-center">
          <p className="text-white font-bold">{totalVisits}</p>
          <p className="text-gray-500 text-xs">Visitas</p>
        </div>
        <div className="text-center">
          <p className="text-emerald-400 font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-gray-500 text-xs">Total gasto</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">
            {lastVisitAt ? formatDate(lastVisitAt) : '-'}
          </p>
          <p className="text-gray-500 text-xs">Última visita</p>
        </div>
      </div>
    </div>
  )
}