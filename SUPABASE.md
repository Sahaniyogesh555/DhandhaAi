# Supabase runbook — DhandhaAi

Backend migration completed on 2026-10-20. The app now uses Supabase Auth and
Postgres instead of its local demo login/data store.

## Project

| Setting | Value |
| --- | --- |
| Project | DhandhaAi (`jbckbwmdrrjruznaevjh`) |
| Region | ap-south-1 (Mumbai) |
| API URL | `https://jbckbwmdrrjruznaevjh.supabase.co` |
| Database | Postgres 17; Free plan during development |
| Dashboard | <https://supabase.com/dashboard/project/jbckbwmdrrjruznaevjh> |
| Schema | `supabase/migrations/` (also assembled in `replica/schema.sql`) |

The free plan is for development; it can pause after inactivity. Upgrade before
customer traffic, and review current Supabase limits/pricing in the dashboard.

## Client integration

- `src/lib/supabase.ts` initializes the browser client. Configure
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` or
  Vercel; a public project URL/key fallback is present for this project.
- Publishable/anon keys are designed for browser use. **Never** expose the
  `service_role` / `sb_secret` key or database password in `VITE_` variables,
  source code, or Git. RLS—not key secrecy—protects user data.
- `src/lib/db.ts` maps Postgres snake_case rows to app types.
  `src/lib/store.ts` restores Auth sessions, loads RLS-visible rows, updates an
  in-memory optimistic cache, then upserts/deletes changed records. Sync errors
  are shown in the app rather than silently discarded.
- Client writes cover businesses, reviews, posts, competitors, audit snapshots,
  and support tickets. The client cannot update profile plans or subscriptions;
  billing must be verified on a trusted server before a paid plan is granted.
- Old browser-only localStorage accounts/data are not automatically imported;
  password hashes from the demo build are not production credentials. Users
  should sign up again. The localStorage code is retained only as a development
  fallback if the Supabase client is removed.

## Tables and access controls

Ten public tables have RLS enabled: `profiles`, `businesses`, `reviews`, `posts`,
`competitors`, `audit_snapshots`, `keywords`, `templates`, `subscriptions`, and
`support_tickets`.

- `profiles`: a trigger creates a profile after Auth signup. Signed-in users
  may read only their own profile; direct browser insert/update/delete is
  revoked so a user cannot promote their own plan.
- `businesses`: owner-only (`owner_id = auth.uid()`).
- Business child tables (reviews, posts, competitors, snapshots, keywords):
  access only through `public.owns_business(business_id)`.
- `subscriptions` and `support_tickets`: user-owned rows only; subscriptions
  are read-only to the browser.
- `templates`: signed-in read-only catalogue; the current UI still uses its
  bundled catalogue.

Verified against the live project: all 10 tables have RLS enabled; a test owner
can read their generated profile and create their own business; profile update
privilege is false; a different owner cannot see the first owner's business.
Tests were wrapped in `BEGIN`/`ROLLBACK`; they leave no test users or data.

## Demo and Auth settings

- Signup/login use Supabase Auth email/password; passwords are never stored in
  app tables. Auth session restoration is enabled.
- `mailer_autoconfirm` is currently ON to make development signup usable before
  custom email delivery is configured. **Before public launch:** set up custom
  SMTP, turn auto-confirm OFF, and test confirmation/password-reset emails.
- Auth Site URL is currently `http://localhost:5173`; redirect allow-list covers
  localhost, the Arena preview, and `*.vercel.app`. Add the production domain
  in Supabase Auth → URL Configuration before deploy.
- “Explore the demo cafe” uses a shared, deliberately public demo account and
  fictional Kathmandu sample data. The workspace is shared/editable, never a
  real business. Do not use that account pattern for customers.

## Deployment

Vercel → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://jbckbwmdrrjruznaevjh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_HrBb24xsClSIvAwVDrZmbw_DUU3Lxl6
```

Then add the Vercel custom domain to Supabase Auth URL Configuration. A public
publishable key may be committed; the database password and secret/service
keys must not be.

## Schema changes

Create timestamped SQL files under `supabase/migrations/`. Apply each migration
to the project, then update `src/lib/types.ts` and `src/lib/db.ts` together.
Every new public table must have RLS enabled and explicit policies before it is
used from the browser. The current schema is also documented in
`replica/architecture.md` and `replica/schema.sql`.

## Still simulated

Google Business Profile/Meta publishing, scheduled auto-publishing, and payment
checkout remain simulations. They need owner-managed platform approvals,
server-side job handlers, and merchant accounts; do not advertise them as live.
