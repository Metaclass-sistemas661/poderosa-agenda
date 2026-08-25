/**
 * ============================================================================
 * APPROVAL PAYMENT EMAIL - Email de aprovação com link de pagamento
 * ============================================================================
 */

import * as React from 'react'
import { Section, Row, Column, Text } from '@react-email/components'
import {
  EmailWrapper,
  EmailHeader,
  EmailFooter,
  PrimaryButton,
  Heading,
  Paragraph,
  InfoBox,
  colors,
} from './components'

interface ApprovalPaymentEmailProps {
  salonName: string
  paymentLink: string
  planPrice: string
  isAnnual?: boolean
}

export const ApprovalPaymentEmail = ({
  salonName = 'Estabelecimento',
  paymentLink = 'https://poderosaagenda.com.br',
  planPrice = '59,90',
  isAnnual = false,
}: ApprovalPaymentEmailProps) => {
  return (
    <EmailWrapper preview={`Sua conta corporativa na Poderosa Agenda foi aprovada - ${salonName}`}>
      <EmailHeader />

      <Heading emoji="✅">Solicitação Aprovada!</Heading>

      <Paragraph>
        Prezado(a) responsável pelo estabelecimento <strong>{salonName}</strong>,
      </Paragraph>

      <Paragraph>
        Temos o prazer de informar que a sua solicitação de acesso corporativo à
        plataforma <strong>Poderosa Agenda</strong> foi aprovada com sucesso.
        Nossa equipe de compliance concluiu a análise do seu cadastro e o seu
        ambiente exclusivo já encontra-se pré-configurado.
      </Paragraph>

      <Paragraph>
        Para efetivar sua assinatura e liberar o acesso imediato ao painel de
        gestão, por favor, conclua o pagamento da mensalidade correspondente ao
        plano selecionado.
      </Paragraph>

      {/* Pricing Card */}
      <Section
        style={{
          backgroundColor: colors.slate[50],
          border: `1px solid ${colors.slate[200]}`,
          borderRadius: '12px',
          margin: '24px 40px',
          padding: '24px',
        }}
      >
        <Row>
          <Column>
            <Text
              style={{
                color: colors.slate[500],
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                margin: 0,
                textTransform: 'uppercase' as const,
              }}
            >
              {isAnnual ? 'Plano Anual' : 'Plano Mensal'}
            </Text>
            <Text
              style={{
                color: colors.slate[700],
                fontSize: '14px',
                fontWeight: '500',
                margin: '4px 0 0',
              }}
            >
              Gestão completa e agendamentos
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{
                color: colors.primary[600],
                fontSize: '32px',
                fontWeight: '700',
                margin: 0,
              }}
            >
              R$ {planPrice}
            </Text>
            {!isAnnual && (
              <Text
                style={{
                  color: colors.slate[500],
                  fontSize: '12px',
                  margin: '2px 0 0',
                }}
              >
                /mês
              </Text>
            )}
          </Column>
        </Row>
      </Section>

      <PrimaryButton href={paymentLink}>
        Efetuar Pagamento e Ativar Conta
      </PrimaryButton>

      <InfoBox variant="info">
        O pagamento é processado em ambiente 100% seguro. O acesso ao seu painel
        administrativo será liberado automaticamente após a confirmação pela
        instituição financeira.
      </InfoBox>

      <Paragraph muted>
        Dúvidas? Responda este e-mail para falar com nosso suporte.
      </Paragraph>

      <EmailFooter />
    </EmailWrapper>
  )
}

export default ApprovalPaymentEmail