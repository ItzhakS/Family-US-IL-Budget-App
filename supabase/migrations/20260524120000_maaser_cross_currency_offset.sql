-- Cross-currency ma'aser offset: paired legs with credit consumption flag.

alter table public.transactions
  add column if not exists is_maaser_cross_currency_credit boolean not null default false,
  add column if not exists maaser_offset_pair_id uuid,
  add column if not exists maaser_offset_fx_breakdown jsonb;

comment on column public.transactions.is_maaser_cross_currency_credit is 'Credit-consumption leg of a cross-currency ma''aser offset.';
comment on column public.transactions.maaser_offset_pair_id is 'UUID linking both legs of a cross-currency ma''aser offset.';
comment on column public.transactions.maaser_offset_fx_breakdown is 'FIFO FX bucket slices used (typically on debt leg).';
