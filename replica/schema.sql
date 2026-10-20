-- DhandhaAi v2 schema (Postgres / Supabase). v1 ships with a local repository
-- that mirrors these tables 1:1 (see src/lib/types.ts).
-- Access: enable RLS on every table; policy = business owner only (example at bottom).

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  category text not null,
  city text not null,
  area text,
  address text,
  phone text,
  website text,
  description text,
  services text[] not null default '{}',
  hours jsonb not null default '{}',
  photo_count int not null default 0 check (photo_count >= 0),
  rating numeric(2,1) check (rating between 1 and 5),
  review_count int not null default 0 check (review_count >= 0),
  google_place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on businesses (owner_id);

create table audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  overall int not null check (overall between 0 and 100),
  gbp_score int not null check (gbp_score between 0 and 100),
  social_score int not null check (social_score between 0 and 100),
  review_score int not null check (review_score between 0 and 100),
  keyword_score int not null check (keyword_score between 0 and 100),
  checks jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on audits (business_id, created_at desc);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  text text not null default '',
  source text not null default 'google',
  reviewed_at timestamptz not null default now(),
  reply_text text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index on reviews (business_id, reviewed_at desc);

create table posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in ('social','google')),
  post_type text not null check (post_type in ('festival','offer','product','update','tip')),
  title text not null default '',
  caption text not null default '',
  hashtags text[] not null default '{}',
  image_theme text not null default 'emerald',
  channels text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index on posts (business_id, status, scheduled_at);

create table templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  occasion text not null,
  region text not null default 'all' check (region in ('nepal','india','all')),
  caption_pattern text not null,
  hashtags text[] not null default '{}',
  theme text not null default 'emerald'
);

create table keywords (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  term text not null,
  intent text not null default 'transactional',
  competition text not null default 'medium' check (competition in ('low','medium','high')),
  in_profile boolean not null default false
);
create index on keywords (business_id);

create table competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  rating numeric(2,1) check (rating between 1 and 5),
  review_count int not null default 0,
  photo_count int not null default 0,
  posts_per_month int not null default 0
);
create index on competitors (business_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan text not null check (plan in ('free','growth','pro')),
  price_cents int not null default 0,
  currency text not null default 'NPR',
  status text not null default 'active' check (status in ('active','cancelled','past_due')),
  renews_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_active_sub on subscriptions (user_id) where status = 'active';

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create index on support_tickets (user_id, created_at desc);

-- RLS example (repeat per business-owned table via a helper):
-- alter table businesses enable row level security;
-- create policy owner_all on businesses
--   for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
