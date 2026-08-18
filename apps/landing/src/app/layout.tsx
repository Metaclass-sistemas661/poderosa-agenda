import { Plus_Jakarta_Sans, Inter, Cinzel } from 'next/font/google'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import { CookieBanner } from '@/components/ui/CookieBanner'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const fontLogo = Cinzel({
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Poderosa Agenda - Sistema de Gestão para Salões de Beleza',
  description: 'Gerencie seu salão de beleza com agendamento online, controle financeiro, relatórios e muito mais. Simplifique sua gestão e aumente seus lucros!',
  keywords: ['salão de beleza', 'agendamento online', 'gestão de salão', 'software para salão', 'sistema para barbearia'],
  authors: [{ name: 'Poderosa Agenda' }],
  openGraph: {
    title: 'Poderosa Agenda - Sistema de Gestão para Salões de Beleza',
    description: 'Gerencie seu salão de beleza com agendamento online, controle financeiro e muito mais.',
    type: 'website',
    locale: 'pt_BR',
  },
}

import { SmoothScrollProvider } from '@/components/layout/SmoothScrollProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${fontSans.variable} ${fontDisplay.variable} ${fontLogo.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScrollProvider>
          {children}
          <CookieBanner />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}