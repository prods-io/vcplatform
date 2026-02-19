# Claude Code Prompt: VC-Founder Connection Platform MVP

## Project Overview

Build an MVP for a **founder-facing VC discovery and connection platform** — a web app where startup founders can discover, filter, and connect with venture capital firms, angel investors, incubators, accelerators, and grant providers. VCs are **data entities** (not users) — their profiles are curated/scraped, not self-registered.

Think of it as "Crunchbase meets LinkedIn for fundraising founders" — similar to https://www.woodenscale.ai/ and https://pro.basetemplates.com/discovery

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Storage + Row Level Security)
- **AI:** Anthropic Claude API (for pitch deck analysis and VC recommendations)
- **Email:** Resend + React Email
- **Hosting:** Vercel-ready (optimized for deployment)

---

## Architecture

```
Founders (Users) ←→ Platform ←→ VC Data (Curated Entities)
                                    ↑
                          Admin Panel (manual curation)
                          + Seed data from CSV/JSON
```

VCs do NOT register. Founders are the only authenticated users. An admin panel allows manual VC data entry and management.

---

## Database Schema (Supabase PostgreSQL)

### `profiles` (extends Supabase auth.users)
```sql
- id (uuid, references auth.users)
- full_name (text)
- email (text)
- linkedin_url (text)
- avatar_url (text)
- bio (text)
- role (text) -- 'founder' or 'admin'
- onboarding_completed (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `startups`
```sql
- id (uuid, primary key)
- founder_id (uuid, references profiles)
- name (text, not null)
- tagline (text)
- description (text)
- website (text)
- logo_url (text)
- sector (text[]) -- e.g. ['fintech', 'saas', 'healthtech']
- stage (text) -- 'idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus'
- location_city (text)
- location_country (text)
- founded_year (integer)
- team_size (text) -- '1-5', '6-15', '16-50', '50+'
- pitch_deck_url (text)
- funding_raised (bigint) -- in USD cents
- funding_target (bigint) -- in USD cents
- slug (text, unique) -- for public URL
- is_public (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `vc_firms`
```sql
- id (uuid, primary key)
- name (text, not null)
- slug (text, unique)
- website (text)
- logo_url (text)
- description (text)
- type (text) -- 'vc', 'angel', 'incubator', 'accelerator', 'grant'
- investment_stages (text[]) -- ['pre_seed', 'seed', 'series_a']
- sectors (text[]) -- ['fintech', 'saas', 'deeptech']
- geographies (text[]) -- ['india', 'us', 'europe', 'global']
- check_size_min (bigint) -- in USD
- check_size_max (bigint) -- in USD
- fund_size (text) -- display string like '$50M-$100M'
- portfolio_count (integer)
- founded_year (integer)
- headquarters (text)
- email (text) -- public contact
- linkedin_url (text)
- twitter_url (text)
- crunchbase_url (text)
- is_active (boolean, default true)
- data_quality_score (integer, 0-100)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `vc_partners` (individual people at VC firms)
```sql
- id (uuid, primary key)
- vc_firm_id (uuid, references vc_firms)
- name (text, not null)
- title (text) -- 'Managing Partner', 'Principal', etc.
- linkedin_url (text)
- twitter_url (text)
- email (text)
- photo_url (text)
- bio (text)
- created_at (timestamptz)
```

### `saved_vcs` (founders bookmarking VCs)
```sql
- id (uuid, primary key)
- founder_id (uuid, references profiles)
- vc_firm_id (uuid, references vc_firms)
- notes (text) -- personal notes
- status (text) -- 'saved', 'contacted', 'in_conversation', 'passed'
- created_at (timestamptz)
```

### `pitch_deck_analyses`
```sql
- id (uuid, primary key)
- startup_id (uuid, references startups)
- founder_id (uuid, references profiles)
- deck_url (text)
- analysis (jsonb) -- structured AI analysis
- score (integer, 0-100)
- created_at (timestamptz)
```

---

## Pages & Routes

### Public Pages (no auth required)
```
/                       → Landing page (hero, features, CTA to sign up)
/vc/[slug]              → Public VC firm profile page (SEO-indexable)
/startup/[slug]         → Public startup profile page (SEO-indexable)
/resources              → Blog listing page (static for MVP, just placeholder)
```

### Auth Pages
```
/login                  → Email/password + Google OAuth login
/signup                 → Registration + redirect to onboarding
/onboarding             → Multi-step founder onboarding form
```

### Dashboard Pages (auth required, founder role)
```
/dashboard              → Overview: saved VCs, startup stats, quick actions
/dashboard/discover     → VC discovery page with filters and search
/dashboard/saved        → Saved/bookmarked VCs with status tracking
/dashboard/startup      → Edit startup profile
/dashboard/pitch-deck   → Upload & analyze pitch deck with AI
/dashboard/profile      → Edit personal profile
```

### Admin Pages (auth required, admin role)
```
/admin                  → Admin dashboard
/admin/vcs              → CRUD for VC firms
/admin/vcs/new          → Add new VC firm form
/admin/vcs/[id]/edit    → Edit VC firm
/admin/partners         → Manage VC partners
/admin/founders         → View registered founders
/admin/seed             → Bulk import VCs from CSV/JSON
```

---

## Core Features to Build

### 1. Auth & Onboarding
- Supabase Auth with email/password and Google OAuth
- Multi-step onboarding after signup:
  - Step 1: Personal info (name, LinkedIn, bio)
  - Step 2: Startup info (name, sector, stage, location, team size)
  - Step 3: Fundraising info (amount raised, target, pitch deck upload)
- Save progress between steps
- Skip option for non-required fields

### 2. VC Discovery Page (`/dashboard/discover`)
This is the CORE feature. Build it well.
- **Search bar** — full text search on VC name, description
- **Filters sidebar:**
  - Type: VC, Angel, Incubator, Accelerator, Grant (multi-select)
  - Stage: Pre-seed, Seed, Series A, Series B+ (multi-select)
  - Sector: Fintech, SaaS, Healthtech, Deeptech, etc. (multi-select)
  - Geography: India, US, Europe, Global (multi-select)
  - Check size range (slider or min/max input)
- **Results grid** — card layout showing:
  - VC logo, name, type badge
  - Investment stages as tags
  - Sectors as tags
  - Check size range
  - Location
  - "Save" button (bookmark)
- **Pagination** or infinite scroll
- **Sort by:** Relevance, Name A-Z, Recently added
- Design reference: https://pro.basetemplates.com/discovery

### 3. VC Profile Page (`/vc/[slug]`)
Public, SEO-indexable page for each VC firm:
- Hero section: logo, name, type, website link
- Overview: description, investment thesis
- Key details: stages, sectors, check size, geography, fund size
- Team/Partners section: photos, names, titles, LinkedIn links
- Portfolio companies (if data available, placeholder for MVP)
- Contact info / apply link
- Design reference: https://slidebean.com/investor/sapphire-ventures and https://www.ambitionbox.com/overview/eximius-ventures-overview

### 4. Startup Profile Page (`/startup/[slug]`)
Public, SEO-indexable page for each startup:
- Founder info with LinkedIn link
- Startup overview: name, tagline, description
- Key details: sector, stage, location, team size
- Fundraising status (if public)

### 5. Save & Track VCs (`/dashboard/saved`)
- List of bookmarked VCs
- Status tracking per VC: Saved → Contacted → In Conversation → Passed
- Add personal notes per VC
- Filter by status

### 6. AI Pitch Deck Analyzer (`/dashboard/pitch-deck`)
- Upload PDF pitch deck to Supabase Storage
- Send to Claude API for analysis
- Return structured feedback:
  - Overall score (0-100)
  - Strengths (list)
  - Areas for improvement (list)
  - Missing sections (problem, solution, market size, business model, team, traction, ask)
  - Specific suggestions per section
  - VC readiness assessment
- Save analysis history

### 7. Admin Panel
- Protected by admin role check
- CRUD interface for VC firms (add, edit, delete)
- CRUD for VC partners
- Bulk CSV/JSON import for seeding VC data
- View registered founders list
- Simple dashboard with counts (total VCs, founders, startups)

### 8. Landing Page (`/`)
- Clean, modern hero section with value prop
- "Find the right investors for your startup" messaging
- Feature highlights (VC Discovery, AI Pitch Deck Analysis, Startup Profile)
- CTA to sign up
- Social proof section (placeholder for MVP)
- Footer with links

---

## Seed Data

Pre-populate the database with at least **50 VC firms** focused on Indian and global pre-seed/seed stage investors. Include a mix of:
- 20 Indian VCs (e.g., Blume Ventures, Kalaari Capital, Nexus Venture Partners, Accel India, Sequoia India/Peak XV, 100X.VC, Titan Capital, etc.)
- 15 Global VCs active in India (e.g., Y Combinator, Techstars, 500 Global, etc.)
- 10 Angel investors/networks (e.g., Indian Angel Network, LetsVenture, AngelList India)
- 5 Incubators/Accelerators (e.g., T-Hub, NASSCOM 10K, Startup India)

Create a seed script that reads from a JSON file and populates the database.

---

## File Structure

```
/app
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── onboarding/page.tsx
├── (public)/
│   ├── page.tsx                    (landing)
│   ├── vc/[slug]/page.tsx          (public VC profile)
│   ├── startup/[slug]/page.tsx     (public startup profile)
│   └── resources/page.tsx
├── (dashboard)/
│   ├── layout.tsx    dashboard              (sidebar + nav)
│   ├── dashboard/page.tsx
│   ├── dashboard/discover/page.tsx
│   ├── dashboard/saved/page.tsx
│   ├── dashboard/startup/page.tsx
│   ├── dashboard/pitch-deck/page.tsx
│   └── dashboard/profile/page.tsx
├── (admin)/dashboard
│   ├── layout.tsx
│   ├── admin/page.tsx
│   ├── admin/vcs/page.tsx
│   ├── admin/vcs/new/page.tsx
│   ├── admin/vcs/[id]/edit/page.tsx
│   ├── admin/partners/page.tsx
│   ├── admin/founders/page.tsx
│   └── admin/seed/page.tsx
├── api/
│   ├── ai/
│   │   └── analyze-deck/route.ts
│   └── webhooks/
│       └── ...
└── layout.tsx

/components
├── ui/                (shadcn components)
├── landing/           (landing page sections)
├── dashboard/         (dashboard-specific components)
├── vc/                (VC card, VC profile sections)
├── startup/           (startup profile components)
├── onboarding/        (multi-step form components)
└── admin/             (admin CRUD components)

/lib
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── middleware.ts
│   └── types.ts       (generated from Supabase)
├── ai/
│   └── analyze-deck.ts
├── utils/
│   ├── constants.ts   (sectors, stages, geographies lists)
│   └── helpers.ts
└── hooks/
    └── ...

/data
└── seed-vcs.json      (seed data for VC firms)

/supabase
└── migrations/        (SQL migrations for tables + RLS policies)
```

---

## Row Level Security (RLS) Policies

```sql
-- Profiles: users can read all, update own
-- Startups: public read if is_public, founders can CRUD own
-- VC firms: public read for all, only admins can CRUD
-- VC partners: public read, admin CRUD
-- Saved VCs: founders can CRUD own only
-- Pitch deck analyses: founders can CRUD own only
```

---

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Design Guidelines

- **Clean, professional, minimal** — think Linear/Notion aesthetic
- Use shadcn/ui components as the base
- Color scheme: Dark sidebar navigation, light content area
- Card-based layouts for VC listings
- Responsive: mobile-first for dashboard pages
- Use proper loading states and skeletons
- Toast notifications for actions (save, update, delete)
- Empty states with helpful CTAs

---

## MVP Scope Boundaries

**DO build:**
- Full auth flow with onboarding
- VC discovery with filters and search
- VC and startup public profile pages
- Save/bookmark VCs with status tracking
- AI pitch deck analyzer
- Admin panel for VC data management
- Seed data import
- Landing page

**DO NOT build (future phases):**
- VC data scraping/enrichment pipeline
- Real-time notifications/alerts
- Email outreach integration (Resend setup is fine, but no compose-and-send flow)
- AI chatbot for personalized VC recommendations
- Pitch deck builder (only analyzer)
- Payment/subscription (Stripe)
- VC claiming their profiles
- Blog/CMS integration (placeholder page only)

---

## Getting Started

1. Initialize Next.js 14 project with TypeScript, Tailwind, and App Router
2. Install and configure shadcn/ui
3. Set up Supabase project and run migrations
4. Implement auth (login, signup, middleware for protected routes)
5. Build onboarding flow
6. Build admin panel + seed data import
7. Build VC discovery page (the core feature)
8. Build VC and startup public profile pages
9. Build saved VCs tracking
10. Build pitch deck analyzer
11. Build landing page
12. Polish, add loading states, error handling, responsive design
