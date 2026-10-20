-- Extra admin logins. Service role only; anon has no policies.

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  password_hash text not null
);

alter table public.admin_accounts enable row level security;
