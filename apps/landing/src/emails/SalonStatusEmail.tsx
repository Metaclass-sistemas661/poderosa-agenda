/**
 * ============================================================================
 * SALON STATUS EMAIL - Email de mudança de status do salão
 * ============================================================================
 */

import * as React from 'react'
import { Section, Button } from '@react-email/components'
import {
  EmailWrapper,
  EmailHeader,
  EmailFooter,
  Heading,
  Paragraph,
  InfoBox,
  colors,
} from './components'

interface SalonStatusEmailProps {
  salonName: string
  ownerName: string
  status: 'active' | 'inactive' | 'suspended' | 'overdue'
}

type StatusContent = {
  preview: string
  title: string
  emoji: string
  color: string
  variant: 'success' | 'warning' | 'error' | 'info'
  message: string
  actionText: string
  actionUrl: string
}

export const SalonStatusEmail = ({
  salonName = 'Salão Teste',
  ownerName = 'Proprietário',
  status = 'active',
}: SalonStatusEmailProps) => {
  const getStatusContent = (): StatusContent => {
    switch (status) {
      case 'active':
        return {
          preview: 'Sua conta foi ativada com sucesso!',
          title: 'Sua conta está Ativa!',
          emoji: '🎉',
          color: colors.success,
          variant: 'success',
          message:
            'Boas notícias! A conta do seu salão foi ativada em nossa plataforma. Você já pode acessar o sistema e aproveitar todos os nossos recursos.',
          actionText: 'Acessar o Sistema',
          actionUrl: 'https://poderosaagenda.com.br/login',
        }
      case 'suspended':
        return {
          preview: 'Aviso importante sobre sua conta',
          title: 'Conta Suspensa Temporariamente',
          emoji: '⚠️',
          color: colors.warning,
          variant: 'warning',
          message:
            'Sua conta foi suspensa temporariamente devido a uma possível violação de nossos termos de uso ou pendência de verificação. Para regularizar sua situação e restaurar o acesso, por favor entre em contato com nosso suporte.',
          actionText: 'Falar com o Suporte',
          actionUrl:
            'https://api.whatsapp.com/send?phone=5511999999999&text=Olá,%20preciso%20de%20ajuda%20com%20minha%20conta',
        }
      case 'overdue':
        return {
          preview: 'Aviso de pendência financeira',
          title: 'Aviso de Inadimplência',
          emoji: '💳',
          color: colors.error,
          variant: 'error',
          message:
            'Identificamos uma pendência financeira em sua conta, o que resultou no bloqueio temporário do acesso ao sistema. Para continuar aproveitando nossos recursos sem interrupções, solicitamos a regularização do pagamento.',
          actionText: 'Regularizar Pagamento',
          actionUrl: 'https://poderosaagenda.com.br/financeiro',
        }
      case 'inactive':
      default:
        return {
          preview: 'Aviso sobre o status da sua conta',
          title: 'Sua conta foi Inativada',
          emoji: '⏸️',
          color: colors.slate[500],
          variant: 'info',
          message:
            'Informamos que a conta do seu salão foi inativada pelo administrador. Durante este período, o acesso ao sistema estará bloqueado. Se você acredita que isso é um erro, entre em contato com nosso suporte.',
          actionText: 'Falar com o Suporte',
          actionUrl:
            'https://api.whatsapp.com/send?phone=5511999999999&text=Olá,%20minha%20conta%20foi%20inativada%20e%20preciso%20de%20ajuda',
        }
    }
  }

  const content = getStatusContent()

  return (
    <EmailWrapper preview={content.preview}>
      <EmailHeader />

      <Heading emoji={content.emoji}>{content.title}</Heading>

      <Paragraph>Olá, {ownerName}.</Paragraph>

      <Paragraph>{content.message}</Paragraph>

      {/* Botão com cor dinâmica */}
      <Section
        style={{
          margin: '24px 40px',
          textAlign: 'center' as const,
        }}
      >
        <Button
          href={content.actionUrl}
          style={{
            backgroundColor: content.color,
            borderRadius: '8px',
            color: colors.white,
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: '600',
            padding: '14px 32px',
            textDecoration: 'none',
          }}
        >
          {content.actionText}
        </Button>
      </Section>

      <InfoBox variant={content.variant}>
        Este é um e-mail automático referente à conta do salão{' '}
        <strong>{salonName}</strong>. Por favor, não responda diretamente a esta
        mensagem.
      </InfoBox>

      <EmailFooter />
    </EmailWrapper>
  )
}

export default SalonStatusEmail