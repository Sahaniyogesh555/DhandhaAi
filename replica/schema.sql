-- DhandhaAi final Supabase schema.
-- These files reproduce migrations already applied to the project:
-- 20261020152003_init_dhandhaai_schema.sql, then 20261020154127_lock_profile_plan.sql.
-- Initial DhandhaAi Supabase schema (Postgres 17).
-- Auth users are in auth.users; all app data is protected by RLS.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text,
  plan text not null default 'free' check (plan in ('free','growth','pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  city text not null,
  area text not null default '',
  address text not null default '',
  phone text not null default '',
  website text not null default '',
  description text not null default '',
  services text[] not null default '{}',
  hours jsonb not null default '{}',
  photo_count int not null default 0 check (photo_count >= 0),
  google_connected boolean not null default false,
  facebook_connected boolean not null default false,
  instagram_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses (owner_id);
create trigger businesses_touch before update on public.businesses
for each row execute function public.touch_updated_at();
alter table public.businesses enable row level security;
create policy businesses_all_own on public.businesses for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.owns_business(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid());
$$;

grant select, insert, update, delete on public.businesses to authenticated;
grant execute on function public.owns_business(uuid) to authenticated;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  text text not null default '',
  reviewed_at timestamptz not null default now(),
  reply_text text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_business_idx on public.reviews (business_id, reviewed_at desc);
alter table public.reviews enable row level security;
create policy reviews_all_own on public.reviews for all to authenticated
using (public.owns_business(business_id)) with check (public.owns_business(business_id));
grant select, insert, update, delete on public.reviews to authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('social','google')),
  post_type text not null check (post_type in ('festival','offer','product','update','tip')),
  headline text not null default '',
  caption text not null default '',
  hashtags text[] not null default '{}',
  image_theme text not null default 'emerald',
  channels text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index posts_business_idx on public.posts (business_id, status, scheduled_at);
alter table public.posts enable row level security;
create policy posts_all_own on public.posts for all to authenticated
using (public.owns_business(business_id)) with check (public.owns_business(business_id));
grant select, insert, update, delete on public.posts to authenticated;

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  rating numeric(2,1) check (rating between 1 and 5),
  review_count int not null default 0 check (review_count >= 0),
  photo_count int not null default 0 check (photo_count >= 0),
  posts_per_month int not null default 0 check (posts_per_month >= 0),
  created_at timestamptz not null default now()
);
create index competitors_business_idx on public.competitors (business_id);
alter table public.competitors enable row level security;
create policy competitors_all_own on public.competitors for all to authenticated
using (public.owns_business(business_id)) with check (public.owns_business(business_id));
grant select, insert, update, delete on public.competitors to authenticated;

create table public.audit_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  overall int not null check (overall between 0 and 100),
  gbp_score int check (gbp_score between 0 and 100),
  review_score int check (review_score between 0 and 100),
  social_score int check (social_score between 0 and 100),
  keyword_score int check (keyword_score between 0 and 100),
  checks jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index audit_snapshots_business_idx on public.audit_snapshots (business_id, created_at desc);
alter table public.audit_snapshots enable row level security;
create policy audit_snapshots_all_own on public.audit_snapshots for all to authenticated
using (public.owns_business(business_id)) with check (public.owns_business(business_id));
grant select, insert, update, delete on public.audit_snapshots to authenticated;

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  term text not null,
  intent text not null default 'transactional',
  competition text not null default 'medium' check (competition in ('low','medium','high')),
  in_profile boolean not null default false,
  created_at timestamptz not null default now()
);
create index keywords_business_idx on public.keywords (business_id);
alter table public.keywords enable row level security;
create policy keywords_all_own on public.keywords for all to authenticated
using (public.owns_business(business_id)) with check (public.owns_business(business_id));
grant select, insert, update, delete on public.keywords to authenticated;

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  occasion text not null,
  region text not null default 'all' check (region in ('nepal','india','all')),
  caption_pattern text not null default '',
  hashtags text[] not null default '{}',
  theme text not null default 'emerald',
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
create policy templates_read_authenticated on public.templates for select to authenticated using (true);
grant select on public.templates to authenticated;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free','growth','pro')),
  price_cents int not null default 0,
  currency text not null default 'NPR',
  status text not null default 'active' check (status in ('active','cancelled','past_due')),
  provider text,
  provider_ref text,
  renews_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_active_sub on public.subscriptions (user_id) where status = 'active';
alter table public.subscriptions enable row level security;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = auth.uid());
grant select on public.subscriptions to authenticated;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
alter table public.support_tickets enable row level security;
create policy support_tickets_own on public.support_tickets for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.support_tickets to authenticated;

-- Only trusted server-side payment handling may grant a paid plan.
-- Browser users can read their profile, but cannot insert/update a plan.
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
