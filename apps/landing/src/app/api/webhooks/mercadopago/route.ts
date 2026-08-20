import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { render } from '@react-email/render';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || body?.data?.id;
    const type = url.searchParams.get('type') || body?.type;

    // We only care about payments that were created/updated
    if (type !== 'payment') {
      return NextResponse.json({ success: true, message: 'Ignored non-payment event' });
    }

    if (!dataId) {
      return NextResponse.json({ success: false, error: 'Missing payment ID' }, { status: 400 });
    }

    // 1. Fetch the payment details from Mercado Pago API securely
    const mpToken = process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
       console.error('[WEBHOOK] MP_ACCESS_TOKEN not set');
       return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: {
        'Authorization': `Bearer ${mpToken}`,
      }
    });

    if (!paymentResponse.ok) {
       console.error('[WEBHOOK] Failed to fetch payment from MP', await paymentResponse.text());
       return NextResponse.json({ success: false, error: 'Invalid payment ID' }, { status: 400 });
    }

    const payment = await paymentResponse.json();

    // 2. We only provision if payment is approved
    if (payment.status !== 'approved') {
       return NextResponse.json({ success: true, message: `Payment status is ${payment.status}, not approved yet.` });
    }

    // external_reference holds the requestId
    const requestId = payment.external_reference;
    if (!requestId) {
       return NextResponse.json({ success: false, error: 'Payment missing external_reference' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. Ensure the request exists and is waiting for payment
    const { data: request, error: reqError } = await supabaseAdmin
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (reqError || !request) {
        return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    if (request.status === 'approved') {
        // Already provisioned
        return NextResponse.json({ success: true, message: 'Tenant already provisioned' });
    }

    // 4. Provision Auth Identity
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        request.email,
        {
            data: {
                name: request.owner_name,
                salon_name: request.salon_name
            }
        }
    );

    if (inviteError || !inviteData?.user) {
        console.error('[WEBHOOK] Auth invite failed:', inviteError);
        return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
    }

    const createdAuthUserId = inviteData.user.id;

    // 5. Execute DB Transaction
    // Because this is an automated webhook, the "actor" is system (or we pass the auth user itself)
    const { error: rpcError } = await supabaseAdmin.rpc('provision_tenant', {
        p_request_id: requestId,
        p_auth_user_id: createdAuthUserId,
        p_actor_id: createdAuthUserId
    });

    if (rpcError) {
        console.error('[WEBHOOK] RPC failed:', rpcError.message);
        // Rollback Auth
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        return NextResponse.json({ success: false, error: 'Provisioning failed' }, { status: 500 });
    }

    // 6. Send Welcome Email
    try {
        const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/login`;
        const emailHtml = await render(WelcomeEmail({
            salonName: request.salon_name,
            loginUrl: loginUrl
        }));

        await resend.emails.send({
            from: EMAIL_FROM,
            to: request.email,
            subject: 'Pagamento Confirmado - Bem-vindo à Poderosa Agenda! 🚀',
            html: emailHtml
        });
    } catch (emailErr) {
        console.error('[WEBHOOK] Welcome email failed', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Tenant provisioned successfully' });

  } catch (err: any) {
    console.error('[WEBHOOK] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
