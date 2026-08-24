// ============================================================================
// CONTACT NOTIFICATION EMAIL - Notifica equipe sobre nova mensagem de contato
// ============================================================================

import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from '@react-email/components'

// ============================================================================
// TYPES
// ============================================================================

export interface ContactNotificationEmailProps {
    /** ID da mensagem no banco */
    messageId: string
    /** Nome do remetente */
    senderName: string
    /** Email do remetente */
    senderEmail: string
    /** Telefone do remetente (opcional) */
    senderPhone?: string | null
    /** Assunto da mensagem */
    subject: string
    /** Conteúdo da mensagem */
    message: string
    /** Data/hora de recebimento */
    receivedAt: Date
    /** IP do remetente (para análise de spam) */
    ipAddress?: string | null
    /** User agent (para análise) */
    userAgent?: string | null
    /** Fonte da mensagem */
    source?: string
}

// ============================================================================
// SUBJECT MAP
// ============================================================================

const subjectLabels: Record<string, string> = {
    suporte: '🔧 Suporte Técnico',
    comercial: '💼 Comercial',
    financeiro: '💰 Financeiro',
    outro: '📝 Outro Assunto',
}

// ============================================================================
// EMAIL COMPONENT
// ============================================================================

export function ContactNotificationEmail({
    messageId,
    senderName,
    senderEmail,
    senderPhone,
    subject,
    message,
    receivedAt,
    ipAddress,
    userAgent,
    source = 'landing_page',
}: ContactNotificationEmailProps) {
    const subjectLabel = subjectLabels[subject] || subject
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'America/Sao_Paulo',
    }).format(receivedAt)

    return (
        <Html>
            <Head />
            <Preview>
                Nova mensagem de contato de {senderName} - {subjectLabel}
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={headerTitle}>📬 Nova Mensagem de Contato</Heading>
                        <Text style={headerSubtitle}>
                            Formulário da Landing Page - Poderosa Agenda
                        </Text>
                    </Section>

                    {/* Alert Badge */}
                    <Section style={alertBadge}>
                        <Text style={alertText}>
                            ⚡ Ação necessária: Responda em até 24 horas
                        </Text>
                    </Section>

                    {/* Sender Info Card */}
                    <Section style={card}>
                        <Heading as="h2" style={cardTitle}>
                            👤 Informações do Remetente
                        </Heading>
                        <Hr style={divider} />

                        <Row>
                            <Column style={labelColumn}>
                                <Text style={label}>Nome:</Text>
                            </Column>
                            <Column style={valueColumn}>
                                <Text style={value}>{senderName}</Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column style={labelColumn}>
                                <Text style={label}>Email:</Text>
                            </Column>
                            <Column style={valueColumn}>
                                <Text style={valueLink}>
                                    <a href={`mailto:${senderEmail}`} style={link}>
                                        {senderEmail}
                                    </a>
                                </Text>
                            </Column>
                        </Row>

                        {senderPhone && (
                            <Row>
                                <Column style={labelColumn}>
                                    <Text style={label}>Telefone:</Text>
                                </Column>
                                <Column style={valueColumn}>
                                    <Text style={valueLink}>
                                        <a href={`tel:${senderPhone}`} style={link}>
                                            {senderPhone}
                                        </a>
                                    </Text>
                                </Column>
                            </Row>
                        )}

                        <Row>
                            <Column style={labelColumn}>
                                <Text style={label}>Assunto:</Text>
                            </Column>
                            <Column style={valueColumn}>
                                <Text style={value}>{subjectLabel}</Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column style={labelColumn}>
                                <Text style={label}>Recebido em:</Text>
                            </Column>
                            <Column style={valueColumn}>
                                <Text style={value}>{formattedDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Message Content */}
                    <Section style={card}>
                        <Heading as="h2" style={cardTitle}>
                            💬 Mensagem
                        </Heading>
                        <Hr style={divider} />
                        <Text style={messageContent}>{message}</Text>
                    </Section>

                    {/* Quick Actions */}
                    <Section style={actionsCard}>
                        <Heading as="h2" style={cardTitle}>
                            🚀 Ações Rápidas
                        </Heading>
                        <Hr style={divider} />
                        <Text style={actionItem}>
                            ✉️ <a href={`mailto:${senderEmail}?subject=Re: ${subjectLabel} - Poderosa Agenda`} style={link}>
                                Responder por Email
                            </a>
                        </Text>
                        {senderPhone && (
                            <Text style={actionItem}>
                                📱 <a href={`https://wa.me/55${senderPhone.replace(/\D/g, '')}`} style={link}>
                                    Enviar WhatsApp
                                </a>
                            </Text>
                        )}
                        <Text style={actionItem}>
                            📊 <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://poderosaagenda.com.br'}/admin/mensagens/${messageId}`} style={link}>
                                Ver no Painel Admin
                            </a>
                        </Text>
                    </Section>

                    {/* Technical Info (collapsed by default in email clients) */}
                    <Section style={techCard}>
                        <Heading as="h3" style={techTitle}>
                            🔍 Informações Técnicas
                        </Heading>
                        <Text style={techInfo}>
                            <strong>ID:</strong> {messageId}
                        </Text>
                        {ipAddress && (
                            <Text style={techInfo}>
                                <strong>IP:</strong> {ipAddress}
                            </Text>
                        )}
                        {userAgent && (
                            <Text style={techInfo}>
                                <strong>User Agent:</strong> {userAgent.substring(0, 100)}...
                            </Text>
                        )}
                        <Text style={techInfo}>
                            <strong>Fonte:</strong> {source}
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Este email foi gerado automaticamente pelo sistema Poderosa Agenda.
                        </Text>
                        <Text style={footerText}>
                            Não responda diretamente a este email - use os links de ação rápida acima.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

// ============================================================================
// STYLES
// ============================================================================

const main = {
    backgroundColor: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '0',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const header = {
    backgroundColor: '#10b981',
    padding: '32px 24px',
    textAlign: 'center' as const,
}

const headerTitle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700' as const,
    margin: '0 0 8px 0',
}

const headerSubtitle = {
    color: '#d1fae5',
    fontSize: '14px',
    margin: '0',
}

const alertBadge = {
    backgroundColor: '#fef3c7',
    padding: '12px 24px',
    borderLeft: '4px solid #f59e0b',
}

const alertText = {
    color: '#92400e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0',
}

const card = {
    padding: '24px',
    borderBottom: '1px solid #e4e4e7',
}

const actionsCard = {
    padding: '24px',
    backgroundColor: '#f0fdf4',
    borderBottom: '1px solid #e4e4e7',
}

const cardTitle = {
    color: '#18181b',
    fontSize: '18px',
    fontWeight: '600' as const,
    margin: '0 0 12px 0',
}

const divider = {
    borderColor: '#e4e4e7',
    margin: '12px 0',
}

const labelColumn = {
    width: '120px',
    verticalAlign: 'top' as const,
}

const valueColumn = {
    verticalAlign: 'top' as const,
}

const label = {
    color: '#71717a',
    fontSize: '14px',
    fontWeight: '500' as const,
    margin: '4px 0',
}

const value = {
    color: '#18181b',
    fontSize: '14px',
    fontWeight: '400' as const,
    margin: '4px 0',
}

const valueLink = {
    ...value,
}

const link = {
    color: '#10b981',
    textDecoration: 'none',
}

const messageContent = {
    color: '#3f3f46',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap' as const,
}

const actionItem = {
    color: '#18181b',
    fontSize: '14px',
    margin: '8px 0',
}

const techCard = {
    padding: '16px 24px',
    backgroundColor: '#f4f4f5',
}

const techTitle = {
    color: '#52525b',
    fontSize: '12px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    textTransform: 'uppercase' as const,
}

const techInfo = {
    color: '#71717a',
    fontSize: '11px',
    margin: '4px 0',
    fontFamily: 'monospace',
}

const footer = {
    padding: '24px',
    textAlign: 'center' as const,
}

const footerText = {
    color: '#a1a1aa',
    fontSize: '12px',
    margin: '4px 0',
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ContactNotificationEmail