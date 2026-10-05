import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PieChart, DollarSign, Users } from 'lucide-react'

export function FinanceiroTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Visão Geral', href: '/salon/financeiro', icon: PieChart },
    { name: 'Fluxo de Caixa', href: '/salon/financeiro/caixa', icon: DollarSign },
    { name: 'Comissões & Equipe', href: '/salon/financeiro/comissoes', icon: Users },
  ]

  return (
    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-auto overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              isActive 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : ''}`} />
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
