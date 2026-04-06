-- P1.6 / P1.7: Family-scoped categories with RLS + idempotent seed (mirrors src/lib/constants.ts)
-- Apply via Supabase SQL editor, CLI, or MCP `apply_migration`.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  name text not null,
  kind text not null check (kind in ('INCOME', 'EXPENSE')),
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint categories_family_kind_name_unique unique (family_id, kind, name)
);

create index if not exists categories_family_id_kind_idx on public.categories (family_id, kind);

comment on table public.categories is 'Per-family income/expense labels for transactions; transactions.category stores denormalized name at save time.';

alter table public.categories enable row level security;

create policy "categories_select_own_family" on public.categories
  for select using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "categories_insert_own_family" on public.categories
  for insert with check (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "categories_update_own_family" on public.categories
  for update using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  )
  with check (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

-- Idempotent seed for existing and future families (VALUES must stay in sync with categorySeed.ts / constants.ts)
insert into public.categories (family_id, name, kind, sort_order)
select f.family_id, s.name, s.kind, s.sort_order
from (select distinct family_id from public.profiles) f
cross join (
  values
    ('Housing', 'EXPENSE', 0),
    ('Food & Dining', 'EXPENSE', 1),
    ('Transportation', 'EXPENSE', 2),
    ('Utilities', 'EXPENSE', 3),
    ('Insurance', 'EXPENSE', 4),
    ('Healthcare', 'EXPENSE', 5),
    ('Education', 'EXPENSE', 6),
    ('Business Expense', 'EXPENSE', 7),
    ('Tax Payment', 'EXPENSE', 8),
    ('Investment Deposit', 'EXPENSE', 9),
    ('Ma''aser', 'EXPENSE', 10),
    ('Savings', 'EXPENSE', 11),
    ('Other', 'EXPENSE', 12),
    ('Yitzchak 1', 'INCOME', 0),
    ('Yitzchak 2', 'INCOME', 1),
    ('Kollel', 'INCOME', 2),
    ('Family Support', 'INCOME', 3),
    ('Kitzvat Yelidim', 'INCOME', 4),
    ('beErech studio', 'INCOME', 5),
    ('Dollar Income', 'INCOME', 6),
    ('Gift Maaser', 'INCOME', 7),
    ('Investments', 'INCOME', 8),
    ('Other', 'INCOME', 9)
) as s(name, kind, sort_order)
on conflict (family_id, kind, name) do nothing;

-- New profiles: seed defaults when a row is inserted (signup / invite flow)
create or replace function public.seed_default_categories_for_family(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (family_id, name, kind, sort_order)
  select p_family_id, s.name, s.kind, s.sort_order
  from (
    values
    ('Housing', 'EXPENSE', 0),
    ('Food & Dining', 'EXPENSE', 1),
    ('Transportation', 'EXPENSE', 2),
    ('Utilities', 'EXPENSE', 3),
    ('Insurance', 'EXPENSE', 4),
    ('Healthcare', 'EXPENSE', 5),
    ('Education', 'EXPENSE', 6),
    ('Business Expense', 'EXPENSE', 7),
    ('Tax Payment', 'EXPENSE', 8),
    ('Investment Deposit', 'EXPENSE', 9),
    ('Ma''aser', 'EXPENSE', 10),
    ('Savings', 'EXPENSE', 11),
    ('Other', 'EXPENSE', 12),
    ('Yitzchak 1', 'INCOME', 0),
    ('Yitzchak 2', 'INCOME', 1),
    ('Kollel', 'INCOME', 2),
    ('Family Support', 'INCOME', 3),
    ('Kitzvat Yelidim', 'INCOME', 4),
    ('beErech studio', 'INCOME', 5),
    ('Dollar Income', 'INCOME', 6),
    ('Gift Maaser', 'INCOME', 7),
    ('Investments', 'INCOME', 8),
    ('Other', 'INCOME', 9)
  ) as s(name, kind, sort_order)
  on conflict (family_id, kind, name) do nothing;
end;
$$;

create or replace function public.trg_profiles_seed_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories_for_family(new.family_id);
  return new;
end;
$$;

drop trigger if exists trg_profiles_seed_categories on public.profiles;
create trigger trg_profiles_seed_categories
  after insert on public.profiles
  for each row
  execute procedure public.trg_profiles_seed_categories();
