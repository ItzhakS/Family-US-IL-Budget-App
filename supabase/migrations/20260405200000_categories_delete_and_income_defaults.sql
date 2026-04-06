-- DELETE RLS for categories; additive insert of new default income labels; refresh seed helper for new profiles.

create policy "categories_delete_own_family" on public.categories
  for delete using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

-- Income presets aligned with src/lib/constants.ts (existing rows unchanged; new names merged per family)
insert into public.categories (family_id, name, kind, sort_order)
select f.family_id, s.name, s.kind, s.sort_order
from (select distinct family_id from public.profiles) f
cross join (
  values
    ('Salary 1', 'INCOME', 0),
    ('Salary 2', 'INCOME', 1),
    ('Investments', 'INCOME', 2),
    ('Gifts', 'INCOME', 3),
    ('Other', 'INCOME', 4)
) as s(name, kind, sort_order)
on conflict (family_id, kind, name) do nothing;

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
      ('Salary 1', 'INCOME', 0),
      ('Salary 2', 'INCOME', 1),
      ('Investments', 'INCOME', 2),
      ('Gifts', 'INCOME', 3),
      ('Other', 'INCOME', 4)
  ) as s(name, kind, sort_order)
  on conflict (family_id, kind, name) do nothing;
end;
$$;
