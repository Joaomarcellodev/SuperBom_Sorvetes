-- Superbom Sorvetes — esquema inicial
-- Cole no Supabase: SQL Editor > New query > Run.
-- Se você já tem tabelas com esses nomes, revise antes de rodar.

-- ---------------------------------------------------------------
-- Sócios (perfis que aparecem na tela de login)
-- ---------------------------------------------------------------
create table if not exists public.sellers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null default 'Sócio',
  pin_hash   text not null,          -- sha256 hex do PIN de 4 dígitos
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Rotas / regiões de entrega
-- ---------------------------------------------------------------
create table if not exists public.routes (
  id         uuid primary key,       -- gerado no aparelho (permite criar offline)
  name       text not null,
  cities     text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pontos / clientes de cada rota (alimenta o autocomplete do registro)
create table if not exists public.route_points (
  id         uuid primary key,
  route_id   uuid not null references public.routes(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists route_points_route_idx on public.route_points (route_id);

-- ---------------------------------------------------------------
-- Vendas (pacotes por produto em `items`, ex.: {"simples":12,"cobertura":6})
-- ---------------------------------------------------------------
create table if not exists public.sales (
  id          uuid primary key,      -- gerado no aparelho
  route_id    uuid not null references public.routes(id),
  point_name  text not null default '',
  seller_id   uuid not null references public.sellers(id),
  sale_date   date not null,
  note        text not null default '',
  items       jsonb not null default '{}'::jsonb,
  total       integer not null default 0 check (total >= 0),
  created_at  timestamptz not null default now(),   -- hora real da venda (vem do aparelho)
  updated_at  timestamptz not null default now(),   -- hora do servidor (trigger)
  deleted_at  timestamptz                           -- exclusão lógica
);
create index if not exists sales_updated_idx on public.sales (updated_at);
create index if not exists sales_date_idx    on public.sales (sale_date);

-- updated_at SEMPRE vem do servidor: relógio errado de celular não quebra a sincronização.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists routes_set_updated on public.routes;
create trigger routes_set_updated before insert or update on public.routes
  for each row execute function public.set_updated_at();

drop trigger if exists route_points_set_updated on public.route_points;
create trigger route_points_set_updated before insert or update on public.route_points
  for each row execute function public.set_updated_at();

drop trigger if exists sales_set_updated on public.sales;
create trigger sales_set_updated before insert or update on public.sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Segurança (RLS)
-- ATENÇÃO v1: o app usa a chave anon, então estas políticas liberam leitura/escrita
-- para quem tiver a URL + anon key do projeto. Serve para começar. O próximo passo
-- é trocar `anon` por `authenticated` e usar Supabase Auth (ver README).
-- Não existe política de DELETE: vendas são apagadas por exclusão lógica (deleted_at).
-- ---------------------------------------------------------------
alter table public.sellers      enable row level security;
alter table public.routes       enable row level security;
alter table public.route_points enable row level security;
alter table public.sales        enable row level security;

drop policy if exists "sellers_read"  on public.sellers;
create policy "sellers_read" on public.sellers for select to anon using (true);

drop policy if exists "routes_read"   on public.routes;
drop policy if exists "routes_write"  on public.routes;
drop policy if exists "routes_update" on public.routes;
create policy "routes_read"   on public.routes for select to anon using (true);
create policy "routes_write"  on public.routes for insert to anon with check (true);
create policy "routes_update" on public.routes for update to anon using (true) with check (true);

drop policy if exists "points_read"   on public.route_points;
drop policy if exists "points_write"  on public.route_points;
drop policy if exists "points_update" on public.route_points;
create policy "points_read"   on public.route_points for select to anon using (true);
create policy "points_write"  on public.route_points for insert to anon with check (true);
create policy "points_update" on public.route_points for update to anon using (true) with check (true);

drop policy if exists "sales_read"   on public.sales;
drop policy if exists "sales_write"  on public.sales;
drop policy if exists "sales_update" on public.sales;
create policy "sales_read"   on public.sales for select to anon using (true);
create policy "sales_write"  on public.sales for insert to anon with check (true);
create policy "sales_update" on public.sales for update to anon using (true) with check (true);

-- ---------------------------------------------------------------
-- Os dois sócios — TROQUE os nomes e os PINs antes de usar de verdade.
-- (só insere se a tabela estiver vazia)
-- ---------------------------------------------------------------
insert into public.sellers (name, role, pin_hash)
select v.name, v.role, encode(extensions.digest(v.pin, 'sha256'), 'hex')
from (values
  ('Sócio 1', 'Sócio administrador', '1111'),
  ('Sócio 2', 'Sócio',               '2222')
) as v(name, role, pin)
where not exists (select 1 from public.sellers);
