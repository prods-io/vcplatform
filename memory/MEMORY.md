# VC Platform Memory

## Project Overview
Next.js 14 App Router + Supabase + Anthropic Claude. VC discovery platform for founders.

## Key Architecture
- Route groups: (admin), (auth), (dashboard), (public)
- Dashboard pages live at: src/app/(dashboard)/dashboard/[page]/page.tsx
- Supabase types: src/lib/supabase/types.ts (must update when adding tables)
- Uses `sonner` for toasts in new components, `useToast` in older ones
- Email: Resend v6 — uses `replyTo` (camelCase), NOT `reply_to`

## Outreach Email Feature (built Feb 2026)
Full in-platform email system with open/click tracking via Resend.

### New files
- `supabase/migrations/00005_outreach_emails.sql` — DB table + RLS
- `src/app/api/outreach/send/route.ts` — POST: sends via Resend, saves to DB
- `src/app/api/webhooks/resend/route.ts` — Resend webhook (delivered/opened/clicked/bounced)
- `src/app/(dashboard)/dashboard/outreach/page.tsx` — Outreach list with stats
- `src/app/(dashboard)/dashboard/outreach/compose/[vcId]/page.tsx` — Compose form

### Modified files
- `src/lib/supabase/types.ts` — added `outreach_emails` table + `OutreachEmail` export
- `src/app/(dashboard)/layout.tsx` — added "Outreach" nav item (Mail icon)
- `src/app/(public)/vc/[slug]/page.tsx` — replaced mailto button with "Send Pitch" → compose
- `src/app/(dashboard)/dashboard/discover/page.tsx` — added mail icon on VC cards
- `src/app/(dashboard)/dashboard/saved/page.tsx` — outreach status badge + "Send Email" button
- `src/app/(dashboard)/dashboard/page.tsx` — "Emails Sent" stat + "Recent Outreach" section

### Resend setup required
1. Add `RESEND_API_KEY` to .env.local
2. Set `RESEND_FROM_EMAIL` to a verified domain address (default: onboarding@resend.dev for testing)
3. In Resend dashboard: Webhooks → add https://yourdomain.com/api/webhooks/resend
   Subscribe to: email.delivered, email.opened, email.clicked, email.bounced
4. Run migration `00005_outreach_emails.sql` in Supabase SQL Editor

### Status flow
sending → sent → delivered → opened → clicked (one-way progression)
bounced / failed are terminal states

### Email tracking
- Resend tags each email with `{ name: 'email_id', value: db_record_uuid }`
- Webhook looks up by `resend_email_id` column
- Service role client (bypasses RLS) used in webhook handler
- When email sent, auto-updates saved_vcs status from 'saved' → 'contacted'

## Database Tables
profiles, startups, vc_firms, vc_partners, saved_vcs, pitch_deck_analyses, outreach_emails

## AI
Uses Gemini (gemini-2.5-flash) for pitch deck analysis, not Anthropic (ANTHROPIC_API_KEY is empty)
