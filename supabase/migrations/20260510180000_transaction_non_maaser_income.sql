-- Income excluded from Ma'aser obligation (e.g. loan receipt); default false so income is Ma'aser-able unless opted out.

alter table public.transactions
  add column if not exists is_non_maaser_income boolean not null default false;

comment on column public.transactions.is_non_maaser_income is
  'When true, this INCOME row does not count toward Maaser obligation (loan, reimbursement, etc.).';
