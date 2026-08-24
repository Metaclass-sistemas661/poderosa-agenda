import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface SalonStatusEmailProps {
  salonName: string;
  ownerName: string;
  status: 'active' | 'inactive' | 'suspended' | 'overdue';
}

export const SalonStatusEmail = ({
  salonName = 'Salão Teste',
  ownerName = 'Proprietário',
  status = 'active',
}: SalonStatusEmailProps) => {
  const getStatusContent = () => {
    switch (status) {
      case 'active':
        return {
          preview: 'Sua conta foi ativada com sucesso!',
          title: 'Sua conta está Ativa! 🎉',
          color: '#10b981', // emerald-500
          message: 'Boas notícias! A conta do seu salão foi ativada em nossa plataforma. Você já pode acessar o sistema e aproveitar todos os nossos recursos.',
          actionText: 'Acessar o Sistema',
          actionUrl: 'https://poderosaagenda.com.br/login',
        };
      case 'suspended':
        return {
          preview: 'Aviso importante sobre sua conta',
          title: 'Conta Suspensa Temporariamente',
          color: '#f59e0b', // amber-500
          message: 'Sua conta foi suspensa temporariamente devido a uma possível violação de nossos termos de uso ou pendência de verificação. Para regularizar sua situação e restaurar o acesso, por favor entre em contato com nosso suporte.',
          actionText: 'Falar com o Suporte',
          actionUrl: 'https://poderosaagenda.com.br/suporte',
        };
      case 'overdue':
        return {
          preview: 'Aviso de pendência financeira',
          title: 'Aviso de Inadimplência',
          color: '#ef4444', // red-500
          message: 'Identificamos uma pendência financeira em sua conta, o que resultou no bloqueio temporário do acesso ao sistema. Para continuar aproveitando nossos recursos sem interrupções, solicitamos a regularização do pagamento.',
          actionText: 'Regularizar Pagamento',
          actionUrl: 'https://poderosaagenda.com.br/financeiro',
        };
      case 'inactive':
      default:
        return {
          preview: 'Aviso sobre o status da sua conta',
          title: 'Sua conta foi Inativada',
          color: '#6b7280', // gray-500
          message: 'Informamos que a conta do seu salão foi inativada pelo administrador. Durante este período, o acesso ao sistema estará bloqueado. Se você acredita que isso é um erro, entre em contato com nosso suporte.',
          actionText: 'Falar com o Suporte',
          actionUrl: 'https://poderosaagenda.com.br/suporte',
        };
    }
  };

  const content = getStatusContent();

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo placeholder - replace with actual logo URL in production */}
          <Section style={logoContainer}>
            <Text style={logoText}>Poderosa Agenda</Text>
          </Section>

          <Heading style={{ ...h1, color: content.color }}>{content.title}</Heading>

          <Text style={text}>Olá, {ownerName}.</Text>

          <Text style={text}>{content.message}</Text>

          <Section style={buttonContainer}>
            <Button
              style={{ ...button, backgroundColor: content.color }}
              href={content.actionUrl}
            >
              {content.actionText}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Este é um email automático referente à conta do salão <strong>{salonName}</strong>. 
            Por favor, não responda diretamente a este email.
          </Text>
          <Text style={footer}>
            Poderosa Agenda © {new Date().getFullYear()} Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SalonStatusEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
};

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0',
  letterSpacing: '-0.5px',
};

const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0 24px',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
};
