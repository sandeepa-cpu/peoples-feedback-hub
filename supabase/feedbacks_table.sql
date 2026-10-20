-- `feedbacks` table — aligns with feedback form inserts in app/page.tsx

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating integer not null check (rating >= 1 and rating <= 5),
  message text not null default '',
  name text,
  phone_number text,
  item_category text,
  service_type text,
  shop_location text,
  quick_tags text
);

-- Existing projects created from an older snippet: run any missing ADD COLUMN lines once.

-- alter table public.feedbacks add column name text;
-- alter table public.feedbacks add column phone_number text;
-- alter table public.feedbacks add column item_category text;
-- alter table public.feedbacks add column service_type text;
-- alter table public.feedbacks add column shop_location text;
-- alter table public.feedbacks add column quick_tags text;

alter table public.feedbacks enable row level security;

-- No anon policies. The app inserts and reads through the service role.
-- Existing projects: run supabase/security_hardening.sql once.
