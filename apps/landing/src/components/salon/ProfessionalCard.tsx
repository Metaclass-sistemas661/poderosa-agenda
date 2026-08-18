'use client'

import { Phone, Mail, Clock, Edit3, Trash2, Scissors } from 'lucide-react'
import { StatusDot } from './StatusBadge'

interface ProfessionalCardProps {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  specialty?: string[] | null
  commissionRate: number
  workingDays: Record<string, boolean>
  workingHours: { start: string; end: string }
  status: 'active' | 'inactive' | 'vacation'
  photoUrl?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export function ProfessionalCard({
  name,
  email,
  phone,
  role,
  specialty,
  commissionRate,
  workingDays,
  workingHours,
  status,
  photoUrl,
  onEdit,
  onDelete
}: ProfessionalCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  const daysAbbrev = [
    { key: 'mon', label: 'S' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'Q' },
    { key: 'thu', label: 'Q' },
    { key: 'fri', label: 'S' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'D' },
  ]

  const statusLabels = {
    active: 'Ativo',
    inactive: 'Inativo',
    vacation: 'Férias'
  }

  return (
    <div className="bg-[#1a2332] rounded-xl p-4 border border-white/5 hover:border-emerald-500/30 transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-white font-bold text-lg">{getInitials(name)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{name}</h3>
            <StatusDot status={status} />
          </div>
          
          {role && (
            <p className="text-emerald-400 text-sm">{role}</p>
          )}
          
          {phone && (
            <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" />
              {formatPhone(phone)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
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

      {/* Specialties */}
      {specialty && specialty.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {specialty.slice(0, 3).map((spec, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-lg"
            >
              {spec}
            </span>
          ))}
          {specialty.length > 3 && (
            <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded-lg">
              +{specialty.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        {/* Working Days */}
        <div className="flex gap-1">
          {daysAbbrev.map((day) => (
            <span
              key={day.key}
              className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                workingDays[day.key]
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-gray-600'
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>

        {/* Commission */}
        <div className="text-right">
          <span className="text-emerald-400 font-medium">{commissionRate}%</span>
          <p className="text-gray-500 text-xs">comissão</p>
        </div>
      </div>

      {/* Working Hours */}
      <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-xs">
        <Clock className="w-3 h-3" />
        <span>{workingHours.start} - {workingHours.end}</span>
      </div>
    </div>
  )
}