import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import SalonStatusEmail from '@/emails/SalonStatusEmail';

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Needs service role key to reliably read emails
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { salonId, status } = await request.json();

    if (!salonId || !status) {
      return NextResponse.json(
        { error: 'salonId and status are required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Simulating email sending.');
      return NextResponse.json({ success: true, simulated: true });
    }

    // 1. Get Salon details
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salons')
      .select('name')
      .eq('id', salonId)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }

    // 2. Get Owner details (find the admin_user for this salon)
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('name, email')
      .eq('salon_id', salonId)
      .limit(1)
      .single();

    if (adminError || !adminUser || !adminUser.email) {
      return NextResponse.json(
        { error: 'Salon owner not found or missing email' },
        { status: 404 }
      );
    }

    // 3. Send Email via Resend
    const subjectMap: Record<string, string> = {
      active: 'Sua conta na Poderosa Agenda foi ativada! 🎉',
      inactive: 'Aviso: Sua conta foi inativada',
      suspended: 'Aviso Importante: Conta Suspensa',
      overdue: 'Aviso de Pendência Financeira',
    };

    const subject = subjectMap[status] || 'Atualização na sua conta';

    const data = await resend.emails.send({
      from: 'Poderosa Agenda <suporte@poderosaagenda.com.br>', // Replace with verified domain
      to: adminUser.email,
      subject: subject,
      react: SalonStatusEmail({
        salonName: salon.name,
        ownerName: adminUser.name,
        status: status as any,
      }),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending salon status email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
