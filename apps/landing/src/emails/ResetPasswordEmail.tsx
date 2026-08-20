import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind
} from '@react-email/components';
import * as React from 'react';

export const ResetPasswordEmail = () => {
  return (
    <Html>
      <Head />
      <Preview>Redefinição de senha solicitada</Preview>
      <Tailwind>
        <Body className="bg-zinc-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-zinc-200 rounded-lg shadow-sm my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px]">
              <Text className="text-2xl font-bold text-center text-zinc-900 mx-0 my-[30px] p-0">
                Poderosa Agenda
              </Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Redefinição de Senha 🔒
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Olá,
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Recebemos uma solicitação para redefinir a senha da sua conta na Poderosa Agenda. 
              Clique no botão abaixo para criar uma nova senha segura.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3 w-full"
                href="{{ .ConfirmationURL }}"
              >
                Redefinir Minha Senha
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança. 
              Nenhuma alteração será feita na sua conta.
            </Text>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Este é um e-mail automático enviado pela plataforma Poderosa Agenda.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
