# DhandhaAi

Self-serve AI marketing for local businesses: a free Google Business Profile
score audit, AI review replies, festival/offer social posts with downloadable
posters, weekly Google updates, local keyword checks and competitor watch.
Nothing ever posts without the owner's approval.

This app is a clean-room rebuild of the **core features** of a popular Indian
local-marketing app, built with the Replica skill pack (see `.claude/skills/`
and the full working in `replica/`). Features and UX patterns were rebuilt from
public store listings; no original code, copy, images or private APIs were used.
Parity score: **93.5/100, all 12 must-haves done** (`replica/diff.md`).

## Run it

```bash
npm install
cp .env.example .env.local  # public Supabase URL + publishable client key
npm run dev                 # http://localhost:5173 (try "Explore the demo cafe")
npm test                    # 25 engine tests (audit scoring + AI drafting rules)
npm run build               # typecheck + production bundle in dist/
```

Stack: Vite + React + TypeScript + Tailwind v4, Lucide icons, and **Supabase**
(Postgres 17 + Auth, Mumbai region). Account and business data now live in
Postgres behind Row Level Security. The client keeps an optimistic cache and
syncs changes in the background; failed syncs are surfaced in the app. See
[`SUPABASE.md`](SUPABASE.md) for project details, security rules, and deployment
configuration. The publishable client key is public by design; never ship a
`service_role` / `sb_secret` key or the database password.

## What's inside

| Area | Working today |
| --- | --- |
| Landing | Interactive free score checker, features, honest pricing (Free / रू999 / रू1,999), FAQ |
| Auth | Real Supabase email/password accounts and restored sessions; shared sample cafe demo |
| Audit | 4-factor score (Google profile 40% · reviews 25% · social 20% · keywords 15%), 17 checks, each with impact points and a Fix path; re-scores instantly |
| Reviews | Inbox with filters, AI reply drafts (warm/professional/short × English/नेपाली/हिंदी), 1-star de-escalation, copy-for-Google |
| Studio | Festival/offer/product/update/tip posts, poster generator (1080×1080 PNG download), FB/IG/Google previews, approve → publish/schedule (simulated queue), plan quotas |
| Library | 14 ready templates localised for Nepal (Dashain, Tihar, Teej…) + India + everyday |
| Growth | Keyword coverage checker with anti-spam guidance, competitor comparison table with gap advice |
| Trust | Public pricing, cancel-anytime promises, in-app support tickets with visible status - fixes for the original's top review complaints (see `replica/entrepreneur.md`) |

The AI drafting engine is deterministic templates over facts the owner types,
so it **cannot invent products, prices or claims**. Swapping in an LLM later
keeps the same approval gate. Real GBP/Meta publishing and payment checkout
remain simulations until the owner registers their own developer apps and
merchant accounts. Plan selection in the current Billing UI is demo-only; a
paid plan cannot be granted by changing a browser profile.

## Replica working files (`replica/`)

`recon.md` (14 screens, 7 flows, data model) · `features.csv` (matrix) ·
`architecture.md` + `schema.sql` · `design/tokens.json` (WCAG-checked) ·
`reviews.csv` + `feedback.md` + `entrepreneur.md` (6 verbatim public reviews -
small sample, flagged as such) · `test-plan.md` · `diff.md` · `brand.md` ·
`launch/listing.json` (store listing, lint-clean).

## Owner actions before public launch

1. **Name clearance:** "DhandhaAi" is close to the original's name - run the
   trademark/domain checks in `replica/brand.md` before charging money.
2. **Email hardening:** Configure custom SMTP, turn off Auth auto-confirm, and
   set the Supabase Auth Site URL/redirect allow-list to your production domain.
3. **Real publishing:** Register your OWN Google Business Profile API and Meta
   apps; approvals take weeks - start now. Until then download/copy sharing works.
4. **Payments:** Connect your own eSewa/Khalti/Stripe account; implement
   server-verified webhook handling before unlocking a paid plan.
5. Manual browser pass through `replica/test-plan.md`, upgrade Supabase before
   customer traffic (the free project may pause after inactivity), and deploy
   `dist/` to Vercel/Netlify on your domain.

## Installed skills

The 11-skill [Replica pack](https://github.com/Jakeschincariol/replica-skill)
(MIT) lives in `.claude/skills/` - `/replica-recon` → `/replica-deploy`.
This build ran recon → architect → design → build → entrepreneur → test → diff
→ brand → launch in that order.
