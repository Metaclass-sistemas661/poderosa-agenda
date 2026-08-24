'use client'

/**
 * ============================================================================
 * FORCE PASSWORD CHANGE MODAL
 * ============================================================================
 * Modal obrigatório exibido quando must_change_password = true
 * Impede acesso ao sistema até o usuário trocar a senha temporária
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ForcePasswordChangeModalProps {
    isOpen: boolean
    onPasswordChanged: () => void
    userName?: string
}

interface PasswordStrength {
    score: number
    label: string
    color: string
    requirements: {
        minLength: boolean
        hasUppercase: boolean
        hasLowercase: boolean
        hasNumber: boolean
        hasSpecial: boolean
    }
}

function evaluatePasswordStrength(password: string): PasswordStrength {
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const score = Object.values(requirements).filter(Boolean).length

    let label = 'Muito fraca'
    let color = 'bg-red-500'

    if (score >= 5) {
        label = 'Muito forte'
        color = 'bg-green-500'
    } else if (score >= 4) {
        label = 'Forte'
        color = 'bg-green-400'
    } else if (score >= 3) {
        label = 'Média'
        color = 'bg-yellow-500'
    } else if (score >= 2) {
        label = 'Fraca'
        color = 'bg-orange-500'
    }

    return { score, label, color, requirements }
}

export function ForcePasswordChangeModal({
    isOpen,
    onPasswordChanged,
    userName,
}: ForcePasswordChangeModalProps) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const supabase = createClient()
    const passwordStrength = evaluatePasswordStrength(newPassword)
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
    const isValid = passwordStrength.score >= 4 && passwordsMatch

    // Prevent closing the modal or navigating away
    useEffect(() => {
        if (isOpen) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault()
                e.returnValue = 'Você precisa trocar sua senha antes de sair.'
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault()
                }
            }

            window.addEventListener('beforeunload', handleBeforeUnload)
            window.addEventListener('keydown', handleKeyDown)

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload)
                window.removeEventListener('keydown', handleKeyDown)
            }
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isValid) {
            setError('Por favor, preencha todos os requisitos de senha.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // Update password via Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) {
                throw updateError
            }

            // Mark password as changed in admin_users
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Call RPC function to update must_change_password
                const { error: rpcError } = await supabase.rpc('mark_password_changed', {
                    p_user_id: user.id
                })

                if (rpcError) {
                    console.error('Failed to update must_change_password:', rpcError)
                    // Non-blocking - password was already changed
                }
            }

            setSuccess(true)

            // Wait a moment before closing
            setTimeout(() => {
                onPasswordChanged()
            }, 2000)

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar senha'
            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-8 text-white text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Troca de Senha Obrigatória</h2>
                        <p className="text-sm text-white/80">
                            {userName ? `Olá, ${userName}! ` : ''}
                            Por segurança, você precisa criar uma nova senha antes de continuar.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Success State */}
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Senha Atualizada!
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Redirecionando para o painel...
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Error Alert */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* New Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Nova Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            placeholder="Digite sua nova senha"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {newPassword.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">
                                                    {passwordStrength.label}
                                                </span>
                                            </div>

                                            {/* Requirements List */}
                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                <RequirementItem
                                                    met={passwordStrength.requirements.minLength}
                                                    text="Mínimo 8 caracteres"
                                                />
                                                <RequirementItem
                                                    met={passwordStrength.requirements.hasUppercase}
                                                    text="Letra maiúscula"
                                                />
                                                <RequirementItem
                                                    met={passwordStrength.requirements.hasLowercase}
                                                    text="Letra minúscula"
                                                />
                                                <RequirementItem
                                                    met={passwordStrength.requirements.hasNumber}
                                                    text="Número"
                                                />
                                                <RequirementItem
                                                    met={passwordStrength.requirements.hasSpecial}
                                                    text="Caractere especial"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Confirmar Nova Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent ${confirmPassword.length > 0
                                                    ? passwordsMatch
                                                        ? 'border-green-500'
                                                        : 'border-red-500'
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                            placeholder="Confirme sua nova senha"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!isValid || isSubmitting}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Atualizando...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5" />
                                            Atualizar Senha
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                                    Esta ação não pode ser ignorada. Você precisa criar uma senha segura para continuar usando o sistema.
                                </p>
                            </>
                        )}
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-slate-400'}`}>
            {met ? (
                <CheckCircle className="w-3 h-3" />
            ) : (
                <div className="w-3 h-3 rounded-full border border-current" />
            )}
            <span>{text}</span>
        </div>
    )
}

export default ForcePasswordChangeModal