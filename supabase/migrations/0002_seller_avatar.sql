-- Maxbono Sorvetes — foto de perfil dos sócios
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.

-- Foto em data URL (JPEG 256x256 gerado no aparelho, ~20 KB). Limite de segurança: ~200 KB.
alter table public.sellers add column if not exists avatar_url text;

alter table public.sellers drop constraint if exists sellers_avatar_size;
alter table public.sellers add constraint sellers_avatar_size
  check (avatar_url is null or length(avatar_url) <= 200000);

-- A chave do app só pode mudar a FOTO. Nome, cargo e PIN continuam só pelo SQL Editor.
revoke update on public.sellers from anon;
grant update (avatar_url) on public.sellers to anon;

drop policy if exists "sellers_update_avatar" on public.sellers;
create policy "sellers_update_avatar" on public.sellers for update to anon using (true) with check (true);
