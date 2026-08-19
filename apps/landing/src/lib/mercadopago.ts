import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configura o SDK com o token de acesso do ambiente
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-placeholder',
  options: { timeout: 5000 }
});

export const mpPreference = new Preference(client);

// O valor padrão de cobrança configurado pelo admin
export const DEFAULT_PLAN_PRICE = 59.90;
export const DEFAULT_PLAN_TITLE = "Assinatura Poderosa Agenda";
