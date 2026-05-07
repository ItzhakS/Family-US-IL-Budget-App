-- Phase 3: persist each authenticated user's dark-mode preference.

alter table public.profiles
  add column if not exists dark_mode boolean not null default false;

-- Allow users to update their own profile preference row. A trigger below keeps
-- identity/family fields immutable, so this policy cannot be used to hop families.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Update own profile preferences'
  ) then
    create policy "Update own profile preferences"
      on public.profiles
      for update
      to authenticated
      using ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end $$;

create or replace function public.prevent_profile_identity_changes()
returns trigger
language plpgsql
as $$
begin
  if current_role in ('anon', 'authenticated')
    and (
      new.id <> old.id
      or new.family_id <> old.family_id
      or new.email is distinct from old.email
    )
  then
    raise exception 'Profile identity fields cannot be changed by client updates';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_identity_changes on public.profiles;
create trigger trg_prevent_profile_identity_changes
  before update on public.profiles
  for each row
  execute procedure public.prevent_profile_identity_changes();
