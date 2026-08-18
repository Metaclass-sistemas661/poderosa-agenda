'use client'

import { LucideIcon, Clock, CheckCircle, Play, CheckSquare, Ban, AlertCircle } from 'lucide-react'

type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
type GenericStatus = 'active' | 'inactive' | 'vacation' | 'blocked' | 'pending' | 'paid' | 'partial' | 'refunded'

interface StatusConfig {
  label: string
  color: string
  icon?: LucideIcon
}

const appointmentStatusConfig: Record<AppointmentStatus, StatusConfig> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  in_progress: { label: 'Em andamento', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Play },
  completed: { label: 'Concluído', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: CheckSquare },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Ban },
  no_show: { label: 'Não compareceu', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
}

const genericStatusConfig: Record<GenericStatus, StatusConfig> = {
  active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  inactive: { label: 'Inativo', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  vacation: { label: 'Férias', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  blocked: { label: 'Bloqueado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  paid: { label: 'Pago', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  partial: { label: 'Parcial', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

interface StatusBadgeProps {
  status: AppointmentStatus | GenericStatus
  type?: 'appointment' | 'generic'
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ 
  status, 
  type = 'generic', 
  showIcon = true,
  size = 'sm' 
}: StatusBadgeProps) {
  const config = type === 'appointment' 
    ? appointmentStatusConfig[status as AppointmentStatus] 
    : genericStatusConfig[status as GenericStatus]

  if (!config) return null

  const Icon = config.icon
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-medium border ${config.color} ${sizeClasses}`}>
      {showIcon && Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </span>
  )
}

// Dot variant for simpler status indicators
interface StatusDotProps {
  status: 'active' | 'inactive' | 'vacation'
  label?: string
}

export function StatusDot({ status, label }: StatusDotProps) {
  const dotColors = {
    active: 'bg-emerald-400',
    inactive: 'bg-gray-400',
    vacation: 'bg-amber-400',
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
      {label && <span className="text-gray-400 text-sm">{label}</span>}
    </div>
  )
}