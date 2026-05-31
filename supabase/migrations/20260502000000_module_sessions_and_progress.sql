-- Module sessions + node progress (module-based architecture)
-- Generalises skill_sessions/skill_node_progress to any module type.
-- The old tables are kept for backward-compatibility; this migration
-- adds the new tables alongside them.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1) module_sessions
--    One row per practice/work session on any module.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.module_sessions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  -- which plan module this session belongs to
  module_id     text        not null,   -- matches PlanModule.id
  module_type   text        not null,   -- 'workout' | 'skill' | 'study' | 'nutrition'
  -- optional node/benchmark reference inside the module
  node_id       text,                   -- matches ModuleNode.id (nullable)
  occurred_at   timestamptz not null default now(),
  duration_min  int         not null check (duration_min > 0),
  -- flexible metric value — stored as numeric, interpreted per module type
  -- e.g. BPM achieved, confidence rating, sets completed
  metric_value  numeric,
  notes         text,
  tags          text[]
);

create index if not exists module_sessions_user_module_idx
  on public.module_sessions (user_id, module_id, occurred_at desc);

create index if not exists module_sessions_user_type_idx
  on public.module_sessions (user_id, module_type, occurred_at desc);

-- ─────────────────────────────────────────────────────────────
-- 2) module_node_progress
--    One row per (user, module, node) — tracks node status + XP.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.module_node_progress (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  module_id     text        not null,   -- matches PlanModule.id
  node_id       text        not null,   -- matches ModuleNode.id
  module_type   text        not null,   -- 'skill' | 'study' (workout nodes don't have progress rows)
  -- status vocabulary is a superset of all module types:
  --   skill:  locked → in-progress → clean
  --   study:  locked → read → summarized → built-poc → mastered
  --   shared: locked / in-progress / completed (generic fallback)
  status        text        not null default 'locked',
  xp            int         not null default 0 check (xp >= 0),
  best_metric   numeric,                -- best recorded metric_value (e.g. highest BPM, max confidence)
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (user_id, module_id, node_id)
);

create index if not exists module_node_progress_user_module_idx
  on public.module_node_progress (user_id, module_id);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.module_sessions       enable row level security;
alter table public.module_node_progress  enable row level security;

-- module_sessions policies
drop policy if exists "module_sessions_select_own" on public.module_sessions;
create policy "module_sessions_select_own"
  on public.module_sessions for select
  using (user_id = auth.uid());

drop policy if exists "module_sessions_insert_own" on public.module_sessions;
create policy "module_sessions_insert_own"
  on public.module_sessions for insert
  with check (user_id = auth.uid());

drop policy if exists "module_sessions_update_own" on public.module_sessions;
create policy "module_sessions_update_own"
  on public.module_sessions for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "module_sessions_delete_own" on public.module_sessions;
create policy "module_sessions_delete_own"
  on public.module_sessions for delete
  using (user_id = auth.uid());

-- module_node_progress policies
drop policy if exists "module_node_progress_select_own" on public.module_node_progress;
create policy "module_node_progress_select_own"
  on public.module_node_progress for select
  using (user_id = auth.uid());

drop policy if exists "module_node_progress_insert_own" on public.module_node_progress;
create policy "module_node_progress_insert_own"
  on public.module_node_progress for insert
  with check (user_id = auth.uid());

drop policy if exists "module_node_progress_update_own" on public.module_node_progress;
create policy "module_node_progress_update_own"
  on public.module_node_progress for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "module_node_progress_delete_own" on public.module_node_progress;
create policy "module_node_progress_delete_own"
  on public.module_node_progress for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3) updated_at auto-refresh trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists module_node_progress_touch on public.module_node_progress;
create trigger module_node_progress_touch
  before update on public.module_node_progress
  for each row execute procedure public.touch_updated_at();
