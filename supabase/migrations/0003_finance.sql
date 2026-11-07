-- Maxbono Sorvetes — financeiro (preços, valor das vendas e gastos)
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.

-- ---------------------------------------------------------------
-- Preço padrão de cada produto (em centavos). Vem preenchido na venda e pode ser ajustado nela.
-- ---------------------------------------------------------------
create table if not exists public.product_prices (
  product_id  text primary key,          -- "simples" | "cobertura" | "cremosinho"
  price_cents integer not null default 0 check (price_cents >= 0),
  updated_at  timestamptz not null default now()
);
insert into public.product_prices (product_id, price_cents) values
  ('simples', 0), ('cobertura', 0), ('cremosinho', 0)
on conflict (product_id) do nothing;

drop trigger if exists product_prices_set_updated on public.product_prices;
create trigger product_prices_set_updated before insert or update on public.product_prices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Valor de cada venda: preço por pacote usado NAQUELA venda + total em centavos.
-- Vendas antigas ficam com unit_prices = {} e o app usa o preço padrão atual.
-- ---------------------------------------------------------------
alter table public.sales add column if not exists unit_prices  jsonb   not null default '{}'::jsonb;
alter table public.sales add column if not exists amount_cents integer not null default 0;
alter table public.sales drop constraint if exists sales_amount_positive;
alter table public.sales add constraint sales_amount_positive check (amount_cents >= 0);

-- ---------------------------------------------------------------
-- Gastos (combustível, reposição, manutenção...)
-- ---------------------------------------------------------------
create table if not exists public.expenses (
  id           uuid primary key,          -- gerado no aparelho (permite registrar offline)
  description  text not null,
  category     text not null default 'outros',
  amount_cents integer not null check (amount_cents > 0),
  expense_date date not null,
  seller_id    uuid not null references public.sellers(id),
  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz                -- exclusão lógica, como nas vendas
);
create index if not exists expenses_updated_idx on public.expenses (updated_at);
create index if not exists expenses_date_idx    on public.expenses (expense_date);

drop trigger if exists expenses_set_updated on public.expenses;
create trigger expenses_set_updated before insert or update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- RLS (mesmo modelo da v1: chave do app lê e grava, sem DELETE)
-- ---------------------------------------------------------------
alter table public.product_prices enable row level security;
alter table public.expenses       enable row level security;

drop policy if exists "prices_read"   on public.product_prices;
drop policy if exists "prices_write"  on public.product_prices;
drop policy if exists "prices_update" on public.product_prices;
create policy "prices_read"   on public.product_prices for select to anon using (true);
create policy "prices_write"  on public.product_prices for insert to anon with check (true);
create policy "prices_update" on public.product_prices for update to anon using (true) with check (true);

drop policy if exists "expenses_read"   on public.expenses;
drop policy if exists "expenses_write"  on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
create policy "expenses_read"   on public.expenses for select to anon using (true);
create policy "expenses_write"  on public.expenses for insert to anon with check (true);
create policy "expenses_update" on public.expenses for update to anon using (true) with check (true);
