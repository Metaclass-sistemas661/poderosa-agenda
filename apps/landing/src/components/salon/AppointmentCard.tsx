'use client'

import { Clock, Phone, CheckCircle, Play, Edit3, Trash2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

interface AppointmentCardProps {
  id: string
  clientName: string
  clientPhone?: string | null
  serviceName: string
  servicePrice?: number | null
  professionalName?: string
  scheduledTime: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  onConfirm?: () => void
  onStart?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onWhatsApp?: () => void
}

export function AppointmentCard({
  clientName,
  clientPhone,
  serviceName,
  servicePrice,
  professionalName,
  scheduledTime,
  status,
  onConfirm,
  onStart,
  onEdit,
  onDelete,
  onWhatsApp
}: AppointmentCardProps) {
  const formatTime = (time: string) => time?.substring(0, 5) || ''
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors">
      <div className="text-center min-w-[60px]">
        <p className="text-white font-bold text-lg">{formatTime(scheduledTime)}</p>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{clientName}</p>
        <p className="text-gray-400 text-sm truncate">{serviceName}</p>
        {professionalName && (
          <p className="text-gray-500 text-xs">com {professionalName}</p>
        )}
        {servicePrice && (
          <p className="text-emerald-400 text-sm font-medium mt-1">
            {formatCurrency(servicePrice)}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <StatusBadge status={status} type="appointment" />
        
        {clientPhone && onWhatsApp && (
          <button
            onClick={onWhatsApp}
            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
            title="WhatsApp"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}
        
        {status === 'scheduled' && onConfirm && (
          <button
            onClick={onConfirm}
            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
            title="Confirmar"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        
        {status === 'confirmed' && onStart && (
          <button
            onClick={onStart}
            className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
            title="Iniciar"
          >
            <Play className="w-4 h-4" />
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
  )
}