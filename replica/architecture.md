# Architecture: DhandhaAi (a rebuild of Dhanda AI's core features)

Reads: replica/recon.md, replica/features.csv, replica/entrepreneur.md

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite + React 18 + TypeScript (SPA, mobile-first) | Ships today as a live web app; same component model later ports to Next.js/Expo. No SSR needed for an authenticated tool; landing page is static in the same bundle. |
| styling | Tailwind CSS v4 with tokens from replica/design/tokens.json | Role-based tokens (bg/surface/accent) so replica-brand only swaps values. |
| state/data (v1) | Typed local repository over localStorage (`src/lib/store.ts`) behind a Repository interface | Zero-keys demo that fully works offline; the interface is the seam where the Postgres API drops in without UI rewrites. |
| database (v2) | Postgres on Supabase (schema in replica/schema.sql) | Managed, RLS for per-user isolation, free at zero users. Supabase connector is available in-workspace when the owner enables it. |
| auth | v1: local email/password (hashed with WebCrypto, demo-labelled). v2: Supabase Auth | Never roll production auth by hand; v1 is explicitly a demo gate. |
| AI generation | Deterministic template engine (`src/lib/ai.ts`) using ONLY user-entered business facts; interface allows swapping to an LLM API (owner's own key) | Direct fix for the original's "AI invented wrong product facts" failure: our engine cannot invent facts, and every output needs human approval. |
| payments | v1: plan selection UI only. v2: Stripe and/or eSewa/Khalti (owner's keys) | Money only moves with the owner's own merchant accounts. |
| integrations | Google Business Profile API + Meta Graph API - official, owner's own apps/keys; v1 uses a simulated publish queue with honest "simulated" labels | GBP API is approval-gated by Google; Meta publishing needs app review. No private APIs, ever. |
| jobs | Browser-side scheduler check on load (v1); Supabase scheduled functions / Vercel Cron (v2) | Scheduled posts flip to "due" then publish via queue. |
| hosting | Any static host (Vercel/Netlify) - `npm run build` | Boring and cheap. |

One database, no microservices. The clone needs the original's FEATURES, not its architecture.

## Schema

Tables: 10 (see replica/schema.sql). Access rules (v2): Postgres row-level
security - every business-owned row checks `business.owner_id = auth.uid()`.
v1 equivalent: repository filters every read/write by current user id.

Hard constraints encoded: rating 1-5 checks; post status enum; audit factor
scores 0-100; one active subscription per user; scheduled_at must be future
for status=scheduled (app-level + check constraint on publish).

## API (v2 shape; v1 repository mirrors these 1:1)

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

1. **Vertical slice (this build):** S01 landing -> S02 auth -> S03 add business
   -> S05 audit -> S04 dashboard. Tables: users, businesses, audits.
2. **Must-haves:** S06 reviews + AI replies; S07 studio + S08 library + S09
   planner + scheduler; S13 pricing/billing UI. Tables: reviews, posts, templates.
3. **Should-haves:** S10 keywords, S11 competitors, score trend, S14 support,
   multi-business, Nepali toggle, poster download.
4. **Entrepreneur fixes** are not a phase - they are constraints on 1-3
   (approval gate, transparent pricing, reachable support, manual-share paths).
5. **v2 integrations:** Supabase swap-in, GBP API, Meta API, live payments.
