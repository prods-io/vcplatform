# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Run production server
```

There is no test framework configured.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `ANTHROPIC_API_KEY` — Claude API key (used in `/api/ai/analyze-deck`)
- `RESEND_API_KEY` — Email service key
- `NEXT_PUBLIC_APP_URL` — App base URL

## Architecture

**Next.js 14 App Router + Supabase (PostgreSQL + Auth) + Anthropic Claude**

```
src/
├── app/
│   ├── (admin)/          # Admin panel — VC CRUD, partner/founder management, seed tool
│   ├── (auth)/           # Login, signup, onboarding
│   ├── (dashboard)/      # Protected founder routes — discover, saved, pitch-deck, startup, profile
│   ├── (public)/         # Landing page, resources, public VC/startup profile pages
│   └── api/
│       ├── ai/analyze-deck/   # POST: Sends pitch deck text to Claude, saves result to DB
│       └── seed/              # POST: Upserts 500+ VC firms from data/seed-vcs.json in batches of 25
├── components/
│   ├── ui/               # shadcn/ui components (Radix UI + Tailwind)
│   ├── dashboard/        # Dashboard-specific components
│   ├── admin/            # Admin-specific components
│   ├── landing/          # Landing page sections
│   └── vc/, startup/, onboarding/
├── lib/
│   ├── ai/analyze-deck.ts     # Claude Sonnet 4 integration — structured pitch analysis
│   ├── supabase/              # Browser client, server client, middleware client
│   └── utils/
│       ├── constants.ts       # SECTORS, STAGES, GEOGRAPHIES, VC_TYPES, STATUS_OPTIONS
│       └── helpers.ts         # formatCurrency, formatCheckSize, slugify, getInitials, truncate
└── middleware.ts         # Auth guard: redirects unauthenticated users, validates admin role
```

Path alias: `@/*` maps to `./src/*`

## Database (Supabase/PostgreSQL)

Migrations live in `supabase/migrations/` — run them in order in the Supabase SQL Editor when setting up a new environment. Six tables, all with Row Level Security:

| Table | Key columns |
|---|---|
| `profiles` | `id`, `email`, `full_name`, `role` (`founder`/`admin`), `linkedin_url`, `bio`, `onboarding_completed` |
| `startups` | `founder_id` (FK→profiles), `name`, `slug`, `tagline`, `sector[]`, `stage`, `location_city`, `location_country`, `funding_raised`, `funding_target`, `pitch_deck_url` |
| `vc_firms` | `slug`, `type`, `sectors[]`, `investment_stages[]`, `geographies[]`, `check_size_min/max`, `is_active`, `data_quality_score` |
| `vc_partners` | `vc_firm_id` (FK→vc_firms), `linkedin_url`, `twitter_url` |
| `saved_vcs` | `user_id`, `vc_firm_id`, `status` (`saved`/`contacted`/`in_conversation`/`passed`), `notes` |
| `pitch_deck_analyses` | `user_id`, `startup_id`, `score`, `vc_readiness`, `strengths[]`, `improvements[]`, `suggestions` (JSONB) |

Array columns use GIN indexes. Admin RLS policies use a `public.is_admin()` SECURITY DEFINER function to avoid infinite recursion (the function bypasses RLS when checking `profiles.role`).

### Local development
Add `http://localhost:3000/**` to **Supabase Dashboard → Auth → URL Configuration → Redirect URLs** so the auth callback works on localhost alongside a production Site URL.

## Authentication & Authorization

- Supabase Auth (email/password) with cookie-based sessions via `@supabase/ssr`
- `src/middleware.ts` protects `/dashboard/*` and `/admin/*`; redirects auth users away from `/login` and `/signup`
- Admin-only access enforced by checking `profiles.role = 'admin'` in middleware
- Three Supabase client variants: browser (`src/lib/supabase/client.ts`), server (`server.ts`), middleware (`middleware.ts`)

## AI Integration

`src/lib/ai/analyze-deck.ts` calls `claude-sonnet-4-20250514` with pitch deck text and returns a structured JSON object: `score` (0–100), `vc_readiness` label, `strengths[]`, `improvements[]`, `missing_sections[]`, and `suggestions` map. The API route (`/api/ai/analyze-deck`) saves results to `pitch_deck_analyses`.

## Key Conventions

- Forms use `react-hook-form` + Zod validation
- Toast notifications via `sonner`
- Tailwind with CSS variable-based theming; dark mode via `.dark` class
- `data/seed-vcs.json` is the source of truth for VC seed data — edit this file to update seeded records
