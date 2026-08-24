/**
 * ============================================================================
 * CONTACT CONFIRMATION EMAIL - Email de confirmação para o usuário
 * ============================================================================
 */

import * as React from 'react'
import {
    EmailWrapper,
    EmailHeader,
    EmailFooter,
    Heading,
    Paragraph,
    InfoBox,
    SITE_URL,
    colors,
} from './components'

interface ContactConfirmationEmailProps {
    name: string
    subject: string
}

export const ContactConfirmationEmail = ({
    name,
    subject,
}: ContactConfirmationEmailProps) => {
    return (
        <EmailWrapper preview={`Recebemos sua mensagem - ${subject}`}>
            <EmailHeader />

            <Heading emoji="✉️">Mensagem Recebida!</Heading>

            <Paragraph>Olá, {name}!</Paragraph>

            <Paragraph>
                Recebemos sua mensagem sobre <strong>"{subject}"</strong> e
                agradecemos por entrar em contato conosco.
            </Paragraph>

            <InfoBox variant="info">
                Nossa equipe está analisando sua solicitação e responderá em até{' '}
                <strong>24 horas úteis</strong>. Fique atento à sua caixa de entrada.
            </InfoBox>

            <Paragraph>
                Enquanto isso, você pode explorar nossa{' '}
                <a
                    href={`${SITE_URL}/ajuda`}
                    style={{ color: colors.primary[600], textDecoration: 'none' }}
                >
                    Central de Ajuda
                </a>{' '}
                ou conferir nossos recursos na{' '}
                <a
                    href={`${SITE_URL}/documentacao`}
                    style={{ color: colors.primary[600], textDecoration: 'none' }}
                >
                    Documentação
                </a>
                .
            </Paragraph>

            <Paragraph muted>
                Este é um e-mail automático de confirmação. Por favor, não responda
                diretamente a esta mensagem.
            </Paragraph>

            <EmailFooter showSocial />
        </EmailWrapper>
    )
}

export default ContactConfirmationEmail