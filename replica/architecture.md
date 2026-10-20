# Architecture: DhandhaAi (a rebuild of Dhanda AI's core features)

Reads: replica/recon.md, replica/features.csv, replica/entrepreneur.md

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite + React 18 + TypeScript (SPA, mobile-first) | Ships today as a live web app; same component model later ports to Next.js/Expo. No SSR needed for an authenticated tool; landing page is static in the same bundle. |
| styling | Tailwind CSS v4 with tokens from replica/design/tokens.json | Role-based tokens (bg/surface/accent) so replica-brand only swaps values. |
| state/data | Supabase Postgres via optimistic in-memory cache + diff-sync (`src/lib/store.ts`, `src/lib/db.ts`) **[MIGRATED 2026-10-20]** | Screens stay responsive; each changed row is upserted/deleted in the background. Database RLS is the security boundary, not client filters. |
| database | Postgres 17 on Supabase, project `jbckbwmdrrjruznaevjh` (ap-south-1 Mumbai) | Managed; RLS on all 10 public tables; cross-owner isolation tested. Free plan to start. |
| auth | Supabase Auth email/password **[DONE]**; session persisted and restored; `auth.users` trigger creates a profile | No hand-rolled production credentials. Auto-confirm is temporarily ON until custom SMTP is set up; see `SUPABASE.md`. |
| AI generation | Deterministic template engine (`src/lib/ai.ts`) using ONLY user-entered business facts; interface allows swapping to an LLM API (owner's own key) | Direct fix for the original's "AI invented wrong product facts" failure: our engine cannot invent facts, and every output needs human approval. |
| payments | v1: plan selection UI only. v2: Stripe and/or eSewa/Khalti (owner's keys) | Money only moves with the owner's own merchant accounts. |
| integrations | Google Business Profile API + Meta Graph API - official, owner's own apps/keys; v1 uses a simulated publish queue with honest "simulated" labels | GBP API is approval-gated by Google; Meta publishing needs app review. No private APIs, ever. |
| jobs | Browser-side scheduler check on load (v1); Supabase scheduled functions / Vercel Cron (v2) | Scheduled posts flip to "due" then publish via queue. |
| hosting | Any static host (Vercel/Netlify) - `npm run build` | Boring and cheap. |

One database, no microservices. The clone needs the original's FEATURES, not its architecture.

## Schema

Tables: 10 (see `supabase/migrations/` and `replica/schema.sql`). RLS is
enabled on every table. `businesses.owner_id = auth.uid()`; child rows call
`owns_business(business_id)`. Profiles are read-only to the browser so plan
changes require trusted server-side billing logic. These policies were tested
against two different owner identities in a rollback-only SQL transaction.

Hard constraints encoded: rating 1-5 checks; post status enum; audit factor
scores 0-100; one active subscription per user. Scheduling time is validated by
the client now; a trusted scheduler/publisher must revalidate it server-side.

## Logical API (architecture target; current data calls use Supabase PostgREST)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /auth/signup, /auth/login | account | public | email, password, name | session | F01 |
| POST /businesses | create business | owner | business fields | Business | F01 |
| GET /businesses/:id/audit | run/return audit | owner | - | Audit (4 factors + checks) | F01/F02 |
| PATCH /businesses/:id | apply a fix | owner | partial fields | Business + fresh Audit | F02 |
| GET/POST /businesses/:id/reviews | list/add reviews | owner | review fields | Review[] | F03 |
| POST /reviews/:id/reply | save/send reply | owner | reply_text | Review | F03 |
| POST /ai/review-reply | draft reply | owner | review + tone + language | draft text | F03 |
| POST /ai/post | draft caption+hashtags | owner | type, topic, offer, language | draft | F04/F05 |
| POST /businesses/:id/posts | create draft/schedule/publish | owner | post fields | Post | F04/F05 |
| GET /templates | ready-to-share library | signed-in | occasion? | Template[] | F04 |
| GET /businesses/:id/keywords | keyword suggestions | owner | - | Keyword[] | F06 |
| POST /businesses/:id/competitors | add competitor | owner | competitor figures | Competitor | F06 |
| POST /support-tickets | raise ticket | owner | subject, message | Ticket | support |

Webhooks in (v2): Stripe/eSewa payment events (idempotent by event id);
Google/Meta have none needed for v1 scope. Webhooks out: none.
Jobs: `publish-due-posts` every 15 min (v2); `weekly-audit-refresh` Mondays.

## The parts that bite

- **Fake precision:** no invented search volumes, rankings or "AI scores" from
  nowhere. Every audit point traces to a check the user can see and fix.
- **GBP/Meta approval timelines:** weeks, outside our control - hence the
  simulated queue + manual share (download/copy) paths that work today.
- **AI hallucination:** template engine only slots user-typed facts; if an LLM
  is added later, outputs stay draft-only behind the approval gate.
- **Google spam policy:** keyword stuffing in business names gets listings
  suspended; keyword UI warns and only suggests description/services usage.
- **Time zones:** all times stored UTC (timestamptz / ISO strings), displayed
  in the business's local zone; scheduling uses the browser zone in v1.
- **Idempotency (v2 payments/publish):** publish and webhook handlers keyed by
  unique external ids; double-clicks on Publish are disabled in UI.
- **Festival calendars differ by country/religion:** templates are data, not
  code, so Nepal/India packs can be edited without deploys.

## Build order

1. **Vertical slice (implemented):** S01 landing -> S02 Supabase Auth -> S03 add business
   -> S05 audit -> S04 dashboard. Tables: profiles, businesses, audit_snapshots.
2. **Must-haves:** S06 reviews + AI replies; S07 studio + S08 library + S09
   planner + scheduler; S13 pricing/billing UI. Tables: reviews, posts, templates.
3. **Should-haves:** S10 keywords, S11 competitors, score trend, S14 support,
   multi-business, Nepali toggle, poster download.
4. **Entrepreneur fixes** are not a phase - they are constraints on 1-3
   (approval gate, transparent pricing, reachable support, manual-share paths).
5. **v2 integrations:** ~~Supabase swap-in~~ DONE 2026-10-20. Remaining: GBP API, Meta API, live payments.
