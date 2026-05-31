-- daily_commits + visual_logs tables
-- daily_commits: one row per user per day; stores which habit IDs were completed.
--   Composite unique on (user_id, date) enables upsert with onConflict:'user_id,date'.
-- visual_logs: one row per progress photo / visual check-in uploaded by the user.

-- ============================================================
-- 1. daily_commits
-- ============================================================

create table if not exists public.daily_commits (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  date              text        not null,           -- YYYY-MM-DD, stored as text for simplicity
  completed_habits  text[]      not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists daily_commits_user_id_idx on public.daily_commits (user_id);
create index if not exists daily_commits_date_idx    on public.daily_commits (date);

-- Composite unique required for upsert onConflict:'user_id,date'
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_commits'::regclass
      and contype  = 'u'
      and conname  = 'daily_commits_user_id_date_unique'
  ) then
    alter table public.daily_commits
      add constraint daily_commits_user_id_date_unique unique (user_id, date);
  end if;
end;
$$;

-- Auto-refresh updated_at
create or replace function public.touch_daily_commits_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_commits_touch_updated_at on public.daily_commits;
create trigger daily_commits_touch_updated_at
  before update on public.daily_commits
  for each row execute procedure public.touch_daily_commits_updated_at();

-- RLS
alter table public.daily_commits enable row level security;

drop policy if exists "daily_commits_select_own" on public.daily_commits;
create policy "daily_commits_select_own"
  on public.daily_commits for select
  using (user_id = auth.uid());

drop policy if exists "daily_commits_insert_own" on public.daily_commits;
create policy "daily_commits_insert_own"
  on public.daily_commits for insert
  with check (user_id = auth.uid());

drop policy if exists "daily_commits_update_own" on public.daily_commits;
create policy "daily_commits_update_own"
  on public.daily_commits for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "daily_commits_delete_own" on public.daily_commits;
create policy "daily_commits_delete_own"
  on public.daily_commits for delete
  using (user_id = auth.uid());


-- ============================================================
-- 2. visual_logs
-- ============================================================

create table if not exists public.visual_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  image_url   text,                                -- nullable: set after Supabase Storage upload
  created_at  timestamptz not null default now()
);

create index if not exists visual_logs_user_id_idx    on public.visual_logs (user_id);
create index if not exists visual_logs_created_at_idx on public.visual_logs (created_at desc);

-- RLS
alter table public.visual_logs enable row level security;

drop policy if exists "visual_logs_select_own" on public.visual_logs;
create policy "visual_logs_select_own"
  on public.visual_logs for select
  using (user_id = auth.uid());

drop policy if exists "visual_logs_insert_own" on public.visual_logs;
create policy "visual_logs_insert_own"
  on public.visual_logs for insert
  with check (user_id = auth.uid());

drop policy if exists "visual_logs_update_own" on public.visual_logs;
create policy "visual_logs_update_own"
  on public.visual_logs for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "visual_logs_delete_own" on public.visual_logs;
create policy "visual_logs_delete_own"
  on public.visual_logs for delete
  using (user_id = auth.uid());
