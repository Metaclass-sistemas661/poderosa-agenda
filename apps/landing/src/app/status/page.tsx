'use client'

import { Activity } from 'lucide-react'
import {
  PublicPageLayout,
  PageSection,
  SectionTitle,
  PageGrid,
  OverallStatus,
  ServiceStatus,
  IncidentCard,
  MetricCard,
  EmptyState,
} from '@/components/public'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const services: Array<{
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown'
  description?: string
  uptime?: string
}> = [
  { name: 'Plataforma Web', status: 'operational', uptime: '99.98%' },
  { name: 'App Mobile', status: 'operational', uptime: '99.95%' },
  { name: 'API REST', status: 'operational', uptime: '99.99%' },
  { name: 'Agendamentos em Tempo Real', status: 'operational', uptime: '99.97%' },
  { name: 'Notificações (WhatsApp/SMS)', status: 'operational', uptime: '99.90%' },
  { name: 'Relatórios e Exportações', status: 'operational', uptime: '100%' },
  { name: 'Integrações de Pagamento', status: 'operational', uptime: '99.96%' },
  { name: 'Autenticação', status: 'operational', uptime: '100%' },
]

const incidents: Array<{
  title: string
  severity: 'critical' | 'major' | 'minor' | 'maintenance'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  createdAt: string
  resolvedAt?: string
  affectedServices?: string[]
  updates?: Array<{
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
    message: string
    timestamp: string
  }>
}> = [
  {
    title: 'Lentidão intermitente nas notificações',
    severity: 'minor',
    status: 'resolved',
    createdAt: '05 Ago 2026 — 14:22',
    resolvedAt: '05 Ago 2026 — 14:40',
    affectedServices: ['Notificações (WhatsApp/SMS)'],
    updates: [
      {
        status: 'resolved',
        message: 'Identificamos e corrigimos um gargalo no serviço de envio de notificações por WhatsApp. Todos os envios pendentes foram processados.',
        timestamp: '14:40',
      },
      {
        status: 'identified',
        message: 'Causa identificada: gargalo no processamento de fila de mensagens.',
        timestamp: '14:30',
      },
      {
        status: 'investigating',
        message: 'Investigando relatos de atrasos no envio de notificações.',
        timestamp: '14:22',
      },
    ],
  },
  {
    title: 'Manutenção programada — Banco de dados',
    severity: 'maintenance',
    status: 'resolved',
    createdAt: '12 Jul 2026 — 03:00',
    resolvedAt: '12 Jul 2026 — 03:05',
    affectedServices: ['API REST', 'Plataforma Web'],
    updates: [
      {
        status: 'resolved',
        message: 'Manutenção preventiva realizada com sucesso no banco de dados principal. Sem impacto para os usuários.',
        timestamp: '03:05',
      },
      {
        status: 'monitoring',
        message: 'Manutenção em andamento. Monitorando estabilidade.',
        timestamp: '03:01',
      },
    ],
  },
]

const uptimeHistory: Array<{
  label: string
  value: string
  incidents: number
}> = [
  { label: 'Ago 2026', value: '99.97', incidents: 1 },
  { label: 'Jul 2026', value: '99.99', incidents: 1 },
  { label: 'Jun 2026', value: '100', incidents: 0 },
  { label: 'Mai 2026', value: '99.98', incidents: 0 },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatusPage() {
  return (
    <PublicPageLayout
      hero={{
        badge: { icon: Activity, text: 'Status do Sistema' },
        title: 'Status da Plataforma',
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Status' },
        ],
      }}
    >
      {/* Overall Status */}
      <PageSection className="py-8 lg:py-12">
        <div className="container-custom max-w-3xl">
          <OverallStatus
            status="operational"
            lastUpdated="Há 2 minutos"
          />
        </div>
      </PageSection>

      {/* Services */}
      <PageSection className="py-8 lg:py-12">
        <div className="container-custom max-w-3xl">
          <SectionTitle
            title="Serviços"
            size="sm"
            align="left"
            as="h2"
            animate={false}
          />
          <div className="mt-6 space-y-3">
            {services.map((service, index) => (
              <ServiceStatus
                key={service.name}
                name={service.name}
                status={service.status}
                uptime={service.uptime}
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      </PageSection>

      {/* Uptime History */}
      <PageSection className="py-8 lg:py-12">
        <div className="container-custom max-w-3xl">
          <SectionTitle
            title="Histórico de disponibilidade"
            size="sm"
            align="left"
            as="h2"
            animate={false}
          />
          <div className="mt-6">
            <PageGrid columns={4} gap="sm">
              {uptimeHistory.map((month) => (
                <MetricCard
                  key={month.label}
                  label={month.label}
                  value={month.value}
                  suffix="%"
                  description={
                    month.incidents === 0
                      ? 'Sem incidentes'
                      : `${month.incidents} incidente${month.incidents > 1 ? 's' : ''}`
                  }
                />
              ))}
            </PageGrid>
          </div>
        </div>
      </PageSection>

      {/* Recent Incidents */}
      <PageSection className="py-8 lg:py-16">
        <div className="container-custom max-w-3xl">
          <SectionTitle
            title="Incidentes recentes"
            size="sm"
            align="left"
            as="h2"
            animate={false}
          />
          <div className="mt-6 space-y-4">
            {incidents.length > 0 ? (
              incidents.map((incident, index) => (
                <IncidentCard
                  key={incident.title}
                  title={incident.title}
                  severity={incident.severity}
                  status={incident.status}
                  createdAt={incident.createdAt}
                  resolvedAt={incident.resolvedAt}
                  affectedServices={incident.affectedServices}
                  updates={incident.updates}
                  delay={index * 0.1}
                />
              ))
            ) : (
              <EmptyState
                variant="incident"
                title="Nenhum incidente recente"
                description="Todos os sistemas estão operando normalmente sem incidentes registrados nos últimos 90 dias."
              />
            )}
          </div>
        </div>
      </PageSection>
    </PublicPageLayout>
  )
}