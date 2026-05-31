-- Multi-plan support
-- Removes the unique(user_id) constraint so users can have multiple plans.
-- Adds is_active boolean; enforces exactly-one-active via partial unique index + trigger.
-- Migrates existing rows to is_active = true (they are the only plan per user).

-- 1. Drop old unique constraint (idempotent)
alter table public.plans drop constraint if exists plans_user_id_unique;

-- 2. Add is_active column (idempotent)
alter table public.plans add column if not exists is_active boolean not null default false;

-- 3. Partial unique index: only one active plan per user
create unique index if not exists plans_one_active_per_user_idx
  on public.plans (user_id)
  where (is_active = true);

-- 4. Activate all existing plans (each user has exactly one today)
update public.plans set is_active = true where is_active = false;

-- 5. Trigger: activating a plan automatically deactivates all others for that user
create or replace function public.ensure_single_active_plan()
returns trigger language plpgsql as $$
begin
  if new.is_active = true and (old.is_active is distinct from true) then
    update public.plans
    set    is_active = false
    where  user_id = new.user_id
      and  id      != new.id
      and  is_active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists plans_ensure_single_active on public.plans;
create trigger plans_ensure_single_active
  before update on public.plans
  for each row execute procedure public.ensure_single_active_plan();
