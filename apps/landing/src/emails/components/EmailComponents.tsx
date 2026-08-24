/**
 * ============================================================================
 * PODEROSA AGENDA - EMAIL DESIGN SYSTEM
 * ============================================================================
 * Componentes base para todos os templates de email
 * Padrão enterprise com cores e logo consistentes
 * ============================================================================
 */

import {
    Body,
    Button as EmailButton,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from '@react-email/components'
import * as React from 'react'

// ============================================================================
// DESIGN TOKENS - Paleta de cores do sistema
// ============================================================================

export const colors = {
    // Primary (Vermelho)
    primary: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626', // Main
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
    },
    // Secondary (Slate)
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    // Backgrounds
    white: '#f8fafc', // Very light slate instead of pure white
    background: '#f1f5f9', // Slightly darker slate for contrast
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const LOGO_URL = 'https://poderosaagenda.com.br/logo-email.png'
export const SITE_URL = 'https://poderosaagenda.com.br'
export const SUPPORT_EMAIL = 'suporte@poderosaagenda.com.br'
export const COMPANY_NAME = 'Poderosa Agenda'

// ============================================================================
// EMAIL WRAPPER - Container principal de todos os emails
// ============================================================================

interface EmailWrapperProps {
    preview: string
    children: React.ReactNode
}

export function EmailWrapper({ preview, children }: EmailWrapperProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {children}
                </Container>
            </Body>
        </Html>
    )
}

// ============================================================================
// EMAIL HEADER - Cabeçalho com logo
// ============================================================================

interface EmailHeaderProps {
    showDivider?: boolean
}

export function EmailHeader({ showDivider = true }: EmailHeaderProps) {
    return (
        <Section style={styles.header}>
            <Link href={SITE_URL} style={{ textDecoration: 'none', display: 'inline-block' }}>
                <Text style={styles.logoText}>
                    PODEROSA AGENDA
                </Text>
            </Link>
            {showDivider && <Hr style={styles.divider} />}
        </Section>
    )
}

// ============================================================================
// EMAIL FOOTER - Rodapé padronizado
// ============================================================================

interface EmailFooterProps {
    showSocial?: boolean
    showUnsubscribe?: boolean
}

export function EmailFooter({ showSocial = false, showUnsubscribe = false }: EmailFooterProps) {
    const currentYear = new Date().getFullYear()

    return (
        <Section style={styles.footer}>
            <Hr style={styles.footerDivider} />

            {/* Links úteis */}
            <Row style={styles.footerLinks}>
                <Column align="center">
                    <Link href={`${SITE_URL}/ajuda`} style={styles.footerLink}>
                        Central de Ajuda
                    </Link>
                    <Text style={styles.footerLinkSeparator}>•</Text>
                    <Link href={`${SITE_URL}/contato`} style={styles.footerLink}>
                        Contato
                    </Link>
                    <Text style={styles.footerLinkSeparator}>•</Text>
                    <Link href={`${SITE_URL}/privacidade`} style={styles.footerLink}>
                        Privacidade
                    </Link>
                </Column>
            </Row>

            {/* Social media */}
            {showSocial && (
                <Row style={styles.socialRow}>
                    <Column align="center">
                        <Link href="https://instagram.com/poderosaagenda" style={styles.socialLink}>
                            Instagram
                        </Link>
                    </Column>
                </Row>
            )}

            {/* Copyright */}
            <Text style={styles.footerText}>
                © {currentYear} {COMPANY_NAME}. Todos os direitos reservados.
            </Text>

            <Text style={styles.footerSubtext}>
                Este e-mail foi enviado por {COMPANY_NAME}. Se você não esperava receber este e-mail,
                pode ignorá-lo com segurança.
            </Text>

            {showUnsubscribe && (
                <Text style={styles.unsubscribe}>
                    <Link href="#" style={styles.unsubscribeLink}>
                        Cancelar inscrição
                    </Link>
                </Text>
            )}
        </Section>
    )
}

// ============================================================================
// PRIMARY BUTTON - Botão principal
// ============================================================================

interface PrimaryButtonProps {
    href: string
    children: React.ReactNode
}

export function PrimaryButton({ href, children }: PrimaryButtonProps) {
    return (
        <Section style={styles.buttonContainer}>
            <EmailButton href={href} style={styles.primaryButton}>
                {children}
            </EmailButton>
        </Section>
    )
}

// ============================================================================
// SECONDARY BUTTON - Botão secundário
// ============================================================================

interface SecondaryButtonProps {
    href: string
    children: React.ReactNode
}

export function SecondaryButton({ href, children }: SecondaryButtonProps) {
    return (
        <Section style={styles.buttonContainer}>
            <EmailButton href={href} style={styles.secondaryButton}>
                {children}
            </EmailButton>
        </Section>
    )
}

// ============================================================================
// HEADING - Título do email
// ============================================================================

interface HeadingProps {
    children: React.ReactNode
    emoji?: string
}

export function Heading({ children, emoji }: HeadingProps) {
    return (
        <Text style={styles.heading}>
            {emoji && <span style={styles.emoji}>{emoji} </span>}
            {children}
        </Text>
    )
}

// ============================================================================
// PARAGRAPH - Parágrafo de texto
// ============================================================================

interface ParagraphProps {
    children: React.ReactNode
    muted?: boolean
}

export function Paragraph({ children, muted = false }: ParagraphProps) {
    return (
        <Text style={muted ? styles.mutedText : styles.paragraph}>
            {children}
        </Text>
    )
}

// ============================================================================
// INFO BOX - Caixa de informação destacada
// ============================================================================

