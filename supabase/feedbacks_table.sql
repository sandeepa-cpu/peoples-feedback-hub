-- Minimal `feedbacks` table matching: supabase.from('feedbacks').insert([{ rating, message }])

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating integer not null check (rating >= 1 and rating <= 5),
  message text not null default ''
);

alter table public.feedbacks enable row level security;

create policy "feedbacks_anon_insert" on public.feedbacks
  for insert to anon
  with check (true);

create policy "feedbacks_anon_select" on public.feedbacks
  for select to anon
  using (true);
