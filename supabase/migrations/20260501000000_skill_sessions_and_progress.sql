-- Skill sessions + node progress
-- This migration is designed for Supabase Postgres.

create extension if not exists "pgcrypto";

-- 1) Skill sessions (practice logs)
create table if not exists public.skill_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_subject text not null,
  occurred_at timestamptz not null default now(),
  duration_min int not null check (duration_min > 0),
  notes text,
  tags text[],
  benchmark_id text
);

create index if not exists skill_sessions_user_subject_occurred_at_idx
  on public.skill_sessions (user_id, skill_subject, occurred_at desc);

-- 2) Node progress (per benchmark)
create table if not exists public.skill_node_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_subject text not null,
  benchmark_id text not null,
  status text not null check (status in ('completed', 'in-progress', 'locked')),
  xp int not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, skill_subject, benchmark_id)
);

create index if not exists skill_node_progress_user_subject_idx
  on public.skill_node_progress (user_id, skill_subject);

-- RLS
alter table public.skill_sessions enable row level security;
alter table public.skill_node_progress enable row level security;

-- Policies: skill_sessions
drop policy if exists "skill_sessions_select_own" on public.skill_sessions;
create policy "skill_sessions_select_own"
  on public.skill_sessions
  for select
  using (user_id = auth.uid());

drop policy if exists "skill_sessions_insert_own" on public.skill_sessions;
create policy "skill_sessions_insert_own"
  on public.skill_sessions
  for insert
  with check (user_id = auth.uid());

drop policy if exists "skill_sessions_update_own" on public.skill_sessions;
create policy "skill_sessions_update_own"
  on public.skill_sessions
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "skill_sessions_delete_own" on public.skill_sessions;
create policy "skill_sessions_delete_own"
  on public.skill_sessions
  for delete
  using (user_id = auth.uid());

-- Policies: skill_node_progress
drop policy if exists "skill_node_progress_select_own" on public.skill_node_progress;
create policy "skill_node_progress_select_own"
  on public.skill_node_progress
  for select
  using (user_id = auth.uid());

drop policy if exists "skill_node_progress_insert_own" on public.skill_node_progress;
create policy "skill_node_progress_insert_own"
  on public.skill_node_progress
  for insert
  with check (user_id = auth.uid());

drop policy if exists "skill_node_progress_update_own" on public.skill_node_progress;
create policy "skill_node_progress_update_own"
  on public.skill_node_progress
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "skill_node_progress_delete_own" on public.skill_node_progress;
create policy "skill_node_progress_delete_own"
  on public.skill_node_progress
  for delete
  using (user_id = auth.uid());

