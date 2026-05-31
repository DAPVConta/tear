-- Robustez do módulo de Correções: insert atômico e server-authoritative.
--
-- Antes, o front fazia upload das imagens e, em seguida, um INSERT separado
-- com clinic_id/created_by vindos do cliente. Se o INSERT falhasse (rede/RLS),
-- o conteúdo digitado se perdia silenciosamente — exatamente o caso de um
-- registro que "sumiu" (sequência avançou, nenhuma linha gravada).
--
-- save_correction concentra a gravação em uma única transação no servidor,
-- valida o vínculo com a clínica e deriva created_by/created_by_name da sessão
-- autenticada (não confia em dados do cliente).
create or replace function public.save_correction(
  p_clinic_id bigint,
  p_description text,
  p_link text default null,
  p_images text[] default '{}'
)
returns public.corrections
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.corrections;
begin
  if not public.is_clinic_member(p_clinic_id) then
    raise exception 'Acesso negado à clínica.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_description, ''))) < 10 then
    raise exception 'Descreva a correção com pelo menos 10 caracteres.';
  end if;

  insert into public.corrections (
    clinic_id, link, description, images, created_by, created_by_name
  )
  values (
    p_clinic_id,
    nullif(btrim(coalesce(p_link, '')), ''),
    btrim(p_description),
    coalesce(p_images, '{}'),
    auth.uid(),
    coalesce(
      (select name from public.profiles where id = auth.uid()),
      (select email from auth.users where id = auth.uid())
    )
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.save_correction(bigint, text, text, text[])
  from public, anon;
grant execute on function public.save_correction(bigint, text, text, text[])
  to authenticated;
