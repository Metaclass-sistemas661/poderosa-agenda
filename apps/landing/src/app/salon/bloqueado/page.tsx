'use client'

import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Phone, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SalonBloqueadoPage() {
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason') || 'SALON_INACTIVE'
    const salonName = searchParams.get('salon') || 'Seu salão'

    const getBlockInfo = () => {
        switch (reason) {
            case 'SALON_DELETED':
                return {
                    title: 'Conta Removida',
                    description: 'Esta conta foi removida do sistema.',
                    icon: '🚫',
                    color: 'red'
                }
            case 'SALON_SUSPENDED':
                return {
                    title: 'Conta Suspensa Temporariamente',
                    description: 'Sua conta foi suspensa temporariamente. Isso pode ocorrer por pendências de pagamento ou verificação.',
                    icon: '⏸️',
                    color: 'yellow'
                }
            case 'SALON_INACTIVE':
            default:
                return {
                    title: 'O salão está inativo',
                    description: 'Favor entrar em contato com o suporte.',
                    icon: '🔒',
                    color: 'gray'
                }
        }
    }

    const blockInfo = getBlockInfo()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl
                            ${blockInfo.color === 'red' ? 'bg-red-500/20' : ''}
                            ${blockInfo.color === 'yellow' ? 'bg-yellow-500/20' : ''}
                            ${blockInfo.color === 'gray' ? 'bg-gray-500/20' : ''}
                        `}>
                            {blockInfo.icon}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        {blockInfo.title}
                    </h1>

                    {/* Salon Name */}
                    <p className="text-gray-400 text-center mb-4">
                        {salonName}
                    </p>

                    {/* Description */}
                    <p className="text-gray-300 text-center mb-8">
                        {blockInfo.description}
                    </p>

                    {/* Alert Box */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-yellow-200 text-sm font-medium mb-1">
                                    Entre em contato com o suporte
                                </p>
                                <p className="text-yellow-200/70 text-sm">
                                    Se você acredita que isso é um erro ou precisa de mais informações, entre em contato conosco.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Options */}
                    <div className="space-y-3 mb-8">
                        <a
                            href="https://wa.me/5547999999999?text=Olá, preciso de ajuda com minha conta na Poderosa Agenda"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                        >
                            <Phone className="w-5 h-5" />
                            Falar pelo WhatsApp
                        </a>
                        <a
                            href="mailto:suporte@poderosaagenda.com.br?subject=Problema com acesso - Conta bloqueada"
                            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                        >
                            <Mail className="w-5 h-5" />
                            Enviar Email
                        </a>
                    </div>

                    {/* Back Link */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para a página inicial
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    © 2026 Poderosa Agenda. Todos os direitos reservados.
                </p>
            </div>
        </div>
    )
}