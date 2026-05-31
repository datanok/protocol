-- Templates + Profiles
-- profiles: one row per user (public display name, bio)
-- templates: published plan snapshots; public reads allowed (is_public=true rows)

-- ============================================================
-- 1. profiles
-- ============================================================

create table if not exists public.profiles (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  username    text        not null unique,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_profiles_updated_at();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public"  on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select using (true);          -- all profiles are public

drop policy if exists "profiles_insert_own"      on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "profiles_update_own"      on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profiles_delete_own"      on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_username text;
  candidate     text;
  suffix        text;
  attempts      int := 0;
begin
  base_username := split_part(new.email, '@', 1);
  candidate     := base_username;

  -- Append random suffix if username is taken
  loop
    begin
      insert into public.profiles (user_id, username)
      values (new.id, candidate);
      return new;
    exception when unique_violation then
      attempts  := attempts + 1;
      suffix    := substr(md5(random()::text), 1, 4);
      candidate := base_username || '_' || suffix;
      if attempts > 10 then
        -- Fallback: use first 8 chars of UUID
        candidate := substr(replace(new.id::text, '-', ''), 1, 8);
        insert into public.profiles (user_id, username) values (new.id, candidate);
        return new;
      end if;
    end;
  end loop;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. templates
-- ============================================================

create table if not exists public.templates (
  id          uuid        primary key default gen_random_uuid(),
  author_id   uuid        not null references auth.users (id) on delete cascade,
  slug        text        not null unique,
  title       text        not null,
  description text,
  plan_json   jsonb       not null,
  fork_count  integer     not null default 0,
  is_public   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists templates_author_id_idx  on public.templates (author_id);
create index if not exists templates_fork_count_idx on public.templates (fork_count desc);
create index if not exists templates_created_at_idx on public.templates (created_at desc);
create index if not exists templates_slug_idx       on public.templates (slug);

create or replace function public.touch_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists templates_touch_updated_at on public.templates;
create trigger templates_touch_updated_at
  before update on public.templates
  for each row execute procedure public.touch_templates_updated_at();

-- Atomic fork-count increment (avoids read-modify-write race)
create or replace function public.increment_fork_count(p_template_id uuid)
returns void language sql security definer as $$
  update public.templates set fork_count = fork_count + 1 where id = p_template_id;
$$;

-- RLS
alter table public.templates enable row level security;

drop policy if exists "templates_select_public" on public.templates;
create policy "templates_select_public"
  on public.templates for select
  using (is_public = true or author_id = auth.uid());

drop policy if exists "templates_insert_own" on public.templates;
create policy "templates_insert_own"
  on public.templates for insert
  with check (author_id = auth.uid());

drop policy if exists "templates_update_own" on public.templates;
create policy "templates_update_own"
  on public.templates for update
  using  (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "templates_delete_own" on public.templates;
create policy "templates_delete_own"
  on public.templates for delete
  using (author_id = auth.uid());
