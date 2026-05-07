-- Recurring templates: source of truth for recurring bills/income.
-- Generated transactions are linked back via transactions.recurring_template_id and are decoupled once created.
-- All migrations are additive: no column drops, no breaking changes.

create table if not exists public.recurring_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,

  description text not null,
  amount numeric not null,
  category text not null,
  type text not null default 'EXPENSE' check (type in ('INCOME', 'EXPENSE')),
  currency text not null check (currency in ('ILS', 'USD')),
  day_of_month integer not null default 1 check (day_of_month between 1 and 28),

  -- Expense classification flags (mirror transactions for parity)
  is_maaser_deductible boolean not null default false,
  is_maaser_payment boolean not null default false,
  is_tax_deductible boolean not null default false,
  is_investment boolean not null default false,
  is_tax_savings boolean not null default false,

  -- Schedule
  start_month text not null,           -- YYYY-MM: hard floor; never generate earlier than this
  remaining_payments integer,          -- null = unlimited; 0 = exhausted
  last_generated_month text,           -- YYYY-MM: most recent month a transaction was generated for

  -- Lifecycle
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists recurring_templates_family_id_idx
  on public.recurring_templates (family_id);

create index if not exists recurring_templates_active_idx
  on public.recurring_templates (family_id, cancelled_at)
  where cancelled_at is null;

comment on table public.recurring_templates is
  'Source of truth for recurring bills/income. Auto-generates transactions from start_month through current calendar month.';
comment on column public.recurring_templates.start_month is
  'YYYY-MM hard floor for retroactive generation. Generation never produces rows earlier than this month.';
comment on column public.recurring_templates.last_generated_month is
  'Tracks the most recent YYYY-MM that was generated. Generation only fills (last_generated_month, current_month].';

-- Standard family-scoped RLS (mirrors public.transactions / public.categories)
alter table public.recurring_templates enable row level security;

create policy "recurring_templates_select_own_family" on public.recurring_templates
  for select using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "recurring_templates_insert_own_family" on public.recurring_templates
  for insert with check (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "recurring_templates_update_own_family" on public.recurring_templates
  for update using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  )
  with check (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "recurring_templates_delete_own_family" on public.recurring_templates
  for delete using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

-- Link transactions back to the template that produced them.
-- Nullable: pre-existing transactions and ad-hoc (non-template) transactions stay null.
-- ON DELETE SET NULL keeps history intact if the user deletes a template later.
alter table public.transactions
  add column if not exists recurring_template_id uuid references public.recurring_templates(id) on delete set null;

create index if not exists transactions_recurring_template_id_idx
  on public.transactions (recurring_template_id)
  where recurring_template_id is not null;

comment on column public.transactions.recurring_template_id is
  'When set, this row was generated from a recurring template. Editing/deleting the row does not affect the template.';
