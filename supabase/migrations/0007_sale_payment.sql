-- Maxbono Sorvetes — forma de pagamento e pendências das vendas
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.
--
-- payment_status: 'pago' (padrão, inclusive para as vendas antigas) ou 'pendente'
--                 (o cliente levou e paga na próxima passada da rota).
-- payment_method: 'dinheiro' | 'pix'; null enquanto a pendência não for paga.
-- paid_at:        quando a pendência foi quitada (null nas vendas pagas na hora).
alter table public.sales add column if not exists payment_status text not null default 'pago';
alter table public.sales add column if not exists payment_method text;
alter table public.sales add column if not exists paid_at        timestamptz;

alter table public.sales drop constraint if exists sales_payment_status_check;
alter table public.sales add constraint sales_payment_status_check check (payment_status in ('pago', 'pendente'));
alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check check (payment_method is null or payment_method in ('dinheiro', 'pix'));

-- Lista de pendências em aberto por rota.
create index if not exists sales_open_payment_idx on public.sales (route_id) where payment_status = 'pendente' and deleted_at is null;
