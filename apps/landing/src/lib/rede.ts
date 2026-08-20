/**
 * Stub Temporário para Integração com a Rede (Itaú).
 * 
 * Atualmente não possuímos as credenciais e chaves da API da Rede.
 * Este módulo serve para substituir o Mercado Pago e manter a arquitetura 
 * íntegra sem travar o processo de aprovação de acessos.
 */

export const DEFAULT_PLAN_PRICE = 59.90;
export const DEFAULT_PLAN_TITLE = "Assinatura Poderosa Agenda (Rede)";

export const redeApi = {
    /**
     * Gera um link de pagamento. 
     * Como estamos em fase de stub, retorna um link placeholder de aviso.
     */
    generateCheckoutLink: async (params: {
        amount: number;
        referenceId: string;
        customerEmail: string;
        customerName: string;
    }): Promise<string> => {
        
        console.log('[REDE STUB] Mocking payment generation for:', params.referenceId);

        // Verificação futura das credenciais
        const token = process.env.REDE_API_TOKEN;
        const pv = process.env.REDE_PV; // Ponto de Venda

        if (!token || !pv) {
            console.warn('[REDE STUB] Chaves da Rede não encontradas. Usando link provisório.');
            // Retorna a URL base do site direcionando para uma página de status de pagamento
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://poderosaagenda.com.br';
            return `${baseUrl}/status-pagamento?status=pendente&ref=${params.referenceId}`;
        }

        // TODO: Implementar chamadas reais para a Rede SDK/API REST aqui quando as credenciais chegarem.
        
        return `https://poderosaagenda.com.br/status-pagamento?status=pendente&ref=${params.referenceId}`;
    }
};
