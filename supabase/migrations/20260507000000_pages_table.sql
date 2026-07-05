-- Pages table — freeform blocks (text/checklist/table/tracker), independent
-- of the plans table. No relationship to the one-active-plan trigger:
-- pages persist across plan switches.

create extension if not exists "pgcrypto";

create table if not exists public.pages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  icon        text,
  blocks      jsonb       not null default '[]'::jsonb,
  order_idx   int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pages_user_id_idx on public.pages (user_id);

-- Auto-refresh updated_at on every update
create or replace function public.touch_pages_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute procedure public.touch_pages_updated_at();

-- RLS
alter table public.pages enable row level security;

drop policy if exists "pages_select_own" on public.pages;
create policy "pages_select_own"
  on public.pages for select
  using (user_id = auth.uid());

drop policy if exists "pages_insert_own" on public.pages;
create policy "pages_insert_own"
  on public.pages for insert
  with check (user_id = auth.uid());

drop policy if exists "pages_update_own" on public.pages;
create policy "pages_update_own"
  on public.pages for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pages_delete_own" on public.pages;
create policy "pages_delete_own"
  on public.pages for delete
  using (user_id = auth.uid());
