'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  Calendar,
  CreditCard,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    // Dados do Salão
    salonName: '',
    cnpj: '',
    
    // Dados do Proprietário
    ownerName: '',
    ownerCpf: '',
    email: '',
    phone: '',
    
    // Endereço
    address: '',
    city: '',
    state: '',
    
    // Credenciais
    password: '',
    confirmPassword: '',
    
    // Plano
    plan: 'basic' as 'basic' | 'pro' | 'enterprise',
    professionalsCount: '1-3',
    
    // Configurações
    sendWelcomeEmail: true,
    activateImmediately: true,
  })

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.ownerName,
            salon_name: formData.salonName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está cadastrado no sistema.')
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro ao criar conta de acesso.')
        setIsLoading(false)
        return
      }

      // 2. Criar registro do salão
      const { error: salonError } = await (supabase.from('salons') as any)
        .insert({
          name: formData.salonName,
          cnpj: formData.cnpj || null,
          owner_name: formData.ownerName,
          owner_cpf: formData.ownerCpf || null,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || null,
          city: formData.city,
          state: formData.state,
          plan: formData.plan,
          professionals_count: formData.professionalsCount,
          status: formData.activateImmediately ? 'active' : 'inactive',
        })

      if (salonError) {
        console.error('Erro ao criar salão:', salonError)
        setError('Conta criada mas erro ao registrar dados do salão.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin/saloes')
      }, 2000)

    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao criar usuário. Tente novamente.')
    }

    setIsLoading(false)
  }

  const steps = [
    { number: 1, title: 'Salão', icon: Building2 },
    { number: 2, title: 'Proprietário', icon: User },
    { number: 3, title: 'Endereço', icon: MapPin },
    { number: 4, title: 'Plano', icon: CreditCard },
    { number: 5, title: 'Acesso', icon: Key },
  ]

  const plans = [
    { id: 'basic', name: 'Básico', price: 'R$ 79/mês', features: ['Até 3 profissionais', 'Agendamento online', 'Relatórios básicos'] },
    { id: 'pro', name: 'Profissional', price: 'R$ 149/mês', features: ['Até 10 profissionais', 'WhatsApp integrado', 'Relatórios avançados'] },
    { id: 'enterprise', name: 'Enterprise', price: 'R$ 299/mês', features: ['Profissionais ilimitados', 'Multi-unidades', 'Suporte prioritário'] },
  ]

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Salão Criado com Sucesso!</h2>
          <p className="text-gray-400 mb-4">
            {formData.salonName} foi adicionado ao sistema.
          </p>
          <p className="text-gray-500 text-sm">Redirecionando...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Salão</h1>
            <p className="text-gray-400 text-sm">Cadastre um novo salão no sistema</p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Steps */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-[#1a2332] rounded-2xl border border-white/5 p-4 sticky top-24">
            <h3 className="text-sm font-medium text-gray-400 mb-4 px-2">Etapas</h3>
            <nav className="space-y-1">
              {steps.map((s) => (
                <button
                  key={s.number}
                  onClick={() => setStep(s.number)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    step === s.number
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : step > s.number
                      ? 'text-gray-300 hover:bg-white/5'
                      : 'text-gray-500 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step === s.number
                      ? 'bg-emerald-500 text-white'
                      : step > s.number
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-500'
                  }`}>
                    {step > s.number ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{s.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {/* Mobile Steps */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between bg-[#1a2332] rounded-xl p-3">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step === s.number
                      ? 'bg-emerald-500 text-white'
                      : step > s.number
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-500'
                  }`}>
                    {step > s.number ? <Check className="w-4 h-4" /> : <span className="text-sm">{s.number}</span>}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${step > s.number ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1a2332] rounded-2xl border border-white/5 p-6 lg:p-8"
          >
            {/* Step 1 - Dados do Salão */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Dados do Salão</h2>
                    <p className="text-gray-400 text-sm">Informações básicas do estabelecimento</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome do Salão *</label>
                    <input
                      type="text"
                      required
                      value={formData.salonName}
                      onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                      placeholder="Ex: Salão Beleza Total"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">CNPJ (opcional)</label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 - Proprietário */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Dados do Proprietário</h2>
                    <p className="text-gray-400 text-sm">Responsável pela conta</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Maria Silva"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">CPF (opcional)</label>
                    <input
                      type="text"
                      value={formData.ownerCpf}
                      onChange={(e) => setFormData({ ...formData, ownerCpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@salao.com"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3 - Endereço */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Endereço</h2>
                    <p className="text-gray-400 text-sm">Localização do salão</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Endereço Completo (opcional)</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua das Flores, 123 - Centro"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="São Paulo"
                        className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Estado *</label>
                      <select
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Selecione</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4 - Plano */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Plano e Configurações</h2>
                    <p className="text-gray-400 text-sm">Defina o plano e quantidade de profissionais</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Selecione o Plano</label>
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, plan: plan.id as any })}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            formData.plan === plan.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-white/10 hover:border-white/20 bg-[#0f1419]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{plan.name}</span>
                            <span className={`font-bold ${formData.plan === plan.id ? 'text-emerald-400' : 'text-gray-300'}`}>
                              {plan.price}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {plan.features.map((f, i) => (
                              <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Quantidade de Profissionais</label>
                    <select
                      value={formData.professionalsCount}
                      onChange={(e) => setFormData({ ...formData, professionalsCount: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Apenas 1</option>
                      <option value="2-3">2 a 3</option>
                      <option value="4-5">4 a 5</option>
                      <option value="6-10">6 a 10</option>
                      <option value="10+">Mais de 10</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 5 - Credenciais */}
            {step === 5 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Credenciais de Acesso</h2>
                    <p className="text-gray-400 text-sm">Defina a senha inicial do usuário</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Email de acesso</span>
                    </div>
                    <p className="text-white">{formData.email || 'Não definido'}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Senha *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 pr-12 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Confirmar Senha *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repita a senha"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sendWelcomeEmail}
                        onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#0f1419] text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">Enviar email de boas-vindas com credenciais</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.activateImmediately}
                        onChange={(e) => setFormData({ ...formData, activateImmediately: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#0f1419] text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">Ativar conta imediatamente</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors font-medium"
                >
                  Voltar
                </button>
              )}
              <div className="flex-1" />
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !formData.salonName) ||
                    (step === 2 && (!formData.ownerName || !formData.email || !formData.phone)) ||
                    (step === 3 && (!formData.city || !formData.state))
                  }
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.password || !formData.confirmPassword}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Criar Salão
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}