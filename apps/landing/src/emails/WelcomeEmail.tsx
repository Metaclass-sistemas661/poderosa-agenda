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
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              margin: '32px 0',
              padding: '32px 24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <Text
              style={{
                color: colors.primary[600],
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                margin: '0 0 24px',
                textTransform: 'uppercase' as const,
                textAlign: 'center' as const,
              }}
            >
              🔐 Credenciais de Acesso
            </Text>

            <Section style={{ textAlign: 'center', width: '100%' }}>
              <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                <tr>
                  <td style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '16px 32px',
                    textAlign: 'center'
                  }}>
                    <Text style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Senha Temporária
                    </Text>
                    <Text
                      style={{
                        color: '#0f172a',
                        fontSize: '24px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        margin: '0',
                        fontFamily: 'monospace',
                      }}
                    >
                      {temporaryPassword}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Text
              style={{
                color: '#64748b',
                fontSize: '13px',
                margin: '24px 0 0',
                textAlign: 'center' as const,
              }}
            >
              O login é o e-mail para o qual recebeu esta mensagem
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#fffbeb',
              borderRadius: '8px',
              padding: '16px 20px',
              borderLeft: '4px solid #f59e0b',
              marginBottom: '32px'
            }}
          >
            <Text
              style={{
                color: '#92400e',
                fontSize: '13px',
                margin: 0,
                lineHeight: '1.5'
              }}
            >
              <strong>⚠️ Importante:</strong> Por segurança, o sistema exigirá que você cadastre uma <strong>nova senha</strong> logo no seu primeiro acesso.
            </Text>
          </Section>
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