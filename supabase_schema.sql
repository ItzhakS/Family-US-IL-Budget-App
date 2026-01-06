-- 1. Create a table to link users to family groups
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  family_id uuid default gen_random_uuid()
);

-- 2. Create the invite system table
create table family_invites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  family_id uuid not null,
  email text not null,
  invited_by text
);

-- 3. Create the transactions table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text not null,
  description text not null,
  amount numeric not null,
  category text not null,
  type text not null,
  currency text not null,
  is_recurring boolean default false,
  is_maaser_deductible boolean default false,
  is_maaser_payment boolean default false,
  is_tax_deductible boolean default false,
  is_investment boolean default false,
  family_id uuid not null -- This links data to the family, not just the user
);

-- 4. TRIGGER: When a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  existing_invite_family_id uuid;
begin
  -- Check if this email was invited to a family
  select family_id into existing_invite_family_id 
  from public.family_invites 
  where email = new.email 
  limit 1;

  insert into public.profiles (id, email, family_id)
  values (
    new.id, 
    new.email, 
    -- If they were invited, use that family ID, otherwise generate new one
    coalesce(existing_invite_family_id, gen_random_uuid())
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. TRIGGER: Automatically assign family_id to transactions
create or replace function public.set_transaction_family()
returns trigger as $$
begin
  select family_id into new.family_id
  from public.profiles
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_transaction_insert
  before insert on public.transactions
  for each row execute procedure public.set_transaction_family();

-- 6. SECURITY: Enable RLS (Row Level Security)
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table family_invites enable row level security;

-- Policy: Users can only see their own profile
create policy "View own profile" on profiles for select using (auth.uid() = id);

-- Policy: Users can see transactions belonging to their family
create policy "View family transactions" on transactions for select 
using (family_id in (select family_id from profiles where id = auth.uid()));

-- Policy: Users can insert transactions (trigger handles family_id)
create policy "Insert transactions" on transactions for insert with check (true);

-- Policy: Users can delete transactions belonging to their family
create policy "Delete family transactions" on transactions for delete 
using (family_id in (select family_id from profiles where id = auth.uid()));

-- Policy: Users can insert invites
create policy "Create invites" on family_invites for insert with check (true);