interface InfoBoxProps {
    children: React.ReactNode
    variant?: 'info' | 'success' | 'warning' | 'error'
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
    const variantStyles = {
        info: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
        success: { backgroundColor: '#f0fdf4', borderColor: '#10b981' },
        warning: { backgroundColor: '#fffbeb', borderColor: '#f59e0b' },
        error: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
    }

    return (
        <Section style={{ ...styles.infoBox, ...variantStyles[variant] }}>
            <Text style={styles.infoBoxText}>{children}</Text>
        </Section>
    )
}

// ============================================================================
// DATA TABLE - Tabela de dados
// ============================================================================

interface DataTableProps {
    rows: Array<{ label: string; value: string }>
}

export function DataTable({ rows }: DataTableProps) {
    return (
        <Section style={styles.dataTable}>
            {rows.map((row, index) => (
                <Row key={index} style={styles.dataTableRow}>
                    <Column style={styles.dataTableLabel}>{row.label}</Column>
                    <Column style={styles.dataTableValue}>{row.value}</Column>
                </Row>
            ))}
        </Section>
    )
}

// ============================================================================
// BADGE - Badge de status
// ============================================================================

interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'error'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    const variantStyles = {
        default: { backgroundColor: colors.slate[100], color: colors.slate[700] },
        success: { backgroundColor: '#d1fae5', color: '#065f46' },
        warning: { backgroundColor: '#fef3c7', color: '#92400e' },
        error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    }

    return (
        <span style={{ ...styles.badge, ...variantStyles[variant] }}>
            {children}
        </span>
    )
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
    // Layout
    body: {
        backgroundColor: colors.background,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        margin: '0',
        padding: '0',
    },
    container: {
        backgroundColor: colors.white,
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: '12px',
        margin: '40px auto',
        maxWidth: '600px',
        padding: '0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },

    // Header
    header: {
        padding: '32px 40px 0',
        textAlign: 'center' as const,
    },
    logoText: {
        color: colors.primary[600],
        fontSize: '24px',
        fontWeight: '700',
        letterSpacing: '0.25em',
        margin: '0 auto',
        textTransform: 'uppercase' as const,
        fontFamily: 'system-ui, sans-serif',
    },
    divider: {
        borderColor: colors.slate[200],
        borderWidth: '1px',
        margin: '24px 0 0',
    },

    // Content
    heading: {
        color: colors.slate[900],
        fontSize: '24px',
        fontWeight: '700',
        lineHeight: '1.3',
        margin: '24px 40px',
        padding: '0',
        textAlign: 'center' as const,
    },
    emoji: {
        fontSize: '28px',
    },
    paragraph: {
        color: colors.slate[700],
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '0 40px 16px',
    },
    mutedText: {
        color: colors.slate[500],
        fontSize: '14px',
        lineHeight: '1.6',
        margin: '0 40px 16px',
    },

    // Buttons
    buttonContainer: {
        margin: '24px 40px',
        textAlign: 'center' as const,
    },
    primaryButton: {
        backgroundColor: colors.primary[600],
        borderRadius: '8px',
        color: colors.white,
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: '600',
        padding: '14px 32px',
        textDecoration: 'none',
    },
    secondaryButton: {
        backgroundColor: colors.white,
        border: `2px solid ${colors.slate[300]}`,
        borderRadius: '8px',
        color: colors.slate[700],
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: '600',
        padding: '12px 24px',
        textDecoration: 'none',
    },

    // Info Box
    infoBox: {
        borderLeft: '4px solid',
        borderRadius: '0 8px 8px 0',
        margin: '24px 40px',
        padding: '16px 20px',
    },
    infoBoxText: {
        color: colors.slate[700],
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0',
    },

    // Data Table
    dataTable: {
        backgroundColor: colors.slate[50],
        borderRadius: '8px',
        margin: '24px 40px',
        padding: '16px 20px',
    },
    dataTableRow: {
        marginBottom: '8px',
    },
    dataTableLabel: {
        color: colors.slate[500],
        fontSize: '14px',
        fontWeight: '500',
        paddingRight: '16px',
        verticalAlign: 'top',
        width: '40%',
    },
    dataTableValue: {
        color: colors.slate[800],
        fontSize: '14px',
        fontWeight: '600',
        verticalAlign: 'top',
    },

    // Badge
    badge: {
        borderRadius: '4px',
        display: 'inline-block',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        textTransform: 'uppercase' as const,
    },

    // Footer
    footer: {
        padding: '0 40px 32px',
    },
    footerDivider: {
        borderColor: colors.slate[200],
        borderWidth: '1px',
        margin: '32px 0 24px',
    },
    footerLinks: {
        marginBottom: '16px',
        textAlign: 'center' as const,
    },
    footerLink: {
        color: colors.slate[600],
        fontSize: '12px',
        textDecoration: 'none',
    },
    footerLinkSeparator: {
        color: colors.slate[300],
        display: 'inline',
        fontSize: '12px',
        margin: '0 8px',
    },
    socialRow: {
        marginBottom: '16px',
    },
    socialLink: {
        color: colors.primary[600],
        fontSize: '12px',
        fontWeight: '500',
        textDecoration: 'none',
    },
    footerText: {
        color: colors.slate[500],
        fontSize: '12px',
        lineHeight: '1.5',
        margin: '0 0 8px',
        textAlign: 'center' as const,
    },
    footerSubtext: {
        color: colors.slate[400],
        fontSize: '11px',
        lineHeight: '1.5',
        margin: '0',
        textAlign: 'center' as const,
    },
    unsubscribe: {
        marginTop: '16px',
        textAlign: 'center' as const,
    },
    unsubscribeLink: {
        color: colors.slate[400],
        fontSize: '11px',
        textDecoration: 'underline',
    },
}

export { styles }