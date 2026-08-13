-- Run this once in Supabase Dashboard > SQL Editor.
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  class_name text not null check (char_length(class_name) between 1 and 20),
  score smallint not null check (score between 0 and 10),
  total smallint not null default 10 check (total = 10),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  level_scores jsonb not null default '[0,0,0]'::jsonb,
  completed_at timestamptz not null default now()
);

alter table public.game_results enable row level security;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admin_users enable row level security;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  level smallint not null check (level between 1 and 3),
  type text not null check (type in ('mcq', 'truefalse', 'fill', 'match', 'drag')),
  title text not null check (char_length(title) between 3 and 500),
  options jsonb,
  answer jsonb not null,
  explanation text not null default '',
  prefix text,
  suffix text,
  left_items jsonb,
  right_items jsonb,
  items jsonb,
  zones jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create or replace function public.is_game_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_game_admin() from public;
grant execute on function public.is_game_admin() to authenticated;

drop policy if exists "Anyone can read active questions" on public.questions;
drop policy if exists "Visitors can read active questions" on public.questions;
create policy "Visitors can read active questions"
  on public.questions for select to anon
  using (active = true);

drop policy if exists "Admins can read all questions" on public.questions;
create policy "Admins can read all questions"
  on public.questions for select to authenticated
  using (active = true or public.is_game_admin());

drop policy if exists "Admins can insert questions" on public.questions;
create policy "Admins can insert questions"
  on public.questions for insert to authenticated
  with check (public.is_game_admin());

drop policy if exists "Admins can update questions" on public.questions;
create policy "Admins can update questions"
  on public.questions for update to authenticated
  using (public.is_game_admin())
  with check (public.is_game_admin());

drop policy if exists "Admins can delete questions" on public.questions;
create policy "Admins can delete questions"
  on public.questions for delete to authenticated
  using (public.is_game_admin());

drop policy if exists "Anyone can submit a result" on public.game_results;
create policy "Anyone can submit a result"
  on public.game_results for insert to anon, authenticated
  with check (true);

drop policy if exists "Admins can view results" on public.game_results;
create policy "Admins can view results"
  on public.game_results for select to authenticated
  using (public.is_game_admin());

drop policy if exists "Admins can delete results" on public.game_results;
create policy "Admins can delete results"
  on public.game_results for delete to authenticated
  using (public.is_game_admin());

-- Create the admin account in Dashboard > Authentication > Users.
-- Then add it to the allowlist, replacing the email below:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'teacher@example.com';
