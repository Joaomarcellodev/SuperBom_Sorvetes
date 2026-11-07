-- Maxbono Sorvetes — excluir rotas sem perder o histórico
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.
--
-- As vendas apontam para a rota (chave estrangeira), então a rota não é apagada de verdade:
-- deleted_at preenchido = some das listas do app, mas as vendas antigas continuam com o nome dela.
-- Restaurar = deleted_at volta a null.
alter table public.routes add column if not exists deleted_at timestamptz;
