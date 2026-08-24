/**
 * ============================================================================
 * CONTACT NOTIFICATION EMAIL - Email de notificação para a equipe
 * ============================================================================
 */

import * as React from 'react'
import {
    EmailWrapper,
    EmailHeader,
    EmailFooter,
    Heading,
    Paragraph,
    DataTable,
    InfoBox,
    colors,
} from './components'
import { Section, Text } from '@react-email/components'

interface ContactNotificationEmailProps {
    messageId: string
    senderName: string
    senderEmail: string
    senderPhone: string | null
    subject: string
    message: string
    receivedAt: Date
    ipAddress: string
    userAgent: string | null
    source: string
}

const subjectLabels: Record<string, string> = {
    suporte: '🔧 Suporte Técnico',
    comercial: '💼 Comercial',
    financeiro: '💰 Financeiro',
    outro: '📝 Outro',
}

export const ContactNotificationEmail = ({
    messageId,
    senderName,
    senderEmail,
    senderPhone,
    subject,
    message,
    receivedAt,
    ipAddress,
    source,
}: ContactNotificationEmailProps) => {
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
    }).format(receivedAt)

    return (
        <EmailWrapper
            preview={`Nova mensagem de ${senderName} - ${subjectLabels[subject] || subject}`}
        >
            <EmailHeader />

            <Heading emoji="📩">Nova Mensagem de Contato</Heading>

            <InfoBox variant="warning">
                Uma nova mensagem foi recebida pelo formulário de contato e requer sua
                atenção.
            </InfoBox>

            {/* Dados do remetente */}
            <DataTable
                rows={[
                    { label: 'Nome', value: senderName },
                    { label: 'E-mail', value: senderEmail },
                    ...(senderPhone ? [{ label: 'Telefone', value: senderPhone }] : []),
                    { label: 'Assunto', value: subjectLabels[subject] || subject },
                    { label: 'Recebido em', value: formattedDate },
                ]}
            />

            {/* Mensagem */}
            <Section
                style={{
                    backgroundColor: colors.slate[50],
                    borderRadius: '8px',
                    margin: '24px 40px',
                    padding: '20px',
                }}
            >
                <Text
                    style={{
                        color: colors.slate[500],
                        fontSize: '12px',
                        fontWeight: '600',
                        letterSpacing: '0.05em',
                        margin: '0 0 12px',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    Mensagem
                </Text>
                <Text
                    style={{
                        color: colors.slate[800],
                        fontSize: '15px',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap' as const,
                    }}
                >
                    {message}
                </Text>
            </Section>

            {/* Metadados técnicos */}
            <Paragraph muted>
                <strong>ID:</strong> {messageId}
                <br />
                <strong>IP:</strong> {ipAddress}
                <br />
                <strong>Origem:</strong> {source}
            </Paragraph>

            <Paragraph muted>
                Você pode responder diretamente a este e-mail para contatar{' '}
                <strong>{senderName}</strong>.
            </Paragraph>

            <EmailFooter />
        </EmailWrapper>
    )
}

export default ContactNotificationEmail