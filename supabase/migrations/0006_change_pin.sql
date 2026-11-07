-- Maxbono Sorvetes — trocar o PIN pelo app
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar mais de uma vez.
--
-- O app NÃO ganha permissão para gravar pin_hash. Em vez disso, chama esta função, que só troca
-- o PIN se o PIN atual estiver certo (conferido aqui no servidor). Retorna false se o atual estiver errado.
create or replace function public.change_seller_pin(p_seller_id uuid, p_current_pin text, p_new_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'O novo PIN precisa ter 4 dígitos.';
  end if;
  if p_new_pin = p_current_pin then
    raise exception 'O novo PIN precisa ser diferente do atual.';
  end if;

  update public.sellers
     set pin_hash = encode(extensions.digest(p_new_pin, 'sha256'), 'hex')
   where id = p_seller_id
     and pin_hash = encode(extensions.digest(p_current_pin, 'sha256'), 'hex');

  return found;
end $$;

revoke all on function public.change_seller_pin(uuid, text, text) from public;
grant execute on function public.change_seller_pin(uuid, text, text) to anon;
