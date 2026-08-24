/**
 * ============================================================================
 * RESET PASSWORD EMAIL - Email de redefinição de senha (Supabase Auth)
 * ============================================================================
 * NOTA: Este template usa variáveis de template do Supabase ({{ .ConfirmationURL }})
 * que são processadas pelo servidor de auth do Supabase.
 * ============================================================================
 */

import * as React from 'react'
import {
  EmailWrapper,
  EmailHeader,
  EmailFooter,
  PrimaryButton,
  Heading,
  Paragraph,
  InfoBox,
} from './components'

export const ResetPasswordEmail = () => {
  return (
    <EmailWrapper preview="Redefinição de senha solicitada - Poderosa Agenda">
      <EmailHeader />

      <Heading emoji="🔒">Redefinição de Senha</Heading>

      <Paragraph>Olá,</Paragraph>

      <Paragraph>
        Recebemos uma solicitação para redefinir a senha da sua conta na
        Poderosa Agenda. Clique no botão abaixo para criar uma nova senha
        segura.
      </Paragraph>

      {/* Link de redefinição - variável do Supabase Auth */}
      <PrimaryButton href="{{ .ConfirmationURL }}">
        Redefinir Minha Senha
      </PrimaryButton>

      <InfoBox variant="warning">
        Se você não solicitou a redefinição de senha, pode ignorar este e-mail
        com segurança. Nenhuma alteração será feita na sua conta.
      </InfoBox>

      <Paragraph muted>
        Este link expira em 24 horas por motivos de segurança.
      </Paragraph>

      <Paragraph muted>
        Este é um e-mail automático enviado pela plataforma Poderosa Agenda.
      </Paragraph>

      <EmailFooter />
    </EmailWrapper>
  )
}

export default ResetPasswordEmail