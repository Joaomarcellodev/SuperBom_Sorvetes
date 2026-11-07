-- Maxbono Sorvetes — cada sócio pode editar o próprio cargo (ex.: "Sócio administrador")
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.
-- Precisa da 0002 antes. Nome e PIN continuam só pelo SQL Editor.

alter table public.sellers drop constraint if exists sellers_role_length;
alter table public.sellers add constraint sellers_role_length check (char_length(role) between 1 and 40);

grant update (avatar_url, role) on public.sellers to anon;
