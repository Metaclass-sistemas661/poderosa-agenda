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

interface WelcomeEmailProps {
  salonName: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  salonName,
  loginUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo à Poderosa Agenda!</Preview>
      <Tailwind>
        <Body className="bg-zinc-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-zinc-200 rounded-lg shadow-sm my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px]">
              <Text className="text-2xl font-bold text-center text-zinc-900 mx-0 my-[30px] p-0">
                Poderosa Agenda
              </Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Pagamento Confirmado! 🚀
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Seja muito bem-vindo(a), administrador(a) do salão <strong>{salonName}</strong>!
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              O seu pagamento foi recebido com sucesso e seu ambiente exclusivo já foi provisionado na nossa infraestrutura em nuvem.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3 w-full"
                href={loginUrl}
              >
                Acessar meu Painel
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Para o seu primeiro acesso, utilize o mesmo e-mail que você cadastrou na solicitação.
              Recomendamos usar a opção "Magic Link" ou redefinir a senha no primeiro login.
            </Text>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Qualquer dúvida, responda este e-mail para falar com nosso suporte.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
