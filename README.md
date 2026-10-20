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
npm run dev        # http://localhost:5173  (try "Explore the demo cafe")
npm test           # 25 engine tests (audit scoring + AI drafting rules)
npm run build      # typecheck + production bundle in dist/
```

Stack: Vite + React + TypeScript + Tailwind v4, Lucide icons. v1 keeps data in
the browser (localStorage) behind a repository seam; the Postgres/Supabase
schema for v2 is in `replica/schema.sql`.

## What's inside

| Area | Working today |
| --- | --- |
| Landing | Interactive free score checker, features, honest pricing (Free / रू999 / रू1,999), FAQ |
| Audit | 4-factor score (Google profile 40% · reviews 25% · social 20% · keywords 15%), 17 checks, each with impact points and a Fix path; re-scores instantly |
| Reviews | Inbox with filters, AI reply drafts (warm/professional/short × English/नेपाली/हिंदी), 1-star de-escalation, copy-for-Google |
| Studio | Festival/offer/product/update/tip posts, poster generator (1080×1080 PNG download), FB/IG/Google previews, approve → publish/schedule (simulated queue), plan quotas |
| Library | 14 ready templates localised for Nepal (Dashain, Tihar, Teej…) + India + everyday |
| Growth | Keyword coverage checker with anti-spam guidance, competitor comparison table with gap advice |
| Trust | Public pricing, cancel-anytime promises, in-app support tickets with visible status - fixes for the original's top review complaints (see `replica/entrepreneur.md`) |

The AI drafting engine is deterministic templates over facts the owner types,
so it **cannot invent products, prices or claims**. Swapping in an LLM later
keeps the same approval gate.

## Replica working files (`replica/`)

`recon.md` (14 screens, 7 flows, data model) · `features.csv` (matrix) ·
`architecture.md` + `schema.sql` · `design/tokens.json` (WCAG-checked) ·
`reviews.csv` + `feedback.md` + `entrepreneur.md` (6 verbatim public reviews -
small sample, flagged as such) · `test-plan.md` · `diff.md` · `brand.md` ·
`launch/listing.json` (store listing, lint-clean).

## Next steps to sell it (owner actions)

1. **Name clearance:** "DhandhaAi" is close to the original's name - run the
   trademark/domain checks in `replica/brand.md` before charging money.
2. **Backend:** enable Supabase (or Neon) and swap the local repository for the
   API in `replica/architecture.md`; move auth to Supabase Auth.
3. **Real publishing:** register your OWN Google Business Profile API and Meta
   apps; approvals take weeks - start now. Until then download/copy sharing works.
4. **Payments:** connect your own eSewa/Khalti/Stripe account in Billing.
5. Manual browser pass through `replica/test-plan.md`, then deploy `dist/` to
   Vercel/Netlify on your domain.

## Installed skills

The 11-skill [Replica pack](https://github.com/Jakeschincariol/replica-skill)
(MIT) lives in `.claude/skills/` - `/replica-recon` → `/replica-deploy`.
This build ran recon → architect → design → build → entrepreneur → test → diff
→ brand → launch in that order.
