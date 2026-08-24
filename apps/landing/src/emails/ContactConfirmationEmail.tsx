// ============================================================================
// CONTACT CONFIRMATION EMAIL - Confirmação para o usuário que enviou mensagem
// ============================================================================

import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'

// ============================================================================
// TYPES
// ============================================================================

export interface ContactConfirmationEmailProps {
    /** Nome do remetente */
    senderName: string
    /** Assunto da mensagem original */
    subject: string
    /** Data/hora de recebimento */
    receivedAt: Date
}

// ============================================================================
// SUBJECT MAP
// ============================================================================

const subjectLabels: Record<string, string> = {
    suporte: 'Suporte Técnico',
    comercial: 'Comercial',
    financeiro: 'Financeiro',
    outro: 'Outro Assunto',
}

// ============================================================================
// EMAIL COMPONENT
// ============================================================================

export function ContactConfirmationEmail({
    senderName,
    subject,
    receivedAt,
}: ContactConfirmationEmailProps) {
    const subjectLabel = subjectLabels[subject] || subject
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
    }).format(receivedAt)

    return (
        <Html>
            <Head />
            <Preview>
                Recebemos sua mensagem - Poderosa Agenda
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={headerTitle}>✅ Mensagem Recebida!</Heading>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Olá, <strong>{senderName}</strong>!
                        </Text>

                        <Text style={paragraph}>
                            Recebemos sua mensagem sobre <strong>{subjectLabel}</strong> em {formattedDate}.
                        </Text>

                        <Text style={paragraph}>
                            Nossa equipe irá analisar sua solicitação e responderá em até <strong>24 horas úteis</strong>.
                        </Text>

                        <Hr style={divider} />

                        <Text style={paragraph}>
                            Enquanto isso, você pode:
                        </Text>

                        <Text style={listItem}>
                            📚 <Link href="https://poderosaagenda.com.br/ajuda" style={link}>
                                Consultar nossa Central de Ajuda
                            </Link>
                        </Text>

                        <Text style={listItem}>
                            📖 <Link href="https://poderosaagenda.com.br/documentacao" style={link}>
                                Ver a Documentação
                            </Link>
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Atenciosamente,
                        </Text>
                        <Text style={footerBrand}>
                            Equipe Poderosa Agenda
                        </Text>
                        <Hr style={footerDivider} />
                        <Text style={footerNote}>
                            Este é um email automático. Se você não enviou nenhuma mensagem, por favor ignore este email.
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
    maxWidth: '500px',
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
    margin: '0',
}

const content = {
    padding: '32px 24px',
}

const greeting = {
    color: '#18181b',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
}

const paragraph = {
    color: '#3f3f46',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
}

const divider = {
    borderColor: '#e4e4e7',
    margin: '24px 0',
}

const listItem = {
    color: '#3f3f46',
    fontSize: '14px',
    margin: '8px 0',
}

const link = {
    color: '#10b981',
    textDecoration: 'none',
}

const footer = {
    backgroundColor: '#f9fafb',
    padding: '24px',
    textAlign: 'center' as const,
}

const footerText = {
    color: '#71717a',
    fontSize: '14px',
    margin: '0 0 4px 0',
}

const footerBrand = {
    color: '#10b981',
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: '0 0 16px 0',
}

const footerDivider = {
    borderColor: '#e4e4e7',
    margin: '16px 0',
}

const footerNote = {
    color: '#a1a1aa',
    fontSize: '11px',
    margin: '0',
}

export default ContactConfirmationEmail