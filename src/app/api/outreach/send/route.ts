import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => `<span>${line || '&nbsp;'}</span>`)
    .join('<br>\n');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const { vc_firm_id, to_email, to_name, subject, body } = await request.json();

    if (!vc_firm_id || !to_email || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get sender's profile for reply-to
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const senderName = profile?.full_name || user.email?.split('@')[0] || 'Founder';
    const replyTo = profile?.email || user.email;

    // Insert DB record first so we have the ID for Resend tags
    const { data: emailRecord, error: insertError } = await supabase
      .from('outreach_emails')
      .insert({
        user_id: user.id,
        vc_firm_id,
        to_email,
        to_name: to_name || null,
        subject,
        body,
        status: 'sending',
      })
      .select('id')
      .single();

    if (insertError || !emailRecord) {
      return NextResponse.json({ error: 'Failed to save email record' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capconnect.app';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff;">
  <div style="line-height: 1.7; font-size: 15px; white-space: pre-wrap;">${textToHtml(body)}</div>
  <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
    <p style="margin: 0;">Sent via <a href="${appUrl}" style="color: #6366f1; text-decoration: none;">CapConnect</a> by ${senderName}</p>
  </div>
</body>
</html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: `CapConnect <${fromEmail}>`,
      to: [to_email],
      replyTo: replyTo ? [replyTo] : undefined,
      subject,
      html: htmlBody,
      text: body,
      tags: [{ name: 'email_id', value: emailRecord.id }],
    });

    if (resendError || !resendData) {
      await supabase
        .from('outreach_emails')
        .update({ status: 'failed' })
        .eq('id', emailRecord.id);

      return NextResponse.json(
        { error: resendError?.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update with Resend's email ID and mark as sent
    await supabase
      .from('outreach_emails')
      .update({
        status: 'sent',
        resend_email_id: resendData.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailRecord.id);

    // Auto-upgrade saved_vc status from 'saved' → 'contacted' if applicable
    await supabase
      .from('saved_vcs')
      .update({ status: 'contacted', contacted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('vc_firm_id', vc_firm_id)
      .eq('status', 'saved');

    return NextResponse.json({ success: true, emailId: emailRecord.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
