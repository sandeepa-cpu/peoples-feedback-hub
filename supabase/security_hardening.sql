-- Close public read/write on feedbacks. Service role still bypasses RLS.
-- Run once in the Supabase SQL editor after deploying the server feedback route.

drop policy if exists "feedbacks_anon_select" on public.feedbacks;
drop policy if exists "feedbacks_anon_insert" on public.feedbacks;
