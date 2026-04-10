-- Recurring: optional cancellation timestamp and finite payment cap (null = unlimited)
alter table public.transactions
  add column if not exists recurring_cancelled_at timestamptz,
  add column if not exists recurring_remaining_payments integer;

comment on column public.transactions.recurring_cancelled_at is
  'When set, this recurring row is cancelled and hidden from active recurring views.';
comment on column public.transactions.recurring_remaining_payments is
  'Finite subscription payments left; null means unlimited. At 0 the row is inactive for recurring display.';
