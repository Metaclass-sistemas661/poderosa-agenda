/**
 * Validations and Formatting Utilities
 * Funções reutilizáveis para validação e formatação de dados
 */

// ============================================================================
// FORMATAÇÃO DE STRINGS
// ============================================================================

/**
 * Formata um CPF (000.000.000-00)
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

/**
 * Formata um CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
}

/**
 * Formata um telefone (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

/**
 * Formata um CEP (00000-000)
 */
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 5) return numbers
  
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

/**
 * Formata um valor monetário (R$ 0.000,00)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Parse string de moeda para número
 */
export function parseCurrency(value: string): number {
  const numbers = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(numbers) || 0
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida um CPF
 */
export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '')
  
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.substring(10, 11))) return false
  
  return true
}

/**
 * Valida um CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '')
  
  if (numbers.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let size = numbers.length - 2
  let digits = numbers.substring(0, size)
  const digit1 = numbers.substring(size)
  let sum = 0
  let pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(digits.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digit1.charAt(0))) return false
  
  size = size + 1
  digits = numbers.substring(0, size)
  sum = 0
  pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(digits.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digit1.charAt(1))) return false
  
  return true
}

/**
 * Valida um email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida um telefone (mínimo 10 dígitos)
 */
export function validatePhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '')
  return numbers.length >= 10 && numbers.length <= 11
}

/**
 * Valida um CEP
 */
export function validateCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '')
  return numbers.length === 8
}

// ============================================================================
// FORMATAÇÃO DE DATA E HORA
// ============================================================================

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

/**
 * Formata uma data para exibição longa (Sexta-feira, 10 de Janeiro de 2025)
 */
export function formatDateLong(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

/**
 * Formata uma data para ISO (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Formata um horário (HH:MM)
 */
export function formatTime(time: string): string {
  return time.substring(0, 5)
}

/**
 * Formata uma data e hora juntos
 */
export function formatDateTime(date: string | Date, time?: string): string {
  const formattedDate = formatDate(date)
  if (time) {
    return `${formattedDate} às ${formatTime(time)}`
  }
  return formattedDate
}

// ============================================================================
// VALIDAÇÃO DE CONFLITOS DE HORÁRIO
// ============================================================================

interface AppointmentSlot {
  scheduled_time: string
  duration: number
}

/**
 * Converte HH:MM em minutos desde meia-noite
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converte minutos para HH:MM
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Verifica se há conflito de horário entre um novo agendamento e agendamentos existentes
 * @param existingAppointments Lista de agendamentos existentes com scheduled_time e duration
 * @param newTime Horário do novo agendamento (HH:MM)
 * @param newDuration Duração do novo agendamento em minutos
 * @returns true se houver conflito, false se estiver livre
 */
export function checkTimeConflict(
  existingAppointments: AppointmentSlot[],
  newTime: string,
  newDuration: number
): boolean {
  const newStart = parseTimeToMinutes(newTime)
  const newEnd = newStart + newDuration

  for (const apt of existingAppointments) {
    const existingStart = parseTimeToMinutes(apt.scheduled_time)
    const existingEnd = existingStart + apt.duration

    // Verifica sobreposição
    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return true // Conflito detectado
    }
  }

  return false // Sem conflito
}

/**
 * Encontra o próximo horário disponível
 * @param existingAppointments Lista de agendamentos existentes
 * @param desiredTime Horário desejado (HH:MM)
 * @param duration Duração necessária em minutos
 * @param workingHours Horário de funcionamento { start: "09:00", end: "18:00" }
 * @param interval Intervalo entre agendamentos em minutos (padrão: 30)
 * @returns Próximo horário disponível ou null se não houver
 */
export function findNextAvailableTime(
  existingAppointments: AppointmentSlot[],
  desiredTime: string,
  duration: number,
  workingHours: { start: string; end: string },
  interval: number = 30
): string | null {
  const workStart = parseTimeToMinutes(workingHours.start)
  const workEnd = parseTimeToMinutes(workingHours.end)
  let currentTime = parseTimeToMinutes(desiredTime)

  // Garantir que começa no intervalo correto
  if (currentTime < workStart) {
    currentTime = workStart
  }

  // Arredondar para o próximo intervalo
  currentTime = Math.ceil(currentTime / interval) * interval

  while (currentTime + duration <= workEnd) {
    const timeStr = minutesToTime(currentTime)
    if (!checkTimeConflict(existingAppointments, timeStr, duration)) {
      return timeStr
    }
    currentTime += interval
  }

  return null // Sem horário disponível
}

// ============================================================================
// UTILS GERAIS
// ============================================================================

/**
 * Gera iniciais de um nome
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

/**
 * Formata duração em minutos para exibição
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}min` : `${hours}h`
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
