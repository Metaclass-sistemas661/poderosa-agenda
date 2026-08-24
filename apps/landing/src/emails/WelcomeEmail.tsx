/**
 * ============================================================================
 * WELCOME EMAIL - Email de boas-vindas após pagamento confirmado
 * ============================================================================
 * Inclui credenciais temporárias para primeiro acesso
 * ============================================================================
 */

import * as React from 'react'
import { Section, Text } from '@react-email/components'
import {
  EmailWrapper,
  EmailHeader,
  EmailFooter,
  PrimaryButton,
  Heading,
  Paragraph,
  InfoBox,
  DataTable,
  colors,
} from './components'

export interface WelcomeEmailProps {
  salonName: string
  ownerName?: string
  loginUrl: string
  temporaryPassword?: string
}

export const WelcomeEmail = ({
  salonName,
  ownerName,
  loginUrl,
  temporaryPassword,
}: WelcomeEmailProps) => {
  const hasCredentials = !!temporaryPassword

  return (
    <EmailWrapper
      preview={`Bem-vindo(a) à Poderosa Agenda! Seu salão ${salonName} está pronto.`}
    >
      <EmailHeader />

      <Heading emoji="🚀">Pagamento Confirmado!</Heading>

      <Paragraph>
        {ownerName ? `Olá, ${ownerName}!` : 'Olá!'} Seja muito bem-vindo(a),
        administrador(a) do salão <strong>{salonName}</strong>!
      </Paragraph>

      <Paragraph>
        O seu pagamento foi recebido com sucesso e seu ambiente exclusivo já foi
        provisionado na nossa infraestrutura em nuvem.
      </Paragraph>

      {/* Credenciais de Acesso */}
      {hasCredentials && (
        <>
          <Section
            style={{
              backgroundColor: colors.slate[100],
              borderRadius: '12px',
              margin: '24px 40px',
              padding: '24px',
              border: `2px solid ${colors.primary[600]}`,
            }}
          >
            <Text
              style={{
                color: colors.primary[600],
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                margin: '0 0 16px',
                textTransform: 'uppercase' as const,
                textAlign: 'center' as const,
              }}
            >
              🔐 Suas Credenciais de Acesso
            </Text>

            <DataTable
              rows={[
                { label: 'Senha Temporária', value: temporaryPassword || '' },
              ]}
            />

            <Text
              style={{
                color: colors.slate[500],
                fontSize: '12px',
                margin: '16px 0 0',
                textAlign: 'center' as const,
              }}
            >
              Use o e-mail para o qual recebeu esta mensagem
            </Text>
          </Section>

          <InfoBox variant="warning">
            <strong>⚠️ Importante:</strong> Por segurança, você será obrigado(a)
            a trocar esta senha temporária no primeiro acesso ao sistema.
          </InfoBox>
        </>
      )}

      {!hasCredentials && (
        <InfoBox variant="info">
          Para o seu primeiro acesso, utilize o mesmo e-mail que você cadastrou
          na solicitação. Recomendamos usar a opção "Magic Link" ou redefinir a
          senha no primeiro login.
        </InfoBox>
      )}

      <PrimaryButton href={loginUrl}>Acessar meu Painel</PrimaryButton>

      <Paragraph muted>
        Qualquer dúvida, responda este e-mail para falar com nosso suporte.
      </Paragraph>

      <EmailFooter showSocial />
    </EmailWrapper>
  )
}

export default WelcomeEmail