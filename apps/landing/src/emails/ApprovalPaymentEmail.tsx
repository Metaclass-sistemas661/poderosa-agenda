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
  Tailwind,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface ApprovalPaymentEmailProps {
  salonName: string;
  paymentLink: string;
  planPrice: string;
}

export const ApprovalPaymentEmail = ({
  salonName = 'Estabelecimento',
  paymentLink = 'https://poderosaagenda.com.br',
  planPrice = '59,90',
}: ApprovalPaymentEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sua conta corporativa na Poderosa Agenda foi aprovada</Preview>
      <Tailwind>
        <Body className="bg-[#F9FAFB] my-auto mx-auto font-sans px-2 py-10">
          <Container className="border border-solid border-[#E5E7EB] rounded-xl shadow-md mx-auto max-w-[520px] bg-white overflow-hidden">
            
            {/* Header / Logo Section */}
            <Section className="bg-[#111827] px-[40px] py-[32px] text-center">
              <Text className="text-[22px] font-semibold text-white mx-0 my-0 tracking-tight">
                Poderosa Agenda
              </Text>
              <Text className="text-[#9CA3AF] text-[13px] mx-0 mt-2 mb-0 uppercase tracking-widest font-medium">
                Atualização de Status
              </Text>
            </Section>

            {/* Content Section */}
            <Section className="px-[40px] pt-[40px] pb-[32px]">
              <Heading className="text-[#111827] text-[24px] font-semibold text-left p-0 my-0 mx-0 tracking-tight">
                Solicitação Aprovada
              </Heading>

              <Text className="text-[#374151] text-[15px] leading-[26px] mt-[24px] mb-[16px]">
                Prezado(a) responsável pelo estabelecimento <strong>{salonName}</strong>,
              </Text>
              
              <Text className="text-[#4B5563] text-[15px] leading-[26px] m-0">
                Temos o prazer de informar que a sua solicitação de acesso corporativo à plataforma <strong>Poderosa Agenda</strong> foi aprovada com sucesso. Nossa equipe de compliance concluiu a análise do seu cadastro e o seu ambiente exclusivo já encontra-se pré-configurado.
              </Text>
              
              <Text className="text-[#4B5563] text-[15px] leading-[26px] mt-[16px] mb-0">
                Para efetivar sua assinatura e liberar o acesso imediato ao painel de gestão, por favor, conclua o pagamento da mensalidade correspondente ao plano selecionado.
              </Text>

              {/* Pricing Card */}
              <Section className="bg-[#F9FAFB] border border-solid border-[#E5E7EB] rounded-lg p-[24px] mt-[32px] mb-[32px]">
                <Row>
                  <Column>
                    <Text className="text-[#6B7280] m-0 text-[13px] uppercase tracking-wider font-semibold">
                      Plano Básico
                    </Text>
                    <Text className="text-[#111827] m-0 text-[14px] mt-1 font-medium">
                      Gestão completa e agendamentos
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-[28px] font-bold text-[#111827] m-0">
                      R$ {planPrice}
                    </Text>
                    <Text className="text-[#6B7280] m-0 text-[12px]">
                      /mês
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Action Button */}
              <Section className="text-center">
                <Button
                  className="bg-[#111827] rounded-md text-white text-[14px] font-medium no-underline text-center px-6 py-4 w-full"
                  href={paymentLink}
                >
                  Efetuar Pagamento e Ativar Conta
                </Button>
              </Section>

              <Text className="text-[#6B7280] text-[13px] leading-[22px] mt-[24px] mb-0 text-center">
                O pagamento é processado em ambiente 100% seguro. O acesso ao seu painel administrativo será liberado automaticamente após a confirmação pela instituição financeira.
              </Text>
              
            </Section>

            {/* Footer */}
            <Section className="bg-[#F9FAFB] px-[40px] py-[24px] border-t border-solid border-[#E5E7EB]">
              <Text className="text-[#9CA3AF] text-[12px] leading-[20px] text-center m-0">
                © {new Date().getFullYear()} Poderosa Agenda. Todos os direitos reservados.
                <br />
                Esta é uma mensagem automática. Por favor, não responda a este e-mail.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ApprovalPaymentEmail;
