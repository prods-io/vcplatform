/**
 * Resend Webhook Handler
 *
 * Receives email tracking events (delivered, opened, clicked, bounced) from Resend
 * and updates the outreach_emails table accordingly.
 *
 * Setup in Resend dashboard:
 *   Webhooks → Add endpoint → https://yourdomain.com/api/webhooks/resend
 *   Events to subscribe: email.delivered, email.opened, email.clicked, email.bounced
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/types';

function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ResendWebhookEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    tags?: Record<string, string>;
    [key: string]: unknown;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResendWebhookEvent;
    const { type, data } = body;

    if (!data?.email_id) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    // Look up the outreach record by Resend's email ID
    const { data: emailRecord } = await supabase
      .from('outreach_emails')
      .select('id, status, opened_at, clicked_at')
      .eq('resend_email_id', data.email_id)
      .single();

    if (!emailRecord) {
      // Email not tracked by us — ignore
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();
    const updates: Record<string, string | null> = { updated_at: now };

    switch (type) {
      case 'email.delivered':
        if (emailRecord.status === 'sent' || emailRecord.status === 'sending') {
          updates.status = 'delivered';
          updates.delivered_at = now;
        }
        break;

      case 'email.opened':
        // Don't downgrade from 'clicked' back to 'opened'
        if (emailRecord.status !== 'clicked') {
          updates.status = 'opened';
          if (!emailRecord.opened_at) {
            updates.opened_at = now;
          }
        }
        break;

      case 'email.clicked':
        updates.status = 'clicked';
        if (!emailRecord.clicked_at) {
          updates.clicked_at = now;
        }
        break;

      case 'email.bounced':
        updates.status = 'bounced';
        updates.bounced_at = now;
        break;

      default:
        // Unknown event type — no-op
        return NextResponse.json({ ok: true });
    }

    await supabase
      .from('outreach_emails')
      .update(updates)
      .eq('id', emailRecord.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Resend webhook] Error:', error);
    // Always return 200 so Resend doesn't retry endlessly
    return NextResponse.json({ ok: true });
  }
}
