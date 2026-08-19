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

interface ApprovalPaymentEmailProps {
  salonName: string;
  paymentLink: string;
  planPrice: string;
}

export const ApprovalPaymentEmail = ({
  salonName,
  paymentLink,
  planPrice,
}: ApprovalPaymentEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sua conta na Poderosa Agenda foi aprovada!</Preview>
      <Tailwind>
        <Body className="bg-zinc-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-zinc-200 rounded-lg shadow-sm my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px]">
              <Text className="text-2xl font-bold text-center text-zinc-900 mx-0 my-[30px] p-0">
                Poderosa Agenda
              </Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Sua conta foi <strong>aprovada!</strong> 🎉
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Olá administrador(a) do salão <strong>{salonName}</strong>,
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Nossa equipe analisou sua solicitação e temos o prazer de informar que seu cadastro foi aprovado! 
              Você está a um passo de modernizar toda a gestão do seu salão de beleza.
            </Text>

            <Section className="bg-zinc-50 rounded-lg p-6 my-6 text-center border border-zinc-100">
              <Text className="text-zinc-600 m-0 text-sm">Plano Básico</Text>
              <Text className="text-3xl font-bold text-zinc-900 m-0 mt-2">R$ {planPrice}<span className="text-sm font-normal text-zinc-500">/mês</span></Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3 w-full"
                href={paymentLink}
              >
                Pagar e Ativar Minha Conta
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              O pagamento pode ser feito via PIX ou Cartão de Crédito de forma 100% segura. 
              Sua conta será liberada automaticamente logo após a confirmação.
            </Text>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Se você não fez essa solicitação, por favor ignore este e-mail.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ApprovalPaymentEmail;
