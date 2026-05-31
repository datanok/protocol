-- Plans table
-- Creates the table if it doesn't exist, then idempotently adds the
-- unique constraint on user_id (required for future upsert support).

create extension if not exists "pgcrypto";

-- Create table only if it doesn't already exist
create table if not exists public.plans (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  plan_json   jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id);

-- Add unique constraint if it doesn't exist yet
-- (safe to run even if the table was created without it)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.plans'::regclass
      and contype = 'u'
      and conname = 'plans_user_id_unique'
  ) then
    alter table public.plans add constraint plans_user_id_unique unique (user_id);
  end if;
end;
$$;

-- Auto-refresh updated_at on every update
create or replace function public.touch_plans_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute procedure public.touch_plans_updated_at();

-- RLS
alter table public.plans enable row level security;

drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own"
  on public.plans for select
  using (user_id = auth.uid());

drop policy if exists "plans_insert_own" on public.plans;
create policy "plans_insert_own"
  on public.plans for insert
  with check (user_id = auth.uid());

drop policy if exists "plans_update_own" on public.plans;
create policy "plans_update_own"
  on public.plans for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "plans_delete_own" on public.plans;
create policy "plans_delete_own"
  on public.plans for delete
  using (user_id = auth.uid());
