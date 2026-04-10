-- P1.11: Nullable FX snapshot on transactions (rate basis USD→ILS + calendar date of that rate).

alter table public.transactions
  add column if not exists exchange_rate_usd_to_ils numeric,
  add column if not exists fx_rate_date date;

comment on column public.transactions.exchange_rate_usd_to_ils is 'Snapshot: 1 USD = X ILS when row was created or when amount/currency last changed.';
comment on column public.transactions.fx_rate_date is 'Calendar date (YYYY-MM-DD) for the FX snapshot source.';
