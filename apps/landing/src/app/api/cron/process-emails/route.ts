import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';

// Configure this in your .env or platform secrets
// To trigger this cron securely, append ?key=YOUR_CRON_SECRET
const CRON_SECRET = process.env.CRON_SECRET || 'dev_cron_secret';
const EMAIL_FROM = 'Poderosa Agenda <contato@poderosaagenda.com.br>';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // 1. Authorization
    // Allow either the correct secret key OR the Vercel Cron header
    if (key !== CRON_SECRET && request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabaseAdmin = createAdminClient();

        // 2. Fetch pending emails
        // Limit to 20 per execution to avoid Vercel Function timeout (usually 10s-60s)
        const { data: emails, error: fetchError } = await supabaseAdmin
            .from('email_outbox')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(20);

        if (fetchError) {
            throw fetchError;
        }

        if (!emails || emails.length === 0) {
            return NextResponse.json({ message: 'No pending emails' });
        }

        let sentCount = 0;
        let failedCount = 0;

        // 3. Process each email
        for (const email of emails) {
            try {
                // Send via Resend
                await resend.emails.send({
                    from: EMAIL_FROM,
                    to: email.to_email,
                    subject: email.subject,
                    html: email.html_body
                });

                // Mark as sent
                await supabaseAdmin
                    .from('email_outbox')
                    .update({ 
                        status: 'sent', 
                        attempts: email.attempts + 1 
                    })
                    .eq('id', email.id);
                
                sentCount++;
            } catch (error: any) {
                console.error(`[CRON] Failed to send email ID ${email.id}:`, error);
                
                // Mark as failed or retry later?
                // For a robust enterprise pattern, we retry up to 3 times before permanent failure
                const newAttempts = email.attempts + 1;
                const newStatus = newAttempts >= 3 ? 'failed' : 'pending';

                await supabaseAdmin
                    .from('email_outbox')
                    .update({ 
                        status: newStatus, 
                        attempts: newAttempts,
                        last_error: error.message || 'Unknown error'
                    })
                    .eq('id', email.id);

                failedCount++;
            }
        }

        return NextResponse.json({ 
            message: 'Queue processed',
            processed: emails.length,
            sent: sentCount,
            failed: failedCount
        });

    } catch (err: any) {
        console.error('[CRON] Fatal error processing queue:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}
