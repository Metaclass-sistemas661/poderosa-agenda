import { Resend } from 'resend';

// Only create a single instance of the Resend client
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = new Resend(resendApiKey || 're_placeholder');

// Helper to construct the from address
export const EMAIL_FROM = 'Poderosa Agenda <onboarding@poderosaagenda.com.br>';
